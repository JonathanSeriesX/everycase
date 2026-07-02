import MdxContent from "./MdxContent";
import KindSectionClient from "./KindSection.client";
import styles from "../styles/SectionHeading.module.css";

// GitHub-style heading slugs, matching the anchors Nextra generated so old
// deep links (e.g. /iphone/iphone-12#leather-sleeve) keep working.
export function slugify(text) {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s/g, "-");
}

/** Heading for prose-only sections (no price pills, no cards). */
export function SectionHeading({ title }) {
  return (
    <div className={styles.sectionHead}>
      <h2 id={slugify(title)} className={styles.headingReset}>
        {title}
      </h2>
    </div>
  );
}

/**
 * One kind of accessory on a model page. The interactive part (tabs + price
 * pills reacting to them) lives in the client component; the blurb is
 * compiled MDX rendered on the server and passed through as children.
 */
export default function KindSection({ section, Note }) {
  return (
    <KindSectionClient
      kind={section.kind}
      slug={slugify(section.kind)}
      price={section.price}
      models={section.models.map(({ model, cases }) => ({ model, cases }))}
    >
      {Note && <MdxContent Content={Note} />}
    </KindSectionClient>
  );
}
