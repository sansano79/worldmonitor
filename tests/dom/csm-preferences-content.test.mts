import { beforeAll, describe, expect, it } from 'vitest';

import { renderPreferences } from '@/services/preferences-content';
import { initTestI18n } from './helpers/i18n.mts';

beforeAll(async () => {
  await initTestI18n();
});

describe('CSM preferences', () => {
  it('keeps appearance and map controls without generic AI, media, or account features', () => {
    const { html } = renderPreferences({ isDesktopApp: false, csmMode: true });

    expect(html).toContain('us-theme');
    expect(html).toContain('us-font-family');
    expect(html).toContain('us-map-provider');
    expect(html).toContain('us-map-theme');
    expect(html).toContain('us-language');
    expect(html).not.toContain('us-cloud');
    expect(html).not.toContain('us-browser');
    expect(html).not.toContain('us-headline-memory');
    expect(html).not.toContain('fwImportBtn');
    expect(html).not.toContain('us-live-streams-always-on');
    expect(html).not.toContain('usExportBtn');
    expect(html).not.toContain('usStatusDot');
  });
});
