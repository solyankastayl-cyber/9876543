import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, GitBranch, Radio, Building2, Layers, Bookmark, Trophy } from 'lucide-react';

const TABS = [
  { to: '/connections', label: 'Twitter Accounts', icon: Users, end: true },
  { to: '/connections/graph', label: 'Graph', icon: GitBranch },
  { to: '/connections/radar', label: 'Radar', icon: Radio },
  { to: '/connections/backers', label: 'Backers', icon: Building2 },
  { to: '/connections/reality', label: 'Leaderboard', icon: Trophy },
  { to: '/connections/unified?facet=SMART', label: 'Groups', icon: Layers },
  { to: '/connections/watchlists', label: 'Watchlists', icon: Bookmark },
];

export default function ConnectionsTopNav() {
  return (
    <div className="flex flex-wrap gap-2 py-3 border-b border-gray-200 dark:border-gray-700 mb-4">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) => `
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors
              ${isActive 
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </NavLink>
        );
      })}
    </div>
  );
}
