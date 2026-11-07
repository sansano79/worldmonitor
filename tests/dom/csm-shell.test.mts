import { beforeEach, expect, test, vi } from 'vitest';
import { mountCsm } from '../../src/csm/shell';

const mocks = vi.hoisted(() => ({ loadCsmPublicFeeds: vi.fn() }));

const readyFeeds = () => ({
  gdelt: {
    status: 'ready',
    fetchedAt: '2026-11-07T10:00:00.000Z',
    stale: false,
    items: [{ title: 'Country security article', source: 'News Wire', url: 'https://example.test/story', date: '20261107T100000Z' }],
  },
  telegram: {
    status: 'ready',
    fetchedAt: '2026-11-07T10:00:00.000Z',
    stale: false,
    items: [{ id: '1', source: 'telegram', channel: 'public_channel', channelTitle: 'Public Channel', url: 'https://t.me/public_channel/1', ts: '2026-11-07T10:00:00.000Z', text: 'Public signal', topic: 'geopolitics', tags: [], earlySignal: true }],
  },
});

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '<div id="app"></div>';
  mocks.loadCsmPublicFeeds.mockReset().mockResolvedValue(readyFeeds());
});

const mount = (root = document.getElementById('app')!) => mountCsm(root, mocks.loadCsmPublicFeeds);

test('CSM opens with only the approved sections and no demo or commercial content', () => {
  mount();
  const navigation = document.querySelector('nav')!;
  expect([...navigation.querySelectorAll('button')].map(button => button.textContent)).toEqual([
    'Resumen y mapa', 'Países y viajes', 'Alertas', 'Fuentes', 'Sedes', 'Ajustes',
  ]);
  expect(document.body.textContent).toContain('Mapa pendiente');
  expect(document.body.textContent).not.toMatch(/upgrade|suscripci[oó]n|iniciar sesi[oó]n|facturaci[oó]n|demo/i);
});

test('settings expose only connected panels and public data-source controls', () => {
  mount();
  [...document.querySelectorAll('button')].find(button => button.textContent === 'Ajustes')!.click();
  expect(document.querySelector('#csm-language-select')).not.toBeNull();
  expect(document.querySelector('.csm-theme-controls')).not.toBeNull();
  expect(document.querySelector('main')!.textContent).toContain('Funciones operativas pendientes');
  expect(document.querySelector('main')!.textContent).toContain('Paneles conectados');
  expect(document.querySelector('main')!.textContent).toContain('Fuentes públicas');
  expect(document.querySelectorAll('main input[type="checkbox"]')).toHaveLength(4);
  expect(document.querySelector('#csm-telegram-topic')).not.toBeNull();
  expect(document.querySelector('main')!.textContent).toContain('no aprueba la fuente para alertas corporativas');
  expect(document.querySelector('main')!.textContent).not.toMatch(/api keys|billing|upgrade|\bPRO\b/i);
});

test('panel and source selections change actual feed requests and visible content', async () => {
  const root = document.getElementById('app')!;
  mount(root);
  await vi.waitFor(() => expect(document.querySelector('.csm-feed-items a')?.textContent).toBe('Country security article'));

  [...document.querySelectorAll<HTMLButtonElement>('nav button')].find(button => button.textContent === 'Ajustes')!.click();
  const countryPanel = document.querySelector<HTMLInputElement>('#csm-panels-country-news')!;
  expect(countryPanel.checked).toBe(true);
  countryPanel.click();
  [...document.querySelectorAll<HTMLButtonElement>('nav button')].find(button => button.textContent === 'Resumen y mapa')!.click();
  expect(document.querySelector('[data-csm-feed-panel="country-news"]')).toBeNull();

  [...document.querySelectorAll<HTMLButtonElement>('nav button')].find(button => button.textContent === 'Ajustes')!.click();
  document.querySelector<HTMLInputElement>('#csm-panels-country-news')!.click();
  const gdeltSource = document.querySelector<HTMLInputElement>('#csm-sources-gdelt')!;
  expect(gdeltSource.checked).toBe(true);
  gdeltSource.click();
  [...document.querySelectorAll<HTMLButtonElement>('nav button')].find(button => button.textContent === 'Fuentes')!.click();
  await vi.waitFor(() => expect(document.querySelector('[data-csm-feed-panel="country-news"] .csm-feed-status')?.textContent).toContain('Activa el panel'));
  expect(mocks.loadCsmPublicFeeds.mock.calls.at(-1)?.[0]).toMatchObject({ sources: ['telegram'] });
});

test('country search selection is passed to the public query and survives remount', async () => {
  const root = document.getElementById('app')!;
  mount(root);
  [...document.querySelectorAll<HTMLButtonElement>('nav button')].find(button => button.textContent === 'Países y viajes')!.click();
  const country = document.querySelector<HTMLSelectElement>('#csm-country')!;
  country.value = 'UA';
  country.dispatchEvent(new Event('change', { bubbles: true }));
  expect(localStorage.getItem('csm-country')).toBe('UA');
  await vi.waitFor(() => expect(mocks.loadCsmPublicFeeds.mock.calls.at(-1)?.[0]).toMatchObject({ country: 'UA' }));
  expect(document.querySelector('[data-csm-feed-panel="country-news"] .csm-feed-items a')?.textContent).toBe('Country security article');

  mount(root);
  [...document.querySelectorAll<HTMLButtonElement>('nav button')].find(button => button.textContent === 'Países y viajes')!.click();
  expect(document.querySelector<HTMLSelectElement>('#csm-country')!.value).toBe('UA');
});

test('every CSM section remains free of commercial and demonstration content', () => {
  mount();
  for (const button of document.querySelectorAll<HTMLButtonElement>('nav button')) {
    button.click();
    expect(button.getAttribute('aria-current')).toBe('page');
    expect(document.querySelector('main')!.textContent).not.toMatch(/upgrade|suscripci[oó]n|facturaci[oó]n|\bPRO\b|\bdemo\b|api keys/i);
  }
});

test('theme preference changes the CSM view and survives a remount', () => {
  const root = document.getElementById('app')!;
  mount(root);
  [...document.querySelectorAll('button')].find(button => button.textContent === 'Ajustes')!.click();
  const light = [...document.querySelectorAll('button')].find(button => button.textContent === 'Tema claro');
  expect(light).toBeDefined();
  light!.click();
  expect(root.dataset.csmTheme).toBe('light');
  mount(root);
  expect(root.dataset.csmTheme).toBe('light');
});

test('language preference updates the full CSM shell and survives a remount', () => {
  const root = document.getElementById('app')!;
  mount(root);
  [...document.querySelectorAll('nav button')].find(button => button.textContent === 'Ajustes')!.click();
  const language = document.querySelector<HTMLSelectElement>('#csm-language-select')!;
  language.value = 'en';
  language.dispatchEvent(new Event('change', { bubbles: true }));

  expect(localStorage.getItem('csm-language')).toBe('en');
  expect(document.documentElement.lang).toBe('en');
  expect(document.title).toBe('CSM · Physical Security');
  expect(document.querySelector('h1')!.textContent).toBe('Settings');
  expect(document.querySelector('nav')!.textContent).toContain('Countries and travel');
  expect(document.querySelector('.csm-settings-status')!.textContent).toBe('Preference saved in this browser.');

  mount(root);
  [...document.querySelectorAll('nav button')].find(button => button.textContent === 'Settings')!.click();
  expect(document.querySelector('h1')!.textContent).toBe('Settings');
  expect(document.querySelector('#csm-language-select')).not.toBeNull();
  expect(document.querySelector('main')!.textContent).toContain('Operational features pending');
});
