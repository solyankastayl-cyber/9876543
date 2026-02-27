/**
 * U1.2 - Decision Header Component
 * 
 * Shows overall decision (BUY/SELL/NEUTRAL), quality, and last update.
 * No ML terminology.
 */
import React from 'react';
import { TrendingUp, TrendingDown, Minus, Clock, Shield } from 'lucide-react';
import { DECISION_COLORS, QUALITY_CONFIG } from './signal.meta';

export default function DecisionHeader({ decision, quality, asset, timestamp }) {
  const decisionConfig = DECISION_COLORS[decision] || DECISION_COLORS.NEUTRAL;
  const qualityConfig = QUALITY_CONFIG[quality] || QUALITY_CONFIG.LOW;
  
  // Format time
  const formatTime = (ts) => {
    if (!ts) return 'Unknown';
    const diff = Date.now() - ts;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return new Date(ts).toLocaleDateString();
  };

  // Decision icon
  const DecisionIcon = decision === 'BUY' ? TrendingUp : decision === 'SELL' ? TrendingDown : Minus;

  return (
    <div 
      className="bg-white rounded-xl border border-slate-200 p-6 mb-6"
      data-testid="decision-header"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Asset & Decision */}
        <div className="flex items-center gap-4">
          {/* Asset badge */}
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
            <span className="text-lg font-bold text-slate-700">{asset?.slice(0, 3)}</span>
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{asset}</h1>
            <div className="text-sm text-slate-500">Signal Analysis</div>
          </div>
        </div>

        {/* Center: Decision */}
        <div className="flex items-center gap-3">
          <div 
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl ${decisionConfig.bg}`}
            data-testid="decision-badge"
          >
            <DecisionIcon className={`w-5 h-5 ${decisionConfig.text}`} />
            <span className={`text-lg font-bold ${decisionConfig.text}`}>
              {decisionConfig.label}
            </span>
          </div>
        </div>

        {/* Right: Quality & Time */}
        <div className="flex items-center gap-4">
          {/* Quality badge */}
          <div 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${qualityConfig.bg}`}
            data-testid="quality-badge"
          >
            <Shield className={`w-4 h-4 ${qualityConfig.text}`} />
            <span className={`text-sm font-medium ${qualityConfig.text}`}>
              {qualityConfig.label}
            </span>
          </div>

          {/* Last update */}
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Clock className="w-4 h-4" />
            <span>{formatTime(timestamp)}</span>
          </div>
        </div>
      </div>

      {/* Summary line */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-slate-600">
          {decision === 'BUY' && 'Multiple signals suggest accumulation opportunity.'}
          {decision === 'SELL' && 'Multiple signals suggest distribution or exit.'}
          {decision === 'NEUTRAL' && 'Mixed signals. No clear directional bias.'}
        </p>
      </div>
    </div>
  );
}
