import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
const pkg = JSON.parse(readFileSync("node_modules/astro/package.json", "utf8"));
const child = spawn(
  process.execPath,
  ["node_modules/astro/" + pkg.bin.astro, ...process.argv.slice(2)],
  { stdio: "inherit", env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" } },
);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 1));
