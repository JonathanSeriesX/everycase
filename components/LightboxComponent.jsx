"use client";

import { useMemo, useState } from "react";
import PhotoAlbum from "react-photo-album";
import Lightbox from "yet-another-react-lightbox";
import Download from "yet-another-react-lightbox/plugins/download";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "react-photo-album/styles.css";
import "yet-another-react-lightbox/styles.css";

const DEFAULT_DIMENSION = 1600;

function buildFilename(alt = "", index = 0, src = "") {
  const base =
    alt
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "case";
  const suffix = index + 1;
  const extensionMatch = src.match(/\.(\w+)(?:[#?].*)?$/);
  const extension = extensionMatch ? extensionMatch[1] : "jpg";
  return `${base}-${suffix}.${extension}`;
}

const LightboxComponent = ({ images }) => {
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const slides = useMemo(
    () =>
      images.map((image, index) => ({
        src: image.src,
        alt: image.alt || "Case image",
        width: image.width || DEFAULT_DIMENSION,
        height: image.height || DEFAULT_DIMENSION,
        downloadFilename: buildFilename(image.alt, index, image.src),
        downloadUrl: image.src,
      })),
    [images]
  );

  return (
    <>
      <PhotoAlbum
        layout="rows"
        targetRowHeight={300}
        spacing={12}
        photos={slides}
        onClick={({ index }) => setLightboxIndex(index)}
        componentsProps={{
          imageProps: {
            loading: "lazy",
            className: "rounded-md shadow-sm transition-transform duration-150 ease-out hover:scale-[1.01]",
          },
        }}
      />
      <Lightbox
        slides={slides}
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        close={() => setLightboxIndex(-1)}
        plugins={[Zoom, Download]}
        animation={{ fade: 150, swipe: 200, zoom: 250 }}
        controller={{ closeOnBackdropClick: true }}
        zoom={{ maxZoomPixelRatio: 1.5, zoomInMultiplier: 1.25 }}
        download={{
          buttonTitle: "Download image",
          filename: (slide, { index }) =>
            slide.downloadFilename ?? buildFilename(slide.alt, index, slide.src),
        }}
      />
    </>
  );
};

export default LightboxComponent;
