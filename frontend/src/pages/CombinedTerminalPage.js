/**
 * COMBINED TERMINAL PAGE — BTC × SPX Unified View
 * 
 * BLOCK C — Combined Terminal (Building)
 * 
 * LOCKED: Combined mode is locked until SPX finalization.
 * Shows lock screen when FEATURE_FLAGS.ENABLE_COMBINED = false
 * 
 * Architecture:
 * - Phase 1: INDEPENDENT VIEW (side-by-side terminals)
 * - Phase 2: MACRO-INTEGRATED (SPX influence toggle)
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FEATURE_FLAGS, PROJECT_STATE } from '../config/feature-flags';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// ═══════════════════════════════════════════════════════════════
// LOCK SCREEN — Shown when Combined Mode is LOCKED
// ═══════════════════════════════════════════════════════════════

const CombinedLockScreen = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center" data-testid="combined-locked">
      <div className="max-w-lg text-center px-6">
        <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-xl border border-slate-600">
          <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-3">Combined Mode Locked</h1>
        
        <p className="text-slate-400 text-lg mb-6">
          SPX must reach <span className="text-blue-400 font-semibold">FINAL</span> state before Combined integration.
        </p>
        
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 mb-6 text-left">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Current Project State
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Phase:</span>
              <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded font-medium">
                {PROJECT_STATE.phase}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Focus:</span>
              <span className="text-slate-300">{PROJECT_STATE.focus.join(', ')}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Frozen:</span>
              <span className="text-red-400">{PROJECT_STATE.frozen.join(', ')}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
          <div className="text-sm text-blue-400 font-medium">
            Next Milestone: {PROJECT_STATE.nextMilestone}
          </div>
        </div>
        
        <div className="flex gap-4 justify-center">
          <Link
            to="/bitcoin"
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Go to Bitcoin Terminal
          </Link>
          <Link
            to="/spx"
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Go to SPX Terminal
          </Link>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// VIEW MODE SELECTOR
// ═══════════════════════════════════════════════════════════════

const ViewModeSelector = ({ mode, onModeChange }) => {
  const modes = [
    { id: 'independent', label: 'Independent', desc: 'Side-by-side terminals', icon: '⬜⬜', available: true },
    { id: 'macro-integrated', label: 'Macro-Integrated', desc: 'SPX influence toggle', icon: '🔗', available: false },
  ];
  
  return (
    <div className="flex gap-2 p-1 bg-slate-800 rounded-lg" data-testid="view-mode-selector">
      {modes.map(m => (
        <button
          key={m.id}
          onClick={() => m.available && onModeChange(m.id)}
          disabled={!m.available}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
            mode === m.id ? 'bg-blue-600 text-white' : m.available ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-600 cursor-not-allowed'
          }`}
          data-testid={`view-mode-${m.id}`}
        >
          <span>{m.icon}</span>
          <div className="text-left">
            <div className="font-semibold">{m.label}</div>
            <div className="text-xs opacity-70">{m.desc}</div>
          </div>
          {!m.available && <span className="ml-2 px-1.5 py-0.5 bg-slate-700 text-slate-400 text-xs rounded">SOON</span>}
        </button>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TERMINAL PREVIEW CARD
// ═══════════════════════════════════════════════════════════════

const TerminalPreviewCard = ({ type, title, subtitle, icon, route, stats }) => {
  const gradients = { btc: 'from-orange-500 to-amber-600', spx: 'from-blue-500 to-purple-600' };
  
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden" data-testid={`terminal-preview-${type}`}>
      <div className={`bg-gradient-to-r ${gradients[type]} p-4`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <span className="text-sm text-white/80">{subtitle}</span>
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className={`text-lg font-bold ${stat.color || 'text-white'}`}>{stat.value}</div>
              <div className="text-xs text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>
        
        <Link to={route} className={`block w-full py-3 rounded-lg text-center font-medium transition-all bg-gradient-to-r ${gradients[type]} text-white hover:opacity-90`}>
          Open Terminal
        </Link>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMBINED TERMINAL PAGE
// ═══════════════════════════════════════════════════════════════

const CombinedTerminalPage = () => {
  const [viewMode, setViewMode] = useState('independent');
  
  // Check if Combined Mode is locked
  if (!FEATURE_FLAGS.ENABLE_COMBINED) {
    return <CombinedLockScreen />;
  }
  
  const btcStats = [
    { label: 'Consensus', value: '72', color: 'text-emerald-400' },
    { label: 'Phase', value: 'MARKUP', color: 'text-green-400' },
    { label: 'Action', value: 'BUY', color: 'text-emerald-400' },
  ];
  
  const spxStats = [
    { label: 'Consensus', value: '65', color: 'text-emerald-400' },
    { label: 'Phase', value: 'BULL_EXPANSION', color: 'text-emerald-400' },
    { label: 'Action', value: 'HOLD', color: 'text-slate-400' },
  ];
  
  return (
    <div className="min-h-screen bg-slate-900" data-testid="combined-terminal">
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 via-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  ⚡
                </span>
                <div>
                  <h1 className="text-xl font-bold text-white">Combined Terminal</h1>
                  <span className="text-xs text-slate-400">BTC × SPX · Unified Analysis</span>
                </div>
              </div>
            </div>
            
            <ViewModeSelector mode={viewMode} onModeChange={setViewMode} />
          </div>
        </div>
      </header>
      
      <div className="bg-slate-800/50 border-b border-slate-700/50 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3 text-sm">
          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded font-medium">BLOCK C</span>
          <span className="text-slate-400">
            Independent View: Each terminal operates autonomously. 
            Macro-Integrated mode with SPX influence toggle coming soon.
          </span>
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {viewMode === 'independent' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TerminalPreviewCard type="btc" title="Bitcoin Terminal" subtitle="BTC Fractal Analysis" icon="₿" route="/bitcoin" stats={btcStats} />
            <TerminalPreviewCard type="spx" title="SPX Terminal" subtitle="S&P 500 Fractal Analysis" icon="📊" route="/spx" stats={spxStats} />
          </div>
        )}
        
        {viewMode === 'macro-integrated' && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔗</div>
            <h2 className="text-2xl font-bold text-white mb-2">Macro-Integrated View</h2>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Cross-market influence analysis with SPX toggle. 
              This mode will enable correlation-aware decision making.
            </p>
            <span className="inline-block px-4 py-2 bg-slate-800 text-slate-400 rounded-lg">Coming in Block C.2</span>
          </div>
        )}
        
        <div className="mt-8 bg-slate-800/50 rounded-xl border border-slate-700 p-6">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Cross-Market Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-800 rounded-lg">
              <div className="text-xs text-slate-500 mb-1">BTC Direction</div>
              <div className="text-lg font-bold text-emerald-400">BULL</div>
            </div>
            <div className="p-4 bg-slate-800 rounded-lg">
              <div className="text-xs text-slate-500 mb-1">SPX Direction</div>
              <div className="text-lg font-bold text-emerald-400">BULL</div>
            </div>
            <div className="p-4 bg-slate-800 rounded-lg">
              <div className="text-xs text-slate-500 mb-1">Correlation</div>
              <div className="text-lg font-bold text-blue-400">0.72</div>
            </div>
            <div className="p-4 bg-slate-800 rounded-lg">
              <div className="text-xs text-slate-500 mb-1">Regime</div>
              <div className="text-lg font-bold text-purple-400">RISK-ON</div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
          <h4 className="text-sm font-semibold text-slate-300 mb-2">Architecture: Isolation First</h4>
          <p className="text-sm text-slate-400">
            SPX and BTC terminals are fully isolated products with independent logic, memory, and governance. 
            The Combined Terminal is a third product that <strong className="text-slate-300">observes</strong> both but does not merge their underlying systems.
          </p>
        </div>
      </main>
    </div>
  );
};

export default CombinedTerminalPage;
