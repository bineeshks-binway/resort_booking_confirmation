'use client';

import React, { useState } from 'react';
import GalleryGrid, { GalleryImage } from '../../components/gallery/GalleryGrid';
import LightboxModal from '../../components/gallery/LightboxModal';

// Local Data
const galleryImages: GalleryImage[] = [
    { id: 1, category: 'Resort', alt: 'Resort View', src: '/resort_image/image1.jpeg' },
    { id: 2, category: 'Resort', alt: 'Resort Amenities', src: '/resort_image/image2.jpeg' },
    { id: 3, category: 'Resort', alt: 'Scenic Outdoors', src: '/resort_image/image3.jpeg' },
    { id: 4, category: 'Resort', alt: 'Comfortable Interiors', src: '/resort_image/image4.jpeg' },
    { id: 5, category: 'Resort', alt: 'Relaxing Ambience', src: '/resort_image/image5.jpeg' },
    { id: 6, category: 'Resort', alt: 'Night Lighting', src: '/resort_image/image6.jpeg' },
    { id: 7, category: 'Resort', alt: 'Poolside View', src: '/resort_image/image7.jpeg' },
    { id: 8, category: 'Resort', alt: 'Dining Area', src: '/resort_image/image8.jpeg' },
];

export default function GalleryPage() {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

    // Handlers
    const openLightbox = (image: GalleryImage) => {
        const index = galleryImages.findIndex(img => img.id === image.id);
        setCurrentImageIndex(index);
        setLightboxOpen(true);
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
    };

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
    };

    const currentImage = galleryImages[currentImageIndex];

    return (
        <main className="min-h-screen bg-stone-50 font-sans selection:bg-green selection:text-white">
            <div className="pt-12">
                <GalleryGrid
                    images={galleryImages}
                    onImageClick={openLightbox}
                />
            </div>
            <LightboxModal
                isOpen={lightboxOpen}
                imageSrc={currentImage?.src}
                imageAlt={currentImage?.alt}
                onClose={closeLightbox}
                onNext={nextImage}
                onPrev={prevImage}
            />
        </main>
    );
}
