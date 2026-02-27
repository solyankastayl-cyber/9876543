/**
 * FORECAST SUMMARY PANEL
 * Right side panel showing forecast metrics
 * 
 * Shows:
 * - Current Price
 * - Synthetic/Replay/Hybrid Returns
 * - Macro Impact
 * - Final Forecast
 * - Confidence
 */

import React from 'react';

const MetricRow = ({ label, value, subValue, color = 'text-slate-900', size = 'normal' }) => (
  <div className="flex justify-between items-baseline py-1.5 border-b border-slate-100 last:border-0">
    <span className="text-xs text-slate-500">{label}</span>
    <div className="text-right">
      <span className={`${size === 'large' ? 'text-lg' : 'text-sm'} font-semibold ${color}`}>
        {value}
      </span>
      {subValue && (
        <span className="text-xs text-slate-400 ml-1">{subValue}</span>
      )}
    </div>
  </div>
);

const ForecastSummaryPanel = ({ focusPack, focus }) => {
  if (!focusPack) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-4 h-full">
        <div className="text-xs font-semibold text-slate-500 uppercase mb-3">
          Forecast Summary
        </div>
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    );
  }

  // Extract from focusPack - check both direct and nested structures
  const unifiedPath = focusPack.unifiedPath || {};
  const forecast = focusPack.forecast || {};
  const meta = focusPack.meta || {};
  
  // Current price from unifiedPath or forecast
  const currentPrice = unifiedPath.anchorPrice || forecast.currentPrice || focusPack.currentPrice || 0;
  
  // Extract returns from paths
  const syntheticPath = unifiedPath.syntheticPath || [];
  const replayPath = unifiedPath.replayPath || [];
  const hybridPath = unifiedPath.hybridPath || [];
  const macroPath = unifiedPath.macroPath || [];
  
  // Get end returns (last point pct)
  const syntheticReturn = syntheticPath.length > 0 
    ? (syntheticPath[syntheticPath.length - 1]?.pct || 0) 
    : (forecast.expectedReturn || 0);
  const replayReturn = replayPath.length > 0 
    ? (replayPath[replayPath.length - 1]?.pct || 0) 
    : 0;
  const hybridReturn = hybridPath.length > 0 
    ? (hybridPath[hybridPath.length - 1]?.pct || 0) 
    : 0;
  
  // Macro adjustment
  const macroAdjustment = unifiedPath.macroAdjustment?.maxAdjustment || 0;
  const macroReturn = macroPath.length > 0 
    ? (macroPath[macroPath.length - 1]?.pct || 0) 
    : hybridReturn;
  const macroRegime = unifiedPath.macroAdjustment?.description || 'No macro data';
  
  // Final forecast (macro-adjusted if available)
  const finalForecast = macroAdjustment !== 0 ? macroReturn : hybridReturn;
  
  // Confidence from meta
  const confidence = meta?.confidence || forecast?.confidence || 0.5;
  const confidenceLabel = confidence >= 0.7 ? 'High' : confidence >= 0.4 ? 'Medium' : 'Low';
  const confidenceColor = confidence >= 0.7 ? 'text-green-600' : confidence >= 0.4 ? 'text-amber-600' : 'text-slate-500';
  
  // Format helpers
  const formatPrice = (p) => p ? `$${p.toFixed(2)}` : '—';
  const formatReturn = (r) => {
    if (r === undefined || r === null) return '0.0%';
    const pct = r * 100; // r is already decimal (e.g., 0.01 = 1%)
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(2)}%`;
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 h-full flex flex-col" data-testid="forecast-summary-panel">
      {/* Header */}
      <div className="text-xs font-semibold text-slate-500 uppercase mb-3 flex justify-between items-center">
        <span>Forecast Summary</span>
        <span className="text-slate-400 font-normal">{focus}</span>
      </div>
      
      {/* Current Price */}
      <div className="bg-slate-50 rounded-lg p-3 mb-4">
        <div className="text-xs text-slate-400 mb-1">Current Price</div>
        <div className="text-2xl font-bold text-slate-900">{formatPrice(currentPrice)}</div>
      </div>
      
      {/* Path Returns */}
      <div className="flex-1">
        <div className="text-[10px] font-semibold text-slate-400 uppercase mb-2">Path Returns</div>
        
        <MetricRow 
          label="Synthetic" 
          value={formatReturn(syntheticReturn)}
          color={syntheticReturn < 0 ? 'text-red-600' : 'text-green-600'}
        />
        
        <MetricRow 
          label="Replay" 
          value={formatReturn(replayReturn)}
          color={replayReturn < 0 ? 'text-red-600' : 'text-green-600'}
        />
        
        <MetricRow 
          label="Hybrid" 
          value={formatReturn(hybridReturn)}
          color={hybridReturn < 0 ? 'text-red-600' : 'text-green-600'}
        />
        
        {/* Divider */}
        <div className="border-t border-slate-200 my-3"></div>
        
        {/* Macro Impact */}
        <div className="text-[10px] font-semibold text-slate-400 uppercase mb-2">Macro Impact</div>
        
        <MetricRow 
          label="Macro Bias" 
          value={macroAdjustment !== 0 ? `${(macroAdjustment * 100).toFixed(2)}%` : '0%'}
          color={macroAdjustment < 0 ? 'text-amber-600' : macroAdjustment > 0 ? 'text-blue-600' : 'text-slate-400'}
        />
        
        <MetricRow 
          label="Final Forecast" 
          value={formatReturn(finalForecast)}
          color={finalForecast < 0 ? 'text-red-600' : 'text-green-600'}
          size="large"
        />
        
        {/* Divider */}
        <div className="border-t border-slate-200 my-3"></div>
        
        {/* Confidence */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500">Confidence</span>
          <span className={`text-sm font-semibold ${confidenceColor}`}>
            {(confidence * 100).toFixed(0)}% ({confidenceLabel})
          </span>
        </div>
        
        {/* Regime */}
        <div className="mt-2 text-xs text-slate-400">
          {macroRegime}
        </div>
      </div>
    </div>
  );
};

export default ForecastSummaryPanel;
