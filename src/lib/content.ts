import { getCollection, type CollectionKey } from "astro:content";
import { isPublished } from "./schema.mjs";
export async function published<T extends CollectionKey>(kind: T) {
  return (await getCollection(kind))
    .filter((e) => isPublished(e.data))
    .sort(
      (a, b) => Date.parse(b.data.publishedAt) - Date.parse(a.data.publishedAt),
    );
}
export function dateLabel(value: string) {
  if (/^\d{4}-\d{2}$/.test(value))
    return `${value.slice(0, 4)}年${Number(value.slice(5))}月`;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
}
