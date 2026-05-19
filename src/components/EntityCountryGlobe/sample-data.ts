import type { LinkedEntry } from './types';

// Each entry is one entity, linked to (and highlighting) its country with a
// distinct theme color. `brief` drives the entity brief card.
export const sampleEntries: LinkedEntry[] = [
  {
    origin: {
      id: 'austal',
      name: 'Austal Limited',
      // HQ: Henderson, Western Australia
      lat: -32.1626,
      lng: 115.7637,
      country: 'Australia',
      brief: {
        type: 'Public Company (ASX: ASB)',
        jurisdiction: 'Australia · Henderson, WA',
        subsidiaries: [
          'AUSTAL AUSTRALASIA PTY LTD',
          'AUSTAL SHIPS PTY LTD',
        ],
        keywords: [
          { label: 'Military', icon: 'soldier' },
          { label: 'Weapons', icon: 'rifle' },
        ],
      },
    },
    country: 'Australia',
    color: '#2563eb', // blue
  },
  {
    // US company; we are searching its association with China — so China
    // is highlighted and an arc connects the two.
    origin: {
      id: 'seagate',
      name: 'Seagate Technology Holdings plc',
      // Principal executive offices: 47488 Kato Road, Fremont, CA, USA
      lat: 37.5043,
      lng: -121.9469,
      country: 'United States',
      brief: {
        type: 'Public Company (NASDAQ: STX)',
        jurisdiction: 'United States · Fremont, CA',
        keywords: [
          { label: 'Military', icon: 'soldier', relationship: 'Indirect' },
          { label: 'Sanctions', icon: 'sanction', relationship: 'Indirect' },
        ],
        affiliated: ['Huawei Technologies Co., Ltd.'],
      },
    },
    country: 'China',
    color: '#dc2626', // red
    // Beijing — the point in the highlighted country to connect to.
    link: { lat: 39.9042, lng: 116.4074, label: 'China' },
  },
  {
    // Chinese company; we are searching its association with Brazil — so
    // Brazil is highlighted and an arc connects the two.
    origin: {
      id: 'byd',
      name: 'BYD Company Limited',
      localName: '比亚迪',
      // HQ: BYD Headquarters, Pingshan District, Shenzhen, China
      lat: 22.6868,
      lng: 114.3499,
      country: 'China',
      brief: {
        type: 'Public Company (HKEX: 1211 · SZSE: 002594)',
        jurisdiction: 'China · Shenzhen',
        keywords: [
          {
            label: 'Human Rights',
            icon: 'civil-rights',
            relationship: 'Indirect',
          },
        ],
      },
    },
    country: 'Brazil',
    color: '#16a34a', // green
    // São Paulo — the point in the highlighted country to connect to.
    link: { lat: -23.5505, lng: -46.6333, label: 'Brazil' },
  },
];
