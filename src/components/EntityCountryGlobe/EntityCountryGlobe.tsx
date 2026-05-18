import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import Globe, { type GlobeMethods } from 'react-globe.gl';

import countriesGeo from '../EntityGlobe/countries.geo.json';
import type { LinkedEntry } from './types';

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

export interface EntityCountryGlobeProps {
  entries: LinkedEntry[];
  height?: number;
  /** Focus each entry in turn, every N ms. */
  cycleMs?: number;
  className?: string;
  style?: CSSProperties;
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

export function EntityCountryGlobe({
  entries,
  height = 600,
  cycleMs = 5000,
  className,
  style,
}: EntityCountryGlobeProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // cycle the focused entry every `cycleMs`
  useEffect(() => {
    if (entries.length < 2) return;
    const t = setInterval(
      () => setActiveIndex((i) => (i + 1) % entries.length),
      cycleMs,
    );
    return () => clearInterval(t);
  }, [entries.length, cycleMs]);

  const active = entries[Math.min(activeIndex, entries.length - 1)];

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

  // only the active node + ripple are shown
  const points = useMemo<PointDatum[]>(
    () => [
      {
        lat: active.origin.lat,
        lng: active.origin.lng,
        color: active.color,
        label: active.origin.name,
      },
    ],
    [active],
  );

  // Two rings per active node: the tight node pulse + a big wave that
  // radiates out across the whole country.
  const rings = useMemo<RingDatum[]>(
    () => [
      { lat: active.origin.lat, lng: active.origin.lng, kind: 'spread' },
      { lat: active.origin.lat, lng: active.origin.lng, kind: 'pulse' },
    ],
    [active],
  );

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

  // fly the camera to the active country whenever it changes
  useEffect(() => {
    if (!isReady) return;
    const globe = globeRef.current;
    if (!globe) return;
    globe.pointOfView(
      { lat: active.origin.lat - 4, lng: active.origin.lng, altitude: 1.7 },
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
            countryName(f as CountryFeature) === activeCountry
              ? active.color
              : HEX_LAND_DOT
          }
          hexPolygonAltitude={(f: object) =>
            countryName(f as CountryFeature) === activeCountry ? 0.008 : 0.002
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
        />
      )}
    </div>
  );
}
