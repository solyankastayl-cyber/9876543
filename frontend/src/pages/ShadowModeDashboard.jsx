/**
 * Shadow Mode Dashboard - PHASE 4.2
 * 
 * V1 vs V2 comparison control panel
 * 
 * Sources:
 * - GET /api/shadow/summary
 * - GET /api/shadow/comparisons
 * - GET /api/shadow/kill-switch
 * 
 * Blocks:
 * - Shadow Summary Card (Agreement, Flip Rate, Deltas)
 * - Kill Switch Status
 * - Decision Diff Table (v1 vs v2)
 * - Top Diverging Tokens
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  GitCompare, Shield, AlertTriangle, CheckCircle, XCircle,
  RefreshCw, Loader2, TrendingUp, TrendingDown, Minus,
  Activity, Info, Eye, ChevronRight, Clock, Zap
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { api } from '../api/client';

// ============ METRIC CARD ============
function MetricCard({ label, value, suffix = '', tooltip, status }) {
  const statusColors = {
    good: 'text-green-600',
    warning: 'text-amber-600',
    critical: 'text-red-600',
    neutral: 'text-gray-900',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm cursor-help">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</div>
            <div className={`text-2xl font-bold ${statusColors[status] || statusColors.neutral}`}>
              {typeof value === 'number' ? value.toFixed(1) : value}{suffix}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-white text-white border-gray-200 max-w-xs">
          <p className="text-sm">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============ KILL SWITCH CARD ============
function KillSwitchCard({ data }) {
  if (!data) {
    return (
      <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading kill switch status...
        </div>
      </div>
    );
  }

  const isTriggered = data.status === 'TRIGGERED';
  const hasReasons = data.reasons && data.reasons.length > 0;

  return (
    <div className={`p-6 rounded-xl border shadow-sm ${
      isTriggered 
        ? 'bg-red-50 border-red-200' 
        : 'bg-green-50 border-green-200'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isTriggered ? 'bg-red-100' : 'bg-green-100'}`}>
            <Shield className={`w-6 h-6 ${isTriggered ? 'text-red-600' : 'text-green-600'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Kill Switch</h3>
            <p className="text-sm text-gray-500">V2 safety control</p>
          </div>
        </div>
        
        <div className={`px-3 py-1.5 rounded-full text-sm font-bold ${
          isTriggered 
            ? 'bg-red-100 text-red-700' 
            : 'bg-green-100 text-green-700'
        }`}>
          {isTriggered ? 'TRIGGERED' : 'ARMED'}
        </div>
      </div>

      {/* Status explanation */}
      <div className={`p-3 rounded-lg ${isTriggered ? 'bg-red-100' : 'bg-green-100'}`}>
        <div className="flex items-start gap-2">
          {isTriggered ? (
            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          )}
          <div>
            <p className={`text-sm font-medium ${isTriggered ? 'text-red-700' : 'text-green-700'}`}>
              {isTriggered 
                ? 'V2 decisions blocked due to excessive deviation from V1'
                : 'V2 operating normally within safety thresholds'}
            </p>
          </div>
        </div>
      </div>

      {/* Trigger Reasons */}
      {hasReasons && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-xs text-gray-500 uppercase tracking-wide mb-2">Trigger Reasons</h4>
          <div className="space-y-1">
            {data.reasons.map((reason, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-red-600">
                <AlertTriangle className="w-4 h-4" />
                {reason}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <p className="mt-4 text-xs text-gray-500">
        Kill switch auto-triggers when V2 deviates significantly from V1 baseline.
      </p>
    </div>
  );
}

// ============ SHADOW SUMMARY CARD ============
function ShadowSummaryCard({ metrics }) {
  if (!metrics) {
    return (
      <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading shadow metrics...
        </div>
      </div>
    );
  }

  const getAgreementStatus = (rate) => {
    if (rate >= 0.95) return 'good';
    if (rate >= 0.8) return 'warning';
    return 'critical';
  };

  const getFlipStatus = (rate) => {
    if (rate <= 0.05) return 'good';
    if (rate <= 0.15) return 'warning';
    return 'critical';
  };

  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <GitCompare className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Shadow Mode Metrics</h3>
          <p className="text-sm text-gray-500">V1 vs V2 comparison ({metrics.window})</p>
        </div>
        <div className="ml-auto text-xs text-gray-400">
          {metrics.samples} samples
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Agreement Rate"
          value={(metrics.agreementRate || 0) * 100}
          suffix="%"
          tooltip="Percentage of decisions where V1 and V2 agree."
          status={getAgreementStatus(metrics.agreementRate || 0)}
        />
        <MetricCard
          label="Flip Rate"
          value={(metrics.decisionFlipRate || 0) * 100}
          suffix="%"
          tooltip="Rate of BUY↔SELL flips between V1 and V2."
          status={getFlipStatus(metrics.decisionFlipRate || 0)}
        />
        <MetricCard
          label="False Positives"
          value={(metrics.falsePositivesRate || 0) * 100}
          suffix="%"
          tooltip="V2 BUY when V1 said SELL/NEUTRAL."
          status={metrics.falsePositivesRate > 0.1 ? 'warning' : 'good'}
        />
        <MetricCard
          label="False Negatives"
          value={(metrics.falseNegativesRate || 0) * 100}
          suffix="%"
          tooltip="V2 SELL/NEUTRAL when V1 said BUY."
          status={metrics.falseNegativesRate > 0.1 ? 'warning' : 'good'}
        />
      </div>

      {/* Delta Metrics */}
      <h4 className="text-xs text-gray-500 uppercase tracking-wide mb-3">Average Deltas (V2 - V1)</h4>
      <div className="grid grid-cols-4 gap-3">
        <DeltaMetric label="Evidence" value={metrics.avgEvidenceDelta || 0} />
        <DeltaMetric label="Risk" value={metrics.avgRiskDelta || 0} inverted />
        <DeltaMetric label="Coverage" value={metrics.avgCoverageDelta || 0} />
        <DeltaMetric label="Confidence" value={metrics.avgConfidenceDelta || 0} />
      </div>

      {/* Computed At */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
        <Clock className="w-3 h-3" />
        Computed: {new Date(metrics.computedAt).toLocaleString()}
      </div>
    </div>
  );
}

// ============ DELTA METRIC ============
function DeltaMetric({ label, value, inverted = false }) {
  const isPositive = inverted ? value < 0 : value > 0;
  const isNegative = inverted ? value > 0 : value < 0;
  
  return (
    <div className="p-2 bg-gray-50 rounded-lg text-center">
      <div className="text-[10px] text-gray-500 uppercase">{label}</div>
      <div className={`text-lg font-bold flex items-center justify-center gap-1 ${
        value === 0 ? 'text-gray-500' :
        isPositive ? 'text-green-600' : 'text-red-600'
      }`}>
        {value > 0 && <TrendingUp className="w-4 h-4" />}
        {value < 0 && <TrendingDown className="w-4 h-4" />}
        {value === 0 && <Minus className="w-4 h-4" />}
        {Math.abs(value).toFixed(1)}
      </div>
    </div>
  );
}

// ============ DECISION DIFF TABLE ============
function DecisionDiffTable({ comparisons, loading }) {
  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!comparisons || comparisons.length === 0) {
    return (
      <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Decision Comparisons</h3>
        </div>
        <div className="text-center py-8">
          <Info className="w-8 h-8 text-gray-700 mx-auto mb-2" />
          <p className="text-gray-500">No comparisons recorded yet</p>
          <p className="text-xs text-gray-400 mt-1">Comparisons will appear as Engine V2 processes decisions</p>
        </div>
      </div>
    );
  }

  // Filter to show diverging decisions first
  const sorted = [...comparisons].sort((a, b) => {
    const aFlip = a.v1?.decision !== a.v2?.decision ? 1 : 0;
    const bFlip = b.v1?.decision !== b.v2?.decision ? 1 : 0;
    return bFlip - aFlip;
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Decision Diff Table</h3>
        </div>
        <span className="text-xs text-gray-400">{comparisons.length} comparisons</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Subject</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">V1 Decision</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">V2 Decision</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Evidence Δ</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Risk Δ</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Coverage Δ</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Reason</th>
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, 20).map((comp, idx) => (
              <ComparisonRow key={idx} comparison={comp} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ COMPARISON ROW ============
function ComparisonRow({ comparison }) {
  const { subject, v1, v2, diff } = comparison;
  
  const isFlip = v1?.decision !== v2?.decision;
  const isBuyToSell = v1?.decision === 'BUY' && v2?.decision === 'SELL';
  const isSellToBuy = v1?.decision === 'SELL' && v2?.decision === 'BUY';
  
  const decisionColors = {
    BUY: 'bg-green-100 text-green-700',
    SELL: 'bg-red-100 text-red-700',
    NEUTRAL: 'bg-gray-100 text-gray-700',
  };

  return (
    <tr className={`border-b border-gray-100 ${isFlip ? 'bg-amber-50' : 'hover:bg-gray-50'}`}>
      {/* Subject */}
      <td className="px-4 py-3">
        <div className="text-sm font-medium text-gray-900">
          {subject?.id?.substring(0, 12) || 'Unknown'}
        </div>
        <div className="text-xs text-gray-500">{subject?.kind || 'entity'}</div>
      </td>
      
      {/* V1 Decision */}
      <td className="px-4 py-3 text-center">
        <span className={`px-2 py-1 rounded text-xs font-bold ${decisionColors[v1?.decision] || decisionColors.NEUTRAL}`}>
          {v1?.decision || 'N/A'}
        </span>
      </td>
      
      {/* V2 Decision */}
      <td className="px-4 py-3 text-center">
        <span className={`px-2 py-1 rounded text-xs font-bold ${decisionColors[v2?.decision] || decisionColors.NEUTRAL}`}>
          {v2?.decision || 'N/A'}
        </span>
      </td>
      
      {/* Status */}
      <td className="px-4 py-3 text-center">
        {isFlip ? (
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            isBuyToSell || isSellToBuy ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
          }`}>
            FLIP
          </span>
        ) : (
          <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
            AGREE
          </span>
        )}
      </td>
      
      {/* Evidence Delta */}
      <td className="px-4 py-3 text-center">
        <DeltaValue value={diff?.evidence || 0} />
      </td>
      
      {/* Risk Delta */}
      <td className="px-4 py-3 text-center">
        <DeltaValue value={diff?.risk || 0} inverted />
      </td>
      
      {/* Coverage Delta */}
      <td className="px-4 py-3 text-center">
        <DeltaValue value={diff?.coverage || 0} />
      </td>
      
      {/* Reason */}
      <td className="px-4 py-3">
        <p className="text-xs text-gray-500 max-w-[200px] truncate">
          {diff?.reason || (isFlip ? 'Decision divergence detected' : 'Decisions aligned')}
        </p>
      </td>
    </tr>
  );
}

// ============ DELTA VALUE ============
function DeltaValue({ value, inverted = false }) {
  const isPositive = inverted ? value < 0 : value > 0;
  
  if (value === 0) {
    return <span className="text-xs text-gray-400">0</span>;
  }
  
  return (
    <span className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
      {value > 0 ? '+' : ''}{value.toFixed(1)}
    </span>
  );
}

// ============ MAIN PAGE ============
export default function ShadowModeDashboard() {
  const [loading, setLoading] = useState(true);
  const [window, setWindow] = useState('24h');
  const [summary, setSummary] = useState(null);
  const [comparisons, setComparisons] = useState([]);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [summaryRes, compsRes] = await Promise.all([
        api.get(`/api/shadow/summary?window=${window}`),
        api.get(`/api/shadow/comparisons?window=${window}&limit=50`),
      ]);

      if (summaryRes.data.ok) {
        setSummary(summaryRes.data.data);
      }
      
      if (compsRes.data.ok) {
        setComparisons(compsRes.data.data || []);
      }
    } catch (err) {
      setError(err.message);
      console.error('Shadow fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [window]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const windows = ['1h', '6h', '24h', '7d'];

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">Shadow Mode</h1>
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                V1 vs V2
              </span>
            </div>
            <p className="text-gray-500 text-sm">
              Monitor decision divergence between legacy and V2 engine
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Window Selector */}
            <div className="inline-flex rounded-lg bg-gray-100 p-0.5">
              {windows.map(w => (
                <button
                  key={w}
                  onClick={() => setWindow(w)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    window === w 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
            
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </button>
            
            <Link
              to="/engine"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
            >
              <Zap className="w-4 h-4" />
              Engine
            </Link>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Top Row: Kill Switch + Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-1">
            <KillSwitchCard data={summary?.killSwitch} />
          </div>
          <div className="lg:col-span-2">
            <ShadowSummaryCard metrics={summary?.metrics} />
          </div>
        </div>

        {/* Decision Diff Table */}
        <DecisionDiffTable comparisons={comparisons} loading={loading} />

        {/* Info Footer */}
        <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-2">
            <Info className="w-3 h-3" />
            Shadow Mode is read-only. No impact on production decisions. All comparisons are logged for audit.
          </p>
        </div>
      </main>
    </div>
  );
}
