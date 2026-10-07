import { z } from "zod";
export const httpsUrl = z.url().refine((value) => {
  const u = new URL(value);
  return u.protocol === "https:" && !u.username && !u.password && !u.port;
}, "Use an HTTPS URL without credentials or a custom port");
export const isoDate = z.iso.datetime({ offset: true });
const eventDate = z.union([
  z.iso.date(),
  z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
]);
const asset = z.enum([
  "campus",
  "campus-wide",
  "treasure",
  "gunfight",
  "athletic",
]);
const common = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  summary: z.string().min(1).max(240),
  draft: z.boolean(),
  publishedAt: isoDate,
  updatedAt: isoDate.optional(),
  checkedAt: z.iso.date(),
  tags: z.array(z.string()).default([]),
  cover: asset.optional(),
  coverAlt: z.string().optional(),
  publicSourceUrls: z.array(httpsUrl).default([]),
});
const refs = {
  relatedWorkIds: z.array(z.string()).default([]),
  relatedAchievementIds: z.array(z.string()).default([]),
};
/** @template {import("zod").ZodType} T
 * @param {T} schema
 * @returns {T}
 */
const dated = (schema) =>
  schema.superRefine((d, ctx) => {
    if (d.updatedAt && Date.parse(d.updatedAt) < Date.parse(d.publishedAt))
      ctx.addIssue({
        code: "custom",
        message: "updatedAt precedes publishedAt",
      });
    if (d.cover && !d.coverAlt)
      ctx.addIssue({ code: "custom", message: "coverAlt required" });
    if (
      d.eventEndDate &&
      d.eventEndDate <
        (d.eventDate.length === 7 ? d.eventDate + "-01" : d.eventDate)
    )
      ctx.addIssue({
        code: "custom",
        message: "eventEndDate precedes eventDate",
      });
  });
export const schemas = {
  works: dated(
    common
      .extend({
        ...refs,
        category: z.enum(["建築", "ゲーム・マップ", "技術"]),
        status: z.enum(["公開中", "制作中", "公開終了"]),
        edition: z.array(z.enum(["Java版", "統合版"])).min(1),
        supportedVersions: z.array(z.string()).min(1),
        downloads: z.array(z.object({ label: z.string(), url: httpsUrl })),
        gallery: z
          .array(z.object({ image: asset, alt: z.string().min(1) }))
          .default([]),
      })
      .superRefine((d, c) => {
        if (d.status !== "公開中" && d.downloads.length)
          c.addIssue({
            code: "custom",
            message: "Unreleased works must not expose downloads",
          });
      }),
  ),
  achievements: dated(
    common.extend({
      ...refs,
      eventDate,
      eventEndDate: z.iso.date().optional(),
      role: z.string().min(1),
      outcome: z.string().min(1),
    }),
  ),
  news: dated(
    common.extend({
      ...refs,
      category: z.enum(["お知らせ", "作品案内", "活動報告"]),
    }),
  ),
};
export function isPublished(data, now = Date.now()) {
  return !data.draft && Date.parse(data.publishedAt) <= now;
}
export function safeJson(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
