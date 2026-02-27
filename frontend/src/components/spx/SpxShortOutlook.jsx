/**
 * SPX SHORT OUTLOOK — 7D Outlook Box
 * 
 * BLOCK B5.8 — Fills empty space for short horizons
 */

import React from 'react';

const SpxShortOutlook = ({ pack, consensus }) => {
  // Only show for 7d or 14d horizons
  const focus = pack?.meta?.focus || pack?.focus;
  if (!focus || !['7d', '14d'].includes(focus)) {
    return null;
  }

  const direction = consensus?.direction || 
    (pack?.overlay?.stats?.medianReturn > 0 ? 'BULL' : 
     pack?.overlay?.stats?.medianReturn < 0 ? 'BEAR' : 'NEUTRAL');
  
  const consensusIndex = consensus?.consensusIndex || 
    Math.round((pack?.overlay?.stats?.hitRate || 0.5) * 100);
  
  const divergenceGrade = pack?.divergence?.grade || 'NA';
  const matchesCount = pack?.overlay?.matches?.length || 0;
  const hitRate = pack?.overlay?.stats?.hitRate || 0;
  const medianReturn = pack?.overlay?.stats?.medianReturn || 0;

  const directionColors = {
    BULL: 'text-emerald-400',
    BEAR: 'text-red-400',
    NEUTRAL: 'text-slate-400',
  };

  const gradeColors = {
    A: 'bg-emerald-500/20 text-emerald-400',
    B: 'bg-blue-500/20 text-blue-400',
    C: 'bg-yellow-500/20 text-yellow-400',
    D: 'bg-orange-500/20 text-orange-400',
    F: 'bg-red-500/20 text-red-400',
    NA: 'bg-slate-500/20 text-slate-400',
  };

  return (
    <div 
      className="bg-slate-800/50 rounded-xl border border-slate-700 p-4"
      data-testid="spx-short-outlook"
    >
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">
        Short-Term Outlook ({focus.toUpperCase()})
      </h3>

      <div className="space-y-3">
        {/* Bias */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm">Bias</span>
          <span className={`font-bold ${directionColors[direction]}`}>
            {direction}
          </span>
        </div>

        {/* Confidence */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm">Confidence</span>
          <span className={`font-medium ${
            consensusIndex > 60 ? 'text-emerald-400' : 
            consensusIndex < 40 ? 'text-red-400' : 'text-slate-300'
          }`}>
            {consensusIndex}%
          </span>
        </div>

        {/* Divergence */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm">Divergence</span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${gradeColors[divergenceGrade]}`}>
            {divergenceGrade}
          </span>
        </div>

        {/* Matches */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm">Matches</span>
          <span className="text-slate-300 font-medium">{matchesCount}</span>
        </div>

        {/* Hit Rate */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm">Hit Rate</span>
          <span className={`font-medium ${
            hitRate > 0.55 ? 'text-emerald-400' : 
            hitRate < 0.45 ? 'text-red-400' : 'text-slate-300'
          }`}>
            {(hitRate * 100).toFixed(1)}%
          </span>
        </div>

        {/* Median Return */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm">Median Return</span>
          <span className={`font-medium ${
            medianReturn > 0 ? 'text-emerald-400' : 
            medianReturn < 0 ? 'text-red-400' : 'text-slate-300'
          }`}>
            {medianReturn > 0 ? '+' : ''}{(medianReturn * 100).toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Quick Action Hint */}
      <div className="mt-4 pt-3 border-t border-slate-700">
        <div className="text-xs text-slate-500">
          {direction === 'BULL' && consensusIndex > 60 && (
            <span className="text-emerald-400">↑ Short-term bullish momentum confirmed</span>
          )}
          {direction === 'BEAR' && consensusIndex > 60 && (
            <span className="text-red-400">↓ Short-term bearish pressure</span>
          )}
          {consensusIndex <= 60 && consensusIndex >= 40 && (
            <span>→ Mixed signals, await confirmation</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpxShortOutlook;
