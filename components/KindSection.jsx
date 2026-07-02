import { formatPrice } from "../lib/productRegions";
import MdxContent from "./MdxContent";
import ModelTabs from "./ModelTabs.client";
import styles from "../styles/SectionHeading.module.css";

const CURRENCIES = ["USD", "EUR", "GBP"];

// GitHub-style heading slugs, matching the anchors Nextra generated so old
// deep links (e.g. /iphone/iphone-12#leather-sleeve) keep working.
export function slugify(text) {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s/g, "-");
}

export function SectionHeading({ title, price }) {
  const pills = price
    ? CURRENCIES.map((code) => {
        const entry = price[code];
        if (!entry) return null;
        const formatted = formatPrice(entry.value, code);
        if (!formatted) return null;
        return {
          code,
          label: entry.multiple ? `from ${formatted}` : formatted,
        };
      }).filter(Boolean)
    : [];

  return (
    <div className={styles.sectionHead}>
      <h2 id={slugify(title)} className={styles.headingReset}>
        {title}
      </h2>
      {pills.length > 0 && (
        <div className={styles.pills} aria-hidden="true">
          {pills.map((pill) => (
            <span key={pill.code} className={styles.pill}>
              {pill.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * One kind of accessory on a model page: heading with price pills, the
 * page's editorial blurb for this kind (when the notes file has one), and the
 * case cards — tabbed per model when the page covers several.
 */
export default function KindSection({ section, Note }) {
  return (
    <section>
      <SectionHeading title={section.kind} price={section.price} />
      {Note && <MdxContent Content={Note} />}
      <ModelTabs
        kind={section.kind}
        models={section.models.map(({ model, cases }) => ({ model, cases }))}
      />
    </section>
  );
}
