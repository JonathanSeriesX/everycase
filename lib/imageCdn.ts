// The three image hosts every component draws from. Kept in one place so a
// CDN move is a one-file change.

/** Apple's store CDN — pristine sources at any size/format via query params
    (`?wid=…&hei=…&fmt=…`). */
export const APPLE_IMAGE_BASE_URL =
  "https://store.storeimages.cdn-apple.com/8755/as-images.apple.com/is";

/** Our CloudFront mirror of the full-resolution shots, re-encoded to AVIF. */
export const EVERYIMAGE_BASE_URL = "https://cloudfront.everycase.org/everyimage";

/** Our CloudFront mirror of the small (512²) AVIF previews used by card
    grids and gallery tiles. */
export const EVERYPREVIEW_BASE_URL =
  "https://cloudfront.everycase.org/everypreview";

export const appleImageUrl = (code: string, params: string): string =>
  `${APPLE_IMAGE_BASE_URL}/${code}${params}`;

export const everyimageUrl = (code: string): string =>
  `${EVERYIMAGE_BASE_URL}/${code}.avif`;

export const everypreviewUrl = (code: string): string =>
  `${EVERYPREVIEW_BASE_URL}/${code}.avif`;
