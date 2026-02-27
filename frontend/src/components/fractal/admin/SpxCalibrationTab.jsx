/**
 * SPX CALIBRATION TAB — Admin Control Panel
 * 
 * BLOCK B6.4.1 — Calibration Run Management
 * 
 * LIGHT THEME — Matches site design
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// ═══════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════

function ProgressBar({ current, total, label }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">{label}</span>
        <span className="text-gray-700 font-mono">{current.toLocaleString()} / {total.toLocaleString()} ({pct}%)</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, subtext, color = 'text-gray-900' }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold ${color} mt-1`}>{value}</div>
      {subtext && <div className="text-xs text-gray-400 mt-1">{subtext}</div>}
    </div>
  );
}

function StateIndicator({ state }) {
  const stateConfig = {
    'IDLE': { color: 'bg-gray-400', text: 'Idle' },
    'RUNNING': { color: 'bg-green-500 animate-pulse', text: 'Running' },
    'STOPPING': { color: 'bg-amber-500', text: 'Stopping' },
    'DONE': { color: 'bg-blue-500', text: 'Done' },
    'FAILED': { color: 'bg-red-500', text: 'Failed' },
    'NOT_INITIALIZED': { color: 'bg-gray-300', text: 'Not Started' },
  };
  const cfg = stateConfig[state] || stateConfig['IDLE'];
  
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${cfg.color}`} />
      <span className="text-sm font-medium text-gray-700">{cfg.text}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function SpxCalibrationTab() {
  const [status, setStatus] = useState(null);
  const [expected, setExpected] = useState(null);
  const [coverage, setCoverage] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chunkSize, setChunkSize] = useState(500);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/spx/v2.1/admin/calibration/status`);
      const data = await res.json();
      setStatus(data.status);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const fetchExpected = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/spx/v2.1/admin/calibration/expected?presets=BALANCED&roles=USER`);
      const data = await res.json();
      setExpected(data);
    } catch (err) {
      console.error('Failed to fetch expected:', err);
    }
  }, []);

  const fetchCoverage = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/spx/v2.1/admin/calibration/coverage`);
      const data = await res.json();
      if (data.ok) setCoverage(data);
    } catch (err) {
      console.error('Failed to fetch coverage:', err);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/spx/v2.1/admin/calibration/logs?limit=20`);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchStatus(), fetchExpected(), fetchCoverage(), fetchLogs()]);
      setLoading(false);
    };
    load();
  }, [fetchStatus, fetchExpected, fetchCoverage, fetchLogs]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchStatus();
        fetchCoverage();
        fetchLogs();
      }, 5000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, fetchStatus, fetchCoverage, fetchLogs]);

  const runCalibration = async () => {
    try {
      await fetch(`${API_BASE}/api/spx/v2.1/admin/calibration/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start: '1950-01-03',
          end: '2026-02-20',
          chunkSize,
          presets: ['BALANCED'],
          roles: ['USER'],
          source: 'BOOTSTRAP'
        })
      });
      await fetchStatus();
      await fetchCoverage();
    } catch (err) {
      setError(err.message);
    }
  };

  const runContinuous = async () => {
    try {
      await fetch(`${API_BASE}/api/spx/v2.1/admin/calibration/run-continuous`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxChunks: 200,
          chunkSize
        })
      });
      await fetchStatus();
    } catch (err) {
      setError(err.message);
    }
  };

  const stopCalibration = async () => {
    try {
      await fetch(`${API_BASE}/api/spx/v2.1/admin/calibration/stop`, { method: 'POST' });
      await fetchStatus();
    } catch (err) {
      setError(err.message);
    }
  };

  const resetCalibration = async () => {
    if (!window.confirm('This will reset all calibration progress. Are you sure?')) return;
    try {
      await fetch(`${API_BASE}/api/spx/v2.1/admin/calibration/reset`, { method: 'POST' });
      await fetchStatus();
      await fetchCoverage();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading calibration status...</p>
        </div>
      </div>
    );
  }

  const state = status?.state || 'NOT_INITIALIZED';
  const isRunning = state === 'RUNNING';
  const isDone = state === 'DONE';
  
  const cursorIdx = status?.cursorIdx || 0;
  const lastIdx = status?.lastIdx || 0;
  const firstIdx = status?.firstIdx || 0;
  const totalDays = lastIdx - firstIdx + 1;
  const processedDays = cursorIdx - firstIdx;

  const writtenSnapshots = status?.writtenSnapshots || 0;
  const writtenOutcomes = status?.writtenOutcomes || 0;
  const expectedSnaps = expected?.totals?.expectedSnapshots || 0;
  const expectedOuts = expected?.totals?.expectedOutcomes || 0;

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6" data-testid="spx-calibration-tab">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">SPX Calibration</h2>
          <p className="text-sm text-gray-500">BLOCK B6.4 — Historical Data Generation</p>
        </div>
        <StateIndicator state={state} />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
          Error: {error}
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Chunk Size:</span>
            <select 
              value={chunkSize}
              onChange={(e) => setChunkSize(Number(e.target.value))}
              disabled={isRunning}
              className="px-3 py-1 text-sm bg-white text-gray-700 border border-gray-300 rounded"
            >
              <option value={50}>50 (Safe)</option>
              <option value={100}>100 (Normal)</option>
              <option value={250}>250 (Fast)</option>
              <option value={500}>500 (Aggressive)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
              <input 
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300"
              />
              Auto-refresh (5s)
            </label>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            {!isRunning && (
              <>
                <button
                  onClick={runCalibration}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                  data-testid="run-calibration-btn"
                >
                  {isDone || state === 'NOT_INITIALIZED' ? 'Start' : 'Resume'}
                </button>
                <button
                  onClick={runContinuous}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                  data-testid="run-continuous-btn"
                >
                  Run to 100K
                </button>
              </>
            )}
            
            {isRunning && (
              <button
                onClick={stopCalibration}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors shadow-sm"
                data-testid="stop-calibration-btn"
              >
                Stop
              </button>
            )}

            <button
              onClick={resetCalibration}
              disabled={isRunning}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="reset-calibration-btn"
            >
              Reset
            </button>

            <button
              onClick={() => { fetchStatus(); fetchLogs(); }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Progress</h3>
        
        <ProgressBar 
          current={processedDays} 
          total={totalDays} 
          label="Trading Days Processed" 
        />
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <StatCard 
            label="Snapshots Written" 
            value={writtenSnapshots.toLocaleString()}
            subtext={`Expected: ${expectedSnaps.toLocaleString()}`}
            color="text-blue-600"
          />
          <StatCard 
            label="Outcomes Resolved" 
            value={writtenOutcomes.toLocaleString()}
            subtext={`Expected: ${expectedOuts.toLocaleString()}`}
            color="text-emerald-600"
          />
          <StatCard 
            label="Skipped (No History)" 
            value={(status?.skippedNoHistory || 0).toLocaleString()}
            color="text-gray-500"
          />
          <StatCard 
            label="Skipped (No Outcome)" 
            value={(status?.skippedNoOutcome || 0).toLocaleString()}
            color="text-gray-500"
          />
        </div>
      </div>

      {/* Epoch Coverage */}
      {coverage && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Epoch Coverage (B6.4.6)</h3>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">Total: {coverage.totalOutcomes?.toLocaleString()} outcomes</span>
              <span className={`px-2 py-0.5 rounded-full font-medium ${
                coverage.completionStatus === 'COMPLETE' ? 'bg-green-100 text-green-700' :
                coverage.completionStatus === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {coverage.completionStatus}
              </span>
            </div>
          </div>
          
          {/* Decade bars */}
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-2 mb-4">
            {(coverage.byDecade || []).map(d => {
              const getCoverageColor = (pct) => {
                if (pct >= 95) return 'bg-emerald-500';
                if (pct >= 70) return 'bg-amber-400';
                if (pct > 0) return 'bg-red-400';
                return 'bg-gray-200';
              };
              
              return (
                <div key={d.decade} className="text-center">
                  <div className="text-xs font-medium text-gray-600 mb-1">{d.decade}</div>
                  <div className="h-8 bg-gray-100 rounded relative overflow-hidden">
                    <div 
                      className={`absolute bottom-0 left-0 right-0 ${getCoverageColor(d.coverage)} transition-all`}
                      style={{ height: `${Math.min(d.coverage, 100)}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-800">
                      {d.coverage}%
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{d.count.toLocaleString()}</div>
                </div>
              );
            })}
          </div>

          {/* Horizon breakdown */}
          <div className="border-t border-gray-100 pt-3 mt-3">
            <div className="text-xs font-medium text-gray-500 mb-2">By Horizon</div>
            <div className="flex flex-wrap gap-2">
              {(coverage.byHorizon || []).map(h => (
                <span key={h.horizon} className="px-2 py-1 bg-gray-100 rounded text-xs">
                  <span className="font-medium text-gray-700">{h.horizon}:</span>{' '}
                  <span className="text-gray-500">{h.count.toLocaleString()}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Cohort breakdown */}
          <div className="border-t border-gray-100 pt-3 mt-3">
            <div className="text-xs font-medium text-gray-500 mb-2">By Cohort</div>
            <div className="flex flex-wrap gap-2">
              {(coverage.byCohort || []).map(c => (
                <span key={c.cohort} className={`px-2 py-1 rounded text-xs ${
                  c.cohort === 'LIVE' ? 'bg-green-100 text-green-700' :
                  c.cohort === 'V2020' ? 'bg-blue-100 text-blue-700' :
                  c.cohort === 'V2008' ? 'bg-amber-100 text-amber-700' :
                  c.cohort === 'V1990' ? 'bg-purple-100 text-purple-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  <span className="font-medium">{c.cohort}:</span>{' '}
                  {c.count.toLocaleString()}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Expected Counts */}
      {expected && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Expected Counts by Horizon</h3>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {Object.entries(expected.byHorizon || {}).map(([horizon, data]) => (
              <div key={horizon} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="text-sm font-semibold text-gray-700">{horizon}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Days: {data.validAsOfDays?.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  Outcomes: {data.expectedOutcomes?.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Logs</h3>
        <div className="max-h-64 overflow-y-auto space-y-1 font-mono text-xs bg-gray-50 rounded-lg p-3">
          {logs.length === 0 && (
            <div className="text-gray-400">No logs yet</div>
          )}
          {logs.map((log, i) => (
            <div 
              key={i}
              className={`py-1 px-2 rounded ${
                log.level === 'ERROR' ? 'bg-red-100 text-red-700' :
                log.level === 'WARN' ? 'bg-amber-100 text-amber-700' :
                'bg-white text-gray-600 border border-gray-100'
              }`}
            >
              <span className="text-gray-400">{log.ts?.slice(11, 19) || ''}</span>
              {' '}
              <span className="font-semibold">[{log.level}]</span>
              {' '}
              {log.msg}
              {log.extra && <span className="text-gray-400"> {JSON.stringify(log.extra).slice(0, 100)}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-gray-400 space-y-1 bg-white rounded-lg border border-gray-200 p-4">
        <p>• <strong>Range:</strong> {status?.range?.start || '1950-01-03'} → {status?.range?.end || '2026-02-20'}</p>
        <p>• <strong>Total Candles:</strong> {expected?.D?.toLocaleString() || 19155}</p>
        <p>• <strong>Source:</strong> BOOTSTRAP (historical calibration)</p>
        <p>• <strong>Note:</strong> Outcomes grow slowly at first, then accelerate as horizons mature</p>
      </div>
    </div>
  );
}
