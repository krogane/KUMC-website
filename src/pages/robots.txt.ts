import { site } from "../data/site";
export function GET() {
  return new Response(
    site.production
      ? `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`
      : "User-agent: *\nDisallow: /\n",
    { headers: { "Content-Type": "text/plain" } },
  );
}
