import { PAGES, absoluteUrl } from "$lib/site";

// Written out once at build time, like every other page.
export const prerender = true;

export function GET() {
  // A sitemap only takes absolute addresses, so until SITE_URL is set in
  // $lib/site it is an empty (but valid) list.
  const urls = PAGES.map(absoluteUrl)
    .filter((url): url is string => url !== null)
    .map((url) => `  <url>\n    <loc>${url}</loc>\n  </url>`)
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
