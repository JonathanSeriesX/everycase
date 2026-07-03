"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LinkArrowIcon } from "./icons";
import Lightbox, { useLightboxState } from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Image from "next/image";
import "yet-another-react-lightbox/styles.css";

// Extra data carried on each lightbox slide (see createSlide below).
declare module "yet-another-react-lightbox" {
  interface SlideImage {
    originalSrc?: string;
    formatLinks?: FormatLinks;
    sources?: string[];
    previewSrc?: string;
  }
}

/** What callers hand us per image; everything else is derived. */
export interface GalleryImage {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  formatLinks?: FormatLinks;
  previewSrc?: string;
}

interface FormatLinks {
  jpg?: string;
  png?: string;
}

const APPLE_IMAGE_BASE_URL =
  "https://store.storeimages.cdn-apple.com/8755/as-images.apple.com/is";
const LIGHTBOX_IMAGE_BASE_URL = "https://cloudfront.everycase.org/everyimage";
const LIGHTBOX_IMAGE_FORMAT = "webp";
const LIGHTBOX_PREVIEW_BASE_URL =
  "https://cloudfront.everycase.org/everypreview";
const LIGHTBOX_PREVIEW_FORMAT = "avif";
const FORMAT_PARAMS = {
  jpg: "?wid=2560&hei=2560&fmt=jpg&qlt=95",
  png: "?wid=4608&hei=4608&fmt=png-alpha",
};
const DEFAULT_DIMENSION = 2048;
const GRID_CONFIG = { minColumnWidth: 240, maxColumns: 4, gap: 12 };

const getAppleImageCode = (src: string | undefined): string => {
  if (!src) return "";
  const [path] = src.split("?");
  return path?.split("/").pop() ?? "";
};

const buildFormatLink = (src: string, format: "jpg" | "png"): string => {
  const code = getAppleImageCode(src);
  const params = FORMAT_PARAMS[format];
  if (code && params) {
    return `${APPLE_IMAGE_BASE_URL}/${code}${params}`;
  }
  return src;
};

const buildCarouselImageSrc = (code: string): string =>
  code ? `${LIGHTBOX_IMAGE_BASE_URL}/${code}.${LIGHTBOX_IMAGE_FORMAT}` : "";

const buildPreviewImageSrc = (src: string): string => {
  const code = getAppleImageCode(src);
  return code
    ? `${LIGHTBOX_PREVIEW_BASE_URL}/${code}.${LIGHTBOX_PREVIEW_FORMAT}`
    : "";
};

const buildSlideSources = (src: string): string[] => {
  const code = (getAppleImageCode(src) || "").split(".")[0];
  const cloudfrontSrc = buildCarouselImageSrc(code);
  if (cloudfrontSrc && cloudfrontSrc !== src) {
    return [cloudfrontSrc, src].filter(Boolean);
  }
  return [src].filter(Boolean);
};

// Ensures download buttons always point at Apple's pristine sources.
const buildFormatLinks = (image: GalleryImage): FormatLinks => ({
  jpg: image.formatLinks?.jpg || buildFormatLink(image.src, "jpg"),
  png: image.formatLinks?.png || buildFormatLink(image.src, "png"),
});

// Lightbox slides capture every bit of data needed for the zoom/gallery views.
const createSlide = (image: GalleryImage) => ({
  originalSrc: image.src,
  src: image.src,
  alt: image.alt || "Case image",
  width: image.width || DEFAULT_DIMENSION,
  height: image.height || DEFAULT_DIMENSION,
  formatLinks: buildFormatLinks(image),
  sources: buildSlideSources(image.src),
  previewSrc: image.previewSrc || buildPreviewImageSrc(image.src),
});

// Custom toolbar button that piggybacks on the lightbox context.
const FormatLinkButton = ({
  format,
  label,
  shortLabel,
}: {
  format: "jpg" | "png";
  label: string;
  shortLabel: string;
}) => {
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

// Resolves true once the browser has the image fetched AND decoded, so a
// later src swap paints instantly with no visible reload.
const preloadImage = (src: string): Promise<boolean> =>
  new Promise((resolve) => {
    const probe = new window.Image();
    probe.onload = async () => {
      try {
        await probe.decode?.();
      } catch {
        /* decode failures still paint fine */
      }
      resolve(true);
    };
    probe.onerror = () => resolve(false);
    probe.src = src;
  });

const LightboxComponent = ({ images = [] }: { images?: GalleryImage[] }) => {
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  // yarl emits a trailing view event during the closing animation; this ref
  // keeps it from re-adding the ?image param after close cleared it.
  const lightboxOpenRef = useRef(false);
  // What each gallery tile currently shows: the small AVIF preview at first,
  // silently upgraded to the full-res source once it is preloaded.
  const [tileSrcs, setTileSrcs] = useState<Record<number, string>>({});
  // Full-res sources are heavy (~800 KB each); fetching them is deferred
  // until the visitor first opens the lightbox and actually wants hi-res.
  const [upgradeStarted, setUpgradeStarted] = useState(false);
  // Per-tile position in the [preview, ...full-res] fallback chain, advanced
  // by onError when a tile's current source 404s.
  const [tileFallbacks, setTileFallbacks] = useState<Record<number, number>>(
    {},
  );

  // While the lightbox is open the URL carries the current image's filename.
  // replaceState only — browsing slides must never grow the history stack.
  const syncUrl = (code: string | null) => {
    const url = new URL(window.location.href);
    if (code) url.searchParams.set("image", code);
    else url.searchParams.delete("image");
    window.history.replaceState(window.history.state, "", url);
  };

  // Precompute lightbox slides with download helpers to keep render lean.
  const baseSlides = useMemo(() => images.map(createSlide), [images]);
  const sourceKey = baseSlides
    .map((slide) => slide.sources.join("|"))
    .join("||");
  const [sourceState, setSourceState] = useState<{
    key: string;
    indices: number[];
  }>({
    key: sourceKey,
    indices: baseSlides.map(() => 0),
  });

  const slides = useMemo(() => {
    const sourceIndices =
      sourceState.key === sourceKey ? sourceState.indices : [];
    return baseSlides.map((slide, index) => {
      const activeIndex = sourceIndices[index] ?? 0;
      const fallbackSources = slide.sources || [];
      const resolvedSrc =
        fallbackSources[activeIndex] ||
        fallbackSources[0] ||
        slide.originalSrc ||
        slide.src;
      return { ...slide, src: resolvedSrc };
    });
  }, [baseSlides, sourceKey, sourceState]);

  const advanceSlideSource = (slideIndex: number) => {
    const sources = baseSlides[slideIndex]?.sources || [];
    if (sources.length <= 1) return;
    setSourceState((previousState) => {
      const previous =
        previousState.key === sourceKey ? previousState.indices : [];
      const prevIndex = previous[slideIndex] ?? 0;
      const nextIndex = Math.min(prevIndex + 1, sources.length - 1);
      if (previousState.key === sourceKey && nextIndex === prevIndex) {
        return previousState;
      }
      const next = [...previous];
      next[slideIndex] = nextIndex;
      return { key: sourceKey, indices: next };
    });
  };

  // Once the lightbox has been opened, upgrade tiles one at a time, first to
  // last: preload + decode the full-res source in the background, then swap
  // the tile's src — the replacement is invisible. A source that fails
  // advances the slide's fallback chain (webp -> Apple CDN) and the next
  // candidate is tried.
  useEffect(() => {
    if (!upgradeStarted) return;
    let cancelled = false;
    (async () => {
      for (let index = 0; index < baseSlides.length; index++) {
        const sources = baseSlides[index].sources || [];
        for (let si = 0; si < sources.length; si++) {
          const ok = await preloadImage(sources[si]);
          if (cancelled) return;
          if (ok) {
            setTileSrcs((previous) =>
              previous[index] === sources[si]
                ? previous
                : { ...previous, [index]: sources[si] },
            );
            break;
          }
          advanceSlideSource(index);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by the source list itself
  }, [sourceKey, upgradeStarted]);

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
        {slides.map((slide, index) => {
          // Preview first; on a 404 the tile walks the full-res chain itself
          // (the background upgrade loop only runs after the lightbox opens).
          const candidates = [
            slide.previewSrc,
            ...(slide.sources ?? []),
          ].filter((source): source is string => Boolean(source));
          const fallbackIndex = Math.min(
            tileFallbacks[index] ?? 0,
            candidates.length - 1,
          );
          return (
            <button
              key={slide.originalSrc ?? slide.src ?? index}
              type="button"
              className="lightbox-tile relative w-full overflow-hidden"
              onClick={() => {
                lightboxOpenRef.current = true;
                setUpgradeStarted(true);
                setLightboxIndex(index);
              }}
              aria-label={`Open ${slide.alt || "case image"}`}
            >
              <Image
                src={tileSrcs[index] ?? candidates[fallbackIndex] ?? slide.src}
                alt={slide.alt || "Case image"}
                loading="lazy"
                width={slide.width}
                height={slide.height}
                className="block h-auto w-full object-contain"
                unoptimized
                onError={() =>
                  setTileFallbacks((previous) => ({
                    ...previous,
                    [index]: Math.min(
                      (previous[index] ?? 0) + 1,
                      candidates.length - 1,
                    ),
                  }))
                }
              />
            </button>
          );
        })}
      </div>
      <Lightbox
        slides={slides}
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        close={() => {
          // Imperative: the trailing view event fires before React re-renders.
          lightboxOpenRef.current = false;
          setLightboxIndex(-1);
          syncUrl(null);
        }}
        on={{
          view: ({ index }) => {
            if (!lightboxOpenRef.current) return;
            syncUrl(getAppleImageCode(baseSlides[index]?.originalSrc));
          },
        }}
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
