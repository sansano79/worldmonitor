import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import { parse } from 'yaml';
import { renderCsmRuntimeConfig } from '../docker/render-csm-runtime-config.mjs';
import { getCsmCesiumIonClientToken } from '../src/utils/csm-photorealistic.ts';

describe('persistent CSM Cesium ion client configuration', () => {
  it('renders an empty default without a configured token', () => {
    assert.equal(renderCsmRuntimeConfig(''), 'window.__WM_CSM_CONFIG__ = Object.freeze({});\n');
  });

  it('serializes the browser-visible client token as data, not executable source', () => {
    const source = renderCsmRuntimeConfig('client-token-"</script>');
    assert.match(source, /"cesiumIonToken":"client-token-\\"\\u003c\/script>"/);
    assert.doesNotMatch(source, /<\/script>/i);
    assert.equal(getCsmCesiumIonClientToken({ cesiumIonToken: '  scoped-client-token  ' }), 'scoped-client-token');
    assert.equal(getCsmCesiumIonClientToken({ cesiumIonToken: '  ' }), null);
  });

  it('rejects control characters and oversized token configuration', () => {
    assert.throws(() => renderCsmRuntimeConfig('token\nwith-line-break'), /Invalid CSM Cesium ion client token configuration/);
    assert.throws(() => renderCsmRuntimeConfig('x'.repeat(4097)), /Invalid CSM Cesium ion client token configuration/);
  });

  it('wires the token only to WorldMonitor and loads runtime configuration before the CSM app', async () => {
    const compose = parse(await readFile(new URL('../docker-compose.yml', import.meta.url), 'utf8')) as {
      services?: Record<string, { environment?: Record<string, string> }>;
    };
    assert.equal(compose.services?.worldmonitor?.environment?.CSM_CESIUM_ION_TOKEN, '${CSM_CESIUM_ION_TOKEN:-}');
    assert.equal(compose.services?.['ais-relay']?.environment?.CSM_CESIUM_ION_TOKEN, undefined);
    assert.equal(compose.services?.redis?.environment?.CSM_CESIUM_ION_TOKEN, undefined);

    for (const htmlPath of ['../index.html', '../csm.html']) {
      const html = await readFile(new URL(htmlPath, import.meta.url), 'utf8');
      assert.match(html, /<script src="\/csm-runtime-config\.js" nonce="wm-static-bootstrap"><\/script>/);
    }
    const entrypoint = await readFile(new URL('../docker/entrypoint.sh', import.meta.url), 'utf8');
    assert.match(entrypoint, /node \/app\/render-csm-runtime-config\.mjs/);
  });
});
