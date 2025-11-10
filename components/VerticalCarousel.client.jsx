"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./VerticalCarousel.module.css";

const CAROUSEL_IMAGE_BASE_URL = "https://cloudfront.everycase.org/everypreview";
// /MF039 will be put in between these two
const CAROUSEL_IMAGE_BASE_FORMAT = "webp";

const VerticalCarouselClient = ({ cases = [], model, material, season }) => {
  const [isSmallViewport, setIsSmallViewport] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallViewport(window.innerWidth < 600);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const sortedCases = [...cases].sort((a, b) =>
    (a.SKU || "").localeCompare(b.SKU || ""),
  );

  const displayLabel = (itemColour, itemModel) => {
    if (
      typeof material === "string" &&
      material.trim().toLowerCase() === "clear case"
    ) {
      return itemModel || model;
    }
    if (itemColour === "Clear Case") {
      return model || itemModel;
    }
    return itemColour;
  };

  return (
    <>
      <div className={styles.carouselWrapper}>
        <div className={styles.cardTrack}>
          {sortedCases.map((item, index) => {
            const isPriorityImage = index < 5;
            const imageAlt = `${item.model} ${item.kind}${
              item.kind === "Clear Case" ? "" : ` — ${item.colour}`
            }`;
            const imageCode = (item.alt_thumbnail || item.SKU || "").trim();
            const imageSrc = imageCode
              ? `${CAROUSEL_IMAGE_BASE_URL}/${imageCode}.${CAROUSEL_IMAGE_BASE_FORMAT}`
              : "";
            return (
              <article key={item.SKU} className={styles.caseCard}>
                <Link
                  href={`/case/${item.SKU}`}
                  className={styles.cardLink}
                  aria-label={`${item.model} ${item.kind}`}
                >
                  <div className={styles.imageShell}>
                    <Image
                      src={imageSrc}
                      width={512}
                      height={512}
                      alt={imageAlt}
                      className={styles.image}
                      fetchPriority={isPriorityImage ? "high" : "low"}
                      loading={isPriorityImage ? "eager" : "lazy"}
                      unoptimized="true"
                      title={imageAlt}
                    />
                  </div>
                  <div className={styles.cardContent}>
                    <strong className={styles.caseTitle}>
                      {displayLabel(item.colour, item.model)}
                    </strong>
                    <div className={styles.metaRow}>
                      <span className={styles.metaBadge}>
                        {item.SKU + (isSmallViewport ? "ZM" : "ZM/A")}
                      </span>
                      <span
                        className={`${styles.metaBadge} ${styles.metaBadgeSecondary}`}
                      >
                        {item.season || "—"}
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      </div>
      {sortedCases.length === 0 && (
        <p className={styles.emptyState}>
          No cases found for model {model}
          {material ? ` — ${material}` : ""}
          {season ? ` — ${season}` : ""}.
        </p>
      )}
    </>
  );
};

export default VerticalCarouselClient;
