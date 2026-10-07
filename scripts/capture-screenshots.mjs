import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
await mkdir(".qa", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
for (const width of [320, 360, 390, 768, 1280, 1440]) {
  await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
  await page.goto("http://127.0.0.1:4321/");
  for (const img of await page.locator("img").all()) {
    await img.scrollIntoViewIfNeeded();
    await img.evaluate((i) => i.decode());
  }
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({ path: `.qa/home-${width}.png`, fullPage: true });
  if (width === 1440) await page.screenshot({ path: ".qa/home-desktop.png" });
  if (width === 390) await page.screenshot({ path: ".qa/home-mobile.png" });
}
await page.setViewportSize({ width: 1440, height: 1000 });
for (const name of ["works", "join", "contact", "collaboration"]) {
  await page.goto(`http://127.0.0.1:4321/${name}/`);
  for (const img of await page.locator("img").all()) {
    await img.scrollIntoViewIfNeeded();
    await img.evaluate((i) => i.decode());
  }
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({ path: `.qa/${name}-desktop.png`, fullPage: true });
}
await page.setViewportSize({ width: 1505, height: 1045 });
await page.goto("http://127.0.0.1:4321/");
await page.screenshot({ path: ".qa/render-top-native.png" });
await page
  .locator(".activity-grid")
  .evaluate((el) =>
    el
      .closest("section")
      .scrollIntoView({ block: "start", behavior: "instant" }),
  );
await page.screenshot({ path: ".qa/render-middle-native.png" });
await page.setViewportSize({ width: 1435, height: 1096 });
await page
  .locator(".invitation")
  .evaluate((el) => el.scrollIntoView({ block: "start", behavior: "instant" }));
await page.screenshot({ path: ".qa/render-bottom-native.png" });
await writeFile(".qa/visual-console.json", JSON.stringify(errors));
await browser.close();
console.log("Screenshots saved under .qa; page errors:", errors.length);
