/**
 * S10.W LABS-05 — Whale Risk Analysis Page
 * 
 * Statistical analysis of whale patterns and their outcomes.
 * 
 * NO SIGNALS, NO PREDICTIONS — only statistical evidence.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Activity, TrendingUp, TrendingDown, Clock, RefreshCw, BarChart2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Risk bucket colors (light theme)
const BUCKET_COLORS = {
  LOW: 'bg-green-100 text-green-700 border-green-300',
  MID: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  HIGH: 'bg-red-100 text-red-700 border-red-300',
};

export default function LabsWhaleRiskPage() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [horizon, setHorizon] = useState('15m');
  const [window, setWindow] = useState(2000);
  const [pattern, setPattern] = useState('ALL');
  
  const [summary, setSummary] = useState(null);
  const [matrix, setMatrix] = useState(null);
  const [cases, setCases] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
  const horizons = ['5m', '15m', '1h', '4h'];
  const patterns = ['ALL', 'WHALE_TRAP_RISK', 'FORCED_SQUEEZE_RISK', 'BAIT_AND_FLIP'];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        symbol,
        horizon,
        window: window.toString(),
        pattern,
      });

      const [summaryRes, matrixRes, casesRes] = await Promise.all([
        fetch(`${API_URL}/api/v10/exchange/labs/whale-risk/summary?${params}`).then(r => r.json()),
        fetch(`${API_URL}/api/v10/exchange/labs/whale-risk/matrix?symbol=${symbol}&horizons=5m,15m,1h,4h&window=${window}&pattern=${pattern}`).then(r => r.json()),
        fetch(`${API_URL}/api/v10/exchange/labs/whale-risk/cases?${params}&bucket=HIGH&limit=10`).then(r => r.json()),
      ]);

      setSummary(summaryRes.ok ? summaryRes : null);
      setMatrix(matrixRes.ok ? matrixRes.matrix : null);
      setCases(casesRes.ok ? casesRes : null);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [symbol, horizon, window, pattern]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getTimeSince = (date) => {
    if (!date) return 'Never';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="p-6 space-y-6" data-testid="labs-whale-risk-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">🔬</span>
            LABS-05: Whale Risk Analysis
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Statistical analysis of whale patterns • S10.W
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            {getTimeSince(lastUpdate)}
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Symbol</label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-sm bg-white"
              >
                {symbols.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Horizon</label>
              <select
                value={horizon}
                onChange={(e) => setHorizon(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-sm bg-white"
              >
                {horizons.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Window</label>
              <input
                type="number"
                value={window}
                onChange={(e) => setWindow(parseInt(e.target.value) || 2000)}
                className="px-3 py-1.5 border rounded-lg text-sm bg-white w-24"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Pattern</label>
              <select
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-sm bg-white"
              >
                {patterns.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          Error: {error}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="text-gray-500 text-sm mb-1">Total Observations</div>
            <div className="text-2xl font-bold text-gray-900">{summary?.totalObservations || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-gray-500 text-sm mb-1">Usable Pairs</div>
            <div className="text-2xl font-bold text-gray-900">{summary?.usablePairs || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-gray-500 text-sm mb-1">HIGH Risk Count</div>
            <div className="text-2xl font-bold text-red-600">{summary?.overallStats?.highRiskCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-gray-500 text-sm mb-1">False Positive Rate</div>
            <div className="text-2xl font-bold text-yellow-600">
              {formatPercent(summary?.overallStats?.falsePositiveRate)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-2 gap-6">
        {/* Pattern Risk Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-500" />
              Pattern Risk Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.patternStats?.length > 0 ? (
              <div className="space-y-4">
                {summary.patternStats.map((ps) => (
                  <div key={ps.patternId} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-medium text-gray-900">{ps.patternId.replace(/_/g, ' ')}</div>
                        <div className="text-xs text-gray-500">
                          {ps.totalCount} observations | {ps.activeCount} active
                        </div>
                      </div>
                      {ps.lift && ps.lift > 1 && (
                        <Badge variant="outline" className={`${
                          ps.lift > 1.5 ? 'bg-green-50 text-green-700 border-green-300' : 'bg-yellow-50 text-yellow-700 border-yellow-300'
                        }`}>
                          Lift: {ps.lift.toFixed(2)}x
                        </Badge>
                      )}
                    </div>

                    {/* Bucket breakdown */}
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      {ps.buckets?.map((bucket) => (
                        <div key={bucket.bucket} className={`p-2 rounded border ${BUCKET_COLORS[bucket.bucket]}`}>
                          <div className="font-medium">{bucket.bucket}</div>
                          <div className="text-xs opacity-80">
                            {bucket.count} obs | {formatPercent(bucket.impactRate)} impact
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">
                No pattern statistics available.<br/>
                <span className="text-xs">Generate more data by triggering whale ingest.</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-500" />
              Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.insights?.length > 0 ? (
              <div className="space-y-3">
                {summary.insights.map((insight, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg flex items-start gap-3">
                    <div className="mt-0.5">
                      {insight.includes('High') || insight.includes('frequently') ? (
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <div className="text-sm text-gray-700">{insight}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">
                No insights generated.<br/>
                <span className="text-xs">Insufficient data for analysis.</span>
              </div>
            )}

            {/* Overall rates */}
            {summary?.overallStats && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm text-gray-500 mb-2">Overall Rates</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-gray-50 rounded">
                    <div className="text-gray-500">Impact Rate</div>
                    <div className="font-medium text-gray-900">{formatPercent(summary.overallStats.avgImpactRate)}</div>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <div className="text-gray-500">Cascade Rate</div>
                    <div className="font-medium text-gray-900">{formatPercent(summary.overallStats.avgCascadeRate)}</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Risk Matrix */}
      {matrix && (
        <Card>
          <CardHeader>
            <CardTitle>Risk Matrix: Bucket x Horizon → Impact Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500">
                    <th className="text-left p-2">Bucket</th>
                    {matrix.horizons?.map(h => (
                      <th key={h} className="text-center p-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrix.buckets?.map(bucket => (
                    <tr key={bucket} className="border-t">
                      <td className={`p-2 font-medium ${
                        bucket === 'HIGH' ? 'text-red-600' :
                        bucket === 'MID' ? 'text-yellow-600' : 'text-green-600'
                      }`}>{bucket}</td>
                      {matrix.horizons?.map(h => {
                        const cell = matrix.data?.[bucket]?.[h];
                        return (
                          <td key={h} className="text-center p-2">
                            <div className={`inline-block px-2 py-1 rounded ${
                              cell?.impactRate > 0.5 ? 'bg-red-100' :
                              cell?.impactRate > 0.3 ? 'bg-yellow-100' : 'bg-gray-100'
                            }`}>
                              {formatPercent(cell?.impactRate)}
                              <span className="text-xs text-gray-500 ml-1">({cell?.count || 0})</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cases */}
      <div className="grid grid-cols-2 gap-6">
        {/* High Risk → Impact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-500" />
              HIGH Risk → Impact (True Positives)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cases?.highRiskWithImpact?.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {cases.highRiskWithImpact.map((c, i) => (
                  <div key={i} className="p-2 bg-gray-50 rounded text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{c.symbol}</span>
                      <span className="text-red-600 font-medium">{c.patternId}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Risk: {(c.riskScore * 100).toFixed(0)}% | 
                      {c.outcome.cascadeOccurred && ' CASCADE'} 
                      {c.outcome.stressEscalated && ' STRESS↑'}
                      {c.outcome.regimeDegraded && ' REGIME↓'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-sm text-center py-4">No cases found</div>
            )}
          </CardContent>
        </Card>

        {/* High Risk → No Impact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              HIGH Risk → No Impact (False Positives)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cases?.highRiskNoImpact?.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {cases.highRiskNoImpact.map((c, i) => (
                  <div key={i} className="p-2 bg-gray-50 rounded text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{c.symbol}</span>
                      <span className="text-yellow-600 font-medium">{c.patternId}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Risk: {(c.riskScore * 100).toFixed(0)}% | No impact detected
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-sm text-center py-4">No cases found</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer Disclaimer */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
        <p className="text-xs text-gray-500">
          LABS-05 provides statistical analysis of whale risk patterns. Results are historical observations and do not constitute trading advice.
        </p>
      </div>
    </div>
  );
}
