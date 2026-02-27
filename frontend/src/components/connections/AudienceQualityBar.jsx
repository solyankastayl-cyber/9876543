/**
 * Audience Quality Bar Component
 * 
 * Displays audience quality metrics in a compact bar format.
 * Shows: Real Audience %, Bot Pressure %, Confidence Level
 */

import React from 'react';

function pct(x) {
  return Math.round((x ?? 0) * 100);
}

function getBarClass(realPct) {
  if (realPct >= 75) return 'bg-green-500';
  if (realPct >= 55) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getConfidenceClass(level) {
  switch (level) {
    case 'HIGH': return 'text-green-400';
    case 'MEDIUM': return 'text-yellow-400';
    case 'LOW': return 'text-red-400';
    default: return 'text-gray-400';
  }
}

export default function AudienceQualityBar({ aqe, compact = false }) {
  if (!aqe) return null;

  const realPct = pct(aqe.real_audience_pct);
  const botPct = pct(aqe.bot_pressure_pct);
  const barClass = getBarClass(realPct);
  const confClass = getConfidenceClass(aqe.confidence_level);

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="text-gray-400">AQ:</span>
        <span className={realPct >= 70 ? 'text-green-400' : realPct >= 50 ? 'text-yellow-400' : 'text-red-400'}>
          {realPct}%
        </span>
        {botPct > 20 && (
          <span className="text-red-400">({botPct}% bot)</span>
        )}
      </div>
    );
  }

  return (
    <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-300">Audience Quality</span>
        <span className="text-lg font-semibold text-white">{realPct}%</span>
      </div>

      <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-3">
        <div 
          className={`h-full ${barClass} transition-all duration-500`}
          style={{ width: `${realPct}%` }}
        />
      </div>

      <div className="flex justify-between text-xs">
        <div>
          <span className="text-gray-400">Bot Pressure: </span>
          <span className={botPct > 30 ? 'text-red-400 font-medium' : 'text-gray-300'}>
            {botPct}%
          </span>
        </div>
        <div>
          <span className="text-gray-400">Confidence: </span>
          <span className={confClass}>{aqe.confidence_level}</span>
        </div>
      </div>

      {aqe.anomaly && (
        <div className="mt-2 px-2 py-1 bg-yellow-900/30 rounded text-xs text-yellow-400">
          Growth anomaly detected
        </div>
      )}

      {aqe.topSuspiciousFollowers?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="text-xs text-gray-400 mb-2">Suspicious Followers</div>
          <div className="flex flex-wrap gap-1">
            {aqe.topSuspiciousFollowers.slice(0, 3).map((f) => (
              <span 
                key={f.followerId} 
                className={`px-2 py-0.5 rounded text-xs ${
                  f.label === 'FARM_NODE' ? 'bg-red-900/50 text-red-300' : 'bg-orange-900/50 text-orange-300'
                }`}
              >
                @{f.username || f.followerId.slice(0, 8)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
