/**
 * BLOCK 78.5 — Governance Lock Card
 * 
 * Displays LIVE-only APPLY enforcement status.
 * Shows why APPLY might be blocked and what's required.
 */

import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// ═══════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════

function LockStatusBadge({ canApply }) {
  if (canApply) {
    return (
      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-1">
        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
        UNLOCKED
      </span>
    );
  }
  return (
    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium flex items-center gap-1">
      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
      LOCKED
    </span>
  );
}

function CheckItem({ label, pass, value, required }) {
  return (
    <div className={`flex items-center justify-between py-2 px-3 rounded-lg ${
      pass ? 'bg-green-50' : 'bg-red-50'
    }`}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{pass ? '✅' : '❌'}</span>
        <span className={`text-sm font-medium ${pass ? 'text-green-700' : 'text-red-700'}`}>
          {label}
        </span>
      </div>
      <div className="text-sm text-gray-600">
        {value !== undefined && (
          <span>
            {typeof value === 'number' ? value.toLocaleString() : String(value)}
            {required !== undefined && (
              <span className="text-gray-400"> / {required}</span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function GovernanceLockCard() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/fractal/v2.1/admin/governance/lock/status?symbol=BTC`);
      const data = await res.json();
      if (data.ok) {
        setStatus(data);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch lock status');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-10 bg-gray-100 rounded"></div>
            <div className="h-10 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-4">
        <div className="text-red-600 text-sm">{error}</div>
        <button 
          onClick={fetchStatus}
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const { canApply, reasons, lockDetails } = status || {};

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden" data-testid="governance-lock-card">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-900 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white">BLOCK 78.5 — Governance Lock</h3>
          <p className="text-xs text-slate-400">LIVE-only APPLY Enforcement</p>
        </div>
        <LockStatusBadge canApply={canApply} />
      </div>

      {/* Lock Details */}
      <div className="p-4 space-y-2">
        <CheckItem 
          label="LIVE Samples ≥ 30" 
          pass={lockDetails?.liveSamples >= lockDetails?.minRequired}
          value={lockDetails?.liveSamples}
          required={lockDetails?.minRequired}
        />
        <CheckItem 
          label="Source = LIVE" 
          pass={lockDetails?.isLiveOnly}
          value={lockDetails?.isLiveOnly ? 'LIVE' : 'BOOTSTRAP'}
        />
        <CheckItem 
          label="Drift Severity < CRITICAL" 
          pass={lockDetails?.driftSeverity !== 'CRITICAL'}
          value={lockDetails?.driftSeverity || 'N/A'}
        />
        <CheckItem 
          label="Contract Hash Match" 
          pass={lockDetails?.contractHashMatch}
          value={lockDetails?.contractHashMatch ? 'v2.1.0' : 'MISMATCH'}
        />
      </div>

      {/* Block Reasons */}
      {reasons && reasons.length > 0 && (
        <div className="px-4 pb-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="text-xs text-amber-600 uppercase font-medium mb-1">
              Apply Blocked
            </div>
            <ul className="text-sm text-amber-700 space-y-1">
              {reasons.map((reason, i) => (
                <li key={i}>• {reason}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Apply Status */}
      <div className={`px-4 py-3 ${canApply ? 'bg-green-50' : 'bg-red-50'} border-t`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{canApply ? '🔓' : '🔒'}</span>
          <span className={`font-medium ${canApply ? 'text-green-700' : 'text-red-700'}`}>
            {canApply 
              ? 'APPLY is allowed — governance checks passed' 
              : 'APPLY is blocked — resolve issues above'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default GovernanceLockCard;
