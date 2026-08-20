import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/siteUrl";

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
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
