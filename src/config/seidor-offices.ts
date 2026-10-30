import offices from './seidor-offices.json';

/** SEIDOR's published office directory. Coordinates identify city centres, not buildings. */
export interface SeidorOffice {
  id: string;
  name: string;
  city: string;
  countryCode: string;
  address: string;
  phone: string;
  lat: number;
  lon: number;
  coordinatePrecision: 'city';
  coordinateSource: string;
}

export const SEIDOR_OFFICES: readonly SeidorOffice[] = offices as SeidorOffice[];
export const SEIDOR_OFFICES_SOURCE = 'https://www.seidor.com/en-be/our-offices';
