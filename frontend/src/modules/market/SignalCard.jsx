/**
 * U1.2 - Signal Card Component
 * 
 * Individual signal driver card (A-F).
 * Shows state, strength bar, and human-readable summary.
 */
import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Layers,
  GitBranch,
  Droplets,
  Users,
  Bell,
  Info,
  X,
} from 'lucide-react';
import { DRIVER_META, getStateColors, getStrengthConfig } from './signal.meta';

// Icon mapping
const ICONS = {
  ArrowLeftRight,
  Layers,
  GitBranch,
  Droplets,
  Users,
  Bell,
};

export default function SignalCard({ code, driver }) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const meta = DRIVER_META[code];
  const stateColors = getStateColors(driver?.state);
  const strengthConfig = getStrengthConfig(driver?.strength);
  const Icon = ICONS[meta?.icon] || Info;

  if (!driver || !meta) {
    return (
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
        <div className="text-sm text-slate-500">No data for {code}</div>
      </div>
    );
  }

  return (
    <div 
      className={`relative rounded-xl border ${stateColors.border} ${stateColors.bg} p-4 transition-all hover:shadow-md`}
      data-testid={`signal-card-${code}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${stateColors.bg} border ${stateColors.border} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${stateColors.text}`} />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Driver {code}</div>
            <div className="font-semibold text-slate-900">{meta.title}</div>
          </div>
        </div>
        
        {/* Info button */}
        <button
          onClick={() => setShowTooltip(!showTooltip)}
          className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50"
          aria-label="More info"
        >
          <Info className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* State Badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full ${stateColors.dot}`} />
        <span className={`text-sm font-medium ${stateColors.text}`}>
          {driver.state}
        </span>
      </div>

      {/* Strength Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-500">Strength</span>
          <span className="text-xs font-medium text-slate-600">{strengthConfig.label}</span>
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${strengthConfig.color} rounded-full transition-all duration-500`}
            style={{ width: driver.strength === 'HIGH' ? '100%' : driver.strength === 'MEDIUM' ? '66%' : '33%' }}
          />
        </div>
      </div>

      {/* Summary */}
      <p className="text-sm text-slate-600 leading-relaxed">
        {driver.summary}
      </p>

      {/* Tooltip Modal */}
      {showTooltip && (
        <div className="absolute inset-0 bg-white rounded-xl border border-slate-200 p-4 z-10 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-slate-900">{meta.title}</div>
            <button
              onClick={() => setShowTooltip(false)}
              className="w-6 h-6 rounded-full hover:bg-slate-100 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed mb-3">
            {meta.description}
          </p>
          <div className="p-2 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500">
              {meta.tooltip}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
