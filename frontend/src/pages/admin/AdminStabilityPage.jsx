/**
 * A1.4 - Admin ML Stability Page
 * 
 * Read-only view of training stability (multi-seed variance).
 */
import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Gauge, RefreshCw, AlertCircle, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { api } from '../../api/client';

const NETWORKS = ['ethereum', 'bnb'];

const VERDICT_CONFIG = {
  STABLE: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  UNSTABLE: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
  INSUFFICIENT_DATA: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100' },
};

export default function AdminStabilityPage() {
  const [network, setNetwork] = useState('ethereum');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/ml/v3/stability/history?network=${network}`);
      if (res.data?.ok) {
        setReports(res.data.data?.results || []);
        setError(null);
      } else {
        setError(res.data?.error || 'Failed to load');
      }
    } catch (err) {
      setError('Unable to fetch stability reports');
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
            <Gauge className="w-5 h-5 text-slate-700" />
            <h1 className="text-lg font-semibold text-slate-900">Training Stability</h1>
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
          Multi-seed training variance analysis. Stable models produce consistent results across random seeds.
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
          <div className="space-y-4">
            {reports.map((report) => (
              <StabilityReportCard key={report._id} report={report} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && reports.length === 0 && !error && (
          <div className="text-center py-12 text-slate-500">
            <Gauge className="w-8 h-8 mx-auto mb-3 text-slate-300" />
            <p>No stability reports found for {network}</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function StabilityReportCard({ report }) {
  const verdict = report.verdict || 'INSUFFICIENT_DATA';
  const config = VERDICT_CONFIG[verdict] || VERDICT_CONFIG.INSUFFICIENT_DATA;
  const VerdictIcon = config.icon;
  const stats = report.stats || {};

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">Feature Pack:</span>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
            {report.featurePack || 'PACK_A'}
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-sm text-slate-500 capitalize">{report.network || 'ethereum'}</span>
        </div>

        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${config.bg}`}>
          <VerdictIcon className={`w-4 h-4 ${config.color}`} />
          <span className={`text-sm font-medium ${config.color}`}>{verdict}</span>
        </div>
      </div>

      {/* Variance metrics */}
      <div className="grid grid-cols-4 gap-4 mb-3">
        <div className="text-center p-2 bg-slate-50 rounded">
          <div className="font-medium">{stats.stdF1?.toFixed(4) || '-'}</div>
          <div className="text-xs text-slate-500">σ(F1)</div>
        </div>
        <div className="text-center p-2 bg-slate-50 rounded">
          <div className="font-medium">{stats.stdAccuracy?.toFixed(4) || '-'}</div>
          <div className="text-xs text-slate-500">σ(Accuracy)</div>
        </div>
        <div className="text-center p-2 bg-slate-50 rounded">
          <div className="font-medium">{stats.cv?.toFixed(4) || '-'}</div>
          <div className="text-xs text-slate-500">CV</div>
        </div>
        <div className="text-center p-2 bg-slate-50 rounded">
          <div className="font-medium">{report.seeds?.length || stats.seedCount || '-'}</div>
          <div className="text-xs text-slate-500">Seeds</div>
        </div>
      </div>

      {/* Decision gate */}
      {report.decisionGate && (
        <div className="text-sm">
          <span className="text-slate-500">Decision Gate:</span>{' '}
          <span className={`font-medium ${
            report.decisionGate === 'ACCEPT' ? 'text-emerald-600' :
            report.decisionGate === 'REJECT' ? 'text-red-600' : 'text-amber-600'
          }`}>
            {report.decisionGate}
          </span>
        </div>
      )}

      <div className="mt-3 text-xs text-slate-400 text-right">
        {report.createdAt ? new Date(report.createdAt).toLocaleString() : '-'}
      </div>
    </div>
  );
}
