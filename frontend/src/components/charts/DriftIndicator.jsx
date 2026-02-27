/**
 * DriftIndicator V3.10.1-STABLE
 * =============================
 * Ultra-minimal drift state indicator
 * 
 * States: HEALTHY | DEGRADING | CRITICAL
 * Premium Light theme
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';

const STATE_MAP = {
  HEALTHY: 'text-green-500',
  DEGRADING: 'text-amber-500',
  CRITICAL: 'text-red-500',
};

export default function DriftIndicator({ state = 'HEALTHY' }) {
  const colorClass = STATE_MAP[state] || STATE_MAP.HEALTHY;
  
  return (
    <div 
      className={`flex items-center gap-1 text-xs ${colorClass}`}
      data-testid="drift-indicator"
    >
      {state === 'CRITICAL' && <AlertTriangle className="w-3 h-3" />}
      <span>Drift: {state}</span>
    </div>
  );
}
