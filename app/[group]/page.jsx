import { notFound } from "next/navigation";
import { GROUPS, getGroup, getHeroCase } from "../../lib/catalogue";
import { getProsePage } from "../../lib/notes";
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
    title: group.title,
    imageUrl: await resolveOgImage(group.slug),
  });
}

export default async function GroupPage(props) {
  const { group: groupSlug } = await props.params;
  const group = getGroup(groupSlug);
  if (!group) notFound();

  // Optional editorial blurb from content/<group>.mdx, rendered between the
  // title and the cards.
  const Blurb = await getProsePage(group.slug);

  return (
    <div data-pagefind-body>
      <Breadcrumb trail={[{ href: `/${group.slug}`, title: group.title }]} />
      <h1>{group.title}</h1>
      {Blurb && <MdxContent Content={Blurb} />}
      <CardGrid>
        {group.pages.filter((page) => !page.hidden).map((page) => (
          <NavCard
            key={page.slug}
            href={`/${group.slug}/${page.slug}`}
            title={page.title}
            heroCase={getHeroCase(page)}
          />
        ))}
      </CardGrid>
    </div>
  );
}
