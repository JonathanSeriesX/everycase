import React from "react";
import { Image } from "lightbox.js-react";

/**
 * SingleImage Component
 * 
 * A lightweight component to render a single image with a title using the lightbox.js-react library.
 * 
 * This component is designed for cases where the model page has only one image to display.
 * 
 * @param {Object} props - The component's props.
 * @param {string} props.image - The URL of the image to display.
 * @param {string} props.alt - The alt text and title for the image.
 * 
 * @returns {JSX.Element} A single image wrapped for lightbox functionality.
 */
const SingleImage = ({ image, alt }) => {
  return <Image image={{ src: image, title: alt }} />;
};

export default SingleImage;