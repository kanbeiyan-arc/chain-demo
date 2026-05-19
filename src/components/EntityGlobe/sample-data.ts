import type { Entity, EntityRelation } from './types';

/**
 * Sample entities for the landing-page hero / Storybook fixtures.
 *
 * Picked to showcase the multilingual coverage story:
 * Latin / CJK (Han) / Arabic scripts in the same view.
 * Entity locations span all longitudes so the hero camera circles the
 * globe (see the ordering note on sampleRelations below).
 *
 * Replace with backend data in production. Coordinates are real campus /
 * headquarters locations (Wikipedia / OpenStreetMap), accurate to ~100m.
 */
export const sampleEntities = {
  tsinghua: {
    id: 'tsinghua',
    name: 'Tsinghua University',
    localName: '清华大学',
    lat: 40.0027,
    lng: 116.3262,
    country: 'China',
  },
  sharif: {
    id: 'sharif',
    name: 'Sharif University of Technology',
    localName: 'دانشگاه صنعتی شریف',
    lat: 35.7027,
    lng: 51.3514,
    country: 'Iran',
  },
  iitm: {
    id: 'iitm',
    name: 'IIT Madras',
    lat: 12.9915,
    lng: 80.2336,
    country: 'India',
  },
  kit: {
    id: 'kit',
    name: 'Karlsruhe Institute of Technology',
    localName: 'Karlsruher Institut für Technologie',
    lat: 49.0094,
    lng: 8.4044,
    country: 'Germany',
  },
  huawei: {
    id: 'huawei',
    name: 'Huawei Technologies',
    localName: '华为技术有限公司',
    lat: 22.6276,
    lng: 114.0707,
    country: 'China',
  },
  berkeley: {
    id: 'berkeley',
    name: 'University of California, Berkeley',
    lat: 37.8719,
    lng: -122.2591,
    country: 'United States',
  },
  mit: {
    id: 'mit',
    name: 'Massachusetts Institute of Technology',
    lat: 42.36,
    lng: -71.092,
    country: 'United States',
  },
} satisfies Record<string, Entity>;

export const sampleEntityList: Entity[] = Object.values(sampleEntities);

// Ordered east -> west by great-circle midpoint longitude so the hero
// auto-cycle pans the camera continuously around the globe in ONE
// direction, with no reversal at the loop boundary:
//   r1 Berkeley<->Tsinghua  ~179°E  (Pacific / dateline)
//   r2 Huawei<->KIT         ~74°E
//   r3 IITM<->Sharif        ~67°E
//   r4 KIT<->MIT            ~-34°E  (N. Atlantic — fills the Western gap)
// Every hop (incl. r4 -> r1 wrap, ~147° west across the Americas) is
// westward, so pointOfView's shortest-path animation reads as a single
// continuous circle.
export const sampleRelations: EntityRelation[] = [
  {
    id: 'r1',
    source: sampleEntities.berkeley,
    target: sampleEntities.tsinghua,
    type: 'Direct',
    detail:
      'Tsinghua-Berkeley Shenzhen Institute (TBSI): a joint research and graduate-education institute flagged by the U.S. House Select Committee on the CCP over dual-use research and foreign-funding disclosure; UC Berkeley ended its affiliation in 2024.',
    weight: 0.85,
    sourceLanguages: ['English', 'Chinese'],
  },
  {
    id: 'r2',
    source: sampleEntities.huawei,
    target: sampleEntities.kit,
    type: 'Direct',
    detail:
      'A direct relationship between the Karlsruhe Institute of Technology (KIT) and Huawei Technologies has been identified through extensive collaboration in research, talent development, and technology training.',
    weight: 0.9,
    sourceLanguages: ['German', 'English', 'Chinese'],
  },
  {
    id: 'r3',
    source: sampleEntities.iitm,
    target: sampleEntities.sharif,
    type: 'Direct',
    detail:
      'IIT Madras lists Sharif University of Technology as a partner university under an MOU for a Student Exchange Program.',
    weight: 0.6,
    sourceLanguages: ['English', 'Persian'],
  },
  {
    id: 'r4',
    source: sampleEntities.kit,
    target: sampleEntities.mit,
    type: 'Direct',
    detail:
      'The Karlsruhe Institute of Technology is a university and research partner of the MIT-Germany Program.',
    weight: 0.7,
    sourceLanguages: ['English', 'German'],
  },
];
