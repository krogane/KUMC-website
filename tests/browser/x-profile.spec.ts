import { test, expect } from "@playwright/test";

for (const path of ["/", "/news/"]) {
  test(`${path} profile opens a new tab without loading X on the page`, async ({ page, context }) => {
    const requests: string[] = [];
    await context.route(/^https:\/\//, route => {
      requests.push(route.request().url());
      return route.fulfill({ contentType: "text/html", body: "<p>Profile destination</p>" });
    });
    await page.goto(path);
    const link = page.locator('.x-profile a');
    await expect(link).toBeVisible();
    await expect(page.locator('iframe')).toHaveCount(0);
    expect(requests).toEqual([]);
    const popupPromise = context.waitForEvent('page');
    await link.click();
    const popup = await popupPromise;
    await expect(popup).toHaveURL('https://x.com/KUMC_X');
    await expect(page).toHaveURL(`http://127.0.0.1:4321${path}`);
    await popup.close();
  });
}

test('mobile home and news show the requested number of entries', async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.locator('.home-records li:visible')).toHaveCount(width === 390 ? 3 : 5);
    const dates = await page.locator('.home-records time').evaluateAll(nodes => nodes.map(n => n.getAttribute('datetime')));
    expect(dates).toEqual([...dates].sort().reverse());
    await expect(page.locator('.home-works .work-card:visible')).toHaveCount(width === 390 ? 2 : 3);
    await page.goto('/works/');
    await expect(page.locator('.work-card:visible')).toHaveCount(4);
    await page.goto('/news/');
    for (const feed of await page.locator('.news-feeds .feed').all()) {
      const total = await feed.locator('.news-list li').count();
      await expect(feed.locator('.news-list li:visible')).toHaveCount(width === 390 ? Math.min(total, 3) : total);
    }
  }
});
