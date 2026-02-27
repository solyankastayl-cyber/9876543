/**
 * FRACTAL ENGINE BREAKDOWN
 * Shows how forecast was constructed
 * 
 * Left: Historical Anchor (Best Match)
 * Right: Hybrid Construction
 */

import React from 'react';

const StatItem = ({ label, value, highlight = false }) => (
  <div className="flex justify-between py-1 text-sm">
    <span className="text-slate-500">{label}</span>
    <span className={`font-medium ${highlight ? 'text-blue-600' : 'text-slate-900'}`}>
      {value}
    </span>
  </div>
);

const FractalEngineBreakdown = ({ focusPack, matches }) => {
  if (!focusPack) return null;

  const { overlay, hybrid, meta } = focusPack;
  
  // Best match info
  const bestMatch = matches?.[0] || overlay?.matches?.[0];
  const matchDate = bestMatch?.startDate || bestMatch?.date || '—';
  const similarity = bestMatch?.similarity || bestMatch?.score || 0;
  const historicalReturn = bestMatch?.outcomeReturn || bestMatch?.outcome || 0;
  
  // Hybrid construction
  const replayWeight = hybrid?.replayWeight || 80;
  const modelWeight = 100 - replayWeight;
  const volatilityAdj = meta?.volatilityAdjustment || 0;
  const structuralBias = meta?.structuralBias || 0;
  
  // Coverage
  const coverageYears = meta?.coverageYears || 50;
  const sampleSize = matches?.length || overlay?.matches?.length || 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" data-testid="fractal-engine-breakdown">
      {/* Left: Historical Anchor */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="text-xs font-semibold text-slate-500 uppercase mb-3">
          Historical Anchor
        </div>
        
        <StatItem label="Best Match" value={matchDate} highlight />
        <StatItem label="Similarity" value={`${(similarity * 100).toFixed(0)}%`} />
        <StatItem 
          label="Historical Return" 
          value={`${historicalReturn >= 0 ? '+' : ''}${(historicalReturn * 100).toFixed(1)}%`} 
        />
        <div className="border-t border-slate-100 my-2"></div>
        <StatItem label="Coverage" value={`${coverageYears} years`} />
        <StatItem label="Sample Size" value={`${sampleSize} matches`} />
      </div>
      
      {/* Right: Hybrid Construction */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="text-xs font-semibold text-slate-500 uppercase mb-3">
          Hybrid Construction
        </div>
        
        <StatItem label="Model Weight" value={`${modelWeight}%`} />
        <StatItem label="Replay Weight" value={`${replayWeight}%`} highlight />
        <div className="border-t border-slate-100 my-2"></div>
        <StatItem 
          label="Volatility Adj" 
          value={volatilityAdj !== 0 ? `${volatilityAdj > 0 ? '+' : ''}${(volatilityAdj * 100).toFixed(1)}%` : '0%'} 
        />
        <StatItem 
          label="Structural Bias" 
          value={structuralBias !== 0 ? `${structuralBias > 0 ? '+' : ''}${(structuralBias * 100).toFixed(1)}%` : '0%'} 
        />
      </div>
    </div>
  );
};

export default FractalEngineBreakdown;
