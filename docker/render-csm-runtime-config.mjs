import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PUBLIC_CONFIG_PATH = '/usr/share/nginx/html/csm-runtime-config.js';

export function renderCsmRuntimeConfig(rawToken) {
  const token = typeof rawToken === 'string' ? rawToken.trim() : '';
  if (token.length > 4096 || /[\u0000-\u001f\u007f]/.test(token)) {
    throw new Error('Invalid CSM Cesium ion client token configuration');
  }
  const config = token ? { cesiumIonToken: token } : {};
  const serialized = JSON.stringify(config).replaceAll('<', '\\u003c');
  return `window.__WM_CSM_CONFIG__ = Object.freeze(${serialized});\n`;
}

async function main() {
  await writeFile(PUBLIC_CONFIG_PATH, renderCsmRuntimeConfig(process.env.CSM_CESIUM_ION_TOKEN), { mode: 0o644 });
}

const entrypoint = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (entrypoint === import.meta.url) await main();
