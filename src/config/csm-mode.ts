import type { MapLayers } from '@/types';

/**
 * Enables the fork's single-edition Corporate Security Monitor experience.
 * Keep the default off so the upstream WorldMonitor editions retain their
 * account and subscription settings until their own product modes opt in.
 */
export function isCsmMode(): boolean {
  try {
    return import.meta.env.VITE_CSM_MODE === 'true';
  } catch {
    return false;
  }
}

/** CSM supports street-scale camera zoom; the upstream flat/globe maps keep their 1-10 range. */
export function getMapZoomMaximum(csmMode = isCsmMode()): number {
  return csmMode ? 18 : 10;
}

/**
 * Small panel catalog exposed in CSM settings. Keep this list focused on
 * country, incident, and source monitoring; the complete dashboard catalog
 * remains available to the non-CSM WorldMonitor editions.
 */
export const CSM_SETTINGS_PANEL_KEYS = new Set([
  'map',
  'live-news',
  'threat-timeline',
  'strategic-posture',
  'cii',
  'strategic-risk',
  'intel',
  'security-advisories',
  'telegram-intel',
  'ukmto-incidents',
  'satellite-fires',
  'disease-outbreaks',
  'cross-source-signals',
]);

/** Panels shown on the first CSM visit. Other allowed panels stay opt-in. */
export const CSM_DEFAULT_PANEL_KEYS = new Set([
  'map',
  'live-news',
  'threat-timeline',
  'strategic-posture',
  'cii',
  'strategic-risk',
  'intel',
  'telegram-intel',
]);

/** Public map layers relevant to physical security; all other layers start off. */
export const CSM_MAP_LAYER_KEYS = new Set([
  'seidorOffices',
  'conflicts',
  'natural',
  'weather',
  'protests',
  'fires',
  'diseaseOutbreaks',
  'displacement',
  'ucdpEvents',
  'military',
]);

export function getCsmDefaultMapLayers(defaults: MapLayers): MapLayers {
  const layers = { ...defaults };
  for (const key of Object.keys(layers) as Array<keyof MapLayers>) {
    layers[key] = CSM_MAP_LAYER_KEYS.has(key) && Boolean(defaults[key]);
  }
  layers.seidorOffices = true;
  return layers;
}

export function mergeCsmMapLayers(saved: MapLayers, defaults: MapLayers): MapLayers {
  const layers = { ...defaults };
  for (const key of Object.keys(layers) as Array<keyof MapLayers>) {
    layers[key] = CSM_MAP_LAYER_KEYS.has(key)
      && Boolean(Object.prototype.hasOwnProperty.call(saved, key) ? saved[key] : defaults[key]);
  }
  if (!Object.prototype.hasOwnProperty.call(saved, 'seidorOffices')) layers.seidorOffices = true;
  return layers;
}

/** News and intelligence categories retained in the CSM source selector. */
export const CSM_SOURCE_REGION_KEYS = new Set([
  'worldwide',
  'us',
  'europe',
  'middleeast',
  'africa',
  'latam',
  'asia',
  'intel',
]);
export const CSM_SOURCE_PANEL_KEYS = new Set([
  'politics',
  'crisis',
  'us',
  'gov',
  'europe',
  'middleeast',
  'africa',
  'latam',
  'asia',
  'intel',
]);
