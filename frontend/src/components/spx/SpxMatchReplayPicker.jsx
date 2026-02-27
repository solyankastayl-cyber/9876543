/**
 * SPX MATCH REPLAY PICKER — B6.8.1
 * 
 * Top-5 match chips with click to change replay line
 * Features:
 * - Top-5 chips with similarity %, phase, return
 * - Click to select different match for replay
 * - AUTO badge on primary match
 * - Divergence recalculation on selection change
 */

import React from 'react';

const PHASE_COLORS = {
  MARKUP: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  MARKDOWN: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  ACCUMULATION: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
  DISTRIBUTION: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  NEUTRAL: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300' },
};

/**
 * Individual Match Chip
 */
const MatchChip = ({ match, index, isSelected, isPrimary, isBest, onClick }) => {
  const phaseColor = PHASE_COLORS[match.phase] || PHASE_COLORS.NEUTRAL;
  
  return (
    <button
      onClick={onClick}
      data-testid={`spx-match-chip-${index}`}
      title={isBest ? "Best match (highest similarity)" : "Click to replay this historical pattern"}
      className={`
        relative px-3 py-2 rounded-lg transition-all duration-200
        flex items-center gap-2 text-sm
        ${isSelected 
          ? 'bg-slate-900 text-white shadow-lg scale-105' 
          : isBest
            ? 'bg-emerald-50 border border-emerald-300 hover:border-emerald-400 hover:shadow'
            : 'bg-white border border-slate-200 hover:border-slate-400 hover:shadow'
        }
      `}
    >
      {/* Rank badge */}
      <span className={`
        w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
        ${isSelected ? 'bg-white text-slate-900' : isBest ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-600'}
      `}>
        {index + 1}
      </span>
      
      {/* Match ID (date) */}
      <span className="font-mono text-xs">
        {match.id}
      </span>
      
      {/* Similarity */}
      <span className={`font-semibold ${isSelected ? 'text-emerald-300' : isBest ? 'text-emerald-700' : 'text-emerald-600'}`}>
        {match.similarity?.toFixed(0)}%
      </span>
      
      {/* Phase tag */}
      <span className={`
        px-1.5 py-0.5 rounded text-xs font-medium
        ${isSelected ? 'bg-white/20 text-white' : `${phaseColor.bg} ${phaseColor.text}`}
      `}>
        {match.phase?.slice(0, 4)}
      </span>
      
      {/* Return */}
      <span className={`
        text-xs font-medium
        ${match.return >= 0 
          ? (isSelected ? 'text-green-300' : 'text-green-600') 
          : (isSelected ? 'text-red-300' : 'text-red-600')
        }
      `}>
        {match.return >= 0 ? '+' : ''}{match.return?.toFixed(1)}%
      </span>
      
      {/* BEST badge for top match (index 0) */}
      {isBest && !isSelected && (
        <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded shadow">
          BEST
        </span>
      )}
      
      {/* Selected indicator */}
      {isSelected && (
        <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded shadow">
          ACTIVE
        </span>
      )}
    </button>
  );
};

/**
 * Main Match Replay Picker Component
 */
export const SpxMatchReplayPicker = ({ 
  matches = [], 
  primaryMatchId,
  selectedIndex = 0,
  onSelectMatch,
  className = ''
}) => {
  const top5 = matches.slice(0, 5);
  
  if (top5.length === 0) {
    return (
      <div className={`bg-slate-50 rounded-lg p-3 ${className}`}>
        <div className="text-sm text-slate-400 text-center">No matches available</div>
      </div>
    );
  }
  
  return (
    <div className={`${className}`} data-testid="spx-match-replay-picker">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase">
          Top Matches
        </span>
        <span className="text-xs text-slate-400">
          (Click to replay)
        </span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {top5.map((match, i) => (
          <MatchChip
            key={match.id || i}
            match={match}
            index={i}
            isSelected={i === selectedIndex}
            isPrimary={match.id === primaryMatchId}
            isBest={i === 0}
            onClick={() => onSelectMatch(i, match)}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Compact version for header strip
 */
export const SpxMatchReplayChipsCompact = ({ 
  matches = [], 
  primaryMatchId,
  selectedIndex = 0,
  onSelectMatch 
}) => {
  const top3 = matches.slice(0, 3);
  
  return (
    <div className="flex items-center gap-1" data-testid="spx-match-chips-compact">
      {top3.map((match, i) => {
        const isSelected = i === selectedIndex;
        const isBest = i === 0; // First match is best
        
        return (
          <button
            key={match.id || i}
            onClick={() => onSelectMatch(i, match)}
            data-testid={`spx-chip-compact-${i}`}
            title={isBest ? "Best match (highest similarity)" : "Click to replay"}
            className={`
              px-2 py-1 rounded text-xs font-medium transition-all
              ${isSelected 
                ? 'bg-slate-800 text-white' 
                : isBest
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }
            `}
          >
            #{i + 1}
            {isBest && !isSelected && (
              <span className="ml-1 text-emerald-600">●</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default SpxMatchReplayPicker;
