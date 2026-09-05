import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/siteUrl";

// AI training crawlers and opt-out tokens. Search and AI-search bots
// (Googlebot, bingbot, OAI-SearchBot, PerplexityBot, Applebot) stay allowed.
const aiTrainingBots = [
  "GPTBot",
  "ClaudeBot",
  "anthropic-ai",
  "CCBot",
  "Bytespider",
  "meta-externalagent",
  "Amazonbot",
  "Google-Extended",
  "Applebot-Extended",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: aiTrainingBots, disallow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
