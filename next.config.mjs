import nextra from "nextra";
import fs from "fs";
import path from "path";

const isDevelopment = process.env.NODE_ENV === "development";

const withNextra = nextra({
  theme: "nextra-theme-docs",
  themeConfig: "./theme.config.jsx"
});

const baseConfig = {
  distDir: ".next",
  images: {
    domains: ["everycase.org"],
    unoptimized: true,
    //quality: 100,
    formats: ["image/avif", "image/webp"],
    imageSizes: [512, 1536]
  },
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false
  },
  eslint: {
    ignoreDuringBuilds: false
  },
  redirects: () => [
    {
      source: "/docs/guide/:slug(typescript|latex|tailwind-css|mermaid)",
      destination: "/docs/guide/advanced/:slug",
      permanent: true
    },
    {
      source: "/docs/docs-theme/built-ins/:slug(callout|steps|tabs)",
      destination: "/docs/guide/built-ins/:slug",
      permanent: true
    }
  ],
  experimental: {
    scrollRestoration: true
  },
  async headers() {
    return [
      {
        // matching all API routes
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload"
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "https://everycase.org"
          },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=(), gyroscope=(), magnetometer=(), payment=()"
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "X-Frame-Options",
            value: "DENY"
          },
          {
            key: "Referrer-Policy",
            value: "no-referrer-when-downgrade"
          },
          {
            key: "Content-Security-Policy",
            value: isDevelopment
              ? "default-src *; script-src * 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src *; connect-src *; object-src 'none'"
              :
              "default-src 'self'; " +
              "script-src 'self' https://static.cloudflareinsights.com https://vercel.live https://vercel-insights.com 'sha256-iX9LRPdLBV4jlGfQ+1qGl2+8iQlVITwJKum0Gqg4bTQ=' 'sha256-eMuh8xiwcX72rRYNAGENurQBAcH7kLlAUQcoOri3BIo=' 'sha256-0Q45p6ODxDbb6JoBmPTEm/f0wPjrDDWqatAj8JtG+Rc='; " +
              "style-src 'self' 'unsafe-inline' https://vercel.live; " +
              "font-src 'self' *.everycase.org https://vercel.live https://assets.vercel.com; " +
              "img-src 'self' *.everycase.org https://vercel.live https://vercel.com data: blob:; " +
              "connect-src 'self' https://vitals.vercel-insights.com/v1/vitals https://cloudflareinsights.com/cdn-cgi/rum https://lightboxjs-server.herokuapp.com/license https://xnbftjmzxkcjcyysytbh.supabase.co https://vercel.live wss://ws-us3.pusher.com; " +
              "frame-src 'self' https://vercel.live; " +
              "object-src 'none'; " +
              "report-uri /api/csp-report"
          }
        ]
      },
      {
        source: "/service-worker.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate"
          }
        ]
      }
    ];
  },// this path map here below solves static pre-generation of [model].mdx
  async exportPathMap() {
    const csvPath = path.join(process.cwd(), "public", "skus.csv");
    try {
      const csvData = fs.readFileSync(csvPath, "utf-8");
      console.log(`[exportPathMap] Read skus.csv successfully`);
      const records = parse(csvData, {
        columns: true, // Parse CSV into objects with column names as keys
        skip_empty_lines: true // Skip empty lines
      });

      // Use a Set to store unique SKUs
      const uniqueSKUs = new Set(records.map((record) => record.SKU.trim()));
      console.log(`[exportPathMap] Unique SKUs:`, uniqueSKUs);

      // Map each SKU to its respective page
      const paths = {};
      uniqueSKUs.forEach((sku) => {
        paths[`/case/${sku}`] = { page: "/case/[model]", query: { model: sku } };
      });

      return {
        "/": { page: "/" },
        ...paths
      };
    } catch (error) {
      console.error(`[exportPathMap] Error:`, error);
      return {
        "/": { page: "/" }
      };
    }
  }
};


export default withNextra({ ...baseConfig });