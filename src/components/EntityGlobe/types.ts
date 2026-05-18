/**
 * Core domain types for the EntityGlobe visualization.
 *
 * An `Entity` is a real-world organization (university, company, research lab,
 * gov agency) that exists at a geographic location. An `EntityRelation` is a
 * directional link between two entities — typically discovered by the OSINT
 * pipeline (Serper -> Jina -> Gemini synthesis).
 *
 * Keep this file pure: no React, no react-globe.gl imports. That way the same
 * types can be reused on the backend or in tests.
 */

// Aligned with the frontend graphview relationship taxonomy
// (BASE_RELATIONSHIP_CONFIG in riskGraphConfig.ts).
export const RELATION_TYPES = [
  'Direct',
  'Indirect',
  'No Evidence',
] as const;

export type RelationType = (typeof RELATION_TYPES)[number];

export interface Entity {
  /** Stable identifier; slug or DB id. */
  id: string;
  /** Romanized / English display name. */
  name: string;
  /** Native-language display name (e.g. 清华大学, دانشگاه شریف). Optional. */
  localName?: string;
  /** Latitude in decimal degrees. */
  lat: number;
  /** Longitude in decimal degrees. */
  lng: number;
  /** ISO country name or code, used in tooltips. */
  country: string;
}

export interface EntityRelation {
  id: string;
  source: Entity;
  target: Entity;
  type: RelationType;
  /** Optional 0..1 weight; influences arc stroke thickness. */
  weight?: number;
  /** Optional human-readable detail (e.g. "14 co-authored papers"). */
  detail?: string;
  /** Original languages of the OSINT sources behind this relation. */
  sourceLanguages?: string[];
}
