/**
 * BLOCK 77.5 — Backfill Progress Panel
 * BLOCK 77.6 — VINTAGE Cohort Support (V2014, V2020)
 * 
 * Real-time monitoring of institutional backfill.
 * Shows batch progress, stats, and controls for both cohorts.
 */

import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

const COHORTS = [
  { id: 'V2020', label: '2020-2025', years: { start: 2020, end: 2025 }, color: 'blue' },
  { id: 'V2014', label: '2014-2019 (VINTAGE)', years: { start: 2014, end: 2019 }, color: 'purple' },
];

function formatNumber(n) {
  return n?.toLocaleString() || '0';
}

function StatusBadge({ status }) {
  const colors = {
    RUNNING: 'bg-blue-100 text-blue-800 border-blue-300',
    COMPLETED: 'bg-green-100 text-green-800 border-green-300',
    FAILED: 'bg-red-100 text-red-800 border-red-300',
    PAUSED: 'bg-amber-100 text-amber-800 border-amber-300',
    PENDING: 'bg-gray-100 text-gray-800 border-gray-300',
    DONE: 'bg-green-100 text-green-800 border-green-300',
  };
  
  return (
    <span className={`px-2 py-1 text-xs font-bold rounded border ${colors[status] || colors.PENDING}`}>
      {status}
    </span>
  );
}

function CohortBadge({ cohort }) {
  const colors = {
    'V2014': 'bg-purple-100 text-purple-800 border-purple-300',
    'V2020': 'bg-blue-100 text-blue-800 border-blue-300',
    'LIVE': 'bg-green-100 text-green-800 border-green-300',
  };
  
  return (
    <span className={`px-2 py-1 text-xs font-bold rounded border ${colors[cohort] || colors.V2020}`}>
      {cohort}
    </span>
  );
}

export function BackfillProgressPanel() {
  const [progress, setProgress] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState('V2020');
  const [error, setError] = useState(null);
  
  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/fractal/v2.1/admin/backfill/progress`);
      const data = await res.json();
      setProgress(data.progress);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/fractal/v2.1/admin/backfill/stats`);
      const data = await res.json();
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);
  
  const startBackfill = async (cohortId) => {
    const cohort = COHORTS.find(c => c.id === cohortId);
    if (!cohort) return;
    
    setStarting(true);
    try {
      const res = await fetch(`${API_BASE}/api/fractal/v2.1/admin/backfill/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cohort: cohort.id,
          rangeTag: cohort.label.split(' ')[0],
          yearStart: cohort.years.start,
          yearEnd: cohort.years.end,
          chunkSize: 1000,
          throttleMs: 50,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        fetchProgress();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setStarting(false);
    }
  };
  
  const stopBackfill = async () => {
    try {
      await fetch(`${API_BASE}/api/fractal/v2.1/admin/backfill/stop`, {
        method: 'POST',
      });
      fetchProgress();
    } catch (err) {
      setError(err.message);
    }
  };
  
  const resumeBackfill = async () => {
    if (!progress?.jobId) return;
    try {
      await fetch(`${API_BASE}/api/fractal/v2.1/admin/backfill/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: progress.jobId }),
      });
      fetchProgress();
    } catch (err) {
      setError(err.message);
    }
  };
  
  useEffect(() => {
    fetchProgress();
    fetchStats();
    
    // Auto-refresh when running
    const interval = setInterval(() => {
      fetchProgress();
      fetchStats();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [fetchProgress, fetchStats]);
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">Loading backfill status...</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4" data-testid="backfill-progress-panel">
      {/* Header with Cohort Selector */}
      <div className="bg-slate-900 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">BLOCK 77.5/77.6 — Institutional Backfill</h2>
            <p className="text-slate-400 text-sm">Historical Data Engine with Cohort Isolation</p>
          </div>
        </div>
        
        {/* Cohort Buttons */}
        <div className="flex gap-3">
          {COHORTS.map(cohort => {
            const cohortStats = stats?.byCohort?.[cohort.id];
            const isRunning = progress?.cohort === cohort.id && progress?.status === 'RUNNING';
            const isCompleted = cohortStats?.outcomes > 0;
            
            return (
              <div
                key={cohort.id}
                className={`flex-1 rounded-lg p-3 border-2 cursor-pointer transition-all ${
                  selectedCohort === cohort.id
                    ? cohort.color === 'purple'
                      ? 'border-purple-500 bg-purple-900/30'
                      : 'border-blue-500 bg-blue-900/30'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
                onClick={() => setSelectedCohort(cohort.id)}
                data-testid={`cohort-card-${cohort.id.toLowerCase()}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white">{cohort.id}</span>
                  {isRunning && <span className="text-xs text-blue-400 animate-pulse">RUNNING</span>}
                  {!isRunning && isCompleted && <span className="text-xs text-green-400">READY</span>}
                  {!isRunning && !isCompleted && <span className="text-xs text-slate-500">EMPTY</span>}
                </div>
                <div className="text-sm text-slate-400">{cohort.label}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {cohortStats ? `${formatNumber(cohortStats.outcomes)} outcomes` : 'No data'}
                </div>
                
                {/* Start button for this cohort */}
                {!isRunning && !isCompleted && (
                  <button
                    onClick={(e) => { e.stopPropagation(); startBackfill(cohort.id); }}
                    disabled={starting || (progress?.status === 'RUNNING')}
                    className={`mt-2 w-full px-3 py-1.5 text-xs font-medium rounded ${
                      cohort.color === 'purple'
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    } disabled:opacity-50`}
                    data-testid={`start-${cohort.id.toLowerCase()}-btn`}
                  >
                    {starting ? 'Starting...' : `Start ${cohort.id}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-3 text-red-700 text-sm">
          {error}
        </div>
      )}
      
      {/* Progress */}
      {progress && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <StatusBadge status={progress.status} />
              <CohortBadge cohort={progress.cohort} />
              <span className="text-sm text-gray-500">Job: {progress.jobId}</span>
            </div>
            <div className="flex items-center gap-3">
              {progress.estimatedRemaining && (
                <span className="text-sm text-gray-500">ETA: {progress.estimatedRemaining}</span>
              )}
              {progress.status === 'RUNNING' && (
                <button
                  onClick={stopBackfill}
                  className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
                  data-testid="stop-backfill-btn"
                >
                  Stop
                </button>
              )}
              {(progress.status === 'PAUSED' || progress.status === 'FAILED') && (
                <button
                  onClick={resumeBackfill}
                  className="px-3 py-1 bg-amber-600 text-white rounded text-xs font-medium hover:bg-amber-700"
                  data-testid="resume-backfill-btn"
                >
                  Resume
                </button>
              )}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">
                {progress.completedBatches} / {progress.totalBatches} batches
              </span>
              <span className="font-medium text-blue-600">{progress.percentComplete}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress.percentComplete || 0}%` }}
              />
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 uppercase">Current Batch</div>
              <div className="text-lg font-bold text-gray-900">{progress.currentBatch || '—'}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-xs text-blue-600 uppercase">Snapshots</div>
              <div className="text-lg font-bold text-blue-900">{formatNumber(progress.totalSnapshots)}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-xs text-green-600 uppercase">Outcomes</div>
              <div className="text-lg font-bold text-green-900">{formatNumber(progress.totalOutcomes)}</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-xs text-purple-600 uppercase">Started</div>
              <div className="text-sm font-medium text-purple-900">
                {progress.startedAt ? new Date(progress.startedAt).toLocaleString() : '—'}
              </div>
            </div>
          </div>
          
          {/* Batch Grid */}
          {progress.batches && progress.batches.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Quarterly Batches</div>
              <div className="grid grid-cols-6 md:grid-cols-12 gap-1">
                {progress.batches.map((batch) => (
                  <div
                    key={batch.rangeId}
                    className={`text-xs p-1 rounded text-center ${
                      batch.status === 'DONE' ? 'bg-green-100 text-green-800' :
                      batch.status === 'RUNNING' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                      batch.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-600'
                    }`}
                    title={`${batch.rangeId}: ${batch.status}`}
                  >
                    {batch.rangeId.split('-')[0].slice(2)}Q{batch.rangeId.split('-')[1].slice(1)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Overall Stats */}
      {stats && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Bootstrap Data Summary</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <div className="text-xs text-gray-500 uppercase">Total Snapshots</div>
              <div className="text-xl font-bold text-gray-900">{formatNumber(stats.totalSnapshots)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase">Total Outcomes</div>
              <div className="text-xl font-bold text-gray-900">{formatNumber(stats.totalOutcomes)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase">Hit Rate</div>
              <div className="text-xl font-bold text-emerald-600">{stats.hitRatePct}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase">Avg Return</div>
              <div className="text-xl font-bold text-blue-600">{stats.avgReturnPct}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase">Date Range</div>
              <div className="text-sm font-medium text-gray-700">
                {stats.dateRange?.earliest || '—'} → {stats.dateRange?.latest || '—'}
              </div>
            </div>
          </div>
          
          {/* BLOCK 77.6: By Cohort Breakdown */}
          {stats.byCohort && Object.keys(stats.byCohort).length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-medium text-gray-500 uppercase mb-2">By Cohort</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(stats.byCohort).sort().map(([cohort, data]) => (
                  <div 
                    key={cohort} 
                    className={`rounded-lg p-3 border ${
                      cohort === 'V2014' 
                        ? 'bg-purple-50 border-purple-200' 
                        : cohort === 'V2020' 
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-green-50 border-green-200'
                    }`}
                    data-testid={`cohort-stats-${cohort.toLowerCase()}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <CohortBadge cohort={cohort} />
                    </div>
                    <div className="text-lg font-bold text-gray-900">{formatNumber(data.outcomes)} outcomes</div>
                    <div className="text-xs text-gray-500">
                      Hit Rate: {(data.hitRate * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* By Year Breakdown */}
          {stats.byYear && Object.keys(stats.byYear).length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-medium text-gray-500 uppercase mb-2">By Year</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.byYear).sort().map(([year, data]) => (
                  <div key={year} className="bg-gray-50 rounded px-3 py-1 text-sm">
                    <span className="font-medium">{year}:</span>{' '}
                    <span className="text-gray-600">{formatNumber(data.outcomes)} outcomes</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BackfillProgressPanel;
