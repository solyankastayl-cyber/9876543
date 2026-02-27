/**
 * FRACTAL RESEARCH TERMINAL v7
 * ARCHITECTURAL REBUILD — DXY Blueprint
 * 
 * Structure:
 * [ Header ]
 * [ Control Row: Status | Mode | Horizon ]
 * [ FORECAST CORE: Chart 70% | Summary 30% ]
 * [ FRACTAL ENGINE BREAKDOWN ]
 * [ MACRO LAYER ]
 * [ OUTCOMES + RISK ]
 * [ FRACTAL ANALYSIS + MATCHES ]
 * [ MARKET STRUCTURE ]
 */

import React, { useState, useEffect } from 'react';
import { FractalMainChart } from '../components/fractal/chart/FractalMainChart';
import { FractalOverlaySection } from '../components/fractal/sections/FractalOverlaySection';
import { FractalHybridChart } from '../components/fractal/chart/FractalHybridChart';
import { StrategyControlPanel } from '../components/fractal/sections/StrategyControlPanel';
import { StrategySummary } from '../components/fractal/sections/StrategySummary';
import { ForwardPerformanceCompact } from '../components/fractal/sections/ForwardPerformanceCompact';
import { VolatilityCard } from '../components/fractal/VolatilityCard';
import { SizingBreakdown } from '../components/fractal/SizingBreakdown';
import { ConsensusPanel } from '../components/fractal/ConsensusPanel';
import { SystemStatusPanel } from '../components/fractal/SystemStatusPanel';
import { UnifiedControlRow } from '../components/fractal/UnifiedControlRow';
import { MarketPhaseEngine } from '../components/fractal/MarketPhaseEngine';
import { FractalAnalysisPanel } from '../components/fractal/FractalAnalysisPanel';
import { PhaseStrengthBadge } from '../components/fractal/PhaseStrengthBadge';
import { AsOfDatePicker } from '../components/fractal/AsOfDatePicker';
import { ScenarioBox } from '../components/fractal/ScenarioBox';
import { RiskBox } from '../components/fractal/RiskBox';
import MacroPanel from '../components/fractal/MacroPanel';
import FractalEngineBreakdown from '../components/fractal/FractalEngineBreakdown';
import MacroLayerPanel from '../components/fractal/MacroLayerPanel';
import OutcomesRiskPanel from '../components/fractal/OutcomesRiskPanel';
import { useFocusPack, HORIZONS, getTierColor, getTierLabel } from '../hooks/useFocusPack';
import { useConsensusPulse } from '../hooks/useConsensusPulse';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// ═══════════════════════════════════════════════════════════════
// CHART MODE SWITCHER (3 MODES: Price / Replay / Hybrid)
// ═══════════════════════════════════════════════════════════════

const ChartModeSwitcher = ({ mode, onModeChange }) => {
  const modes = [
    { id: 'price', label: 'Price', desc: 'Synthetic Model' },
    { id: 'replay', label: 'Replay', desc: 'Historical' },
    { id: 'hybrid', label: 'Hybrid', desc: 'Dual View' },
  ];
  
  return (
    <div className="flex gap-1 p-1 bg-slate-100 rounded-lg" data-testid="chart-mode-switcher">
      {modes.map(m => (
        <button
          key={m.id}
          onClick={() => onModeChange(m.id)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex flex-col items-center ${
            mode === m.id
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
          data-testid={`mode-${m.id}`}
        >
          <span className="font-semibold">{m.label}</span>
          <span className="text-[10px] text-slate-400">{m.desc}</span>
        </button>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// FOCUS-AWARE FORECAST DISPLAY
// ═══════════════════════════════════════════════════════════════

const ForecastSummary = ({ forecast, meta }) => {
  if (!forecast || !meta) return null;
  
  const { path, upperBand, lowerBand, markers, currentPrice } = forecast;
  const lastIdx = path.length - 1;
  
  // Calculate expected returns
  const p50Return = lastIdx >= 0 && currentPrice 
    ? ((path[lastIdx] - currentPrice) / currentPrice * 100).toFixed(1)
    : '—';
  const p90Return = lastIdx >= 0 && upperBand[lastIdx] && currentPrice
    ? ((upperBand[lastIdx] - currentPrice) / currentPrice * 100).toFixed(1)
    : '—';
  const p10Return = lastIdx >= 0 && lowerBand[lastIdx] && currentPrice
    ? ((lowerBand[lastIdx] - currentPrice) / currentPrice * 100).toFixed(1)
    : '—';
  
  return (
    <div className="bg-white rounded-lg p-4" data-testid="forecast-summary">
      <div className="text-xs font-semibold text-slate-500 uppercase mb-3">
        Expected Outcome ({meta.aftermathDays}d)
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-xs text-slate-400">Bear Case</div>
          <div className={`text-lg font-bold ${parseFloat(p10Return) < 0 ? 'text-red-600' : 'text-green-600'}`}>
            {p10Return}%
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Base Case</div>
          <div className={`text-lg font-bold ${parseFloat(p50Return) < 0 ? 'text-red-600' : 'text-green-600'}`}>
            {p50Return}%
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Bull Case</div>
          <div className={`text-lg font-bold ${parseFloat(p90Return) < 0 ? 'text-red-600' : 'text-green-600'}`}>
            {p90Return}%
          </div>
        </div>
      </div>
      
      {/* Markers */}
      {markers && markers.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="text-xs text-slate-400 mb-2">Checkpoints</div>
          <div className="flex gap-2 flex-wrap">
            {markers.map((m, i) => (
              <span 
                key={i}
                className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600"
              >
                {m.horizon}: {(m.expectedReturn * 100).toFixed(1)}%
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// DISTRIBUTION STATS
// ═══════════════════════════════════════════════════════════════

const DistributionStats = ({ overlay }) => {
  if (!overlay?.stats) return null;
  
  const { stats } = overlay;
  
  return (
    <div className="bg-white rounded-lg p-4" data-testid="distribution-stats">
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
          <div className="text-xs text-slate-400">Typical Pullback</div>
          <div className="text-lg font-bold text-red-600">
            -{(stats.avgMaxDD * 100).toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Bear Return</div>
          <div className={`text-lg font-bold ${stats.p10Return > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {(stats.p10Return * 100).toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Bull Return</div>
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

const MatchesList = ({ matches, focus }) => {
  if (!matches || matches.length === 0) {
    return (
      <div className="bg-white rounded-lg p-4">
        <div className="text-sm text-slate-400 text-center">No matches found</div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg p-4" data-testid="matches-list">
      <div className="text-xs font-semibold text-slate-500 uppercase mb-3">
        Top Matches ({matches.length})
      </div>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {matches.slice(0, 10).map((m, i) => (
          <div 
            key={m.id || i}
            className="flex items-center justify-between p-2 bg-slate-50 rounded hover:bg-slate-100 cursor-pointer transition-colors"
            data-testid={`match-${i}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400">#{i + 1}</span>
              <span className="text-sm font-medium text-slate-700">{m.id}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                m.phase === 'MARKUP' ? 'bg-green-100 text-green-700' :
                m.phase === 'MARKDOWN' ? 'bg-red-100 text-red-700' :
                m.phase === 'RECOVERY' ? 'bg-blue-100 text-blue-700' :
                m.phase === 'DISTRIBUTION' ? 'bg-orange-100 text-orange-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                {m.phase}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-slate-400">
                Sim: <span className="font-medium text-slate-600">{(m.similarity * 100).toFixed(0)}%</span>
              </span>
              <span className={`font-medium ${m.return > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {m.return > 0 ? '+' : ''}{(m.return * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// LOADING SKELETON
// ═══════════════════════════════════════════════════════════════

const LoadingSkeleton = () => (
  <div className="animate-pulse" data-testid="loading-skeleton">
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
// MAIN TERMINAL PAGE
// ═══════════════════════════════════════════════════════════════

// Asset-specific configuration
const ASSET_CONFIG = {
  BTC: {
    title: 'BTC Fractal',
    subtitle: 'Bitcoin historical fractal alignment',
    formatPrice: (val) => `$${val?.toLocaleString('en-US', { maximumFractionDigits: 0 }) || '—'}`,
    formatChange: (val) => `${val >= 0 ? '+' : ''}${(val * 100).toFixed(1)}%`,
    apiPath: 'btc',
    defaultHorizon: '30d',
    volatilityScale: 'high', // BTC has higher volatility
  },
  SPX: {
    title: 'SPX Fractal',
    subtitle: 'S&P 500 historical pattern alignment',
    formatPrice: (val) => `${val?.toLocaleString('en-US', { maximumFractionDigits: 1 }) || '—'} pts`,
    formatChange: (val) => `${val >= 0 ? '+' : ''}${(val * 100).toFixed(2)}%`,
    apiPath: 'spx',
    defaultHorizon: '30d',
    volatilityScale: 'moderate', // SPX is more stable
  },
  DXY: {
    title: 'DXY Fractal',
    subtitle: 'US Dollar Index historical pattern alignment',
    formatPrice: (val) => `${val?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '—'}`,
    formatChange: (val) => `${val >= 0 ? '+' : ''}${(val * 100).toFixed(2)}%`,
    apiPath: 'dxy',
    defaultHorizon: '30d',
    volatilityScale: 'low', // DXY is lowest volatility
  },
};

const FractalTerminal = ({ asset = 'BTC' }) => {
  const config = ASSET_CONFIG[asset] || ASSET_CONFIG.BTC;
  
  const [chartMode, setChartMode] = useState('price');
  const [focus, setFocus] = useState(config.defaultHorizon);
  const [terminalData, setTerminalData] = useState(null);
  const [terminalLoading, setTerminalLoading] = useState(true);
  const symbol = asset;
  
  // VIEW MODE TOGGLE: ABS (absolute pts) or PERCENT (% from current price)
  // Only affects SPX display, BTC always shows $
  const [viewMode, setViewMode] = useState('ABS');
  
  // STRATEGY CONTROLS - Mode and Execution only
  // Horizon is controlled by global `focus` state
  const [strategyMode, setStrategyMode] = useState('balanced');
  const [strategyExecution, setStrategyExecution] = useState('ACTIVE');
  
  // BLOCK 70.2 + 73.5.2 + U2: Use focus-specific data with phase filter and as-of support
  const { 
    data: focusData, 
    loading: focusLoading, 
    error: focusError,
    meta,
    overlay,
    forecast,
    diagnostics,
    matchesCount,
    scenario, // U6: Scenario pack
    // BLOCK 73.5.2: Phase filter controls
    phaseId,
    setPhaseId,
    phaseFilter,
    // BLOCK U2: As-of date controls
    asOf,
    setAsOf,
    mode,
    setMode,
  } = useFocusPack(symbol, focus);

  // Fetch legacy terminal data (for volatility, sizing, etc.)
  // SPX uses different data structure, so we need asset-aware fetching
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    
    const fetchTerminal = async () => {
      setTerminalLoading(true);
      try {
        // UNIFIED: Use asset-aware URL
        let url;
        if (symbol === 'SPX') {
          url = `${API_BASE}/api/fractal/spx?focus=${focus}`; // SPX uses main endpoint
        } else if (symbol === 'DXY') {
          url = `${API_BASE}/api/fractal/dxy/terminal?focus=${focus}`; // DXY uses terminal endpoint
        } else {
          url = `${API_BASE}/api/fractal/v2.1/terminal?symbol=${symbol}&set=extended&focus=${focus}`; // BTC uses terminal
        }
        
        const res = await fetch(url, { signal: controller.signal });
        
        if (cancelled) return;
        
        // Check if response is ok before parsing
        if (!res.ok) {
          console.error('[Terminal] HTTP error:', res.status);
          setTerminalData(null);
          setTerminalLoading(false);
          return;
        }
        
        const rawData = await res.json();
        
        if (cancelled) return;
        
        // UNIFIED: Transform DXY response to terminal-like format
        if (symbol === 'DXY' && rawData.ok) {
          // DXY terminal returns data at root level
          const dxy = rawData;
          // Map LONG/SHORT to BUY/SELL
          const actionMap = { LONG: 'BUY', SHORT: 'SELL', HOLD: 'HOLD' };
          const action = dxy.core?.decision?.action || 'HOLD';
          const mappedAction = actionMap[action] || action;
          
          setTerminalData({
            phaseSnapshot: {
              phase: 'NEUTRAL', // DXY doesn't have phases yet
              trend: dxy.core?.decision?.action === 'LONG' ? 'UPTREND' : 
                     dxy.core?.decision?.action === 'SHORT' ? 'DOWNTREND' : 'SIDEWAYS',
            },
            volatility: {
              regime: 'NORMAL', // DXY typically has low volatility
              value: 0.3,
            },
            decisionKernel: {
              consensus: {
                bias: mappedAction,
                confidence: (dxy.core?.decision?.confidence || 0) / 100,
                score: (dxy.core?.decision?.confidence || 0) / 100,
                dir: mappedAction,
              },
            },
            lastCandle: dxy.core?.current?.date || new Date().toISOString().split('T')[0],
            // Additional DXY-specific data
            meta: dxy.meta,
            matches: dxy.core?.matches,
            prediction: dxy.prediction,
          });
        // UNIFIED: Transform SPX response to terminal-like format
        } else if (symbol === 'SPX' && rawData.ok && rawData.data) {
          const spx = rawData.data;
          // Map LONG/SHORT to BUY/SELL
          const actionMap = { LONG: 'BUY', SHORT: 'SELL', HOLD: 'HOLD' };
          const mappedAction = actionMap[spx.decision?.action] || spx.decision?.action || 'HOLD';
          
          setTerminalData({
            phaseSnapshot: {
              phase: spx.market?.phase || 'DISTRIBUTION',
              trend: spx.market?.sma200 === 'ABOVE' ? 'UPTREND' : 'DOWNTREND',
            },
            volatility: {
              regime: spx.market?.volatility > 0.5 ? 'HIGH' : 'NORMAL',
              value: spx.market?.volatility,
            },
            decisionKernel: {
              consensus: {
                bias: mappedAction,
                confidence: spx.decision?.confidence || 0,
                score: spx.decision?.confidence || 0,
                dir: mappedAction,
              },
            },
            lastCandle: spx.contract?.asOf || new Date().toISOString().split('T')[0],
          });
        } else {
          setTerminalData(rawData);
        }
      } catch (err) {
        if (!cancelled && err.name !== 'AbortError') {
          console.error('[Terminal] Fetch error:', err);
        }
      } finally {
        if (!cancelled) {
          setTerminalLoading(false);
        }
      }
    };
    
    fetchTerminal();
    
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [symbol, focus]);

  const volatility = terminalData?.volatility;
  const sizing = terminalData?.decisionKernel?.sizing;
  const consensus = terminalData?.decisionKernel?.consensus;
  const conflict = terminalData?.decisionKernel?.conflict;
  // BLOCK 74: Horizon Stack + Institutional Consensus
  const horizonStack = terminalData?.horizonStack;
  const consensus74 = terminalData?.consensus74;
  
  // Fetch consensus pulse data
  const { data: consensusPulse } = useConsensusPulse(symbol, 7);

  const isLoading = focusLoading || terminalLoading;
  const tierColor = meta ? getTierColor(meta.tier) : '#6B7280';

  // Extract signal info for control row
  const signal = consensus?.bias?.toUpperCase() || 'HOLD';
  const confidenceLevel = consensus?.confidence >= 0.7 ? 'High' 
    : consensus?.confidence >= 0.4 ? 'Medium' 
    : 'Low';
  const marketMode = terminalData?.phaseSnapshot?.phase || 'Unknown';
  const riskLevel = volatility?.regime === 'CRISIS' ? 'CRISIS'
    : volatility?.regime === 'HIGH' ? 'HIGH'
    : 'Normal';

  return (
    <div className="min-h-screen bg-slate-50" data-testid="fractal-terminal">
      {/* Header - clean, minimal */}
      <header className="bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold text-slate-900">
            {config.title}
          </h1>
          <AsOfDatePicker 
            asOf={asOf}
            mode={mode}
            onAsOfChange={setAsOf}
            onModeChange={setMode}
            lastCandle={terminalData?.lastCandle || '2026-02-20'}
          />
        </div>
      </header>
      
      {/* UNIFIED CONTROL ROW — Status | Mode | Horizon | View Toggle (SPX) */}
      <UnifiedControlRow
        signal={signal}
        confidence={confidenceLevel}
        marketMode={marketMode}
        risk={riskLevel}
        chartMode={chartMode}
        onModeChange={setChartMode}
        focus={focus}
        onFocusChange={setFocus}
        loading={isLoading}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        asset={symbol}
      />
      
      {/* CHART — Full width, как было раньше */}
      <div className="bg-white border-b border-slate-200">
        <div className="min-h-[480px]">
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <>
              {chartMode === 'price' && (
                <FractalMainChart 
                  symbol={symbol} 
                  width={1200} 
                  height={460}
                  focus={focus}
                  focusPack={focusData}
                  viewMode={viewMode}
                />
              )}
              
              {chartMode === 'replay' && (
                <FractalOverlaySection 
                  symbol={symbol}
                  focus={focus}
                  focusPack={focusData}
                />
              )}
              
              {chartMode === 'hybrid' && (
                <FractalHybridChart
                  symbol={symbol}
                  width={1200}
                  height={460}
                  focus={focus}
                  focusPack={focusData}
                  onPhaseFilter={setPhaseId}
                  viewMode={viewMode}
                />
              )}
              
              {chartMode === 'macro' && symbol === 'DXY' && (
                <FractalHybridChart
                  symbol={symbol}
                  width={1200}
                  height={460}
                  focus={focus}
                  focusPack={focusData}
                  onPhaseFilter={setPhaseId}
                  viewMode={viewMode}
                  mode="macro"
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Panels Section — DXY Architectural Layout */}
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        
        {/* LAYER 2: FRACTAL ENGINE BREAKDOWN — Only for DXY */}
        {symbol === 'DXY' && !isLoading && focusData && (
          <FractalEngineBreakdown 
            focusPack={focusData}
            matches={overlay?.matches}
          />
        )}
        
        {/* LAYER 3: MACRO LAYER — Only for DXY */}
        {symbol === 'DXY' && !isLoading && (
          <MacroLayerPanel 
            focus={focus}
            focusPack={focusData}
          />
        )}
        
        {/* LAYER 4: OUTCOMES + RISK — Only for DXY */}
        {symbol === 'DXY' && !isLoading && (
          <OutcomesRiskPanel 
            scenario={scenario}
            volatility={volatility}
            sizing={sizing}
            focusPack={focusData}
          />
        )}
        
        {/* LAYER 5: FRACTAL ANALYSIS + TOP MATCHES — For DXY */}
        {symbol === 'DXY' && !isLoading && focusData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FractalAnalysisPanel 
              forecast={forecast}
              overlay={overlay}
              matches={overlay?.matches}
              focus={focus}
            />
            
            {/* Compact Top Matches Table */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="text-xs font-semibold text-slate-500 uppercase mb-3">
                Top Historical Matches
              </div>
              <div className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-400">
                      <th className="text-left pb-2">Date Range</th>
                      <th className="text-right pb-2">Similarity</th>
                      <th className="text-right pb-2">Outcome</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(overlay?.matches || []).slice(0, 4).map((m, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="py-2 text-slate-700">{m.startDate || m.date || '—'}</td>
                        <td className="py-2 text-right">{((m.similarity || m.score || 0) * 100).toFixed(0)}%</td>
                        <td className={`py-2 text-right font-medium ${
                          (m.outcomeReturn || m.outcome || 0) < 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {((m.outcomeReturn || m.outcome || 0) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        {/* LAYER 6: SYSTEM STATUS / MARKET STRUCTURE — For DXY */}
        {symbol === 'DXY' && !isLoading && (
          <SystemStatusPanel
            phaseSnapshot={terminalData?.phaseSnapshot}
            consensusPulse={consensusPulse}
            meta={meta}
            diagnostics={diagnostics}
            matchesCount={matchesCount}
            dataStatus={focusError ? 'error' : focusLoading ? 'loading' : 'real'}
          />
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* NON-DXY ASSETS (SPX, BTC) — Original layout */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        
        {/* U6 + U7: Scenarios and Risk Box side by side — SPX/BTC only */}
        {symbol !== 'DXY' && !isLoading && (scenario || sizing) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {scenario && (
              <ScenarioBox scenario={scenario} asset={symbol} />
            )}
            <RiskBox 
              scenario={scenario}
              volatility={volatility}
              sizing={sizing}
              constitution={terminalData?.decisionKernel?.constitution}
              driftStatus={terminalData?.drift?.status}
              asset={symbol}
            />
          </div>
        )}

        {/* FRACTAL ANALYSIS + MARKET PHASE ENGINE — SPX/BTC */}
        {symbol !== 'DXY' && !isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {focusData && (
              <FractalAnalysisPanel 
                forecast={forecast}
                overlay={overlay}
                matches={overlay?.matches}
                focus={focus}
              />
            )}
            <MarketPhaseEngine 
              tier={meta?.tier || 'TACTICAL'} 
              horizonStack={horizonStack}
              currentFocus={focus}
            />
          </div>
        )}

        {/* BLOCK 74.2: Institutional Consensus Panel — SPX/BTC */}
        {consensus74 && symbol !== 'DXY' && (
          <ConsensusPanel consensus74={consensus74} horizonStack={horizonStack} />
        )}
        
        {/* STRATEGY CONTROLS — SPX/BTC only */}
        {symbol !== 'DXY' && (
          <StrategyControlPanel
            mode={strategyMode}
            execution={strategyExecution}
            onModeChange={setStrategyMode}
            onExecutionChange={setStrategyExecution}
            loading={isLoading}
            currentHorizon={focus}
          />
        )}
        
        {/* Strategy Summary — SPX/BTC only */}
        {symbol !== 'DXY' && (
          <StrategySummary 
            symbol={symbol} 
            mode={strategyMode}
            horizon={focus}
            execution={strategyExecution}
          />
        )}
        
        {/* Forward Performance — SPX/BTC only */}
        {symbol !== 'DXY' && (
          <ForwardPerformanceCompact
            symbol={symbol}
            mode={strategyMode}
            horizon={focus}
            execution={strategyExecution}
          />
        )}
        
        {/* SYSTEM STATUS PANEL — SPX/BTC */}
        {symbol !== 'DXY' && (
          <SystemStatusPanel
            phaseSnapshot={terminalData?.phaseSnapshot}
            consensusPulse={consensusPulse}
            meta={meta}
            diagnostics={diagnostics}
            matchesCount={matchesCount}
            dataStatus={focusError ? 'error' : focusLoading ? 'loading' : 'real'}
          />
        )}
      </main>
    </div>
  );
};

export default FractalTerminal;
