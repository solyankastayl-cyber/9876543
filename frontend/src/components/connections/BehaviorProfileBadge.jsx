/**
 * Behavior Profile Badge Component
 * 
 * Shows Actor Behavior Profile from Block 27
 * Types: LONG_TERM_ACCUMULATOR, PUMP_AND_EXIT, EARLY_CONVICTION, LIQUIDITY_PROVIDER, NOISE_ACTOR
 */

import React from 'react';
import { TrendingUp, TrendingDown, Zap, BarChart2, Volume2 } from 'lucide-react';

const PROFILE_CONFIG = {
  LONG_TERM_ACCUMULATOR: {
    icon: TrendingUp,
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
    label: 'Accumulator',
    description: 'Quietly buys, rarely speaks, often right'
  },
  PUMP_AND_EXIT: {
    icon: TrendingDown,
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    label: 'Pump & Exit',
    description: 'Speaks when already selling'
  },
  EARLY_CONVICTION: {
    icon: Zap,
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
    label: 'Early Conviction',
    description: 'Knows before the market'
  },
  LIQUIDITY_PROVIDER: {
    icon: BarChart2,
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    label: 'Liquidity Provider',
    description: 'Not about signals, about market'
  },
  NOISE_ACTOR: {
    icon: Volume2,
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-200 dark:border-gray-700',
    label: 'Noise',
    description: 'Generates noise without substance'
  }
};

export default function BehaviorProfileBadge({ data, compact = false }) {
  if (!data) {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-800 text-gray-400">
        <BarChart2 className="w-3 h-3" />
        <span>--</span>
      </div>
    );
  }

  const config = PROFILE_CONFIG[data.profile] || PROFILE_CONFIG.NOISE_ACTOR;
  const Icon = config.icon;
  const confidencePct = Math.round((data.confidence || 0) * 100);

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
        title={`${config.label} (${confidencePct}% confidence) - ${config.description}`}
      >
        <Icon className="w-3 h-3" />
        <span>{config.label}</span>
      </div>
    );
  }

  return (
    <div className={`p-3 rounded-lg border ${config.bg} ${config.border}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${config.text}`} />
          <span className={`font-medium ${config.text}`}>{config.label}</span>
        </div>
        <span className={`text-sm font-medium ${config.text}`}>{confidencePct}%</span>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{config.description}</p>

      {/* Metrics */}
      {data.metrics && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">Accumulation</span>
            <span className="font-medium">{Math.round(data.metrics.accumulationBias * 100)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Confirmation</span>
            <span className="font-medium">{Math.round(data.metrics.confirmationRatio * 100)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Tweet Lead</span>
            <span className="font-medium">{data.metrics.tweetLeadLag?.toFixed(1)}h</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Hold Duration</span>
            <span className="font-medium">{data.metrics.holdingDuration}d</span>
          </div>
        </div>
      )}
    </div>
  );
}
