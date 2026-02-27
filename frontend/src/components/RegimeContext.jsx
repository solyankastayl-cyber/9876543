/**
 * Regime Context Component (Phase 15 UI)
 * 
 * Shows current market regime and how entity performs in it.
 */
import React from 'react';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { cn } from '../lib/utils';

const regimeConfig = {
  trend_up: {
    icon: TrendingUp,
    label: 'Trending Up',
    color: 'text-green-600 bg-green-50 border-green-200',
    description: 'Strong upward momentum',
  },
  trend_down: {
    icon: TrendingDown,
    label: 'Trending Down',
    color: 'text-red-600 bg-red-50 border-red-200',
    description: 'Strong downward momentum',
  },
  range: {
    icon: Minus,
    label: 'Range-Bound',
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    description: 'Sideways movement',
  },
  high_volatility: {
    icon: Activity,
    label: 'High Volatility',
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    description: 'Elevated price swings',
  },
};

export default function RegimeContext({ regime, performanceInRegime, className }) {
  if (!regime) return null;
  
  const config = regimeConfig[regime] || regimeConfig.range;
  const Icon = config.icon;
  
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border px-3 py-2',
        config.color,
        className
      )}
    >
      <Icon className="h-4 w-4" />
      <div className="flex flex-col">
        <span className="text-sm font-medium">{config.label}</span>
        {performanceInRegime !== undefined && (
          <span className="text-xs opacity-75">
            {Math.round(performanceInRegime)}% success rate
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Regime Performance Grid
 * Shows performance across all regimes
 */
export function RegimePerformanceGrid({ regimePerformance, className }) {
  if (!regimePerformance) return null;
  
  const regimes = [
    { key: 'trend_up', label: 'Uptrend' },
    { key: 'trend_down', label: 'Downtrend' },
    { key: 'range', label: 'Range' },
    { key: 'high_volatility', label: 'Volatile' },
  ];
  
  return (
    <div className={cn('grid grid-cols-2 gap-2', className)}>
      {regimes.map(({ key, label }) => {
        const value = regimePerformance[key] || 0;
        const color = value >= 60 ? 'text-green-600' : value >= 40 ? 'text-yellow-600' : 'text-red-600';
        
        return (
          <div
            key={key}
            className="bg-gray-50 rounded-lg p-3 border border-gray-200"
          >
            <div className="text-xs text-gray-500 mb-1">{label}</div>
            <div className={cn('text-lg font-semibold', color)}>
              {Math.round(value)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}
