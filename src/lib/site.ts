/**
 * Where Quiet Discoveries lives on the web, for the few places that need
 * absolute addresses: canonical links, social previews, structured data and
 * the sitemap.
 *
 * Set your domain here when you publish, e.g. "https://www.example.com".
 * While it is null, the canonical link, og:url, og:image, the structured
 * data's addresses and the sitemap's entries are left out rather than
 * pointing at somebody else's site.
 */
export const SITE_URL: string | null = null;

/** Every page a search engine should know about, in sitemap order. */
export const PAGES = ["/", "/about", "/privacy"] as const;

/**
 * Every page, including those left out of the sitemap because they only
 * show what is saved on the teacher's own computer.
 */
export type PagePath = (typeof PAGES)[number] | "/collection" | "/sessions";

/**
 * The picture link previews show: the savanna with a few animals out and the
 * name over it. A 1200×630 capture of the real Scene, in `static/`. Link
 * previews need an absolute address, so there is none until SITE_URL is set.
 */
export const PREVIEW_IMAGE: string | null = SITE_URL
  ? `${SITE_URL}/og-image.png`
  : null;

/** The page's full address, or null while no SITE_URL is set. */
export function absoluteUrl(path: PagePath): string | null {
  return SITE_URL ? new URL(path, SITE_URL).href : null;
}
