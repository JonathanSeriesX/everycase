import { notFound } from "next/navigation";
import { GROUPS, getGroup, getPage } from "../../../lib/catalogue";
import { getPageHeading } from "../../../lib/notes";
import { resolveOgImage, ogMetadata } from "../../../lib/og";
import ModelPageContent from "../../../components/ModelPageContent";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return GROUPS.flatMap((group) =>
    group.pages.map((page) => ({ group: group.slug, page: page.slug })),
  );
}

export async function generateMetadata(props) {
  const { group: groupSlug, page: pageSlug } = await props.params;
  const page = getPage(groupSlug, pageSlug);
  if (!page) return {};
  return ogMetadata({
    // The browser/OG title is the editorial H1 from the notes file; the
    // short catalogue title stays internal (breadcrumbs, cards).
    title: getPageHeading(groupSlug, pageSlug) ?? page.title,
    imageUrl: await resolveOgImage(page.slug),
  });
}

export default async function ModelPage(props) {
  const { group: groupSlug, page: pageSlug } = await props.params;
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
