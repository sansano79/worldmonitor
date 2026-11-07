import { describe, expect, it } from 'vitest';

import {
  CSM_DEFAULT_PANEL_KEYS,
  CSM_MAP_LAYER_KEYS,
  CSM_SETTINGS_PANEL_KEYS,
  CSM_SOURCE_PANEL_KEYS,
  getCsmDefaultMapLayers,
  mergeCsmMapLayers,
} from '@/config/csm-mode';
import { ALL_PANELS } from '@/config/panels';
import { getSourcePanelId, listConfiguredFeedNames } from '@/config/feeds';

describe('CSM settings panel catalog', () => {
  it('only exposes registered panels for physical security monitoring', () => {
    expect(CSM_SETTINGS_PANEL_KEYS.size).toBe(13);
    for (const panelKey of CSM_SETTINGS_PANEL_KEYS) {
      expect(ALL_PANELS[panelKey], `${panelKey} must exist in the panel registry`).toBeDefined();
    }
    expect(CSM_SETTINGS_PANEL_KEYS.has('markets')).toBe(false);
    expect(CSM_SETTINGS_PANEL_KEYS.has('crypto')).toBe(false);
  });

  it('keeps the CSM source set within geopolitical and intelligence categories', () => {
    const sourceNames = listConfiguredFeedNames().filter((name) =>
      CSM_SOURCE_PANEL_KEYS.has(getSourcePanelId(name)),
    );
    expect(sourceNames.length).toBeGreaterThan(0);
    expect(sourceNames.every((name) => CSM_SOURCE_PANEL_KEYS.has(getSourcePanelId(name)))).toBe(true);
    expect(CSM_SOURCE_PANEL_KEYS.has('markets')).toBe(false);
    expect(CSM_SOURCE_PANEL_KEYS.has('crypto')).toBe(false);
  });

  it('starts with a compact physical security panel set', () => {
    expect([...CSM_DEFAULT_PANEL_KEYS].every((key) => CSM_SETTINGS_PANEL_KEYS.has(key))).toBe(true);
    expect(CSM_DEFAULT_PANEL_KEYS.has('map')).toBe(true);
    expect(CSM_DEFAULT_PANEL_KEYS.has('telegram-intel')).toBe(true);
    expect(CSM_DEFAULT_PANEL_KEYS.has('markets')).toBe(false);
  });

  it('keeps the public SEIDOR directory on and removes unrelated map layers in CSM', () => {
    const defaults = {
      seidorOffices: false,
      conflicts: true,
      weather: true,
      markets: true,
    };
    const csmDefaults = getCsmDefaultMapLayers(defaults);
    expect(csmDefaults).toEqual({
      seidorOffices: true,
      conflicts: true,
      weather: true,
      markets: false,
    });
    expect(CSM_MAP_LAYER_KEYS.has('seidorOffices')).toBe(true);

    expect(mergeCsmMapLayers({ ...csmDefaults, seidorOffices: false, markets: true }, csmDefaults)).toEqual({
      seidorOffices: false,
      conflicts: true,
      weather: true,
      markets: false,
    });
  });
});
