import { published } from "../lib/content";
import { site } from "../data/site";
export async function GET() {
  const paths = [
    "/",
    "/about/",
    "/activities/",
    "/works/",
    "/achievements/",
    "/join/",
    "/contact/",
    "/news/",
    "/collaboration/",
    "/privacy/",
  ];
  for (const kind of ["works", "achievements"] as const)
    for (const e of await published(kind))
      paths.push(`/${kind}/${e.data.slug}/`);
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((p) => `<url><loc>${site.url}${p}</loc></url>`).join("")}</urlset>`,
    { headers: { "Content-Type": "application/xml" } },
  );
}
