"use client";

import { useMemo, useState } from "react";
import { ColumnsPhotoAlbum } from "react-photo-album";
import Lightbox from "yet-another-react-lightbox";
import Download from "yet-another-react-lightbox/plugins/download";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "react-photo-album/columns.css";
import "yet-another-react-lightbox/styles.css";

const APPLE_IMAGE_BASE_URL =
  "https://store.storeimages.cdn-apple.com/8755/as-images.apple.com/is";
const DOWNLOAD_IMAGE_PARAMS = "?wid=4608&hei=4608&fmt=png-alpha";
const DEFAULT_DIMENSION = 2048;

const getAppleImageCode = (src) => {
  if (!src) return "";
  const [path] = src.split("?");
  return path?.split("/").pop() ?? "";
};

const buildDownloadUrl = (src) => {
  const code = getAppleImageCode(src);
  return code ? `${APPLE_IMAGE_BASE_URL}/${code}${DOWNLOAD_IMAGE_PARAMS}` : src;
};

const buildFilename = (src) => {
  const code = getAppleImageCode(src);

  return code ? `${code}.png` : src;
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
