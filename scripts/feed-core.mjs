import { XMLParser } from "fast-xml-parser";
import { SyntaxValidator } from "fast-xml-validator";
import sanitizeHtml from "sanitize-html";
import { request } from "node:https";
import { resolve4 } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
export const SOURCES = {
  blog: {
    name: "公式ブログ",
    host: "kumc.hatenablog.com",
    url: "https://kumc.hatenablog.com/rss",
    home: "https://kumc.hatenablog.com/",
  },
  colony: {
    name: "クラフターズコロニー",
    host: "minecraft-mcworld.com",
    url: "https://minecraft-mcworld.com/author/2937761467834624754e30c1ed9db1390dc5f974/feed/",
    home: "https://minecraft-mcworld.com/author/2937761467834624754e30c1ed9db1390dc5f974/",
  },
};
export const LIMITS = {
  timeout: 15000,
  maxBytes: 2 * 1024 * 1024,
  maxItems: 30,
  retries: 1,
};
const blocks = new BlockList();
for (const [ip, bits] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
])
  blocks.addSubnet(ip, bits, "ipv4");
export const isPublicIPv4 = (ip) => isIP(ip) === 4 && !blocks.check(ip, "ipv4");
export function safeUrl(value, source) {
  try {
    const u = new URL(value);
    if (
      u.protocol !== "https:" ||
      u.hostname !== SOURCES[source]?.host ||
      u.port ||
      u.username ||
      u.password
    )
      return null;
    u.hash = "";
    return u.href;
  } catch {
    return null;
  }
}
export function plain(value, limit = 160) {
  if (typeof value !== "string") return "";
  return sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
    nonTextTags: ["script", "style", "textarea", "option"],
  })
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}
export function normalizeItems(items, source, excluded = [], now = Date.now()) {
  const seen = new Set();
  const denied = new Set(
    excluded.map((x) => safeUrl(x, source)).filter(Boolean),
  );
  return items
    .slice(0, LIMITS.maxItems)
    .flatMap((item) => {
      const url = safeUrl(item.url, source);
      const time = Date.parse(item.publishedAt);
      const title = plain(item.title, 160);
      if (
        !url ||
        seen.has(url) ||
        denied.has(url) ||
        !Number.isFinite(time) ||
        time > now ||
        !title
      )
        return [];
      seen.add(url);
      return [
        {
          source,
          sourceId: url,
          title,
          url,
          publishedAt: new Date(time).toISOString(),
          summary: plain(item.summary, 120),
        },
      ];
    })
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}
export function parseFeed(xml, source, excluded = [], now = Date.now()) {
  if (
    Buffer.byteLength(xml) > LIMITS.maxBytes ||
    /<!\s*(DOCTYPE|ENTITY)\b/i.test(xml)
  )
    throw new Error("Feed contains forbidden DTD/entity or exceeds size limit");
  if (SyntaxValidator.validate(xml) !== true) throw new Error("Invalid XML");
  const doc = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseTagValue: false,
    processEntities: true,
  }).parse(xml);
  const raw = doc.rss?.channel?.item ?? doc.feed?.entry ?? doc["rdf:RDF"]?.item;
  if (!raw) throw new Error("Empty feed");
  const rows = (Array.isArray(raw) ? raw : [raw])
    .slice(0, LIMITS.maxItems)
    .map((x) => ({
      title: typeof x.title === "object" ? x.title["#text"] : x.title,
      url:
        typeof x.link === "string"
          ? x.link
          : Array.isArray(x.link)
            ? x.link.find((l) => !l["@_rel"] || l["@_rel"] === "alternate")?.[
                "@_href"
              ]
            : x.link?.["@_href"],
      publishedAt: x.pubDate ?? x.published ?? x["dc:date"] ?? x.updated,
      summary:
        typeof (x.description ?? x.summary) === "object"
          ? (x.description ?? x.summary)["#text"]
          : (x.description ?? x.summary ?? ""),
    }));
  const items = normalizeItems(rows, source, excluded, now);
  if (!items.length) throw new Error("Feed has no usable entries");
  return items;
}
export function validSnapshot(
  snapshot,
  source,
  excluded = [],
  now = Date.now(),
) {
  if (
    !snapshot ||
    !Array.isArray(snapshot.items) ||
    !Number.isFinite(Date.parse(snapshot.fetchedAt)) ||
    Date.parse(snapshot.fetchedAt) > now + 300000
  )
    return null;
  const items = normalizeItems(snapshot.items, source, excluded, now);
  return {
    ...(items.length ? { items } : { items: [] }),
    fetchedAt: snapshot.fetchedAt,
  };
}
export function redirectUrl(location, base, source) {
  if (typeof location !== "string" || !location.trim()) return null;
  try {
    return safeUrl(new URL(location, base).href, source);
  } catch {
    return null;
  }
}
export async function boundedGet(
  url,
  source,
  limits = LIMITS,
  deadline = Date.now() + limits.timeout,
  redirects = 0,
) {
  if (!safeUrl(url, source) || redirects > 3)
    throw new Error("Forbidden feed destination");
  const u = new URL(url);
  const remaining = deadline - Date.now();
  if (remaining <= 0) throw new Error("Feed timeout");
  let timer;
  const addresses = await Promise.race([
    resolve4(u.hostname),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error("DNS timeout")), remaining);
    }),
  ]).finally(() => clearTimeout(timer));
  if (!addresses.length || addresses.some((ip) => !isPublicIPv4(ip)))
    throw new Error("Non-public DNS destination");
  return new Promise((resolve, reject) => {
    const req = request(
      u,
      {
        method: "GET",
        headers: {
          "User-Agent": "KUMC-site-feed/1.0",
          Accept:
            "application/rss+xml, application/atom+xml, application/xml, text/xml",
        },
        lookup: (_host, opts, cb) =>
          opts.all
            ? cb(null, [{ address: addresses[0], family: 4 }])
            : cb(null, addresses[0], 4),
      },
      (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
          // Redirect/error response bodies are irrelevant and may be unbounded.
          res.destroy();
          clearTimeout(timer);
          const next = redirectUrl(res.headers.location, u, source);
          if (!next) {
            reject(new Error("Forbidden redirect"));
            return;
          }
          boundedGet(next, source, limits, deadline, redirects + 1).then(
            resolve,
            reject,
          );
          return;
        }
        if (res.statusCode !== 200) {
          res.destroy();
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        if (Number(res.headers["content-length"] || 0) > limits.maxBytes) {
          res.destroy();
          reject(new Error("Feed too large"));
          return;
        }
        let size = 0;
        const chunks = [];
        res.on("data", (chunk) => {
          size += chunk.length;
          if (size > limits.maxBytes) {
            res.destroy(new Error("Feed too large"));
            return;
          }
          chunks.push(chunk);
        });
        res.on("error", reject);
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      },
    );
    timer = setTimeout(
      () => req.destroy(new Error("Feed timeout")),
      Math.max(1, deadline - Date.now()),
    );
    req.on("error", reject);
    req.on("close", () => clearTimeout(timer));
    req.end();
  });
}
export async function refreshSource(
  source,
  previous,
  fallback,
  excluded = [],
  get = boundedGet,
  limits = LIMITS,
  now = Date.now(),
) {
  for (let attempt = 0; attempt <= limits.retries; attempt++)
    try {
      const xml = await get(SOURCES[source].url, source, limits);
      return {
        snapshot: {
          fetchedAt: new Date(now).toISOString(),
          items: parseFeed(xml, source, excluded, now),
        },
        warning: null,
      };
    } catch {
      /* Keep last known good data; never log external bodies. */
    }
  const snapshot = validSnapshot(previous, source, excluded, now) ??
    validSnapshot(fallback, source, excluded, now) ?? {
      fetchedAt: null,
      items: [],
    };
  return {
    snapshot,
    warning: `${source}: feed fetch failed; using ${snapshot.items.length ? "last known good snapshot" : "source link only"}`,
  };
}
