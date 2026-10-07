import { readFileSync } from "node:fs";
import fallback from "../data/feed-fallback.json";
import exclusions from "../data/feed-exclusions.json";
import { validSnapshot, SOURCES } from "../../scripts/feed-core.mjs";
type FeedItem = {
  source: string;
  sourceId: string;
  title: string;
  url: string;
  publishedAt: string;
  summary: string;
};
type Snapshot = { fetchedAt: string | null; items: FeedItem[] };
export function getFeed(source: "blog" | "colony") {
  let cached: { sources?: Partial<Record<"blog" | "colony", Snapshot>> } = {};
  try {
    cached = JSON.parse(readFileSync(".cache/feeds.json", "utf8"));
  } catch {}
  const snapshot = (validSnapshot(
    cached.sources?.[source],
    source,
    exclusions[source],
  ) ??
    validSnapshot(fallback.sources[source], source, exclusions[source]) ?? {
      fetchedAt: null,
      items: [],
    }) as Snapshot;
  return {
    ...snapshot,
    ...SOURCES[source],
    stale:
      !snapshot.fetchedAt ||
      Date.now() - Date.parse(snapshot.fetchedAt) > 48 * 60 * 60 * 1000,
  };
}
