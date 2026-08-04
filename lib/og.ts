import type { Metadata } from "next";
import { cacheLife } from "next/cache";

const OG_BASE_URL = "https://cloudfront.everycase.org/og";
export const OG_FALLBACK_URL = `${OG_BASE_URL}/fallback.webp`;

// Model pages get a bespoke OG image when one exists on the CDN, otherwise
// the site-wide fallback. Accepts candidate names in preference order — the
// CDN files are keyed by the historical prefixed slugs (og/iphone-17.webp),
// so pages probe "<group>-<slug>" before the bare slug. The probe result is
// cached hourly ("use cache" — a bare revalidating fetch would make the whole
// route blocking under Cache Components).
export async function resolveOgImage(
  ...candidates: (string | null | undefined)[]
): Promise<string> {
  "use cache";
  cacheLife("hours");
  for (const name of candidates) {
    if (!name) continue;
    const pageImageUrl = `${OG_BASE_URL}/${encodeURIComponent(name)}.webp`;
    try {
      const response = await fetch(pageImageUrl, { method: "HEAD" });
      if (response.ok) return pageImageUrl;
    } catch {
      /* try the next candidate */
    }
  }
  return OG_FALLBACK_URL;
}

export function ogMetadata({
  title,
  imageUrl,
}: {
  title?: string | null;
  imageUrl: string;
}): Metadata {
  return {
    ...(title ? { title } : {}),
    openGraph: {
      ...(title ? { title } : {}),
      images: [
        {
          url: imageUrl,
          width: 2400,
          height: 1260,
          alt: "Apple cases arranged by model and colour",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: [imageUrl],
    },
  };
}
