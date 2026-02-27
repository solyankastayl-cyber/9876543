/**
 * OUTCOMES & RISK PANEL
 * Combined panel with distribution and risk context
 * 
 * Left: Distribution (bounds, pullback)
 * Right: Risk Context
 */

import React from 'react';

const OutcomesRiskPanel = ({ scenario, volatility, sizing, focusPack }) => {
  // Distribution data
  const core = focusPack?.core || {};
  const outcomes = scenario?.outcomes || {};
  
  const lowerBound = outcomes.bear || core.p10Return || -5;
  const baseCase = outcomes.base || core.expectedReturn || -2;
  const upperBound = outcomes.bull || core.p90Return || 2;
  const typicalPullback = scenario?.maxPullback || volatility?.typicalPullback || 2;
  const worstCase = scenario?.worstCase || lowerBound * 1.5;
  
  // Risk context
  const riskLevel = volatility?.regime || 'NORMAL';
  const drawdownExpect = volatility?.expectedDrawdown || typicalPullback;
  const volRegime = volatility?.regime || 'Normal';
  const positionMult = sizing?.multiplier || 1.0;
  
  // Format
  const formatPct = (v) => {
    if (v === undefined || v === null) return '—';
    const sign = v >= 0 ? '+' : '';
    return `${sign}${(v * 100 || v).toFixed(1)}%`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" data-testid="outcomes-risk-panel">
      {/* Left: Distribution */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="text-xs font-semibold text-slate-500 uppercase mb-3">
          Expected Distribution
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Lower Bound (P10)</span>
            <span className="font-medium text-red-600">{formatPct(lowerBound)}</span>
          </div>
          
          <div className="flex justify-between bg-slate-50 -mx-4 px-4 py-2">
            <span className="text-slate-700 font-medium">Base Case (P50)</span>
            <span className={`font-semibold ${baseCase < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatPct(baseCase)}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-slate-500">Upper Bound (P90)</span>
            <span className="font-medium text-green-600">{formatPct(upperBound)}</span>
          </div>
          
          <div className="border-t border-slate-100 pt-2 mt-2"></div>
          
          <div className="flex justify-between">
            <span className="text-slate-500">Typical Pullback</span>
            <span className="font-medium text-amber-600">-{typicalPullback.toFixed(1)}%</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-slate-500">Worst Case</span>
            <span className="font-medium text-red-700">{formatPct(worstCase)}</span>
          </div>
        </div>
      </div>
      
      {/* Right: Risk Context */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="text-xs font-semibold text-slate-500 uppercase mb-3">
          Risk Context
        </div>
        
        <div className="space-y-3">
          {/* Risk Level Badge */}
          <div className="flex justify-between items-center">
            <span className="text-slate-500 text-sm">Risk Level</span>
            <span className={`px-2 py-1 rounded text-sm font-semibold ${
              riskLevel === 'CRISIS' ? 'bg-red-100 text-red-700' :
              riskLevel === 'HIGH' ? 'bg-amber-100 text-amber-700' :
              'bg-green-100 text-green-700'
            }`}>
              {riskLevel}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Expected Drawdown</span>
            <span className="font-medium text-amber-600">-{drawdownExpect.toFixed(1)}%</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Volatility Regime</span>
            <span className="font-medium text-slate-700">{volRegime}</span>
          </div>
          
          <div className="border-t border-slate-100 pt-2"></div>
          
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Position Multiplier</span>
            <span className={`font-semibold ${
              positionMult < 1 ? 'text-amber-600' : 'text-slate-700'
            }`}>
              {positionMult.toFixed(2)}x
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutcomesRiskPanel;
