/**
 * FractalOverlaySection — Replay Mode
 * REFACTORED: Full width chart, Match Metrics below
 */
import React from "react";
import { useFractalOverlay } from "../hooks/useFractalOverlay";
import { OverlayCanvas } from "../OverlayCanvas";
import { OverlayMatchPicker } from "../OverlayMatchPicker";

// Phase labels mapping
const PHASE_LABELS = {
  ACC: "Accumulation",
  ACCUMULATION: "Accumulation",
  DIS: "Distribution", 
  DISTRIBUTION: "Distribution",
  REC: "Recovery",
  RECOVERY: "Recovery",
  MAR: "Markdown",
  MARKDOWN: "Markdown",
  MKU: "Markup",
  MARKUP: "Markup",
  CAP: "Capitulation",
  CAPITULATION: "Capitulation",
};

export function FractalOverlaySection({ symbol, focus = '30d' }) {
  // Use updated hook with horizon support
  const { 
    data, 
    loading, 
    err, 
    horizonDays,
    matchIndex, 
    setMatchIndex 
  } = useFractalOverlay(symbol, focus);

  const match = data?.matches?.[matchIndex];
  const matchCount = data?.matches?.length || 0;

  return (
    <div data-testid="fractal-overlay-section" className="p-4">
      {/* FULL WIDTH CHART - No header */}
      <div className="bg-white rounded-xl p-4 mb-4">
        {loading ? (
          <div className="flex items-center justify-center h-[380px] text-slate-400">
            Loading Replay Data...
          </div>
        ) : err ? (
          <div className="flex items-center justify-center h-[380px] text-red-500">
            Error: {err}
          </div>
        ) : (
          <>
            <OverlayCanvas 
              data={data} 
              matchIndex={matchIndex} 
              width={1100} 
              height={380}
              horizonDays={horizonDays}
            />
            
            {/* Match Picker */}
            {data?.matches?.length > 0 && (
              <div className="mt-4">
                <OverlayMatchPicker
                  matches={data.matches.map((m) => ({ 
                    id: m.id, 
                    similarity: m.similarity, 
                    phase: m.phase 
                  }))}
                  value={matchIndex}
                  onChange={setMatchIndex}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* BOTTOM GRID: 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Match Metrics Card */}
        <MatchMetricsCard match={match} loading={loading} />
        
        {/* Top Matches Card */}
        <TopMatchesCard 
          matches={data?.matches} 
          selectedIndex={matchIndex}
          onSelect={setMatchIndex}
        />
        
        {/* Vol Regime Card */}
        <VolRegimeCard match={match} horizonDays={horizonDays} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MATCH METRICS CARD
// ═══════════════════════════════════════════════════════════════

function MatchMetricsCard({ match, loading }) {
  if (loading) {
    return (
      <div className="bg-white p-4">
        <div className="animate-pulse h-40 bg-slate-100 rounded"/>
      </div>
    );
  }
  
  if (!match) {
    return (
      <div className="bg-white p-4">
        <div className="text-sm text-slate-500">Select a match</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4">
      <div className="text-sm font-bold text-slate-700 mb-3">Match Metrics</div>
      
      <div className="space-y-2">
        <MetricRow label="Match ID" value={match.startDate || match.id} />
        <MetricRow 
          label="Phase" 
          value={
            <span className={`text-xs font-medium ${getPhaseTextColor(match.phase)}`}>
              {PHASE_LABELS[match.phase] || match.phase}
            </span>
          }
        />
        <MetricRow label="Similarity" value={fmtPct(match.similarity)} />
        <MetricRow label="Volatility Match" value={fmtPct(match.volatilityMatch)} />
        <MetricRow label="Stability" value={fmtPct(match.stability)} />
        
        <hr className="my-2 border-slate-100"/>
        
        <MetricRow label="Return 7d" value={fmtSignedPct(match.return7d)} color={getReturnColor(match.return7d)} />
        <MetricRow label="Return 14d" value={fmtSignedPct(match.return14d)} color={getReturnColor(match.return14d)} />
        <MetricRow label="Return 30d" value={fmtSignedPct(match.return30d)} color={getReturnColor(match.return30d)} />
        
        <hr className="my-2 border-slate-100"/>
        
        <MetricRow label="Max Drawdown" value={fmtSignedPct(match.maxDrawdown)} color="#ef4444" />
        <MetricRow label="Max Excursion" value={fmtSignedPct(match.maxExcursion)} color="#22c55e" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TOP MATCHES CARD
// ═══════════════════════════════════════════════════════════════

function TopMatchesCard({ matches, selectedIndex, onSelect }) {
  if (!matches?.length) {
    return (
      <div className="bg-white p-4">
        <div className="text-sm font-bold text-slate-700 mb-3">Top Matches</div>
        <div className="text-xs text-slate-400">No matches available</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4">
      <div className="text-sm font-bold text-slate-700 mb-3">Top Matches</div>
      
      <div className="space-y-1 max-h-[200px] overflow-y-auto">
        {matches.slice(0, 10).map((m, i) => (
          <button
            key={m.id}
            onClick={() => onSelect(i)}
            className={`w-full flex items-center justify-between p-2 rounded text-xs transition-colors ${
              i === selectedIndex 
                ? 'bg-blue-50' 
                : 'bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-slate-400">{i + 1}</span>
              <span className={`text-xs ${getPhaseTextColor(m.phase)}`}>
                {PHASE_LABELS[m.phase] || m.phase}
              </span>
            </div>
            <span className="font-medium">
              {(m.similarity * 100).toFixed(0)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// VOL REGIME CARD
// ═══════════════════════════════════════════════════════════════

function VolRegimeCard({ match, horizonDays }) {
  return (
    <div className="bg-white p-4">
      <div className="text-sm font-bold text-slate-700 mb-3">Vol Regime</div>
      
      {match ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Volatility Match</span>
            <span className="text-sm font-medium">{fmtPct(match.volatilityMatch)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Drawdown Shape</span>
            <span className="text-sm font-medium">{fmtPct(match.drawdownShape)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Horizon</span>
            <span className="text-sm font-medium">{horizonDays}D</span>
          </div>
          
          <hr className="my-2 border-slate-100"/>
          
          <div className="text-xs text-slate-400">
            Replay compares current market structure with historical patterns.
            Indexed scale normalizes prices for shape comparison.
          </div>
        </div>
      ) : (
        <div className="text-xs text-slate-400">Select a match to view regime</div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function MetricRow({ label, value, color }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-medium" style={{ color: color || 'inherit' }}>
        {value}
      </span>
    </div>
  );
}

function fmtPct(x) {
  if (x == null || Number.isNaN(x)) return "—";
  return `${(x * 100).toFixed(0)}%`;
}

function fmtSignedPct(x) {
  if (x == null || Number.isNaN(x)) return "—";
  const s = x >= 0 ? "+" : "";
  return `${s}${(x * 100).toFixed(1)}%`;
}

function getReturnColor(x) {
  if (x == null) return undefined;
  return x >= 0 ? "#22c55e" : "#ef4444";
}

function getPhaseColor(phase) {
  const colors = {
    MARKUP: 'bg-green-100 text-green-700',
    MKU: 'bg-green-100 text-green-700',
    MARKDOWN: 'bg-red-100 text-red-700',
    MAR: 'bg-red-100 text-red-700',
    RECOVERY: 'bg-blue-100 text-blue-700',
    REC: 'bg-blue-100 text-blue-700',
    DISTRIBUTION: 'bg-orange-100 text-orange-700',
    DIS: 'bg-orange-100 text-orange-700',
    ACCUMULATION: 'bg-purple-100 text-purple-700',
    ACC: 'bg-purple-100 text-purple-700',
    CAPITULATION: 'bg-gray-100 text-gray-700',
    CAP: 'bg-gray-100 text-gray-700',
  };
  return colors[phase] || 'bg-slate-100 text-slate-600';
}

function getPhaseTextColor(phase) {
  const colors = {
    MARKUP: 'text-green-600',
    MKU: 'text-green-600',
    MARKDOWN: 'text-red-600',
    MAR: 'text-red-600',
    RECOVERY: 'text-blue-600',
    REC: 'text-blue-600',
    DISTRIBUTION: 'text-orange-600',
    DIS: 'text-orange-600',
    ACCUMULATION: 'text-purple-600',
    ACC: 'text-purple-600',
    CAPITULATION: 'text-gray-600',
    CAP: 'text-gray-600',
  };
  return colors[phase] || 'text-slate-600';
}
