import React from 'react'
import { Image } from 'lightbox.js-react'

const SingleImage = ({ image, alt }) => {
    return (
        <Image image={{ src: image, title: alt }} />
    );
}

export default SingleImage;