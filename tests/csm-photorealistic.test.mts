import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CSM_PHOTOREALISTIC_ASSET_ID, loadIonAssetWithTemporaryToken } from '../src/utils/csm-photorealistic.ts';

describe('CSM Cesium ion photorealistic integration', () => {
  it('uses the configured Google photorealistic asset id', () => {
    assert.equal(CSM_PHOTOREALISTIC_ASSET_ID, 2275207);
  });

  it('restores the previous Cesium ion token after a successful load', async () => {
    const ion = { defaultAccessToken: 'default-token' };
    const loaded = await loadIonAssetWithTemporaryToken(ion, 'session-token', async () => {
      assert.equal(ion.defaultAccessToken, 'session-token');
      return 'tileset';
    });
    assert.equal(loaded, 'tileset');
    assert.equal(ion.defaultAccessToken, 'default-token');
  });

  it('restores the previous Cesium ion token when loading fails', async () => {
    const ion = { defaultAccessToken: 'default-token' };
    await assert.rejects(
      loadIonAssetWithTemporaryToken(ion, 'session-token', async () => {
        assert.equal(ion.defaultAccessToken, 'session-token');
        throw new Error('request failed');
      }),
      /request failed/,
    );
    assert.equal(ion.defaultAccessToken, 'default-token');
  });
});
