const OG_BASE_URL = "https://cloudfront.everycase.org/og";
export const OG_FALLBACK_URL = `${OG_BASE_URL}/fallback.webp`;

// Model pages get a bespoke OG image when one exists on the CDN (keyed by
// page slug), otherwise the site-wide fallback. The HEAD probe happens at
// build time and revalidates hourly.
export async function resolveOgImage(pageName) {
  if (!pageName) return OG_FALLBACK_URL;
  const pageImageUrl = `${OG_BASE_URL}/${encodeURIComponent(pageName)}.webp`;
  try {
    const response = await fetch(pageImageUrl, {
      method: "HEAD",
      next: { revalidate: 3600 },
    });
    return response.ok ? pageImageUrl : OG_FALLBACK_URL;
  } catch {
    return OG_FALLBACK_URL;
  }
}

export function ogMetadata({ title, imageUrl }) {
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
