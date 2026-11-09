const MIN_CESIUM_MAP_ZOOM = 1;
const MAX_CESIUM_MAP_ZOOM = 18;
const DEFAULT_REFERENCE_DISTANCE = 12_000_000;

function getReferenceDistance(distance: number): number {
  return Number.isFinite(distance) && distance > 0 ? distance : DEFAULT_REFERENCE_DISTANCE;
}

/** Converts the dashboard's logical 1-18 zoom scale to Cesium camera height. */
export function mapZoomToCesiumHeight(zoom: number, referenceDistance = DEFAULT_REFERENCE_DISTANCE): number {
  const distance = getReferenceDistance(referenceDistance);
  const safeZoom = Number.isFinite(zoom) ? zoom : 2;
  const boundedZoom = Math.min(MAX_CESIUM_MAP_ZOOM, Math.max(MIN_CESIUM_MAP_ZOOM, safeZoom));
  return distance / (2 ** (boundedZoom - 2));
}

/** Converts Cesium camera height back to the dashboard's logical 1-18 zoom. */
export function cesiumHeightToMapZoom(height: number, referenceDistance = DEFAULT_REFERENCE_DISTANCE): number {
  const distance = getReferenceDistance(referenceDistance);
  if (!Number.isFinite(height) || height <= 0) return 2;
  const zoom = 2 + Math.log2(distance / height);
  return Math.min(MAX_CESIUM_MAP_ZOOM, Math.max(MIN_CESIUM_MAP_ZOOM, zoom));
}
