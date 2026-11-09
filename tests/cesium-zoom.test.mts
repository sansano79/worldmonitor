import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  cesiumHeightToMapZoom,
  mapZoomToCesiumHeight,
} from '../src/utils/cesium-zoom.ts';

describe('CSM Cesium camera zoom mapping', () => {
  it('maps zoom 2 to the initial camera height and zoom 18 to street scale', () => {
    const referenceDistance = 12_000_000;

    assert.equal(mapZoomToCesiumHeight(2, referenceDistance), referenceDistance);
    assert.equal(mapZoomToCesiumHeight(18, referenceDistance), referenceDistance / 65_536);
    assert.ok(mapZoomToCesiumHeight(18, referenceDistance) < 200);
  });

  it('round-trips fractional map zooms across the full 1-18 range', () => {
    const referenceDistance = 18_000_000;
    for (const zoom of [1, 1.5, 2, 2.25, 8, 12, 14.73, 17.99, 18]) {
      const height = mapZoomToCesiumHeight(zoom, referenceDistance);
      const roundTrip = cesiumHeightToMapZoom(height, referenceDistance);
      assert.ok(Math.abs(roundTrip - zoom) < 1e-12, `zoom ${zoom} round-tripped as ${roundTrip}`);
    }
  });

  it('clamps requested zoom and camera height to the same 1-18 range', () => {
    const referenceDistance = 12_000_000;
    assert.equal(mapZoomToCesiumHeight(-4, referenceDistance), mapZoomToCesiumHeight(1, referenceDistance));
    assert.equal(mapZoomToCesiumHeight(30, referenceDistance), mapZoomToCesiumHeight(18, referenceDistance));
    assert.equal(cesiumHeightToMapZoom(Number.POSITIVE_INFINITY, referenceDistance), 2);
    assert.equal(cesiumHeightToMapZoom(mapZoomToCesiumHeight(0, referenceDistance), referenceDistance), 1);
    assert.equal(cesiumHeightToMapZoom(mapZoomToCesiumHeight(19, referenceDistance), referenceDistance), 18);
  });
});
