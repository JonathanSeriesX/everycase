import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://everycase.org";

const legacyWordpressPaths = [
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

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: legacyWordpressPaths,
      },
    ],
    host: BASE_URL,
  };
}
