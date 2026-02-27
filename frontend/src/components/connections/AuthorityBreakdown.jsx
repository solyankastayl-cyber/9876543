import React from 'react';
import { Shield, Network, Zap, Radio } from 'lucide-react';

const COMPONENTS = [
  { key: 'seed', label: 'Seed', icon: Shield, color: 'bg-purple-500' },
  { key: 'network', label: 'Network', icon: Network, color: 'bg-blue-500' },
  { key: 'early', label: 'Early', icon: Zap, color: 'bg-yellow-500' },
  { key: 'media', label: 'Media', icon: Radio, color: 'bg-green-500' }
];

export default function AuthorityBreakdown({ scores, preset }) {
  if (!scores) return null;

  const total = Object.values(scores).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Authority Breakdown</h4>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Total: {Math.round(total * 25)}%
        </span>
      </div>

      {/* Stacked bar */}
      <div className="h-3 rounded-full overflow-hidden flex bg-gray-100 dark:bg-gray-700">
        {COMPONENTS.map(comp => {
          const value = scores[comp.key] ?? 0;
          const width = Math.round(value * 100);
          if (width === 0) return null;
          return (
            <div
              key={comp.key}
              className={`${comp.color} transition-all`}
              style={{ width: `${width}%` }}
              title={`${comp.label}: ${Math.round(value * 100)}%`}
            />
          );
        })}
      </div>

      {/* Individual scores */}
      <div className="grid grid-cols-2 gap-2">
        {COMPONENTS.map(comp => {
          const Icon = comp.icon;
          const value = scores[comp.key] ?? 0;
          const isActive = preset ? getActiveForPreset(comp.key, preset) : true;

          return (
            <div
              key={comp.key}
              className={`flex items-center gap-2 p-2 rounded-lg transition-opacity ${
                isActive ? 'bg-gray-50 dark:bg-gray-700' : 'bg-gray-50/50 dark:bg-gray-700/50 opacity-50'
              }`}
            >
              <div className={`p-1 rounded ${comp.color}`}>
                <Icon className="w-3 h-3 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-900 dark:text-white">{comp.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {Math.round(value * 100)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getActiveForPreset(key, preset) {
  const presetComponents = {
    SMART: ['seed', 'network', 'early'],
    VC: ['seed'],
    EARLY: ['early', 'network'],
    MEDIA: ['media', 'network'],
    INFLUENCE: ['network', 'media']
  };
  return presetComponents[preset]?.includes(key) ?? true;
}
