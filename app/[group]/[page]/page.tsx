import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GROUPS, getGroup, getPage } from "../../../lib/catalogue";
import { getPageHeading } from "../../../lib/notes";
import { resolveOgImage, ogMetadata } from "../../../lib/og";
import ModelPageContent from "../../../components/ModelPageContent";


interface ModelRouteProps {
  params: Promise<{ group: string; page: string }>;
}

export function generateStaticParams() {
  return GROUPS.flatMap((group) =>
    group.pages.map((page) => ({ group: group.slug, page: page.slug })),
  );
}

export async function generateMetadata({
  params,
}: ModelRouteProps): Promise<Metadata> {
  "use cache";
  const { group: groupSlug, page: pageSlug } = await params;
  const page = getPage(groupSlug, pageSlug);
  if (!page) return {};
  return ogMetadata({
    // The browser/OG title is the editorial H1 from the notes file; the
    // short catalogue title stays internal (breadcrumbs, cards).
    title: getPageHeading(groupSlug, pageSlug) ?? page.title,
    // CDN og files predate the short slugs: try "iphone-17" then "17".
    imageUrl: await resolveOgImage(`${groupSlug}-${pageSlug}`, pageSlug),
  });
}

// Deliberately a blocking route (`instant = false`): every legitimate path is
// prerendered in full by generateStaticParams, so only unknown slugs ever
// render at request time — and those must block so notFound() can return a
// real 404 status instead of a streamed soft-404 behind a Suspense shell.
// The render is cached per-slug ("use cache") — pure build-time catalogue
// data — which is also what lets params resolve inside a cache scope without
// making the route dynamic.
export const instant = false;

export default async function ModelPage({ params }: ModelRouteProps) {
  "use cache";
  const { group: groupSlug, page: pageSlug } = await params;
  const group = getGroup(groupSlug);
  const page = getPage(groupSlug, pageSlug);
  if (!group || !page) notFound();

  return (
    <ModelPageContent
      page={page}
      trail={[
        { href: `/${group.slug}`, title: group.title },
        { href: `/${group.slug}/${page.slug}`, title: page.title },
      ]}
      noteSegments={[groupSlug, pageSlug]}
    />
  );
}
