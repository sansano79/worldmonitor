import { seedProfile, waitForBoot, waitForMap } from './_profile.mjs';

export default async function ({ page, base, shot, log }) {
  if (process.env.WM_VERIFY_MOBILE === '1') await page.setViewportSize({ width: 390, height: 844 });
  await seedProfile(page);
  await page.goto(`${base}/dashboard`, { waitUntil: 'domcontentloaded' });
  await waitForBoot(page);
  if (process.env.WM_VERIFY_MOBILE === '1') await page.locator('.map-collapse-btn').click();
  const renderer = await waitForMap(page);
  const toggle = page.locator('.layer-toggle[data-layer="seidorOffices"]');
  await toggle.waitFor({ state: 'attached' });
  if (!(await toggle.isVisible())) {
    const style = await toggle.evaluate(element => {
      const parent = element.parentElement;
      return { id: parent?.id, display: parent && getComputedStyle(parent).display,
        visibility: getComputedStyle(element).visibility, rect: element.getBoundingClientRect().toJSON() };
    });
    throw new Error(`SEIDOR control is hidden: ${JSON.stringify(style)}`);
  }

  const enabled = () => page.evaluate((svg) => {
    const control = document.querySelector('.layer-toggle[data-layer="seidorOffices"]');
    return svg ? control?.classList.contains('active') : control?.querySelector('input')?.checked;
  }, renderer === 'svg');
  if (await enabled()) throw new Error('SEIDOR offices must start off');
  await shot('off');

  // The SVG fallback starts at its nine-layer cap. Make room through the same
  // public control a user would use before enabling another layer.
  if (renderer === 'svg' && await toggle.isDisabled()) {
    await page.locator('.layer-toggle[data-layer="conflicts"]').click();
    await toggle.waitFor({ state: 'visible' });
    if (await toggle.isDisabled()) throw new Error('SEIDOR layer stayed disabled after freeing a slot');
  }

  await toggle.click();
  await page.waitForFunction((svg) => {
    const control = document.querySelector('.layer-toggle[data-layer="seidorOffices"]');
    const on = svg ? control?.classList.contains('active') : control?.querySelector('input')?.checked;
    return on && JSON.parse(localStorage.getItem('worldmonitor-layers') ?? '{}').seidorOffices === true
      && (new URL(location.href).searchParams.get('layers') ?? '').split(',').includes('seidorOffices');
  }, renderer === 'svg');

  if (renderer === 'svg') {
    await page.locator('.seidor-office-marker').first().waitFor({ state: 'visible' });
    const markerCount = await page.locator('.seidor-office-marker').count();
    log('SEIDOR markers:', markerCount);
    if (markerCount !== 78) throw new Error(`expected 78 SEIDOR markers, got ${markerCount}`);
    const horizontalSpan = await page.locator('.seidor-office-marker').evaluateAll(markers => {
      const xs = markers.map(marker => marker.getBoundingClientRect().x);
      return Math.max(...xs) - Math.min(...xs);
    });
    if (horizontalSpan < 200) throw new Error(`SEIDOR markers did not spread across the map: ${horizontalSpan}px`);
    // Barcelona and Vic overlap at world zoom; choose an isolated office.
    await page.locator('.seidor-office-marker[aria-label="SEIDOR Johannesburg"]').click();
    await page.locator('.map-popup').getByText('Map position is approximate (city centre).').waitFor();
  } else if (renderer === 'deckgl') {
    // The actual picked point is checked in a headed GPU drive.
    log('deck.gl layer toggled; marker picking requires headed GPU drive');
  }
  await shot('on');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForBoot(page);
  await waitForMap(page);
  if (!(await enabled())) throw new Error('SEIDOR offices did not persist across reload');
  await shot('restored');
  return { renderer };
}
