import type { NextConfig } from "next";
import nextra from "nextra";

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

const withNextra = nextra({
  //whiteListTagsStyling: ["h1"],
});

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
    imageSizes: [512, 1536],
  },
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },
  allowedDevOrigins: ["*.orb.local"],
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

export default withNextra(nextConfig);
