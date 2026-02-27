/**
 * Admin ML Control Page
 * 
 * ML runtime management: toggle, policy, models, circuit breaker.
 * Uses AdminLayout with light theme.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  getMLStatus,
  toggleML,
  updateMLPolicy,
  resetCircuitBreaker,
  toggleModel,
  reloadModels,
} from '../../api/admin.api';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { InfoTooltip, ADMIN_TOOLTIPS } from '../../components/admin/InfoTooltip';
import {
  Brain,
  RefreshCw,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  RotateCcw,
  Loader2,
  Activity,
} from 'lucide-react';

function StatusBadge({ active, activeText = 'Enabled', inactiveText = 'Disabled' }) {
  return active ? (
    <Badge className="bg-green-100 text-green-700 border-green-300">
      <CheckCircle className="w-3 h-3 mr-1" />
      {activeText}
    </Badge>
  ) : (
    <Badge className="bg-red-100 text-red-700 border-red-300">
      <XCircle className="w-3 h-3 mr-1" />
      {inactiveText}
    </Badge>
  );
}

export default function AdminMLPage() {
  const navigate = useNavigate();
  const { isAdmin, isAuthenticated, loading: authLoading } = useAdminAuth();
  
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [policyForm, setPolicyForm] = useState({ timeoutMs: 1200 });

  const fetchStatus = useCallback(async () => {
    try {
      const result = await getMLStatus();
      if (result.ok) {
        setStatus(result.data);
        setPolicyForm({ timeoutMs: result.data?.ml?.policy?.timeoutMs || 1200 });
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
      fetchStatus();
    }
  }, [authLoading, isAuthenticated, navigate, fetchStatus]);

  const handleToggleML = async (enabled) => {
    if (!isAdmin) return;
    setActionLoading('toggle');
    try {
      await toggleML(enabled);
      await fetchStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleModel = async (model, enabled) => {
    if (!isAdmin) return;
    setActionLoading(`model-${model}`);
    try {
      await toggleModel(model, enabled);
      await fetchStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetCircuitBreaker = async () => {
    if (!isAdmin) return;
    setActionLoading('circuit');
    try {
      await resetCircuitBreaker();
      await fetchStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReloadModels = async () => {
    if (!isAdmin) return;
    setActionLoading('reload');
    try {
      await reloadModels();
      await fetchStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdatePolicy = async () => {
    if (!isAdmin) return;
    setActionLoading('policy');
    try {
      await updateMLPolicy({ timeoutMs: parseInt(policyForm.timeoutMs) });
      await fetchStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  const { ml, inferenceStats } = status || {};
  const policy = ml?.policy || {};
  const circuitBreaker = ml?.circuitBreaker || {};
  const pythonService = ml?.pythonService || {};

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">ML Control</h1>
              <p className="text-sm text-slate-500">Runtime management and model configuration</p>
            </div>
          </div>
          <Button variant="outline" onClick={fetchStatus} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}

        {!isAdmin && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-700">
            <AlertTriangle className="w-5 h-5" />
            Read-only mode. Only ADMIN role can modify settings.
          </div>
        )}

        {/* Python Service Status */}
        <div className="bg-white rounded-lg border border-slate-200 p-6" data-testid="ml-python-status">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-600" />
              Python ML Service
              <InfoTooltip text="External Python service for running ML inference. Shows connection status." />
            </h3>
            <StatusBadge active={pythonService.healthy} activeText="Online" inactiveText="Offline" />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div>
              <p className="font-medium text-slate-900 flex items-center gap-2">
                ML Inference
                <InfoTooltip text={ADMIN_TOOLTIPS.mlEnabled} />
              </p>
              <p className="text-sm text-slate-500">Enable/disable Python ML predictions</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge active={policy.pythonEnabled} />
              {isAdmin && (
                <Switch
                  checked={policy.pythonEnabled}
                  onCheckedChange={handleToggleML}
                  disabled={actionLoading === 'toggle'}
                  data-testid="ml-toggle-switch"
                />
              )}
            </div>
          </div>
        </div>

        {/* Models */}
        <div className="bg-white rounded-lg border border-slate-200 p-6" data-testid="ml-models-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              ML Models
              <InfoTooltip text="Individual ML models that can be enabled/disabled independently." />
            </h3>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReloadModels}
                disabled={actionLoading === 'reload'}
                data-testid="ml-reload-btn"
              >
                {actionLoading === 'reload' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                <span className="ml-2">Reload</span>
              </Button>
            )}
          </div>
          
          <div className="space-y-3">
            {/* Market Model */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div>
                <p className="font-medium text-slate-900 flex items-center gap-2">
                  Market Model
                  <InfoTooltip text={ADMIN_TOOLTIPS.marketModel} />
                </p>
                <p className="text-sm text-slate-500">Binary direction classifier (LightGBM)</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge active={policy.marketModelEnabled} />
                {isAdmin && (
                  <Switch
                    checked={policy.marketModelEnabled}
                    onCheckedChange={(v) => handleToggleModel('market', v)}
                    disabled={actionLoading === 'model-market'}
                    data-testid="ml-market-toggle"
                  />
                )}
              </div>
            </div>
            
            {/* Actor Model */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div>
                <p className="font-medium text-slate-900 flex items-center gap-2">
                  Actor Model
                  <InfoTooltip text={ADMIN_TOOLTIPS.actorModel} />
                </p>
                <p className="text-sm text-slate-500">Multiclass classifier (SMART/NEUTRAL/NOISY)</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge active={policy.actorModelEnabled} />
                {isAdmin && (
                  <Switch
                    checked={policy.actorModelEnabled}
                    onCheckedChange={(v) => handleToggleModel('actor', v)}
                    disabled={actionLoading === 'model-actor'}
                    data-testid="ml-actor-toggle"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Circuit Breaker */}
        <div className="bg-white rounded-lg border border-slate-200 p-6" data-testid="ml-circuit-breaker">
          <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-600" />
            Circuit Breaker
            <InfoTooltip text="Automatic failover protection. Opens when ML service fails repeatedly." />
          </h3>
          <p className="text-sm text-slate-500 mb-4">Automatic failover protection for ML service</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">State</p>
              <p className={`text-xl font-bold ${
                circuitBreaker.state === 'CLOSED' ? 'text-green-600' :
                circuitBreaker.state === 'OPEN' ? 'text-red-600' : 'text-amber-600'
              }`}>
                {circuitBreaker.state || 'CLOSED'}
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Failures</p>
              <p className="text-xl font-bold text-slate-900">{circuitBreaker.failures || 0}</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Threshold</p>
              <p className="text-xl font-bold text-slate-900">{circuitBreaker.threshold || 5}</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Reset (s)</p>
              <p className="text-xl font-bold text-slate-900">{(circuitBreaker.resetMs || 60000) / 1000}</p>
            </div>
          </div>
          
          {isAdmin && circuitBreaker.state === 'OPEN' && (
            <Button
              variant="outline"
              onClick={handleResetCircuitBreaker}
              disabled={actionLoading === 'circuit'}
              className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
              data-testid="ml-reset-circuit-btn"
            >
              {actionLoading === 'circuit' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4 mr-2" />
              )}
              Reset Circuit Breaker
            </Button>
          )}
        </div>

        {/* Policy Settings */}
        {isAdmin && (
          <div className="bg-white rounded-lg border border-slate-200 p-6" data-testid="ml-policy-settings">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-600" />
              Policy Settings
              <InfoTooltip text="Configure ML inference timeout and other policy parameters." />
            </h3>
            
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Label htmlFor="timeoutMs" className="text-slate-700">Timeout (ms)</Label>
                <Input
                  id="timeoutMs"
                  type="number"
                  value={policyForm.timeoutMs}
                  onChange={(e) => setPolicyForm({ ...policyForm, timeoutMs: e.target.value })}
                  className="mt-1"
                  data-testid="ml-timeout-input"
                />
              </div>
              <Button
                onClick={handleUpdatePolicy}
                disabled={actionLoading === 'policy'}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="ml-save-policy-btn"
              >
                {actionLoading === 'policy' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Inference Stats */}
        {inferenceStats && (
          <div className="bg-white rounded-lg border border-slate-200 p-6" data-testid="ml-inference-stats">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Inference Stats (Last Hour)
              <InfoTooltip text="Statistics about ML inference calls and fallbacks." />
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Market Calls</p>
                <p className="text-xl font-bold text-slate-900">{inferenceStats.market?.total || 0}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Actor Calls</p>
                <p className="text-xl font-bold text-slate-900">{inferenceStats.actor?.total || 0}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Market Fallbacks</p>
                <p className="text-xl font-bold text-amber-600">{inferenceStats.market?.fallbacks || 0}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Actor Fallbacks</p>
                <p className="text-xl font-bold text-amber-600">{inferenceStats.actor?.fallbacks || 0}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
