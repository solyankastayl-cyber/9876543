/**
 * A1.4 - Admin ML Ablation Page
 * 
 * Read-only view of ablation reports (A vs B model comparison).
 */
import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { GitCompare, RefreshCw, AlertCircle, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { api } from '../../api/client';

const VERDICT_COLORS = {
  IMPROVES: 'bg-emerald-100 text-emerald-700',
  DEGRADES: 'bg-red-100 text-red-700',
  NEUTRAL: 'bg-slate-100 text-slate-600',
  INCONCLUSIVE: 'bg-amber-100 text-amber-700',
};

export default function AdminAblationPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/ml/v3/ablation/history');
      if (res.data?.ok) {
        setReports(res.data.data?.rows || []);
        setError(null);
      } else {
        setError(res.data?.error || 'Failed to load');
      }
    } catch (err) {
      setError('Unable to fetch ablation reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GitCompare className="w-5 h-5 text-slate-700" />
            <h1 className="text-lg font-semibold text-slate-900">Ablation Reports</h1>
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

        <p className="text-sm text-slate-500">
          Feature pack comparisons showing performance changes between model variants.
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
              <AblationReportCard key={report._id} report={report} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && reports.length === 0 && !error && (
          <div className="text-center py-12 text-slate-500">
            <GitCompare className="w-8 h-8 mx-auto mb-3 text-slate-300" />
            <p>No ablation reports found</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function AblationReportCard({ report }) {
  const verdict = report.verdict || 'INCONCLUSIVE';
  const verdictColor = VERDICT_COLORS[verdict] || VERDICT_COLORS.INCONCLUSIVE;
  const deltas = report.deltas || {};

  const DeltaIcon = ({ value }) => {
    if (!value || value === 0) return <Minus className="w-3 h-3 text-slate-400" />;
    if (value > 0) return <ArrowUp className="w-3 h-3 text-emerald-500" />;
    return <ArrowDown className="w-3 h-3 text-red-500" />;
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-sm">
            <span className="text-slate-500">Pack A:</span>{' '}
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
              {report.modelA?.featurePack || 'PACK_A'}
            </span>
          </div>
          <span className="text-slate-300">vs</span>
          <div className="text-sm">
            <span className="text-slate-500">Pack B:</span>{' '}
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
              {report.modelB?.featurePack || '-'}
            </span>
          </div>
        </div>

        <span className={`px-3 py-1 rounded-full text-sm font-medium ${verdictColor}`}>
          {verdict}
        </span>
      </div>

      {/* Metrics delta */}
      <div className="grid grid-cols-3 gap-4 mb-3">
        <div className="text-center p-2 bg-slate-50 rounded">
          <div className="flex items-center justify-center gap-1">
            <DeltaIcon value={deltas.deltaF1} />
            <span className="font-medium">{(deltas.deltaF1 * 100)?.toFixed(2) || '0'}%</span>
          </div>
          <div className="text-xs text-slate-500">ΔF1</div>
        </div>
        <div className="text-center p-2 bg-slate-50 rounded">
          <div className="flex items-center justify-center gap-1">
            <DeltaIcon value={deltas.deltaAccuracy} />
            <span className="font-medium">{(deltas.deltaAccuracy * 100)?.toFixed(2) || '0'}%</span>
          </div>
          <div className="text-xs text-slate-500">ΔAccuracy</div>
        </div>
        <div className="text-center p-2 bg-slate-50 rounded">
          <div className="flex items-center justify-center gap-1">
            <DeltaIcon value={deltas.deltaRecall} />
            <span className="font-medium">{(deltas.deltaRecall * 100)?.toFixed(2) || '0'}%</span>
          </div>
          <div className="text-xs text-slate-500">ΔRecall</div>
        </div>
      </div>

      {/* Reasons */}
      {report.reasons?.length > 0 && (
        <div className="text-xs text-slate-500">
          {report.reasons.join(' · ')}
        </div>
      )}

      <div className="mt-3 text-xs text-slate-400 text-right">
        {report.createdAt ? new Date(report.createdAt).toLocaleString() : '-'}
      </div>
    </div>
  );
}
