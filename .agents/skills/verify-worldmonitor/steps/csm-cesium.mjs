import { seedProfile, waitForBoot, waitForMap } from './_profile.mjs';

export default async function ({ page, base, shot, log }) {
  const mobile = process.env.WM_VERIFY_MOBILE === '1';
  await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 });
  await seedProfile(page);
  await page.goto(`${base}/dashboard`, { waitUntil: 'domcontentloaded' });
  await waitForBoot(page);
  if (mobile) await page.locator('.map-collapse-btn').click();
  const initialRenderer = await waitForMap(page);
  log('2D renderer before switch:', initialRenderer);
  await shot('2d-before');

  await page.locator('#mapDimensionToggle [data-mode="globe"]').click();
  await page.waitForFunction(() => document.querySelector('#mapContainer')?.dataset.csmCesiumReady === 'true', { timeout: 60_000 });
  const proof = await page.locator('#mapContainer').evaluate((element) => ({
    renderer: element.dataset.mapRenderer,
    offices: Number(element.dataset.csmOfficeCount),
    canvas: Boolean(element.querySelector('.cesium-widget canvas, .cesium-viewer canvas')),
    controls: [...element.querySelectorAll('.cesium-csm-layer-row span:last-child')].map((item) => item.textContent),
    viewport: element.getBoundingClientRect().toJSON(),
    controlsViewport: element.querySelector('.cesium-csm-layer-control')?.getBoundingClientRect().toJSON(),
  }));
  if (proof.renderer !== 'cesium' || proof.offices !== 78 || !proof.canvas) {
    throw new Error(`Cesium runtime or all 78 office markers missing: ${JSON.stringify(proof)}`);
  }
  if (proof.controls.length !== 10) throw new Error(`expected ten CSM layer controls: ${proof.controls.join(', ')}`);
  if (mobile && proof.controlsViewport?.right > proof.viewport.right + 1) throw new Error('Layer controls extend beyond the mobile map viewport');
  log('Cesium map:', JSON.stringify(proof));
  await shot('cesium-ready');

  if (!mobile) {
    const mapRect = proof.viewport;
    await page.mouse.click(mapRect.x + mapRect.width * 0.49, mapRect.y + mapRect.height * 0.26);
    const officePopup = page.locator('.map-popup');
    await officePopup.waitFor({ state: 'visible', timeout: 5_000 });
    const officePopupText = await officePopup.innerText();
    if (!officePopupText.includes('SEIDOR')) throw new Error(`3D office marker did not open its SEIDOR details: ${officePopupText}`);
    log('Selected 3D office marker:', officePopupText.slice(0, 180));
    await shot('cesium-office-popup');
    await page.locator('.map-popup .popup-close').click();
  }

  const officeToggle = page.locator('.cesium-csm-layer-row input[data-layer="seidorOffices"]');
  await officeToggle.uncheck();
  if (await officeToggle.evaluate((input) => input.checked)) throw new Error('SEIDOR offices layer did not turn off');
  await officeToggle.check();
  if (!(await officeToggle.evaluate((input) => input.checked))) throw new Error('SEIDOR offices layer did not turn on');
  await shot('cesium-offices-enabled');

  await page.locator('#mapDimensionToggle [data-mode="flat"]').click();
  await page.waitForFunction(() => !document.querySelector('#mapContainer')?.dataset.csmCesiumReady, { timeout: 30_000 });
  const flatRenderer = await waitForMap(page);
  if (flatRenderer !== initialRenderer) log(`2D fallback renderer changed from ${initialRenderer} to ${flatRenderer}`);
  await shot('2d-restored');
  return { mobile, initialRenderer, cesium: proof, flatRenderer };
}
