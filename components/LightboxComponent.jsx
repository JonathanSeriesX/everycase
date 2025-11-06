"use client";

import { useMemo, useState } from "react";
import PhotoAlbum from "react-photo-album";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "react-photo-album/styles.css";
import "yet-another-react-lightbox/styles.css";

const DEFAULT_DIMENSION = 1600;

const LightboxComponent = ({ images }) => {
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const slides = useMemo(
    () =>
      images.map((image) => ({
        src: image.src,
        alt: image.alt || "Case image",
        width: image.width || DEFAULT_DIMENSION,
        height: image.height || DEFAULT_DIMENSION,
      })),
    [images]
  );

  return (
    <>
      <PhotoAlbum
        layout="rows"
        targetRowHeight={320}
        spacing={12}
        photos={slides}
        onClick={({ index }) => setLightboxIndex(index)}
        componentsProps={{
          imageProps: {
            loading: "lazy",
            className: "rounded-md shadow-sm",
          },
        }}
      />
      <Lightbox
        slides={slides}
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        close={() => setLightboxIndex(-1)}
        plugins={[Zoom]}
        animation={{ fade: 250 }}
        controller={{ closeOnBackdropClick: true }}
      />
    </>
  );
};

export default LightboxComponent;
