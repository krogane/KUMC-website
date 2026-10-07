import { readdir, readFile } from "node:fs/promises";
const skip = new Set([
  "node_modules",
  ".git",
  ".astro",
  ".qa",
  ".cache",
  "test-results",
  "playwright-report",
]);
const rules = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{60,}\b/,
  /\bAKIA[A-Z0-9]{16}\b/,
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{40,}\b/,
];
let n = 0;
async function scan(dir) {
  for (const d of await readdir(dir, { withFileTypes: true })) {
    if (skip.has(d.name) || d.name === ".env") continue;
    const p = dir + "/" + d.name;
    if (d.isDirectory()) {
      await scan(p);
      continue;
    }
    if (/\.(png|jpe?g|webp|avif|ico|woff2?|pdf|zip)$/i.test(p)) continue;
    const s = await readFile(p, "utf8");
    if (rules.some((r) => r.test(s))) throw Error(`Potential secret: ${p}`);
    n++;
  }
}
await scan(".");
console.log(`Secret pattern scan passed (${n} text files, .env excluded).`);
