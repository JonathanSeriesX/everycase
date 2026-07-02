import type { NextConfig } from "next";
import { getAltSkuRedirects } from "./lib/altSkus.js";

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
  experimental: {
    appNewScrollHandler: true,
    turbopackFileSystemCacheForDev: false,
  },
  allowedDevOrigins: ["*.orb.local", "127.0.0.1"],
  async redirects() {
    return [
      {
        source: "/pre-notch-iphone/:path*",
        destination: "/",
        permanent: true,
      },
      {
        source: "/pre-liquid-ipad/:path*",
        destination: "/",
        permanent: true,
      },
      {
        source: "/years/:path*",
        destination: "/",
        permanent: false,
      },
      {
        source: "/years",
        destination: "/",
        permanent: false,
      },
      {
        source: "/ancient/:path*",
        destination: "/",
        permanent: true,
      },
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
