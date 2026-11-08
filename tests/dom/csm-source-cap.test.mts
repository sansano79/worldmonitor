import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { initTestI18n } from './helpers/i18n.mts';

vi.mock('@/config/csm-mode', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/config/csm-mode')>()),
  isCsmMode: () => true,
}));

vi.mock('@/config/feeds', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/config/feeds')>()),
  getSourcePanelId: () => 'politics',
}));

vi.mock('@/services/widget-store', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/widget-store')>()),
  isProUser: () => false,
}));

vi.mock('@/services/panel-gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/panel-gating')>()),
  hasPremiumAccess: () => false,
}));

const { EventHandlerManager } = await import('@/app/event-handlers');
const { enforceFreePanelLimit, isPanelEntitled } = await import('@/config/panels');
const { evaluateSetPanelEnabled } = await import('@/config/panel-enablement');
const { evaluateAvailableExportFormats, evaluateExportGate, evaluateTabCap } = await import('@/services/gates/export');
const { evaluatePlaybackGate } = await import('@/services/gates/playback');

const SOURCE_NAMES = Array.from({ length: 350 }, (_, index) => `CSM source ${String(index + 1).padStart(3, '0')}`);

let manager: InstanceType<typeof EventHandlerManager>;
let settingsController: NonNullable<ConstructorParameters<typeof EventHandlerManager>[0]['unifiedSettings']>;
let disabledSources: Set<string>;

beforeAll(async () => {
  await initTestI18n();
});

beforeEach(() => {
  document.body.replaceChildren();
  document.body.innerHTML = '<div id="unifiedSettingsMount"></div>';
  disabledSources = new Set(SOURCE_NAMES.slice(150));
  const ctx = {
    container: document.createElement('div'),
    panelSettings: {},
    disabledSources,
    newsCategoryPanelKeys: new Set<string>(),
    isDesktopApp: false,
    isDestroyed: false,
  } as unknown as ConstructorParameters<typeof EventHandlerManager>[0];
  const callbacks = {
    loadAllData: vi.fn(async () => {}),
    updateSearchIndex: vi.fn(),
    applyPanelSettings: vi.fn(),
    openSearch: vi.fn(),
  } as never;

  manager = new EventHandlerManager(ctx, callbacks);
  vi.spyOn(manager, 'getAllSourceNames').mockReturnValue(SOURCE_NAMES);
  manager.setupUnifiedSettings();
  settingsController = ctx.unifiedSettings!;
});

afterEach(() => {
  manager.destroy();
  document.body.replaceChildren();
});

describe('CSM source selection', () => {
  it('enables every visible source through Select all even when more than 80 are selected', async () => {
    await settingsController.open('sources');

    const counter = document.querySelector('#usSourcesCounter');
    expect(counter?.textContent).toContain('150');
    expect(counter?.textContent).toContain('350');

    const selectAll = document.querySelector<HTMLButtonElement>('.sources-select-all');
    expect(selectAll).not.toBeNull();
    selectAll!.click();

    expect(disabledSources.size).toBe(0);
    expect(document.querySelectorAll('#usSourceToggles .source-toggle-item.active')).toHaveLength(350);
    expect(document.querySelector('#usSourcesCounter')?.textContent).toContain('350');
    expect(document.body.textContent).not.toContain('Plan gratuito: máx 80');
    expect(document.body.textContent).not.toContain('Upgrade to PRO');
  });

  it('allows an individual toggle beyond the former 80-source limit', async () => {
    disabledSources = new Set(SOURCE_NAMES.slice(80));
    // Keep the handler context and settings callback observing the replacement
    // set, matching a fresh browser profile at exactly the legacy boundary.
    const oldController = settingsController;
    oldController.destroy();
    manager.destroy();

    const ctx = {
      container: document.createElement('div'),
      panelSettings: {},
      disabledSources,
      newsCategoryPanelKeys: new Set<string>(),
      isDesktopApp: false,
      isDestroyed: false,
    } as unknown as ConstructorParameters<typeof EventHandlerManager>[0];
    manager = new EventHandlerManager(ctx, {
      loadAllData: vi.fn(async () => {}),
      updateSearchIndex: vi.fn(),
      applyPanelSettings: vi.fn(),
      openSearch: vi.fn(),
    } as never);
    vi.spyOn(manager, 'getAllSourceNames').mockReturnValue(SOURCE_NAMES);
    manager.setupUnifiedSettings();
    settingsController = ctx.unifiedSettings!;
    await settingsController.open('sources');

    const source = document.querySelector<HTMLButtonElement>(
      '#usSourceToggles .source-toggle-item[data-source="CSM source 081"]',
    );
    expect(source).not.toBeNull();
    source!.click();

    expect(disabledSources.has('CSM source 081')).toBe(false);
    expect(document.querySelector('#usSourcesCounter')?.textContent).toContain('81');
  });
});

describe('CSM full edition gates', () => {
  it('does not clamp panels at the former 40-panel limit', () => {
    const settings = Object.fromEntries(Array.from({ length: 45 }, (_, index) => [
      `panel-${index}`,
      { name: `Panel ${index}`, enabled: true, priority: index },
    ]));

    const reconciled = enforceFreePanelLimit(settings, false);

    expect(Object.values(reconciled).filter((panel) => panel.enabled)).toHaveLength(45);
    expect(Object.values(reconciled).some((panel) => panel.proGated)).toBe(false);
  });

  it('allows a premium catalog panel without entitlement and without the panel cap', () => {
    const panelSettings = Object.fromEntries(Array.from({ length: 40 }, (_, index) => [
      `existing-${index}`,
      { name: `Existing ${index}`, enabled: true, priority: index },
    ]));
    panelSettings['daily-market-brief'] = {
      name: 'Daily Market Brief', enabled: false, priority: 1, premium: 'locked',
    };

    expect(isPanelEntitled('daily-market-brief', panelSettings['daily-market-brief'], false)).toBe(true);
    expect(evaluateSetPanelEnabled({
      panelId: 'daily-market-brief',
      enabled: true,
      panelSettings,
      variant: 'full',
      isPro: false,
      fullEdition: true,
    })).toMatchObject({ ok: true, effectiveEnabled: true });
  });

  it('exposes export, dashboard tabs, and playback without plan entitlements', () => {
    const auth = { isPending: false, user: null } as never;

    expect(evaluateExportGate(auth, true)).toEqual({ locked: false, pendingActivation: false });
    expect(evaluateAvailableExportFormats(auth, true)).toEqual(['csv', 'json', 'pdf']);
    expect(evaluateTabCap(auth, 12, true)).toEqual({ allowed: true, cap: null, pendingActivation: false });
    expect(evaluatePlaybackGate(auth, true)).toBe('visible');
  });
});
