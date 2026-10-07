import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const url = process.env.QA_BASE_URL || "http://127.0.0.1:4321";
const paths = [
  "/",
  "/works/",
  "/works/kyoto-campus/",
  "/join/",
  "/collaboration/",
];
await mkdir(".qa", { recursive: true });
const results = [];
for (const path of paths) {
  const scores = [];
  for (let i = 0; i < 3; i++) {
    const chrome = await launch({
      chromePath: chromium.executablePath(),
      chromeFlags: ["--headless", "--disable-gpu", "--no-first-run"],
    });
    try {
      const result = await lighthouse(url + path, {
        port: chrome.port,
        output: "json",
        logLevel: "error",
        onlyCategories: [
          "performance",
          "accessibility",
          "best-practices",
          "seo",
        ],
        formFactor: "mobile",
        screenEmulation: {
          mobile: true,
          width: 390,
          height: 844,
          deviceScaleFactor: 1,
          disabled: false,
        },
      });
      const lhr = result.lhr;
      const row = Object.fromEntries(
        Object.entries(lhr.categories).map(([k, v]) => [
          k,
          Math.round(v.score * 100),
        ]),
      );
      row.lcp = lhr.audits["largest-contentful-paint"].numericValue;
      row.cls = lhr.audits["cumulative-layout-shift"].numericValue;
      scores.push(row);
      await writeFile(
        `.qa/lighthouse-${path.replaceAll("/", "_") || "home"}-${i + 1}.json`,
        result.report,
      );
      console.log(path, i + 1, JSON.stringify(row));
    } finally {
      await Promise.resolve(chrome.kill());
    }
  }
  const median = Object.fromEntries(
    Object.keys(scores[0]).map((k) => [
      k,
      scores.map((s) => s[k]).sort((a, b) => a - b)[1],
    ]),
  );
  results.push({ path, runs: scores, median });
}
await writeFile(
  ".qa/lighthouse-summary.json",
  JSON.stringify(
    {
      environment:
        "Lighthouse mobile 390x844, simulated throttling, no third-party loaded",
      results,
    },
    null,
    2,
  ),
);
