/**
 * Training Sandbox Component
 * 
 * ЭТАП 3: Isolated ML Training Infrastructure
 * 
 * ⚠️ CRITICAL: This is a LABORATORY environment
 * ❌ NO Engine connection
 * ❌ NO production influence
 * ✅ Read-only monitoring
 * ✅ Safe experimentation
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  Beaker, Play, RefreshCw, CheckCircle, XCircle, 
  Clock, AlertTriangle, Loader2, TrendingUp,
  Database, Layers, BarChart2, HelpCircle, Shield
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { api } from '../api/client';

// Status badge component
function StatusBadge({ status }) {
  const config = {
    PENDING: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock },
    RUNNING: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Loader2, animate: true },
    COMPLETED: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
    FAILED: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
    BLOCKED: { bg: 'bg-amber-100', text: 'text-amber-700', icon: AlertTriangle },
  };
  
  const c = config[status] || config.PENDING;
  const Icon = c.icon;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${c.bg} ${c.text}`}>
      <Icon className={`w-3 h-3 ${c.animate ? 'animate-spin' : ''}`} />
      {status}
    </span>
  );
}

// Metric card component
function MetricCard({ label, value, sublabel, color = 'text-gray-900' }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg text-center">
      <div className="text-[10px] text-gray-500 uppercase">{label}</div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      {sublabel && <div className="text-[10px] text-gray-400">{sublabel}</div>}
    </div>
  );
}

// Training run row component
function TrainingRunRow({ run, onSelect }) {
  return (
    <div 
      className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:border-gray-200 cursor-pointer transition-colors"
      onClick={() => onSelect(run)}
      data-testid={`training-run-${run.runId}`}
    >
      <div className="flex items-center gap-3">
        <StatusBadge status={run.status} />
        <div>
          <div className="text-sm font-medium text-gray-900">{run.modelType}</div>
          <div className="text-xs text-gray-500">Horizon: {run.horizon}</div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {run.metrics?.precision && (
          <div className="text-right">
            <div className="text-xs text-gray-500">Precision</div>
            <div className="text-sm font-medium text-gray-900">
              {(run.metrics.precision * 100).toFixed(1)}%
            </div>
          </div>
        )}
        
        <div className="text-right">
          <div className="text-xs text-gray-500">Samples</div>
          <div className="text-sm font-medium text-gray-900">
            {run.datasetStats?.totalSamples || 0}
          </div>
        </div>
        
        <div className="text-xs text-gray-400">
          {run.startedAt ? new Date(run.startedAt).toLocaleDateString() : '-'}
        </div>
      </div>
    </div>
  );
}

// Run details modal
function RunDetailsModal({ run, onClose }) {
  if (!run) return null;
  
  return (
    <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Training Run Details</h3>
          <StatusBadge status={run.status} />
        </div>
        
        {/* Run ID */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-500 uppercase">Run ID</div>
          <div className="text-sm font-mono text-gray-700 break-all">{run.runId}</div>
        </div>
        
        {/* Dataset Stats */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 uppercase mb-2">Dataset</div>
          <div className="grid grid-cols-4 gap-2">
            <MetricCard label="Total" value={run.datasetStats?.totalSamples || 0} />
            <MetricCard label="Train" value={run.datasetStats?.trainSize || 0} />
            <MetricCard label="Val" value={run.datasetStats?.valSize || 0} />
            <MetricCard label="Test" value={run.datasetStats?.testSize || 0} />
          </div>
        </div>
        
        {/* Metrics */}
        {run.metrics && Object.keys(run.metrics).length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-gray-500 uppercase mb-2">Metrics</div>
            <div className="grid grid-cols-3 gap-2">
              {run.metrics.precision !== undefined && (
                <MetricCard 
                  label="Precision" 
                  value={`${(run.metrics.precision * 100).toFixed(1)}%`}
                  color="text-blue-600"
                />
              )}
              {run.metrics.recall !== undefined && (
                <MetricCard 
                  label="Recall" 
                  value={`${(run.metrics.recall * 100).toFixed(1)}%`}
                  color="text-blue-600"
                />
              )}
              {run.metrics.f1 !== undefined && (
                <MetricCard 
                  label="F1 Score" 
                  value={`${(run.metrics.f1 * 100).toFixed(1)}%`}
                  color="text-green-600"
                />
              )}
              {run.metrics.roc_auc !== undefined && (
                <MetricCard 
                  label="ROC-AUC" 
                  value={run.metrics.roc_auc.toFixed(3)}
                  color="text-purple-600"
                />
              )}
              {run.metrics.brier_score !== undefined && (
                <MetricCard 
                  label="Brier" 
                  value={run.metrics.brier_score.toFixed(4)}
                  color="text-orange-600"
                />
              )}
            </div>
          </div>
        )}
        
        {/* Block Reasons */}
        {run.blockReasons?.length > 0 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="text-xs text-amber-600 uppercase mb-2">Block Reasons</div>
            <ul className="space-y-1">
              {run.blockReasons.map((reason, idx) => (
                <li key={idx} className="text-sm text-amber-700 flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Error */}
        {run.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-xs text-red-600 uppercase mb-1">Error</div>
            <div className="text-sm text-red-700">{run.error}</div>
          </div>
        )}
        
        {/* Critical Warning */}
        <div className="p-3 bg-gray-100 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            <Shield className="w-3 h-3 inline mr-1" />
            This model is <strong>SANDBOX ONLY</strong> and does NOT affect Engine decisions.
          </p>
        </div>
        
        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// Main Training Sandbox Component
export function TrainingSandbox() {
  const [loading, setLoading] = useState(true);
  const [sandboxStatus, setSandboxStatus] = useState(null);
  const [runs, setRuns] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainForm, setTrainForm] = useState({
    modelType: 'confidence_calibrator',
    horizon: '7d',
    forceRetrain: false,
  });
  
  // Fetch sandbox data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, runsRes, modelsRes] = await Promise.all([
        api.get('/api/ml/sandbox/status'),
        api.get('/api/ml/sandbox/runs'),
        api.get('/api/ml/sandbox/models'),
      ]);
      
      if (statusRes.data.ok) setSandboxStatus(statusRes.data.data);
      if (runsRes.data.ok) setRuns(runsRes.data.data || []);
      if (modelsRes.data.ok) setModels(modelsRes.data.data?.models || []);
    } catch (err) {
      console.error('Sandbox fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Start training
  const handleStartTraining = async () => {
    if (isTraining) return;
    
    setIsTraining(true);
    try {
      const res = await api.post('/api/ml/sandbox/train', trainForm);
      
      if (res.data.ok) {
        // Refresh runs list
        setTimeout(fetchData, 1000);
      } else {
        console.error('Training failed:', res.data.error);
      }
    } catch (err) {
      console.error('Training error:', err);
    } finally {
      setIsTraining(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Sandbox Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Beaker className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-semibold text-gray-900">ML Training Sandbox</h3>
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded font-medium">ISOLATED</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="ml-1 text-gray-400 hover:text-gray-600">
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-white text-white border-gray-200">
                  <p className="text-sm">
                    Sandbox for ML experiments. Models trained here do NOT affect Engine or Rankings. 
                    Safe environment for testing without production impact.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            data-testid="sandbox-refresh-btn"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </button>
        </div>
        
        {/* Sandbox Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-[10px] text-gray-500 uppercase">Status</div>
            <div className={`text-lg font-bold ${sandboxStatus?.sandbox?.enabled ? 'text-green-600' : 'text-red-600'}`}>
              {sandboxStatus?.sandbox?.enabled ? 'ACTIVE' : 'DISABLED'}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-[10px] text-gray-500 uppercase">Total Runs</div>
            <div className="text-lg font-bold text-gray-900">{sandboxStatus?.stats?.totalRuns || 0}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-[10px] text-gray-500 uppercase">Successful</div>
            <div className="text-lg font-bold text-green-600">{sandboxStatus?.stats?.successfulRuns || 0}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-[10px] text-gray-500 uppercase">Engine Connected</div>
            <div className="text-lg font-bold text-red-600">NO</div>
          </div>
        </div>
        
        {/* Safety Gates */}
        {sandboxStatus?.gates && (
          <div className={`p-3 rounded-lg ${sandboxStatus.gates.allowed ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {sandboxStatus.gates.allowed ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              )}
              <span className={`text-sm font-medium ${sandboxStatus.gates.allowed ? 'text-green-700' : 'text-amber-700'}`}>
                Training Gates: {sandboxStatus.gates.allowed ? 'OPEN' : 'BLOCKED'}
              </span>
            </div>
            
            {sandboxStatus.gates.reasons?.length > 0 && (
              <ul className="space-y-1 ml-6">
                {sandboxStatus.gates.reasons.map((reason, idx) => (
                  <li key={idx} className="text-xs text-amber-600">• {reason}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      
      {/* Start Training Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Play className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-semibold text-gray-900">Start Training</h3>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">Sandbox Only</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Model Type */}
          <div>
            <label className="block text-xs text-gray-500 uppercase mb-1">Model Type</label>
            <select
              value={trainForm.modelType}
              onChange={e => setTrainForm(f => ({ ...f, modelType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              data-testid="model-type-select"
            >
              <option value="confidence_calibrator">Confidence Calibrator</option>
              <option value="outcome_model">Outcome Model</option>
              <option value="ranking_assist">Ranking Assist</option>
            </select>
          </div>
          
          {/* Horizon */}
          <div>
            <label className="block text-xs text-gray-500 uppercase mb-1">Horizon</label>
            <select
              value={trainForm.horizon}
              onChange={e => setTrainForm(f => ({ ...f, horizon: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              data-testid="horizon-select"
            >
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
            </select>
          </div>
          
          {/* Force Retrain */}
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={trainForm.forceRetrain}
                onChange={e => setTrainForm(f => ({ ...f, forceRetrain: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                data-testid="force-retrain-checkbox"
              />
              <span className="text-sm text-gray-700">Force Retrain</span>
            </label>
          </div>
        </div>
        
        <button
          onClick={handleStartTraining}
          disabled={isTraining || !sandboxStatus?.gates?.allowed}
          className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg font-medium transition-colors ${
            isTraining || !sandboxStatus?.gates?.allowed
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
          data-testid="start-training-btn"
        >
          {isTraining ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Starting Training...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Start Training Run
            </>
          )}
        </button>
        
        {/* Warning */}
        <p className="mt-3 text-xs text-gray-500 text-center">
          ⚠️ Training runs in isolated sandbox. Results do NOT affect production.
        </p>
      </div>
      
      {/* Training Runs History */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">Training Runs</h3>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">{runs.length}</span>
        </div>
        
        {runs.length === 0 ? (
          <div className="text-center py-8">
            <Database className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">No training runs yet</p>
            <p className="text-xs text-gray-400 mt-1">Start a training run to see history</p>
          </div>
        ) : (
          <div className="space-y-2">
            {runs.map(run => (
              <TrainingRunRow 
                key={run.runId} 
                run={run} 
                onSelect={setSelectedRun}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Trained Models */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900">Sandbox Models</h3>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">{models.length}</span>
        </div>
        
        {models.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">No models trained yet</p>
            <p className="text-xs text-gray-400 mt-1">Complete a training run to create models</p>
          </div>
        ) : (
          <div className="space-y-2">
            {models.map(model => (
              <div 
                key={model.modelId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <div className="text-sm font-medium text-gray-900">{model.modelType}</div>
                  <div className="text-xs text-gray-500">
                    Horizon: {model.horizon} • Trained: {new Date(model.trainedAt).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {model.metrics?.precision && (
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Precision</div>
                      <div className="text-sm font-medium text-gray-900">
                        {(model.metrics.precision * 100).toFixed(1)}%
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-1">
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] rounded">
                      NOT CONNECTED
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded">
                      SANDBOX ONLY
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Critical Disclaimer */}
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-red-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Sandbox Isolation Guarantee</p>
            <p className="text-xs text-red-600 mt-1">
              Models trained here are completely isolated from the production system. 
              They do NOT influence Engine decisions, Rankings, or Risk calculations. 
              This is a laboratory for safe experimentation only.
            </p>
          </div>
        </div>
      </div>
      
      {/* Run Details Modal */}
      <RunDetailsModal run={selectedRun} onClose={() => setSelectedRun(null)} />
    </div>
  );
}

export default TrainingSandbox;
