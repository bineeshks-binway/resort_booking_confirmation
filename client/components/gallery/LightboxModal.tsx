import React, { useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface LightboxModalProps {
    isOpen: boolean;
    imageSrc: string;
    imageAlt: string;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
}

const LightboxModal: React.FC<LightboxModalProps> = ({ isOpen, imageSrc, imageAlt, onClose, onNext, onPrev }) => {

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen) return;

        if (e.key === 'Escape') onClose();
        if (e.key === 'ArrowRight') onNext();
        if (e.key === 'ArrowLeft') onPrev();
    }, [isOpen, onClose, onNext, onPrev]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fade-in">
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-50 p-2 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10"
            >
                <X size={32} />
            </button>

            {/* Navigation Buttons */}
            <button
                onClick={(e) => { e.stopPropagation(); onPrev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10 hidden md:block"
            >
                <ChevronLeft size={40} />
            </button>

            <button
                onClick={(e) => { e.stopPropagation(); onNext(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10 hidden md:block"
            >
                <ChevronRight size={40} />
            </button>

            {/* Image Container */}
            <div
                className="relative w-full h-full max-w-7xl max-h-[90vh] mx-auto flex items-center justify-center p-4"
                onClick={onClose} // Close on clicking background
            >
                <div
                    className="relative w-full h-full"
                    onClick={(e) => e.stopPropagation()} // Prevent close when clicking image
                >
                    <Image
                        src={imageSrc}
                        alt={imageAlt}
                        fill
                        className="object-contain"
                        priority
                        sizes="100vw"
                    />
                </div>
            </div>

            {/* Mobile Helper Text */}
            <div className="absolute bottom-6 left-0 right-0 text-center text-white/50 text-sm md:hidden">
                Swipe or tap edges to navigate
            </div>
        </div>
    );
};

export default LightboxModal;
