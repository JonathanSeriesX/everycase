import React from 'react';
import { SlideshowLightbox } from 'lightbox.js-react';

const LightboxComponent = ({ images }) => {
    return (
        <SlideshowLightbox className='container grid grid-cols-3 gap-2 mx-auto' showThumbnails={true} showSlideshowIcon={false} theme="lightbox">
            {images.map((image, index) => (
                <img key={index} className='w-full rounded' src={image.src} alt={image.alt} />
            ))}
        </SlideshowLightbox>
    );
}

export default LightboxComponent;
