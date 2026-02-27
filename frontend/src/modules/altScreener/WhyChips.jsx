/**
 * WhyChips Component
 * ===================
 * Shows top contributing features as chips
 */

import React from 'react';
import { featureNameByIdx } from './featureNames';

function fmt(x) {
  const v = Number(x ?? 0);
  const s = Math.abs(v) >= 1 ? v.toFixed(2) : v.toFixed(3);
  return v >= 0 ? `+${s}` : s;
}

export default function WhyChips({ why = [] }) {
  // why: [{ feature, value, contribution }] from API
  return (
    <div className="flex flex-wrap gap-1.5">
      {why.slice(0, 5).map((w, idx) => {
        const positive = (w?.contribution ?? 0) >= 0;
        const featureName = w.feature || featureNameByIdx(idx);
        
        return (
          <span
            key={`${featureName}-${idx}`}
            title={`${featureName}: ${fmt(w.contribution)}`}
            className={`
              px-2 py-1 rounded-full text-xs font-medium border
              ${positive 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : 'bg-red-50 text-red-700 border-red-200'
              }
            `}
          >
            {featureName} {fmt(w.contribution)}
          </span>
        );
      })}
    </div>
  );
}
