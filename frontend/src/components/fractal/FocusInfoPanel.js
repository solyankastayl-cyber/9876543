/**
 * BLOCK 70.2 STEP 2 — FocusInfoPanel
 * 
 * Shows current focus state:
 * - Focus horizon
 * - Window/Aftermath days
 * - Matches count
 * - Sample coverage
 */

import React from 'react';
import { getTierColor, getTierLabel } from '../../hooks/useFocusPack';

export const FocusInfoPanel = ({ meta, diagnostics, overlay }) => {
  if (!meta) return null;
  
  const tier = meta.tier;
  const tierColor = getTierColor(tier);
  
  return (
    <div 
      className="flex items-center gap-4 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200 text-xs"
      data-testid="focus-info-panel"
    >
      {/* Focus Badge */}
      <div className="flex items-center gap-2">
        <span 
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: tierColor }}
        />
        <span className="font-semibold text-slate-700">
          Focus: {meta.focus?.toUpperCase()}
        </span>
        <span className="text-slate-400">
          ({getTierLabel(tier)})
        </span>
      </div>
      
      {/* Divider */}
      <div className="w-px h-4 bg-slate-200" />
      
      {/* Window Info */}
      <div className="flex items-center gap-3 text-slate-500">
        <span>
          Window: <span className="font-medium text-slate-700">{meta.windowLen}d</span>
        </span>
        <span>
          Aftermath: <span className="font-medium text-slate-700">{meta.aftermathDays}d</span>
        </span>
      </div>
      
      {/* Divider */}
      <div className="w-px h-4 bg-slate-200" />
      
      {/* Matches & Quality */}
      <div className="flex items-center gap-3 text-slate-500">
        <span>
          Matches: <span className="font-medium text-slate-700">{overlay?.matches?.length || 0}</span>
        </span>
        {diagnostics && (
          <>
            <span>
              Sample: <span className="font-medium text-slate-700">{diagnostics.sampleSize}</span>
            </span>
            <span>
              Coverage: <span className="font-medium text-slate-700">{diagnostics.coverageYears?.toFixed(1)}y</span>
            </span>
            <span>
              Quality: <span className={`font-medium ${
                diagnostics.qualityScore > 0.7 ? 'text-green-600' :
                diagnostics.qualityScore > 0.5 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {(diagnostics.qualityScore * 100).toFixed(0)}%
              </span>
            </span>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * Compact version showing just key stats
 */
export const FocusStatsBadge = ({ meta, overlay }) => {
  if (!meta) return null;
  
  const tierColor = getTierColor(meta.tier);
  
  return (
    <div className="flex items-center gap-2 text-xs">
      <span 
        className="px-2 py-1 rounded font-medium"
        style={{ 
          backgroundColor: `${tierColor}15`,
          color: tierColor
        }}
      >
        {meta.focus?.toUpperCase()}
      </span>
      <span className="text-slate-400">
        {meta.aftermathDays}d horizon
      </span>
      <span className="text-slate-400">
        · {overlay?.matches?.length || 0} matches
      </span>
    </div>
  );
};

export default FocusInfoPanel;
