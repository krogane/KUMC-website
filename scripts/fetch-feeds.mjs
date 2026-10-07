import {
  readFile,
  writeFile,
  mkdir,
  rename,
  appendFile,
} from "node:fs/promises";
import { SOURCES, refreshSource } from "./feed-core.mjs";
async function json(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return {};
  }
}
const [previous, fallback, exclude] = await Promise.all([
  json(".cache/feeds.json"),
  json("src/data/feed-fallback.json"),
  json("src/data/feed-exclusions.json"),
]);
const sources = {};
for (const source of Object.keys(SOURCES)) {
  const result = await refreshSource(
    source,
    previous.sources?.[source],
    fallback.sources?.[source],
    exclude[source] || [],
  );
  sources[source] = result.snapshot;
  if (result.warning) {
    console.warn(`::warning::${result.warning}`);
    if (process.env.GITHUB_STEP_SUMMARY)
      await appendFile(
        process.env.GITHUB_STEP_SUMMARY,
        `- ${result.warning}\n`,
      );
  }
  console.log(
    `${source}: ${result.snapshot.items.length} items; fetchedAt=${result.snapshot.fetchedAt || "never"}`,
  );
}
await mkdir(".cache", { recursive: true });
await writeFile(
  ".cache/feeds.next.json",
  JSON.stringify({ version: 1, sources }, null, 2),
);
await rename(".cache/feeds.next.json", ".cache/feeds.json");
