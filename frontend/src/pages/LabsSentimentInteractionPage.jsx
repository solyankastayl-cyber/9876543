/**
 * S10.LABS-04 — Sentiment Interaction UI
 * 
 * Research analytics: When does sentiment matter vs when is it ignored?
 * 
 * RULES:
 * - Read-only
 * - Sentiment ≠ signal
 * - We analyze interaction patterns, not predictions
 * - NO trading signals
 */

import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  Loader2,
  AlertTriangle,
  Activity,
  MessageCircle,
  TrendingUp,
  TrendingDown,
  MinusCircle,
  CheckCircle,
  XCircle,
  HelpCircle,
  Zap,
  BarChart3,
  PieChart,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/api/client';

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const HORIZONS = ['5m', '15m', '1h', '4h', '24h'];
const WINDOWS = ['24h', '7d', '30d'];
const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'];

const ALIGNMENT_CONFIG = {
  CONFIRMED: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Confirmed' },
  IGNORED: { icon: MinusCircle, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Ignored' },
  CONTRADICTED: { icon: XCircle, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Contradicted' },
  OVERRIDDEN: { icon: Zap, color: 'text-red-600', bg: 'bg-red-100', label: 'Overridden' },
  NO_SIGNAL: { icon: HelpCircle, color: 'text-slate-400', bg: 'bg-slate-50', label: 'No Signal' },
};

// ═══════════════════════════════════════════════════════════════
// CONTROLS PANEL
// ═══════════════════════════════════════════════════════════════

function ControlsPanel({ params, setParams, onRefresh, loading }) {
  return (
    <Card className="border-0 shadow-sm bg-white" data-testid="sentiment-controls">
      <CardContent className="py-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Symbol</span>
            <select
              value={params.symbol}
              onChange={(e) => setParams({ ...params, symbol: e.target.value })}
              className="px-3 py-1.5 bg-slate-800 text-white rounded text-sm border border-gray-200"
              data-testid="sentiment-symbol-select"
            >
              {SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Horizon</span>
            <select
              value={params.horizon}
              onChange={(e) => setParams({ ...params, horizon: e.target.value })}
              className="px-3 py-1.5 bg-slate-800 text-white rounded text-sm border border-gray-200"
            >
              {HORIZONS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Window</span>
            <select
              value={params.window}
              onChange={(e) => setParams({ ...params, window: e.target.value })}
              className="px-3 py-1.5 bg-slate-800 text-white rounded text-sm border border-gray-200"
            >
              {WINDOWS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="ml-auto p-2 rounded hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// TOTALS PANEL
// ═══════════════════════════════════════════════════════════════

function TotalsPanel({ totals, metrics }) {
  const independencePercent = (metrics?.marketIndependenceScore * 100 || 0).toFixed(0);
  
  return (
    <Card data-testid="sentiment-totals">
      <CardContent className="py-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <span className="text-2xl font-bold">{totals?.observations || 0}</span>
            <span className="text-sm text-slate-500">observations</span>
          </div>

          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-purple-500" />
            <span className="text-2xl font-bold text-purple-600">{totals?.withSentiment || 0}</span>
            <span className="text-sm text-slate-500">with sentiment</span>
          </div>

          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-2xl font-bold text-green-600">{totals?.interactions || 0}</span>
            <span className="text-sm text-slate-500">interactions</span>
          </div>

          <div className="ml-auto flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg">
            <span className="text-sm text-slate-600">Market Independence:</span>
            <span className={`text-xl font-bold ${
              independencePercent > 60 ? 'text-orange-600' : 
              independencePercent > 40 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {independencePercent}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// ALIGNMENT DISTRIBUTION
// ═══════════════════════════════════════════════════════════════

function AlignmentDistribution({ distribution }) {
  if (!distribution) return null;

  const alignments = ['CONFIRMED', 'IGNORED', 'CONTRADICTED', 'OVERRIDDEN', 'NO_SIGNAL'];
  const total = alignments.reduce((sum, k) => sum + (distribution[k]?.count || 0), 0);

  return (
    <Card data-testid="alignment-distribution">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="w-5 h-5 text-slate-400" />
          Alignment Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alignments.map(key => {
            const config = ALIGNMENT_CONFIG[key];
            const data = distribution[key] || { count: 0, pct: 0 };
            const Icon = config.icon;
            
            return (
              <div key={key} className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${config.color}`} />
                <span className="text-sm font-medium w-28">{config.label}</span>
                <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${config.bg.replace('bg-', 'bg-').replace('100', '400')}`}
                    style={{ width: `${data.pct}%` }}
                  />
                </div>
                <span className="text-sm font-bold w-12 text-right">{data.pct}%</span>
                <span className="text-xs text-slate-400 w-10">({data.count})</span>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
          <p><strong>Confirmed:</strong> Market reinforces sentiment direction</p>
          <p><strong>Ignored:</strong> Market doesn't react to sentiment</p>
          <p><strong>Contradicted:</strong> Market moves opposite to sentiment</p>
          <p><strong>Overridden:</strong> Market aggressively breaks sentiment</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// BY REGIME BREAKDOWN
// ═══════════════════════════════════════════════════════════════

function ByRegimeBreakdown({ byRegime }) {
  if (!byRegime || byRegime.length === 0) return null;

  return (
    <Card data-testid="by-regime-breakdown">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-slate-400" />
          Interaction by Regime
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 font-medium text-slate-600">Regime</th>
                <th className="text-right py-2 px-3 font-medium text-slate-600">Count</th>
                <th className="text-right py-2 px-3 font-medium text-green-600">Confirmed</th>
                <th className="text-right py-2 px-3 font-medium text-gray-500">Ignored</th>
                <th className="text-right py-2 px-3 font-medium text-red-600">Contradicted</th>
              </tr>
            </thead>
            <tbody>
              {byRegime.map(item => (
                <tr key={item.regime} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-3">
                    <Badge variant="outline">{item.regime}</Badge>
                  </td>
                  <td className="py-2 px-3 text-right font-medium">{item.count}</td>
                  <td className="py-2 px-3 text-right text-green-600">
                    {(item.confirmedRate * 100).toFixed(0)}%
                  </td>
                  <td className="py-2 px-3 text-right text-gray-500">
                    {(item.ignoredRate * 100).toFixed(0)}%
                  </td>
                  <td className="py-2 px-3 text-right text-red-600">
                    {(item.contradictedRate * 100).toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// FAILURE ANALYSIS PANEL
// ═══════════════════════════════════════════════════════════════

function FailureAnalysisPanel({ failures }) {
  if (!failures) return null;

  return (
    <Card data-testid="failure-analysis">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Where Sentiment Fails
        </CardTitle>
      </CardHeader>
      <CardContent>
        {failures.failureCases && failures.failureCases.length > 0 ? (
          <div className="space-y-4">
            {failures.failureCases.map((failure, idx) => (
              <div key={idx} className="p-3 bg-red-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-slate-600">{failure.regime}</Badge>
                    <span className="text-slate-500">+</span>
                    <Badge className={failure.sentimentLabel === 'POSITIVE' ? 'bg-green-500' : 'bg-red-500'}>
                      {failure.sentimentLabel}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={failure.failureType === 'OVERRIDDEN' ? 'bg-red-500' : 'bg-orange-500'}>
                      {failure.failureType}
                    </Badge>
                    <span className="text-sm text-slate-500">{failure.count} cases</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-slate-500">
                    Avg Stress: <strong>{(failure.avgStress * 100).toFixed(0)}%</strong>
                  </span>
                  <span className="text-slate-500">
                    Patterns: {failure.patterns.slice(0, 2).join(', ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-4">No failure cases found</p>
        )}
        
        {/* Notes */}
        {failures.notes && failures.notes.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-500" />
              Insights
            </h4>
            <ul className="space-y-1">
              {failures.notes.map((note, i) => (
                <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// NOTES PANEL
// ═══════════════════════════════════════════════════════════════

function NotesPanel({ notes }) {
  if (!notes || notes.length === 0) return null;

  return (
    <Card data-testid="sentiment-notes">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-500" />
          Interpretation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {notes.map((note, i) => (
            <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
              <span className="text-blue-500">•</span>
              {note}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function LabsSentimentInteractionPage() {
  const [params, setParams] = useState({
    symbol: 'BTCUSDT',
    horizon: '1h',
    window: '7d',
  });

  const [summaryData, setSummaryData] = useState(null);
  const [failuresData, setFailuresData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        symbol: params.symbol,
        horizon: params.horizon,
        window: params.window,
      });

      const [summaryRes, failuresRes] = await Promise.all([
        api.get(`/api/v10/exchange/labs/sentiment-interaction/summary?${queryParams}`),
        api.get(`/api/v10/exchange/labs/sentiment-interaction/failures?${queryParams}`),
      ]);

      if (summaryRes.data?.ok) {
        setSummaryData(summaryRes.data);
      } else {
        setError(summaryRes.data?.error || 'Failed to load summary');
      }

      if (failuresRes.data?.ok) {
        setFailuresData(failuresRes.data);
      }
    } catch (err) {
      console.error('Sentiment interaction fetch error:', err);
      setError('Failed to load sentiment interaction data');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" data-testid="labs-sentiment-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">LABS: Sentiment Interaction</h1>
        <p className="text-sm text-gray-500 mt-1">
          Research analytics • When does sentiment matter vs when is it ignored? • S10.LABS-04
        </p>
      </div>

      {/* Controls */}
      <ControlsPanel
        params={params}
        setParams={setParams}
        onRefresh={fetchData}
        loading={loading}
      />

      {/* Loading */}
      {loading && !summaryData && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Data */}
      {summaryData && (
        <>
          {/* Totals */}
          <TotalsPanel totals={summaryData.totals} metrics={summaryData.metrics} />

          {/* Main Layout */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Alignment Distribution */}
            <AlignmentDistribution distribution={summaryData.alignmentDistribution} />

            {/* Failure Analysis */}
            <FailureAnalysisPanel failures={failuresData} />
          </div>

          {/* By Regime Breakdown */}
          <ByRegimeBreakdown byRegime={summaryData.byRegime} />

          {/* Notes */}
          {summaryData.notes && summaryData.notes.length > 0 && (
            <NotesPanel notes={summaryData.notes} />
          )}

          {/* Disclaimer */}
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Research only:</strong> This analysis shows statistical patterns of how 
              social sentiment interacts with market behavior. It does NOT predict price movements 
              or provide trading signals. Sentiment confirmation does NOT mean profit.
              <br /><br />
              <strong>Note:</strong> Currently using simulated sentiment data for demonstration. 
              Real Twitter/social data will be integrated when available.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
