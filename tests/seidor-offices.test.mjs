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

test('regional office labels resolve to the locality in the published address', () => {
  const kerala = offices.find(office => office.id === 'seidor-kerala');
  assert.equal(kerala.city, 'Koratty');
  assert.ok(Math.abs(kerala.lat - 10.2688) < 0.05 && Math.abs(kerala.lon - 76.3486) < 0.05);
  assert.equal(offices.find(office => office.id === 'seidor-san-borja').city, 'San Borja');
});

test('displaced city-centre markers use the address locality while staying approximate', () => {
  const expected = [
    ['seidor-heredia', 'Santa Rosa, Santo Domingo', 9.9707145, -84.100218],
    ['seidor-lisboa', 'Algés', 38.7025, -9.2294],
    ['seidor-miami', 'Doral', 25.81954, -80.35533],
    ['seidor-pamplona', 'Cordovilla', 42.78745, -1.6472],
  ];

  for (const [id, city, lat, lon] of expected) {
    const office = offices.find(candidate => candidate.id === id);
    assert.equal(office.city, city, id);
    assert.equal(office.lat, lat, id);
    assert.equal(office.lon, lon, id);
    assert.equal(office.coordinatePrecision, 'city', id);
    assert.equal(office.coordinateSource, 'municipal-centre', id);
  }
});
