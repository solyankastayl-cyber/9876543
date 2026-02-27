/**
 * MLOps Dashboard Page
 * 
 * Visualizes ML model lifecycle: training, promotion, health monitoring
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  Brain, 
  RefreshCw, 
  Play, 
  Pause, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  TrendingUp,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { ModelRegistry } from '../../components/mlops/ModelRegistry';
import { RunsHistory } from '../../components/mlops/RunsHistory';
import { ShadowHealth } from '../../components/mlops/ShadowHealth';
import { MetricsChart } from '../../components/mlops/MetricsChart';
import { MLOpsActions } from '../../components/mlops/MLOpsActions';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

export default function MLOpsPage() {
  const [models, setModels] = useState([]);
  const [runs, setRuns] = useState([]);
  const [shadowHealth, setShadowHealth] = useState(null);
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [modelsRes, runsRes, healthRes, stateRes] = await Promise.all([
        fetch(`${API_BASE}/api/v10/mlops/models?limit=20`),
        fetch(`${API_BASE}/api/v10/mlops/runs?limit=50`),
        fetch(`${API_BASE}/api/v10/mlops/shadow/health`),
        fetch(`${API_BASE}/api/v10/mlops/state`),
      ]);

      const [modelsData, runsData, healthData, stateData] = await Promise.all([
        modelsRes.json(),
        runsRes.json(),
        healthRes.json(),
        stateRes.json(),
      ]);

      if (modelsData.ok) setModels(modelsData.models || []);
      if (runsData.ok) setRuns(runsData.runs || []);
      if (healthData.ok) setShadowHealth(healthData);
      if (stateData.ok) setState(stateData.state);
      
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleAction = async (action, payload) => {
    try {
      let endpoint = '';
      switch (action) {
        case 'retrain':
          endpoint = '/api/v10/mlops/retrain';
          break;
        case 'promote':
          endpoint = '/api/v10/mlops/promote';
          break;
        case 'rollback':
          endpoint = '/api/v10/mlops/rollback';
          break;
        case 'retire':
          endpoint = '/api/v10/mlops/retire';
          break;
        case 'evaluate':
          endpoint = '/api/v10/mlops/shadow/evaluate';
          break;
        default:
          return;
      }

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {}),
      });

      const data = await res.json();
      
      if (data.ok) {
        // Refresh data after action
        setTimeout(fetchData, 1000);
      } else {
        alert(`Action failed: ${data.message || data.error}`);
      }
    } catch (err) {
      alert(`Action error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
          <p className="text-gray-500">Loading MLOps Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Brain className="w-8 h-8 text-purple-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">MLOps Dashboard</h1>
              <p className="text-sm text-gray-500">Model lifecycle management & monitoring</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* State Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StateCard
          label="Active Model"
          value={state?.active ? state.active.slice(0, 8) + '...' : 'None'}
          status={shadowHealth?.active?.health}
          icon={CheckCircle}
        />
        <StateCard
          label="Candidate Model"
          value={state?.candidate ? state.candidate.slice(0, 8) + '...' : 'None'}
          status={shadowHealth?.candidate?.health}
          icon={Clock}
        />
        <StateCard
          label="Total Models"
          value={models.length}
          icon={Brain}
        />
        <StateCard
          label="Operations"
          value={runs.length}
          icon={Activity}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Models & Actions */}
        <div className="xl:col-span-2 space-y-6">
          {/* Shadow Health */}
          <ShadowHealth 
            health={shadowHealth} 
            onEvaluate={() => handleAction('evaluate')}
          />

          {/* Model Registry */}
          <ModelRegistry 
            models={models} 
            activeId={state?.active}
            candidateId={state?.candidate}
            onPromote={(modelId) => handleAction('promote', { modelId })}
            onRetire={(modelId) => handleAction('retire', { modelId })}
          />

          {/* Metrics Chart */}
          <MetricsChart runs={runs} models={models} />
        </div>

        {/* Right Column: Actions & History */}
        <div className="space-y-6">
          {/* Actions Panel */}
          <MLOpsActions 
            state={state}
            onRetrain={() => handleAction('retrain', { notes: 'Manual retrain from UI' })}
            onRollback={() => handleAction('rollback')}
            candidateId={state?.candidate}
          />

          {/* Runs History */}
          <RunsHistory runs={runs} />
        </div>
      </div>
    </div>
  );
}

function StateCard({ label, value, status, icon: Icon }) {
  const getStatusColor = () => {
    switch (status) {
      case 'HEALTHY': return 'text-green-600';
      case 'DEGRADED': return 'text-yellow-600';
      case 'CRITICAL': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{label}</span>
        {Icon && <Icon className={`w-5 h-5 ${getStatusColor()}`} />}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold text-gray-900">{value}</span>
        {status && (
          <span className={`text-xs px-2 py-0.5 rounded ${
            status === 'HEALTHY' ? 'bg-green-100 text-green-700' :
            status === 'DEGRADED' ? 'bg-yellow-100 text-yellow-700' :
            status === 'CRITICAL' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {status}
          </span>
        )}
      </div>
    </div>
  );
}
