import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  GROUPS,
  TOP_PAGES,
  getGroup,
  getTopPage,
  getHeroCase,
} from "../../lib/catalogue";
import { getProsePage, getPageHeading } from "../../lib/notes";
import { resolveOgImage, ogMetadata } from "../../lib/og";
import Breadcrumb from "../../components/Breadcrumb";
import MdxContent from "../../components/MdxContent";
import ModelPageContent from "../../components/ModelPageContent";
import NavCard, { CardGrid } from "../../components/NavCard";

interface GroupRouteProps {
  params: Promise<{ group: string }>;
}

// This segment serves the group grids (/iphone) and the top-level catalogue
// pages (/airtag) — both live directly under Home.
export function generateStaticParams() {
  return [
    ...GROUPS.map((group) => ({ group: group.slug })),
    ...TOP_PAGES.map((page) => ({ group: page.slug })),
  ];
}

export async function generateMetadata({
  params,
}: GroupRouteProps): Promise<Metadata> {
  "use cache";
  const { group: slug } = await params;
  const entry = getGroup(slug) ?? getTopPage(slug);
  if (!entry) return {};
  return ogMetadata({
    title: getPageHeading(slug) ?? entry.title,
    imageUrl: await resolveOgImage(slug),
  });
}

// Same deal as the model pages (see [page]/page.tsx): a blocking route on
// purpose, so unknown slugs get a real 404 status; all known slugs are fully
// prerendered and the render is cached per-slug.
export const instant = false;

export default async function GroupPage({ params }: GroupRouteProps) {
  "use cache";
  const { group: slug } = await params;

  const topPage = getTopPage(slug);
  if (topPage) {
    return (
      <ModelPageContent
        page={topPage}
        trail={[{ href: `/${topPage.slug}`, title: topPage.title }]}
        noteSegments={[topPage.slug]}
      />
    );
  }

  const group = getGroup(slug);
  if (!group) notFound();

  // Optional editorial blurb from content/<group>.mdx; when it opens with its
  // own `# Title`, that heading IS the page title.
  const blurb = await getProsePage(group.slug);

  return (
    <div data-pagefind-body>
      <Breadcrumb trail={[{ href: `/${group.slug}`, title: group.title }]} />
      {!blurb?.hasH1 && (
        <h1 data-pagefind-ignore data-pagefind-meta="title">
          {group.title}
        </h1>
      )}
      {blurb && <MdxContent Content={blurb.Content} />}
      <CardGrid>
        {group.pages.map((page) => (
          <NavCard
            key={page.slug}
            href={`/${group.slug}/${page.slug}`}
            title={page.title}
            subtitle={page.blurb}
            heroCase={getHeroCase(page)}
            image={page.image}
          />
        ))}
      </CardGrid>
    </div>
  );
}
