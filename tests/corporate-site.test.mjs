import assert from 'node:assert/strict';
import test from 'node:test';

import { parseCorporateSite } from '../shared/corporate-site.mjs';

const site = () => ({
  id: 'test-site-01',
  name: 'Example Office',
  countryCode: 'XX',
  region: 'Example Region',
  city: 'Example City',
  location: { latitude: 0, longitude: 0 },
  type: 'office',
  criticality: 'high',
  operationalStatus: 'active',
  monitoringRadiiKm: [5, 25],
});

test('accepts a fictitious site including genuine zero coordinates', () => {
  assert.deepEqual(parseCorporateSite(site()), site());
});

test('rejects missing, coerced and out-of-range coordinates', () => {
  for (const location of [
    { latitude: null, longitude: 0 },
    { latitude: '0', longitude: 0 },
    { latitude: 91, longitude: 0 },
    { latitude: 0, longitude: -181 },
    { latitude: Infinity, longitude: 0 },
  ]) {
    assert.throws(() => parseCorporateSite({ ...site(), location }), /location/);
  }
});

test('rejects invalid monitoring radii', () => {
  for (const monitoringRadiiKm of [[], [0], [-1], [1001], [NaN], ['5'], [5, 5]]) {
    assert.throws(() => parseCorporateSite({ ...site(), monitoringRadiiKm }), /monitoringRadiiKm/);
  }
});

test('rejects invalid identity, classification and unexpected sensitive fields', () => {
  for (const change of [
    { id: '' },
    { countryCode: 'Example' },
    { criticality: 'confirmed' },
    { operationalStatus: 'unknown' },
    { contacts: ['private@example.invalid'] },
  ]) {
    assert.throws(() => parseCorporateSite({ ...site(), ...change }), TypeError);
  }
});
