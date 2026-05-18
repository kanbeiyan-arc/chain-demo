import type { LinkedEntry } from './types';

// Three universities, each linked to (and highlighting) their country
// with a distinct theme color.
export const sampleEntries: LinkedEntry[] = [
  {
    origin: {
      id: 'waterloo',
      name: 'University of Waterloo',
      lat: 43.4723,
      lng: -80.5449,
      country: 'Canada',
    },
    country: 'Canada',
    color: '#2563eb', // blue
  },
  {
    origin: {
      id: 'pku',
      name: 'Peking University',
      localName: '北京大学',
      lat: 39.999,
      lng: 116.3059,
      country: 'China',
    },
    country: 'China',
    color: '#dc2626', // red
  },
  {
    origin: {
      id: 'sharif',
      name: 'Sharif University of Technology',
      localName: 'دانشگاه صنعتی شریف',
      lat: 35.7027,
      lng: 51.3514,
      country: 'Iran',
    },
    country: 'Iran',
    color: '#16a34a', // green
  },
];
