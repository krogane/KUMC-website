import { test, expect } from "@playwright/test";

test("NF dates, editions and visitor information stay associated with the right activity", async ({ page, request }) => {
  await page.goto("/nf/2026/");
  await expect(page).toHaveTitle(/NF 2026｜京大マイクラワールド/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://www.kumc-club.net/nf/2026/");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", "https://www.kumc-club.net/og/nf-2026.jpg");
  expect((await request.get("/og/nf-2026.jpg")).ok()).toBe(true);
  expect(await (await request.get("/sitemap.xml")).text()).toContain("https://www.kumc-club.net/nf/2026/");

  const days = page.getByRole("list", { name: "各日の開催時間" }).getByRole("listitem");
  await expect(days).toHaveCount(4);
  for (let day = 0; day < 3; day++) await expect(days.nth(day)).toContainText("10:00〜18:00");
  await expect(days.last()).toContainText("11.23（月）10:00〜17:30");
  await expect(page.locator(".nf-venue")).toContainText("法経本館2階 第六教室");

  const mmo = page.getByRole("article", { name: "NFMMO", exact: true });
  await expect(mmo).toContainText("Java版 26.3");
  await expect(mmo).toContainText("1〜4人");
  await expect(mmo).toContainText("15歳以上推奨");
  await expect(mmo).toContainText("数時間〜");
  await expect(mmo).not.toContainText("制作：KUMC＆むっつん");
  const drift = page.getByRole("article", { name: "Drift", exact: true });
  for (const text of ["Java版 1.20.1", "1〜3人", "16歳以上推奨", "1回約45分", "公開予定：11月20〜22日", "晶石"]) {
    await expect(drift).toContainText(text);
  }
  const goods = page.getByRole("article", { name: "オリジナルグッズのガチャガチャ", exact: true });
  await expect(goods).not.toContainText(/\d+円/);
  const treasure = page.getByRole("article", { name: "体験型ミニゲーム", exact: true });
  await expect(treasure).toContainText("会場のPCで体験・有料");
  await expect(treasure).not.toContainText(/\d+円/);
  await expect(page.getByRole("article", { name: "会報誌「KU匠」", exact: true })).not.toContainText(/\d+円/);
  await expect(page.locator(".nf-connection")).toContainText("接続情報は11月20日公開予定。");
  await expect(page.locator(".nf-treasure-flight figcaption")).toHaveText("体験型ミニゲームのプレイ画面");
  await expect(page.locator(".nf-online-image figcaption")).toHaveText("オンライン企画の紹介画像");
  expect(await page.locator(".nf-page").evaluate(el => el.getAnimations({ subtree: true }).length)).toBe(0);
  expect(await page.content()).not.toMatch(/drive\.google\.com|docs\.google\.com|discord\.gg|ジェットコースター/);
});

test("NF homepage, keyboard anchors and destinations work without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  try {
    await page.goto("http://127.0.0.1:4321/");
    await expect(page.locator(".hero + .nf-feature")).toBeVisible();
    const entry = page.getByRole("link", { name: "NF特設ページを見る", exact: true });
    await entry.focus();
    await expect(entry).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/nf\/2026\/$/);
    await expect(page.getByRole("heading", { name: "京大マイクラワールド", exact: true })).toBeVisible();

    for (const [label, id] of [["会場で楽しめる企画", "nf-onsite"], ["オンライン企画", "nf-online"], ["会場案内", "nf-access"]]) {
      const link = page.getByRole("navigation", { name: "NFの企画と会場案内" }).getByRole("link", { name: label, exact: true });
      await link.focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      await expect(page.locator(`#${id}`)).toBeInViewport();
    }

    for (const [label, url] of [
      ["構内マップで場所を見る", "https://www.kyoto-u.ac.jp/ja/access/campus/yoshida/map6r-y"],
      ["参加に関する最新情報（X）", "https://x.com/KUMC_X"],
    ]) {
      // Verify actual navigation without depending on a third-party response.
      await context.route(url, route => route.fulfill({ contentType: "text/html", body: "<p>External destination</p>" }));
      await page.getByRole("link", { name: label, exact: true }).focus();
      const popupPromise = context.waitForEvent("page");
      await page.keyboard.press("Enter");
      const popup = await popupPromise;
      await expect(popup).toHaveURL(url);
      await popup.close();
      await expect(page).toHaveURL(/\/nf\/2026\//);
    }
    await page.locator("#nf-access").getByRole("link", { name: "お問い合わせ", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/contact\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  } finally {
    await context.close();
  }
});
