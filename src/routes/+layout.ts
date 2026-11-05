// Static site: every route is prerendered and all work happens in the browser.
export const prerender = true;

// The demo build (`lib/demo.ts`) is served as plain files with no server to
// give clean URLs, so each page is a folder with an index.html that a link
// or a reload finds on its own. The real site keeps clean URLs.
export const trailingSlash = import.meta.env.QD_DEMO ? "always" : "never";
