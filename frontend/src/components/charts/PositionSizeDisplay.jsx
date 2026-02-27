/**
 * PositionSizeDisplay V3.10.1-STABLE
 * ===================================
 * Ultra-minimal position size display
 * 
 * Shows: X.XX% (TIER)
 * Premium Light theme
 */

import React from 'react';

export default function PositionSizeDisplay({ sizePct = 0, tier = 'SMALL' }) {
  return (
    <div className="text-sm text-right" data-testid="position-size-display">
      <div className="text-slate-500">Suggested Size</div>
      <div className="font-semibold text-slate-700">
        {(sizePct * 100).toFixed(2)}% {tier ? `(${tier})` : ''}
      </div>
    </div>
  );
}
