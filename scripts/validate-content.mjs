import { readdir, readFile } from "node:fs/promises";
import { parse } from "yaml";
import { schemas, isPublished, httpsUrl } from "../src/lib/schema.mjs";
const all = {};
for (const kind of Object.keys(schemas)) {
  all[kind] = [];
  const used = new Set();
  for (const filename of await readdir(`src/content/${kind}`)) {
    if (!filename.endsWith(".md")) continue;
    const raw = await readFile(`src/content/${kind}/${filename}`, "utf8");
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    if (!match) throw Error(`${filename}: missing frontmatter`);
    const data = schemas[kind].parse(parse(match[1]));
    if (data.slug !== filename.slice(0, -3) || used.has(data.slug))
      throw Error(`${filename}: slug must match filename and be unique`);
    used.add(data.slug);
    all[kind].push(data);
    if (
      /https:\/\/(?:drive|docs)\.google\.com|notion\.site|BEGIN (?:RSA |OPENSSH )?PRIVATE KEY/.test(
        raw,
      )
    )
      throw Error(`${filename}: internal source or key in public content`);
    for (const m of raw.matchAll(/\]\(([^\s)]+)(?:\s[^)]*)?\)/g))
      if (!m[1].startsWith("/") && !m[1].startsWith("#")) httpsUrl.parse(m[1]);
  }
}
for (const rows of Object.values(all))
  for (const row of rows)
    for (const [field, target] of [
      ["relatedWorkIds", "works"],
      ["relatedAchievementIds", "achievements"],
    ])
      for (const id of row[field] || [])
        if (!all[target].some((e) => e.slug === id))
          throw Error(`${row.slug}: dangling ${field} ${id}`);
for (const file of [".env", ".env.example"]) {
  const raw = await readFile(file, "utf8").catch(() =>
    file === ".env" ? "" : Promise.reject(Error("Missing .env.example")),
  );
  if (file === ".env" && !raw) continue;
  if (file === ".env") {
    const example = await readFile(".env.example", "utf8");
    const keys = (s) =>
      s
        .split("\n")
        .filter((l) => /^\w+=/.test(l))
        .map((l) => l.split("=")[0])
        .sort()
        .join(",");
    if (keys(raw) !== keys(example))
      throw Error(".env and .env.example keys differ");
  }
}
const join = process.env.PUBLIC_JOIN_URL;
if (join) httpsUrl.parse(join);
console.log(
  `Content validated: ${Object.entries(all)
    .map(([k, v]) => `${k}=${v.filter((e) => isPublished(e)).length}`)
    .join(", ")}`,
);
