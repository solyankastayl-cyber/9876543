/**
 * BLOCK 50 — Tail Risk Card
 * English: titles, metric names
 * Russian: only in tooltips
 */

import React from 'react';
import { TrendingDown, AlertTriangle, Target, Percent } from 'lucide-react';
import { InfoTooltip, FRACTAL_TOOLTIPS } from './InfoTooltip';

const getColor = (val, thresholds) => {
  if (val >= thresholds.critical) return { text: 'text-red-600', bg: 'bg-red-50', bar: 'bg-red-500' };
  if (val >= thresholds.warn) return { text: 'text-amber-600', bg: 'bg-amber-50', bar: 'bg-amber-500' };
  return { text: 'text-green-600', bg: 'bg-green-50', bar: 'bg-green-500' };
};

const getRiskLevel = (dd) => {
  if (dd >= 45) return { text: 'CRITICAL', color: 'text-red-600', icon: AlertTriangle };
  if (dd >= 35) return { text: 'ELEVATED', color: 'text-amber-600', icon: TrendingDown };
  return { text: 'NORMAL', color: 'text-green-600', icon: Target };
};

export function TailRiskCard({ model }) {
  if (!model?.mc) return null;
  
  const { mc } = model;
  const p95DD = mc.p95MaxDD * 100;
  const ddColors = getColor(p95DD, { warn: 35, critical: 45 });
  const riskLevel = getRiskLevel(p95DD);
  const RiskIcon = riskLevel.icon;
  
  return (
    <div 
      className="rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-lg"
      data-testid="tail-risk-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">TAIL RISK (MC)</h3>
          <InfoTooltip {...FRACTAL_TOOLTIPS.tailRisk} placement="right" />
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${ddColors.bg}`}>
          <RiskIcon className={`w-4 h-4 ${riskLevel.color}`} />
          <span className={`text-sm font-bold ${riskLevel.color}`}>{riskLevel.text}</span>
        </div>
      </div>
      
      {/* P95 Max Drawdown */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-500 font-medium">P95 Max Drawdown</p>
          </div>
          <div className="text-right">
            <p className={`text-4xl font-black ${ddColors.text}`}>{p95DD.toFixed(1)}</p>
            <p className={`text-sm font-bold ${ddColors.text}`}>%</p>
          </div>
        </div>
        
        {/* Visual Progress with zones */}
        <div className="relative mb-2">
          <div className="w-full h-5 rounded-full overflow-hidden flex">
            <div className="w-[35%] bg-green-100 border-r border-white"></div>
            <div className="w-[10%] bg-amber-100 border-r border-white"></div>
            <div className="flex-1 bg-red-100"></div>
          </div>
          <div 
            className={`absolute top-0 left-0 h-5 ${ddColors.bar} rounded-l-full transition-all duration-700`}
            style={{ width: `${Math.min(p95DD, 100)}%`, borderRadius: p95DD >= 100 ? '9999px' : undefined }}
          ></div>
          <div 
            className="absolute top-0 w-1 h-5 bg-gray-800 rounded-full shadow-lg transition-all duration-700"
            style={{ left: `${Math.min(p95DD, 100)}%`, transform: 'translateX(-50%)' }}
          ></div>
        </div>
        
        {/* Zone labels */}
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">0%</span>
          <span className="text-green-600 font-medium">Normal</span>
          <span className="text-amber-600 font-medium">35%</span>
          <span className="text-red-600 font-medium">45%</span>
          <span className="text-gray-400">100%</span>
        </div>
      </div>
      
      {/* Additional Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Percent className="w-4 h-4 text-gray-400" />
            <p className="text-xs text-gray-500 uppercase">P05 CAGR</p>
          </div>
          <p className={`text-2xl font-bold ${
            mc.p05CAGR >= 0 ? 'text-green-600' : mc.p05CAGR >= -0.05 ? 'text-amber-600' : 'text-red-600'
          }`}>
            {(mc.p05CAGR * 100).toFixed(1)}%
          </p>
        </div>
        
        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-gray-400" />
            <p className="text-xs text-gray-500 uppercase">P10 Sharpe</p>
          </div>
          <p className={`text-2xl font-bold ${
            mc.p10Sharpe >= 0.5 ? 'text-green-600' : mc.p10Sharpe >= 0 ? 'text-amber-600' : 'text-red-600'
          }`}>
            {mc.p10Sharpe.toFixed(2)}
          </p>
        </div>
      </div>
      
      {/* Method info */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">
          Method: <span className="font-mono">{mc.method || 'BOOTSTRAP'}</span>
        </p>
      </div>
    </div>
  );
}

export default TailRiskCard;
