/**
 * Data Pipelines Page (ЭТАП 2)
 * 
 * Контроль накопления данных:
 * - Pipeline stages status
 * - Row counts
 * - Last run timestamps
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { getPipelinesStatus } from '../../api/admin.api';
import AdminLayout from '../../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  Database,
  ArrowRight,
} from 'lucide-react';

// Status badge
function StatusBadge({ status }) {
  const config = {
    OK: { icon: CheckCircle, class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    DEGRADED: { icon: AlertTriangle, class: 'bg-amber-50 text-amber-700 border-amber-200' },
    FAILED: { icon: XCircle, class: 'bg-red-50 text-red-700 border-red-200' },
  };
  const { icon: Icon, class: className } = config[status] || config.FAILED;
  
  return (
    <Badge variant="outline" className={`${className} font-medium`}>
      <Icon className="w-3 h-3 mr-1" />
      {status}
    </Badge>
  );
}

// Format number with K/M suffix
function formatNumber(num) {
  if (num === null || num === undefined) return '—';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

// Format timestamp
function formatTime(ts) {
  if (!ts) return '—';
  const date = new Date(ts);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
}

// Pipeline stage names
const STAGE_LABELS = {
  transfers: 'Transfers',
  features: 'Features',
  labels: 'Labels',
  datasets: 'Datasets',
  ml_inference: 'ML Inference',
  signals: 'Signals',
};

export default function DataPipelinesPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAdminAuth();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const result = await getPipelinesStatus();
      if (result.ok) {
        setData(result.data);
        setError(null);
      }
    } catch (err) {
      if (err.message === 'UNAUTHORIZED') {
        navigate('/admin/login', { replace: true });
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin/login', { replace: true });
      return;
    }
    if (isAuthenticated) {
      fetchData();
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [authLoading, isAuthenticated, navigate, fetchData]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const { pipelines = [] } = data || {};

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Data Pipelines</h1>
            <p className="text-sm text-slate-500 mt-1">Monitor data accumulation stages</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="border-slate-300"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Pipeline Flow Visualization */}
        <div className="flex items-center justify-center gap-2 py-4 overflow-x-auto">
          {pipelines.map((pipeline, idx) => (
            <div key={pipeline.stage} className="flex items-center">
              <div className={`px-3 py-2 rounded-lg border text-sm font-medium ${
                pipeline.status === 'OK' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}>
                {STAGE_LABELS[pipeline.stage] || pipeline.stage}
              </div>
              {idx < pipelines.length - 1 && (
                <ArrowRight className="w-4 h-4 text-slate-300 mx-2" />
              )}
            </div>
          ))}
        </div>

        {/* Pipelines Table */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              Pipeline Stages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Stage</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Run</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rows</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Latency</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {pipelines.map((pipeline) => (
                    <tr key={pipeline.stage} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-900">
                          {STAGE_LABELS[pipeline.stage] || pipeline.stage}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={pipeline.status} />
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 font-mono">
                        {formatTime(pipeline.lastRun)}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-mono text-slate-900">
                        {formatNumber(pipeline.rows)}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-mono text-slate-600">
                        {pipeline.latencyMs ? `${pipeline.latencyMs}ms` : '—'}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500">
                        {pipeline.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-slate-200">
            <CardContent className="pt-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Stages</p>
              <p className="text-2xl font-semibold text-slate-900">{pipelines.length}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="pt-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Healthy</p>
              <p className="text-2xl font-semibold text-emerald-600">
                {pipelines.filter(p => p.status === 'OK').length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="pt-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Degraded</p>
              <p className="text-2xl font-semibold text-amber-600">
                {pipelines.filter(p => p.status === 'DEGRADED').length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="pt-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Rows</p>
              <p className="text-2xl font-semibold text-slate-900">
                {formatNumber(pipelines.reduce((sum, p) => sum + (p.rows || 0), 0))}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
