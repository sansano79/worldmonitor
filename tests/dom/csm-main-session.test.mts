import { beforeEach, expect, test, vi } from 'vitest';

const state = vi.hoisted(() => ({ calls: [] as string[], desktop: false }));

vi.mock('@/services/wm-session', () => ({
  installWmSessionFetchInterceptor: () => { state.calls.push('install-interceptor'); },
  ensureWmSession: () => { state.calls.push('mint-session'); return Promise.resolve(false); },
}));

vi.mock('@/csm/shell', () => ({
  mountCsm: () => { state.calls.push('mount-shell'); },
}));

vi.mock('@/services/runtime', () => ({
  isDesktopRuntime: () => state.desktop,
}));

beforeEach(async () => {
  await vi.resetModules();
  state.calls.length = 0;
  state.desktop = false;
  document.body.innerHTML = '<div id="app"></div>';
});

test('standalone CSM installs the technical session before mounting public-data panels', async () => {
  await import('../../src/csm/main');
  expect(state.calls).toEqual(['install-interceptor', 'mint-session', 'mount-shell']);
});

test('standalone CSM preserves the native desktop credential path', async () => {
  state.desktop = true;
  await import('../../src/csm/main');
  expect(state.calls).toEqual(['mount-shell']);
});
