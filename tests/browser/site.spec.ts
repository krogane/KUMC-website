import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const routes = [
  "/",
  "/about/",
  "/activities/",
  "/works/",
  "/works/kyoto-campus/",
  "/works/treasure-run/",
  "/works/gunfight/",
  "/works/kyoto-athletic/",
  "/achievements/",
  "/achievements/nf-2025/",
  "/achievements/bosai-camp-2026/",
  "/join/",
  "/contact/",
  "/collaboration/",
  "/news/",
  "/privacy/",
  "/404.html",
];
test("all routes render, links/images work, no serious accessibility issues", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const path of routes) {
    await page.goto(path);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toBeVisible();
    expect(await page.title()).toContain("KUMC");
    for (const img of await page.locator("img").all()) {
      await img.scrollIntoViewIfNeeded();
      await expect
        .poll(
          () =>
            img.evaluate(
              (i) =>
                (i as HTMLImageElement).complete &&
                (i as HTMLImageElement).naturalWidth > 0,
            ),
          { message: path + " image loaded" },
        )
        .toBe(true);
    }
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      result.violations.filter((v) =>
        ["serious", "critical"].includes(v.impact || ""),
      ),
      `${path} accessibility`,
    ).toEqual([]);
  }
  expect(errors).toEqual([]);
});
test("responsive widths and core navigation, focus return, filtering", async ({
  page,
}) => {
  for (const width of [320, 360, 390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "/",
      "/works/",
      "/join/",
      "/contact/",
      "/collaboration/",
    ]) {
      await page.goto(path);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${width} ${path}`,
      ).toBe(true);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator(".mobile-menu summary").click();
  await expect(page.locator("#mobile-navigation")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".mobile-menu summary")).toBeFocused();
  await expect(page.locator("#mobile-navigation")).not.toBeVisible();
  await page
    .locator(".hero")
    .getByRole("link", { name: "作品を見る", exact: true })
    .click();
  await page.getByRole("button", { name: "建築", exact: true }).click();
  await expect(page.locator(".work-card:visible")).toHaveCount(1);
  await page.locator(".work-card:visible a").click();
  await expect(page).toHaveURL(/works\/kyoto-campus\//);
  await expect(
    page.getByRole("link", { name: "Java版の配布ページ" }),
  ).toHaveAttribute("href", "https://minecraft-mcworld.com/111488/");
  await page.reload();
  await expect(page.locator("h1")).toHaveText("京大再現マップ");
});
test("preview never contacts Google or X until the explicit X action; failure preserves profile link", async ({
  page,
}) => {
  const external: string[] = [];
  await page.route(/^https:\/\//, (route) => {
    external.push(route.request().url());
    return route.abort();
  });
  await page.goto("/");
  await page.locator("[data-consent-open]").click();
  await page.getByRole("button", { name: "解析を許可", exact: true }).click();
  await page.waitForTimeout(250);
  expect(external).toEqual([]);
  await page.getByRole("button", { name: "Xの投稿を表示" }).click();
  await expect(page.locator("#x-status")).toContainText("表示できませんでした");
  expect(
    external.some((x) => x.includes("platform.twitter.com/widgets.js")),
  ).toBe(true);
  await expect(
    page.getByRole("link", { name: "プロフィールを見る" }),
  ).toBeVisible();
  expect(external.some((x) => /google/.test(x))).toBe(false);
});
test("JS disabled still exposes content, menu, FAQ, links and static feeds", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4321/");
  await expect(page.locator(".feed .news-list li")).not.toHaveCount(0);
  await page.locator(".mobile-menu summary").click();
  await page
    .locator("#mobile-navigation")
    .getByRole("link", { name: "入会方法", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "メールで入会相談" }),
  ).toBeVisible();
  await page.locator(".faq-item summary").first().click();
  await expect(page.locator(".faq-item").first()).toHaveAttribute("open", "");
  await context.close();
});
