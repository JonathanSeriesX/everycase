import type { NextConfig } from "next";
import { getAltSkuRedirects } from "./lib/altSkus";

const surpriseTargets = [
  "/wp-admin",
  "/wp-admin.php",
  "/wp-login",
  "/wp-login.php",
  "/wp-config.php",
  "/wp/wp-admin",
  "/wp/wp-admin.php",
  "/wp/wp-login",
  "/wp/wp-login.php",
];

const iconTargets = [
  "/apple-touch-icon.png",
  "/apple-touch-icon-precomposed.png",
];

// Content Security Policy — REPORT-ONLY for now: the browser logs every
// would-be violation to the console without blocking anything. Once a few
// days of real browsing (search, sign-in, lightbox, collections) produce a
// quiet console, flip the header key to "Content-Security-Policy".
//
// Static pages rule out per-request nonces (they would force every page
// dynamic — see https://nextjs.org/docs/app/guides/content-security-policy),
// hence 'unsafe-inline' for scripts: foreign script *sources*, exfil
// targets, framing and form hijacking are still locked down.
//
// Notes:
// - 'wasm-unsafe-eval'   → Pagefind's search index runs on WebAssembly.
// - 'unsafe-eval' (dev)  → React reconstructs server error stacks via eval
//                          in development only.
// - cloudflareinsights   → the beacon script and the endpoint it posts to.
// - Vercel Analytics / Speed Insights use same-origin /_vercel/* paths.
const isDev = process.env.NODE_ENV === "development";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""} https://static.cloudflareinsights.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://cloudfront.everycase.org https://store.storeimages.cdn-apple.com",
  "font-src 'self' https://cloudfront.everycase.org",
  "connect-src 'self' https://cloudfront.everycase.org https://cloudflareinsights.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
  // Violations POST to our own endpoint and surface in Vercel's Logs.
  // report-uri is the legacy directive every browser still honours;
  // report-to is its Reporting-API successor (endpoint declared in the
  // Reporting-Endpoints header below).
  "report-uri /api/csp-report",
  "report-to csp",
].join("; ");
//TODO flip to "Content-Security-Policy" once the console is quiet for a few days.

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "everycase.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cloudfront.everycase.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "store.storeimages.cdn-apple.com",
        pathname: "/**",
      },
    ],
    unoptimized: true,
    //quality: 100,
    formats: ["image/avif", "image/webp"],
    imageSizes: [512, 2048],
    minimumCacheTTL: 2678400, // 31 days
  },
  // The collection page and API read the catalogue CSVs at request time;
  // make sure they're bundled into those routes' serverless functions.
  outputFileTracingIncludes: {
    "/collection": ["./database/*"],
    "/collections/[username]": ["./database/*"],
    "/api/collection": ["./database/*"],
  },
  experimental: {
    appNewScrollHandler: true,
    turbopackFileSystemCacheForDev: true,
  },
  allowedDevOrigins: ["*.orb.local", "127.0.0.1"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy-Report-Only", value: csp },
          { key: "Reporting-Endpoints", value: 'csp="/api/csp-report"' },
          // Enforced from day one — these are safe everywhere.
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Re-released cases (alt_sku) redirect to their original case page.
      ...getAltSkuRedirects(),
    ];
  },
  async rewrites() {
    return [
      ...surpriseTargets.map((source) => ({
        source,
        destination: "https://cloudfront.everycase.org/assets/surprise.mp4",
      })),
      ...iconTargets.map((source) => ({
        source,
        destination:
          "https://cloudfront.everycase.org/assets/apple-touch-icon.png",
      })),
    ];
  },
};

export default nextConfig;
