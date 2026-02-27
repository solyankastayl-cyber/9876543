/**
 * SPX HEADER STRIP — Intelligence Summary
 * 
 * BLOCK B5.8 + B6.7 + B6.8.4 — Top bar showing Phase, Consensus, Action, Mode, Size, Lock, Guardrails
 * B6.8.4 additions: Phase Strength badge, Guardrail size cap, Consensus pulse mini-strip
 */

import React, { useEffect, useState } from 'react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// B6.8.4: Phase Strength Badge
const PhaseStrengthBadge = ({ phase, strength }) => {
  if (!phase) return null;
  
  // Calculate grade based on strength
  const grade = strength > 0.8 ? 'A' : strength > 0.6 ? 'B' : strength > 0.4 ? 'C' : strength > 0.2 ? 'D' : 'F';
  
  const gradeColors = {
    A: 'bg-emerald-500 text-white',
    B: 'bg-green-500 text-white',
    C: 'bg-yellow-500 text-slate-900',
    D: 'bg-orange-500 text-white',
    F: 'bg-red-500 text-white',
  };
  
  return (
    <div 
      className="flex items-center gap-1.5 px-2 py-1 bg-slate-800 rounded-lg"
      data-testid="spx-phase-strength"
      title={`Phase strength: ${(strength * 100).toFixed(0)}%`}
    >
      <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${gradeColors[grade]}`}>
        {grade}
      </span>
      <span className="text-slate-400 text-xs">
        {(strength * 100).toFixed(0)}%
      </span>
    </div>
  );
};

// B6.8.4: Consensus Pulse Mini Strip (7 days history)
const ConsensusPulseMini = ({ votes }) => {
  // Use last 7 votes or generate sample
  const pulseData = votes?.slice(-7) || [];
  
  if (pulseData.length === 0) return null;
  
  return (
    <div 
      className="flex items-center gap-0.5 px-2 py-1 bg-slate-800 rounded-lg"
      data-testid="spx-consensus-pulse-mini"
      title="7-day consensus history"
    >
      <span className="text-slate-500 text-[10px] mr-1">7d</span>
      {pulseData.map((v, i) => {
        const value = typeof v === 'object' ? v.score : v;
        const color = value > 0.6 ? 'bg-emerald-500' : value < 0.4 ? 'bg-red-500' : 'bg-yellow-500';
        return (
          <div 
            key={i} 
            className={`w-1.5 h-4 rounded-sm ${color}`}
            style={{ opacity: 0.5 + (i / pulseData.length) * 0.5 }}
          />
        );
      })}
    </div>
  );
};

// B6.8.4: Guardrail Badge with Size Cap
const GuardrailBadge = ({ guardrails }) => {
  if (!guardrails) return null;
  
  const statusColors = {
    ALLOW: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400',
    BLOCK: 'bg-red-500/20 border-red-500/50 text-red-400',
    CAUTION: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
  };
  
  const sizeCap = guardrails.sizeCap || guardrails.sizeCapPct || null;
  
  return (
    <div 
      className={`flex items-center gap-2 px-2 py-1 rounded border text-xs font-bold ${statusColors[guardrails.globalStatus] || statusColors.CAUTION}`}
      data-testid="spx-guardrails-badge"
    >
      <span>{guardrails.globalStatus}</span>
      {sizeCap && sizeCap < 100 && (
        <span className="px-1 py-0.5 bg-slate-800 rounded text-[10px] text-slate-300">
          Cap: {sizeCap}%
        </span>
      )}
      {guardrails.edgeUnlocked && guardrails.edgeUnlocked !== 'NONE' && (
        <span className="text-emerald-300">●</span>
      )}
    </div>
  );
};

const SpxHeaderStrip = ({ pack, consensus }) => {
  const [guardrails, setGuardrails] = useState(null);
  
  // Fetch guardrails summary
  useEffect(() => {
    fetch(`${API_BASE}/api/spx/v2.1/guardrails/summary`)
      .then(res => res.json())
      .then(json => {
        if (json.ok) setGuardrails(json.data);
      })
      .catch(err => console.error('[SpxHeaderStrip] Guardrails fetch error:', err));
  }, []);
  
  if (!pack && !consensus) {
    return (
      <div className="bg-slate-900 border-b border-slate-700 px-4 py-3">
        <span className="text-slate-400 text-sm">Loading intelligence...</span>
      </div>
    );
  }

  const phase = pack?.phase?.phase || pack?.phaseIdAtNow?.phase || 'N/A';
  const phaseStrength = pack?.phase?.strength || pack?.phaseIdAtNow?.strength || 0.5;
  const currentFlags = pack?.phase?.flags || pack?.currentFlags || [];
  
  // Consensus data (from consensus prop or derived from pack)
  const consensusIndex = consensus?.consensusIndex || Math.round((pack?.overlay?.stats?.hitRate || 0.5) * 100);
  const direction = consensus?.direction || (pack?.overlay?.stats?.medianReturn > 0 ? 'BULL' : pack?.overlay?.stats?.medianReturn < 0 ? 'BEAR' : 'NEUTRAL');
  const action = consensus?.resolved?.action || 'HOLD';
  const mode = consensus?.resolved?.mode || 'NO_TRADE';
  const sizeMultiplier = consensus?.resolved?.sizeMultiplier || 1.0;
  const structuralLock = consensus?.structuralLock || false;
  const consensusVotes = consensus?.votes || [];  // B6.8.4

  // Arrow based on consensus
  const arrow = consensusIndex > 60 ? '↑' : consensusIndex < 40 ? '↓' : '→';

  // Color mappings
  const phaseColors = {
    BULL_EXPANSION: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    BULL_COOLDOWN: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    BEAR_DRAWDOWN: 'bg-red-500/20 text-red-400 border-red-500/30',
    BEAR_RALLY: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    SIDEWAYS_RANGE: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };

  const actionColors = {
    BUY: 'text-emerald-400',
    SELL: 'text-red-400',
    HOLD: 'text-slate-400',
    NO_TRADE: 'text-slate-500',
  };

  const modeColors = {
    TREND_FOLLOW: 'text-blue-400',
    COUNTER_TREND: 'text-orange-400',
    NO_TRADE: 'text-slate-500',
  };

  return (
    <div 
      className="bg-slate-900 border-b border-slate-700 px-4 py-3 flex items-center gap-6 flex-wrap"
      data-testid="spx-header-strip"
    >
      {/* Phase Badge */}
      <div 
        className={`px-3 py-1.5 rounded-lg border ${phaseColors[phase] || phaseColors.SIDEWAYS_RANGE}`}
        data-testid="spx-phase-badge"
      >
        <span className="text-xs font-semibold uppercase tracking-wide">{phase.replace(/_/g, ' ')}</span>
      </div>
      
      {/* B6.8.4: Phase Strength Badge */}
      <PhaseStrengthBadge phase={phase} strength={phaseStrength} />

      {/* VOL_SHOCK Flag */}
      {currentFlags.includes('VOL_SHOCK') && (
        <div className="px-2 py-1 bg-red-500/30 border border-red-500/50 rounded text-red-300 text-xs font-bold animate-pulse">
          ⚡ VOL_SHOCK
        </div>
      )}
      
      {/* B6.7 Guardrails Status - Enhanced with B6.8.4 */}
      {guardrails && (
        <GuardrailBadge guardrails={guardrails} />
      )}

      {/* B6.8.4: Consensus Pulse Mini (7d) */}
      {consensusVotes.length > 0 && (
        <ConsensusPulseMini votes={consensusVotes} />
      )}

      {/* Consensus Index */}
      <div className="flex items-center gap-2" data-testid="spx-consensus">
        <span className="text-slate-400 text-sm">Consensus</span>
        <span className={`text-lg font-bold ${
          consensusIndex > 60 ? 'text-emerald-400' : 
          consensusIndex < 40 ? 'text-red-400' : 'text-slate-300'
        }`}>
          {consensusIndex} {arrow}
        </span>
      </div>

      {/* Action */}
      <div className="flex items-center gap-2" data-testid="spx-action">
        <span className="text-slate-400 text-sm">Action</span>
        <span className={`text-lg font-bold ${actionColors[action]}`}>
          {action}
        </span>
      </div>

      {/* Mode */}
      <div className="flex items-center gap-2" data-testid="spx-mode">
        <span className="text-slate-400 text-sm">Mode</span>
        <span className={`text-sm font-medium ${modeColors[mode]}`}>
          {mode.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Size Multiplier */}
      <div className="flex items-center gap-2" data-testid="spx-size">
        <span className="text-slate-400 text-sm">Size</span>
        <span className={`text-sm font-bold ${
          sizeMultiplier >= 1 ? 'text-emerald-400' : 
          sizeMultiplier >= 0.7 ? 'text-yellow-400' : 'text-red-400'
        }`}>
          {sizeMultiplier.toFixed(2)}x
        </span>
      </div>

      {/* Structural Lock */}
      {structuralLock && (
        <div 
          className="px-2 py-1 bg-amber-500/20 border border-amber-500/50 rounded text-amber-400 text-xs font-bold"
          data-testid="spx-structural-lock"
        >
          STRUCTURAL LOCK
        </div>
      )}
    </div>
  );
};

export default SpxHeaderStrip;
