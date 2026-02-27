/**
 * BLOCK 50 — Health Card
 * English: titles, status badges, metric names
 * Russian: descriptions, explanations
 */

import React from 'react';
import { Activity, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { InfoTooltip, FRACTAL_TOOLTIPS } from './InfoTooltip';

const healthColors = {
  HEALTHY: { 
    bg: 'bg-gradient-to-br from-green-50 to-emerald-50', 
    border: 'border-green-200', 
    text: 'text-green-700', 
    dot: 'bg-green-500',
    barBg: 'bg-green-100',
    icon: TrendingUp 
  },
  WATCH: { 
    bg: 'bg-gradient-to-br from-amber-50 to-yellow-50', 
    border: 'border-amber-200', 
    text: 'text-amber-700', 
    dot: 'bg-amber-500',
    barBg: 'bg-amber-100',
    icon: Activity 
  },
  ALERT: { 
    bg: 'bg-gradient-to-br from-orange-50 to-amber-50', 
    border: 'border-orange-200', 
    text: 'text-orange-700', 
    dot: 'bg-orange-500',
    barBg: 'bg-orange-100',
    icon: AlertTriangle 
  },
  CRITICAL: { 
    bg: 'bg-gradient-to-br from-red-50 to-rose-50', 
    border: 'border-red-300', 
    text: 'text-red-700', 
    dot: 'bg-red-500',
    barBg: 'bg-red-100',
    icon: TrendingDown 
  },
};

const severityConfig = {
  OK: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  WARN: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  ALERT: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  CRITICAL: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

export function HealthCard({ health }) {
  if (!health) return null;
  
  const colors = healthColors[health.state] || healthColors.HEALTHY;
  const Icon = colors.icon;
  const score = health.score * 100;
  
  return (
    <div 
      className={`rounded-2xl border-2 ${colors.border} ${colors.bg} p-6 transition-all duration-300 hover:shadow-lg`}
      data-testid="health-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">SYSTEM HEALTH</h3>
          <InfoTooltip {...FRACTAL_TOOLTIPS.health} placement="right" />
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${colors.barBg}`}>
          <span className={`w-2 h-2 rounded-full ${colors.dot} animate-pulse`}></span>
          <Icon className={`w-4 h-4 ${colors.text}`} />
          <span className={`text-sm font-bold ${colors.text}`}>{health.state}</span>
        </div>
      </div>
      
      {/* Score Display */}
      <div className="mb-5">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-sm text-gray-500 font-medium">Score</span>
          <div className="flex items-baseline gap-1">
            <span className={`text-4xl font-black ${colors.text}`}>{score.toFixed(0)}</span>
            <span className={`text-lg font-bold ${colors.text}`}>%</span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="relative">
          <div className="w-full bg-white/60 rounded-full h-3 overflow-hidden shadow-inner">
            <div 
              className={`h-3 rounded-full ${colors.dot} transition-all duration-700 ease-out`}
              style={{ width: `${score}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-gray-400">0%</span>
            <span className="text-[10px] text-amber-500 font-medium">60%</span>
            <span className="text-[10px] text-green-500 font-medium">80%</span>
            <span className="text-[10px] text-gray-400">100%</span>
          </div>
        </div>
      </div>
      
      {/* Headline - Russian description */}
      {health.headline && (
        <div className="mb-5 p-3 bg-white/50 rounded-xl border border-gray-100">
          <p className="text-sm text-gray-700 leading-relaxed">{health.headline}</p>
        </div>
      )}
      
      {/* Top Risks */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">TOP RISKS</p>
          <InfoTooltip {...FRACTAL_TOOLTIPS.topRisks} placement="right" />
        </div>
        <div className="space-y-2">
          {health.topRisks?.map((risk, i) => {
            const sevConfig = severityConfig[risk.severity] || severityConfig.OK;
            return (
              <div 
                key={i} 
                className={`flex items-center justify-between p-2.5 rounded-xl ${sevConfig.bg} border ${sevConfig.border}`}
              >
                <span className="text-sm text-gray-700 font-medium">{risk.key}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono font-bold text-gray-800">
                    {typeof risk.value === 'number' ? risk.value.toFixed(2) : risk.value}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-lg font-bold ${sevConfig.text} bg-white/60`}>
                    {risk.severity}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default HealthCard;
