/**
 * ML Ready Dashboard v2
 * 
 * Comprehensive ML readiness control panel with:
 * - Data Readiness
 * - Attribution Quality
 * - SIM vs LIVE Drift
 * - Shadow Safety
 * - Learning Dataset
 * - Final Verdict + Actions
 */
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BarChart3, Database, Shield, AlertTriangle, CheckCircle2, XCircle,
  RefreshCw, Loader2, Activity, TrendingUp, TrendingDown, 
  Zap, Target, Clock, Play, Download, TestTube, Brain,
  Lock, Unlock, Power, ChevronRight
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// ============================================================================
// API
// ============================================================================

async function fetchMLReadySummary() {
  const response = await fetch(`${API_URL}/api/ml-ready/v2/summary`);
  return response.json();
}

// ============================================================================
// Status Badge Component
// ============================================================================

function StatusBadge({ status }) {
  const styles = {
    OK: 'bg-green-100 text-green-700 border-green-200',
    READY: 'bg-green-100 text-green-700 border-green-200',
    SAFE: 'bg-green-100 text-green-700 border-green-200',
    STABLE: 'bg-green-100 text-green-700 border-green-200',
    WARN: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    PARTIAL: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    CONDITIONAL: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    UNSTABLE: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    FAIL: 'bg-red-100 text-red-700 border-red-200',
    NOT_READY: 'bg-red-100 text-red-700 border-red-200',
    UNSAFE: 'bg-red-100 text-red-700 border-red-200',
    UNKNOWN: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded border ${styles[status] || styles.UNKNOWN}`}>
      {status}
    </span>
  );
}

// ============================================================================
// Global Verdict Card
// ============================================================================

function VerdictCard({ verdict }) {
  if (!verdict) return null;
  
  const bgColor = {
    READY: 'from-green-50 to-emerald-50 border-green-200',
    CONDITIONAL: 'from-yellow-50 to-amber-50 border-yellow-200',
    NOT_READY: 'from-red-50 to-rose-50 border-red-200',
  }[verdict.status] || 'from-gray-50 to-slate-50 border-gray-200';
  
  const iconColor = {
    READY: 'text-green-600 bg-green-100',
    CONDITIONAL: 'text-yellow-600 bg-yellow-100',
    NOT_READY: 'text-red-600 bg-red-100',
  }[verdict.status] || 'text-gray-600 bg-gray-100';
  
  const Icon = verdict.status === 'READY' ? CheckCircle2 : 
               verdict.status === 'CONDITIONAL' ? AlertTriangle : XCircle;
  
  return (
    <div className={`rounded-2xl border-2 bg-gradient-to-br ${bgColor} p-6 mb-8 shadow-sm`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${iconColor}`}>
            <Icon className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">ML STATUS</h2>
              <StatusBadge status={verdict.status} />
            </div>
            <p className="text-sm text-gray-600 mt-1">{verdict.reason}</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{verdict.confidence}%</div>
          <div className="text-xs text-gray-500">Confidence</div>
        </div>
      </div>
      
      {verdict.blockers && verdict.blockers.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs font-semibold text-gray-500 mb-2">BLOCKING ISSUES:</div>
          <div className="flex flex-wrap gap-2">
            {verdict.blockers.map((blocker, idx) => (
              <span key={idx} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
                {blocker}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Data Readiness Card
// ============================================================================

function DataReadinessCard({ data }) {
  if (!data) return null;
  
  const totalSamples = data.samples?.total || 0;
  const liveSamples = data.samples?.live || 0;
  const simSamples = data.samples?.sim || 0;
  const liveRatio = totalSamples > 0 ? (liveSamples / totalSamples) * 100 : 0;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-gray-900">Data Readiness</h3>
          </div>
          <StatusBadge status={data.status} />
        </div>
      </div>
      
      <div className="p-5 space-y-4">
        {/* Sample counts */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{totalSamples.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{liveSamples.toLocaleString()}</div>
            <div className="text-xs text-gray-500">LIVE</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{simSamples.toLocaleString()}</div>
            <div className="text-xs text-gray-500">SIM</div>
          </div>
        </div>
        
        {/* LIVE ratio bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">LIVE Ratio</span>
            <span className="font-medium">{liveRatio.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${liveRatio}%` }}
            />
          </div>
        </div>
        
        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
            <span className="text-xs text-gray-500">Time Span</span>
            <span className="font-medium text-gray-900">{data.timeSpanDays} days</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
            <span className="text-xs text-gray-500">Variance</span>
            <StatusBadge status={data.featureVariance?.status} />
          </div>
        </div>
        
        {/* Buckets */}
        <div className="pt-2">
          <div className="text-xs text-gray-500 mb-2">Bucket Distribution</div>
          <div className="flex gap-2">
            <div className={`flex-1 p-2 rounded-lg text-center ${data.buckets?.BUY > 0 ? 'bg-green-50' : 'bg-gray-50'}`}>
              <div className="text-lg font-bold text-green-600">{data.buckets?.BUY || 0}</div>
              <div className="text-xs text-gray-500">BUY</div>
            </div>
            <div className="flex-1 p-2 rounded-lg text-center bg-yellow-50">
              <div className="text-lg font-bold text-yellow-600">{data.buckets?.WATCH || 0}</div>
              <div className="text-xs text-gray-500">WATCH</div>
            </div>
            <div className="flex-1 p-2 rounded-lg text-center bg-red-50">
              <div className="text-lg font-bold text-red-600">{data.buckets?.SELL || 0}</div>
              <div className="text-xs text-gray-500">SELL</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Attribution Quality Card
// ============================================================================

function AttributionQualityCard({ data }) {
  if (!data) return null;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-gray-900">Attribution Quality</h3>
          </div>
          <StatusBadge status={data.status} />
        </div>
      </div>
      
      <div className="p-5 space-y-4">
        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Correlation Score</div>
            <div className={`text-2xl font-bold ${
              data.correlationScore >= 0.5 ? 'text-green-600' :
              data.correlationScore >= 0.3 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {(data.correlationScore * 100).toFixed(0)}%
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Conflict Rate</div>
            <div className={`text-2xl font-bold ${
              data.conflictRate <= 0.2 ? 'text-green-600' :
              data.conflictRate <= 0.3 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {(data.conflictRate * 100).toFixed(0)}%
            </div>
          </div>
        </div>
        
        {/* Stability */}
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
          <span className="text-xs text-gray-500">Stability</span>
          <StatusBadge status={data.stability} />
        </div>
        
        {/* Top signals */}
        {data.topSignals && data.topSignals.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 mb-2">Top Signals</div>
            <div className="space-y-2">
              {data.topSignals.slice(0, 4).map((signal, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">{signal.name}</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${signal.impact > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {signal.impact > 0 ? '+' : ''}{signal.impact.toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {(signal.correlation * 100).toFixed(0)}% corr
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Drift Analysis Card
// ============================================================================

function DriftCard({ data }) {
  if (!data) return null;
  
  const DriftBar = ({ label, value, max = 0.3 }) => {
    const pct = Math.min((value / max) * 100, 100);
    const color = value <= max * 0.5 ? 'bg-green-500' : value <= max ? 'bg-yellow-500' : 'bg-red-500';
    
    return (
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500">{label}</span>
          <span className="font-medium">{(value * 100).toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-orange-600" />
            <h3 className="font-bold text-gray-900">SIM vs LIVE Drift</h3>
          </div>
          <StatusBadge status={data.status} />
        </div>
      </div>
      
      <div className="p-5 space-y-4">
        <DriftBar label="Outcome Drift" value={data.simVsLiveOutcomeDrift} max={0.3} />
        <DriftBar label="Feature Drift" value={data.featureDrift} max={0.25} />
        <DriftBar label="Label Drift" value={data.labelDrift} max={0.25} />
        
        <div className="pt-2 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">SIM Ratio</span>
            <span className={`font-bold ${data.simRatio > 0.9 ? 'text-red-600' : 'text-gray-900'}`}>
              {(data.simRatio * 100).toFixed(0)}%
            </span>
          </div>
        </div>
        
        {data.details && (
          <p className="text-xs text-gray-500 italic">{data.details}</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Shadow Safety Card
// ============================================================================

function ShadowSafetyCard({ data }) {
  if (!data) return null;
  
  const CheckItem = ({ label, value, expected, icon: Icon }) => {
    const isOk = value === expected;
    return (
      <div className={`flex items-center justify-between p-3 rounded-lg ${
        isOk ? 'bg-green-50' : 'bg-red-50'
      }`}>
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${isOk ? 'text-green-600' : 'text-red-600'}`} />
          <span className="text-sm text-gray-700">{label}</span>
        </div>
        <span className={`text-sm font-medium ${isOk ? 'text-green-600' : 'text-red-600'}`}>
          {String(value)}
        </span>
      </div>
    );
  };
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-gray-900">Shadow Safety</h3>
          </div>
          <StatusBadge status={data.status} />
        </div>
      </div>
      
      <div className="p-5 space-y-3">
        <CheckItem 
          label="Kill Switch" 
          value={data.killSwitch} 
          expected="ARMED" 
          icon={Power} 
        />
        <CheckItem 
          label="ML Mode" 
          value={data.mlMode} 
          expected="OFF" 
          icon={data.mlMode === 'OFF' ? Lock : Unlock} 
        />
        <CheckItem 
          label="Rule Overrides" 
          value={data.ruleOverrides} 
          expected={0} 
          icon={Shield} 
        />
        <CheckItem 
          label="Leakage Detected" 
          value={data.leakageDetected} 
          expected={false} 
          icon={AlertTriangle} 
        />
      </div>
    </div>
  );
}

// ============================================================================
// Learning Dataset Card
// ============================================================================

function LearningDatasetCard({ data }) {
  if (!data) return null;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-violet-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-violet-600" />
            <h3 className="font-bold text-gray-900">Learning Dataset</h3>
          </div>
          <StatusBadge status={data.status} />
        </div>
      </div>
      
      <div className="p-5 space-y-4">
        {/* Sample count */}
        <div className="text-center p-4 bg-violet-50 rounded-xl">
          <div className="text-3xl font-bold text-violet-600">{data.trainingSamples?.toLocaleString()}</div>
          <div className="text-xs text-gray-500">Training Samples</div>
        </div>
        
        {/* Quality metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Quality Score</div>
            <div className={`text-xl font-bold ${
              data.qualityScore >= 0.6 ? 'text-green-600' :
              data.qualityScore >= 0.5 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {(data.qualityScore * 100).toFixed(0)}%
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">High Quality</div>
            <div className="text-xl font-bold text-gray-900">
              {(data.highQualityRatio * 100).toFixed(0)}%
            </div>
          </div>
        </div>
        
        {/* Label balance */}
        <div>
          <div className="text-xs text-gray-500 mb-2">Label Balance</div>
          <div className="flex gap-2">
            {['SUCCESS', 'FLAT', 'FAIL'].map(label => {
              const value = data.labelBalance?.[label] || 0;
              const color = {
                SUCCESS: 'bg-green-100 text-green-700',
                FLAT: 'bg-gray-100 text-gray-700',
                FAIL: 'bg-red-100 text-red-700',
              }[label];
              
              return (
                <div key={label} className={`flex-1 p-2 rounded-lg text-center ${color}`}>
                  <div className="text-lg font-bold">{(value * 100).toFixed(0)}%</div>
                  <div className="text-xs">{label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Actions Card
// ============================================================================

function ActionsCard({ actions, verdict }) {
  const navigate = useNavigate();
  
  if (!actions) return null;
  
  const ActionButton = ({ enabled, icon: Icon, label, description, onClick }) => (
    <button
      disabled={!enabled}
      onClick={onClick}
      className={`flex items-center gap-4 w-full p-4 rounded-xl border-2 transition ${
        enabled 
          ? 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
          : 'bg-gray-50 border-gray-100 cursor-not-allowed opacity-50'
      }`}
    >
      <div className={`p-3 rounded-xl ${enabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-left flex-1">
        <div className={`font-semibold ${enabled ? 'text-gray-900' : 'text-gray-400'}`}>{label}</div>
        <div className={`text-xs ${enabled ? 'text-gray-500' : 'text-gray-400'}`}>{description}</div>
      </div>
      <ChevronRight className={`w-5 h-5 ${enabled ? 'text-gray-400' : 'text-gray-700'}`} />
    </button>
  );
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-gray-600" />
          <h3 className="font-bold text-gray-900">Actions</h3>
        </div>
      </div>
      
      <div className="p-5 space-y-3">
        <ActionButton 
          enabled={true}
          icon={Brain}
          label="Shadow ML Dashboard"
          description="Monitor shadow ML model status and predictions"
          onClick={() => navigate('/shadow-ml')}
        />
        <ActionButton 
          enabled={actions.enableShadowML}
          icon={Play}
          label="Enable Shadow ML"
          description="Start ML in shadow mode (no decision impact)"
          onClick={() => navigate('/shadow-ml')}
        />
        <ActionButton 
          enabled={actions.exportDataset}
          icon={Download}
          label="Export Training Dataset"
          description="Download dataset for external analysis"
          onClick={() => alert('Export not yet implemented')}
        />
        <ActionButton 
          enabled={actions.runEvaluation}
          icon={TestTube}
          label="Run Shadow Evaluation"
          description="Compare ML vs Rules performance"
          onClick={() => navigate('/shadow-ml')}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Main Dashboard
// ============================================================================

export default function MLReadyDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchMLReadySummary();
      
      if (result.ok) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to load data');
      }
    } catch (err) {
      setError('Network error');
      console.error('ML Ready load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="mlready-title">
              ML Ready Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              v2 • SIM + LIVE • Shadow-Safe Control Panel
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              to="/attribution"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition text-sm font-medium"
            >
              ← Attribution
            </Link>
            
            <Link
              to="/shadow-ml"
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition text-sm font-medium"
            >
              <Brain className="w-4 h-4" />
              Shadow ML →
            </Link>
            
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50 shadow-sm"
              data-testid="refresh-btn"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </button>
          </div>
        </div>
        
        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}
        
        {/* Loading */}
        {loading && !data && (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
            <span className="text-gray-600 font-medium">Loading ML readiness data...</span>
          </div>
        )}
        
        {/* Dashboard Content */}
        {data && (
          <>
            {/* Global Verdict */}
            <VerdictCard verdict={data.verdict} />
            
            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <DataReadinessCard data={data.dataReadiness} />
              <AttributionQualityCard data={data.attributionQuality} />
              <DriftCard data={data.drift} />
              <ShadowSafetyCard data={data.shadowSafety} />
              <LearningDatasetCard data={data.learningDataset} />
              <ActionsCard actions={data.actions} verdict={data.verdict} />
            </div>
            
            {/* Last Updated */}
            {data.lastUpdated && (
              <div className="mt-8 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                Last evaluated: {new Date(data.lastUpdated).toLocaleString()}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
