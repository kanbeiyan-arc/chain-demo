// Domain types for the entity → country risk globe.
// Pure module: no React / react-globe.gl imports.

/** Short profile shown in the entity brief card. Single-entity analogue of
 *  the Entity Relations card — only a few headline fields, not a full
 *  dossier. All optional so an entry can omit any line. */
/** Icon kinds available for POI pins / keyword associations. */
export type PoiIconKind = 'soldier' | 'rifle' | 'sanction' | 'civil-rights';

/** A risk keyword that surfaces one-by-one, each paired with a globe icon. */
export interface EntityKeyword {
  label: string;
  icon: PoiIconKind;
  /** relationship type badge shown on the right (defaults to "Direct"). */
  relationship?: string;
}

export interface EntityBrief {
  /** e.g. "Public Company (ASX: ASB)" */
  type?: string;
  /** e.g. "Australia · Henderson, WA" */
  jurisdiction?: string;
  /** corporate structure — subsidiary legal entities */
  subsidiaries?: string[];
  /** keyword associations, revealed sequentially with their globe icon */
  keywords?: EntityKeyword[];
  /** affiliated companies, shown at the very bottom of the card */
  affiliated?: string[];
}

export interface OriginEntity {
  id: string;
  name: string;
  localName?: string;
  lat: number;
  lng: number;
  country: string;
  brief?: EntityBrief;
}

/** A point inside the highlighted country to draw the connection arc to. */
export interface CountryAnchor {
  lat: number;
  lng: number;
  label?: string;
}

export interface LinkedEntry {
  origin: OriginEntity;
  /** Highlighted country — must match the GeoJSON `ADMIN`/`NAME`. */
  country: string;
  /** Theme color (hex) for this entry's node, ripple and country dots. */
  color: string;
  /**
   * When the entity sits OUTSIDE the highlighted country, this is the point
   * in that country to draw a connection arc to (we are searching this
   * entity's association with that country). Omit when the node already
   * sits in the highlighted country.
   */
  link?: CountryAnchor;
}
