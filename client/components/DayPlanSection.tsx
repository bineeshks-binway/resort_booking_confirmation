import React from 'react';
import SightCard from './SightCard';

export interface Place {
    name: string;
    description: string;
    image: string;
}

interface DayPlanSectionProps {
    id: string;
    title: string;
    subtitle: string;
    places: Place[];
    isAlternate?: boolean;
}

const DayPlanSection: React.FC<DayPlanSectionProps> = ({ id, title, subtitle, places, isAlternate = false }) => {
    return (
        <section id={id} className={`py-20 px-4 md:px-8 ${isAlternate ? 'bg-stone-50' : 'bg-white'}`}>
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-display font-bold text-gray-900 mb-4">
                        {title}
                    </h2>
                    <p className="text-lg text-gray-600 font-light max-w-2xl mx-auto">
                        {subtitle}
                    </p>
                    <div className="w-24 h-1 bg-green mx-auto mt-8 rounded-full opacity-60" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {places.map((place, index) => (
                        <div key={index} className="scroll-mt-24 fade-in-section">
                            <SightCard
                                title={place.name}
                                description={place.description}
                                image={place.image}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default DayPlanSection;
