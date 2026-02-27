/**
 * FRACTAL ANALYSIS — Compact Panel (1.5 columns width)
 * 
 * Based on original Top Matches with scroll
 * + Projection header (Bear/Base/Bull)
 * + Reliability strip
 */

import React, { useState } from 'react';

// Phase colors - text only, no background
const PHASE_CLASSES = {
  MARKUP: 'text-green-600 font-semibold',
  MARKDOWN: 'text-red-600 font-semibold',
  RECOVERY: 'text-blue-600 font-semibold',
  DISTRIBUTION: 'text-orange-600 font-semibold',
  ACCUMULATION: 'text-emerald-600 font-semibold',
  CAPITULATION: 'text-rose-600 font-semibold',
};

// Tooltips
const TIPS = {
  bear: 'Bear Case — worst-case (10th percentile)',
  base: 'Base Case — median expected outcome',
  bull: 'Bull Case — best-case (90th percentile)',
  upside: 'Upside Probability — % of positive outcomes',
  dd: 'Average Max Drawdown — typical peak-to-trough decline during the period',
};

function Tip({ text, children }) {
  const [show, setShow] = useState(false);
  return (
    <span 
      className="relative cursor-help"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span className="absolute bottom-full left-0 mb-2 z-50 bg-gray-800 text-white text-xs px-3 py-2 rounded-md w-48 shadow-lg">
          {text}
        </span>
      )}
    </span>
  );
}

export function FractalAnalysisPanel({ forecast, overlay, matches, focus }) {
  const stats = overlay?.stats || {};
  const matchList = matches || overlay?.matches || [];
  const matchCount = matchList.length || 0;
  
  // Projections
  const p10 = forecast?.p10 ?? stats.p10Return ?? -0.15;
  const p50 = forecast?.p50 ?? stats.medianReturn ?? 0.02;
  const p90 = forecast?.p90 ?? stats.p90Return ?? 0.20;
  
  // Reliability
  const hitRate = stats.hitRate ?? 0.65;
  const avgDD = stats.avgMaxDD ?? -0.16;

  return (
    <div 
      className="bg-white rounded-lg overflow-hidden h-full"
      data-testid="fractal-analysis-panel"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <span className="text-sm font-semibold text-slate-700">Fractal Analysis</span>
        <span className="text-xs text-slate-400">{matchCount} matches</span>
      </div>
      
      {/* Projection Row - Compact */}
      <div className="px-4 py-3 border-b border-slate-100 flex justify-around">
        <Tip text={TIPS.bear}>
          <div className="text-center">
            <div className="text-[10px] text-slate-400 uppercase">Bear</div>
            <div className="text-lg font-bold text-red-600">{(p10 * 100).toFixed(1)}%</div>
          </div>
        </Tip>
        <div className="w-px bg-slate-200" />
        <Tip text={TIPS.base}>
          <div className="text-center">
            <div className="text-[10px] text-slate-400 uppercase">Base</div>
            <div className={`text-lg font-bold ${p50 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {p50 >= 0 ? '+' : ''}{(p50 * 100).toFixed(1)}%
            </div>
          </div>
        </Tip>
        <div className="w-px bg-slate-200" />
        <Tip text={TIPS.bull}>
          <div className="text-center">
            <div className="text-[10px] text-slate-400 uppercase">Bull</div>
            <div className="text-lg font-bold text-green-600">+{(p90 * 100).toFixed(1)}%</div>
          </div>
        </Tip>
      </div>
      
      {/* Reliability Strip - Mini */}
      <div className="px-4 py-2 bg-slate-50/50 border-b border-slate-100 flex justify-around text-xs">
        <Tip text={TIPS.upside}>
          <span className="text-slate-500">
            Upside: <span className={`font-semibold ${hitRate > 0.5 ? 'text-green-600' : 'text-red-600'}`}>
              {(hitRate * 100).toFixed(0)}%
            </span>
          </span>
        </Tip>
        <span className="text-slate-300">|</span>
        <Tip text={TIPS.dd}>
          <span className="text-slate-500">
            Max Pullback: <span className="font-semibold text-red-600">{(avgDD * 100).toFixed(1)}%</span>
          </span>
        </Tip>
      </div>
      
      {/* Top Matches - Original scroll style */}
      <div className="p-4">
        <div className="text-xs font-semibold text-slate-500 uppercase mb-3">
          Top Matches
        </div>
        
        <div className="space-y-2 max-h-56 overflow-y-auto">
          {matchList.map((m, i) => {
            const ret = m.return30d ?? m.return ?? m.aftermath?.ret30d ?? 0;
            const phaseClass = PHASE_CLASSES[m.phase] || 'bg-slate-100 text-slate-600';
            
            return (
              <div 
                key={m.id || i}
                className="flex items-center justify-between p-2 bg-slate-50 rounded hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-400 w-5 text-right">{i + 1}</span>
                  <span className="text-sm font-medium text-slate-700">
                    {m.startDate?.slice(0, 10) || m.id}
                  </span>
                  <span className={`text-xs ${phaseClass}`}>
                    {m.phase}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400">
                    <span className="font-medium text-slate-500">{(m.similarity * 100).toFixed(0)}%</span>
                  </span>
                  <span className={`font-semibold ${ret >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {ret >= 0 ? '+' : ''}{(ret * 100).toFixed(1)}%
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

export default FractalAnalysisPanel;
