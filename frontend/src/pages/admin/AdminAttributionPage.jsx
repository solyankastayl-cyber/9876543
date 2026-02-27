/**
 * A1.5 - Admin ML Attribution Page
 * 
 * Read-only view of group attribution (feature group impact).
 */
import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { PieChart, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../../api/client';

const NETWORKS = ['ethereum', 'bnb'];

const GROUP_META = {
  cex: { label: 'CEX Flows', color: 'bg-blue-500' },
  CEX: { label: 'CEX Flows', color: 'bg-blue-500' },
  zones: { label: 'Accumulation Zones', color: 'bg-emerald-500' },
  ZONES: { label: 'Accumulation Zones', color: 'bg-emerald-500' },
  corridors: { label: 'Corridors', color: 'bg-purple-500' },
  CORRIDORS: { label: 'Corridors', color: 'bg-purple-500' },
  dex: { label: 'DEX Liquidity', color: 'bg-amber-500' },
  DEX: { label: 'DEX Liquidity', color: 'bg-amber-500' },
  actors: { label: 'Smart Actors', color: 'bg-red-500' },
  ACTORS: { label: 'Smart Actors', color: 'bg-red-500' },
  events: { label: 'Events', color: 'bg-slate-500' },
  EVENTS: { label: 'Events', color: 'bg-slate-500' },
};

const VERDICT_COLORS = {
  CORE_POSITIVE: 'text-emerald-600 bg-emerald-100',
  WEAK_POSITIVE: 'text-blue-600 bg-blue-100',
  NEUTRAL: 'text-slate-600 bg-slate-100',
  NEGATIVE: 'text-red-600 bg-red-100',
  UNSTABLE: 'text-amber-600 bg-amber-100',
};

export default function AdminAttributionPage() {
  const [network, setNetwork] = useState('ethereum');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/ml/v3/attribution/history?network=${network}`);
      if (res.data?.ok) {
        setReports(res.data.data?.results || []);
        setError(null);
      } else {
        setError(res.data?.error || 'Failed to load');
      }
    } catch (err) {
      setError('Unable to fetch attribution reports');
    } finally {
      setLoading(false);
    }
  }, [network]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PieChart className="w-5 h-5 text-slate-700" />
            <h1 className="text-lg font-semibold text-slate-900">Group Attribution</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Network selector */}
            <div className="flex gap-1">
              {NETWORKS.map((n) => (
                <button
                  key={n}
                  onClick={() => setNetwork(n)}
                  className={`px-3 py-1.5 rounded text-sm font-medium capitalize ${
                    n === network
                      ? 'bg-white text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <p className="text-sm text-slate-500">
          Feature group contribution analysis showing which signal sources have the most impact.
        </p>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span className="text-amber-800">{error}</span>
          </div>
        )}

        {/* Loading */}
        {loading && reports.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        )}

        {/* Reports */}
        {reports.length > 0 && (
          <div className="space-y-6">
            {reports.map((report) => (
              <AttributionReportCard key={report._id} report={report} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && reports.length === 0 && !error && (
          <div className="text-center py-12 text-slate-500">
            <PieChart className="w-8 h-8 mx-auto mb-3 text-slate-300" />
            <p>No attribution reports found for {network}</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function AttributionReportCard({ report }) {
  // Groups can be array or object
  const groupsArray = Array.isArray(report.groups) 
    ? report.groups 
    : Object.entries(report.groups || {}).map(([key, val]) => ({ group: key, ...val }));
  
  // Find max impact for scaling bars
  const maxImpact = Math.max(...groupsArray.map(g => Math.abs(g.deltaF1 || g.avgDeltaF1 || g.impact || 0)), 0.01);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">Network:</span>
          <span className="font-medium capitalize">{report.network || 'ethereum'}</span>
          <span className="text-slate-300">·</span>
          <span className="text-sm text-slate-500">Base Pack:</span>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
            {report.basePack || report.baseFeaturePack || 'PACK_A'}
          </span>
        </div>

        <div className="text-sm text-slate-500">
          Groups: <span className="font-medium">{groupsArray.length}</span>
        </div>
      </div>

      {/* Impact bars */}
      <div className="space-y-3">
        {groupsArray.map((group, idx) => {
          const groupName = group.group || `Group ${idx}`;
          const meta = GROUP_META[groupName] || { label: groupName, color: 'bg-slate-400' };
          const impact = group.deltaF1 || group.avgDeltaF1 || group.impact || 0;
          const width = Math.abs(impact) / maxImpact * 100;
          const verdict = group.verdict || 'NEUTRAL';
          const verdictStyle = VERDICT_COLORS[verdict] || VERDICT_COLORS.NEUTRAL;

          return (
            <div key={groupName} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{meta.label}</span>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${verdictStyle}`}>
                    {verdict}
                  </span>
                  <span className={`font-medium ${impact >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {impact >= 0 ? '+' : ''}{(impact * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${impact >= 0 ? meta.color : 'bg-red-400'}`}
                  style={{ width: `${Math.max(width, 2)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-xs text-slate-400 text-right">
        {report.createdAt ? new Date(report.createdAt).toLocaleString() : '-'}
      </div>
    </div>
  );
}
