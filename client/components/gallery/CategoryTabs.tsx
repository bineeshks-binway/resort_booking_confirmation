import React from 'react';

interface CategoryTabsProps {
    categories: string[];
    activeCategory: string;
    onCategoryChange: (category: string) => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ categories, activeCategory, onCategoryChange }) => {
    return (
        <div className="flex flex-wrap justify-center gap-4 mb-12">
            {categories.map((category) => (
                <button
                    key={category}
                    onClick={() => onCategoryChange(category)}
                    className={`
                        px-6 py-2 rounded-full text-sm md:text-base font-medium transition-all duration-300
                        ${activeCategory === category
                            ? 'bg-green text-white shadow-lg scale-105'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}
                    `}
                >
                    {category}
                </button>
            ))}
        </div>
    );
};

export default CategoryTabs;
