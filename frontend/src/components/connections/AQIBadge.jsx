/**
 * AQI Badge Component (Block 16)
 * 
 * Shows Audience Quality Index with level badge
 * Levels: ELITE, GOOD, MIXED, RISKY
 */

import React from 'react';
import { Users, AlertCircle } from 'lucide-react';

const LEVEL_CONFIG = {
  ELITE: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
    bar: 'bg-green-500'
  },
  GOOD: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    bar: 'bg-blue-500'
  },
  MIXED: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-400',
    border: 'border-yellow-200 dark:border-yellow-800',
    bar: 'bg-yellow-500'
  },
  RISKY: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    bar: 'bg-red-500'
  }
};

export default function AQIBadge({ data, compact = false }) {
  if (!data) {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-800 text-gray-400">
        <Users className="w-3 h-3" />
        <span>AQI --</span>
      </div>
    );
  }

  const config = LEVEL_CONFIG[data.level] || LEVEL_CONFIG.MIXED;

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
        title={`AQI: ${data.aqi} (${data.level}) - Human: ${data.pctHuman}%, Bot: ${data.pctBot}%`}
      >
        <Users className="w-3 h-3" />
        <span>{Math.round(data.aqi)}</span>
        <span className="opacity-70">{data.level}</span>
      </div>
    );
  }

  return (
    <div className={`p-3 rounded-lg border ${config.bg} ${config.border}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Users className={`w-5 h-5 ${config.text}`} />
          <span className={`font-medium ${config.text}`}>Audience Quality</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${config.text}`}>{Math.round(data.aqi)}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded ${config.bg} ${config.text} border ${config.border}`}>
            {data.level}
          </span>
        </div>
      </div>

      {/* AQI Bar */}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-500 ${config.bar}`}
          style={{ width: `${data.aqi}%` }}
        />
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="text-gray-400">Human</div>
          <div className={`font-medium ${data.pctHuman >= 70 ? 'text-green-500' : data.pctHuman >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
            {Math.round(data.pctHuman)}%
          </div>
        </div>
        <div>
          <div className="text-gray-400">Suspicious</div>
          <div className="font-medium text-yellow-500">{Math.round(data.pctSuspicious)}%</div>
        </div>
        <div>
          <div className="text-gray-400">Bot</div>
          <div className={`font-medium ${data.pctBot <= 15 ? 'text-green-500' : data.pctBot <= 30 ? 'text-yellow-500' : 'text-red-500'}`}>
            {Math.round(data.pctBot)}%
          </div>
        </div>
      </div>

      {/* Activity */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="text-gray-400">Active</div>
          <div className="font-medium">{Math.round(data.pctActive)}%</div>
        </div>
        <div>
          <div className="text-gray-400">Dormant</div>
          <div className="font-medium">{Math.round(data.pctDormant)}%</div>
        </div>
        <div>
          <div className="text-gray-400">Dead</div>
          <div className="font-medium">{Math.round(data.pctDead)}%</div>
        </div>
      </div>

      {/* Reasons */}
      {data.reasons?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-400 mb-1">Notes</div>
          <div className="flex flex-wrap gap-1">
            {data.reasons.map((reason, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              >
                <AlertCircle className="w-3 h-3" />
                {reason}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
