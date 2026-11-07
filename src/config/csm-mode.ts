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
