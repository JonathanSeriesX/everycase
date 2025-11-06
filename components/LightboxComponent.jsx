"use client";

import { useMemo, useState } from "react";
import { ColumnsPhotoAlbum } from "react-photo-album";
import Lightbox from "yet-another-react-lightbox";
import Download from "yet-another-react-lightbox/plugins/download";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "react-photo-album/columns.css";
import "yet-another-react-lightbox/styles.css";

const DEFAULT_DIMENSION = 2048;
const DOWNLOAD_BASE_URL =
  "https://store.storeimages.cdn-apple.com/8755/as-images.apple.com/is";

const buildDownloadUrl = (src) => {
  const filename = src?.split("/").pop() ?? "";
  const [code] = filename.split(".");

  return code ? `${DOWNLOAD_BASE_URL}/${code}?wid=2560&hei=2560&fmt=avif` : src;
};

const buildFilename = (src) => {
  const filename = src?.split("/").pop() ?? "";
  const [code] = filename.split(".");

  return code ? `${code}.avif` : src;
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
        downloadFilename: buildFilename(image.src),
        downloadUrl: buildDownloadUrl(image.src),
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
        plugins={[Zoom, Download]}
        animation={{ fade: 220, swipe: 280, zoom: 320 }}
        controller={{ closeOnBackdropClick: true }}
        zoom={{ maxZoomPixelRatio: 1.5, zoomInMultiplier: 1.25 }}
      />
    </>
  );
};

export default LightboxComponent;
