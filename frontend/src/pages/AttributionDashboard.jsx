/**
 * Attribution Dashboard (Block F3.5)
 * 
 * Analytics dashboard for signal effectiveness, confidence calibration,
 * and ML readiness verification.
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, Target, TrendingUp, TrendingDown, 
  CheckCircle2, XCircle, AlertTriangle, Clock,
  RefreshCw, Loader2, Info, Shield, Activity,
  Zap, Database, Percent, Calendar
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// ============================================================================
// Tooltip descriptions for metrics
// ============================================================================
const METRIC_TOOLTIPS = {
  snapshots: 'Total number of market state snapshots collected. Each snapshot captures price, volume, indicators at a point in time.',
  attributions: 'Number of predictions that have been evaluated against actual outcomes. Higher = more learning data.',
  samples: 'Training samples generated from attributions. Used to improve model accuracy over time.',
  successRate: 'Percentage of predictions that moved in the expected direction. 60%+ is considered good.',
  avgConfidenceDelta: 'Average change in confidence calibration. Positive = model becoming more accurate.',
  dataSpan: 'Number of days of historical data available for analysis and training.',
};

// ============================================================================
// API Functions
// ============================================================================

async function fetchDashboard() {
  const response = await fetch(`${API_URL}/api/attribution/dashboard`);
  return response.json();
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatNumber(num) {
  if (!num || isNaN(num)) return '0';
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function getReliabilityBadge(reliability) {
  switch (reliability) {
    case 'HIGH':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'LOW':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

// ============================================================================
// Summary Cards with Tooltips
// ============================================================================

function SummaryCards({ summary }) {
  if (!summary) return null;
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm cursor-help">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Database className="w-4 h-4" />
                <span className="text-xs font-medium">Snapshots</span>
                <Info className="w-3 h-3 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{formatNumber(summary.totalSnapshots)}</div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-xs">{METRIC_TOOLTIPS.snapshots}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm cursor-help">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Target className="w-4 h-4" />
                <span className="text-xs font-medium">Attributions</span>
                <Info className="w-3 h-3 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{formatNumber(summary.totalAttributions)}</div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-xs">{METRIC_TOOLTIPS.attributions}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm cursor-help">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <BarChart3 className="w-4 h-4" />
                <span className="text-xs font-medium">Samples</span>
                <Info className="w-3 h-3 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{formatNumber(summary.totalSamples)}</div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-xs">{METRIC_TOOLTIPS.samples}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm cursor-help">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Percent className="w-4 h-4" />
                <span className="text-xs font-medium">Success Rate</span>
                <Info className="w-3 h-3 text-gray-400" />
              </div>
              <div className={`text-2xl font-bold ${
                summary.overallSuccessRate >= 60 ? 'text-green-600' :
                summary.overallSuccessRate >= 40 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {summary.overallSuccessRate}%
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-xs">{METRIC_TOOLTIPS.successRate}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm cursor-help">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium">Avg Δ Conf</span>
                <Info className="w-3 h-3 text-gray-400" />
              </div>
              <div className={`text-2xl font-bold ${
                summary.avgConfidenceDelta >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {summary.avgConfidenceDelta > 0 ? '+' : ''}{summary.avgConfidenceDelta}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-xs">{METRIC_TOOLTIPS.avgConfidenceDelta}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm cursor-help">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-medium">Data Span</span>
                <Info className="w-3 h-3 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{summary.dataSpanDays} days</div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-xs">{METRIC_TOOLTIPS.dataSpan}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

// ============================================================================
// ML Ready Checklist
// ============================================================================

function MLReadyChecklist({ checklist }) {
  if (!checklist) return null;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className={`px-5 py-4 border-b ${
        checklist.isReady ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              checklist.isReady ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {checklist.isReady ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className={`text-lg font-bold ${
                checklist.isReady ? 'text-green-700' : 'text-yellow-700'
              }`}>
                ML Ready Checklist
              </h3>
              <p className="text-sm text-gray-600">
                {checklist.passedCount}/{checklist.totalRequired} required checks passed
              </p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-lg font-bold ${
            checklist.isReady 
              ? 'bg-green-100 text-green-700' 
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {checklist.isReady ? 'READY' : 'NOT READY'}
          </div>
        </div>
      </div>
      
      <div className="p-5">
        <div className="mb-4 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
          {checklist.recommendation}
        </div>
        
        <div className="space-y-3">
          {checklist.checks.map((check, idx) => (
            <div 
              key={idx}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                check.passed 
                  ? 'bg-green-50 border-green-200' 
                  : check.required 
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gray-50 border-gray-200'
              }`}
              data-testid={`ml-check-${check.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {check.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : check.required ? (
                  <XCircle className="w-5 h-5 text-red-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${
                    check.passed ? 'text-green-800' : check.required ? 'text-red-800' : 'text-gray-700'
                  }`}>
                    {check.name}
                  </span>
                  {check.required && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">Required</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{check.description}</p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="text-gray-500">
                    Current: <span className="font-medium text-gray-700">{check.currentValue}</span>
                  </span>
                  <span className="text-gray-500">
                    Threshold: <span className="font-medium text-gray-700">{check.threshold}</span>
                  </span>
                </div>
                {check.details && (
                  <p className="text-xs text-gray-500 mt-1">{check.details}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Signal Effectiveness Table
// ============================================================================

function SignalEffectivenessTable({ signals }) {
  if (!signals || signals.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <BarChart3 className="w-12 h-12 text-gray-700 mx-auto mb-3" />
        <p className="text-gray-500">No signal data available yet</p>
        <p className="text-sm text-gray-400 mt-1">Signals will appear after more decisions are tracked</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-lg font-bold text-gray-900">Signal Effectiveness</h3>
            <p className="text-sm text-gray-600">Which signals predict success?</p>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Signal</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Total</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Success</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Fail</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Success Rate</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Avg Impact</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Reliability</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {signals.map((signal, idx) => (
              <tr key={idx} className="hover:bg-gray-50" data-testid={`signal-row-${signal.signal}`}>
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-900">{signal.signal}</span>
                </td>
                <td className="px-4 py-3 text-center text-gray-700">{signal.totalOccurrences}</td>
                <td className="px-4 py-3 text-center text-green-600 font-medium">{signal.successCount}</td>
                <td className="px-4 py-3 text-center text-red-600 font-medium">{signal.failCount}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-bold ${
                    signal.successRate >= 60 ? 'text-green-600' :
                    signal.successRate >= 40 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {signal.successRate}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-medium ${
                    signal.avgContribution > 0 ? 'text-green-600' :
                    signal.avgContribution < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {signal.avgContribution > 0 ? '+' : ''}{signal.avgContribution}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2 py-1 rounded border ${getReliabilityBadge(signal.reliability)}`}>
                    {signal.reliability}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// Confidence Calibration
// ============================================================================

function ConfidenceCalibrationTable({ calibration }) {
  if (!calibration || calibration.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <Target className="w-12 h-12 text-gray-700 mx-auto mb-3" />
        <p className="text-gray-500">No calibration data available yet</p>
      </div>
    );
  }
  
  // Group by bucket
  const byBucket = calibration.reduce((acc, item) => {
    if (!acc[item.bucket]) acc[item.bucket] = [];
    acc[item.bucket].push(item);
    return acc;
  }, {});
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 text-purple-600" />
          <div>
            <h3 className="text-lg font-bold text-gray-900">Confidence Calibration</h3>
            <p className="text-sm text-gray-600">Is our confidence score accurate?</p>
          </div>
        </div>
      </div>
      
      <div className="p-5 space-y-6">
        {['BUY', 'WATCH', 'SELL'].map(bucket => {
          const items = byBucket[bucket] || [];
          if (items.length === 0) return null;
          
          const bucketStyle = {
            BUY: 'bg-green-50 border-green-200 text-green-700',
            WATCH: 'bg-yellow-50 border-yellow-200 text-yellow-700',
            SELL: 'bg-red-50 border-red-200 text-red-700',
          }[bucket];
          
          return (
            <div key={bucket}>
              <div className={`inline-flex items-center px-3 py-1 rounded-lg border mb-3 ${bucketStyle}`}>
                <span className="font-semibold text-sm">{bucket}</span>
              </div>
              
              <div className="grid grid-cols-4 gap-3">
                {items.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-lg border ${
                      item.isOverconfident ? 'bg-red-50 border-red-200' :
                      item.isUnderconfident ? 'bg-blue-50 border-blue-200' :
                      'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="text-xs text-gray-500 mb-1">{item.confidenceRange}</div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-xl font-bold ${
                        item.isOverconfident ? 'text-red-600' :
                        item.isUnderconfident ? 'text-blue-600' :
                        'text-gray-700'
                      }`}>
                        {item.actualSuccessRate}%
                      </span>
                      <span className="text-sm text-gray-400">
                        vs {item.expectedSuccessRate}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {item.totalDecisions} decisions
                    </div>
                    {item.isOverconfident && (
                      <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" /> Overconfident
                      </div>
                    )}
                    {item.isUnderconfident && (
                      <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Underconfident
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Bucket Performance Timeline
// ============================================================================

function BucketPerformanceTimeline({ performance }) {
  if (!performance || performance.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <Activity className="w-12 h-12 text-gray-700 mx-auto mb-3" />
        <p className="text-gray-500">No performance data available yet</p>
      </div>
    );
  }
  
  // Group by date
  const byDate = performance.reduce((acc, item) => {
    if (!acc[item.date]) acc[item.date] = {};
    acc[item.date][item.bucket] = item;
    return acc;
  }, {});
  
  const dates = Object.keys(byDate).sort();
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-orange-600" />
          <div>
            <h3 className="text-lg font-bold text-gray-900">Performance Timeline</h3>
            <p className="text-sm text-gray-600">Daily bucket performance</p>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-green-600 uppercase">BUY</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-yellow-600 uppercase">WATCH</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-red-600 uppercase">SELL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {dates.slice(-7).map(date => (
              <tr key={date} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{date}</td>
                {['BUY', 'WATCH', 'SELL'].map(bucket => {
                  const data = byDate[date][bucket];
                  if (!data) {
                    return <td key={bucket} className="px-4 py-3 text-center text-gray-400">-</td>;
                  }
                  return (
                    <td key={bucket} className="px-4 py-3 text-center">
                      <div className={`font-bold ${
                        data.successRate >= 60 ? 'text-green-600' :
                        data.successRate >= 40 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {data.successRate}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {data.successCount}/{data.totalDecisions}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// Main Dashboard Component
// ============================================================================

export default function AttributionDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchDashboard();
      
      if (result.ok) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to load dashboard');
      }
    } catch (err) {
      setError('Network error');
      console.error('Dashboard load error:', err);
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
            <h1 className="text-3xl font-bold text-gray-900" data-testid="attribution-title">
              Attribution Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Block F3.5 • Signal Analytics • ML Readiness
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              to="/rankings"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition text-sm font-medium"
            >
              ← Rankings
            </Link>
            
            <Link
              to="/ml-ready"
              className="px-4 py-2 bg-violet-100 text-violet-700 hover:bg-violet-200 rounded-lg transition text-sm font-medium"
              data-testid="ml-ready-link"
            >
              ML Ready v2 →
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
        
        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
            <button 
              onClick={loadData}
              className="ml-auto text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Retry
            </button>
          </div>
        )}
        
        {/* Loading state */}
        {loading && !data && (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
            <span className="text-gray-600 font-medium">Loading attribution data...</span>
          </div>
        )}
        
        {/* Dashboard Content */}
        {data && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <SummaryCards summary={data.summary} />
            
            {/* ML Ready Checklist */}
            <MLReadyChecklist checklist={data.mlReadyChecklist} />
            
            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Signal Effectiveness */}
              <SignalEffectivenessTable signals={data.signalEffectiveness} />
              
              {/* Confidence Calibration */}
              <ConfidenceCalibrationTable calibration={data.confidenceCalibration} />
            </div>
            
            {/* Performance Timeline */}
            <BucketPerformanceTimeline performance={data.bucketPerformance} />
            
            {/* Last Updated */}
            {data.lastUpdated && (
              <div className="text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                Last updated: {new Date(data.lastUpdated).toLocaleString()}
              </div>
            )}
          </div>
        )}
        
        {/* Empty state */}
        {!loading && !data && !error && (
          <div className="text-center py-32 bg-white rounded-xl border border-gray-200 shadow-sm">
            <BarChart3 className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Attribution Data</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Attribution data will appear after the system tracks decision outcomes.
            </p>
            <Link
              to="/rankings"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition shadow-sm"
            >
              Go to Rankings
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
