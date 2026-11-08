import offices from './seidor-offices.json';

/** SEIDOR's published office directory with coordinate precision tied to its evidence. */
export type SeidorCoordinatePrecision = 'city' | 'address' | 'address-range' | 'building';

export interface SeidorOffice {
  id: string;
  name: string;
  city: string;
  countryCode: string;
  address: string;
  phone: string;
  lat: number;
  lon: number;
  coordinatePrecision: SeidorCoordinatePrecision;
  coordinateSource: string;
}

export function seidorCoordinateDescription(precision: SeidorCoordinatePrecision): string {
  switch (precision) {
    case 'address':
      return 'Pin based on the published street address; office occupancy is not independently verified.';
    case 'address-range':
      return 'Pin marks the mapped address range; the exact office entrance is not verified.';
    case 'building':
      return 'Pin marks the mapped building or site; the SEIDOR floor and occupancy are not independently verified.';
    case 'city':
      return 'Map position is approximate (city centre).';
  }
}

export const SEIDOR_OFFICES: readonly SeidorOffice[] = offices as SeidorOffice[];
export const SEIDOR_OFFICES_SOURCE = 'https://www.seidor.com/en-be/our-offices';
