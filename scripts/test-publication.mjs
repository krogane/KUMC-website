import { readFile, writeFile, unlink, readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
const entries = [
  ["fixture-draft-leak", true, "2020-01-01T00:00:00Z"],
  ["fixture-future-leak", false, "2099-01-01T00:00:00Z"],
  ["fixture-markdown-safety", false, "2020-01-01T00:00:00Z"],
];
function build() {
  const r = spawnSync("npm", ["run", "build"], {
    stdio: "pipe",
    encoding: "utf8",
    env: { ...process.env, DEPLOY_TARGET: "preview" },
  });
  if (r.status !== 0) throw Error(r.stdout + r.stderr);
}
async function tree(path) {
  let text = "";
  for (const e of await readdir(path, { withFileTypes: true })) {
    const f = path + "/" + e.name;
    if (e.isDirectory()) text += await tree(f);
    else if (/\.(html|xml|json|js)$/.test(f)) text += await readFile(f, "utf8");
  }
  return text;
}
try {
  for (const [slug, draft, publishedAt] of entries) {
    const d = {
      slug,
      title: slug,
      summary: slug + "-summary",
      draft,
      publishedAt,
      checkedAt: "2026-10-07",
      category: "建築",
      status: "制作中",
      edition: ["Java版"],
      supportedVersions: ["1.21.4"],
      downloads: [],
    };
    await writeFile(
      `src/content/works/${slug}.md`,
      "---\n" +
        JSON.stringify(d) +
        '\n---\n\n<script>window.UNSAFE_MARKDOWN_SENTINEL=1</script>\n\n<div onclick="UNSAFE_HANDLER_SENTINEL()">unsafe HTML container</div>\n\nsafe text',
    );
  }
  build();
  const out = await tree("dist");
  for (const [slug] of entries.slice(0, 2))
    assert.ok(!out.includes(slug), "Unpublished fixture leaked");
  const html = await readFile(
    "dist/works/fixture-markdown-safety/index.html",
    "utf8",
  );
  assert.ok(!html.includes("UNSAFE_MARKDOWN_SENTINEL"));
  assert.ok(!html.includes("UNSAFE_HANDLER_SENTINEL"));
  assert.ok(html.includes("safe text"));
  console.log(
    "Build boundaries passed: drafts/future entries absent from all public files; Markdown scripts and handlers removed.",
  );
} finally {
  for (const [slug] of entries)
    await unlink(`src/content/works/${slug}.md`).catch(() => {});
  build();
}
