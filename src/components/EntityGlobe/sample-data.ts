import type { Entity, EntityRelation } from './types';

/**
 * Sample entities for the landing-page hero / Storybook fixtures.
 *
 * Picked to showcase the multilingual coverage story:
 * Latin / CJK (Han, Hiragana) / Cyrillic / Arabic scripts in the same view.
 *
 * Replace with backend data in production. Coordinates are real campus
 * locations (Wikipedia / OpenStreetMap), accurate to ~100m.
 */
export const sampleEntities = {
  uoft: {
    id: 'uoft',
    name: 'University of Toronto',
    lat: 43.6629,
    lng: -79.3957,
    country: 'Canada',
  },
  tsinghua: {
    id: 'tsinghua',
    name: 'Tsinghua University',
    localName: '清华大学',
    lat: 40.0027,
    lng: 116.3262,
    country: 'China',
  },
  utokyo: {
    id: 'utokyo',
    name: 'University of Tokyo',
    localName: '東京大学',
    lat: 35.7128,
    lng: 139.7625,
    country: 'Japan',
  },
  msu: {
    id: 'msu',
    name: 'Lomonosov Moscow State University',
    localName: 'Московский государственный университет',
    lat: 55.7034,
    lng: 37.5302,
    country: 'Russia',
  },
  imperial: {
    id: 'imperial',
    name: 'Imperial College London',
    lat: 51.4988,
    lng: -0.1749,
    country: 'United Kingdom',
  },
  sharif: {
    id: 'sharif',
    name: 'Sharif University of Technology',
    localName: 'دانشگاه صنعتی شریف',
    lat: 35.7027,
    lng: 51.3514,
    country: 'Iran',
  },
  nanjing: {
    id: 'nanjing',
    name: 'Nanjing University',
    localName: '南京大学',
    lat: 32.0570,
    lng: 118.7780,
    country: 'China',
  },
} satisfies Record<string, Entity>;

export const sampleEntityList: Entity[] = Object.values(sampleEntities);

export const sampleRelations: EntityRelation[] = [
  {
    id: 'r1',
    source: sampleEntities.uoft,
    target: sampleEntities.tsinghua,
    type: 'Direct',
    detail: '14 co-authored papers',
    weight: 0.7,
    sourceLanguages: ['English', 'Chinese', 'French'],
  },
  {
    id: 'r2',
    source: sampleEntities.uoft,
    target: sampleEntities.utokyo,
    type: 'Direct',
    detail: 'joint research lab',
    weight: 0.5,
    sourceLanguages: ['English', 'Japanese'],
  },
  {
    id: 'r3',
    source: sampleEntities.tsinghua,
    target: sampleEntities.sharif,
    type: 'Indirect',
    detail: 'MoU signed 2023',
    weight: 0.6,
    sourceLanguages: ['Chinese', 'Persian', 'English'],
  },
  {
    id: 'r4',
    source: sampleEntities.msu,
    target: sampleEntities.sharif,
    type: 'Direct',
    detail: 'flagged: dual-use research',
    weight: 0.9,
    sourceLanguages: ['Russian', 'Persian', 'English', 'Chinese'],
  },
  {
    id: 'r5',
    source: sampleEntities.uoft,
    target: sampleEntities.imperial,
    type: 'Indirect',
    detail: 'Universitas 21 member',
    weight: 0.4,
    sourceLanguages: ['English'],
  },
  {
    id: 'r6',
    source: sampleEntities.uoft,
    target: sampleEntities.nanjing,
    type: 'No Evidence',
    detail: 'no public collaboration on record',
    weight: 0.5,
    sourceLanguages: ['English', 'Chinese'],
  },
];
