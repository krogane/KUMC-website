import { test, expect, type BrowserContext } from "@playwright/test";
const host = "https://kumc-club.net";
async function fixture(context: BrowserContext) {
  const requests: string[] = [];
  await context.route("https://**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin === host) {
      const response = await context.request.get(
        "http://127.0.0.1:4321" + url.pathname,
      );
      let body = await response.body();
      const type = response.headers()["content-type"] || "";
      if (type.includes("text/html"))
        body = Buffer.from(
          body
            .toString()
            .replace(
              'data-analytics-enabled="false"',
              'data-analytics-enabled="true"',
            )
            .replace(
              /data-measurement-id="[^"]*"/,
              'data-measurement-id="G-TEST123456"',
            ),
        );
      await route.fulfill({
        status: response.status(),
        contentType: type,
        body,
      });
      return;
    }
    requests.push(url.href);
    if (url.hostname === "www.googletagmanager.com") {
      await route.fulfill({
        contentType: "application/javascript",
        body: "window.__tagLoaded=true;",
      });
      return;
    }
    await route.abort();
  });
  return requests;
}
test("basic consent gates tag loading; one pageview and one event; withdrawal clears cookies and stops", async ({
  context,
  page,
}) => {
  const requests = await fixture(context);
  await page.goto(host + "/contact/?email=secret#private");
  await expect(page.locator("#consent-banner")).toBeVisible();
  expect(requests).toEqual([]);
  await page.getByRole("button", { name: "許可しない", exact: true }).click();
  await page.reload();
  expect(requests).toEqual([]);
  await page.locator("footer [data-consent-open]").click();
  await page.getByRole("button", { name: "解析を許可", exact: true }).click();
  await expect.poll(() => requests.length).toBe(1);
  const commands = await page.evaluate(() =>
    (window as any).dataLayer.map((x: any) => Array.from(x)),
  );
  expect(
    commands.filter((x: any) => x[0] === "event" && x[1] === "page_view"),
  ).toHaveLength(1);
  expect(JSON.stringify(commands)).not.toMatch(/email=secret|#private/);
  await page
    .locator('main a[data-event="contact_click"]')
    .first()
    .evaluate((el) => el.addEventListener("click", (e) => e.preventDefault()));
  await page.locator('main a[data-event="contact_click"]').first().click();
  expect(
    await page.evaluate(
      () =>
        (window as any).dataLayer.filter(
          (x: any) => x[0] === "event" && x[1] === "contact_click",
        ).length,
    ),
  ).toBe(1);
  await context.addCookies([
    { name: "_ga", value: "test", domain: "kumc-club.net", path: "/" },
    {
      name: "_ga_TEST123456",
      value: "test",
      domain: ".kumc-club.net",
      path: "/",
    },
  ]);
  await page.locator("footer [data-consent-open]").click();
  await page.getByRole("button", { name: "許可しない", exact: true }).click();
  await page.waitForLoadState();
  await expect
    .poll(
      async () =>
        (await context.cookies()).filter((c) => c.name.startsWith("_ga"))
          .length,
    )
    .toBe(0);
  await page.reload();
  expect(requests).toHaveLength(1);
  await expect(page.locator("#ga-script")).toHaveCount(0);
});
test("storage failure and expired consent default to no analytics", async ({
  context,
  page,
}) => {
  const requests = await fixture(context);
  await context.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw Error("blocked");
      },
    });
  });
  await page.goto(host + "/");
  await page.getByRole("button", { name: "解析を許可", exact: true }).click();
  await expect(page.locator("#consent-status")).toContainText("保存できない");
  expect(requests).toEqual([]);
});
test("expired persisted consent is not accepted", async ({ context, page }) => {
  const requests = await fixture(context);
  await context.addInitScript(() =>
    localStorage.setItem(
      "kumc-analytics-v1",
      JSON.stringify({
        version: 1,
        choice: "granted",
        expires: Date.now() - 1,
      }),
    ),
  );
  await page.goto(host + "/");
  await expect(page.locator("#consent-banner")).toBeVisible();
  expect(requests).toEqual([]);
});
test("CSP blocks unmanaged inline scripts and X choice is independent from GA consent", async ({
  context,
  page,
}) => {
  const requests = await fixture(context);
  await page.goto(host + "/");
  await page.getByRole("button", { name: "許可しない", exact: true }).click();
  await page.evaluate(() => {
    const s = document.createElement("script");
    s.textContent = "window.__unsafeInlineExecuted=true";
    document.body.append(s);
  });
  expect(
    await page.evaluate(() => (window as any).__unsafeInlineExecuted),
  ).toBeUndefined();
  await page.getByRole("button", { name: "Xの投稿を表示" }).click();
  await expect(page.locator("#x-status")).toContainText("表示できませんでした");
  expect(requests.some((x) => x.includes("googletagmanager"))).toBe(false);
});
test("allowlisted join, download and social events fire once with controlled parameters", async ({
  context,
  page,
}) => {
  await fixture(context);
  await context.addInitScript(() =>
    localStorage.setItem(
      "kumc-analytics-v1",
      JSON.stringify({
        version: 1,
        choice: "granted",
        expires: Date.now() + 60000,
      }),
    ),
  );
  for (const [path, event] of [
    ["/join/", "join_click"],
    ["/works/kyoto-campus/", "work_download_click"],
    ["/", "social_click"],
  ]) {
    await page.goto(host + path);
    const link = page.locator(`a[data-event="${event}"]`).first();
    await link.evaluate((el) =>
      el.addEventListener("click", (e) => e.preventDefault()),
    );
    await link.click();
    const rows = await page.evaluate(
      (name) =>
        (window as any).dataLayer
          .filter((x: any) => x[0] === "event" && x[1] === name)
          .map((x: any) => x[2]),
      event,
    );
    expect(rows).toHaveLength(1);
    expect(JSON.stringify(rows)).not.toMatch(
      /mailto:|gmail|minecraft-mcworld|x.com/,
    );
    if (event === "work_download_click")
      expect(rows[0].work_id).toBe("kyoto-campus");
  }
});
test("withdrawal from another tab stops an already loaded tag", async ({
  context,
  page,
}) => {
  const requests = await fixture(context);
  await page.goto(host + "/");
  await page.getByRole("button", { name: "解析を許可", exact: true }).click();
  await expect.poll(() => requests.length).toBe(1);
  const other = await context.newPage();
  await other.goto(host + "/contact/");
  await expect.poll(() => requests.length).toBe(2);
  await other.locator("footer [data-consent-open]").click();
  await other.getByRole("button", { name: "許可しない", exact: true }).click();
  await expect(page.locator("#ga-script")).toHaveCount(0);
  await expect(other.locator("#ga-script")).toHaveCount(0);
  await page.reload();
  expect(requests).toHaveLength(2);
});
