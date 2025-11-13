"use client";

import { useEffect, useMemo, useState } from "react";
import { LinkArrowIcon } from "nextra/icons";
import Lightbox, { useLightboxState } from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Image from "next/image";
import "yet-another-react-lightbox/styles.css";

const APPLE_IMAGE_BASE_URL =
  "https://store.storeimages.cdn-apple.com/8755/as-images.apple.com/is";
const LIGHTBOX_IMAGE_BASE_URL = "https://cloudfront.everycase.org/everyimage";
const LIGHTBOX_IMAGE_FORMAT = "webp";
const FORMAT_PARAMS = {
  jpg: "?wid=2560&hei=2560&fmt=jpg&qlt=90",
  png: "?wid=4608&hei=4608&fmt=png-alpha",
};
const DEFAULT_DIMENSION = 2048;
const GRID_CONFIG = { minColumnWidth: 240, maxColumns: 4, gap: 12 };

const getAppleImageCode = (src) => {
  if (!src) return "";
  const [path] = src.split("?");
  return path?.split("/").pop() ?? "";
};

const buildFormatLink = (src, format) => {
  const code = getAppleImageCode(src);
  const params = FORMAT_PARAMS[format];
  if (code && params) {
    return `${APPLE_IMAGE_BASE_URL}/${code}${params}`;
  }
  return src;
};

const buildCarouselImageSrc = (code) =>
  code ? `${LIGHTBOX_IMAGE_BASE_URL}/${code}.${LIGHTBOX_IMAGE_FORMAT}` : "";

const buildSlideSources = (src) => {
  const code = (getAppleImageCode(src) || "").split(".")[0];
  const cloudfrontSrc = buildCarouselImageSrc(code);
  if (cloudfrontSrc && cloudfrontSrc !== src) {
    return [cloudfrontSrc, src].filter(Boolean);
  }
  return [src].filter(Boolean);
};

// Ensures download buttons always point at Apple's pristine sources.
const buildFormatLinks = (image) => ({
  jpg: image.formatLinks?.jpg || buildFormatLink(image.src, "jpg"),
  png: image.formatLinks?.png || buildFormatLink(image.src, "png"),
});

// Lightbox slides capture every bit of data needed for the zoom/gallery views.
const createSlide = (image) => ({
  originalSrc: image.src,
  src: image.src,
  alt: image.alt || "Case image",
  width: image.width || DEFAULT_DIMENSION,
  height: image.height || DEFAULT_DIMENSION,
  formatLinks: buildFormatLinks(image),
  sources: buildSlideSources(image.src),
});

// Custom toolbar button that piggybacks on the lightbox context.
const FormatLinkButton = ({ format, label, shortLabel }) => {
  const { currentSlide } = useLightboxState();
  const href = currentSlide?.formatLinks?.[format];

  if (!href) {
    return null;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="yarl__button lightbox-format-link"
      title={label}
      aria-label={label}
      data-format={format}
    >
      <span className="lightbox-format-link__badge">
        <span className="lightbox-format-link__text">{shortLabel}</span>
        <LinkArrowIcon
          aria-hidden="true"
          focusable="false"
          className="lightbox-format-link__icon"
        />
      </span>
    </a>
  );
};

const LightboxComponent = ({ images = [] }) => {
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  // Precompute lightbox slides with download helpers to keep render lean.
  const baseSlides = useMemo(() => images.map(createSlide), [images]);
  const [sourceIndices, setSourceIndices] = useState(() =>
    baseSlides.map(() => 0)
  );

  useEffect(() => {
    setSourceIndices(baseSlides.map(() => 0));
  }, [baseSlides]);

  const slides = useMemo(
    () =>
      baseSlides.map((slide, index) => {
        const activeIndex = sourceIndices[index] ?? 0;
        const fallbackSources = slide.sources || [];
        const resolvedSrc =
          fallbackSources[activeIndex] ||
          fallbackSources[0] ||
          slide.originalSrc ||
          slide.src;
        return { ...slide, src: resolvedSrc };
      }),
    [baseSlides, sourceIndices]
  );

  const advanceSlideSource = (slideIndex) => {
    const sources = baseSlides[slideIndex]?.sources || [];
    if (sources.length <= 1) return;
    setSourceIndices((previous) => {
      const prevIndex = previous[slideIndex] ?? 0;
      const nextIndex = Math.min(prevIndex + 1, sources.length - 1);
      if (nextIndex === prevIndex) return previous;
      const next = [...previous];
      next[slideIndex] = nextIndex;
      return next;
    });
  };

  const gridStyle = useMemo(() => {
    const { minColumnWidth, maxColumns, gap } = GRID_CONFIG;
    return {
      gridTemplateColumns: `repeat(auto-fit, minmax(min(50%, ${minColumnWidth}px), 1fr))`,
      maxWidth: `${maxColumns * minColumnWidth + (maxColumns - 1) * gap}px`,
    };
  }, []);

  return (
    <>
      <div
        className="lightbox-grid not-prose grid w-full gap-3 mx-auto"
        style={gridStyle}
      >
        {slides.map((slide, index) => (
          <button
            key={slide.originalSrc ?? slide.src ?? index}
            type="button"
            className="lightbox-tile relative w-full overflow-hidden"
            onClick={() => setLightboxIndex(index)}
            aria-label={`Open ${slide.alt || "case image"}`}
          >
            <Image
              src={slide.src}
              alt={slide.alt || "Case image"}
              loading="lazy"
              width={slide.width}
              height={slide.height}
              className="block h-auto w-full object-contain"
              unoptimized
              onError={() => advanceSlideSource(index)}
            />
          </button>
        ))}
      </div>
      <Lightbox
        slides={slides}
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        close={() => setLightboxIndex(-1)}
        plugins={[Zoom]}
        animation={{ fade: 220, swipe: 280, zoom: 320 }}
        controller={{ closeOnBackdropClick: true }}
        zoom={{ maxZoomPixelRatio: 1.5, zoomInMultiplier: 1.25 }}
        toolbar={{
          buttons: [
            <FormatLinkButton
              key="lightbox-format-jpg"
              format="jpg"
              label="Open a medium-res JPG image in a new tab (up to ~500 KB)"
              shortLabel=".jpg"
            />,
            <FormatLinkButton
              key="lightbox-format-png"
              format="png"
              label="Opens an ultra hi-res PNG image in a new tab (up to ~10 MB)"
              shortLabel=".png"
            />,
            "zoom",
            "close",
          ],
        }}
      />
    </>
  );
};

export default LightboxComponent;
