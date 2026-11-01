import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const picker = (page: Page) => page.locator('.desktop-nav [data-theme-toggle]');
const expectTheme = async (page: Page, theme: "light" | "dark") => {
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
  await expect(page.locator("html")).toHaveCSS("color-scheme", theme);
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    "content",
    theme === "dark" ? "#181818" : "#48689e",
  );
};

test("device default and current-theme toggle survive navigation, reload and tabs", async ({ page, context }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await expect(page.locator('.desktop-nav button')).toHaveCount(1);
  await expect(page.locator('[data-theme-value="auto"]')).toHaveCount(0);
  await expectTheme(page, "light");
  await expect(picker(page).locator('[data-theme-icon="light"]')).toBeVisible();
  await page.emulateMedia({ colorScheme: "dark" });
  await expectTheme(page, "dark");
  await expect(picker(page).locator('[data-theme-icon="dark"]')).toBeVisible();
  await picker(page).click();
  await expectTheme(page, "light");
  await page.emulateMedia({ colorScheme: "light" });
  await page.emulateMedia({ colorScheme: "dark" });
  await expectTheme(page, "light");
  await picker(page).click();
  expect(await page.evaluate(() => localStorage.getItem("kumc-theme"))).toBe("dark");
  await page.locator('.desktop-nav a[href="/works/"]').click();
  await expectTheme(page, "dark");
  await page.reload();
  await expect(picker(page)).toHaveAttribute("aria-label", /現在はダークモード/);
  const other = await context.newPage();
  await other.emulateMedia({ colorScheme: "light" });
  await other.goto("/contact/");
  await expectTheme(other, "dark");
  await picker(page).click();
  await expectTheme(other, "light");
  await expect(picker(other).locator('[data-theme-icon="light"]')).toBeVisible();
  await picker(page).click();
  await page.evaluate(() => localStorage.removeItem("kumc-theme"));
  await expectTheme(other, "light");
  await other.close();
});

test("saved theme applies before body parsing, independent of the module script", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.addInitScript(() => {
    localStorage.setItem("kumc-theme", "dark");
    const observer = new MutationObserver(() => {
      if (!document.body) return;
      (window as any).__initialTheme = document.documentElement.dataset.theme;
      observer.disconnect();
    });
    observer.observe(document, { childList: true, subtree: true });
  });
  await page.route("**/scripts/site.js", (route) => route.abort());
  await page.goto("/");
  expect(await page.evaluate(() => (window as any).__initialTheme)).toBe(
    "dark",
  );
  await expectTheme(page, "dark");
  await picker(page).click();
  await expectTheme(page, "light");
});

test("invalid saved preferences fall back to auto", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("kumc-theme", "invalid"));
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/404.html");
  await expectTheme(page, "dark");
  await page.emulateMedia({ colorScheme: "light" });
  await expectTheme(page, "light");
});

for (const failure of ["read", "write"] as const) {
  test(`storage ${failure} failure still allows switching`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript((failure) => {
      if (failure === "read")
        Object.defineProperty(window, "localStorage", {
          get() {
            throw Error("blocked");
          },
        });
      else
        Storage.prototype.setItem = () => {
          throw Error("full");
        };
    }, failure);
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await picker(page).click();
    await expectTheme(page, "dark");
    await expect(picker(page)).toHaveAttribute("aria-label", /現在はダークモード/);
    await page.reload();
    await expectTheme(page, "light");
    expect(errors).toEqual([]);
  });
}

for (const colorScheme of ["light", "dark"] as const) {
  test(`no JavaScript uses ${colorScheme} device colors and light printing`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      colorScheme,
    });
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:4321/contact/");
    await expect(page.locator("html")).toHaveCSS("color-scheme", colorScheme);
    await expect(page.locator("body")).toHaveCSS(
      "background-color",
      colorScheme === "dark" ? "rgb(24, 24, 24)" : "rgb(247, 249, 253)",
    );
    for (const control of await page.locator("[data-theme-control]").all()) {
      await expect(control).toBeHidden();
    }
    await page.emulateMedia({ media: "print" });
    await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
    await expect(page.locator("body")).toHaveCSS("color", "rgb(32, 45, 69)");
    await context.close();
  });

  test(`${colorScheme} mobile menu, theme picker and consent are accessible`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/");
    await page.locator(".mobile-menu summary").click();
    const light = page.locator('.mobile-menu [data-theme-value="light"]');
    const dark = page.locator('.mobile-menu [data-theme-value="dark"]');
    await light.scrollIntoViewIfNeeded();
    await expect(light).toBeVisible();
    await page.locator("#mobile-navigation a").last().focus();
    await page.keyboard.press("Tab");
    await expect(light).toHaveCSS("outline-style", "solid");
    await expect(light).toBeFocused();
    await page.keyboard.press("Enter");
    await expectTheme(page, "light");
    await expect(light).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Tab");
    await expect(dark).toBeFocused();
    await page.keyboard.press("Space");
    await expectTheme(page, "dark");
    await expect(dark).toHaveAttribute("aria-pressed", "true");
    await expect(light).toHaveAttribute("aria-pressed", "false");
    // Clicking the SVG itself must also activate the containing button.
    await page
      .locator(`.mobile-menu [data-theme-value="${colorScheme}"] svg`)
      .click();
    await expectTheme(page, colorScheme);
    let result = await new AxeBuilder({ page })
      .withTags(["wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(result.violations).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(page.locator(".mobile-menu summary")).toBeFocused();
    await page.locator("footer [data-consent-open]").click();
    await expect(page.locator("#consent-banner")).toBeVisible();
    result = await new AxeBuilder({ page })
      .withTags(["wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(result.violations).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}

test("explicit dark mode prints with light surfaces and readable text", async ({
  page,
}) => {
  await page.goto("/contact/");
  await picker(page).click();
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  await expect(page.locator("body")).toHaveCSS("color", "rgb(32, 45, 69)");
  await expect(page.locator(".contact-panel").first()).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
});
