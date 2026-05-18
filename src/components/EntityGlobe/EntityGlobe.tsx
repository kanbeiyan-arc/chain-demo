// Vite-adapted copy of the delivered EntityGlobe.
// Differences vs the Next.js original (kept minimal & documented):
//   - removed `'use client'`        (Next.js App Router only)
//   - removed `next/dynamic` SSR    (Vite SPA has no SSR; window always exists)
//   - Globe is imported directly    (react-globe.gl default export)
// Everything else is byte-for-byte the same behavior.

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import Globe, { type GlobeMethods } from 'react-globe.gl';
import * as THREE from 'three';

import countriesGeo from './countries.geo.json';
import { RELATION_COLOR } from './relation-config';

// Stylized "virtual globe" look: dotted landmasses + a soft light sphere.
const HEX_LAND_DOT = '#94a3b8'; // slate-400 — land dots on the pale sphere
const GLOBE_SURFACE = '#eef2f7'; // very light slate — occludes back-side dots
const COUNTRY_FEATURES = (countriesGeo as { features: object[] }).features;
import type { Entity, EntityRelation } from './types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface EntityGlobeProps {
  entities: Entity[];
  relations: EntityRelation[];
  /** Equirectangular Earth texture URL. Default = night view (city lights). */
  globeImageUrl?: string;
  /** Bump map for terrain relief. */
  bumpImageUrl?: string;
  /** Atmosphere glow color. Use your brand accent. */
  atmosphereColor?: string;
  /** Auto-rotate the globe. Set false for in-app (non-hero) usage. */
  autoRotate?: boolean;
  /** Auto-rotate speed; degrees per frame at 60fps. */
  rotateSpeed?: number;
  /** ID of a relation to render bold; others fade. */
  highlightedRelationId?: string;
  /** Initial camera position. */
  initialPOV?: { lat: number; lng: number; altitude: number };
  /** Fixed height in px. Width is responsive to the container. */
  height?: number;
  className?: string;
  style?: CSSProperties;
  onPointClick?: (entity: Entity) => void;
  onArcClick?: (relation: EntityRelation) => void;
}

// ---------------------------------------------------------------------------
// Internal shape passed to react-globe.gl
// ---------------------------------------------------------------------------

interface GlobePoint {
  lat: number;
  lng: number;
  size: number;
  color: string;
  label: string;
  entity: Entity;
}

interface GlobeArc {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
  stroke: number;
  label: string;
  relation: EntityRelation;
}

interface OrbitControlsLike {
  autoRotate: boolean;
  autoRotateSpeed: number;
  enableZoom: boolean;
  minPolarAngle: number;
  maxPolarAngle: number;
  enableDamping: boolean;
  dampingFactor: number;
}

// Tuned for a BRIGHT (blue-marble) globe on a light page background.
// The original night-globe values (#93C5FD / #FFFFFF) wash out here.
const POINT_BASE_COLOR = '#0f172a'; // slate-900 — high contrast over land & ocean
const POINT_HIGHLIGHT_COLOR = '#2563eb'; // brand blue — endpoints of the active arc pop

// ---------------------------------------------------------------------------
// Tooltip builders — inline HTML strings (react-globe.gl expects strings here)
// ---------------------------------------------------------------------------

const TOOLTIP_BASE_STYLE = [
  'font-family: ui-monospace, SFMono-Regular, Menlo, monospace',
  'font-size: 12px',
  'color: #f8fafc',
  'background: rgba(2, 6, 23, 0.92)',
  'border: 1px solid rgba(148, 163, 184, 0.25)',
  'border-radius: 6px',
  'padding: 8px 10px',
  'backdrop-filter: blur(6px)',
  'pointer-events: none',
].join(';');

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildEntityTooltip(entity: Entity): string {
  const showNative =
    !!entity.localName && entity.localName !== entity.name;
  const native = showNative
    ? `<div style="font-size: 14px; font-weight: 600; margin-bottom: 2px;">${escapeHtml(
        entity.localName!,
      )}</div>`
    : '';
  return `
    <div style="${TOOLTIP_BASE_STYLE}; min-width: 180px;">
      ${native}
      <div style="font-size: 12px; color: #cbd5e1;">${escapeHtml(entity.name)}</div>
      <div style="font-size: 10px; color: #64748b; margin-top: 4px; letter-spacing: 0.06em; text-transform: uppercase;">
        ${escapeHtml(entity.country)}
      </div>
    </div>
  `;
}

function buildRelationTooltip(r: EntityRelation): string {
  const detail = r.detail
    ? ` · ${escapeHtml(r.detail)}`
    : '';
  return `
    <div style="${TOOLTIP_BASE_STYLE}">
      <div style="font-size: 11px; color: #cbd5e1;">
        ${escapeHtml(r.source.name)} → ${escapeHtml(r.target.name)}
      </div>
      <div style="font-size: 10px; color: #94a3b8; margin-top: 2px; letter-spacing: 0.06em; text-transform: uppercase;">
        ${escapeHtml(r.type)}${detail}
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EntityGlobe({
  entities,
  relations,
  globeImageUrl = '//unpkg.com/three-globe/example/img/earth-night.jpg',
  bumpImageUrl = '//unpkg.com/three-globe/example/img/earth-topology.png',
  atmosphereColor = '#3B82F6',
  autoRotate = true,
  rotateSpeed = 0.35,
  highlightedRelationId,
  initialPOV = { lat: 30, lng: 10, altitude: 2.4 },
  height = 600,
  className,
  style,
  onPointClick,
  onArcClick,
}: EntityGlobeProps) {
  // ref to the underlying Globe instance (exposes pointOfView, controls, etc.)
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Stash initial POV in a ref so prop-identity changes don't snap the camera.
  const initialPOVRef = useRef(initialPOV);

  // Track container width so the canvas resizes responsively.
  const [width, setWidth] = useState<number>(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(Math.floor(entry.contentRect.width));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // One-shot setup after the globe scene is ready.
  useEffect(() => {
    if (!isReady) return;
    const globe = globeRef.current;
    if (!globe) return;

    globe.pointOfView(initialPOVRef.current, 0);

    const controls = globe.controls() as unknown as OrbitControlsLike;
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minPolarAngle = Math.PI / 3.5;
    controls.maxPolarAngle = Math.PI - Math.PI / 3.5;
  }, [isReady]);

  // Responsive to autoRotate / rotateSpeed prop changes.
  // While a relation is focused we stop spinning so the two linked
  // entities stay framed; the camera fly-to (below) drives the motion.
  useEffect(() => {
    if (!isReady) return;
    const globe = globeRef.current;
    if (!globe) return;
    const controls = globe.controls() as unknown as OrbitControlsLike;
    controls.autoRotate = autoRotate && !highlightedRelationId;
    controls.autoRotateSpeed = rotateSpeed;
  }, [isReady, autoRotate, rotateSpeed, highlightedRelationId]);

  // Fly the camera to the great-circle midpoint of the highlighted
  // relation so both linked entities come into view when an arc appears.
  useEffect(() => {
    if (!isReady || !highlightedRelationId) return;
    const globe = globeRef.current;
    if (!globe) return;
    const r = relations.find((rel) => rel.id === highlightedRelationId);
    if (!r) return;

    const toRad = (d: number) => (d * Math.PI) / 180;
    const toDeg = (r2: number) => (r2 * 180) / Math.PI;
    const lat1 = toRad(r.source.lat);
    const lon1 = toRad(r.source.lng);
    const lat2 = toRad(r.target.lat);
    const lon2 = toRad(r.target.lng);
    const dLon = lon2 - lon1;
    const Bx = Math.cos(lat2) * Math.cos(dLon);
    const By = Math.cos(lat2) * Math.sin(dLon);
    const midLat = Math.atan2(
      Math.sin(lat1) + Math.sin(lat2),
      Math.sqrt((Math.cos(lat1) + Bx) ** 2 + By ** 2),
    );
    const midLon = lon1 + Math.atan2(By, Math.cos(lat1) + Bx);

    globe.pointOfView(
      { lat: toDeg(midLat), lng: toDeg(midLon), altitude: 2.0 },
      1600,
    );
  }, [isReady, highlightedRelationId, relations]);

  // ---------------------------------------------------------------------
  // Map domain data -> react-globe.gl primitives
  // ---------------------------------------------------------------------

  const points = useMemo<GlobePoint[]>(() => {
    const highlightedEntityIds = new Set<string>();
    if (highlightedRelationId) {
      const r = relations.find((rel) => rel.id === highlightedRelationId);
      if (r) {
        highlightedEntityIds.add(r.source.id);
        highlightedEntityIds.add(r.target.id);
      }
    }
    return entities.map((entity) => {
      const isHighlighted = highlightedEntityIds.has(entity.id);
      return {
        lat: entity.lat,
        lng: entity.lng,
        size: isHighlighted ? 1.1 : 0.7,
        color: isHighlighted ? POINT_HIGHLIGHT_COLOR : POINT_BASE_COLOR,
        label: buildEntityTooltip(entity),
        entity,
      };
    });
  }, [entities, relations, highlightedRelationId]);

  const arcs = useMemo<GlobeArc[]>(
    () =>
      relations.map((relation) => {
        const isHighlighted = relation.id === highlightedRelationId;
        const isDimmed =
          !!highlightedRelationId && !isHighlighted;
        const baseColor = RELATION_COLOR[relation.type];
        // Thin, delicate arcs (was up to ~1.8 — too heavy).
        const baseStroke = 0.18 + (relation.weight ?? 0.4) * 0.15;
        const stroke = isHighlighted
          ? Math.max(0.35, baseStroke * 1.4)
          : isDimmed
            ? baseStroke * 0.5
            : baseStroke;
        return {
          startLat: relation.source.lat,
          startLng: relation.source.lng,
          endLat: relation.target.lat,
          endLng: relation.target.lng,
          // append alpha hex for dimmed arcs (40 = ~25% opacity)
          color: isDimmed ? `${baseColor}40` : baseColor,
          stroke,
          label: buildRelationTooltip(relation),
          relation,
        };
      }),
    [relations, highlightedRelationId],
  );

  // Pale matte sphere so the globe reads as a light "virtual" earth and
  // occludes the back-side land dots.
  const globeMaterial = useMemo(
    () =>
      new THREE.MeshLambertMaterial({
        color: new THREE.Color(GLOBE_SURFACE),
      }),
    [],
  );

  // Pulsing rings on the two endpoints of the highlighted relation —
  // gives a "radar ping / glowing pin" feel without clutter.
  const rings = useMemo<{ lat: number; lng: number }[]>(() => {
    if (!highlightedRelationId) return [];
    const r = relations.find((rel) => rel.id === highlightedRelationId);
    if (!r) return [];
    return [
      { lat: r.source.lat, lng: r.source.lng },
      { lat: r.target.lat, lng: r.target.lng },
    ];
  }, [relations, highlightedRelationId]);

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: '100%',
        height,
        background:
          'radial-gradient(ellipse at center, #0a0f1e 0%, #020617 70%)',
        overflow: 'hidden',
        position: 'relative',
        ...style,
      }}
    >
      {width > 0 && (
        <Globe
          ref={globeRef as React.MutableRefObject<GlobeMethods | undefined>}
          width={width}
          height={height}
          backgroundColor="rgba(0,0,0,0)"
          // Airy "virtual globe": NO solid sphere (so it overlays text /
          // page cleanly with no gray disc) — just dotted landmasses.
          showGlobe={false}
          hexPolygonsData={COUNTRY_FEATURES}
          hexPolygonResolution={3}
          hexPolygonMargin={0.32}
          hexPolygonUseDots
          hexPolygonColor={() => HEX_LAND_DOT}
          hexPolygonAltitude={0.002}
          showAtmosphere={false}
          onGlobeReady={() => setIsReady(true)}
          // ---- points (entities) ----
          pointsData={points}
          pointLat="lat"
          pointLng="lng"
          pointColor="color"
          // Near-zero altitude => flat disc painted on the surface
          // (GitHub/Stripe-style dot), not a raised pillar.
          pointAltitude={0.006}
          pointRadius="size"
          pointLabel="label"
          pointsMerge={false}
          onPointClick={(p) => onPointClick?.((p as GlobePoint).entity)}
          // ---- arcs (relations) ----
          arcsData={arcs}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor="color"
          arcStroke="stroke"
          arcAltitudeAutoScale={0.5}
          arcDashLength={0.35}
          arcDashGap={0.15}
          arcDashAnimateTime={2200}
          arcLabel="label"
          onArcClick={(a) => onArcClick?.((a as GlobeArc).relation)}
          // ---- rings (glowing pulse on highlighted endpoints) ----
          ringsData={rings}
          ringLat="lat"
          ringLng="lng"
          ringAltitude={0.007}
          ringColor={() => (t: number) =>
            `rgba(37, 99, 235, ${Math.max(0, 1 - t)})`}
          ringMaxRadius={5}
          ringPropagationSpeed={3}
          ringRepeatPeriod={900}
        />
      )}
    </div>
  );
}
