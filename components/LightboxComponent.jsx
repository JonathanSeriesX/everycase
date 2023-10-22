import React from 'react';
import { SlideshowLightbox } from 'lightbox.js-react';

const LightboxComponent = ({ src, alt }) => {
    return (
        <SlideshowLightbox className='container grid grid-cols-3 gap-2 mx-auto' showThumbnails={true}>
            <img className='w-full rounded' src='https://images.pexels.com/photos/580151/pexels-photo-580151.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' />
            <img className='w-full rounded' src='https://images.pexels.com/photos/13996896/pexels-photo-13996896.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' />
            <img className='w-full rounded' src='https://images.pexels.com/photos/13208323/pexels-photo-13208323.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' />
        </SlideshowLightbox>
    );
}

export default LightboxComponent;
