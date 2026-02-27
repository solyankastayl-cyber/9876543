/**
 * U1.2 - Signal Grid Component
 * 
 * 2x3 grid of signal cards (desktop), 1 column on mobile.
 */
import React from 'react';
import SignalCard from './SignalCard';
import { DRIVER_CODES } from './signal.meta';

export default function SignalGrid({ drivers }) {
  if (!drivers || Object.keys(drivers).length === 0) {
    return (
      <div className="text-center py-12 text-slate-500" data-testid="signal-grid-empty">
        <p>No signal data available</p>
      </div>
    );
  }

  return (
    <div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      data-testid="signal-grid"
    >
      {DRIVER_CODES.map((code) => (
        <SignalCard 
          key={code} 
          code={code} 
          driver={drivers[code]} 
        />
      ))}
    </div>
  );
}
