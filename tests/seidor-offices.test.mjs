import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { resolveSourceOrigin } from '../scripts/source-origin.mjs';

const offices = JSON.parse(readFileSync(new URL('../src/config/seidor-offices.json', import.meta.url), 'utf8'));

test('the published SEIDOR source is assigned to its headquarters country', () => {
  assert.equal(resolveSourceOrigin({ provider: 'www.seidor.com', hosts: ['www.seidor.com'] }), 'ES');
});

test('SEIDOR directory preserves all 78 distinct published offices with usable city positions', () => {
  assert.equal(offices.length, 78);
  assert.equal(new Set(offices.map(office => office.id)).size, 78);
  assert.equal(new Set(offices.map(office => office.name)).size, 78);
  assert.ok(offices.some(office => office.name === 'Barcelona (Headquarters)'));
  assert.ok(offices.some(office => office.name === 'Zaragoza'));

  for (const office of offices) {
    assert.match(office.id, /^seidor-[a-z0-9-]+$/);
    assert.match(office.countryCode, /^[A-Z]{2}$/);
    assert.ok(office.address.length > 0, office.name);
    assert.ok(Number.isFinite(office.lat) && Math.abs(office.lat) <= 90, office.name);
    assert.ok(Number.isFinite(office.lon) && Math.abs(office.lon) <= 180, office.name);
    assert.equal(office.coordinatePrecision, 'city', office.name);
  }
});
