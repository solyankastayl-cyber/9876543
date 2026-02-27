/**
 * P2.A — Confidence Dashboard Client Component
 * 
 * Real-time confidence quality monitoring.
 */

import React, { useEffect, useState } from 'react';
import { HistogramBars } from './charts/HistogramBars';
import { LifecycleDonut } from './charts/LifecycleDonut';
import { ActorScatterPlot } from './charts/ActorScatterPlot';
import { ConfidenceDriftLine } from './charts/ConfidenceDriftLine';
import { ActorTypesBar } from './charts/ActorTypesBar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export function ConfidenceDashboard() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    fetch(`${BACKEND_URL}/api/admin/metrics/confidence-dashboard?days=${days}&limit=400`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(json => {
        if (alive) {
          if (json.ok && json.data) {
            setData(json.data);
          } else {
            setData(json);
          }
        }
      })
      .catch(e => {
        if (alive) setError(String(e?.message || e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => { alive = false; };
  }, [days]);

  return (
    <div className="space-y-6" data-testid="confidence-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Confidence Dashboard</h1>
          <p className="text-sm text-gray-500">P2.A Monitoring: distribution, lifecycle, diversity, drift</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-500">Range:</label>
          <select
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            data-testid="range-select"
          >
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
            <option value={180}>180 days</option>
          </select>
          {data?.generatedAt && (
            <span className="text-xs text-gray-400">
              Updated: {new Date(data.generatedAt).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700 text-sm">
          Error loading dashboard: {error}
        </div>
      )}

      {/* Loading State */}
      {loading && !error && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-500">Loading metrics...</span>
        </div>
      )}

      {/* Dashboard Content */}
      {data && !loading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard 
              title="Total Signals" 
              value={data.summary?.totalSignals || 0} 
              color="blue"
            />
            <SummaryCard 
              title="Avg Confidence" 
              value={`${data.summary?.avgConfidence || 0}%`} 
              color="purple"
            />
            <SummaryCard 
              title="High Confidence" 
              value={data.summary?.highConfidenceCount || 0}
              subtitle="≥80"
              color="green"
            />
            <SummaryCard 
              title="Resolved" 
              value={data.summary?.resolvedCount || 0} 
              color="gray"
            />
          </div>

          {/* Main Charts Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Confidence Histogram */}
            <ChartCard title="Confidence Distribution" subtitle="Score buckets">
              <HistogramBars data={data.histogram} />
            </ChartCard>

            {/* Lifecycle Funnel */}
            <ChartCard title="Lifecycle Status" subtitle="Signal states">
              <LifecycleDonut data={data.lifecycle} />
            </ChartCard>

            {/* Scatter Plot - Full Width */}
            <div className="xl:col-span-2">
              <ChartCard title="Actor Count vs Confidence" subtitle="Scatter analysis">
                <ActorScatterPlot data={data.scatterSample} />
              </ChartCard>
            </div>

            {/* Drift Timeline */}
            <ChartCard title="Confidence Drift" subtitle="Daily trend">
              <ConfidenceDriftLine data={data.drift} />
            </ChartCard>

            {/* Signal Types */}
            <ChartCard title="Signal Types" subtitle="Distribution">
              <ActorTypesBar data={data.actorTypes} />
            </ChartCard>
          </div>

          {/* Lifecycle Details Table */}
          {data.lifecycle && data.lifecycle.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="font-medium text-gray-900 mb-3">Lifecycle Details</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-200">
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Count</th>
                      <th className="pb-2">Avg Confidence</th>
                      <th className="pb-2">%</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    {data.lifecycle.map((row, i) => {
                      const total = data.lifecycle.reduce((s, r) => s + r.count, 0);
                      const pct = total > 0 ? ((row.count / total) * 100).toFixed(1) : '0';
                      return (
                        <tr key={i} className="border-b border-gray-100">
                          <td className="py-2">
                            <StatusBadge status={row.status} />
                          </td>
                          <td className="py-2">{row.count}</td>
                          <td className="py-2">{row.avgConfidence}%</td>
                          <td className="py-2">{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Helper Components
function SummaryCard({ title, value, subtitle, color }) {
  const colors = {
    blue: 'border-blue-200 bg-blue-50',
    purple: 'border-purple-200 bg-purple-50',
    green: 'border-green-200 bg-green-50',
    gray: 'border-gray-200 bg-gray-50',
  };

  return (
    <div className={`rounded-xl border p-4 ${colors[color] || colors.gray}`}>
      <div className="text-xs text-gray-500 uppercase tracking-wide">{title}</div>
      <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
      {subtitle && <div className="text-xs text-gray-400">{subtitle}</div>}
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="font-medium text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    NEW: { dot: '🔵', bg: 'bg-blue-100 text-blue-700' },
    ACTIVE: { dot: '🟢', bg: 'bg-green-100 text-green-700' },
    COOLDOWN: { dot: '🟡', bg: 'bg-yellow-100 text-yellow-700' },
    RESOLVED: { dot: '⚫', bg: 'bg-gray-100 text-gray-700' },
  };
  const c = config[status] || config.NEW;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${c.bg}`}>
      {c.dot} {status}
    </span>
  );
}

export default ConfidenceDashboard;
