export interface CorporateSite {
  id: string;
  name: string;
  countryCode: string;
  region: string;
  city: string;
  location: { latitude: number; longitude: number };
  type: 'office' | 'plant' | 'warehouse' | 'other';
  criticality: 'low' | 'medium' | 'high' | 'critical';
  operationalStatus: 'active' | 'limited' | 'suspended' | 'closed';
  monitoringRadiiKm: number[];
}

export function parseCorporateSite(input: unknown): CorporateSite;
