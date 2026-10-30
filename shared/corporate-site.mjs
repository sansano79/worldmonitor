const SITE_FIELDS = [
  'id', 'name', 'countryCode', 'region', 'city', 'location',
  'type', 'criticality', 'operationalStatus', 'monitoringRadiiKm',
];
const LOCATION_FIELDS = ['latitude', 'longitude'];
const SITE_TYPES = new Set(['office', 'plant', 'warehouse', 'other']);
const CRITICALITIES = new Set(['low', 'medium', 'high', 'critical']);
const OPERATIONAL_STATUSES = new Set(['active', 'limited', 'suspended', 'closed']);

function record(value, fields, name) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)
    || (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)
    || Object.keys(value).some(key => !fields.includes(key))
    || fields.some(key => !Object.hasOwn(value, key))) {
    throw new TypeError(`Invalid ${name}`);
  }
  return value;
}

function string(value, name, maxLength) {
  if (typeof value !== 'string' || value.length === 0 || value.length > maxLength
    || value.trim() !== value) {
    throw new TypeError(`Invalid ${name}`);
  }
  return value;
}

function choice(value, choices, name) {
  if (!choices.has(value)) throw new TypeError(`Invalid ${name}`);
  return value;
}

/** Validate an untrusted site record without storing or publishing it. */
export function parseCorporateSite(input) {
  const site = record(input, SITE_FIELDS, 'CorporateSite');
  const location = record(site.location, LOCATION_FIELDS, 'location');
  if (typeof location.latitude !== 'number' || !Number.isFinite(location.latitude)
    || Math.abs(location.latitude) > 90
    || typeof location.longitude !== 'number' || !Number.isFinite(location.longitude)
    || Math.abs(location.longitude) > 180) {
    throw new TypeError('Invalid location');
  }
  const radii = site.monitoringRadiiKm;
  if (!Array.isArray(radii) || radii.length === 0 || radii.length > 10
    || radii.some(radius => typeof radius !== 'number' || !Number.isFinite(radius)
      || radius <= 0 || radius > 1000)
    || new Set(radii).size !== radii.length) {
    throw new TypeError('Invalid monitoringRadiiKm');
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(string(site.id, 'id', 64))) {
    throw new TypeError('Invalid id');
  }
  if (!/^[A-Z]{2}$/.test(site.countryCode)) throw new TypeError('Invalid countryCode');
  string(site.name, 'name', 120);
  string(site.region, 'region', 120);
  string(site.city, 'city', 120);
  choice(site.type, SITE_TYPES, 'type');
  choice(site.criticality, CRITICALITIES, 'criticality');
  choice(site.operationalStatus, OPERATIONAL_STATUSES, 'operationalStatus');
  return {
    id: site.id,
    name: site.name,
    countryCode: site.countryCode,
    region: site.region,
    city: site.city,
    location: { latitude: location.latitude, longitude: location.longitude },
    type: site.type,
    criticality: site.criticality,
    operationalStatus: site.operationalStatus,
    monitoringRadiiKm: [...radii],
  };
}
