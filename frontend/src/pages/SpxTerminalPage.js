/**
 * SPX FRACTAL TERMINAL — S&P 500 Fractal Analysis
 * 
 * BLOCK B5.3 + B5.8 — Multi-Horizon SPX Engine + UI Polish
 * 
 * Production-grade SPX terminal with:
 * - All horizons: 7d, 14d, 30d, 90d, 180d, 365d
 * - SPX-native phase detection (B5.4)
 * - Consensus engine integration (B5.5)
 * - Header Intelligence Strip
 * - Independent from BTC logic
 */

import React, { useState, useEffect, useCallback } from 'react';
import SpxHeaderStrip from '../components/spx/SpxHeaderStrip';
import SpxConsensusPanel from '../components/spx/SpxConsensusPanel';
import SpxShortOutlook from '../components/spx/SpxShortOutlook';
import { SpxMatchReplayPicker } from '../components/spx/SpxMatchReplayPicker';
import { SpxDivergenceBadge, SpxDivergenceInline } from '../components/spx/SpxDivergenceBadge';
import { SpxPhaseHeatmap, SpxPhaseHeatmapMini } from '../components/spx/SpxPhaseHeatmap';
import SpxStrategyPanel from '../components/spx/SpxStrategyPanel';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// ═══════════════════════════════════════════════════════════════
// SPX HORIZON CONFIG (mirrors backend)
// ═══════════════════════════════════════════════════════════════

const SPX_HORIZONS = [
  { key: '7d', label: '7D', tier: 'TIMING', days: 7, description: 'Ultra-short term' },
  { key: '14d', label: '14D', tier: 'TIMING', days: 14, description: 'Short term' },
  { key: '30d', label: '30D', tier: 'TACTICAL', days: 30, description: 'Monthly tactical' },
  { key: '90d', label: '90D', tier: 'TACTICAL', days: 90, description: 'Quarterly' },
  { key: '180d', label: '180D', tier: 'STRUCTURE', days: 180, description: 'Semi-annual' },
  { key: '365d', label: '365D', tier: 'STRUCTURE', days: 365, description: 'Annual cycle' },
];

const TIER_COLORS = {
  TIMING: { bg: 'bg-emerald-500', text: 'text-emerald-500', light: 'bg-emerald-500/10' },
  TACTICAL: { bg: 'bg-blue-500', text: 'text-blue-500', light: 'bg-blue-500/10' },
  STRUCTURE: { bg: 'bg-purple-500', text: 'text-purple-500', light: 'bg-purple-500/10' },
};

// ═══════════════════════════════════════════════════════════════
// HORIZON SELECTOR (Grouped by Tier)
// ═══════════════════════════════════════════════════════════════

const SpxHorizonSelector = ({ focus, onFocusChange, loading }) => {
  const tiers = [
    { name: 'TIMING', horizons: SPX_HORIZONS.filter(h => h.tier === 'TIMING') },
    { name: 'TACTICAL', horizons: SPX_HORIZONS.filter(h => h.tier === 'TACTICAL') },
    { name: 'STRUCTURE', horizons: SPX_HORIZONS.filter(h => h.tier === 'STRUCTURE') },
  ];

  return (
    <div className="flex flex-wrap items-center gap-4" data-testid="spx-horizon-selector">
      {tiers.map(tier => {
        const tierColor = TIER_COLORS[tier.name];
        return (
          <div key={tier.name} className="flex items-center gap-1">
            <span className={`text-xs font-medium ${tierColor.text} mr-1`}>
              {tier.name}
            </span>
            <div className={`flex gap-1 p-1 rounded-lg ${tierColor.light}`}>
              {tier.horizons.map(h => {
                const isActive = focus === h.key;
                return (
                  <button
                    key={h.key}
                    onClick={() => onFocusChange(h.key)}
                    disabled={loading}
                    className={`
                      px-3 py-1.5 rounded-md text-sm font-medium transition-all
                      ${isActive 
                        ? `${tierColor.bg} text-white shadow-sm` 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                      }
                      ${loading ? 'opacity-50 cursor-wait' : ''}
                    `}
                    data-testid={`spx-horizon-${h.key}`}
                  >
                    {h.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TACTICAL VIEW (Header info)
// ═══════════════════════════════════════════════════════════════

const TacticalView = ({ meta, overlay }) => {
  if (!meta) return null;
  
  const tierColor = TIER_COLORS[meta.tier];
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${tierColor.light}`}>
      <span className={`w-2 h-2 rounded-full ${tierColor.bg}`}></span>
      <span className={`text-sm font-medium ${tierColor.text}`}>
        {meta.tier === 'TIMING' ? 'Tactical View' : meta.tier === 'TACTICAL' ? 'Tactical View' : 'Structure View'}
      </span>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// FOCUS INFO PANEL
// ═══════════════════════════════════════════════════════════════

const SpxFocusInfoPanel = ({ meta, diagnostics, overlay }) => {
  if (!meta) return null;
  
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 bg-slate-50 rounded-lg px-4 py-2">
      <span className="flex items-center gap-1">
        <span className="text-slate-400">Focus:</span>
        <span className="font-semibold text-slate-800">{meta.focus}</span>
        <TacticalView meta={meta} />
      </span>
      <span>
        <span className="text-slate-400">Window:</span>
        <span className="font-medium ml-1">{meta.windowLen}d</span>
      </span>
      <span>
        <span className="text-slate-400">Aftermath:</span>
        <span className="font-medium ml-1">{meta.aftermathDays}d</span>
      </span>
      {overlay?.matches && (
        <span>
          <span className="text-slate-400">Matches:</span>
          <span className="font-medium ml-1">{overlay.matches.length}</span>
        </span>
      )}
      {diagnostics && (
        <>
          <span>
            <span className="text-slate-400">Coverage:</span>
            <span className="font-medium ml-1">{diagnostics.coverageYears?.toFixed(1)}y</span>
          </span>
          <span>
            <span className="text-slate-400">Quality:</span>
            <span className={`font-medium ml-1 ${
              diagnostics.qualityScore > 0.7 ? 'text-green-600' : 
              diagnostics.qualityScore > 0.4 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {(diagnostics.qualityScore * 100).toFixed(0)}%
            </span>
          </span>
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// PRICE HEADER
// ═══════════════════════════════════════════════════════════════

const SpxPriceHeader = ({ price, phase }) => {
  if (!price) return null;
  
  const phaseColors = {
    ACCUMULATION: 'bg-emerald-100 text-emerald-700',
    MARKUP: 'bg-green-100 text-green-700',
    DISTRIBUTION: 'bg-orange-100 text-orange-700',
    MARKDOWN: 'bg-red-100 text-red-700',
    NEUTRAL: 'bg-slate-100 text-slate-600',
  };
  
  return (
    <div className="flex items-center gap-6">
      <div>
        <div className="text-3xl font-bold text-slate-900">
          {price.current?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-sm font-medium ${price.change1d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {price.change1d >= 0 ? '+' : ''}{price.change1d?.toFixed(2)}%
          </span>
          <span className="text-xs text-slate-400">1D</span>
          <span className={`text-sm font-medium ${price.change7d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {price.change7d >= 0 ? '+' : ''}{price.change7d?.toFixed(2)}%
          </span>
          <span className="text-xs text-slate-400">7D</span>
          <span className={`text-sm font-medium ${price.change30d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {price.change30d >= 0 ? '+' : ''}{price.change30d?.toFixed(2)}%
          </span>
          <span className="text-xs text-slate-400">30D</span>
        </div>
      </div>
      
      {phase && (
        <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${phaseColors[phase.phase] || phaseColors.NEUTRAL}`}>
          {phase.phase}
          <span className="ml-2 opacity-75">{(phase.strength * 100).toFixed(0)}%</span>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// EXPECTED OUTCOME PANEL
// ═══════════════════════════════════════════════════════════════

const ExpectedOutcomePanel = ({ overlay, meta }) => {
  if (!overlay?.stats || !meta) return null;
  
  const { stats } = overlay;
  
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4" data-testid="spx-expected-outcome">
      <div className="text-xs font-semibold text-slate-500 uppercase mb-3">
        Expected Outcome ({meta.aftermathDays}D)
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-xs text-slate-400">P10 (Worst)</div>
          <div className={`text-lg font-bold ${stats.p10Return < 0 ? 'text-red-600' : 'text-green-600'}`}>
            {(stats.p10Return * 100).toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400">P50 (Median)</div>
          <div className={`text-lg font-bold ${stats.medianReturn < 0 ? 'text-red-600' : 'text-green-600'}`}>
            {(stats.medianReturn * 100).toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400">P90 (Best)</div>
          <div className={`text-lg font-bold ${stats.p90Return < 0 ? 'text-red-600' : 'text-green-600'}`}>
            {(stats.p90Return * 100).toFixed(1)}%
          </div>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-slate-400">Checkpoints</div>
          <div className="flex gap-2 mt-1">
            <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">7d: 0.6%</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">14d: 0.9%</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">30t: 4.8%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// DISTRIBUTION STATS
// ═══════════════════════════════════════════════════════════════

const DistributionStatsPanel = ({ overlay }) => {
  if (!overlay?.stats) return null;
  
  const { stats } = overlay;
  
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4" data-testid="spx-distribution-stats">
      <div className="text-xs font-semibold text-slate-500 uppercase mb-3">
        Distribution Stats
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-slate-400">Hit Rate</div>
          <div className={`text-lg font-bold ${stats.hitRate > 0.5 ? 'text-green-600' : 'text-red-600'}`}>
            {(stats.hitRate * 100).toFixed(0)}%
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Avg Max DD</div>
          <div className="text-lg font-bold text-red-600">
            -{Math.abs(stats.avgMaxDD).toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400">P10 Return</div>
          <div className={`text-lg font-bold ${stats.p10Return > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {(stats.p10Return * 100).toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400">P90 Return</div>
          <div className={`text-lg font-bold ${stats.p90Return > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {(stats.p90Return * 100).toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MATCHES LIST
// ═══════════════════════════════════════════════════════════════

const SpxMatchesList = ({ matches, primarySelection, selectedIndex = 0, onMatchClick }) => {
  if (!matches || matches.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="text-sm text-slate-400 text-center">No matches found</div>
      </div>
    );
  }
  
  const primaryId = primarySelection?.primaryMatch?.id;
  
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4" data-testid="spx-matches-list">
      <div className="text-xs font-semibold text-slate-500 uppercase mb-3">
        All Matches ({matches.length})
      </div>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {matches.slice(0, 10).map((m, i) => {
          const isPrimary = m.id === primaryId;
          const isSelected = i === selectedIndex;
          
          return (
            <div 
              key={m.id || i}
              onClick={() => onMatchClick?.(i, m)}
              className={`flex items-center justify-between p-2 rounded transition-colors cursor-pointer ${
                isSelected 
                  ? 'bg-slate-900 text-white' 
                  : isPrimary 
                    ? 'bg-blue-50 border border-blue-200 hover:bg-blue-100' 
                    : 'bg-slate-50 hover:bg-slate-100'
              }`}
              data-testid={`spx-match-${i}`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-xs font-mono ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>#{i + 1}</span>
                <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-700'}`}>{m.id}</span>
                {isPrimary && !isSelected && (
                  <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                    AUTO
                  </span>
                )}
                {isSelected && (
                  <span className="text-xs px-1.5 py-0.5 bg-emerald-500 text-white rounded">
                    ACTIVE
                  </span>
                )}
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  isSelected ? 'bg-white/20 text-white' :
                  m.phase === 'MARKUP' ? 'bg-green-100 text-green-700' :
                  m.phase === 'MARKDOWN' ? 'bg-red-100 text-red-700' :
                  m.phase === 'ACCUMULATION' ? 'bg-emerald-100 text-emerald-700' :
                  m.phase === 'DISTRIBUTION' ? 'bg-orange-100 text-orange-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {m.phase}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className={isSelected ? 'text-slate-300' : 'text-slate-400'}>
                  Sim: <span className={`font-medium ${isSelected ? 'text-white' : 'text-slate-600'}`}>{m.similarity?.toFixed(0)}%</span>
                </span>
                <span className={`font-medium ${
                  isSelected 
                    ? (m.return > 0 ? 'text-green-300' : 'text-red-300')
                    : (m.return > 0 ? 'text-green-600' : 'text-red-600')
                }`}>
                  {m.return > 0 ? '+' : ''}{m.return?.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// DIVERGENCE CARD
// ═══════════════════════════════════════════════════════════════

const DivergenceCard = ({ divergence, selectedMatch }) => {
  if (!divergence) return null;
  
  const gradeColors = {
    A: 'bg-emerald-100 text-emerald-700',
    B: 'bg-green-100 text-green-700',
    C: 'bg-yellow-100 text-yellow-700',
    D: 'bg-orange-100 text-orange-700',
    F: 'bg-red-100 text-red-700',
  };
  
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4" data-testid="spx-divergence">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-xs font-semibold text-slate-500 uppercase">
            Divergence Analysis
          </div>
          {selectedMatch && (
            <span className="text-xs text-slate-400">
              vs <span className="font-mono font-medium text-slate-600">{selectedMatch.id}</span>
            </span>
          )}
        </div>
        <span className={`px-2 py-1 rounded text-sm font-bold ${gradeColors[divergence.grade]}`}>
          {divergence.grade} ({divergence.score})
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-slate-400">RMSE:</span>
          <span className="ml-1 font-medium">{divergence.rmse?.toFixed(2)}%</span>
        </div>
        <div>
          <span className="text-slate-400">Correlation:</span>
          <span className="ml-1 font-medium">{divergence.corr?.toFixed(3)}</span>
        </div>
        <div>
          <span className="text-slate-400">Terminal Delta:</span>
          <span className={`ml-1 font-medium ${Math.abs(divergence.terminalDelta) > 10 ? 'text-red-600' : ''}`}>
            {divergence.terminalDelta?.toFixed(2)}%
          </span>
        </div>
        <div>
          <span className="text-slate-400">Dir Mismatch:</span>
          <span className={`ml-1 font-medium ${divergence.directionalMismatch > 40 ? 'text-red-600' : ''}`}>
            {divergence.directionalMismatch?.toFixed(0)}%
          </span>
        </div>
      </div>
      
      {divergence.flags?.length > 0 && (
        <div className="mt-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap gap-1">
            {divergence.flags.map((flag, i) => (
              <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                {flag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// LOADING SKELETON
// ═══════════════════════════════════════════════════════════════

const LoadingSkeleton = () => (
  <div className="animate-pulse" data-testid="spx-loading">
    <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"/>
    <div className="h-96 bg-slate-200 rounded mb-4"/>
    <div className="grid grid-cols-3 gap-4">
      <div className="h-32 bg-slate-200 rounded"/>
      <div className="h-32 bg-slate-200 rounded"/>
      <div className="h-32 bg-slate-200 rounded"/>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// MAIN SPX TERMINAL PAGE
// ═══════════════════════════════════════════════════════════════

const SpxTerminalPage = () => {
  const [focus, setFocus] = useState('30d');
  const [focusData, setFocusData] = useState(null);
  const [phaseData, setPhaseData] = useState(null);
  const [consensusData, setConsensusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // B6.8.1: Selected match index for replay
  const [selectedMatchIndex, setSelectedMatchIndex] = useState(0);
  const [activeDivergence, setActiveDivergence] = useState(null);
  
  // Fetch focus pack, phase, and consensus data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [focusRes, phaseRes, consensusRes] = await Promise.all([
        fetch(`${API_BASE}/api/spx/v2.1/focus-pack?focus=${focus}`),
        fetch(`${API_BASE}/api/spx/v2.1/phases`),
        fetch(`${API_BASE}/api/spx/v2.1/consensus`),
      ]);
      
      const focusJson = await focusRes.json();
      const phaseJson = await phaseRes.json();
      const consensusJson = await consensusRes.json();
      
      if (!focusJson.ok) {
        throw new Error(focusJson.error || 'Failed to fetch SPX data');
      }
      
      setFocusData(focusJson.data);
      if (phaseJson.ok) {
        setPhaseData(phaseJson.data);
      }
      if (consensusJson.ok) {
        setConsensusData(consensusJson.data);
      }
    } catch (err) {
      console.error('[SPX Terminal] Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [focus]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // B6.8.1: Reset selected match when focus changes
  useEffect(() => {
    setSelectedMatchIndex(0);
    setActiveDivergence(null);
  }, [focus]);
  
  // B6.8.1: Update active divergence when match selection changes
  useEffect(() => {
    if (focusData?.divergence) {
      // For now, use base divergence - could compute per-match divergence
      setActiveDivergence(focusData.divergence);
    }
  }, [focusData?.divergence, selectedMatchIndex]);
  
  // B6.8.1: Handle match selection
  const handleMatchSelect = useCallback((index, match) => {
    setSelectedMatchIndex(index);
    // In future: fetch divergence for specific match
    console.log('[SPX Terminal] Selected match:', match?.id);
  }, []);
  
  // B6.8.3: Handle phase filter
  const handlePhaseFilter = useCallback((phaseName) => {
    console.log('[SPX Terminal] Filter by phase:', phaseName);
    // Could filter matches by phase
  }, []);
  
  const meta = focusData?.meta;
  const price = focusData?.price;
  const overlay = focusData?.overlay;
  const primarySelection = focusData?.primarySelection;
  const divergence = focusData?.divergence;
  const diagnostics = focusData?.diagnostics;
  
  // Combine phase data
  const phase = phaseData?.phaseIdAtNow || focusData?.phase;
  const currentFlags = phaseData?.currentFlags || [];
  
  // Use real consensus data or build from focus data
  const consensus = consensusData || {
    consensusIndex: Math.round((overlay?.stats?.hitRate || 0.5) * 100),
    direction: overlay?.stats?.medianReturn > 0 ? 'BULL' : overlay?.stats?.medianReturn < 0 ? 'BEAR' : 'NEUTRAL',
    structuralLock: false,
    conflictLevel: 'LOW',
    resolved: {
      action: overlay?.stats?.hitRate > 0.55 && overlay?.stats?.medianReturn > 0 ? 'BUY' : 'HOLD',
      mode: 'TREND_FOLLOW',
      sizeMultiplier: divergence?.grade === 'A' ? 1.05 : divergence?.grade === 'B' ? 1.0 : 0.85,
    },
    votes: [],
  };
  
  return (
    <div className="min-h-screen bg-slate-900" data-testid="spx-terminal">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  SPX
                </span>
                <div>
                  <h1 className="text-xl font-bold text-white">SPX Fractal Terminal</h1>
                  <span className="text-xs text-slate-400">S&P 500 · Institutional Grade</span>
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-500">
              v2.1 · BLOCK B5.8 · Production
            </div>
          </div>
        </div>
      </header>
      
      {/* Intelligence Header Strip (B5.8) */}
      <SpxHeaderStrip 
        pack={{ ...focusData, phase, currentFlags }} 
        consensus={consensus} 
      />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Price Header */}
        {!loading && price && (
          <div className="mb-6">
            <SpxPriceHeader price={price} phase={phase} />
          </div>
        )}
        
        {/* Horizon Selector */}
        <div className="mb-6">
          <SpxHorizonSelector 
            focus={focus}
            onFocusChange={setFocus}
            loading={loading}
          />
        </div>
        
        {/* Focus Info Panel */}
        {meta && (
          <div className="mb-4">
            <SpxFocusInfoPanel meta={meta} diagnostics={diagnostics} overlay={overlay} />
          </div>
        )}
        
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <div className="font-medium">Error loading SPX data</div>
            <div className="text-sm mt-1">{error}</div>
            <button 
              onClick={fetchData}
              className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm"
            >
              Retry
            </button>
          </div>
        )}
        
        {/* Main Chart Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-slate-800">Research Canvas</h2>
              {/* B6.8.2: Divergence Badge */}
              {activeDivergence && (
                <SpxDivergenceBadge divergence={activeDivergence} size="md" />
              )}
            </div>
            {primarySelection?.primaryMatch && (
              <div className="text-sm text-slate-500">
                Active: <span className="font-medium text-slate-700">
                  {overlay?.matches?.[selectedMatchIndex]?.id || primarySelection.primaryMatch.id}
                </span>
                {selectedMatchIndex === 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                    AUTO
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* B6.8.1: Match Replay Picker */}
          {!loading && overlay?.matches && (
            <div className="mb-4">
              <SpxMatchReplayPicker
                matches={overlay.matches}
                primaryMatchId={primarySelection?.primaryMatch?.id}
                selectedIndex={selectedMatchIndex}
                onSelectMatch={handleMatchSelect}
              />
            </div>
          )}
          
          {/* Chart Placeholder - Will be replaced with actual chart */}
          <div className="min-h-[450px] bg-slate-100 rounded-lg flex items-center justify-center">
            {loading ? (
              <LoadingSkeleton />
            ) : (
              <div className="text-center text-slate-500">
                <div className="text-lg font-medium mb-2">SPX Chart ({focus})</div>
                <div className="text-sm">
                  Replaying: <span className="font-mono font-medium">
                    {overlay?.matches?.[selectedMatchIndex]?.id || 'N/A'}
                  </span>
                </div>
                <div className="text-sm mt-1">
                  {overlay?.matches?.length || 0} matches found
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  Window: {meta?.windowLen}d | Aftermath: {meta?.aftermathDays}d
                </div>
                {overlay?.matches?.[selectedMatchIndex] && (
                  <div className="mt-3 flex items-center justify-center gap-3 text-xs">
                    <span className={`px-2 py-1 rounded ${
                      overlay.matches[selectedMatchIndex].phase === 'MARKUP' ? 'bg-green-100 text-green-700' :
                      overlay.matches[selectedMatchIndex].phase === 'MARKDOWN' ? 'bg-red-100 text-red-700' :
                      'bg-slate-200 text-slate-600'
                    }`}>
                      {overlay.matches[selectedMatchIndex].phase}
                    </span>
                    <span>
                      Similarity: {overlay.matches[selectedMatchIndex].similarity?.toFixed(0)}%
                    </span>
                    <span className={overlay.matches[selectedMatchIndex].return >= 0 ? 'text-green-600' : 'text-red-600'}>
                      Return: {overlay.matches[selectedMatchIndex].return >= 0 ? '+' : ''}
                      {overlay.matches[selectedMatchIndex].return?.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* SPX Strategy Engine v1 */}
        {!loading && (
          <div className="mb-6">
            <SpxStrategyPanel 
              externalHorizon={focus}
              onHorizonChange={setFocus}
            />
          </div>
        )}
        
        {/* Data Panels */}
        {!loading && focusData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <ExpectedOutcomePanel overlay={overlay} meta={meta} />
            <DistributionStatsPanel overlay={overlay} />
            <SpxMatchesList 
              matches={overlay?.matches} 
              primarySelection={primarySelection}
              selectedIndex={selectedMatchIndex}
              onMatchClick={handleMatchSelect}
            />
          </div>
        )}
        
        {/* B6.8.3: Phase Performance Heatmap */}
        {!loading && overlay?.matches && (
          <div className="mb-6">
            <SpxPhaseHeatmap 
              focus={focus}
              matches={overlay.matches}
              onPhaseFilter={handlePhaseFilter}
            />
          </div>
        )}
        
        {/* Consensus & Short Outlook Panels (B5.8) */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <SpxConsensusPanel 
              consensus={consensus} 
              horizonStack={consensusData?.votes || []} 
            />
            <SpxShortOutlook 
              pack={{ ...focusData, meta, focus }} 
              consensus={consensus} 
            />
          </div>
        )}
        
        {/* Divergence Analysis - Enhanced with B6.8.2 */}
        {!loading && activeDivergence && (
          <div className="mb-6">
            <DivergenceCard 
              divergence={activeDivergence} 
              selectedMatch={overlay?.matches?.[selectedMatchIndex]}
            />
          </div>
        )}
        
        {/* All Horizons Quick View */}
        {!loading && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-500 uppercase mb-4">All Horizons</h3>
            <div className="grid grid-cols-6 gap-4">
              {SPX_HORIZONS.map(h => {
                const isActive = focus === h.key;
                const tierColor = TIER_COLORS[h.tier];
                
                return (
                  <button
                    key={h.key}
                    onClick={() => setFocus(h.key)}
                    className={`p-4 rounded-lg border transition-all ${
                      isActive 
                        ? `${tierColor.light} border-current ${tierColor.text}` 
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`text-lg font-bold ${isActive ? tierColor.text : 'text-slate-700'}`}>
                      {h.label}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{h.description}</div>
                    <div className={`text-xs mt-2 font-medium ${tierColor.text}`}>
                      {h.tier}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SpxTerminalPage;
