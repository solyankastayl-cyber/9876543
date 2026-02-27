/**
 * BLOCK 80.1 — Daily Run Control Card
 * 
 * Toggle enable/disable, Run Now, status display.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

function StatusBadge({ status, isRunning }) {
  if (isRunning) {
    return (
      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center gap-2">
        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
        RUNNING
      </span>
    );
  }
  
  const colors = {
    SUCCESS: 'bg-green-100 text-green-700',
    FAILED: 'bg-red-100 text-red-700',
    SKIPPED: 'bg-gray-100 text-gray-700',
    NEVER: 'bg-gray-100 text-gray-500',
  };
  
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status] || colors.NEVER}`}>
      {status || 'NEVER'}
    </span>
  );
}

function StepItem({ step }) {
  const icons = {
    SUCCESS: '✓',
    FAILED: '✗',
    SKIPPED: '○',
  };
  
  const colors = {
    SUCCESS: 'text-green-600',
    FAILED: 'text-red-600',
    SKIPPED: 'text-gray-400',
  };
  
  return (
    <div className="flex items-center justify-between py-1 text-xs">
      <div className="flex items-center gap-2">
        <span className={colors[step.status] || colors.SKIPPED}>
          {icons[step.status] || '○'}
        </span>
        <span className="text-gray-700">{step.name}</span>
      </div>
      {step.count !== undefined && (
        <span className="text-gray-500">({step.count})</span>
      )}
    </div>
  );
}

export function DailyRunCard() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const pollingRef = useRef(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/fractal/v2.1/admin/ops/daily-run/status`);
      const data = await res.json();
      if (data.ok) {
        setStatus(data);
        setError(null);
        
        // Stop polling if not running
        if (!data.isRunning && pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
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
    fetchStatus();
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [fetchStatus]);

  const startPolling = () => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(fetchStatus, 2000);
  };

  const handleEnable = async () => {
    setActionLoading('enable');
    try {
      const res = await fetch(`${API_BASE}/api/fractal/v2.1/admin/ops/daily-run/enable`, {
        method: 'POST',
      });
      await res.json();
      await fetchStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisable = async () => {
    setActionLoading('disable');
    try {
      const res = await fetch(`${API_BASE}/api/fractal/v2.1/admin/ops/daily-run/disable`, {
        method: 'POST',
      });
      await res.json();
      await fetchStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRunNow = async () => {
    setActionLoading('run');
    startPolling();
    try {
      const res = await fetch(`${API_BASE}/api/fractal/v2.1/admin/ops/daily-run/run-now`, {
        method: 'POST',
      });
      const data = await res.json();
      
      if (data.ok) {
        // Will be updated by polling
      } else if (data.status === 'ALREADY_RUNNING') {
        alert('Daily run is already in progress');
      } else {
        alert(`Run failed: ${data.error || 'Unknown error'}`);
      }
      
      await fetchStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  };

  const formatDuration = (ms) => {
    if (!ms) return '-';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden" data-testid="daily-run-card">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-900 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white">BLOCK 80.1 — Daily Run Control</h3>
          <p className="text-xs text-slate-400">BTC Intelligence Pipeline</p>
        </div>
        <StatusBadge status={status?.lastStatus} isRunning={status?.isRunning} />
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-50 text-red-600 text-sm">{error}</div>
      )}

      {/* Status Info */}
      <div className="p-4 grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-gray-500 uppercase mb-1">Scheduler</div>
          <div className={`text-lg font-medium ${status?.enabled ? 'text-green-600' : 'text-gray-400'}`}>
            {status?.enabled ? 'ENABLED' : 'DISABLED'}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase mb-1">Schedule</div>
          <div className="text-lg font-mono">{status?.scheduleUtc || '00:10'} UTC</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase mb-1">Last Run</div>
          <div className="text-sm">{formatDate(status?.lastRunAt)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase mb-1">Duration</div>
          <div className="text-sm font-mono">{formatDuration(status?.lastDurationMs)}</div>
        </div>
        {status?.enabled && status?.nextRunAt && (
          <div className="col-span-2">
            <div className="text-xs text-gray-500 uppercase mb-1">Next Run</div>
            <div className="text-sm text-blue-600">{formatDate(status?.nextRunAt)}</div>
          </div>
        )}
      </div>

      {/* Last Run Summary */}
      {status?.lastSummary?.steps?.length > 0 && (
        <div className="px-4 pb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 uppercase mb-2">Last Run Steps</div>
            {status.lastSummary.steps.map((step, i) => (
              <StepItem key={i} step={step} />
            ))}
          </div>
        </div>
      )}

      {/* Last Error */}
      {status?.lastError?.message && (
        <div className="px-4 pb-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="text-xs text-red-600 uppercase mb-1">Last Error</div>
            <div className="text-sm text-red-700">{status.lastError.message}</div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 bg-gray-50 border-t flex items-center gap-3">
        <button
          onClick={handleRunNow}
          disabled={actionLoading || status?.isRunning}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {actionLoading === 'run' || status?.isRunning ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Running...
            </>
          ) : (
            <>▶ Run Now</>
          )}
        </button>
        
        {status?.enabled ? (
          <button
            onClick={handleDisable}
            disabled={actionLoading}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
          >
            {actionLoading === 'disable' ? 'Disabling...' : 'Disable'}
          </button>
        ) : (
          <button
            onClick={handleEnable}
            disabled={actionLoading}
            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50"
          >
            {actionLoading === 'enable' ? 'Enabling...' : 'Enable Scheduler'}
          </button>
        )}
        
        <button
          onClick={fetchStatus}
          className="px-3 py-2 text-gray-500 hover:text-gray-700"
        >
          ↻ Refresh
        </button>
      </div>
    </div>
  );
}

export default DailyRunCard;
