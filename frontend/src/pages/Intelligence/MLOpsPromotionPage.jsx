/**
 * MLOps Promotion Page
 * 
 * ML model promotion management:
 * - Mode control (OFF/SHADOW/ACTIVE_SAFE)
 * - Active/Candidate model management
 * - Regime caps configuration
 * - Monitor state
 */

import { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  AlertTriangle, 
  Shield, 
  Zap,
  Settings,
  Activity,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

// Mode styles
const MODE_STYLES = {
  OFF: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  SHADOW: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  ACTIVE_SAFE: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
};

// Health styles
const HEALTH_STYLES = {
  HEALTHY: { bg: 'bg-green-100', text: 'text-green-700' },
  DEGRADED: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  CRITICAL: { bg: 'bg-red-100', text: 'text-red-700' },
};

export default function MLOpsPromotionPage() {
  const [state, setState] = useState(null);
  const [monitorState, setMonitorState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCaps, setShowCaps] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stateRes, monitorRes] = await Promise.all([
        fetch(`${API_BASE}/api/v10/mlops/promotion/state`),
        fetch(`${API_BASE}/api/v10/mlops/monitor/state`),
      ]);
      
      const stateData = await stateRes.json();
      const monitorData = await monitorRes.json();
      
      if (stateData.ok) setState(stateData.data);
      if (monitorData.ok) setMonitorState(monitorData.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const setMode = async (mode) => {
    try {
      setLoading(true);
      await fetch(`${API_BASE}/api/v10/mlops/promotion/mode`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const rollback = async () => {
    if (!confirm('Are you sure you want to rollback to the previous model?')) return;
    
    try {
      setLoading(true);
      await fetch(`${API_BASE}/api/v10/mlops/promotion/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Manual rollback from admin UI' }),
      });
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const promote = async () => {
    if (!state?.candidateModelId) return;
    if (!confirm(`Promote ${state.candidateModelId} to ACTIVE_SAFE? This will change confidence calculations.`)) return;
    
    try {
      setLoading(true);
      await fetch(`${API_BASE}/api/v10/mlops/promotion/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: state.candidateModelId,
          reason: 'Manual promotion from admin UI',
          scope: ['CONFIDENCE'],
        }),
      });
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !state) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  if (error && !state) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl border border-red-200 p-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <span>Failed to load MLOps state: {error}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const modeStyle = MODE_STYLES[state?.mode] || MODE_STYLES.OFF;
  const healthStyle = HEALTH_STYLES[monitorState?.health] || HEALTH_STYLES.HEALTHY;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ML Promotion</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage ML model deployment and confidence calibration
            </p>
          </div>
          <button 
            onClick={fetchData}
            disabled={loading}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Mode Control */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Model Mode</h2>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${modeStyle.bg} ${modeStyle.text}`}>
              {state?.mode}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            <strong>ACTIVE_SAFE</strong> changes confidence only, never the action (BUY/SELL/AVOID).
          </p>
          
          <div className="flex gap-2">
            {['OFF', 'SHADOW', 'ACTIVE_SAFE'].map((mode) => (
              <button
                key={mode}
                onClick={() => setMode(mode)}
                disabled={loading || state?.mode === mode}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  state?.mode === mode
                    ? `${MODE_STYLES[mode].bg} ${MODE_STYLES[mode].border} ${MODE_STYLES[mode].text}`
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Active Model */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">Active Model</h2>
              </div>
              <p className="text-sm text-gray-500">
                {state?.activeModelId || 'No active model'}
              </p>
              {state?.updatedAt && (
                <p className="text-xs text-gray-400 mt-1">
                  Updated: {new Date(state.updatedAt).toLocaleString()}
                </p>
              )}
            </div>
            <button
              onClick={rollback}
              disabled={loading || !state?.activeModelId}
              className="px-4 py-2 bg-red-50 text-red-700 rounded-lg border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              Rollback
            </button>
          </div>
        </div>

        {/* Candidate Model */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Candidate Model</h2>
              </div>
              <p className="text-sm text-gray-500">
                {state?.candidateModelId || 'No candidate model'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Promote will set mode to ACTIVE_SAFE (confidence only).
              </p>
            </div>
            <button
              onClick={promote}
              disabled={loading || !state?.candidateModelId}
              className="px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-100 transition-colors disabled:opacity-50"
            >
              Promote to ACTIVE_SAFE
            </button>
          </div>
        </div>

        {/* Monitor State */}
        {monitorState && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Shadow Monitor</h2>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${healthStyle.bg} ${healthStyle.text}`}>
                {monitorState.health}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Critical Streak</span>
                <p className={`font-semibold ${monitorState.criticalStreak >= 2 ? 'text-red-600' : 'text-gray-900'}`}>
                  {monitorState.criticalStreak} / 3
                </p>
              </div>
              <div>
                <span className="text-gray-500">Auto Rollback</span>
                <p className={`font-semibold ${monitorState.autoRollbackEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                  {monitorState.autoRollbackEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Last Evaluation</span>
                <p className="font-semibold text-gray-900">
                  {monitorState.lastEvaluation 
                    ? new Date(monitorState.lastEvaluation).toLocaleTimeString() 
                    : 'Never'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Regime Caps */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button 
            onClick={() => setShowCaps(!showCaps)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Regime Confidence Caps</h2>
            </div>
            {showCaps ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          
          {showCaps && state?.policy?.maxConfidenceByRegime && (
            <div className="px-6 pb-6 border-t border-gray-100">
              <p className="text-sm text-gray-600 mt-4 mb-4">
                Maximum confidence allowed per market regime. ML cannot exceed these caps.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(state.policy.maxConfidenceByRegime).map(([regime, cap]) => (
                  <div 
                    key={regime}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded"
                  >
                    <span className="text-sm text-gray-700">{regime.replace(/_/g, ' ')}</span>
                    <span className={`text-sm font-mono font-semibold ${
                      cap <= 0.5 ? 'text-red-600' : cap <= 0.6 ? 'text-orange-600' : 'text-gray-900'
                    }`}>
                      {(cap * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Safety Rules */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Live Safety Rules</h2>
          </div>
          
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</span>
              Never flips BUY/SELL/AVOID decision
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</span>
              Macro blocks override ML calibration
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</span>
              Applies only on LIVE data mode
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</span>
              Confidence is capped by market regime
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</span>
              {state?.policy?.onlyLowerConfidence ? 'Can only lower confidence (never raise)' : 'Can adjust confidence within bounds'}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
