/**
 * SPX Admin Tab — Data Foundation Overview
 * 
 * BLOCK B1-B4 — SPX Data Management Panel
 */

import React, { useState, useEffect } from 'react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

export default function SpxAdminTab() {
  const [stats, setStats] = useState(null);
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastAction, setLastAction] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, validRes] = await Promise.all([
        fetch(`${API_BASE}/api/spx/v2.1/stats`),
        fetch(`${API_BASE}/api/fractal/v2.1/admin/spx/validate`),
      ]);
      
      const statsData = await statsRes.json();
      const validData = await validRes.json();
      
      setStats(statsData);
      setValidation(validData);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleIngest = async () => {
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE}/api/fractal/v2.1/admin/spx/ingest`, {
        method: 'POST',
      });
      const data = await res.json();
      setLastAction({ type: 'ingest', ...data });
      await fetchData();
    } catch (e) {
      setLastAction({ type: 'ingest', ok: false, error: e.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateMock = async (from, to) => {
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE}/api/fractal/v2.1/admin/spx/generate-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to }),
      });
      const data = await res.json();
      setLastAction({ type: 'generate', ...data });
      await fetchData();
    } catch (e) {
      setLastAction({ type: 'generate', ok: false, error: e.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleIngestCsv = async (replace = false) => {
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE}/api/fractal/v2.1/admin/spx/ingest-csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replace }),
      });
      const data = await res.json();
      setLastAction({ type: 'csv', ...data });
      await fetchData();
    } catch (e) {
      setLastAction({ type: 'csv', ok: false, error: e.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnsureIndexes = async () => {
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE}/api/fractal/v2.1/admin/spx/indexes`, {
        method: 'POST',
      });
      const data = await res.json();
      setLastAction({ type: 'indexes', ...data });
    } catch (e) {
      setLastAction({ type: 'indexes', ok: false, error: e.message });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const cohortOrder = ['V1950', 'V1990', 'V2008', 'V2020', 'LIVE'];
  const cohortColors = {
    V1950: 'bg-slate-500',
    V1990: 'bg-indigo-500',
    V2008: 'bg-amber-500',
    V2020: 'bg-emerald-500',
    LIVE: 'bg-green-500',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">SPX Data Foundation</h2>
          <p className="text-sm text-gray-500">BLOCK B1-B4 — S&P 500 Historical Data</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded">BUILDING</span>
          <button
            onClick={fetchData}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            title="Refresh"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Total Candles</div>
          <div className="text-2xl font-bold text-gray-900">
            {stats?.count?.toLocaleString() || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Date Range</div>
          <div className="text-sm font-medium text-gray-900">
            {stats?.range?.from || '—'} → {stats?.range?.to || '—'}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Data Quality</div>
          <div className={`text-lg font-bold ${validation?.ok ? 'text-emerald-600' : 'text-red-600'}`}>
            {validation?.ok ? '✓ Valid' : '⚠ Issues'}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Cohorts</div>
          <div className="text-lg font-bold text-gray-900">
            {Object.keys(stats?.cohorts || {}).length}
          </div>
        </div>
      </div>

      {/* Cohort Distribution */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Cohort Distribution</h3>
        <div className="space-y-2">
          {cohortOrder.map(cohort => {
            const count = stats?.cohorts?.[cohort] || 0;
            const total = stats?.count || 1;
            const pct = ((count / total) * 100).toFixed(1);
            
            return (
              <div key={cohort} className="flex items-center gap-3">
                <div className="w-16 text-xs font-medium text-gray-600">{cohort}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full ${cohortColors[cohort]} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="w-20 text-xs text-gray-500 text-right">
                  {count.toLocaleString()} ({pct}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Validation Details */}
      {validation && !validation.ok && (
        <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
          <h3 className="text-sm font-medium text-amber-800 mb-2">Validation Issues</h3>
          <ul className="text-sm text-amber-700 space-y-1">
            {validation.issues?.map((issue, i) => (
              <li key={i}>• {issue}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Data Actions</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleIngestCsv(true)}
            disabled={actionLoading}
            className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            title="Load real SPX data from yfinance CSV file"
          >
            {actionLoading ? 'Loading...' : 'Load from CSV (Real Data)'}
          </button>
          <button
            onClick={handleIngest}
            disabled={actionLoading}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {actionLoading ? 'Loading...' : 'Ingest from Stooq/Yahoo'}
          </button>
          <button
            onClick={() => handleGenerateMock('2020-01-01', '2025-12-31')}
            disabled={actionLoading}
            className="px-4 py-2 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
          >
            Generate Mock (2020-2025)
          </button>
          <button
            onClick={handleEnsureIndexes}
            disabled={actionLoading}
            className="px-4 py-2 text-sm font-medium bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            Ensure Indexes
          </button>
        </div>

        {/* Last action result */}
        {lastAction && (
          <div className={`mt-3 p-3 rounded ${lastAction.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            <div className="text-sm font-medium">
              {lastAction.type === 'ingest' && 'Ingest Result'}
              {lastAction.type === 'generate' && 'Generate Result'}
              {lastAction.type === 'indexes' && 'Index Result'}
              {lastAction.type === 'csv' && 'CSV Import Result'}
            </div>
            <div className="text-xs mt-1">
              {lastAction.ok 
                ? JSON.stringify({ written: lastAction.written, skipped: lastAction.skipped, source: lastAction.source })
                : lastAction.error
              }
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="text-xs text-gray-400 space-y-1">
        <p>• <strong>Load from CSV</strong>: Imports real SPX data from yfinance CSV file (/app/data/spx_1950_2025.csv)</p>
        <p>• <strong>Ingest from Stooq/Yahoo</strong>: Fetches data via API (may be rate-limited)</p>
        <p>• <strong>Generate Mock</strong>: Creates synthetic data for development</p>
        <p>• Cohorts: V1950 (1950-1989), V1990 (1990-2007), V2008 (2008-2019), V2020 (2020-2025), LIVE (2026+)</p>
      </div>
    </div>
  );
}
