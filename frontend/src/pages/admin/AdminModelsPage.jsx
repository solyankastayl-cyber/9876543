/**
 * A1.3 - Admin ML Models Page
 * 
 * Read-only view of registered SHADOW models.
 */
import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { FlaskConical, RefreshCw, AlertCircle, Brain } from 'lucide-react';
import { api } from '../../api/client';

export default function AdminModelsPage() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/ml/v3/models/shadow');
      if (res.data?.ok) {
        setModels(res.data.data?.models || []);
        setError(null);
      } else {
        setError(res.data?.error || 'Failed to load');
      }
    } catch (err) {
      setError('Unable to fetch models');
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
            <FlaskConical className="w-5 h-5 text-slate-700" />
            <h1 className="text-lg font-semibold text-slate-900">ML Models</h1>
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

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span className="text-amber-800">{error}</span>
          </div>
        )}

        {/* Loading */}
        {loading && models.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        )}

        {/* Models grid */}
        {models.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((model) => (
              <div key={model._id} className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-400 font-mono">{model._id?.slice(-8)}</span>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                    SHADOW
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Network</span>
                    <span className="font-medium capitalize">{model.network || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Task</span>
                    <span className="font-medium">{model.task || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Feature Pack</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                      {model.featurePack || 'PACK_A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Features</span>
                    <span className="font-medium">{model.featureCount || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">DEX</span>
                    <span className={model.dexIncluded ? 'text-emerald-600' : 'text-slate-400'}>
                      {model.dexIncluded ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                {model.metrics && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">F1</span>
                      <span className="font-medium">{model.metrics.f1?.toFixed(3) || '-'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Accuracy</span>
                      <span className="font-medium">{model.metrics.accuracy?.toFixed(3) || '-'}</span>
                    </div>
                  </div>
                )}

                <div className="mt-3 text-xs text-slate-400 text-right">
                  {model.createdAt ? new Date(model.createdAt).toLocaleDateString() : '-'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && models.length === 0 && !error && (
          <div className="text-center py-12 text-slate-500">
            <Brain className="w-8 h-8 mx-auto mb-3 text-slate-300" />
            <p>No SHADOW models found</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
