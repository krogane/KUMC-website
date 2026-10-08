import test from "node:test";
import assert from "node:assert/strict";
import {
  parseFeed,
  safeUrl,
  isPublicIPv4,
  plain,
  normalizeItems,
  refreshSource,
  validSnapshot,
  LIMITS,
  boundedGet,
} from "../scripts/feed-core.mjs";
import { schemas, isPublished, safeJson } from "../src/lib/schema.mjs";
import {
  readConsent,
  saveConsent,
  CONSENT_TTL,
  analyticsAllowed,
  eventPayload,
  cleanPageUrl,
} from "../public/scripts/privacy-core.js";
const rss = (items) => `<rss version="2.0"><channel>${items}</channel></rss>`;
const item = (
  url = "https://kumc.hatenablog.com/entry/1",
  date = "2026-01-01T00:00:00Z",
  title = "title",
  summary = "summary",
) =>
  `<item><title><![CDATA[${title}]]></title><link>${url}</link><pubDate>${date}</pubDate><description><![CDATA[${summary}]]></description></item>`;
const stamp = "2026-01-02T00:00:00Z";
const now = Date.parse("2026-10-07T00:00:00Z");
test("RSS strips dangerous markup and sorts new publications, deduplicates URLs", () => {
  const rows = parseFeed(
    rss(
      item() +
        item() +
        item(
          "https://kumc.hatenablog.com/entry/2",
          "2026-02-01T00:00:00Z",
          "<img src=x onerror=alert(1)>Hello",
          "<script>steal()</script><b>safe</b>",
        ),
    ),
    "blog",
    [],
    now,
  );
  assert.equal(rows.length, 2);
  assert.equal(rows[0].title, "Hello");
  assert.equal(rows[0].summary, "safe");
});
test("RSS rejects DTD/entity and invalid/empty XML", () => {
  for (const xml of [
    '<!DOCTYPE rss [<!ENTITY x SYSTEM "file:///etc/passwd">]><rss/>',
    '<!ENTITY boom "xx">',
    "<rss><broken></rss>",
    "<rss/>",
    "",
  ])
    assert.throws(() => parseFeed(xml, "blog"));
});
test("RSS ignores malicious URLs, invalid dates, future dates and credentials", () => {
  const rows = parseFeed(
    rss(
      item() +
        item("javascript:alert(1)") +
        item("https://kumc.hatenablog.com.evil.test/x") +
        item("https://user:pass@kumc.hatenablog.com/x") +
        item("https://kumc.hatenablog.com/future", "2099-01-01T00:00:00Z") +
        item("https://kumc.hatenablog.com/bad", "not-a-date"),
    ),
    "blog",
    [],
    now,
  );
  assert.equal(rows.length, 1);
});
test("Feed byte and item limits are enforced", () => {
  assert.throws(() => parseFeed("x".repeat(LIMITS.maxBytes + 1), "blog"));
  assert.equal(
    parseFeed(
      rss(
        Array.from({ length: 40 }, (_, i) =>
          item(`https://kumc.hatenablog.com/${i}`),
        ).join(""),
      ),
      "blog",
      [],
      now,
    ).length,
    30,
  );
});
test("Redirect destinations are restricted to HTTPS and the exact source host", async () => {
  for (const url of [
    "http://kumc.hatenablog.com/rss",
    "https://localhost/rss",
    "https://127.0.0.1/rss",
    "https://kumc.hatenablog.com:444/rss",
    "https://kumc.hatenablog.com@evil.test/rss",
    "file:///tmp/feed",
  ]) {
    assert.equal(safeUrl(url, "blog"), null);
    await assert.rejects(boundedGet(url, "blog"));
  }
});
test("Public address check rejects private, local, mapped and documentation IPs", () => {
  for (const ip of [
    "127.0.0.1",
    "10.0.0.1",
    "192.168.1.1",
    "172.16.0.1",
    "169.254.169.254",
    "100.64.0.1",
    "::1",
    "::ffff:127.0.0.1",
    "192.0.2.1",
    "224.0.0.1",
  ])
    assert.equal(isPublicIPv4(ip), false);
  assert.equal(isPublicIPv4("8.8.8.8"), true);
});
test("Timeout, bad XML and empty response retain original successful timestamp after one retry", async () => {
  const previous = {
    fetchedAt: stamp,
    items: parseFeed(rss(item()), "blog", [], now),
  };
  for (const get of [
    async () => {
      throw Error("timeout");
    },
    async () => "<bad>",
    async () => "",
  ]) {
    let calls = 0;
    const r = await refreshSource(
      "blog",
      previous,
      null,
      [],
      async () => {
        calls++;
        return get();
      },
      LIMITS,
      now,
    );
    assert.equal(calls, 2);
    assert.equal(r.snapshot.fetchedAt, stamp);
    assert.equal(r.snapshot.items.length, 1);
    assert.ok(r.warning);
  }
});
test("Missing/corrupt cache falls back to bundled snapshot then source link", async () => {
  const fallback = {
    fetchedAt: stamp,
    items: parseFeed(rss(item()), "blog", [], now),
  };
  const fail = async () => {
    throw Error("offline");
  };
  assert.equal(
    (await refreshSource("blog", {}, fallback, [], fail, LIMITS, now)).snapshot
      .items.length,
    1,
  );
  assert.deepEqual(
    (await refreshSource("blog", null, null, [], fail, LIMITS, now)).snapshot,
    { fetchedAt: null, items: [] },
  );
});
test("Exclusions apply to cached data; timestamps cannot be fabricated", () => {
  const s = {
    fetchedAt: stamp,
    items: parseFeed(rss(item()), "blog", [], now),
  };
  assert.equal(validSnapshot(s, "blog", [s.items[0].url], now).items.length, 0);
  assert.equal(
    validSnapshot({ ...s, fetchedAt: "2099-01-01" }, "blog", [], now),
    null,
  );
});
test("Atom supported and arbitrary unparsed feed content is never fetched", () => {
  const a =
    '<feed><entry><title>A</title><link href="https://kumc.hatenablog.com/a"/><published>2026-01-01T00:00:00Z</published><summary>Text</summary></entry></feed>';
  assert.equal(parseFeed(a, "blog", [], now)[0].title, "A");
  assert.equal(
    normalizeItems(
      [{ url: "https://evil.test/", title: "bad", publishedAt: stamp }],
      "blog",
    ).length,
    0,
  );
  assert.equal(plain("<iframe>hidden</iframe><b>visible</b>"), "hiddenvisible");
});
test("Drafts and future publications are consistently filtered", () => {
  assert.equal(isPublished({ draft: true, publishedAt: stamp }, now), false);
  assert.equal(
    isPublished({ draft: false, publishedAt: "2099-01-01" }, now),
    false,
  );
  assert.equal(isPublished({ draft: false, publishedAt: stamp }, now), true);
});
test("Content rejects javascript URLs and download links on unreleased works", () => {
  const d = {
    slug: "test",
    title: "x",
    summary: "x",
    draft: false,
    publishedAt: stamp,
    checkedAt: "2026-10-07",
    category: "建築",
    status: "制作中",
    edition: ["Java版"],
    supportedVersions: ["1.21"],
    downloads: [{ label: "bad", url: "https://example.org" }],
  };
  assert.equal(schemas.works.safeParse(d).success, false);
  assert.equal(
    schemas.works.safeParse({
      ...d,
      status: "公開中",
      downloads: [{ label: "bad", url: "javascript:alert(1)" }],
    }).success,
    false,
  );
});
test("JSON-LD cannot terminate the script element", () => {
  assert.ok(
    !safeJson({ text: "</script><script>alert(1)</script>" }).includes("<"),
  );
});
const memory = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k) || null, setItem: (k, v) => m.set(k, v) };
};
test("Consent expiration, storage refusal, and host/preview gate fail closed", () => {
  const s = memory();
  assert.equal(readConsent(s, now), null);
  assert.equal(saveConsent(s, "granted", now), true);
  assert.equal(readConsent(s, now + CONSENT_TTL), null);
  assert.equal(
    saveConsent(
      {
        setItem() {
          throw Error();
        },
      },
      "granted",
    ),
    false,
  );
  const c = { choice: "granted", expires: Date.now() + 1000 };
  const conf = {
    site: "https://www.kumc-club.net",
    id: "G-ABCDEFG123",
    enabled: true,
  };
  assert.ok(analyticsAllowed(conf, conf.site, c));
  assert.equal(analyticsAllowed(conf, "http://localhost:4321", c), false);
  assert.equal(
    analyticsAllowed({ ...conf, enabled: false }, conf.site, c),
    false,
  );
});
test("Analytics allowlist drops PII, arbitrary URL, and unapproved parameters", () => {
  assert.equal(
    cleanPageUrl("https://www.kumc-club.net/join/?email=x#secret"),
    "https://www.kumc-club.net/join/",
  );
  assert.equal(cleanPageUrl("javascript:alert(1)"), "");
  assert.deepEqual(
    eventPayload({
      event: "contact_click",
      method: "email",
      placement: "contact",
      email: "secret",
      url: "secret",
      platform: "unknown",
    }),
    {
      name: "contact_click",
      params: { placement: "contact", method: "email" },
    },
  );
  assert.equal(eventPayload({ event: "arbitrary" }), null);
});

test("Event dates reject invalid months, impossible days, and reversed ranges", () => {
  const d = {
    slug: "test",
    title: "t",
    summary: "s",
    draft: false,
    publishedAt: stamp,
    checkedAt: "2026-10-07",
    role: "r",
    outcome: "o",
    eventDate: "2026-08-08",
  };
  assert.ok(schemas.achievements.safeParse(d).success);
  for (const eventDate of ["2026-13", "2026-02-30"])
    assert.equal(
      schemas.achievements.safeParse({ ...d, eventDate }).success,
      false,
    );
  assert.equal(
    schemas.achievements.safeParse({ ...d, eventEndDate: "2026-08-07" })
      .success,
    false,
  );
});

test("Malformed, missing and cross-host redirect locations fail closed", async () => {
  const { redirectUrl } = await import("../scripts/feed-core.mjs");
  const base = "https://kumc.hatenablog.com/rss";
  for (const location of [
    undefined,
    "",
    "https://[bad",
    "http://kumc.hatenablog.com/rss",
    "//evil.test/rss",
  ])
    assert.equal(redirectUrl(location, base, "blog"), null);
  assert.equal(
    redirectUrl("/feed", base, "blog"),
    "https://kumc.hatenablog.com/feed",
  );
});
