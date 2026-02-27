/**
 * Audience Quality Badge Component
 * 
 * Compact badge for influencer cards.
 */

import React from 'react';

function pct(x) {
  return Math.round((x ?? 0) * 100);
}

export default function AudienceQualityBadge({ aqe }) {
  if (!aqe) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-gray-800 rounded text-xs text-gray-500">
        <span>AQ</span>
        <span>--</span>
      </div>
    );
  }

  const realPct = pct(aqe.real_audience_pct);
  
  let colorClass = 'bg-gray-700 text-gray-300';
  if (realPct >= 75) {
    colorClass = 'bg-green-900/50 text-green-400 border border-green-800';
  } else if (realPct >= 55) {
    colorClass = 'bg-yellow-900/50 text-yellow-400 border border-yellow-800';
  } else {
    colorClass = 'bg-red-900/50 text-red-400 border border-red-800';
  }

  return (
    <div 
      className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${colorClass}`}
      title={`Audience Quality: ${realPct}% real, ${pct(aqe.bot_pressure_pct)}% bot pressure`}
    >
      <span className="opacity-70">AQ</span>
      <span>{realPct}%</span>
    </div>
  );
}
