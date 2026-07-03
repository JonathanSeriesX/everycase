import MdxContent from "./MdxContent";
import KindSectionClient from "./KindSection.client";
import type { CataloguePage, PageSection } from "../lib/catalogue";
import type { MdxComponent } from "../lib/notes";
import styles from "../styles/SectionHeading.module.css";

// GitHub-style heading slugs, matching the anchors Nextra generated so old
// deep links (e.g. /iphone/iphone-12#leather-sleeve) keep working.
export function slugify(text: string): string {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s/g, "-");
}

/** Heading for prose-only sections (no price pills, no cards). */
export function SectionHeading({ title }: { title: string }) {
  return (
    <div className={styles.sectionHead}>
      <h2 id={slugify(title)} className={styles.headingReset}>
        {title}
      </h2>
    </div>
  );
}

interface KindSectionProps {
  section: PageSection;
  page: CataloguePage;
  Note?: MdxComponent | null;
}

/**
 * One kind of accessory on a model page. The interactive part (tabs + price
 * pills tracking the active tab) lives in the client component; the blurb is
 * compiled MDX rendered on the server and passed through as children.
 *
 * Tab rules, mirroring the old MDX configuration:
 * - merged kinds: one combined grid, no tab bar (Clear Cases);
 * - several models: tab per model, labelled via the page's tabLabels;
 * - a single model: no tab bar — unless tabLabels names that model, which
 *   forces a lone tab (Smart Battery Case on the 6s/7 pages).
 */
export default function KindSection({ section, page, Note }: KindSectionProps) {
  const labels = page.tabLabels ?? {};
  const entries = section.models.map(({ model, cases }) => ({
    model,
    label: (model != null ? labels[model] : undefined) ?? model,
    cases,
  }));
  const showTabs =
    !section.merged &&
    (entries.length > 1 ||
      (entries.length === 1 &&
        entries[0].model != null &&
        labels[entries[0].model] != null));

  return (
    <KindSectionClient
      kind={section.kind}
      slug={slugify(section.kind)}
      price={section.price}
      entries={entries}
      showTabs={showTabs}
      merged={section.merged}
    >
      {Note && <MdxContent Content={Note} />}
    </KindSectionClient>
  );
}
