"use client";

import { useMemo, useState } from "react";
import { LinkArrowIcon } from "nextra/icons";
import Lightbox, { useLightboxState } from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Image from "next/image";
import "yet-another-react-lightbox/styles.css";

const APPLE_IMAGE_BASE_URL =
  "https://store.storeimages.cdn-apple.com/8755/as-images.apple.com/is";
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

// Ensures download buttons always point at Apple's pristine sources.
const buildFormatLinks = (image) => ({
  jpg: image.formatLinks?.jpg || buildFormatLink(image.src, "jpg"),
  png: image.formatLinks?.png || buildFormatLink(image.src, "png"),
});

// Lightbox slides capture every bit of data needed for the zoom/gallery views.
const createSlide = (image) => ({
  src: image.src,
  alt: image.alt || "Case image",
  width: image.width || DEFAULT_DIMENSION,
  height: image.height || DEFAULT_DIMENSION,
  formatLinks: buildFormatLinks(image),
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
  const slides = useMemo(() => images.map(createSlide), [images]);

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
            key={slide.src ?? index}
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
