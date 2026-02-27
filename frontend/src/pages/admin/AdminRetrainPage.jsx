/**
 * Admin ML Retrain Page - ML v2.1 STEP 3
 * 
 * Retrain policy management and execution.
 */

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { api } from '../../api/client';
import { 
  RotateCcw, AlertTriangle, CheckCircle, XCircle,
  RefreshCw, Loader2, Settings, Play, Pause,
  Clock, TrendingUp, Zap, Activity, HelpCircle
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip';

// ============ INFO TOOLTIP ============
function InfoTip({ text }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="text-slate-400 hover:text-slate-600 ml-1">
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-white text-white border-slate-700">
          <p className="text-xs">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============ POLICY CARD ============
function PolicyCard({ policy, onToggle, onTrigger, onEdit, loading }) {
  const isEnabled = policy.enabled;
  
  return (
    <div className={`bg-white rounded-lg border ${isEnabled ? 'border-slate-200' : 'border-slate-200 opacity-60'} p-6`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900">{policy.policyId}</h3>
            <Badge className={isEnabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}>
              {isEnabled ? 'Active' : 'Disabled'}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Network: <span className="font-medium">{policy.network}</span> | 
            Model: <span className="font-medium">{policy.retrainConfig?.modelType}</span>
          </p>
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={(checked) => onToggle(policy.policyId, checked)}
          disabled={loading}
        />
      </div>

      {/* Triggers */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Triggers</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between p-2 bg-slate-50 rounded">
            <span className="text-slate-600">Accuracy &lt;</span>
            <span className="font-medium text-slate-900">{(policy.triggers?.accuracyThreshold * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between p-2 bg-slate-50 rounded">
            <span className="text-slate-600">Drift Level</span>
            <span className="font-medium text-slate-900">{policy.triggers?.driftSeverity}</span>
          </div>
          <div className="flex justify-between p-2 bg-slate-50 rounded">
            <span className="text-slate-600">Min Samples</span>
            <span className="font-medium text-slate-900">{policy.triggers?.minSamples}</span>
          </div>
          <div className="flex justify-between p-2 bg-slate-50 rounded">
            <span className="text-slate-600">Cooldown</span>
            <span className="font-medium text-slate-900">{policy.triggers?.cooldownHours}h</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Actions</h4>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={policy.actions?.autoRetrain ? 'border-green-300 text-green-700' : 'border-slate-200 text-slate-400'}>
            {policy.actions?.autoRetrain ? '✓' : '✗'} Auto Retrain
          </Badge>
          <Badge variant="outline" className={policy.actions?.autoDisableOnHighDrift ? 'border-amber-300 text-amber-700' : 'border-slate-200 text-slate-400'}>
            {policy.actions?.autoDisableOnHighDrift ? '✓' : '✗'} Auto Disable
          </Badge>
          <Badge variant="outline" className={policy.actions?.sendAlert ? 'border-blue-300 text-blue-700' : 'border-slate-200 text-slate-400'}>
            {policy.actions?.sendAlert ? '✓' : '✗'} Alerts
          </Badge>
        </div>
      </div>

      {/* Last Execution */}
      {policy.lastExecution?.timestamp && (
        <div className="mb-4 p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">Last run:</span>
            </div>
            <Badge className={
              policy.lastExecution.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
              policy.lastExecution.status === 'FAILED' ? 'bg-red-100 text-red-700' :
              'bg-slate-100 text-slate-600'
            }>
              {policy.lastExecution.status}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {new Date(policy.lastExecution.timestamp).toLocaleString()}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-slate-50 rounded">
          <p className="text-xs text-slate-500">Total</p>
          <p className="font-semibold text-slate-900">{policy.stats?.totalExecutions || 0}</p>
        </div>
        <div className="text-center p-2 bg-green-50 rounded">
          <p className="text-xs text-green-600">Success</p>
          <p className="font-semibold text-green-700">{policy.stats?.successfulRetrains || 0}</p>
        </div>
        <div className="text-center p-2 bg-red-50 rounded">
          <p className="text-xs text-red-600">Failed</p>
          <p className="font-semibold text-red-700">{policy.stats?.failedRetrains || 0}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={() => onTrigger(policy.policyId)}
          disabled={loading || !isEnabled}
        >
          <Play className="w-4 h-4 mr-1" />
          Trigger Retrain
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onEdit(policy)}
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ============ EXECUTION HISTORY CARD ============
function ExecutionCard({ execution }) {
  const statusConfig = {
    SUCCESS: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
    FAILED: { color: 'bg-red-100 text-red-700', icon: XCircle },
    IN_PROGRESS: { color: 'bg-blue-100 text-blue-700', icon: Loader2 },
    PENDING: { color: 'bg-amber-100 text-amber-700', icon: Clock },
    SKIPPED: { color: 'bg-slate-100 text-slate-600', icon: Pause },
  };
  
  const cfg = statusConfig[execution.status] || statusConfig.PENDING;
  const Icon = cfg.icon;
  
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-slate-200">
      <div className={`p-2 rounded-lg ${cfg.color.replace('text-', 'bg-').replace('700', '100')}`}>
        <Icon className={`w-4 h-4 ${cfg.color.split(' ')[1]}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-900">{execution.policyId}</span>
          <Badge className={cfg.color}>{execution.status}</Badge>
          <span className="text-xs text-slate-500">{execution.modelType}</span>
        </div>
        <div className="text-sm text-slate-500 mt-1">
          Trigger: {execution.trigger?.type || 'unknown'} | 
          By: {execution.triggeredBy || 'auto'}
        </div>
        <div className="text-xs text-slate-400 mt-1">
          {new Date(execution.createdAt).toLocaleString()}
        </div>
      </div>
      {execution.postMetrics?.improvement && (
        <div className="text-right">
          <p className="text-xs text-slate-500">Improvement</p>
          <p className={`font-semibold ${execution.postMetrics.improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {execution.postMetrics.improvement > 0 ? '+' : ''}{(execution.postMetrics.improvement * 100).toFixed(1)}%
          </p>
        </div>
      )}
    </div>
  );
}

// ============ MAIN PAGE ============
export default function AdminRetrainPage() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [policies, setPolicies] = useState([]);
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [evaluation, setEvaluation] = useState(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('admin_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [policiesRes, historyRes, summaryRes] = await Promise.all([
        api.get('/api/admin/ml/retrain/policies', { headers }),
        api.get('/api/admin/ml/retrain/history?limit=10', { headers }),
        api.get('/api/admin/ml/retrain/summary', { headers }),
      ]);

      if (policiesRes.data.ok) setPolicies(policiesRes.data.data || []);
      if (historyRes.data.ok) setHistory(historyRes.data.data || []);
      if (summaryRes.data.ok) setSummary(summaryRes.data.data);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Toggle policy
  const handleToggle = async (policyId, enabled) => {
    setActionLoading(policyId);
    try {
      const token = localStorage.getItem('admin_token');
      await api.post(`/api/admin/ml/retrain/policies/${policyId}/toggle`, 
        { enabled },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle policy');
    } finally {
      setActionLoading(null);
    }
  };

  // Trigger retrain
  const handleTrigger = async (policyId) => {
    setActionLoading(policyId);
    setSuccess(null);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await api.post(`/api/admin/ml/retrain/trigger/${policyId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.ok) {
        setSuccess(`Retrain triggered for ${policyId}`);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to trigger retrain');
    } finally {
      setActionLoading(null);
    }
  };

  // Evaluate policies
  const handleEvaluate = async () => {
    setActionLoading('evaluate');
    try {
      const token = localStorage.getItem('admin_token');
      const res = await api.post('/api/admin/ml/retrain/evaluate', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.ok) {
        setEvaluation(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to evaluate');
    } finally {
      setActionLoading(null);
    }
  };

  // Edit policy (placeholder)
  const handleEdit = (policy) => {
    // Could open a modal to edit policy
    console.log('Edit policy:', policy);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <RotateCcw className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Retrain Policies</h1>
              <p className="text-sm text-slate-500">ML v2.1 STEP 3 — Automated model retraining</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleEvaluate} disabled={actionLoading === 'evaluate'}>
              {actionLoading === 'evaluate' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Evaluate
            </Button>
            <Button variant="outline" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            {success}
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-white rounded-lg border border-slate-200 text-center">
              <p className="text-xs text-slate-500 uppercase">Total Policies</p>
              <p className="text-2xl font-bold text-slate-900">{summary.totalPolicies}</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-slate-200 text-center">
              <p className="text-xs text-slate-500 uppercase">Active</p>
              <p className="text-2xl font-bold text-green-600">{summary.enabledPolicies}</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-slate-200 text-center">
              <p className="text-xs text-slate-500 uppercase">Executions (7d)</p>
              <p className="text-2xl font-bold text-slate-900">{summary.recentExecutions}</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-slate-200 text-center">
              <p className="text-xs text-slate-500 uppercase">Success Rate</p>
              <p className="text-2xl font-bold text-blue-600">{(summary.successRate * 100).toFixed(0)}%</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-slate-200 text-center">
              <p className="text-xs text-slate-500 uppercase">Pending Triggers</p>
              <p className={`text-2xl font-bold ${summary.pendingTriggers?.length > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                {summary.pendingTriggers?.length || 0}
              </p>
            </div>
          </div>
        )}

        {/* Evaluation Results */}
        {evaluation && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Evaluation Results
            </h3>
            <p className="text-sm text-amber-700 mb-2">
              Evaluated {evaluation.evaluated} policies. {evaluation.triggered.length > 0 
                ? `${evaluation.triggered.length} ready to trigger.` 
                : 'No triggers ready.'}
            </p>
            {evaluation.details?.map((d, i) => (
              <div key={i} className="text-xs text-amber-600 ml-4">
                • {d.policyId}: {d.reason || 'OK'}
              </div>
            ))}
          </div>
        )}

        {/* Policies Grid */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Retrain Policies
            <InfoTip text="Policies define when and how models are automatically retrained based on accuracy and drift metrics." />
          </h2>
          
          {policies.length === 0 ? (
            <div className="text-center py-8 text-slate-500 bg-white rounded-lg border border-slate-200">
              <RotateCcw className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No policies configured</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {policies.map((p) => (
                <PolicyCard
                  key={p.policyId}
                  policy={p}
                  onToggle={handleToggle}
                  onTrigger={handleTrigger}
                  onEdit={handleEdit}
                  loading={actionLoading === p.policyId}
                />
              ))}
            </div>
          )}
        </div>

        {/* Execution History */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            Recent Executions
            <InfoTip text="History of retrain executions with status and results." />
          </h2>
          
          {history.length === 0 ? (
            <div className="text-center py-8 text-slate-500 bg-white rounded-lg border border-slate-200">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No executions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((e) => (
                <ExecutionCard key={e._id} execution={e} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
