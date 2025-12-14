import React from 'react';
import Image from 'next/image';

interface SightCardProps {
    image: string;
    title: string;
    description: string;
}

const SightCard: React.FC<SightCardProps> = ({ image, title, description }) => {
    return (
        <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full">
            <div className="relative w-full aspect-video overflow-hidden">
                <Image
                    src={image}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                <h3 className="absolute bottom-4 left-4 text-white font-display font-bold text-xl drop-shadow-md">
                    {title}
                </h3>
            </div>
            <div className="p-5 flex-grow">
                <p className="text-gray-600 text-sm leading-relaxed font-sans">
                    {description}
                </p>
            </div>
        </div>
    );
};

export default SightCard;
