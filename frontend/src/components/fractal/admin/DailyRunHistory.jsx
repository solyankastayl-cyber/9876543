/**
 * BLOCK 80.1 — Daily Run History Table
 * 
 * Shows history of job runs with expandable details.
 */

import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

function StatusBadge({ status }) {
  const colors = {
    SUCCESS: 'bg-green-100 text-green-700',
    FAILED: 'bg-red-100 text-red-700',
    RUNNING: 'bg-blue-100 text-blue-700',
    CANCELLED: 'bg-gray-100 text-gray-500',
  };
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.CANCELLED}`}>
      {status}
    </span>
  );
}

function TriggerBadge({ trigger }) {
  const colors = {
    MANUAL: 'bg-purple-100 text-purple-700',
    CRON: 'bg-blue-100 text-blue-700',
  };
  
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[trigger] || ''}`}>
      {trigger}
    </span>
  );
}

function ExpandedRow({ run }) {
  if (!run.steps?.length) {
    return <div className="text-sm text-gray-500 py-2">No step details available</div>;
  }
  
  return (
    <div className="bg-gray-50 p-3 space-y-2">
      <div className="text-xs text-gray-500 uppercase mb-2">Steps</div>
      {run.steps.map((step, i) => (
        <div key={i} className="flex items-center justify-between text-xs py-1 px-2 bg-white rounded">
          <div className="flex items-center gap-2">
            <span className={step.status === 'SUCCESS' ? 'text-green-600' : step.status === 'FAILED' ? 'text-red-600' : 'text-gray-400'}>
              {step.status === 'SUCCESS' ? '✓' : step.status === 'FAILED' ? '✗' : '○'}
            </span>
            <span>{step.name}</span>
          </div>
          <div className="flex items-center gap-4">
            {step.count !== undefined && (
              <span className="text-gray-500">Count: {step.count}</span>
            )}
            {step.durationMs > 0 && (
              <span className="text-gray-500">{step.durationMs}ms</span>
            )}
          </div>
        </div>
      ))}
      
      {run.summary && (
        <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-gray-500">Snapshots:</span>
            <span className="ml-1 font-medium">{run.summary.snapshotsWritten || 0}</span>
          </div>
          <div>
            <span className="text-gray-500">Outcomes:</span>
            <span className="ml-1 font-medium">{run.summary.outcomesResolved || 0}</span>
          </div>
          <div>
            <span className="text-gray-500">Alerts:</span>
            <span className="ml-1 font-medium">{run.summary.alertsSent || 0}</span>
          </div>
        </div>
      )}
      
      {run.error && (
        <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
          <div className="font-medium">Error: {run.error.code}</div>
          <div>{run.error.message}</div>
        </div>
      )}
    </div>
  );
}

export function DailyRunHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRun, setExpandedRun] = useState(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/fractal/v2.1/admin/ops/daily-run/history?limit=20`);
      const data = await res.json();
      if (data.ok) {
        setHistory(data.history || []);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (ms) => {
    if (!ms) return '-';
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-100 rounded"></div>
          <div className="h-10 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden" data-testid="daily-run-history">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-800 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white">Run History</h3>
          <p className="text-xs text-slate-400">{history.length} runs</p>
        </div>
        <button
          onClick={fetchHistory}
          className="px-3 py-1 bg-slate-600 text-white text-sm rounded hover:bg-slate-500"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-50 text-red-600 text-sm">{error}</div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Run ID</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Trigger</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {history.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                  No runs yet
                </td>
              </tr>
            ) : (
              history.map((run) => (
                <React.Fragment key={run.runId}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{run.runId?.slice(0, 20)}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{formatDate(run.startedAt)}</td>
                    <td className="px-4 py-3"><TriggerBadge trigger={run.trigger} /></td>
                    <td className="px-4 py-3 text-xs font-mono">{formatDuration(run.durationMs)}</td>
                    <td className="px-4 py-3"><StatusBadge status={run.status} /></td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpandedRun(expandedRun === run.runId ? null : run.runId)}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        {expandedRun === run.runId ? 'Hide' : 'Details'}
                      </button>
                    </td>
                  </tr>
                  {expandedRun === run.runId && (
                    <tr>
                      <td colSpan="6" className="px-4 py-2">
                        <ExpandedRow run={run} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DailyRunHistory;
