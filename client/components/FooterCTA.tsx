import React from 'react';
import { MapPin, Phone } from 'lucide-react';

const FooterCTA: React.FC = () => {
    return (
        <section className="bg-green text-white py-20 px-4 md:px-8">
            <div className="max-w-5xl mx-auto text-center">
                <h2 className="text-3xl md:text-5xl font-display font-bold mb-8">
                    Ready to Explore Wayanad?
                </h2>
                <p className="text-lg md:text-xl text-white/90 font-light mb-12 max-w-2xl mx-auto">
                    Our resort travel desk can arrange comfortable taxis and experienced guides to make your sightseeing hassle-free.
                </p>

                <div className="flex flex-col md:flex-row gap-6 justify-center">
                    <button className="flex items-center justify-center gap-3 px-8 py-5 bg-white text-green rounded-full font-bold text-lg hover:bg-stone-100 transition-colors shadow-lg hover:shadow-xl">
                        <Phone size={24} />
                        <span>Contact Front Desk for Taxi</span>
                    </button>

                    <button className="flex items-center justify-center gap-3 px-8 py-5 bg-green-700 text-white border border-white/20 rounded-full font-bold text-lg hover:bg-green-600 transition-colors shadow-lg hover:shadow-xl">
                        <MapPin size={24} />
                        <span>Open Map Locations</span>
                    </button>
                </div>

                <p className="mt-12 text-sm text-white/60">
                    * Taxi rates and availability may vary. Please book in advance at the reception.
                </p>
            </div>
        </section>
    );
};

export default FooterCTA;
