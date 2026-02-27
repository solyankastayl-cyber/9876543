/**
 * A1.3 - Admin ML Datasets Page
 * 
 * Read-only view of ML v3 datasets.
 */
import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Layers, RefreshCw, AlertCircle, Database, Calendar } from 'lucide-react';
import { api } from '../../api/client';

export default function AdminDatasetsPage() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/ml/v3/dataset/list');
      if (res.data?.ok) {
        setDatasets(res.data.data?.datasets || []);
        setError(null);
      } else {
        setError(res.data?.error || 'Failed to load');
      }
    } catch (err) {
      setError('Unable to fetch datasets');
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
            <Layers className="w-5 h-5 text-slate-700" />
            <h1 className="text-lg font-semibold text-slate-900">ML Datasets</h1>
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
        {loading && datasets.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        )}

        {/* Datasets table */}
        {datasets.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">ID</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Network</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Task</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Feature Pack</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">Rows</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {datasets.map((ds) => (
                  <tr key={ds._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {ds._id?.slice(-8) || 'N/A'}
                    </td>
                    <td className="px-4 py-3 capitalize">{ds.network || '-'}</td>
                    <td className="px-4 py-3">{ds.task || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                        {ds.featurePack || 'PACK_A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">{ds.rowCount?.toLocaleString() || '-'}</td>
                    <td className="px-4 py-3 text-right text-slate-500">
                      {ds.createdAt ? new Date(ds.createdAt).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty state */}
        {!loading && datasets.length === 0 && !error && (
          <div className="text-center py-12 text-slate-500">
            <Database className="w-8 h-8 mx-auto mb-3 text-slate-300" />
            <p>No datasets found</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
