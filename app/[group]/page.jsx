import { notFound } from "next/navigation";
import { GROUPS, getGroup, getHeroCase } from "../../lib/catalogue";
import { getProsePage, getPageHeading } from "../../lib/notes";
import { resolveOgImage, ogMetadata } from "../../lib/og";
import Breadcrumb from "../../components/Breadcrumb";
import MdxContent from "../../components/MdxContent";
import NavCard, { CardGrid } from "../../components/NavCard";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return GROUPS.map((group) => ({ group: group.slug }));
}

export async function generateMetadata(props) {
  const { group: groupSlug } = await props.params;
  const group = getGroup(groupSlug);
  if (!group) return {};
  return ogMetadata({
    title: getPageHeading(group.slug) ?? group.title,
    imageUrl: await resolveOgImage(group.slug),
  });
}

export default async function GroupPage(props) {
  const { group: groupSlug } = await props.params;
  const group = getGroup(groupSlug);
  if (!group) notFound();

  // Optional editorial blurb from content/<group>.mdx; when it opens with its
  // own `# Title`, that heading IS the page title.
  const blurb = await getProsePage(group.slug);

  return (
    <div data-pagefind-body>
      <Breadcrumb trail={[{ href: `/${group.slug}`, title: group.title }]} />
      {!blurb?.hasH1 && (
        <h1 data-pagefind-ignore data-pagefind-meta="title">{group.title}</h1>
      )}
      {blurb && <MdxContent Content={blurb.Content} />}
      <CardGrid>
        {group.pages.filter((page) => !page.hidden).map((page) => (
          <NavCard
            key={page.slug}
            href={`/${group.slug}/${page.slug}`}
            title={page.title}
            heroCase={getHeroCase(page)}
            image={page.image}
          />
        ))}
      </CardGrid>
    </div>
  );
}
