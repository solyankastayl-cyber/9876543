/**
 * U6 — ScenarioBox Component
 * 
 * Displays Bear/Base/Bull scenarios with:
 * - Target prices
 * - Return percentages
 * - Outcome probabilities
 * - Risk metrics
 * 
 * Single source of truth from backend scenario pack
 */

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { formatPrice as formatPriceUtil } from '../../utils/priceFormatter';

// ═══════════════════════════════════════════════════════════════
// SCENARIO CARD
// ═══════════════════════════════════════════════════════════════

function ScenarioCard({ 
  label, 
  percentile, 
  returnPct, 
  targetPrice, 
  horizonLabel, 
  basePrice,
  isSelected = false,
  onSelect,
  asset = 'BTC'  // Add asset prop for price formatting
}) {
  const isPositive = returnPct >= 0;
  const isBear = label === 'Bear';
  const isBull = label === 'Bull';
  
  // Subtitle based on scenario type - human readable
  const subtitle = isBear ? 'Lower bound scenario' 
                 : isBull ? 'Upper bound scenario' 
                 : 'Median projection';
  
  // Colors based on case type - no borders, no shadows
  let bgColor = 'bg-slate-50';
  let textColor = 'text-slate-700';
  let labelColor = 'text-slate-500';
  let selectedRing = '';
  
  if (isBear) {
    bgColor = 'bg-red-50/50';
    textColor = 'text-red-700';
    labelColor = 'text-red-600';
    selectedRing = isSelected ? 'ring-2 ring-red-400' : '';
  } else if (isBull) {
    bgColor = 'bg-emerald-50/50';
    textColor = 'text-emerald-700';
    labelColor = 'text-emerald-600';
    selectedRing = isSelected ? 'ring-2 ring-emerald-400' : '';
  } else {
    // Base case
    bgColor = 'bg-blue-50/50';
    textColor = 'text-blue-700';
    labelColor = 'text-blue-600';
    selectedRing = isSelected ? 'ring-2 ring-blue-400' : '';
  }
  
  // Use centralized formatter based on asset
  const formatPrice = (p) => formatPriceUtil(p, asset, { compact: true });
  
  const formatReturn = (r) => {
    if (r === undefined || r === null) return '—';
    const pct = r * 100;
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(1)}%`;
  };
  
  return (
    <div 
      className={`flex-1 p-3 rounded-lg ${bgColor} ${selectedRing} transition-all cursor-pointer hover:opacity-80`}
      data-testid={`scenario-card-${label.toLowerCase()}`}
      title={`${label}: This ${isBear ? 'reflects lower 10% historical outcomes' : isBull ? 'represents upper 10% historical outcomes' : 'is the median projection based on matched structures'}`}
      onClick={() => onSelect && onSelect(label)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${labelColor}`}>
          {label}
        </span>
        <span className="text-[9px] text-slate-400">{horizonLabel}</span>
      </div>
      
      {/* Return + Price in compact row */}
      <div className={`text-xl font-bold ${textColor}`}>
        {formatReturn(returnPct)}
      </div>
      <div className="flex items-center gap-1">
        <Target className={`w-3 h-3 ${labelColor}`} />
        <span className={`text-sm font-semibold ${textColor}`}>
          {formatPrice(targetPrice)}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// RANGE STRIP
// ═══════════════════════════════════════════════════════════════

function RangeStrip({ p10, p50, p90, basePrice, selectedCase, selectedTarget, asset = 'BTC' }) {
  // Use centralized formatter
  const formatPrice = (p) => formatPriceUtil(p, asset, { compact: true });
  
  // Calculate positions for visual strip
  const range = p90 - p10;
  const p50Position = range > 0 ? ((p50 - p10) / range) * 100 : 50;
  const basePosition = range > 0 ? ((basePrice - p10) / range) * 100 : 50;
  const selectedPosition = selectedTarget && range > 0 
    ? ((selectedTarget - p10) / range) * 100 
    : p50Position;
  
  // Marker color based on selected case
  const markerColor = selectedCase === 'Bear' ? 'bg-red-500' 
                    : selectedCase === 'Bull' ? 'bg-emerald-500' 
                    : 'bg-blue-500';
  
  return (
    <div className="mt-4 px-2" data-testid="range-strip">
      {/* Zone labels */}
      <div className="flex justify-between mb-1 text-[10px] text-slate-400">
        <span>Lower bound</span>
        <span className="font-medium text-slate-500">{selectedCase} Target</span>
        <span>Upper bound</span>
      </div>
      
      {/* Visual bar - institutional gradient */}
      <div className="relative h-1.5 bg-gradient-to-r from-red-300/60 via-slate-200 to-emerald-300/60 rounded-full">
        {/* Selected scenario marker */}
        <div 
          className={`absolute top-0 w-2.5 h-2.5 ${markerColor} rounded-full -translate-x-1/2 -translate-y-[2px] ring-2 ring-white shadow-sm transition-all duration-300`}
          style={{ left: `${Math.max(5, Math.min(95, selectedPosition))}%` }}
          title={`${selectedCase}: ${formatPrice(selectedTarget || p50)}`}
        />
        {/* NOW marker */}
        <div 
          className="absolute top-0 w-1.5 h-1.5 bg-slate-700 rounded-full -translate-x-1/2"
          style={{ left: `${Math.max(5, Math.min(95, basePosition))}%` }}
          title={`Current: ${formatPrice(basePrice)}`}
        />
      </div>
      
      {/* Price labels */}
      <div className="flex justify-between mt-1.5 text-xs text-slate-500">
        <span>{formatPrice(p10)}</span>
        <span className="text-[10px] text-slate-400">Range: {formatPrice(p10)} – {formatPrice(p90)}</span>
        <span>{formatPrice(p90)}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// OUTCOME STATS
// ═══════════════════════════════════════════════════════════════

function OutcomeStats({ probUp, probDown, avgMaxDD, tailRiskP95, sampleSize, dataStatus, fallbackReason }) {
  const formatPct = (v) => {
    if (v === undefined || v === null) return '—';
    return `${(v * 100).toFixed(0)}%`;
  };
  
  const formatDD = (v) => {
    if (v === undefined || v === null) return '—';
    return `${(v * 100).toFixed(1)}%`;
  };
  
  return (
    <div className="mt-4 p-3 bg-slate-50 rounded-lg" data-testid="outcome-stats">
      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
        Market Statistics
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        {/* Probability of Upside */}
        <div>
          <div className="flex items-center justify-center gap-1 text-emerald-600">
            <TrendingUp className="w-4 h-4" />
            <span className="text-lg font-bold">{formatPct(probUp)}</span>
          </div>
          <div className="text-xs text-slate-500">Probability of Upside</div>
        </div>
        
        {/* Average Max Drawdown */}
        <div>
          <div className="flex items-center justify-center gap-1 text-amber-600">
            <TrendingDown className="w-4 h-4" />
            <span className="text-lg font-bold">{formatDD(avgMaxDD)}</span>
          </div>
          <div className="text-xs text-slate-500">Typical Pullback</div>
        </div>
        
        {/* Worst-case (5%) */}
        <div>
          <div className="flex items-center justify-center gap-1 text-red-500">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-lg font-bold">{formatDD(tailRiskP95)}</span>
          </div>
          <div className="text-xs text-slate-500">Worst-case (5%)</div>
        </div>
        
        {/* Historical Samples */}
        <div>
          <div className="flex items-center justify-center gap-1 text-slate-600">
            <Info className="w-4 h-4" />
            <span className="text-lg font-bold">{sampleSize}</span>
          </div>
          <div className="text-xs text-slate-500">Historical Samples</div>
        </div>
      </div>
      
      {/* Data Status */}
      <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-center gap-2">
        {dataStatus === 'REAL' ? (
          <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
            <CheckCircle className="w-3.5 h-3.5" />
            Live Data
          </div>
        ) : (
          <div className="flex items-center gap-1 text-amber-600 text-xs font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            Fallback Data
            {fallbackReason && (
              <span className="text-[10px] text-slate-400">({fallbackReason})</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN SCENARIO BOX
// ═══════════════════════════════════════════════════════════════

export function ScenarioBox({ scenario, asset = 'BTC' }) {
  const [selectedCase, setSelectedCase] = useState('Base');
  
  if (!scenario) {
    return (
      <div className="p-6 bg-slate-50 rounded-xl" data-testid="scenario-box-empty">
        <div className="text-center text-slate-400">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Loading scenario data...</p>
        </div>
      </div>
    );
  }
  
  const { 
    horizonDays, 
    basePrice, 
    returns, 
    targets, 
    probUp, 
    probDown,
    avgMaxDD, 
    tailRiskP95, 
    sampleSize, 
    dataStatus, 
    fallbackReason,
    cases 
  } = scenario;
  
  // Low sample warning
  const isLowSample = sampleSize < 10;
  
  // Get selected case data for RangeStrip
  const selectedCaseData = cases?.find(c => c.label === selectedCase);
  
  // Format basePrice based on asset
  const formatBasePrice = (p) => formatPriceUtil(p, asset, { compact: false });
  
  return (
    <div 
      className={`bg-white rounded-xl ${isLowSample ? '' : ''} p-5`}
      data-testid="scenario-box"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
          Expected Outcomes
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            NOW: {formatBasePrice(basePrice)}
          </span>
          {isLowSample && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded">
              Low Statistical Power
            </span>
          )}
        </div>
      </div>
      
      {/* Scenario Cards - horizontal row */}
      <div className="grid grid-cols-3 gap-2">
        {cases?.map((c, i) => (
          <ScenarioCard
            key={c.percentile}
            label={c.label}
            percentile={c.percentile}
            returnPct={c.return}
            targetPrice={c.targetPrice}
            horizonLabel={c.horizonLabel}
            basePrice={basePrice}
            isSelected={c.label === selectedCase}
            onSelect={setSelectedCase}
            asset={asset}
          />
        ))}
      </div>
      
      {/* Range Strip - shows selected scenario focus */}
      <RangeStrip 
        p10={targets?.p10}
        p50={targets?.p50}
        p90={targets?.p90}
        basePrice={basePrice}
        selectedCase={selectedCase}
        selectedTarget={selectedCaseData?.targetPrice}
        asset={asset}
      />
      
      {/* Outcome Stats */}
      <OutcomeStats 
        probUp={probUp}
        probDown={probDown}
        avgMaxDD={avgMaxDD}
        tailRiskP95={tailRiskP95}
        sampleSize={sampleSize}
        dataStatus={dataStatus}
        fallbackReason={fallbackReason}
      />
    </div>
  );
}

export default ScenarioBox;
