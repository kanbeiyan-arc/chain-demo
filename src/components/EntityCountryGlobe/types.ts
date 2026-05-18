// Domain types for the entity → country risk globe.
// Pure module: no React / react-globe.gl imports.

export interface OriginEntity {
  id: string;
  name: string;
  localName?: string;
  lat: number;
  lng: number;
  country: string;
}

export interface LinkedEntry {
  origin: OriginEntity;
  /** Highlighted country — must match the GeoJSON `ADMIN`/`NAME`. */
  country: string;
  /** Theme color (hex) for this entry's node, ripple and country dots. */
  color: string;
}
