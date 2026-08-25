// The site's canonical origin, without a trailing slash. Used by everything
// that has to emit absolute URLs of our own pages (robots.ts, sitemap.ts).
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://everycase.org";
