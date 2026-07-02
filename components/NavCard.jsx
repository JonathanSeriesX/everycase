import Link from "next/link";
import Image from "next/image";
import styles from "../styles/VerticalCarousel.module.css";

const CAROUSEL_IMAGE_BASE_URL = "https://cloudfront.everycase.org/everypreview";
const APPLE_IMAGE_BASE_URL =
  "https://store.storeimages.cdn-apple.com/8755/as-images.apple.com/is";

// Navigation cards (home → group → model page) reuse the case-card shell so
// the drill-down feels like one continuous surface. No SKU/season badges —
// just an image and a title.
export default function NavCard({ href, title, subtitle, heroCase, image }) {
  const code = (heroCase?.alt_thumbnail || heroCase?.SKU || "").trim();
  const src =
    image ?? (code ? `${CAROUSEL_IMAGE_BASE_URL}/${code}.avif` : null);
  return (
    <article className={styles.caseCard}>
      <Link href={href} className={styles.cardLink}>
        <div className={styles.imageShell}>
          {src && (
            <Image
              src={src}
              width={512}
              height={512}
              alt=""
              className={styles.image}
              unoptimized
              loading="eager"
            />
          )}
        </div>
        <strong className={`${styles.caseTitle} ${styles.linkTitle}`}>
          {title}
        </strong>
        {subtitle && <span className={styles.navCardSubtitle}>{subtitle}</span>}
      </Link>
    </article>
  );
}

export function CardGrid({ children }) {
  return (
    <div className={styles.carouselWrapper}>
      <div className={styles.cardTrack}>{children}</div>
    </div>
  );
}
