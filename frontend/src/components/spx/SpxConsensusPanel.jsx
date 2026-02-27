/**
 * SPX CONSENSUS PANEL — Tier Weights + Votes Table
 * 
 * BLOCK B5.8 — Shows consensus breakdown
 */

import React from 'react';

const SpxConsensusPanel = ({ consensus, horizonStack }) => {
  if (!consensus && !horizonStack) {
    return null;
  }

  const votes = consensus?.votes || [];
  
  // Tier weights (from votes or defaults)
  const tierWeights = {
    STRUCTURE: 0,
    TACTICAL: 0,
    TIMING: 0,
  };
  
  for (const v of votes) {
    tierWeights[v.tier] = (tierWeights[v.tier] || 0) + v.weight;
  }
  
  const totalWeight = tierWeights.STRUCTURE + tierWeights.TACTICAL + tierWeights.TIMING || 1;

  const conflictColors = {
    LOW: 'text-emerald-400',
    MODERATE: 'text-yellow-400',
    HIGH: 'text-orange-400',
    CRITICAL: 'text-red-400',
  };

  return (
    <div 
      className="bg-slate-800/50 rounded-xl border border-slate-700 p-4"
      data-testid="spx-consensus-panel"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
          Consensus Breakdown
        </h3>
        {consensus?.conflictLevel && (
          <span className={`text-xs font-medium ${conflictColors[consensus.conflictLevel]}`}>
            {consensus.conflictLevel} CONFLICT
          </span>
        )}
      </div>

      {/* Tier Weight Bars */}
      <div className="space-y-2 mb-4">
        {Object.entries(tierWeights).map(([tier, weight]) => {
          const pct = (weight / totalWeight) * 100;
          const tierColors = {
            STRUCTURE: 'bg-purple-500',
            TACTICAL: 'bg-blue-500',
            TIMING: 'bg-emerald-500',
          };
          
          return (
            <div key={tier} className="flex items-center gap-3">
              <span className="text-xs text-slate-400 w-20">{tier}</span>
              <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${tierColors[tier]} transition-all duration-300`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-slate-300 w-12 text-right">
                {weight.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Votes Table */}
      {votes.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="text-left py-2 px-1">Horizon</th>
                <th className="text-left py-2 px-1">Dir</th>
                <th className="text-right py-2 px-1">Conf</th>
                <th className="text-center py-2 px-1">Div</th>
                <th className="text-center py-2 px-1">Guard</th>
                <th className="text-right py-2 px-1">Weight</th>
                <th className="text-right py-2 px-1">Score</th>
              </tr>
            </thead>
            <tbody>
              {votes.map((v, i) => (
                <tr 
                  key={v.horizon || i} 
                  className="border-b border-slate-700/50 hover:bg-slate-700/30"
                >
                  <td className="py-2 px-1 font-medium text-slate-200">
                    {v.horizon}
                  </td>
                  <td className={`py-2 px-1 font-medium ${
                    v.direction === 'BULL' ? 'text-emerald-400' :
                    v.direction === 'BEAR' ? 'text-red-400' : 'text-slate-400'
                  }`}>
                    {v.direction}
                  </td>
                  <td className="py-2 px-1 text-right text-slate-300">
                    {(v.confidence * 100).toFixed(0)}%
                  </td>
                  <td className="py-2 px-1 text-center">
                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                      v.divergenceGrade === 'A' ? 'bg-emerald-500/20 text-emerald-400' :
                      v.divergenceGrade === 'B' ? 'bg-blue-500/20 text-blue-400' :
                      v.divergenceGrade === 'C' ? 'bg-yellow-500/20 text-yellow-400' :
                      v.divergenceGrade === 'D' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {v.divergenceGrade}
                    </span>
                  </td>
                  <td className="py-2 px-1 text-center">
                    {v.guardrailStatus && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        v.guardrailStatus === 'ALLOW' ? 'bg-emerald-500/20 text-emerald-400' :
                        v.guardrailStatus === 'BLOCK' ? 'bg-red-500/20 text-red-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {v.guardrailStatus}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-1 text-right text-slate-300">
                    {v.weight?.toFixed(3)}
                  </td>
                  <td className={`py-2 px-1 text-right font-medium ${
                    v.voteScore > 0 ? 'text-emerald-400' :
                    v.voteScore < 0 ? 'text-red-400' : 'text-slate-400'
                  }`}>
                    {v.voteScore?.toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Blockers Warning */}
      {votes.some(v => v.blockers?.length > 0) && (
        <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded text-red-300 text-xs">
          ⚠ Some horizons have blockers
        </div>
      )}
    </div>
  );
};

export default SpxConsensusPanel;
