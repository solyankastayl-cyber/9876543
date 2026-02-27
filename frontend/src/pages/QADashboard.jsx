/**
 * QA Scenarios Dashboard (P0)
 * 
 * Visualization for QA validation scenarios:
 * - QA-1: Low Variance Detection
 * - QA-2: High Conflict Detection  
 * - QA-3: SIM vs LIVE Drift
 * - QA-4: Bucket Imbalance
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2, XCircle, AlertTriangle, RefreshCw, Loader2,
  Activity, BarChart3, TestTube, Shield, Zap, Target,
  ChevronRight, Database, GitBranch, Clock
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// ============================================================
// SCENARIO CARD COMPONENT
// ============================================================

function ScenarioCard({ scenario }) {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'PASS': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'WARN': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'FAIL': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return null;
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'PASS': return 'bg-green-50 border-green-200';
      case 'WARN': return 'bg-yellow-50 border-yellow-200';
      case 'FAIL': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScenarioIcon = (id) => {
    switch (id) {
      case 'QA-1': return <Activity className="w-5 h-5" />;
      case 'QA-2': return <GitBranch className="w-5 h-5" />;
      case 'QA-3': return <Database className="w-5 h-5" />;
      case 'QA-4': return <BarChart3 className="w-5 h-5" />;
      default: return <TestTube className="w-5 h-5" />;
    }
  };

  return (
    <div className={`rounded-xl border-2 ${getStatusBg(scenario.status)} p-5`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            {getScenarioIcon(scenario.id)}
          </div>
          <div>
            <div className="font-bold text-gray-900">{scenario.id}</div>
            <div className="text-sm text-gray-600">{scenario.name}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon(scenario.status)}
          <span className={`font-bold text-lg ${getScoreColor(scenario.score)}`}>
            {scenario.score}%
          </span>
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-4">{scenario.details}</p>

      {/* Metrics */}
      <div className="bg-white/50 rounded-lg p-3 mb-3">
        <div className="text-xs font-semibold text-gray-500 mb-2">METRICS</div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {Object.entries(scenario.metrics || {}).slice(0, 6).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-gray-600">{formatMetricKey(key)}:</span>
              <span className="font-mono text-gray-900">
                {typeof value === 'string' && value.startsWith('{') 
                  ? '...' 
                  : String(value).slice(0, 10)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {scenario.recommendations && scenario.recommendations.length > 0 && (
        <div className="border-t border-gray-200 pt-3">
          <div className="text-xs font-semibold text-gray-500 mb-2">RECOMMENDATIONS</div>
          <ul className="text-sm text-gray-700 space-y-1">
            {scenario.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function formatMetricKey(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

// ============================================================
// DATA SNAPSHOT COMPONENT
// ============================================================

function DataSnapshotCard({ snapshot }) {
  if (!snapshot) return null;

  const total = snapshot.totalSamples || 0;
  const sim = snapshot.simSamples || 0;
  const live = snapshot.liveSamples || 0;
  const buckets = snapshot.bucketDistribution || {};

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Database className="w-5 h-5 text-gray-600" />
        <h3 className="font-bold text-gray-900">Data Snapshot</h3>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{total.toLocaleString()}</div>
          <div className="text-xs text-gray-600">Total Samples</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{sim.toLocaleString()}</div>
          <div className="text-xs text-gray-600">SIM Samples</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{live.toLocaleString()}</div>
          <div className="text-xs text-gray-600">LIVE Samples</div>
        </div>
      </div>

      {/* Bucket Distribution Bar */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-gray-500">BUCKET DISTRIBUTION</div>
        <div className="h-4 rounded-full overflow-hidden flex bg-gray-100">
          {buckets.BUY > 0 && (
            <div 
              className="bg-green-500" 
              style={{ width: `${(buckets.BUY / total) * 100}%` }}
              title={`BUY: ${buckets.BUY}`}
            />
          )}
          {buckets.WATCH > 0 && (
            <div 
              className="bg-yellow-500" 
              style={{ width: `${(buckets.WATCH / total) * 100}%` }}
              title={`WATCH: ${buckets.WATCH}`}
            />
          )}
          {buckets.SELL > 0 && (
            <div 
              className="bg-red-500" 
              style={{ width: `${(buckets.SELL / total) * 100}%` }}
              title={`SELL: ${buckets.SELL}`}
            />
          )}
        </div>
        <div className="flex justify-between text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-green-500"></span>
            BUY: {buckets.BUY || 0} ({total ? Math.round((buckets.BUY || 0) / total * 100) : 0}%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-yellow-500"></span>
            WATCH: {buckets.WATCH || 0} ({total ? Math.round((buckets.WATCH || 0) / total * 100) : 0}%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-red-500"></span>
            SELL: {buckets.SELL || 0} ({total ? Math.round((buckets.SELL || 0) / total * 100) : 0}%)
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// OVERALL STATUS COMPONENT
// ============================================================

function OverallStatusCard({ overall, score, summary, runAt }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'PASS': return 'from-green-500 to-emerald-600';
      case 'WARN': return 'from-yellow-500 to-amber-600';
      case 'FAIL': return 'from-red-500 to-rose-600';
      default: return 'from-gray-500 to-slate-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PASS': return <CheckCircle2 className="w-8 h-8" />;
      case 'WARN': return <AlertTriangle className="w-8 h-8" />;
      case 'FAIL': return <XCircle className="w-8 h-8" />;
      default: return <TestTube className="w-8 h-8" />;
    }
  };

  return (
    <div className={`bg-gradient-to-br ${getStatusColor(overall)} rounded-xl p-6 text-white shadow-lg`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {getStatusIcon(overall)}
          <div>
            <div className="text-3xl font-bold">{overall}</div>
            <div className="text-white/80 text-sm">Overall QA Status</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold">{score}%</div>
          <div className="text-white/80 text-sm">Score</div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/20">
        <p className="text-sm text-white/90">{summary}</p>
        {runAt && (
          <div className="flex items-center gap-1 mt-2 text-white/60 text-xs">
            <Clock className="w-3 h-3" />
            {new Date(runAt).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// ACTIONS CARD
// ============================================================

function ActionsCard({ onRunQA, onGenerateBuy, loading }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-gray-600" />
        <h3 className="font-bold text-gray-900">Actions</h3>
      </div>

      <div className="space-y-3">
        <button
          onClick={onRunQA}
          disabled={loading}
          className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition disabled:opacity-50"
          data-testid="run-qa-btn"
        >
          <div className="flex items-center gap-3">
            <TestTube className="w-5 h-5 text-blue-600" />
            <div className="text-left">
              <div className="font-semibold text-gray-900">Run QA Scenarios</div>
              <div className="text-xs text-gray-600">Execute all validation checks</div>
            </div>
          </div>
          {loading ? (
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </button>

        <button
          onClick={onGenerateBuy}
          disabled={loading}
          className="w-full flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition disabled:opacity-50"
          data-testid="generate-buy-btn"
        >
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-green-600" />
            <div className="text-left">
              <div className="font-semibold text-gray-900">Generate BUY Samples</div>
              <div className="text-xs text-gray-600">Add synthetic BUY for ML diversity</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// MAIN DASHBOARD
// ============================================================

export default function QADashboard() {
  const [qaReport, setQaReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runQA = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/qa/run`);
      const data = await res.json();
      if (data.ok) {
        setQaReport(data.data);
      } else {
        setError(data.error || 'Failed to run QA');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const generateBuySamples = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/simulation/synthetic-buy?count=100`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.ok) {
        // Re-run QA after generating
        await runQA();
      } else {
        setError(data.error || 'Failed to generate samples');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [runQA]);

  useEffect(() => {
    runQA();
  }, [runQA]);

  return (
    <div className="min-h-screen bg-gray-50">
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="qa-title">
              QA Scenarios Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              P0 • Simulation Validation • ML Readiness Checks
            </p>
          </div>
          
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <Link
              to="/ml-ready"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition text-sm font-medium"
            >
              ← ML Ready
            </Link>
            
            <button
              onClick={runQA}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50 shadow-sm"
              data-testid="refresh-btn"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Run QA
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && !qaReport && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        )}

        {/* Content */}
        {qaReport && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Overall + Actions */}
            <div className="space-y-6">
              <OverallStatusCard
                overall={qaReport.overall}
                score={qaReport.overallScore}
                summary={qaReport.summary}
                runAt={qaReport.runAt}
              />
              
              <DataSnapshotCard snapshot={qaReport.dataSnapshot} />
              
              <ActionsCard
                onRunQA={runQA}
                onGenerateBuy={generateBuySamples}
                loading={loading}
              />
            </div>

            {/* Right Column - Scenarios */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {qaReport.scenarios?.map((scenario) => (
                <ScenarioCard key={scenario.id} scenario={scenario} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
