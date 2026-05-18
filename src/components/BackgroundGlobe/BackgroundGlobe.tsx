// BackgroundGlobe — a pure, node-less rotating "virtual" earth.
//
// This is the THIRD globe in the demo. It exists only as the backdrop for the
// main hero wordmark: just the dotted landmasses, slowly spinning, no entity
// points / relation arcs / rings. As the user scrolls into the "Entity
// Relations" section, Landing.tsx cross-fades this out and the real
// EntityGlobe (with nodes) in.
//
// The dotted-land config here is intentionally byte-for-byte identical to
// EntityGlobe's hex-polygon layer, so during the cross-fade the dots appear to
// stay put while nodes/arcs fade in on top — instead of one globe swapping for
// another.

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Globe, { type GlobeMethods } from 'react-globe.gl';

import countriesGeo from '../EntityGlobe/countries.geo.json';

const HEX_LAND_DOT = '#94a3b8'; // slate-400 — same as EntityGlobe
const COUNTRY_FEATURES = (countriesGeo as { features: object[] }).features;

interface OrbitControlsLike {
  autoRotate: boolean;
  autoRotateSpeed: number;
  enableZoom: boolean;
  enableRotate: boolean;
  minPolarAngle: number;
  maxPolarAngle: number;
  enableDamping: boolean;
  dampingFactor: number;
}

export interface BackgroundGlobeProps {
  /** Auto-rotate the globe. */
  autoRotate?: boolean;
  /** Auto-rotate speed; degrees per frame at 60fps. */
  rotateSpeed?: number;
  /** Initial (and only) camera position. */
  initialPOV?: { lat: number; lng: number; altitude: number };
  /** Fixed height in px. Width is responsive to the container. */
  height?: number;
  className?: string;
  style?: CSSProperties;
}

export function BackgroundGlobe({
  autoRotate = true,
  rotateSpeed = 0.26,
  initialPOV = { lat: 22, lng: 8, altitude: 1.9 },
  height = 560,
  className,
  style,
}: BackgroundGlobeProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initialPOVRef = useRef(initialPOV);

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

  // One-shot setup after the globe scene is ready. Pure backdrop: no zoom,
  // no manual rotate — it just spins on its own.
  useEffect(() => {
    if (!isReady) return;
    const globe = globeRef.current;
    if (!globe) return;

    globe.pointOfView(initialPOVRef.current, 0);

    const controls = globe.controls() as unknown as OrbitControlsLike;
    controls.enableZoom = false;
    controls.enableRotate = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minPolarAngle = Math.PI / 3.5;
    controls.maxPolarAngle = Math.PI - Math.PI / 3.5;
  }, [isReady]);

  useEffect(() => {
    if (!isReady) return;
    const globe = globeRef.current;
    if (!globe) return;
    const controls = globe.controls() as unknown as OrbitControlsLike;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = rotateSpeed;
  }, [isReady, autoRotate, rotateSpeed]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: '100%',
        height,
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
          // Airy "virtual globe": NO solid sphere — just dotted landmasses,
          // identical to EntityGlobe so the cross-fade is seamless.
          showGlobe={false}
          hexPolygonsData={COUNTRY_FEATURES}
          hexPolygonResolution={3}
          hexPolygonMargin={0.32}
          hexPolygonUseDots
          hexPolygonColor={() => HEX_LAND_DOT}
          hexPolygonAltitude={0.002}
          showAtmosphere={false}
          onGlobeReady={() => setIsReady(true)}
        />
      )}
    </div>
  );
}
