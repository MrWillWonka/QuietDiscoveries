/**
 * Where Shy Safari lives on the web, for the few places that need absolute
 * addresses: canonical links, social previews, structured data and the
 * sitemap. The bare domain and the vercel.app one both redirect or duplicate
 * this, so search engines are pointed here and nowhere else.
 */

export const SITE_URL = "https://www.shysafari.com";

/** Every page a search engine should know about, in sitemap order. */
export const PAGES = ["/", "/about", "/privacy"] as const;

export type PagePath = (typeof PAGES)[number];

/**
 * The picture link previews show: the savanna with a few animals out and the
 * name over it. A 1200×630 capture of the real Scene, in `static/`.
 */
export const PREVIEW_IMAGE = `${SITE_URL}/og-image.png`;

export function absoluteUrl(path: PagePath): string {
  return new URL(path, SITE_URL).href;
}
