/**
 * BLOCK 50 — Reliability Card
 * English: titles, metric names, badges
 * Russian: only in tooltips
 */

import React from 'react';
import { Gauge, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { InfoTooltip, FRACTAL_TOOLTIPS } from './InfoTooltip';

const badgeConfig = {
  OK: { bg: 'bg-green-100', text: 'text-green-700', icon: TrendingUp },
  WARN: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Minus },
  DEGRADED: { bg: 'bg-orange-100', text: 'text-orange-700', icon: TrendingDown },
  CRITICAL: { bg: 'bg-red-100', text: 'text-red-700', icon: TrendingDown },
};

export function ReliabilityCard({ model }) {
  if (!model?.reliability) return null;
  
  const { reliability } = model;
  const badge = badgeConfig[reliability.badge] || badgeConfig.OK;
  const BadgeIcon = badge.icon;
  const score = reliability.score * 100;
  
  const getScoreColor = (s) => {
    if (s >= 70) return 'text-green-600';
    if (s >= 50) return 'text-amber-600';
    return 'text-red-600';
  };
  
  const getBarColor = (s) => {
    if (s >= 70) return 'bg-green-500';
    if (s >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };
  
  return (
    <div 
      className="rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-lg"
      data-testid="reliability-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">RELIABILITY</h3>
          <InfoTooltip {...FRACTAL_TOOLTIPS.reliability} placement="right" />
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${badge.bg}`}>
          <BadgeIcon className={`w-4 h-4 ${badge.text}`} />
          <span className={`text-sm font-bold ${badge.text}`}>{reliability.badge}</span>
        </div>
      </div>
      
      {/* Score Display */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${score >= 70 ? 'bg-green-50' : score >= 50 ? 'bg-amber-50' : 'bg-red-50'}`}>
              <Gauge className={`w-8 h-8 ${getScoreColor(score)}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Score</p>
              <p className={`text-3xl font-black ${getScoreColor(score)}`}>{score.toFixed(0)}%</p>
            </div>
          </div>
          
          {/* Modifier */}
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase mb-1">Modifier</p>
            <p className="text-xl font-bold text-gray-800">{reliability.modifier?.toFixed(2) || '1.00'}x</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="relative">
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-3 ${getBarColor(score)} transition-all duration-700 ease-out`}
              style={{ width: `${score}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-gray-400">0%</span>
            <span className="text-[10px] text-red-500 font-medium">50%</span>
            <span className="text-[10px] text-amber-500 font-medium">70%</span>
            <span className="text-[10px] text-gray-400">100%</span>
          </div>
        </div>
      </div>
      
      {/* Info boxes */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="p-3 bg-gray-50 rounded-xl text-center">
          <p className="text-xs text-gray-500 uppercase mb-1">Policy</p>
          <p className="text-sm font-bold text-gray-800">{reliability.policy || 'STANDARD'}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-xl text-center">
          <p className="text-xs text-gray-500 uppercase mb-1">Impact</p>
          <p className={`text-sm font-bold ${reliability.modifier < 1 ? 'text-amber-600' : 'text-green-600'}`}>
            {reliability.modifier < 1 ? 'REDUCED' : 'FULL'}
          </p>
        </div>
      </div>
      
      {/* Breakdown */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">BREAKDOWN</p>
        <div className="space-y-2.5">
          {Object.entries(reliability.breakdown || {}).map(([key, value]) => {
            const percent = value * 100;
            
            return (
              <div key={key} className="group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600 font-medium capitalize">{key}</span>
                  <span className={`text-xs font-bold ${getScoreColor(percent)}`}>{percent.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-2 ${getBarColor(percent)} transition-all duration-500`}
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ReliabilityCard;
