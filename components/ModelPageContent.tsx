import { getPageSections, type CataloguePage } from "../lib/catalogue";
import { getNotes, type MdxComponent } from "../lib/notes";
import Breadcrumb, { type Crumb } from "./Breadcrumb";
import MdxContent from "./MdxContent";
import KindSection, { SectionHeading } from "./KindSection";
import { slugify } from "../lib/slugify";

interface ModelPageContentProps {
  page: CataloguePage;
  trail: Crumb[];
  /** Path of the page's notes file inside content/, as path segments. */
  noteSegments: string[];
}

/**
 * The body of a catalogue page: breadcrumb, editorial notes, and the
 * data-driven kind sections. Shared by /[group]/[page] and top-level pages
 * like /airtag — only the trail and the notes location differ.
 */
export default async function ModelPageContent({
  page,
  trail,
  noteSegments,
}: ModelPageContentProps) {
  const sections = getPageSections(page);
  const notes = await getNotes(...noteSegments);

  // Notes sections whose heading names one of this page's kinds become that
  // kind's blurb; the rest render as standalone prose sections up top.
  const noteByKind = new Map<string, MdxComponent | null>();
  const proseSections: { heading: string; Content: MdxComponent | null }[] = [];
  for (const note of notes?.sections ?? []) {
    const kind = sections.find(
      (section) => slugify(section.kind) === slugify(note.heading),
    );
    if (kind) noteByKind.set(kind.kind, note.Content);
    else proseSections.push(note);
  }

  return (
    <article data-pagefind-body>
      <Breadcrumb trail={trail} />
      {!notes?.hasH1 && (
        <h1 data-pagefind-ignore data-pagefind-meta="title">
          {page.title}
        </h1>
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
