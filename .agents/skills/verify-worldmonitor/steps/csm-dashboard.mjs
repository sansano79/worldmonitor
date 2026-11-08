import { seedProfile, waitForBoot, waitForMap } from './_profile.mjs';

const CSM_LAYERS = new Set([
  'seidorOffices', 'conflicts', 'natural', 'weather', 'protests', 'fires',
  'diseaseOutbreaks', 'displacement', 'ucdpEvents', 'military',
]);

export default async function ({ page, base, shot, log }) {
  const mobile = process.env.WM_VERIFY_MOBILE === '1';
  if (mobile) await page.setViewportSize({ width: 390, height: 844 });
  await seedProfile(page);
  await page.goto(`${base}/dashboard`, { waitUntil: 'domcontentloaded' });
  await waitForBoot(page);
  if (mobile) await page.locator('.map-collapse-btn').click();
  const renderer = await waitForMap(page);
  log('map renderer:', renderer);

  const officeToggle = page.locator('.layer-toggle[data-layer="seidorOffices"]');
  await officeToggle.waitFor({ state: 'visible', timeout: 30_000 });
  const enabled = () => page.evaluate((svg) => {
    const control = document.querySelector('.layer-toggle[data-layer="seidorOffices"]');
    return svg ? control?.classList.contains('active') : control?.querySelector('input')?.checked;
  }, renderer === 'svg');
  if (!(await enabled())) throw new Error('CSM must start with the public SEIDOR directory enabled');

  const layerKeys = await page.locator('.layer-toggle[data-layer]').evaluateAll(elements =>
    elements.map(element => element.getAttribute('data-layer')),
  );
  const unexpectedLayers = layerKeys.filter(key => !CSM_LAYERS.has(key));
  if (unexpectedLayers.length) throw new Error(`Unexpected CSM map layers: ${unexpectedLayers.join(', ')}`);
  log('CSM map controls:', layerKeys.join(', '));

  if (renderer === 'svg') {
    const markers = page.locator('.seidor-office-marker');
    await markers.first().waitFor({ state: 'visible', timeout: 30_000 });
    const count = await markers.count();
    log('public office markers:', count);
    if (count !== 78) throw new Error(`expected 78 public SEIDOR locations, received ${count}`);
    const marker = page.locator('.seidor-office-marker[aria-label="SEIDOR Houston"]');
    await marker.waitFor({ state: 'visible' });
    await marker.evaluate(element => element.click());
    const popup = page.locator('.map-popup');
    await popup.getByText(/mapped building or site/).waitFor();
    await popup.getByRole('link', { name: /Coordinate reference: OpenStreetMap contributors/ }).waitFor();
    log('office popup: Houston, building precision and OSM reference shown');
    await shot('csm-office-detail');
    await page.locator('.popup-close').first().click();
  }
  await shot('csm-dashboard-map');

  const absentAuthControls = ['#authWidgetMount', '#mobileAuthWidgetMount', '#mobileAuthFallback', 'a[href*="/pro#pricing"]', '.panel-locked-cta', '.legal-links-row', '#proBannerSlot', '.export-panel-container', '.pizzint-indicator', '#missionPresetMount', '#missionPresetBtn', '#mobileMenuMission', '.mission-preset-popover'];
  for (const selector of absentAuthControls) {
    if (await page.locator(selector).count()) throw new Error(`unexpected login/PRO UI: ${selector}`);
  }

  if (mobile) {
    await page.locator('.mobile-tab[data-mobile-tab="more"]').click();
    await page.locator('#mobileMenuSettings').click();
  } else {
    await page.locator('#unifiedSettingsBtn').click();
  }
  await page.locator('#us-tab-panels').waitFor({ state: 'visible' });
  for (const selector of ['#us-tab-notifications', '#us-tab-api-keys', '#us-tab-billing', '#us-tab-embeds', '#us-tab-mcp-clients']) {
    if (await page.locator(selector).count()) throw new Error(`unexpected settings tab: ${selector}`);
  }
  const panelKeys = await page.locator('#usPanelToggles .panel-toggle-item').evaluateAll(elements =>
    elements.map(element => element.getAttribute('data-panel')),
  );
  if (panelKeys.length !== 13 || panelKeys.some(key => ![
    'map', 'live-news', 'threat-timeline', 'strategic-posture', 'cii', 'strategic-risk',
    'intel', 'security-advisories', 'telegram-intel', 'ukmto-incidents', 'satellite-fires',
    'disease-outbreaks', 'cross-source-signals',
  ].includes(key))) {
    throw new Error(`unexpected CSM settings panel catalog: ${panelKeys.join(', ')}`);
  }
  await page.locator('#us-tab-sources').click();
  await shot('csm-settings-sources');
  log('CSM settings panels:', panelKeys.join(', '));
  return { renderer, panelCount: panelKeys.length, layerKeys };
}
