"use client";

import { ImageZoom } from "nextra/components";

const LightboxComponent = ({ images }) => {
  const columnTemplate = "repeat(auto-fit, minmax(240px, 1fr))";
  const maxColumns = 3;
  const gap = 16; // matches Tailwind gap-4
  const maxWidth = `calc(${maxColumns} * 240px + ${(maxColumns - 1) * gap}px)`;

  return (
    <div
      className="not-prose grid w-full gap-4 mx-auto"
      style={{ gridTemplateColumns: columnTemplate, maxWidth }}
    >
      {images.map((image, index) => (
        <div key={index} className="w-full">
          <ImageZoom
            className="w-full h-auto !m-0 rounded"
            src={image.src}
            alt={image.alt || "Case"}
            width={image.width || 500}
            height={image.height || 500}
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            unoptimized
          />
        </div>
      ))}
    </div>
  );
};

export default LightboxComponent;
