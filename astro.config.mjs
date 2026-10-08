import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import rehypeSanitize from "rehype-sanitize";
import { loadEnv } from "vite";
import { httpsUrl } from "./src/lib/schema.mjs";
const env = {
  ...loadEnv(process.env.NODE_ENV || "production", process.cwd(), ""),
  ...process.env,
};
if (env.PUBLIC_SITE_URL !== "https://www.kumc-club.net")
  throw new Error("PUBLIC_SITE_URL must be https://www.kumc-club.net");
if (!["preview", "production"].includes(env.DEPLOY_TARGET || "preview"))
  throw new Error("Invalid DEPLOY_TARGET");
if (env.PUBLIC_JOIN_URL) httpsUrl.parse(env.PUBLIC_JOIN_URL);
if (
  env.DEPLOY_TARGET === "production" &&
  (env.PUBLIC_ANALYTICS_ENABLED !== "true" ||
    !/^G-[A-Z0-9]{6,20}$/.test(env.PUBLIC_GA_MEASUREMENT_ID || ""))
)
  throw new Error(
    "Production requires configured GA4 measurement ID and analytics enabled.",
  );
export default defineConfig({
  site: env.PUBLIC_SITE_URL,
  output: "static",
  trailingSlash: "always",
  build: { inlineStylesheets: "never" },
  devToolbar: { enabled: false },
  markdown: { processor: unified({ rehypePlugins: [rehypeSanitize] }) },
  vite: { build: { sourcemap: false } },
});
