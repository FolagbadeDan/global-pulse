
import React from 'react';
import { NewsCategory } from '../types';
import { Globe, Trophy, Landmark, DollarSign, Music, Cpu, Leaf, AlertTriangle } from 'lucide-react';

interface CategoryBarProps {
  activeCategory: NewsCategory | 'all';
  onCategoryChange: (cat: NewsCategory) => void;
}

const CategoryBar: React.FC<CategoryBarProps> = ({ activeCategory, onCategoryChange }) => {
  const categories: { id: NewsCategory, label: string, icon: any }[] = [
    { id: 'world', label: 'World News', icon: Globe },
    { id: 'politics', label: 'Politics', icon: Landmark },
    { id: 'sports', label: 'Sports', icon: Trophy },
    { id: 'finance', label: 'Finance', icon: DollarSign },
    { id: 'entertainment', label: 'Entertainment', icon: Music },
    { id: 'tech', label: 'Technology', icon: Cpu },
    { id: 'environment', label: 'Environment', icon: Leaf },
    { id: 'disaster', label: 'Disasters', icon: AlertTriangle },
  ];

  return (
    <div className="bg-gray-900 border-b border-white/5 px-6 py-2 overflow-x-auto whitespace-nowrap scrollbar-hide flex gap-2">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onCategoryChange(cat.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border ${activeCategory === cat.id
              ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20'
              : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10'
            }`}
        >
          <cat.icon className="w-3.5 h-3.5" />
          {cat.label}
        </button>
      ))}
    </div>
  );
};

export default CategoryBar;
