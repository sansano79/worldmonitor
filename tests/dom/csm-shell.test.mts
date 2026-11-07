import { beforeEach, expect, test } from 'vitest';
import { mountCsm } from '../../src/csm/shell';

beforeEach(() => { document.body.innerHTML = '<div id="app"></div>'; });

test('CSM opens with only the approved sections and no demo or commercial content', () => {
  mountCsm(document.getElementById('app')!);
  const navigation = document.querySelector('nav')!;
  expect([...navigation.querySelectorAll('button')].map(button => button.textContent)).toEqual([
    'Resumen y mapa', 'Países y viajes', 'Alertas', 'Fuentes', 'Sedes', 'Ajustes',
  ]);
  expect(document.body.textContent).toContain('Sin señales disponibles');
  expect(document.body.textContent).not.toMatch(/upgrade|suscripci[oó]n|iniciar sesi[oó]n|facturaci[oó]n|demo/i);
});

test('settings show operational options and explain unconfigured capabilities', () => {
  mountCsm(document.getElementById('app')!);
  [...document.querySelectorAll('button')].find(button => button.textContent === 'Ajustes')!.click();
  expect(document.querySelector('main')!.textContent).toContain('Fuentes aprobadas');
  expect(document.querySelector('main')!.textContent).toContain('Configuración pendiente');
  expect(document.querySelector('main')!.textContent).not.toMatch(/api keys|billing|upgrade|\bPRO\b/i);
});
