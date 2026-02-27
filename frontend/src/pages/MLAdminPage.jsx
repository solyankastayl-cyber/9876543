/**
 * S10.7.4 — Exchange ML Admin UI
 * 
 * ML is a diagnostic tool, NOT a decision maker.
 * 
 * Shows:
 * - Model Health (STABLE/WATCH/DRIFT)
 * - Rules vs ML Agreement
 * - Feature Importance
 * - Drift Monitor
 * - Disagreement Explorer
 */

import { useState, useEffect } from 'react';
import { 
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Activity,
  BarChart3,
  GitCompare,
  Lock,
  Eye,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/api/client';

// Status colors
const HEALTH_CONFIG = {
  STABLE: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Stable' },
  WATCH: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Watch' },
  DRIFT: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Drift Detected' },
};

const MODE_CONFIG = {
  MIRROR_MODE: { color: 'bg-blue-100 text-blue-700', label: 'Mirror Mode' },
  ACTIVE_MODE: { color: 'bg-green-100 text-green-700', label: 'Active Mode' },
  DISABLED: { color: 'bg-gray-100 text-gray-700', label: 'Disabled' },
};

export default function MLAdminPage() {
  const [summary, setSummary] = useState(null);
  const [disagreements, setDisagreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [freezing, setFreezing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setError(null);
      
      const [summaryRes, disagreementRes] = await Promise.all([
        api.get('/api/v10/exchange/ml/admin/summary'),
        api.get('/api/v10/exchange/ml/cases/disagreement?limit=10'),
      ]);
      
      if (summaryRes.data?.ok) {
        setSummary(summaryRes.data);
      }
      
      if (disagreementRes.data?.ok) {
        setDisagreements(disagreementRes.data.cases || []);
      }
    } catch (err) {
      console.error('ML Admin fetch error:', err);
      setError('Failed to fetch ML data. Train models first.');
    } finally {
      setLoading(false);
    }
  };

  const handleFreeze = async () => {
    try {
      setFreezing(true);
      const res = await api.post('/api/v10/exchange/ml/freeze', { model: 'logistic' });
      if (res.data?.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Freeze error:', err);
    } finally {
      setFreezing(false);
    }
  };

  const handleTrain = async () => {
    try {
      setLoading(true);
      await api.post('/api/v10/exchange/ml/train', { limit: 200 });
      await fetchData();
    } catch (err) {
      console.error('Train error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const registry = summary?.registry || {};
  const healthStatus = registry.healthStatus || 'STABLE';
  const healthConfig = HEALTH_CONFIG[healthStatus] || HEALTH_CONFIG.STABLE;
  const HealthIcon = healthConfig.icon;
  const modeConfig = MODE_CONFIG[registry.mode] || MODE_CONFIG.DISABLED;
  const drift = summary?.drift || {};
  const featureImportance = summary?.featureImportance || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="ml-admin-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exchange ML Admin</h1>
          <p className="text-sm text-gray-500 mt-1">
            Model Health & Diagnostics • S10.7
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleTrain}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            Train Models
          </button>
          <button 
            onClick={handleFreeze}
            disabled={freezing || registry.status === 'FROZEN'}
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {freezing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {registry.status === 'FROZEN' ? 'Frozen' : 'Freeze Model'}
          </button>
          <button 
            onClick={fetchData}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
          {error}
        </div>
      )}

      {/* Model Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="health-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-3 ${healthConfig.bg} rounded-lg`}>
                <HealthIcon className={`w-6 h-6 ${healthConfig.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Health Status</p>
                <p className={`text-xl font-bold ${healthConfig.color}`}>
                  {healthConfig.label}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="agreement-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <GitCompare className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Agreement Rate</p>
                <p className="text-xl font-bold text-gray-900">
                  {((registry.agreementRate || 0) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="mode-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Mode</p>
                <Badge className={modeConfig.color}>
                  {modeConfig.label}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="samples-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Samples</p>
                <p className="text-xl font-bold text-gray-900">
                  {registry.samplesCount || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Registry Info */}
      <Card data-testid="registry-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-400" />
            Model Registry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Version</p>
              <p className="font-medium">{registry.version || 'v1'}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Model Type</p>
              <p className="font-medium capitalize">{registry.modelType || 'logistic'}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Status</p>
              <Badge variant={registry.status === 'FROZEN' ? 'default' : 'outline'}>
                {registry.status || 'UNFROZEN'}
              </Badge>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Features</p>
              <p className="font-medium">{registry.featureCount || 20}</p>
            </div>
          </div>
          
          {/* Constraints */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-600">
              <strong>ML Constraints:</strong> {' '}
              Can influence decision: <strong>{registry.canInfluenceDecision ? 'Yes' : 'No'}</strong> | {' '}
              Can retrain: <strong>{registry.canRetrain ? 'Yes' : 'No'}</strong>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Importance */}
        <Card data-testid="feature-importance-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-400" />
              Feature Importance (Rules vs ML)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {featureImportance.length > 0 ? (
              <div className="space-y-3">
                {featureImportance.slice(0, 8).map((f, idx) => (
                  <div key={f.feature}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-700 font-medium">{f.feature}</span>
                      <span className="text-gray-500">
                        R: {(f.rulesWeight * 100).toFixed(0)}% | ML: {(f.mlWeight * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex gap-1 h-2">
                      <div 
                        className="bg-blue-500 rounded-l"
                        style={{ width: `${f.rulesWeight * 50}%` }}
                        title={`Rules: ${(f.rulesWeight * 100).toFixed(0)}%`}
                      />
                      <div 
                        className="bg-purple-500 rounded-r"
                        style={{ width: `${f.mlWeight * 50}%` }}
                        title={`ML: ${(f.mlWeight * 100).toFixed(0)}%`}
                      />
                    </div>
                  </div>
                ))}
                <div className="flex gap-4 text-xs text-gray-500 mt-2 pt-2 border-t">
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500 rounded" /> Rules
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-purple-500 rounded" /> ML
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                Train models to see feature importance
              </p>
            )}
          </CardContent>
        </Card>

        {/* Drift Monitor */}
        <Card data-testid="drift-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-gray-400" />
              Drift Monitor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Current Agreement</p>
                  <p className="text-lg font-bold">
                    {((drift.currentAgreement || 0) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Drift Status</p>
                  <Badge 
                    className={
                      drift.driftStatus === 'NO_DRIFT' ? 'bg-green-100 text-green-700' :
                      drift.driftStatus === 'SOFT_DRIFT' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }
                  >
                    {drift.driftStatus || 'NO_DRIFT'}
                  </Badge>
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-2">Agreement Delta</p>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${(drift.agreementDelta || 0) < 0.05 ? 'bg-green-500' : (drift.agreementDelta || 0) < 0.15 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(100, (drift.agreementDelta || 0) * 200)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {((drift.agreementDelta || 0) * 100).toFixed(2)}% drift from baseline
                </p>
              </div>
              
              <p className="text-xs text-gray-500">
                Last check: {drift.lastCheckAt ? new Date(drift.lastCheckAt).toLocaleString() : 'Never'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Disagreement Explorer */}
      <Card data-testid="disagreement-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-gray-400" />
            Disagreement Explorer
          </CardTitle>
        </CardHeader>
        <CardContent>
          {disagreements.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium text-gray-500">Time</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-500">Regime</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-500">Rules</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-500">ML</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-500">ML Conf</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-500">Key Features</th>
                  </tr>
                </thead>
                <tbody>
                  {disagreements.map((d, idx) => (
                    <tr key={d.observationId || idx} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-2 text-gray-600">
                        {new Date(d.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2 px-2">
                        <Badge variant="outline">{d.regime}</Badge>
                      </td>
                      <td className="py-2 px-2">
                        <Badge className={
                          d.rulesLabel === 'WARNING' ? 'bg-red-100 text-red-700' :
                          d.rulesLabel === 'USE' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }>
                          {d.rulesLabel}
                        </Badge>
                      </td>
                      <td className="py-2 px-2">
                        <Badge className={
                          d.mlLabel === 'WARNING' ? 'bg-red-100 text-red-700' :
                          d.mlLabel === 'USE' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }>
                          {d.mlLabel}
                        </Badge>
                      </td>
                      <td className="py-2 px-2 text-gray-600">
                        {(d.mlConfidence * 100).toFixed(0)}%
                      </td>
                      <td className="py-2 px-2 text-xs text-gray-500">
                        {(d.keyFeatures || []).slice(0, 2).map(f => `${f.name}: ${f.value.toFixed(2)}`).join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-400" />
              <p>No disagreements found</p>
              <p className="text-xs mt-1">ML agrees with rules 100%</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-sm text-blue-700">
          <strong>ML Mode: MIRROR_MODE</strong> — ML mirrors rules-based logic and is used for drift detection only. 
          ML does NOT influence decisions. All verdicts come from rules.
        </p>
      </div>
    </div>
  );
}
