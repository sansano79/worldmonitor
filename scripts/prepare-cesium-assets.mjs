import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

if (process.env.VITE_CSM_MODE !== 'true') {
  rmSync(resolve('public/cesium'), { recursive: true, force: true });
  console.log('Skipping local Cesium assets outside the CSM build.');
  process.exit(0);
}

const source = resolve('node_modules/@cesium/engine/Build');
const target = resolve('public/cesium');

if (!existsSync(source)) {
  throw new Error('Cesium build assets are missing. Install dependencies before preparing the CSM map.');
}

mkdirSync(target, { recursive: true });
for (const directory of ['Assets', 'ThirdParty', 'Widgets', 'Workers']) {
  const from = resolve(source, directory);
  if (!existsSync(from)) throw new Error(`Missing Cesium runtime directory: ${directory}`);
  rmSync(resolve(target, directory), { recursive: true, force: true });
  cpSync(from, resolve(target, directory), { recursive: true });
}

console.log('Prepared local Cesium runtime assets in public/cesium.');
