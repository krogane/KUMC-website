import { test, expect } from "@playwright/test";

const sdkURL = "https://platform.twitter.com/widgets.js";
// Real SDK readiness is asynchronous; its script load alone is not sufficient.
const sdk = `window.twttr = { ready(callback) {
  window.__readyX = () => callback({ widgets: { createTimeline(source, mount, options) {
    window.__xCalls = (window.__xCalls || 0) + 1;
    window.__xSource = source;
    window.__xOptions = options;
    if (window.__xCalls === 1 && window.__xFail === 'empty') return Promise.resolve(undefined);
    if (window.__xCalls === 1 && window.__xFail === 'reject') return Promise.reject(new Error('unavailable'));
    if (window.__xCalls === 1 && window.__xFail === 'timeout') return new Promise(resolve => {
      window.__finishOldX = () => {
        const frame = document.createElement('iframe'); mount.append(frame); resolve(frame);
      };
    });
    const frame = document.createElement('iframe');
    frame.title = 'KUMC X timeline';
    mount.append(frame);
    return Promise.resolve(frame);
  } } });
  if (!window.__delayX) window.__readyX();
} };`;

test("automatically waits for SDK readiness and displays the configured profile on desktop and mobile", async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route(sdkURL, route => route.fulfill({contentType: 'application/javascript', body: sdk}));
  await page.addInitScript(() => { (window as any).__delayX = true; });
  for (const width of [1280, 390]) {
    await page.setViewportSize({width, height: 900});
    await page.goto('/');
    await expect(page).toHaveTitle(/KUMC/);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#x-status')).toHaveText('Xから読み込んでいます…');
    await expect.poll(() => page.evaluate(() => typeof (window as any).__readyX)).toBe('function');
    await expect(page.locator('#x-timeline iframe')).toHaveCount(0);
    await page.evaluate(() => (window as any).__readyX());
    await expect(page.locator('#x-timeline iframe')).toBeVisible();
    await expect(page.locator('#x-placeholder')).toBeHidden();
    await expect(page.locator('#x-timeline')).toHaveAttribute('aria-busy', 'false');
    expect(await page.evaluate(() => (window as any).__xSource)).toEqual({sourceType:'profile', screenName:'KUMC_X'});
    expect(await page.evaluate(() => (window as any).__xOptions.dnt)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  expect(errors).toEqual([]);
});

for (const failure of ['empty', 'reject', 'timeout']) {
  test(`recovers from ${failure} without duplicate widgets or SDK scripts`, async ({page}) => {
    await page.clock.install();
    await page.addInitScript(value => { (window as any).__xFail = value; }, failure);
    await page.route(sdkURL, route => route.fulfill({contentType: 'application/javascript', body: sdk}));
    await page.goto('/');
    await expect.poll(() => page.evaluate(() => (window as any).__xCalls)).toBe(1);
    if (failure === 'timeout') await page.clock.fastForward(21000);
    await expect(page.locator('#x-status')).toContainText('表示できませんでした');
    await expect(page.getByRole('link', {name: 'プロフィールを見る'})).toBeVisible();
    await page.getByRole('button', {name: 'Xの投稿を再読み込み'}).click();
    await expect(page.locator('#x-timeline iframe')).toBeVisible();
    if (failure === 'timeout') await page.evaluate(() => (window as any).__finishOldX());
    await expect(page.locator('#x-timeline iframe')).toHaveCount(1);
    await expect(page.locator('#x-placeholder')).toBeHidden();
    await expect(page.locator(`script[src="${sdkURL}"]`)).toHaveCount(1);
  });
}

test("SDK readiness timeout offers a retry that loads a fresh script", async ({page}) => {
  await page.clock.install();
  let requests = 0;
  await page.route(sdkURL, route => route.fulfill({contentType: 'application/javascript', body: ++requests === 1 ? 'window.twttr = {ready() {}};' : sdk}));
  await page.goto('/');
  await expect.poll(() => requests).toBe(1);
  await page.clock.fastForward(16000);
  await expect(page.locator('#x-status')).toContainText('表示できませんでした');
  await page.getByRole('button', {name: 'Xの投稿を再読み込み'}).click();
  await expect(page.locator('#x-timeline iframe')).toBeVisible();
  expect(requests).toBe(2);
});
