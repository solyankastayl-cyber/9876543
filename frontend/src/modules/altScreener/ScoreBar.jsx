/**
 * ScoreBar Component
 * ===================
 * Visual score bar (red → green) for Alt Screener
 */

import React from 'react';

function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x));
}

export default function ScoreBar({ value01 }) {
  const v = clamp(Number(value01 ?? 0), 0, 1);
  const pct = Math.round(v * 100);

  // Color via HSL (0=red, 120=green)
  const hue = Math.round(120 * v);
  const bg = `hsl(${hue}, 70%, 45%)`;

  return (
    <div className="flex items-center gap-2.5 min-w-[180px]">
      <div className="h-2.5 w-[120px] bg-gray-200 rounded-full overflow-hidden border border-gray-300">
        <div 
          className="h-full transition-all duration-300" 
          style={{ width: `${pct}%`, background: bg }} 
        />
      </div>
      <div className="font-mono text-sm text-gray-700 tabular-nums w-12 text-right">
        {pct}%
      </div>
    </div>
  );
}
