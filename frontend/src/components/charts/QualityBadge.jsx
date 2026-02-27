/**
 * QualityBadge V3.10.1-STABLE
 * ===========================
 * Ultra-minimal quality state indicator
 * 
 * States: GOOD | NEUTRAL | WEAK
 * Premium Light theme
 */

import React from 'react';

const STATE_MAP = {
  GOOD: 'bg-green-100 text-green-600',
  NEUTRAL: 'bg-amber-100 text-amber-600',
  WEAK: 'bg-red-100 text-red-600',
};

export default function QualityBadge({ state = 'WEAK', winRate = 0, rollingWinRate = 0 }) {
  const classes = STATE_MAP[state] || STATE_MAP.WEAK;
  
  return (
    <div 
      className={`px-2 py-1 text-xs rounded ${classes}`}
      data-testid="quality-badge"
      title={`WinRate: ${(winRate * 100).toFixed(1)}% | Rolling: ${(rollingWinRate * 100).toFixed(1)}%`}
    >
      {state}
    </div>
  );
}
