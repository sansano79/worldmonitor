import assert from 'node:assert/strict';
import test from 'node:test';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';

import { createOidcAuthenticator } from '../csm/auth.mjs';
import { createCsmHttpServer } from '../csm/http-server.mjs';
import { createSitesHandler } from '../csm/sites-handler.mjs';
import { createSitesRepository } from '../csm/sites-repository.mjs';

const ISSUER = 'https://identity.example.invalid/';
const AUDIENCE = 'corporate-sites';
const SITE = {
  id: 'example-office', name: 'Example Office', countryCode: 'XX',
  region: 'Example Region', city: 'Example City',
  location: { latitude: 0, longitude: 0 }, type: 'office',
  criticality: 'high', operationalStatus: 'active', monitoringRadiiKm: [5, 25],
};

const { privateKey, publicKey } = await generateKeyPair('RS256');
const jwk = { ...await exportJWK(publicKey), kid: 'test-key', alg: 'RS256', use: 'sig' };
const authenticate = createOidcAuthenticator({
  issuer: ISSUER, audience: AUDIENCE,
  keySet: createLocalJWKSet({ keys: [jwk] }),
});

async function token({ expired = false, audience = AUDIENCE } = {}) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
    .setIssuer(ISSUER).setSubject('employee-1').setAudience(audience)
    .setIssuedAt(now - 60).setExpirationTime(expired ? now - 5 : now + 300)
    .sign(privateKey);
}

function request(path, bearer) {
  return new Request(`https://csm.example.invalid${path}`, {
    headers: bearer ? { Authorization: `Bearer ${bearer}` } : {},
  });
}

function handler(repository = {}) {
  return createSitesHandler({ authenticate, repository: {
    findMembership: async () => ({ organizationId: 'org-a', role: 'viewer' }),
    listSites: async () => [SITE],
    findSite: async () => SITE,
    ...repository,
  } });
}

test('anonymous, expired, and wrong-audience credentials cannot read sites', async () => {
  for (const bearer of [undefined, await token({ expired: true }), await token({ audience: 'other' })]) {
    const response = await handler()(request('/csm/api/sites', bearer));
    assert.equal(response.status, 401);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(JSON.stringify(await response.json()).includes('Example Office'), false);
  }
});

test('a valid identity without organization membership is denied', async () => {
  const response = await handler({ findMembership: async () => null })(request('/csm/api/sites', await token()));
  assert.equal(response.status, 403);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('a member sees the list and a foreign site ID is indistinguishable from a missing ID', async () => {
  const bearer = await token();
  const list = await handler()(request('/csm/api/sites', bearer));
  assert.equal(list.status, 200);
  assert.equal(list.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await list.json(), { sites: [SITE] });
  const detail = await handler({ findSite: async () => null })(request('/csm/api/sites/foreign-office', bearer));
  assert.equal(detail.status, 404);
  assert.deepEqual(await detail.json(), { error: 'Not found' });
});

test('identity and storage outages fail closed without site data', async () => {
  const bearer = await token();
  for (const failingHandler of [
    createSitesHandler({ authenticate: async () => { throw new Error('issuer unavailable'); }, repository: {} }),
    handler({ listSites: async () => { throw new Error('database unavailable'); } }),
  ]) {
    const response = await failingHandler(request('/csm/api/sites', bearer));
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(JSON.stringify(await response.json()).includes('Example Office'), false);
  }
});

test('repository scopes membership and site reads by verified organization', async () => {
  const calls = [];
  const db = { query: async (sql, params) => {
    calls.push({ sql, params });
    return { rows: [] };
  } };
  const repository = createSitesRepository(db);
  await repository.findMembership({ issuer: ISSUER, subject: 'employee-1' });
  await repository.listSites('org-a');
  await repository.findSite('org-a', 'foreign-office');
  assert.deepEqual(calls.map(call => call.params), [
    [ISSUER, 'employee-1'], ['org-a'], ['org-a', 'foreign-office'],
  ]);
  assert.match(calls[1].sql, /organization_id\s*=\s*\$1/i);
  assert.match(calls[2].sql, /organization_id\s*=\s*\$1/i);
});

test('HTTP transport preserves the authorization boundary and no-store response', async (t) => {
  const server = createCsmHttpServer(handler());
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  t.after(() => new Promise(resolve => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/csm/api/sites`;
  const denied = await fetch(url);
  assert.equal(denied.status, 401);
  assert.equal(denied.headers.get('cache-control'), 'no-store');
  const allowed = await fetch(url, { headers: { Authorization: `Bearer ${await token()}` } });
  assert.equal(allowed.status, 200);
  assert.deepEqual(await allowed.json(), { sites: [SITE] });
});
