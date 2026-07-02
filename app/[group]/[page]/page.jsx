import { notFound } from "next/navigation";
import { GROUPS, getGroup, getPage, getPageSections } from "../../../lib/catalogue";
import { getNotes, getPageHeading } from "../../../lib/notes";
import { resolveOgImage, ogMetadata } from "../../../lib/og";
import Breadcrumb from "../../../components/Breadcrumb";
import MdxContent from "../../../components/MdxContent";
import KindSection, { SectionHeading, slugify } from "../../../components/KindSection";

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

  const sections = getPageSections(page);
  const notes = await getNotes(groupSlug, pageSlug);

  // Notes sections whose heading names one of this page's kinds become that
  // kind's blurb; the rest render as standalone prose sections up top.
  const noteByKind = new Map();
  const proseSections = [];
  for (const note of notes?.sections ?? []) {
    const kind = sections.find(
      (section) => slugify(section.kind) === slugify(note.heading),
    );
    if (kind) noteByKind.set(kind.kind, note.Content);
    else proseSections.push(note);
  }

  return (
    <article data-pagefind-body>
      <Breadcrumb
        trail={[
          // Promoted pages (AirTag) sit directly under Home.
          ...(page.topLevel ? [] : [{ href: `/${group.slug}`, title: group.title }]),
          { href: `/${group.slug}/${page.slug}`, title: page.title },
        ]}
      />
      {!notes?.hasH1 && (
        <h1 data-pagefind-ignore data-pagefind-meta="title">{page.title}</h1>
      )}
      {notes?.intro && <MdxContent Content={notes.intro} />}
      {proseSections.map((note) => (
        <section key={note.heading}>
          <SectionHeading title={note.heading} />
          <MdxContent Content={note.Content} />
        </section>
      ))}
      {sections.map((section) => (
        <KindSection
          key={section.kind}
          section={section}
          page={page}
          Note={noteByKind.get(section.kind)}
        />
      ))}
    </article>
  );
}
