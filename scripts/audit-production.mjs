// Temporary local-only production build: never deploys or contacts Google.
import { spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
const mime = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".xml": "application/xml",
  ".txt": "text/plain",
};
let server;
function build(env) {
  const r = spawnSync("npm", ["run", "build"], {
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
  if (r.status !== 0) throw Error(r.stdout + r.stderr);
}
try {
  build({
    DEPLOY_TARGET: "production",
    PUBLIC_ANALYTICS_ENABLED: "true",
    PUBLIC_GA_MEASUREMENT_ID: "G-LOCALTEST00",
  });
  server = createServer(async (req, res) => {
    try {
      const path = decodeURIComponent(
        new URL(req.url, "http://127.0.0.1").pathname,
      );
      const file = resolve(
        "dist",
        "." + path + (path.endsWith("/") ? "index.html" : ""),
      );
      if (!file.startsWith(resolve("dist") + "/")) throw Error("path");
      const bytes = await readFile(file);
      res.writeHead(200, {
        "Content-Type": mime[extname(file)] || "application/octet-stream",
      });
      res.end(bytes);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });
  await new Promise((r) => server.listen(4322, "127.0.0.1", r));
  process.env.QA_BASE_URL = "http://127.0.0.1:4322";
  await import("./lighthouse.mjs");
} finally {
  server?.close();
  build({
    DEPLOY_TARGET: "preview",
    PUBLIC_ANALYTICS_ENABLED: "false",
    PUBLIC_GA_MEASUREMENT_ID: "",
  });
}
