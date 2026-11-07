import { expect, test } from 'vitest';
import { DEFAULT_MAP_LAYERS, MOBILE_DEFAULT_MAP_LAYERS } from '../../src/config/variants/full';
import { DEFAULT_MAP_LAYERS as APP_LAYERS, MOBILE_DEFAULT_MAP_LAYERS as APP_MOBILE_LAYERS } from '../../src/config/panels';

test('the general variant keeps its original opt-in office layer', () => {
  expect(DEFAULT_MAP_LAYERS.seidorOffices).not.toBe(true);
  expect(MOBILE_DEFAULT_MAP_LAYERS.seidorOffices).not.toBe(true);
  expect(APP_LAYERS.seidorOffices).not.toBe(true);
  expect(APP_MOBILE_LAYERS.seidorOffices).not.toBe(true);
});
