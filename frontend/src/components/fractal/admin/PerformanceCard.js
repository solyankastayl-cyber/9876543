/**
 * BLOCK 50 — Performance Card
 * English: all titles, metric names, labels
 */

import React from 'react';
import { BarChart3, TrendingUp, TrendingDown, Target, Award } from 'lucide-react';
import { InfoTooltip, FRACTAL_TOOLTIPS } from './InfoTooltip';

const getSharpeColor = (val) => {
  if (val >= 1.0) return 'text-green-600';
  if (val >= 0.5) return 'text-green-500';
  if (val >= 0) return 'text-amber-600';
  return 'text-red-600';
};

const getSharpeIcon = (val) => {
  if (val >= 1.0) return TrendingUp;
  if (val >= 0.5) return Target;
  return TrendingDown;
};

export function PerformanceCard({ performance }) {
  if (!performance?.windows) return null;
  
  const { windows } = performance;
  
  const formatPercent = (val) => `${(val * 100).toFixed(1)}%`;
  const formatSharpe = (val) => val.toFixed(2);
  
  // Get best window
  const getBestWindow = () => {
    const w = [
      { name: '30D', sharpe: windows.d30?.sharpe || 0 },
      { name: '60D', sharpe: windows.d60?.sharpe || 0 },
      { name: '90D', sharpe: windows.d90?.sharpe || 0 },
    ];
    return w.reduce((best, curr) => curr.sharpe > best.sharpe ? curr : best, w[0]);
  };
  const best = getBestWindow();
  
  return (
    <div 
      className="rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-lg"
      data-testid="performance-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">PERFORMANCE WINDOWS</h3>
          <InfoTooltip {...FRACTAL_TOOLTIPS.performance} placement="right" />
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50">
          <BarChart3 className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-bold text-blue-700">Best: {best.name}</span>
        </div>
      </div>
      
      {/* Column Headers */}
      <div className="grid grid-cols-4 gap-2 mb-3 px-3">
        <div className="text-xs font-bold text-gray-400 uppercase">Window</div>
        <div className="text-xs font-bold text-gray-400 uppercase text-center">Sharpe</div>
        <div className="text-xs font-bold text-gray-400 uppercase text-center">MaxDD</div>
        <div className="text-xs font-bold text-gray-400 uppercase text-center">Hit Rate</div>
      </div>
      
      {/* Window Rows */}
      <div className="space-y-2">
        {[
          { key: 'd30', label: '30 Day', data: windows.d30 },
          { key: 'd60', label: '60 Day', data: windows.d60 },
          { key: 'd90', label: '90 Day', data: windows.d90 },
        ].map(({ key, label, data }) => {
          if (!data) return null;
          const SharpeIcon = getSharpeIcon(data.sharpe);
          
          return (
            <div 
              key={key} 
              className={`grid grid-cols-4 gap-2 p-3 rounded-xl transition-colors ${
                best.name === label.split(' ')[0] + 'D' ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              {/* Period */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-700">{label}</span>
                {best.name === label.split(' ')[0] + 'D' && (
                  <Award className="w-4 h-4 text-blue-500" />
                )}
              </div>
              
              {/* Sharpe */}
              <div className="flex items-center justify-center gap-1.5">
                <SharpeIcon className={`w-4 h-4 ${getSharpeColor(data.sharpe)}`} />
                <span className={`text-lg font-black ${getSharpeColor(data.sharpe)}`}>
                  {formatSharpe(data.sharpe)}
                </span>
              </div>
              
              {/* MaxDD */}
              <div className="flex items-center justify-center">
                <span className={`text-sm font-mono font-bold ${
                  data.maxDD > 0.3 ? 'text-red-600' : data.maxDD > 0.15 ? 'text-amber-600' : 'text-gray-700'
                }`}>
                  {formatPercent(data.maxDD)}
                </span>
              </div>
              
              {/* Hit Rate */}
              <div className="flex items-center justify-center">
                <span className={`text-sm font-mono font-bold ${
                  data.hitRate >= 0.55 ? 'text-green-600' : data.hitRate >= 0.45 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {formatPercent(data.hitRate)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PerformanceCard;
