import { describe, expect, it } from 'vitest';

import { CSM_SETTINGS_PANEL_KEYS } from '@/config/csm-mode';
import { CSM_SOURCE_PANEL_KEYS } from '@/config/csm-mode';
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
});
