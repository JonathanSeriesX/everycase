import { CopyIcon, CheckIcon } from "./icons";

/**
 * The copy-button icon: both the copy and check glyphs stay mounted, stacked,
 * and opacity-swap on success — so the flash never reflows the button. Both
 * CSS modules that style copy buttons (CaseInfoCards, VerticalCarousel)
 * define the same four class names; pass whichever the button lives in.
 */
export default function CopySwapIcon({
  copied,
  styles,
}: {
  copied: boolean;
  /** A CSS module defining iconSwap / iconLayer / iconHidden / iconVisible. */
  styles: Record<string, string>;
}) {
  return (
    <span className={styles.iconSwap} aria-hidden="true">
      <CopyIcon
        className={`${styles.iconLayer} ${
          copied ? styles.iconHidden : styles.iconVisible
        }`}
      />
      <CheckIcon
        className={`${styles.iconLayer} ${
          copied ? styles.iconVisible : styles.iconHidden
        }`}
      />
    </span>
  );
}
