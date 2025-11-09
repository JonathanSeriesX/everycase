"use client";

import { useMemo, useState } from "react";
import { LinkArrowIcon } from "nextra/icons";
import { ColumnsPhotoAlbum } from "react-photo-album";
import Lightbox, { useLightboxState } from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "react-photo-album/columns.css";
import "yet-another-react-lightbox/styles.css";

const APPLE_IMAGE_BASE_URL =
  "https://store.storeimages.cdn-apple.com/8755/as-images.apple.com/is";
const FORMAT_PARAMS = {
  avif: "?wid=4608&hei=4608&fmt=avif",
  png: "?wid=4608&hei=4608&png-alpha",
};
const DEFAULT_DIMENSION = 2048;

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

const LightboxComponent = ({ images }) => {
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const slides = useMemo(
    () =>
      images.map((image) => ({
        src: image.src,
        alt: image.alt || "Case image",
        width: image.width || DEFAULT_DIMENSION,
        height: image.height || DEFAULT_DIMENSION,
        formatLinks: {
          avif: image.formatLinks?.avif || buildFormatLink(image.src, "avif"),
          png: image.formatLinks?.png || buildFormatLink(image.src, "png"),
        },
      })),
    [images]
  );

  return (
    <>
      <ColumnsPhotoAlbum
        layout="columns"
        columns={(containerWidth) => {
          if (containerWidth < 480) return 2;
          if (containerWidth < 800) return 3;
          return 4;
        }}
        spacing={0}
        photos={slides}
        onClick={({ index }) => setLightboxIndex(index)}
        componentsProps={{
          imageProps: {
            loading: "lazy",
            className:
              "rounded-md shadow-sm transition-transform duration-150 ease-out hover:scale-[1.01]",
          },
        }}
      />
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
              key="lightbox-format-avif"
              format="avif"
              label="Open AVIF image in new tab"
              shortLabel=".avif"
            />,
            <FormatLinkButton
              key="lightbox-format-png"
              format="png"
              label="Open PNG image in new tab"
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
