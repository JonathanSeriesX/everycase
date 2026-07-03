"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "../styles/VerticalCarousel.module.css";

const CAROUSEL_IMAGE_BASE_URL = "https://cloudfront.everycase.org/everypreview";
const APPLE_IMAGE_BASE_URL =
  "https://store.storeimages.cdn-apple.com/8755/as-images.apple.com/is";
const APPLE_FALLBACK_PARAMS = "?wid=512&hei=512&fmt=png-alpha";

interface CaseImageProps {
  /** SKU or everypreview image code. */
  code: string;
  alt?: string;
  priority?: boolean;
  activated?: boolean;
}

/**
 * Case artwork with graceful degradation: CloudFront AVIF preview first,
 * Apple's CDN render if that 404s. Shared by CaseCard and NavCard.
 *
 * Everything downloads — visible grids first, hidden tab panels last.
 * `priority` marks the initially-visible tab's cards: those load eagerly at
 * high priority. Cards in hidden panels start with `activated: false`
 * (`loading="lazy"` inside a `hidden` subtree fetches nothing) and are
 * flipped to eager by KindSectionClient once the page has loaded, so they
 * queue behind the visible content instead of competing with it. The flip
 * is explicit because native lazy never fires for images revealed from a
 * hidden ancestor — Chrome only rechecks on scroll.
 */
export default function CaseImage({
  code,
  alt = "",
  priority = false,
  activated = true,
}: CaseImageProps) {
  const sources = code
    ? [
        `${CAROUSEL_IMAGE_BASE_URL}/${code}.avif`,
        `${APPLE_IMAGE_BASE_URL}/${code}${APPLE_FALLBACK_PARAMS}`,
      ]
    : [];
  const [index, setIndex] = useState(0);
  if (sources.length === 0) return null;

  return (
    <Image
      src={sources[Math.min(index, sources.length - 1)]}
      width={512}
      height={512}
      alt={alt}
      title={alt || undefined}
      className={styles.image}
      fetchPriority={priority ? "high" : "low"}
      loading={priority || activated ? "eager" : "lazy"}
      unoptimized
      onError={() =>
        setIndex((current) => Math.min(current + 1, sources.length - 1))
      }
    />
  );
}
