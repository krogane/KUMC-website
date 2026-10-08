import { cspPolicy } from "../src/lib/csp.mjs";
import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { load } from "cheerio";
import { parse } from "yaml";
export async function walk(path) {
  const files = [];
  for (const d of await readdir(path, { withFileTypes: true })) {
    const p = path + "/" + d.name;
    if (d.isDirectory()) files.push(...(await walk(p)));
    else files.push(p);
  }
  return files;
}
const files = await walk("dist");
let count = 0;
for (const file of files) {
  if (
    /(?:\.map|\.md|\.env|\.ya?ml|\.ts)$/.test(file) ||
    /(?:^|\/)\.git\//.test(file)
  )
    throw Error(`Forbidden published artifact: ${file}`);
  if (!file.endsWith(".html")) continue;
  count++;
  const $ = load(await readFile(file, "utf8"));
  const hashes = [];
  $("script:not([src])").each((_, el) => {
    hashes.push(
      `'sha256-${createHash("sha256")
        .update($(el).html() || "")
        .digest("base64")}'`,
    );
  });
  const policy = cspPolicy(hashes);
  $('meta[http-equiv="Content-Security-Policy"]').attr("content", policy);
  if ($("h1").length !== 1) throw Error(`${file}: expected exactly one h1`);
  if ($("html").attr("lang") !== "ja") throw Error(`${file}: missing ja`);
  if (!$("title").text() || !$("meta[name=description]").attr("content"))
    throw Error(`${file}: missing metadata`);
  if (
    !$("link[rel=canonical]").attr("href")?.startsWith("https://www.kumc-club.net/")
  )
    throw Error(`${file}: wrong canonical`);
  const refs = [];
  $("[href],[src]").each((_, el) => {
    for (const a of ["href", "src"]) {
      const v = $(el).attr(a);
      if (v) refs.push(v);
    }
    if (el.tagName === "img" && !$(el).attr("alt"))
      throw Error(`${file}: missing image alt`);
  });
  $("[srcset]").each((_, el) => {
    $(el)
      .attr("srcset")
      .split(",")
      .forEach((s) => refs.push(s.trim().split(/\s+/)[0]));
  });
  for (const ref of refs) {
    if (/^(?:https:|mailto:|data:)/.test(ref)) continue;
    if (/^(?:javascript:|http:|\/\/)/i.test(ref))
      throw Error(`${file}: forbidden URL ${ref}`);
    const url = new URL(
      ref,
      "https://www.kumc-club.net/" +
        file.replace(/^dist\//, "").replace(/index\.html$/, ""),
    );
    const path = decodeURIComponent(url.pathname);
    const local = resolve(
      "dist",
      "." + path + (path.endsWith("/") ? "index.html" : ""),
    );
    if (!local.startsWith(resolve("dist") + "/")) throw Error("Path escape");
    try {
      await stat(local);
    } catch {
      throw Error(`${file}: broken reference ${ref}`);
    }
    if (url.hash && local.endsWith(".html")) {
      const target =
        local === resolve(file) ? $ : load(await readFile(local, "utf8"));
      const id = decodeURIComponent(url.hash.slice(1));
      if (
        !target("[id]")
          .toArray()
          .some((el) => target(el).attr("id") === id)
      )
        throw Error(`${file}: missing anchor ${ref}`);
    }
  }
  await writeFile(file, $.html());
}
const outputs = (
  await Promise.all(
    files
      .filter((f) => /\.(html|xml|json|js)$/.test(f))
      .map((f) => readFile(f, "utf8")),
  )
).join("\n");
for (const kind of ["works", "achievements"])
  for (const f of await readdir(`src/content/${kind}`))
    if (f.endsWith(".md")) {
      const s = await readFile(`src/content/${kind}/${f}`, "utf8");
      const d = parse(s.match(/^---\n([\s\S]*?)\n---/)[1]);
      if (d.draft || Date.parse(d.publishedAt) > Date.now()) {
        if (
          outputs.includes(`/${kind}/${d.slug}/`) ||
          outputs.includes(d.summary)
        )
          throw Error(`Unpublished content leaked: ${d.slug}`);
      }
    }
if (
  /https:\/\/(?:docs|drive)\.google\.com|\.notion\.site\/|BEGIN (?:RSA |OPENSSH )?PRIVATE KEY/.test(
    outputs,
  )
)
  throw Error("Private source or key leaked into dist");
console.log(
  `Verified ${count} HTML pages: local links, images, metadata, draft boundaries; CSP hashes applied.`,
);
