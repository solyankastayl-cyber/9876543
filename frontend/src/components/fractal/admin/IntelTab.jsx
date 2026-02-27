/**
 * BLOCK 82 — Intel Tab (Phase Strength Timeline + Dominance History)
 * 
 * Admin UI for institutional-grade phase and dominance monitoring.
 * Shows:
 * - Phase Strength Timeline (score + grade over time)
 * - Dominance History (tier distribution + structural lock)
 * - KPI Summary
 */

import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// ═══════════════════════════════════════════════════════════════
// MODEL HEALTH BADGE (BLOCK 85)
// ═══════════════════════════════════════════════════════════════

function ModelHealthBadge() {
  const [health, setHealth] = useState(null);
  
  useEffect(() => {
    fetch(`${API_BASE}/api/fractal/v2.1/admin/model-health?symbol=BTC`)
      .then(r => r.json())
      .then(d => d.ok && setHealth(d))
      .catch(() => {});
  }, []);
  
  if (!health) return null;
  
  const bandColors = {
    STRONG: 'bg-emerald-500',
    STABLE: 'bg-blue-500',
    MODERATE: 'bg-amber-500',
    WEAK: 'bg-red-500',
  };
  
  return (
    <div className="bg-slate-800 rounded-lg px-4 py-2" data-testid="model-health-badge">
      <div className="text-xs text-slate-400 mb-1">Model Health</div>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-white">{health.score}%</span>
        <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${bandColors[health.band]}`}>
          {health.band}
        </span>
      </div>
      <div className="text-xs text-slate-500 mt-1">
        Perf: {health.components?.performanceScore} | Drift: {health.components?.driftPenalty} | Phase: {health.components?.phaseScore}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BADGES & HELPERS
// ═══════════════════════════════════════════════════════════════

function GradeBadge({ grade, size = 'md' }) {
  const colors = {
    A: 'bg-emerald-100 text-emerald-800 border-emerald-400',
    B: 'bg-blue-100 text-blue-800 border-blue-400',
    C: 'bg-amber-100 text-amber-800 border-amber-400',
    D: 'bg-orange-100 text-orange-800 border-orange-400',
    F: 'bg-red-100 text-red-800 border-red-400',
  };
  const sizes = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base font-bold',
  };
  return (
    <span className={`rounded border-2 font-semibold ${colors[grade] || colors.C} ${sizes[size]}`} data-testid={`grade-badge-${grade}`}>
      {grade}
    </span>
  );
}

function DominanceBadge({ tier }) {
  const colors = {
    STRUCTURE: 'bg-blue-500 text-white',
    TACTICAL: 'bg-green-500 text-white',
    TIMING: 'bg-purple-500 text-white',
  };
  return (
    <span className={`px-2 py-1 text-xs rounded font-medium ${colors[tier] || 'bg-gray-500 text-white'}`} data-testid={`dom-badge-${tier}`}>
      {tier}
    </span>
  );
}

function TrendArrow({ trend }) {
  if (trend === 'UP') return <span className="text-emerald-500 text-lg">↑</span>;
  if (trend === 'DOWN') return <span className="text-red-500 text-lg">↓</span>;
  return <span className="text-gray-400 text-lg">→</span>;
}

function LockIcon({ active }) {
  if (!active) return null;
  return <span className="text-amber-500" title="Structural Lock Active">🔒</span>;
}

// ═══════════════════════════════════════════════════════════════
// HEADER
// ═══════════════════════════════════════════════════════════════

function IntelHeader({ stats, latest, windowDays, onWindowChange, source, onSourceChange }) {
  const windows = [30, 90, 180, 365];
  const sources = ['LIVE', 'V2020', 'V2014'];
  
  return (
    <div className="bg-slate-900 rounded-xl p-6" data-testid="intel-header">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">BLOCK 82 — Phase Strength + Dominance</h2>
          <p className="text-slate-400 text-sm">Institutional timeline analytics</p>
        </div>
        
        {latest && (
          <div className="flex items-center gap-3 bg-slate-800 rounded-lg px-4 py-2">
            <div className="text-right">
              <div className="text-xs text-slate-400">Current Phase</div>
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold">{latest.phaseType}</span>
                <GradeBadge grade={latest.phaseGrade} size="sm" />
                <TrendArrow trend={stats?.trend7d} />
              </div>
            </div>
            <div className="w-px h-8 bg-slate-700"></div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Dominance</div>
              <div className="flex items-center gap-2">
                <DominanceBadge tier={latest.dominanceTier} />
                <LockIcon active={latest.structuralLock} />
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Window Selector */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-sm">Window:</span>
          {windows.map(w => (
            <button
              key={w}
              onClick={() => onWindowChange(w)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                windowDays === w
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
              data-testid={`window-btn-${w}`}
            >
              {w}d
            </button>
          ))}
        </div>
        
        {/* Source Selector */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-sm">Source:</span>
          {sources.map(s => (
            <button
              key={s}
              onClick={() => onSourceChange(s)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                source === s
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
              data-testid={`source-btn-${s}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE STRENGTH TIMELINE
// ═══════════════════════════════════════════════════════════════

function PhaseStrengthTimeline({ series, alerts = [] }) {
  if (!series || series.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-bold text-gray-900 mb-3">Phase Strength Timeline</h3>
        <div className="text-gray-500 text-sm py-8 text-center">No data available. Run backfill to populate.</div>
      </div>
    );
  }
  
  const maxScore = 100;
  const height = 200;
  
  // Event marker icons
  const eventIcons = {
    LOCK_ENTER: '🔒',
    LOCK_EXIT: '🔓',
    DOMINANCE_SHIFT: '▲',
    PHASE_DOWNGRADE: '▼',
  };
  
  // Create alerts map by date
  const alertsByDate = {};
  alerts.forEach(a => {
    if (!alertsByDate[a.date]) alertsByDate[a.date] = [];
    alertsByDate[a.date].push(a);
  });
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4" data-testid="phase-timeline">
      <h3 className="font-bold text-gray-900 mb-3">Phase Strength Timeline</h3>
      
      {/* Simple sparkline visualization */}
      <div className="relative" style={{ height: `${height}px` }}>
        <svg width="100%" height={height} className="overflow-visible">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(val => (
            <g key={val}>
              <line
                x1="0"
                x2="100%"
                y1={height - (val / maxScore) * height}
                y2={height - (val / maxScore) * height}
                stroke="#e5e7eb"
                strokeDasharray="4"
              />
              <text
                x="-5"
                y={height - (val / maxScore) * height + 4}
                className="text-xs fill-gray-400"
                textAnchor="end"
              >
                {val}
              </text>
            </g>
          ))}
          
          {/* Data points */}
          {series.map((d, i) => {
            const xPct = (i / (series.length - 1 || 1)) * 100;
            const x = xPct + '%';
            const y = height - (d.phaseScore / maxScore) * height;
            const gradeColors = { A: '#10b981', B: '#3b82f6', C: '#f59e0b', D: '#f97316', F: '#ef4444' };
            const dateAlerts = alertsByDate[d.date] || [];
            
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r={series.length > 60 ? 2 : 4}
                  fill={gradeColors[d.phaseGrade] || '#9ca3af'}
                  className="cursor-pointer hover:opacity-80"
                >
                  <title>{`${d.date}: ${d.phaseType} (${d.phaseGrade}) Score: ${d.phaseScore}`}</title>
                </circle>
                {/* Connect with line */}
                {i > 0 && (
                  <line
                    x1={((i - 1) / (series.length - 1)) * 100 + '%'}
                    y1={height - (series[i - 1].phaseScore / maxScore) * height}
                    x2={x}
                    y2={y}
                    stroke="#9ca3af"
                    strokeWidth={1}
                    opacity={0.5}
                  />
                )}
                {/* BLOCK 84: Event Markers */}
                {dateAlerts.map((alert, ai) => (
                  <text
                    key={`${i}-${ai}`}
                    x={x}
                    y={y - 12 - (ai * 10)}
                    fontSize="10"
                    textAnchor="middle"
                    className="cursor-pointer"
                    style={{ pointerEvents: 'all' }}
                  >
                    <title>{`${alert.eventType}: ${alert.severity}`}</title>
                    {eventIcons[alert.eventType] || '•'}
                  </text>
                ))}
              </g>
            );
          })}
        </svg>
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> A</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500"></span> B</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500"></span> C</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500"></span> D</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> F</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DOMINANCE HISTORY
// ═══════════════════════════════════════════════════════════════

function DominanceHistory({ series, alerts = [] }) {
  if (!series || series.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-bold text-gray-900 mb-3">Dominance History</h3>
        <div className="text-gray-500 text-sm py-8 text-center">No data available. Run backfill to populate.</div>
      </div>
    );
  }
  
  const tierColors = {
    STRUCTURE: '#3b82f6',
    TACTICAL: '#22c55e',
    TIMING: '#a855f7',
  };
  
  // Create alerts map by date for markers
  const alertsByDate = {};
  alerts.forEach(a => {
    if (!alertsByDate[a.date]) alertsByDate[a.date] = [];
    alertsByDate[a.date].push(a);
  });
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4" data-testid="dominance-history">
      <h3 className="font-bold text-gray-900 mb-3">Dominance History</h3>
      
      {/* Timeline strip with event markers */}
      <div className="relative">
        <div className="flex h-10 rounded-lg overflow-hidden mb-1">
          {series.map((d, i) => (
            <div
              key={i}
              className="relative flex-1 min-w-[2px] group cursor-pointer"
              style={{ backgroundColor: tierColors[d.dominanceTier] || '#9ca3af' }}
              title={`${d.date}: ${d.dominanceTier}${d.structuralLock ? ' 🔒' : ''}`}
            >
              {/* Lock marker */}
              {d.structuralLock && (
                <div className="absolute inset-x-0 top-0 h-1.5 bg-amber-400"></div>
              )}
              {/* High conflict marker */}
              {d.conflictLevel === 'HIGH' && (
                <div className="absolute inset-x-0 bottom-0 h-1.5 bg-red-500"></div>
              )}
            </div>
          ))}
        </div>
        
        {/* BLOCK 84: Event markers above the bar */}
        <div className="flex h-5 -mt-1">
          {series.map((d, i) => {
            const dateAlerts = alertsByDate[d.date] || [];
            const hasShift = dateAlerts.some(a => a.eventType === 'DOMINANCE_SHIFT');
            const hasLockEvent = dateAlerts.some(a => a.eventType === 'LOCK_ENTER' || a.eventType === 'LOCK_EXIT');
            
            return (
              <div key={i} className="flex-1 min-w-[2px] flex items-end justify-center">
                {hasShift && (
                  <span className="text-amber-500 text-xs" title="Dominance Shift">▲</span>
                )}
                {hasLockEvent && (
                  <span className="text-red-500 text-xs" title="Lock Event">●</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{backgroundColor: tierColors.STRUCTURE}}></span> Structure</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{backgroundColor: tierColors.TACTICAL}}></span> Tactical</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{backgroundColor: tierColors.TIMING}}></span> Timing</div>
        <div className="flex items-center gap-1"><span className="w-3 h-1.5 bg-amber-400 rounded"></span> Locked</div>
        <div className="flex items-center gap-1"><span className="w-3 h-1.5 bg-red-500 rounded"></span> High Conflict</div>
        <div className="flex items-center gap-1"><span className="text-amber-500">▲</span> Dom Shift</div>
        <div className="flex items-center gap-1"><span className="text-red-500">●</span> Lock Event</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// KPI SUMMARY
// ═══════════════════════════════════════════════════════════════

function KpiSummary({ stats }) {
  if (!stats) return null;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4" data-testid="kpi-summary">
      <h3 className="font-bold text-gray-900 mb-3">KPI Summary</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Lock Days" value={stats.lockDays} suffix="d" />
        <KpiCard label="Structure %" value={stats.structureDominancePct} suffix="%" color="blue" />
        <KpiCard label="Tactical %" value={stats.tacticalDominancePct} suffix="%" color="green" />
        <KpiCard label="Timing %" value={stats.timingDominancePct} suffix="%" color="purple" />
        <KpiCard label="Switch Count" value={stats.switchCount} />
        <KpiCard label="Avg Phase Score" value={stats.avgPhaseScore?.toFixed(1)} />
        <KpiCard label="Avg Consensus" value={stats.avgConsensus?.toFixed(1)} />
        <KpiCard label="7d Trend" value={stats.trend7d} isText />
      </div>
    </div>
  );
}

function KpiCard({ label, value, suffix = '', color, isText }) {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
  };
  
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-xl font-bold ${colorClasses[color] || 'text-gray-900'}`}>
        {isText ? (
          <span className="flex items-center gap-1">
            {value} <TrendArrow trend={value} />
          </span>
        ) : (
          `${value ?? '—'}${suffix}`
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// INTEL ALERTS TABLE (BLOCK 83)
// ═══════════════════════════════════════════════════════════════

function IntelAlertsTable({ symbol = 'BTC', source = 'LIVE' }) {
  const [alerts, setAlerts] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/fractal/v2.1/admin/intel/alerts?symbol=${symbol}&source=${source}&limit=20`)
      .then(r => r.json())
      .then(d => {
        setAlerts(d.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [symbol, source]);

  const severityColor = {
    CRITICAL: 'text-red-600',
    WARN: 'text-amber-600',
    INFO: 'text-blue-600',
  };

  const eventLabel = {
    LOCK_ENTER: '🔒 Lock Enter',
    LOCK_EXIT: '🔓 Lock Exit',
    DOMINANCE_SHIFT: '🔄 Dom Shift',
    PHASE_DOWNGRADE: '⬇️ Phase Down',
  };

  const statusColor = {
    sent: 'bg-emerald-100 text-emerald-700',
    stored_no_send: 'bg-slate-100 text-slate-600',
    rate_limited: 'bg-amber-100 text-amber-700',
    dedup_skip: 'bg-gray-100 text-gray-500',
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-bold text-gray-900 mb-3">🧠 Intelligence Event Alerts ({source})</h3>
        <div className="text-gray-500 text-sm py-4 text-center">Loading alerts...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4" data-testid="intel-alerts-table">
      <h3 className="font-bold text-gray-900 mb-3">🧠 Intelligence Event Alerts ({source})</h3>
      
      {alerts.length === 0 ? (
        <div className="text-gray-500 text-sm py-4 text-center">
          No alerts yet. Events will appear after daily runs when LIVE samples ≥ 15.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-200 text-gray-500">
                <th className="pb-2">Date</th>
                <th className="pb-2">Event</th>
                <th className="pb-2">Severity</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Consensus</th>
                <th className="pb-2">Phase</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <React.Fragment key={a._id}>
                  <tr className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 text-gray-600">{a.date}</td>
                    <td className="py-2">{eventLabel[a.eventType] || a.eventType}</td>
                    <td className={`py-2 font-semibold ${severityColor[a.severity]}`}>
                      {a.severity}
                    </td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${a.sent ? statusColor.sent : statusColor.stored_no_send}`}>
                        {a.sent ? 'SENT' : 'STORED'}
                      </span>
                    </td>
                    <td className="py-2 text-gray-600">{a.payload?.consensusIndex ?? '-'}</td>
                    <td className="py-2 text-gray-600">
                      {a.payload?.phaseType ?? '-'} ({a.payload?.phaseGrade ?? '-'})
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => setExpanded(expanded === a._id ? null : a._id)}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        {expanded === a._id ? 'Hide' : 'Details'}
                      </button>
                    </td>
                  </tr>
                  {expanded === a._id && (
                    <tr>
                      <td colSpan={7} className="p-3 bg-slate-50">
                        <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto max-h-48">
                          {JSON.stringify(a.payload, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BACKFILL PANEL
// ═══════════════════════════════════════════════════════════════

function BackfillPanel({ counts, onBackfill }) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  const runBackfill = async (cohort, from, to) => {
    setIsLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/fractal/v2.1/admin/intel/backfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cohort, from, to }),
      });
      const json = await res.json();
      setResult(json);
      if (json.ok) onBackfill();
    } catch (err) {
      setResult({ ok: false, error: err.message });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4" data-testid="backfill-panel">
      <h3 className="font-bold text-gray-900 mb-3">Backfill Intel Timeline</h3>
      
      {/* Counts */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500">LIVE</div>
          <div className="text-lg font-bold text-emerald-600">{counts?.LIVE || 0}</div>
        </div>
        <div className="bg-white rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500">V2020</div>
          <div className="text-lg font-bold text-blue-600">{counts?.V2020 || 0}</div>
        </div>
        <div className="bg-white rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500">V2014</div>
          <div className="text-lg font-bold text-purple-600">{counts?.V2014 || 0}</div>
        </div>
      </div>
      
      {/* Backfill Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => runBackfill('V2020', '2020-01-01', '2025-12-31')}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
          data-testid="backfill-v2020"
        >
          {isLoading ? 'Running...' : 'Backfill V2020 (2020-2025)'}
        </button>
        <button
          onClick={() => runBackfill('V2014', '2014-01-01', '2019-12-31')}
          disabled={isLoading}
          className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50"
          data-testid="backfill-v2014"
        >
          {isLoading ? 'Running...' : 'Backfill V2014 (2014-2019)'}
        </button>
      </div>
      
      {/* Result */}
      {result && (
        <div className={`mt-3 p-3 rounded-lg text-sm ${result.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {result.ok ? `Written: ${result.written}, Skipped: ${result.skipped}` : `Error: ${result.error}`}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function IntelTab() {
  const [data, setData] = useState(null);
  const [counts, setCounts] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [windowDays, setWindowDays] = useState(90);
  const [source, setSource] = useState('LIVE');
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [timelineRes, countsRes, alertsRes] = await Promise.all([
        fetch(`${API_BASE}/api/fractal/v2.1/admin/intel/timeline?symbol=BTC&source=${source}&window=${windowDays}`),
        fetch(`${API_BASE}/api/fractal/v2.1/admin/intel/counts?symbol=BTC`),
        fetch(`${API_BASE}/api/fractal/v2.1/admin/intel/alerts?symbol=BTC&source=${source}&limit=200`),
      ]);
      
      const timeline = await timelineRes.json();
      const countsData = await countsRes.json();
      const alertsData = await alertsRes.json();
      
      if (timeline.ok) {
        setData(timeline);
        setError(null);
      } else {
        setError(timeline.error || 'Failed to fetch intel timeline');
      }
      
      if (countsData.ok) {
        setCounts(countsData.counts);
      }
      
      if (alertsData.ok) {
        setAlerts(alertsData.items || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [source, windowDays]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleWindowChange = (w) => {
    setWindowDays(w);
  };
  
  const handleSourceChange = (s) => {
    setSource(s);
  };
  
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading intel timeline...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-red-50 border border-red-300 rounded-xl p-4 text-red-700">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }
  
  const latest = data?.series?.length > 0 ? data.series[data.series.length - 1] : null;
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6" data-testid="intel-tab">
      {/* Header with Model Health Badge */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <IntelHeader
          stats={data?.stats}
          latest={latest}
          windowDays={windowDays}
          onWindowChange={handleWindowChange}
          source={source}
          onSourceChange={handleSourceChange}
        />
        <ModelHealthBadge />
      </div>
      
      {/* Phase Timeline (BLOCK 84: with event markers) */}
      <PhaseStrengthTimeline series={data?.series} alerts={alerts} />
      
      {/* Dominance History (BLOCK 84: with event markers) */}
      <DominanceHistory series={data?.series} alerts={alerts} />
      
      {/* KPI Summary */}
      <KpiSummary stats={data?.stats} />
      
      {/* Intel Alerts Table (BLOCK 83) */}
      <IntelAlertsTable symbol="BTC" source={source} />
      
      {/* Backfill Panel */}
      <BackfillPanel counts={counts} onBackfill={fetchData} />
      
      {/* Meta Footer */}
      <div className="text-xs text-gray-400 text-right">
        Period: {data?.meta?.from} to {data?.meta?.to} | Source: {data?.meta?.source} | Window: {data?.meta?.window}d
      </div>
    </div>
  );
}

export default IntelTab;
