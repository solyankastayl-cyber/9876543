import React from 'react';
import { Brain, Users, Zap, Building2, Newspaper, Image, TrendingUp, Search, Star } from 'lucide-react';

const FACET_CONFIG = {
  SMART: { label: 'Smart', icon: Brain, color: 'text-purple-600', hint: 'Smart audience / elite followers' },
  INFLUENCE: { label: 'Influence', icon: Users, color: 'text-blue-600', hint: 'Influence & reach' },
  EARLY: { label: 'Early', icon: Zap, color: 'text-yellow-600', hint: 'Early projects & breakout potential' },
  VC: { label: 'VCs & Funds', icon: Building2, color: 'text-green-600', hint: 'Funds / backers registry' },
  MEDIA: { label: 'Media', icon: Newspaper, color: 'text-red-600', hint: 'Media accounts & coverage' },
  NFT: { label: 'NFT', icon: Image, color: 'text-pink-600', hint: 'NFT accounts / drops / promotion' },
  TRENDING: { label: 'Trending', icon: TrendingUp, color: 'text-orange-600', hint: 'Trading / market coverage' },
  MOST_SEARCHED: { label: 'Most Searched', icon: Search, color: 'text-cyan-600', hint: 'Search demand' },
  POPULAR: { label: 'Popular', icon: Star, color: 'text-amber-600', hint: 'Popular projects / mass attention' },
};

export default function FacetTabs({ facets, active, counters, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 py-3">
      {facets.map((key) => {
        const cfg = FACET_CONFIG[key] || { label: key, icon: Star, color: 'text-gray-600' };
        const Icon = cfg.icon;
        const count = counters?.[key];
        const isActive = key === active;

        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            title={cfg.hint}
            data-testid={`facet-tab-${key.toLowerCase()}`}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
              isActive
                ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? '' : cfg.color}`} />
            <span>{cfg.label}</span>
            {typeof count === 'number' && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                isActive 
                  ? 'bg-white/20 text-white dark:bg-gray-900/20 dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
