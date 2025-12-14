import React from 'react';
import Image from 'next/image';

interface HeroSectionProps {
    onScrollToDay1: () => void;
    onScrollToDay2: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onScrollToDay1, onScrollToDay2 }) => {
    return (
        <section className="relative h-[85vh] w-full flex items-center justify-center overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="https://images.unsplash.com/photo-1590449510138-0c2df5d5904d?q=80&w=2070&auto=format&fit=crop" // Wayanad/Kerala nature placeholder
                    alt="Wayanad Nature"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-black/40" />
            </div>

            {/* Content */}
            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto text-white">
                <span className="inline-block py-1 px-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-sm font-medium mb-6 animate-fade-in-up">
                    Wayanad Fort Resort Exclusive
                </span>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-6 leading-tight drop-shadow-lg animate-fade-in-up delay-100">
                    Explore Wayanad
                    <span className="block text-2xl md:text-3xl font-light mt-4 font-sans opacity-90">
                        2 Day Sightseeing Plan
                    </span>
                </h1>
                <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-2xl mx-auto font-light animate-fade-in-up delay-200">
                    Curated experiences near our resort. Discover ancient history, breathtaking viewpoints, and serene lakes.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up delay-300">
                    <button
                        onClick={onScrollToDay1}
                        className="px-8 py-4 bg-green hover:bg-green-700 text-white rounded-full font-semibold transition-all shadow-lg hover:shadow-green/30 w-full sm:w-auto transform hover:-translate-y-1"
                    >
                        View Day 1
                    </button>
                    <button
                        onClick={onScrollToDay2}
                        className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-full font-semibold transition-all hover:shadow-lg w-full sm:w-auto transform hover:-translate-y-1"
                    >
                        View Day 2
                    </button>
                </div>
            </div>

            {/* Soft bottom gradient for smooth transition */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50 to-transparent z-10" />
        </section>
    );
};

export default HeroSection;
