import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import Globe, { type GlobeMethods } from 'react-globe.gl';

import countriesGeo from '../EntityGlobe/countries.geo.json';
import type { LinkedEntry, PoiIconKind } from './types';

interface CountryFeature {
  properties: { ADMIN?: string; NAME?: string };
  geometry: unknown;
}
const ALL_COUNTRIES = (countriesGeo as { features: CountryFeature[] }).features;

const HEX_LAND_DOT = '#94a3b8'; // slate-400 — normal land dots

interface OrbitControlsLike {
  autoRotate: boolean;
  autoRotateSpeed: number;
  enableZoom: boolean;
  minPolarAngle: number;
  maxPolarAngle: number;
  enableDamping: boolean;
  dampingFactor: number;
}

interface RingDatum {
  lat: number;
  lng: number;
  /** 'pulse' = tight node pulse (EntityGlobe style); 'spread' = big wave
   *  that radiates out to cover the country. */
  kind: 'pulse' | 'spread';
}
interface PointDatum {
  lat: number;
  lng: number;
  color: string;
  label: string;
}
interface ArcDatum {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
}

// Static points-of-interest pinned to a country. When that country is the
// active (focused) entry, each one floats in as a teardrop map-pin whose
// window holds an icon image (served from public/icons/).
export type PoiKind = PoiIconKind;

interface PoiMarker {
  lat: number;
  lng: number;
  kind: PoiKind;
  /** which entry country this marker belongs to */
  country: string;
}

// Spread across the continent (not tied to specific cities) so both pins
// read clearly without overlapping.
const POI_MARKERS: PoiMarker[] = [
  { lat: -25.5, lng: 122.0, kind: 'soldier', country: 'Australia' },
  { lat: -22.5, lng: 145.5, kind: 'rifle', country: 'Australia' },
  // mainland China — spread inland so the two read clearly
  { lat: 34.27, lng: 108.94, kind: 'soldier', country: 'China' },
  { lat: 30.59, lng: 114.31, kind: 'sanction', country: 'China' },
  // Brazil
  { lat: -15.78, lng: -47.93, kind: 'civil-rights', country: 'Brazil' },
];

// Classic teardrop map-pin: a solid dark drop whose circular window holds
// the icon. The pointed tip sits on the coordinate. The drop itself is
// inline SVG (crisp at any zoom); the window content is a PNG.
const PIN_PATH =
  'M12 1.5C7.86 1.5 4.5 4.86 4.5 9c0 5.06 6.06 12.06 7.06 13.2a.6.6 0 0 0 .88 0C13.44 21.06 19.5 14.06 19.5 9c0-4.14-3.36-7.5-7.5-7.5z';

// Icon images live in public/icons/ (served at /icons/...).
const ICON_SRC: Record<PoiKind, string> = {
  soldier: '/icons/soldier.png',
  rifle: '/icons/rifle.png',
  sanction: '/icons/sanction.png',
  'civil-rights': '/icons/civil-rights.png',
};

function makePoiElement(d: PoiMarker): HTMLElement {
  // IMPORTANT: react-globe.gl writes the screen-projection transform onto
  // THIS returned element every frame. It must stay transform-free, or the
  // pin never gets positioned (it piles up at the top-left corner). All
  // visual offset + the pop-in animation live on `.cg-poi-inner`.
  const el = document.createElement('div');
  el.className = 'cg-poi';
  el.style.pointerEvents = 'none';

  const inner = document.createElement('div');
  inner.className = 'cg-poi-inner';

  const pin = document.createElement('div');
  pin.className = 'cg-poi-pin';
  pin.innerHTML =
    `<svg class="cg-poi-svg" viewBox="0 0 24 24" aria-hidden="true">` +
    `<path d="${PIN_PATH}" fill="#0f172a"/>` +
    `<circle cx="12" cy="9" r="5.6" fill="#ffffff"/>` +
    `</svg>`;

  const img = document.createElement('img');
  img.className = 'cg-poi-icon';
  img.src = ICON_SRC[d.kind];
  img.alt = d.kind;
  img.draggable = false;
  // Missing/failed image → empty white window, never a broken-image glyph.
  img.onerror = () => img.remove();
  pin.appendChild(img);

  inner.append(pin);
  el.append(inner);
  return el;
}

// STABLE reference: three-globe wipes & recreates ALL html elements whenever
// the `htmlElement` accessor identity changes. An inline arrow would do that
// on every re-render, replaying every pin's emerge animation (e.g. the rifle
// surfacing would re-pop the soldier). Keep it module-level.
const poiHtmlElement = (d: object) => makePoiElement(d as PoiMarker);

// Cross-country link camera choreography (ms): open on the entity, hold a
// beat, then sweep to the searched country. The dwell timer only starts
// once the camera has settled on that country.
const LINK_HOLD_MS = 1200;
const LINK_SWEEP_MS = 2600;
/** Time from a linked entry becoming active until the camera rests on the
 *  searched country. Exported so hosts can delay reveals until then. */
export const LINK_SETTLE_MS = LINK_HOLD_MS + LINK_SWEEP_MS;

export interface EntityCountryGlobeProps {
  entries: LinkedEntry[];
  height?: number;
  /** Focus each entry in turn, every N ms. */
  cycleMs?: number;
  className?: string;
  style?: CSSProperties;
  /** Fires whenever the focused entry changes (incl. the first). */
  onActiveChange?: (entry: LinkedEntry, index: number) => void;
  /** Freeze the auto-cycle on the current entry. */
  paused?: boolean;
  /**
   * Restrict which POI pins are shown to these icon kinds (still gated by
   * the active country). Lets a host reveal pins in sync with a keyword
   * cycle. Omit for the default behaviour (all of the country's pins).
   */
  visibleKeywordIcons?: PoiKind[];
}

const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
};

const countryName = (f: CountryFeature) =>
  (f.properties.ADMIN ?? f.properties.NAME ?? '').toLowerCase();

// Territories the GeoJSON lists as separate features but that should be
// highlighted together with their claimed sovereign.
const COUNTRY_INCLUDES: Record<string, string[]> = {
  china: ['china', 'taiwan'],
};

// Does feature `f` belong to the active country (incl. claimed territory)?
const matchesActive = (f: CountryFeature, active: string) => {
  const names = COUNTRY_INCLUDES[active] ?? [active];
  return names.includes(countryName(f));
};

export function EntityCountryGlobe({
  entries,
  height = 600,
  cycleMs = 5000,
  className,
  style,
  onActiveChange,
  visibleKeywordIcons,
  paused = false,
}: EntityCountryGlobeProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const activeIdx = Math.min(activeIndex, entries.length - 1);
  const active = entries[activeIdx];

  // Advance the focused entry (unless frozen). A linked entry holds for the
  // camera sweep PLUS a full `cycleMs` dwell once it has settled on the
  // searched country; a normal entry just holds for `cycleMs`.
  useEffect(() => {
    if (paused || entries.length < 2) return;
    const dwell = (active.link ? LINK_SETTLE_MS : 0) + cycleMs;
    const t = setTimeout(
      () => setActiveIndex((i) => (i + 1) % entries.length),
      dwell,
    );
    return () => clearTimeout(t);
  }, [entries.length, cycleMs, paused, active]);

  // notify the host (e.g. for an entity brief card that tracks the cycle)
  useEffect(() => {
    onActiveChange?.(active, activeIdx);
  }, [onActiveChange, active, activeIdx]);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver((entries2) => {
      for (const e of entries2) setWidth(Math.floor(e.contentRect.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const polygons = useMemo(() => ALL_COUNTRIES, []);

  // only the ACTIVE entry's country is tinted; the other two stay neutral
  const activeCountry = active.country.toLowerCase();

  // the active node, plus the linked country endpoint when the entity is
  // being searched against a country it doesn't sit in
  const points = useMemo<PointDatum[]>(() => {
    const pts: PointDatum[] = [
      {
        lat: active.origin.lat,
        lng: active.origin.lng,
        color: active.color,
        label: active.origin.name,
      },
    ];
    if (active.link) {
      pts.push({
        lat: active.link.lat,
        lng: active.link.lng,
        color: active.color,
        label: active.link.label ?? active.country,
      });
    }
    return pts;
  }, [active]);

  // connection arc: origin → the point inside the highlighted country
  const arcs = useMemo<ArcDatum[]>(
    () =>
      active.link
        ? [
            {
              startLat: active.origin.lat,
              startLng: active.origin.lng,
              endLat: active.link.lat,
              endLng: active.link.lng,
              color: active.color,
            },
          ]
        : [],
    [active],
  );

  // POI markers only surface while their country is the focused entry,
  // and (when a host drives a keyword cycle) only the revealed kinds.
  const markers = useMemo<PoiMarker[]>(
    () =>
      POI_MARKERS.filter(
        (m) =>
          m.country.toLowerCase() === activeCountry &&
          (visibleKeywordIcons === undefined ||
            visibleKeywordIcons.includes(m.kind)),
      ),
    [activeCountry, visibleKeywordIcons],
  );

  // Two rings per active node: the tight node pulse + a big wave that
  // radiates out across the whole country.
  const rings = useMemo<RingDatum[]>(() => {
    const r: RingDatum[] = [
      { lat: active.origin.lat, lng: active.origin.lng, kind: 'spread' },
      { lat: active.origin.lat, lng: active.origin.lng, kind: 'pulse' },
    ];
    if (active.link) {
      // pulse the country endpoint so the connection reads at both ends
      r.push({ lat: active.link.lat, lng: active.link.lng, kind: 'pulse' });
    }
    return r;
  }, [active]);

  // one-shot controls setup
  useEffect(() => {
    if (!isReady) return;
    const globe = globeRef.current;
    if (!globe) return;
    const controls = globe.controls() as unknown as OrbitControlsLike;
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = false;
    controls.minPolarAngle = Math.PI / 4;
    controls.maxPolarAngle = Math.PI - Math.PI / 4;
  }, [isReady]);

  // Fly the camera so the active entry is well framed. For a cross-country
  // link: start ON the entity (Canada), hold a beat, then sweep across the
  // globe and SETTLE on the searched country (mainland China). Otherwise
  // just sit on the node.
  useEffect(() => {
    if (!isReady) return;
    const globe = globeRef.current;
    if (!globe) return;

    const link = active.link;
    if (link) {
      // 1. open on the entity's location (Canada)
      globe.pointOfView(
        { lat: active.origin.lat - 2, lng: active.origin.lng, altitude: 1.9 },
        900,
      );
      // 2. after a beat, sweep across and come to rest on mainland China
      const t = setTimeout(() => {
        globe.pointOfView(
          { lat: link.lat, lng: link.lng, altitude: 1.7 },
          LINK_SWEEP_MS,
        );
      }, LINK_HOLD_MS);
      return () => clearTimeout(t);
    }

    // Center straight on the node's latitude — the old southward offset
    // made far-south countries (Australia) read as a tilted bottom-up view.
    globe.pointOfView(
      { lat: active.origin.lat, lng: active.origin.lng, altitude: 1.7 },
      1500,
    );
  }, [isReady, active]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: '100%',
        height,
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      <style>{`
        /* root: react-globe.gl owns its transform — set nothing here */
        .cg-poi { pointer-events: none; }
        .cg-poi-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          /* lift so the pin tip lands on the coordinate, not its center */
          transform: translateY(-50%);
          animation: cgPoiIn 520ms cubic-bezier(0.16, 1, 0.3, 1) both;
          will-change: transform, opacity;
        }
        @keyframes cgPoiIn {
          from { opacity: 0; transform: translateY(-34%) scale(0.55); }
          to   { opacity: 1; transform: translateY(-50%) scale(1); }
        }
        .cg-poi-pin {
          position: relative;
          width: 62px;
          height: 62px;
          filter: drop-shadow(0 6px 8px rgba(15, 23, 42, 0.45));
        }
        .cg-poi-svg {
          width: 100%;
          height: 100%;
          display: block;
        }
        /* sits in the pin's circular window: cx=12 cy=9 of a 24x24 box */
        .cg-poi-icon {
          position: absolute;
          left: 50%;
          top: 37.5%;
          transform: translate(-50%, -50%);
          width: 44%;
          height: 44%;
          object-fit: contain;
          display: block;
        }
      `}</style>

      {width > 0 && (
        <Globe
          ref={globeRef as React.MutableRefObject<GlobeMethods | undefined>}
          width={width}
          height={height}
          backgroundColor="rgba(0,0,0,0)"
          showGlobe={false}
          showAtmosphere={false}
          onGlobeReady={() => setIsReady(true)}
          // ---- dotted landmasses; linked countries tinted per theme ----
          hexPolygonsData={polygons}
          hexPolygonResolution={3}
          hexPolygonMargin={0.32}
          hexPolygonUseDots
          hexPolygonColor={(f: object) =>
            matchesActive(f as CountryFeature, activeCountry)
              ? active.color
              : HEX_LAND_DOT
          }
          hexPolygonAltitude={(f: object) =>
            matchesActive(f as CountryFeature, activeCountry) ? 0.008 : 0.002
          }
          // ---- origin nodes (flat themed dots) ----
          pointsData={points}
          pointLat="lat"
          pointLng="lng"
          // sit above the highlighted country dots (hex alt = 0.008)
          pointColor={() => '#0f172a'}
          pointAltitude={0.016}
          pointRadius={1.1}
          pointLabel="label"
          pointsMerge={false}
          // ---- rings: tight node pulse + big country-wide wave ----
          ringsData={rings}
          ringLat="lat"
          ringLng="lng"
          ringAltitude={(d: object) =>
            (d as RingDatum).kind === 'spread' ? 0.01 : 0.016
          }
          ringColor={(d: object) => {
            const spread = (d as RingDatum).kind === 'spread';
            return (t: number) =>
              `rgba(15, 23, 42, ${Math.max(0, 1 - t) * (spread ? 0.45 : 1)})`;
          }}
          ringMaxRadius={(d: object) =>
            (d as RingDatum).kind === 'spread' ? 36 : 5
          }
          ringPropagationSpeed={(d: object) =>
            (d as RingDatum).kind === 'spread' ? 11 : 3
          }
          ringRepeatPeriod={(d: object) =>
            (d as RingDatum).kind === 'spread' ? 1600 : 900
          }
          // ---- connection arc: entity → searched country ----
          arcsData={arcs}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor={(d: object) => {
            const c = (d as ArcDatum).color;
            // fade the tails so the arc reads as a directional beam
            return [`${c}00`, c, `${c}00`];
          }}
          arcAltitudeAutoScale={0.5}
          arcStroke={0.6}
          arcDashLength={0.55}
          arcDashGap={0.25}
          arcDashAnimateTime={2200}
          // ---- POI map markers (icon badges) for the active country ----
          htmlElementsData={markers}
          htmlLat="lat"
          htmlLng="lng"
          htmlAltitude={0.02}
          htmlTransitionDuration={400}
          htmlElement={poiHtmlElement}
        />
      )}
    </div>
  );
}
