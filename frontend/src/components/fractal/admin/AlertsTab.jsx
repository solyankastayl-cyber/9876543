/**
 * BLOCK 68 — Alerts Tab
 * 
 * Unified language: English titles/metrics, Russian tooltips
 */

import React, { useState, useEffect, useCallback } from 'react';
import { InfoTooltip, FRACTAL_TOOLTIPS } from './InfoTooltip';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// Level badge colors
const LEVEL_COLORS = {
  INFO: { bg: 'bg-gray-100', text: 'text-gray-700' },
  HIGH: { bg: 'bg-orange-100', text: 'text-orange-700' },
  CRITICAL: { bg: 'bg-red-100', text: 'text-red-700' }
};

const BLOCKED_COLORS = {
  NONE: { bg: 'bg-green-100', text: 'text-green-700' },
  QUOTA: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  COOLDOWN: { bg: 'bg-blue-100', text: 'text-blue-700' },
  DEDUP: { bg: 'bg-purple-100', text: 'text-purple-700' },
  BATCH_SUPPRESSED: { bg: 'bg-gray-100', text: 'text-gray-700' }
};

export default function AlertsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [levelFilter, setLevelFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [blockedFilter, setBlockedFilter] = useState('');
  
  // Test alert loading
  const [testLoading, setTestLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (levelFilter) params.set('level', levelFilter);
      if (typeFilter) params.set('type', typeFilter);
      if (blockedFilter) params.set('blockedBy', blockedFilter);
      params.set('limit', '50');
      
      const response = await fetch(`${API_BASE}/api/fractal/v2.1/admin/alerts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch alerts');
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [levelFilter, typeFilter, blockedFilter]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const sendTestAlert = async () => {
    try {
      setTestLoading(true);
      const response = await fetch(`${API_BASE}/api/fractal/v2.1/admin/alerts/test`, {
        method: 'POST'
      });
      const result = await response.json();
      if (result.ok) {
        alert('Test alert sent successfully!');
        fetchData();
      } else {
        alert(`Failed to send test alert: ${result.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setTestLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center p-6 bg-red-50 rounded-xl border border-red-200">
          <p className="text-red-600 font-medium mb-2">Error loading alerts</p>
          <p className="text-red-500 text-sm">{error}</p>
          <button 
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { items = [], quota = {}, stats = {} } = data || {};

  return (
    <div className="space-y-6">
      {/* Header Row: Quota + Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Quota Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">ALERT QUOTA (24H)</h3>
              <InfoTooltip {...FRACTAL_TOOLTIPS.alertQuota} placement="right" />
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
              quota.remaining === 0 ? 'bg-red-100 text-red-700' :
              quota.remaining === 1 ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {quota.remaining === 0 ? 'EXHAUSTED' : `${quota.remaining} REMAINING`}
            </span>
          </div>
          <div className="text-4xl font-black text-gray-900 mb-1">
            {quota.used || 0} / {quota.max || 3}
          </div>
          <p className="text-xs text-gray-500 uppercase">
            INFO/HIGH used • CRITICAL unlimited
          </p>
        </div>

        {/* 24h Stats */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">LAST 24 HOURS</h3>
            <InfoTooltip {...FRACTAL_TOOLTIPS.alertStats} placement="right" />
          </div>
          <div className="flex items-center gap-4">
            <StatBadge label="INFO" count={stats.last24h?.INFO || 0} color="gray" />
            <StatBadge label="HIGH" count={stats.last24h?.HIGH || 0} color="orange" />
            <StatBadge label="CRITICAL" count={stats.last24h?.CRITICAL || 0} color="red" />
          </div>
        </div>

        {/* 7d Stats */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">LAST 7 DAYS</h3>
          </div>
          <div className="flex items-center gap-4">
            <StatBadge label="INFO" count={stats.last7d?.INFO || 0} color="gray" />
            <StatBadge label="HIGH" count={stats.last7d?.HIGH || 0} color="orange" />
            <StatBadge label="CRITICAL" count={stats.last7d?.CRITICAL || 0} color="red" />
          </div>
        </div>
      </div>

      {/* Filters Row */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Level</label>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              data-testid="filter-level"
            >
              <option value="">All</option>
              <option value="INFO">INFO</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              data-testid="filter-type"
            >
              <option value="">All</option>
              <option value="REGIME_SHIFT">REGIME_SHIFT</option>
              <option value="CRISIS_ENTER">CRISIS_ENTER</option>
              <option value="CRISIS_EXIT">CRISIS_EXIT</option>
              <option value="HEALTH_DROP">HEALTH_DROP</option>
              <option value="TAIL_SPIKE">TAIL_SPIKE</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Status</label>
            <select
              value={blockedFilter}
              onChange={(e) => setBlockedFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              data-testid="filter-status"
            >
              <option value="">All</option>
              <option value="NONE">SENT</option>
              <option value="QUOTA">BLOCKED: QUOTA</option>
              <option value="COOLDOWN">BLOCKED: COOLDOWN</option>
              <option value="DEDUP">BLOCKED: DEDUP</option>
            </select>
          </div>

          <div className="flex-1"></div>

          <button
            onClick={sendTestAlert}
            disabled={testLoading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
            data-testid="test-alert-btn"
          >
            {testLoading ? 'Sending...' : 'Send Test Alert'}
          </button>

          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            data-testid="refresh-alerts-btn"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-2 p-5 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">ALERT HISTORY</h3>
          <InfoTooltip {...FRACTAL_TOOLTIPS.alertHistory} placement="right" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase">Time (UTC)</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase">Level</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase">Type</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase">Message</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-500">
                    No alerts found
                  </td>
                </tr>
              ) : (
                items.map((alert, idx) => (
                  <AlertRow key={alert._id || idx} alert={alert} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-gray-400 text-center uppercase tracking-wider">
        Alert Engine: BTC-only • 3 INFO/HIGH per 24h • CRITICAL unlimited
      </div>
    </div>
  );
}

function StatBadge({ label, count, color }) {
  const colorMap = {
    gray: 'bg-gray-100 text-gray-700',
    orange: 'bg-orange-100 text-orange-700',
    red: 'bg-red-100 text-red-700'
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${colorMap[color]}`}>
        {label}
      </span>
      <span className="text-2xl font-black text-gray-900">{count}</span>
    </div>
  );
}

function AlertRow({ alert }) {
  const levelColor = LEVEL_COLORS[alert.level] || LEVEL_COLORS.INFO;
  const blockedColor = BLOCKED_COLORS[alert.blockedBy] || BLOCKED_COLORS.NONE;
  
  const timestamp = new Date(alert.triggeredAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-5 py-4 text-sm text-gray-600 font-mono">
        {timestamp}
      </td>
      <td className="px-5 py-4">
        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${levelColor.bg} ${levelColor.text}`}>
          {alert.level}
        </span>
      </td>
      <td className="px-5 py-4 text-sm text-gray-700 font-mono">
        {alert.type}
      </td>
      <td className="px-5 py-4 text-sm text-gray-700 max-w-md truncate">
        {alert.message?.split('\n')[0]}
      </td>
      <td className="px-5 py-4">
        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${blockedColor.bg} ${blockedColor.text}`}>
          {alert.blockedBy === 'NONE' ? 'SENT' : alert.blockedBy}
        </span>
      </td>
    </tr>
  );
}
