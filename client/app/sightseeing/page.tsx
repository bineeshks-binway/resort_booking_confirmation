'use client';

import DayPlanSection, { Place } from '../../components/DayPlanSection';


export default function SightseeingPage() {


    const day1Places: Place[] = [
        {
            name: "Jain Temple – Sulthan Bathery",
            description: "An ancient 13th-century temple with exceptional architecture, showcasing the rich history of Jainism in Wayanad.",
            image: "/sightseeing/jaintemple.jpg"
        },
        {
            name: "Edakkal Caves",
            description: "Prehistoric caves featuring Neolithic stone carvings. A trek up provides a stunning panoramic view of the valley.",
            image: "/sightseeing/edakkalcave.webp"
        },
        {
            name: "Ambalavayal Heritage Museum",
            description: "Explore tribal artifacts, ancient pottery, and weapons that tell the story of Wayanad's indigenous culture.",
            image: "/sightseeing/AmbalavayalHeritage.jpg"
        },
        {
            name: "Phantom Rock (View Point)",
            description: "A naturally formed skull-shaped rock formation that offers spectacular views of the surrounding landscape.",
            image: "/sightseeing/phantom-rock.jpg"
        },
        {
            name: "Karapuzha Dam",
            description: "India's largest earth dam, featuring a beautiful garden and adventure activities like zip-lining.",
            image: "/sightseeing/Karapuzha-Dam.jpg"
        },

    ];

    const day2Places: Place[] = [
        {
            name: "Muthanga Wild Life Safari",
            description: "A journey into the heart of the wild, where you can spot elephants, tigers, deer, and exotic birds in their natural habitat.",
            image: "/sightseeing/muthanga.jpg"
        },
        {
            name: "Banasura Sagar Dam",
            description: "The largest earthen dam in India and the second largest in Asia, famous for its island-studded reservoir.",
            image: "/sightseeing/banasura-sagar.jpg"
        },
        {
            name: "Karlad Lake",
            description: "A serene getaway offering kayaking, rock climbing, and zip-lining for adventure enthusiasts.",
            image: "/sightseeing/karlad-lake.webp"
        },
        {
            name: "Kanthanpara Waterfalls",
            description: "A scenic waterfall surrounded by lush greenery, offering a peaceful spot to relax and enjoy nature. Easy access and ideal for photography.",
            image: "/sightseeing/kanthanpara-waterfalls.jpg"
        },
        {
            name: "900 Kandi View Point",
            description: "A thrilling hilltop destination featuring a glass bridge and breathtaking valley views. Popular for adventure experiences like zip-lining and off-road jeep rides.",
            image: "/sightseeing/900-kandi.jpg"
        },

        {
            name: "Lakkidi View Point",
            description: "The gateway to Wayanad, offering a bird’s eye view of the winding Thamarassery ghat roads.",
            image: "/sightseeing/lakkidi-view-point.jpg"
        },
        {
            name: "Pookode Lake",
            description: "A freshwater lake shaped like India's map, surrounded by evergreen forests. Perfect for boating.",
            image: "/sightseeing/pookode-lake.jpg"
        },
        {
            name: "En Ooru (Tribal Heritage Village)",
            description: "A showcase of Wayanad's tribal heritage, featuring traditional architecture, art, and ethnic cuisine.",
            image: "/sightseeing/En-Ooru.jpg"
        },
        // Placeholder for grid balance if needed, or stick to 5
    ];

    return (
        <main className="min-h-screen bg-gray-50 font-sans">


            <DayPlanSection
                id="day1"
                title="Day 1 – Culture, History & Nature"
                subtitle="Immerse yourself in the rich heritage and natural wonders of Sulthan Bathery and surroundings."
                places={day1Places}
            />

            <DayPlanSection
                id="day2"
                title="Day 2 – Lakes, Dams & Viewpoints"
                subtitle="Experience the majestic water bodies and breathtaking peaks that define Wayanad's landscape."
                places={day2Places}
                isAlternate={true}
            />

            <div className="py-12 bg-white px-4">
                <div className="max-w-4xl mx-auto bg-amber-50 rounded-xl p-8 border border-amber-100 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                    <div className="bg-amber-100 p-3 rounded-full text-amber-700">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-amber-900 mb-2 font-display">Travel Tips</h3>
                        <ul className="text-amber-800 space-y-2 text-sm md:text-base">
                            <li>• <strong>Best Time:</strong> Start by 8:30 AM to cover all spots comfortably.</li>
                            <li>• <strong>Footwear:</strong> Wear comfortable walking shoes, especially for Edakkal Caves.</li>
                            <li>• <strong>Entry Fees:</strong> Carry small cash for entry tickets at various monuments.</li>
                        </ul>
                    </div>
                </div>
            </div>


        </main>
    );
}
