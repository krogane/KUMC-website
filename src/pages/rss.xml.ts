import { published } from "../lib/content";
import { site } from "../data/site";
const esc = (v: string) =>
  v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
export async function GET() {
  const news = await published("news");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${site.name}のお知らせ</title><link>${site.url}/news/</link><description>KUMCからのお知らせ</description><language>ja</language>${news.map(({ data: d }) => `<item><title>${esc(d.title)}</title><link>${site.url}/news/${d.slug}/</link><guid>${site.url}/news/${d.slug}/</guid><pubDate>${new Date(d.publishedAt).toUTCString()}</pubDate><description>${esc(d.summary)}</description></item>`).join("")}</channel></rss>`,
    { headers: { "Content-Type": "application/rss+xml" } },
  );
}
