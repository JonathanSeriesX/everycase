import React from 'react';
import { SlideshowLightbox } from 'lightbox.js-react';

const LightboxComponent = ({ src, alt }) => {
    return (
        <SlideshowLightbox className='container grid grid-cols-3 gap-2 mx-auto' showThumbnails={true}>
            <img className='w-full rounded' src='https://cloudfront.everycase.org/everysource/MF041.webp' />
            <img className='w-full rounded' src='https://cloudfront.everycase.org/everysource/MF041.webp' />
            <img className='w-full rounded' src='https://cloudfront.everycase.org/everysource/MF041.webp' />

        </SlideshowLightbox>
    );
}

export default LightboxComponent;
