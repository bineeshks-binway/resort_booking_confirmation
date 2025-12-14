import React from 'react';
import Image from 'next/image';

interface GalleryImageCardProps {
    src: string;
    alt: string;
    category: string;
    onClick: () => void;
}

const GalleryImageCard: React.FC<GalleryImageCardProps> = ({ src, alt, category, onClick }) => {
    return (
        <div
            className="relative group cursor-pointer overflow-hidden rounded-xl bg-gray-100 aspect-[4/3] break-inside-avoid mb-4"
            onClick={onClick}
        >
            <Image
                src={src}
                alt={alt}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/60 to-transparent">
                <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                    {category}
                </span>
            </div>
        </div>
    );
};

export default GalleryImageCard;
