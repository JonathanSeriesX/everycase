"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "../styles/VerticalCarousel.module.css";

const CAROUSEL_IMAGE_BASE_URL = "https://cloudfront.everycase.org/everypreview";
const APPLE_IMAGE_BASE_URL =
  "https://store.storeimages.cdn-apple.com/8755/as-images.apple.com/is";
const APPLE_FALLBACK_PARAMS = "?wid=512&hei=512&fmt=png-alpha";

/**
 * Case artwork with graceful degradation: CloudFront AVIF preview first,
 * Apple's CDN render if that 404s. Shared by CaseCard and NavCard.
 */
export default function CaseImage({ code, alt = "", priority = false }) {
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
      loading={priority ? "eager" : "lazy"}
      unoptimized
      onError={() =>
        setIndex((current) => Math.min(current + 1, sources.length - 1))
      }
    />
  );
}
