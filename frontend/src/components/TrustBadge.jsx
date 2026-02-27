/**
 * Trust Badge Component (Phase 15 UI)
 * 
 * Visual indicator of trust score with color coding.
 */
import React from 'react';
import { cn } from '../lib/utils';

const getTrustColor = (score) => {
  if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
  if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
};

const getTrustLabel = (score) => {
  if (score >= 80) return 'High Trust';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Low Trust';
};

export default function TrustBadge({ score, size = 'md', showLabel = true, className }) {
  if (score === null || score === undefined) return null;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };
  
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        getTrustColor(score),
        sizeClasses[size],
        className
      )}
    >
      <div className="flex items-center gap-1">
        <span className="font-mono font-bold">{Math.round(score)}</span>
        {showLabel && <span>/ {getTrustLabel(score)}</span>}
      </div>
    </div>
  );
}

/**
 * Reliability Tier Badge (for strategies and actors)
 */
export function ReliabilityBadge({ tier, className }) {
  if (!tier) return null;
  
  const tierConfig = {
    A: { color: 'text-green-600 bg-green-50 border-green-200', label: 'Tier A - Excellent' },
    B: { color: 'text-blue-600 bg-blue-50 border-blue-200', label: 'Tier B - Good' },
    C: { color: 'text-yellow-600 bg-yellow-50 border-yellow-200', label: 'Tier C - Fair' },
    D: { color: 'text-red-600 bg-red-50 border-red-200', label: 'Tier D - Poor' },
  };
  
  const config = tierConfig[tier] || tierConfig.D;
  
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm font-medium',
        config.color,
        className
      )}
    >
      <span className="font-bold">{tier}</span>
      <span className="text-xs opacity-75">{config.label.split(' - ')[1]}</span>
    </div>
  );
}
