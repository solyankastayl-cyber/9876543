/**
 * Admin Backtesting Page - ETAP 4
 * 
 * ML Quality Control Dashboard:
 * - KPI Summary (Accuracy, Precision)
 * - Confusion Matrix
 * - Accuracy Over Time Chart
 */

import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { api } from '../../api/client';
import { 
  BarChart3, RefreshCw, Loader2, AlertTriangle, 
  CheckCircle, XCircle, TrendingUp, Target, Activity
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { InfoTooltip, ADMIN_TOOLTIPS } from '../../components/admin/InfoTooltip';

// ============ CONSTANTS ============
const NETWORKS = [
  { id: 'ethereum', name: 'Ethereum' },
  { id: 'arbitrum', name: 'Arbitrum' },
  { id: 'optimism', name: 'Optimism' },
  { id: 'base', name: 'Base' },
  { id: 'polygon', name: 'Polygon' },
];

const WINDOWS = [
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
  { value: '60', label: '60 days' },
];

// ============ KPI CARD ============
function KPICard({ title, value, threshold, icon: Icon, format = 'percent', tooltip }) {
  const numValue = typeof value === 'number' ? value : 0;
  const displayValue = format === 'percent' 
    ? `${(numValue * 100).toFixed(1)}%`
    : numValue.toLocaleString();
  
  let status = 'neutral';
  if (threshold) {
    if (numValue >= threshold.good) status = 'good';
    else if (numValue >= threshold.warning) status = 'warning';
    else status = 'bad';
  }
  
  const statusColors = {
    good: 'bg-green-50 border-green-200 text-green-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    bad: 'bg-red-50 border-red-200 text-red-700',
    neutral: 'bg-slate-50 border-slate-200 text-slate-700',
  };
  
  return (
    <div className={`rounded-lg border p-4 ${statusColors[status]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium opacity-80 flex items-center gap-1">
          {title}
          {tooltip && <InfoTooltip text={tooltip} />}
        </span>
        {Icon && <Icon className="w-4 h-4 opacity-60" />}
      </div>
      <div className="text-2xl font-bold">{displayValue}</div>
    </div>
  );
}

// ============ CONFUSION MATRIX ============
function ConfusionMatrix({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          Confusion Matrix
          <InfoTooltip text={ADMIN_TOOLTIPS.confusionMatrix} />
        </h3>
        <div className="text-center py-8 text-slate-500">No data available</div>
      </div>
    );
  }
  
  const classes = ['BUY', 'SELL', 'NEUTRAL'];
  
  // Calculate totals for percentages
  const totals = {};
  classes.forEach(actual => {
    totals[actual] = classes.reduce((sum, pred) => sum + (data[actual]?.[pred] || 0), 0);
  });
  
  const getColor = (actual, predicted, value) => {
    const total = totals[actual] || 1;
    const pct = value / total;
    
    if (actual === predicted) {
      // Diagonal - correct predictions
      if (pct >= 0.6) return 'bg-green-100 text-green-800';
      if (pct >= 0.4) return 'bg-green-50 text-green-700';
      return 'bg-amber-50 text-amber-700';
    } else {
      // Off-diagonal - errors
      if (pct >= 0.3) return 'bg-red-100 text-red-700';
      if (pct >= 0.15) return 'bg-amber-50 text-amber-600';
      return 'bg-slate-50 text-slate-600';
    }
  };
  
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <Target className="w-5 h-5 text-blue-600" />
        Confusion Matrix
      </h3>
      <p className="text-sm text-slate-500 mb-4">
        Rows = Actual outcome, Columns = Predicted by model
      </p>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="p-2 text-left text-slate-500"></th>
              <th className="p-2 text-center text-slate-600 font-medium" colSpan={3}>
                Predicted
              </th>
            </tr>
            <tr>
              <th className="p-2 text-left text-slate-500"></th>
              {classes.map(cls => (
                <th key={cls} className="p-2 text-center text-slate-700 font-medium">
                  {cls}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {classes.map((actual, rowIdx) => (
              <tr key={actual}>
                {rowIdx === 0 && (
                  <td 
                    rowSpan={3} 
                    className="p-2 text-slate-600 font-medium vertical-rl transform rotate-180"
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                  >
                    Actual
                  </td>
                )}
                <td className="p-2 text-slate-700 font-medium">{actual}</td>
                {classes.map(predicted => {
                  const value = data[actual]?.[predicted] || 0;
                  const total = totals[actual] || 1;
                  const pct = ((value / total) * 100).toFixed(0);
                  
                  return (
                    <td 
                      key={predicted}
                      className={`p-3 text-center font-mono ${getColor(actual, predicted, value)}`}
                    >
                      <div className="font-bold">{value}</div>
                      <div className="text-xs opacity-70">{pct}%</div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-100 rounded" /> Correct
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-100 rounded" /> Error
        </span>
      </div>
    </div>
  );
}

// ============ ACCURACY CHART ============
function AccuracyChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Accuracy Over Time</h3>
        <div className="text-center py-8 text-slate-500">No historical data</div>
      </div>
    );
  }
  
  const maxAccuracy = Math.max(...data.map(d => d.accuracy), 0.8);
  const minAccuracy = Math.min(...data.map(d => d.accuracy), 0.3);
  const range = maxAccuracy - minAccuracy || 0.1;
  
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        Accuracy Over Time
      </h3>
      
      {/* Simple bar chart */}
      <div className="h-48 flex items-end gap-1">
        {data.slice(-30).map((d, i) => {
          const height = ((d.accuracy - minAccuracy) / range) * 100;
          const isGood = d.accuracy >= 0.6;
          const isWarning = d.accuracy >= 0.5 && d.accuracy < 0.6;
          
          return (
            <div 
              key={i}
              className="flex-1 min-w-[8px] group relative"
            >
              <div
                className={`w-full rounded-t transition-all hover:opacity-80 ${
                  isGood ? 'bg-green-500' : isWarning ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ height: `${Math.max(height, 5)}%` }}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                {d.date}: {(d.accuracy * 100).toFixed(1)}%
              </div>
            </div>
          );
        })}
      </div>
      
      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-xs text-slate-500">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded" /> ≥60%
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 bg-amber-500 rounded" /> 50-60%
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded" /> &lt;50%
        </span>
      </div>
    </div>
  );
}

// ============ MAIN PAGE ============
export default function AdminBacktestingPage() {
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Controls
  const [network, setNetwork] = useState('ethereum');
  const [windowDays, setWindowDays] = useState('30');
  const [modelVersion, setModelVersion] = useState('ALL');
  const [availableModels, setAvailableModels] = useState([]);
  
  // Data
  const [backtest, setBacktest] = useState(null);
  const [history, setHistory] = useState([]);
  
  // Fetch available models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const res = await api.get(`/api/admin/backtest/models?network=${network}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.ok) {
          setAvailableModels(res.data.data.versions || []);
        }
      } catch (err) {
        console.error('Failed to fetch models:', err);
      }
    };
    fetchModels();
  }, [network]);
  
  // Run backtest
  const runBacktest = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('admin_token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Parallel requests
      const [backtestRes, historyRes] = await Promise.all([
        api.get(`/api/admin/backtest/market?network=${network}&windowDays=${windowDays}`, { headers }),
        api.get(`/api/admin/backtest/history?network=${network}&limit=30&modelVersion=${modelVersion}`, { headers }),
      ]);
      
      if (backtestRes.data.ok) {
        setBacktest(backtestRes.data.data);
      }
      
      if (historyRes.data.ok) {
        setHistory(historyRes.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to run backtest');
    } finally {
      setLoading(false);
    }
  };
  
  // Auto-run on mount
  useEffect(() => {
    runBacktest();
  }, []);
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Backtesting</h1>
              <p className="text-sm text-slate-500">ML Quality Control Dashboard</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex flex-wrap items-end gap-4">
            {/* Network */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Network</label>
              <select
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                data-testid="network-select"
              >
                {NETWORKS.map(n => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </select>
            </div>
            
            {/* Window */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Period</label>
              <select
                value={windowDays}
                onChange={(e) => setWindowDays(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                data-testid="window-select"
              >
                {WINDOWS.map(w => (
                  <option key={w.value} value={w.value}>{w.label}</option>
                ))}
              </select>
            </div>
            
            {/* Model Version */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Model Version</label>
              <select
                value={modelVersion}
                onChange={(e) => setModelVersion(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                data-testid="model-select"
              >
                <option value="ALL">All Versions</option>
                {availableModels.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            
            {/* Run Button */}
            <Button 
              onClick={runBacktest}
              disabled={loading}
              data-testid="run-backtest-btn"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Run Backtest
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* KPI Summary */}
        {backtest && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard
              title="Overall Accuracy"
              value={backtest.summary.accuracy}
              threshold={{ good: 0.6, warning: 0.5 }}
              icon={Target}
            />
            <KPICard
              title="Precision BUY"
              value={backtest.summary.precisionBuy}
              threshold={{ good: 0.6, warning: 0.5 }}
              icon={TrendingUp}
            />
            <KPICard
              title="Precision SELL"
              value={backtest.summary.precisionSell}
              threshold={{ good: 0.6, warning: 0.5 }}
              icon={Activity}
            />
            <KPICard
              title="Samples"
              value={backtest.summary.samples}
              format="number"
              icon={BarChart3}
            />
          </div>
        )}

        {/* Model Info */}
        {backtest?.summary && (
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <span>Model: <Badge variant="outline">{backtest.summary.modelVersion}</Badge></span>
            <span>Window: <Badge variant="outline">{backtest.summary.window}</Badge></span>
            {backtest.note && (
              <span className="text-amber-600 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                {backtest.note}
              </span>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Confusion Matrix */}
          <ConfusionMatrix data={backtest?.confusionMatrix} />
          
          {/* Accuracy Chart */}
          <AccuracyChart data={history} />
        </div>

        {/* Decision Guide */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            Decision Guide
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 mt-1.5 bg-green-500 rounded-full" />
              <div>
                <div className="font-medium text-slate-900">Accuracy ≥ 60%</div>
                <div className="text-slate-600">ML can be trusted. Enable ADVISORY mode.</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 mt-1.5 bg-amber-500 rounded-full" />
              <div>
                <div className="font-medium text-slate-900">Accuracy 50-60%</div>
                <div className="text-slate-600">ML is marginal. Keep in observation mode.</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 mt-1.5 bg-red-500 rounded-full" />
              <div>
                <div className="font-medium text-slate-900">Accuracy &lt; 50%</div>
                <div className="text-slate-600">ML is harmful. Disable or retrain.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
