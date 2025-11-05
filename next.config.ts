import type { NextConfig } from "next";
import nextra from "nextra";

const withNextra = nextra({
  whiteListTagsStyling: ["h1"],
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
      {
        source: '/wp-login.php',
        destination: 'https://cloudfront.everycase.org/assets/surprise.mp4',
      },
      {
        source: '/wordpress/wp-login.php',
        destination: 'https://cloudfront.everycase.org/assets/surprise.mp4',
      },
      {
        source: '/wp/wp-login.php',
        destination: 'https://cloudfront.everycase.org/assets/surprise.mp4',
      },
      {
        source: '/wp/wp-admin.php',
        destination: 'https://cloudfront.everycase.org/assets/surprise.mp4',
      },
      {
        source: '/wp/wp-admin/',
        destination: 'https://cloudfront.everycase.org/assets/surprise.mp4',
      },
    ];
  },
};

export default withNextra(nextConfig);
