import type { GeoPoint } from '@/types';

export interface AreaDefinition extends GeoPoint {
  key: string;
  name: string;
}

export const OPERATIONAL_HUBS: Record<string, AreaDefinition> = {
  central: {
    key: 'central',
    name: 'Bangalore Central Hub',
    lat: 12.9716,
    lng: 77.5946,
    area: 'Central District',
  },
  whitefield: {
    key: 'whitefield',
    name: 'Whitefield Tech Corridor',
    lat: 12.9698,
    lng: 77.7500,
    area: 'Whitefield',
  },
  indiranagar: {
    key: 'indiranagar',
    name: 'Indiranagar Commercial Hub',
    lat: 12.9784,
    lng: 77.6408,
    area: 'Indiranagar',
  },
  peenya: {
    key: 'peenya',
    name: 'Peenya Industrial Logistics Park',
    lat: 13.0334,
    lng: 77.5256,
    area: 'Peenya',
  },
  electronic_city: {
    key: 'electronic_city',
    name: 'Electronic City Terminal',
    lat: 12.8399,
    lng: 77.6770,
    area: 'Electronic City',
  },
};
