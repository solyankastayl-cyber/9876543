/**
 * SPX PHASE HEATMAP — B6.8.3
 * 
 * Phase performance heatmap for SPX with:
 * - Per-phase performance metrics (hitRate, avgRet, samples)
 * - Grade coloring (A/B/C/D/F)
 * - Hover tooltip with details
 * - Click to filter matches by phase
 * - SPX-native phase detection integration
 */

import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// Grade colors
const GRADE_COLORS = {
  A: { bg: 'bg-emerald-100', border: 'border-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-500' },
  B: { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-700', badge: 'bg-green-500' },
  C: { bg: 'bg-yellow-100', border: 'border-yellow-500', text: 'text-yellow-700', badge: 'bg-yellow-500' },
  D: { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-700', badge: 'bg-orange-500' },
  F: { bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-700', badge: 'bg-red-500' },
};

// Phase colors
const PHASE_COLORS = {
  ACCUMULATION: { bg: 'bg-emerald-500', text: 'text-white' },
  MARKUP: { bg: 'bg-green-500', text: 'text-white' },
  DISTRIBUTION: { bg: 'bg-orange-500', text: 'text-white' },
  MARKDOWN: { bg: 'bg-red-500', text: 'text-white' },
  NEUTRAL: { bg: 'bg-slate-400', text: 'text-white' },
};

/**
 * Calculate grade based on hitRate and avgReturn
 */
const calculateGrade = (phase) => {
  const hitRate = phase.hitRate || 0;
  const avgRet = phase.avgReturn || 0;
  
  // Score based on hit rate and returns
  const hitScore = hitRate > 0.6 ? 2 : hitRate > 0.5 ? 1 : hitRate > 0.4 ? 0 : -1;
  const retScore = avgRet > 0.05 ? 2 : avgRet > 0.02 ? 1 : avgRet > 0 ? 0 : avgRet > -0.02 ? -1 : -2;
  const totalScore = hitScore + retScore;
  
  if (totalScore >= 3) return 'A';
  if (totalScore >= 1) return 'B';
  if (totalScore >= 0) return 'C';
  if (totalScore >= -1) return 'D';
  return 'F';
};

/**
 * Phase Row Component
 */
const PhaseRow = ({ phase, isSelected, onSelect, onFilter }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const grade = calculateGrade(phase);
  const gradeColor = GRADE_COLORS[grade] || GRADE_COLORS.C;
  const phaseColor = PHASE_COLORS[phase.phaseName] || PHASE_COLORS.NEUTRAL;
  
  return (
    <div
      className={`
        relative p-3 mb-1 rounded-lg transition-all cursor-pointer
        border-l-4 ${gradeColor.border} ${gradeColor.bg}
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
        hover:shadow-md
      `}
      onClick={() => onSelect(phase.phaseId)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`spx-phase-row-${phase.phaseName?.toLowerCase()}`}
    >
      <div className="flex items-center justify-between">
        {/* Phase Name + Grade */}
        <div className="flex items-center gap-3">
          <span className={`${phaseColor.bg} ${phaseColor.text} px-3 py-1 rounded text-xs font-bold min-w-[100px] text-center`}>
            {phase.phaseName}
          </span>
          
          <span className={`${gradeColor.badge} text-white px-2 py-0.5 rounded text-xs font-bold`}>
            {grade}
          </span>
          
          {phase.samples < 30 && (
            <span className="bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded text-[10px] font-medium">
              LOW SAMPLES
            </span>
          )}
        </div>
        
        {/* Metrics */}
        <div className="flex items-center gap-6">
          <div className="text-center min-w-[50px]">
            <div className="text-[10px] text-slate-500">Samples</div>
            <div className="text-sm font-semibold text-slate-700">{phase.samples || 0}</div>
          </div>
          
          <div className="text-center min-w-[60px]">
            <div className="text-[10px] text-slate-500">Hit Rate</div>
            <div className={`text-sm font-semibold ${phase.hitRate > 0.55 ? 'text-green-600' : phase.hitRate < 0.45 ? 'text-red-600' : 'text-slate-700'}`}>
              {((phase.hitRate || 0) * 100).toFixed(0)}%
            </div>
          </div>
          
          <div className="text-center min-w-[60px]">
            <div className="text-[10px] text-slate-500">Avg Return</div>
            <div className={`text-sm font-semibold ${(phase.avgReturn || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(phase.avgReturn || 0) >= 0 ? '+' : ''}{((phase.avgReturn || 0) * 100).toFixed(1)}%
            </div>
          </div>
          
          <button
            onClick={(e) => { e.stopPropagation(); onFilter(phase.phaseName); }}
            className={`px-3 py-1 text-xs font-semibold rounded transition-colors
              bg-white border ${gradeColor.border} ${gradeColor.text}
              hover:${gradeColor.bg}
            `}
            data-testid={`spx-filter-phase-${phase.phaseName?.toLowerCase()}`}
          >
            Filter
          </button>
        </div>
      </div>
      
      {/* Hover tooltip with extended stats */}
      {isHovered && (
        <div className="absolute z-20 left-full ml-2 top-0 bg-slate-900 text-white rounded-lg shadow-xl p-3 min-w-[200px]">
          <div className="text-xs font-semibold mb-2 pb-2 border-b border-slate-700">
            {phase.phaseName} Details
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Matches:</span>
              <span>{phase.matchCount || phase.samples}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Median Return:</span>
              <span className={phase.medianReturn >= 0 ? 'text-green-400' : 'text-red-400'}>
                {((phase.medianReturn || 0) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">P10 (Worst):</span>
              <span className="text-red-400">{((phase.p10Return || 0) * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">P90 (Best):</span>
              <span className="text-green-400">{((phase.p90Return || 0) * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Volatility:</span>
              <span>{((phase.volatility || 0) * 100).toFixed(1)}%</span>
            </div>
          </div>
          {/* Arrow */}
          <div className="absolute right-full top-4 w-0 h-0 
            border-t-8 border-b-8 border-r-8
            border-t-transparent border-b-transparent border-r-slate-900" />
        </div>
      )}
    </div>
  );
};

/**
 * Mini Heatmap Grid (compact view)
 */
export const SpxPhaseHeatmapMini = ({ phases = [], onPhaseFilter }) => {
  if (!phases || phases.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-1" data-testid="spx-phase-heatmap-mini">
      {phases.map((phase) => {
        const grade = calculateGrade(phase);
        const gradeColor = GRADE_COLORS[grade] || GRADE_COLORS.C;
        
        return (
          <button
            key={phase.phaseName}
            onClick={() => onPhaseFilter?.(phase.phaseName)}
            className={`
              px-2 py-1 rounded text-xs font-medium transition-all
              ${gradeColor.bg} ${gradeColor.text} border ${gradeColor.border}
              hover:scale-105 hover:shadow
            `}
            title={`${phase.phaseName}: ${((phase.hitRate || 0) * 100).toFixed(0)}% hit, ${((phase.avgReturn || 0) * 100).toFixed(1)}% avg`}
          >
            {phase.phaseName?.slice(0, 4)}
            <span className="ml-1 opacity-75">{grade}</span>
          </button>
        );
      })}
    </div>
  );
};

/**
 * Main SPX Phase Heatmap Component
 */
export const SpxPhaseHeatmap = ({ 
  focus = '30d',
  matches = [],
  onPhaseFilter,
  className = ''
}) => {
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [aggregatedPhases, setAggregatedPhases] = useState([]);
  
  // Aggregate phase stats from matches
  useEffect(() => {
    if (!matches || matches.length === 0) {
      setAggregatedPhases([]);
      return;
    }
    
    const phaseMap = {};
    
    matches.forEach((m) => {
      const phaseName = m.phase || 'NEUTRAL';
      if (!phaseMap[phaseName]) {
        phaseMap[phaseName] = {
          phaseName,
          phaseId: `spx_phase_${phaseName.toLowerCase()}`,
          samples: 0,
          returns: [],
          hits: 0,
        };
      }
      
      phaseMap[phaseName].samples++;
      const ret = m.return ? m.return / 100 : 0; // Convert % to decimal
      phaseMap[phaseName].returns.push(ret);
      if (ret > 0) phaseMap[phaseName].hits++;
    });
    
    // Calculate aggregated stats
    const phases = Object.values(phaseMap).map((p) => {
      const sortedRets = [...p.returns].sort((a, b) => a - b);
      const sum = p.returns.reduce((a, b) => a + b, 0);
      
      return {
        ...p,
        hitRate: p.samples > 0 ? p.hits / p.samples : 0,
        avgReturn: p.samples > 0 ? sum / p.samples : 0,
        medianReturn: sortedRets[Math.floor(sortedRets.length / 2)] || 0,
        p10Return: sortedRets[Math.floor(sortedRets.length * 0.1)] || 0,
        p90Return: sortedRets[Math.floor(sortedRets.length * 0.9)] || 0,
        volatility: calculateStdDev(p.returns),
        matchCount: p.samples,
      };
    });
    
    // Sort by samples (most common first)
    phases.sort((a, b) => b.samples - a.samples);
    
    setAggregatedPhases(phases);
  }, [matches]);
  
  const handlePhaseFilter = (phaseName) => {
    if (onPhaseFilter) {
      onPhaseFilter(phaseName);
    }
  };
  
  if (aggregatedPhases.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-slate-200 p-4 ${className}`}>
        <div className="text-xs font-semibold text-slate-500 uppercase mb-3">
          Phase Performance
        </div>
        <div className="text-sm text-slate-400 text-center py-4">
          No phase data available
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={`bg-white rounded-lg border border-slate-200 overflow-hidden ${className}`}
      data-testid="spx-phase-heatmap"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">
            Phase Performance Heatmap
          </span>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded">
            B6.8.3
          </span>
        </div>
        <span className="text-xs text-slate-400">
          {aggregatedPhases.length} phases • {matches?.length || 0} matches
        </span>
      </div>
      
      {/* Phase Rows */}
      <div className="p-3">
        {aggregatedPhases.map((phase) => (
          <PhaseRow
            key={phase.phaseId}
            phase={phase}
            isSelected={selectedPhase === phase.phaseId}
            onSelect={setSelectedPhase}
            onFilter={handlePhaseFilter}
          />
        ))}
      </div>
      
      {/* Legend */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center gap-4 text-[10px] text-slate-500">
        <span>Grades:</span>
        {['A', 'B', 'C', 'D', 'F'].map((grade) => {
          const gc = GRADE_COLORS[grade];
          return (
            <span key={grade} className={`${gc.badge} text-white px-1.5 py-0.5 rounded font-bold`}>
              {grade}
            </span>
          );
        })}
        <span className="ml-auto">Click row for details • Filter to show matches</span>
      </div>
    </div>
  );
};

// Helper: Calculate standard deviation
function calculateStdDev(values) {
  if (!values || values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(v => Math.pow(v - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
}

export default SpxPhaseHeatmap;
