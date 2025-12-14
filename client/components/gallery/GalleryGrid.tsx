import React from 'react';
import GalleryImageCard from './GalleryImageCard';

export interface GalleryImage {
    id: number;
    src: string;
    category: string;
    alt: string;
}

interface GalleryGridProps {
    images: GalleryImage[];
    onImageClick: (image: GalleryImage) => void;
}

const GalleryGrid: React.FC<GalleryGridProps> = ({ images, onImageClick }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 px-4 pb-12 max-w-7xl mx-auto">
            {images.map((image) => (
                <GalleryImageCard
                    key={image.id}
                    src={image.src}
                    alt={image.alt}
                    category={image.category}
                    onClick={() => onImageClick(image)}
                />
            ))}
        </div>
    );
};

export default GalleryGrid;
