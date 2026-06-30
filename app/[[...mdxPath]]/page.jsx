import { generateStaticParamsFor, importPage } from "nextra/pages";
import { useMDXComponents as getMDXComponents } from "../../mdx-components";

const OG_BASE_URL = "https://cloudfront.everycase.org/og";
const OG_FALLBACK_URL = `${OG_BASE_URL}/fallback.webp`;

async function resolveOgImage(mdxPath) {
  if (mdxPath.length <= 1) return OG_FALLBACK_URL;

  const pageName = mdxPath.at(-1);
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

function withOgImage(metadata, imageUrl, parentMetadata) {
  const baseMetadata = metadata ?? {};
  const parentOpenGraph = parentMetadata.openGraph ?? {};
  const parentTwitter = parentMetadata.twitter ?? {};
  return {
    ...baseMetadata,
    openGraph: {
      ...baseMetadata.openGraph,
      siteName: baseMetadata.openGraph?.siteName ?? parentOpenGraph.siteName,
      locale: baseMetadata.openGraph?.locale ?? parentOpenGraph.locale,
      type: baseMetadata.openGraph?.type ?? parentOpenGraph.type,
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
      ...baseMetadata.twitter,
      creator: baseMetadata.twitter?.creator ?? parentTwitter.creator,
      site: baseMetadata.twitter?.site ?? parentTwitter.site,
      card: "summary_large_image",
      images: [imageUrl],
    },
  };
}

export const generateStaticParams = generateStaticParamsFor("mdxPath");

export async function generateMetadata(props, parent) {
  const params = await props.params;
  const mdxPath = params.mdxPath ?? [];
  const { metadata } = await importPage(mdxPath);
  const baseMetadata = metadata ?? {};
  const imageUrl = await resolveOgImage(mdxPath);
  const parentMetadata = await parent;

  if (mdxPath.length === 0) {
    return withOgImage(
      {
        ...baseMetadata,
        title: {
          absolute: "Finest Woven",
        },
      },
      imageUrl,
      parentMetadata,
    );
  }

  return withOgImage(baseMetadata, imageUrl, parentMetadata);
}

const Wrapper = getMDXComponents().wrapper;

export default async function Page(props) {
  const params = await props.params;
  const mdxPath = params.mdxPath ?? [];
  const result = await importPage(mdxPath);
  const { default: MDXContent, toc, metadata } = result;
  const baseMetadata = metadata ?? {};
  const pageMetadata =
    mdxPath.length === 0
      ? {
          ...baseMetadata,
          title: {
            absolute: "Finest Woven",
          },
        }
      : metadata;

  return (
    <Wrapper toc={toc} metadata={pageMetadata}>
      <MDXContent {...props} params={params} />
    </Wrapper>
  );
}
