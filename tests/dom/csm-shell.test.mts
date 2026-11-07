import { beforeEach, expect, test } from 'vitest';
import { mountCsm } from '../../src/csm/shell';

beforeEach(() => { localStorage.clear(); document.body.innerHTML = '<div id="app"></div>'; });

test('CSM opens with only the approved sections and no demo or commercial content', () => {
  mountCsm(document.getElementById('app')!);
  const navigation = document.querySelector('nav')!;
  expect([...navigation.querySelectorAll('button')].map(button => button.textContent)).toEqual([
    'Resumen y mapa', 'Países y viajes', 'Alertas', 'Fuentes', 'Sedes', 'Ajustes',
  ]);
  expect(document.body.textContent).toContain('Sin señales disponibles');
  expect(document.body.textContent).not.toMatch(/upgrade|suscripci[oó]n|iniciar sesi[oó]n|facturaci[oó]n|demo/i);
});

test('settings expose only effective local controls and state the operational gaps', () => {
  mountCsm(document.getElementById('app')!);
  [...document.querySelectorAll('button')].find(button => button.textContent === 'Ajustes')!.click();
  expect(document.querySelector('#csm-language-select')).not.toBeNull();
  expect(document.querySelector('.csm-theme-controls')).not.toBeNull();
  expect(document.querySelector('main')!.textContent).toContain('Funciones operativas pendientes');
  expect(document.querySelector('main')!.textContent).toContain('no están conectados a esta entrada');
  expect(document.querySelector('main')!.querySelectorAll('select')).toHaveLength(1);
  expect(document.querySelector('main')!.textContent).not.toMatch(/paneles disponibles|fuentes disponibles|seleccionar fuentes/i);
  expect(document.querySelector('main')!.textContent).not.toMatch(/api keys|billing|upgrade|\bPRO\b/i);
});

test('every CSM section remains free of commercial and demonstration content', () => {
  mountCsm(document.getElementById('app')!);
  for (const button of document.querySelectorAll<HTMLButtonElement>('nav button')) {
    button.click();
    expect(button.getAttribute('aria-current')).toBe('page');
    expect(document.querySelector('main')!.textContent).not.toMatch(/upgrade|suscripci[oó]n|facturaci[oó]n|\bPRO\b|\bdemo\b|api keys/i);
  }
});

test('theme preference changes the CSM view and survives a remount', () => {
  const root = document.getElementById('app')!;
  mountCsm(root);
  [...document.querySelectorAll('button')].find(button => button.textContent === 'Ajustes')!.click();
  const light = [...document.querySelectorAll('button')].find(button => button.textContent === 'Tema claro');
  expect(light).toBeDefined();
  light!.click();
  expect(root.dataset.csmTheme).toBe('light');
  mountCsm(root);
  expect(root.dataset.csmTheme).toBe('light');
});

test('language preference updates the full CSM shell and survives a remount', () => {
  const root = document.getElementById('app')!;
  mountCsm(root);
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

  mountCsm(root);
  [...document.querySelectorAll('nav button')].find(button => button.textContent === 'Settings')!.click();
  expect(document.querySelector('h1')!.textContent).toBe('Settings');
  expect(document.querySelector('#csm-language-select')).not.toBeNull();
  expect(document.querySelector('main')!.textContent).toContain('Operational features pending');
});
