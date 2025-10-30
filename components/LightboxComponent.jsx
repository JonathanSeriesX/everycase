"use client"

import React from "react";
import { SlideshowLightbox } from "lightbox.js-react";
import Image from "next/image";

const LightboxComponent = ({ images }) => {
  return (
    <SlideshowLightbox
      className="container grid grid-cols-3 gap-2 mx-auto"
      showThumbnails={true}
      showSlideshowIcon={false}
      theme="lightbox"
      slideDuration={0}
      lightboxIdentifier="lightbox2"
      framework="next"
      thumbnailImgClass="custom-thumbnail"
      modalClose="clickOutside"
      images={images}
    >
      {images.map((image, index) => (
        <Image
          key={index}
          className="w-full rounded"
          data-lightboxjs="lightbox2"
          src={image.src}
          alt={image.alt || "Case"}
          width={image.width || 500}
          height={image.height || 500}
        />
      ))}
    </SlideshowLightbox>
  );
};

export default LightboxComponent;
