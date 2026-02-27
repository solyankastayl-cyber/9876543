/**
 * S10.LABS-01 — Regime Forward Outcome UI
 * 
 * Research analytics: What happens AFTER each regime?
 * 
 * RULES:
 * - Read-only
 * - NO signals, NO predictions
 * - Statistics only
 */

import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  Loader2,
  AlertTriangle,
  Activity,
  ChevronDown,
  ChevronRight,
  Info,
  BarChart3,
  TrendingUp,
  Percent,
  Clock,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/api/client';

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const HORIZONS = ['5m', '15m', '1h', '4h', '24h'];
const WINDOWS = ['24h', '7d', '30d'];
const REGIME_SOURCES = ['indicator', 'legacy'];
const STRESS_METRICS = ['marketStress', 'orderbookPressure', 'positionCrowding'];

const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'];

// ═══════════════════════════════════════════════════════════════
// COLOR UTILITIES
// ═══════════════════════════════════════════════════════════════

function getChangeRateColor(rate) {
  if (rate < 0.2) return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'stable' };
  if (rate < 0.5) return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'transitional' };
  return { bg: 'bg-red-100', text: 'text-red-700', label: 'unstable' };
}

function getCascadeRateColor(rate) {
  if (rate < 0.05) return { bg: 'bg-gray-100', text: 'text-gray-600', label: 'safe' };
  if (rate < 0.15) return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'moderate' };
  return { bg: 'bg-red-100', text: 'text-red-700', label: 'elevated' };
}

function getStressDeltaColor(delta) {
  const abs = Math.abs(delta);
  if (abs < 0.1) return { text: 'text-gray-600', label: 'neutral' };
  if (abs < 0.25) return { text: 'text-orange-600', label: 'noticeable' };
  return { text: 'text-red-600', label: 'significant' };
}

// ═══════════════════════════════════════════════════════════════
// CONTROLS PANEL
// ═══════════════════════════════════════════════════════════════

function ControlsPanel({ params, setParams, onRefresh, loading }) {
  return (
    <Card className="border-0 shadow-sm bg-white" data-testid="labs-controls">
      <CardContent className="py-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Symbol */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Symbol</span>
            <select
              value={params.symbol}
              onChange={(e) => setParams({ ...params, symbol: e.target.value })}
              className="px-3 py-1.5 bg-slate-800 text-white rounded text-sm border border-gray-200"
              data-testid="labs-symbol-select"
            >
              {SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Horizon */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Horizon</span>
            <select
              value={params.horizon}
              onChange={(e) => setParams({ ...params, horizon: e.target.value })}
              className="px-3 py-1.5 bg-slate-800 text-white rounded text-sm border border-gray-200"
              data-testid="labs-horizon-select"
            >
              {HORIZONS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>

          {/* Window */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Window</span>
            <select
              value={params.window}
              onChange={(e) => setParams({ ...params, window: e.target.value })}
              className="px-3 py-1.5 bg-slate-800 text-white rounded text-sm border border-gray-200"
              data-testid="labs-window-select"
            >
              {WINDOWS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>

          {/* Regime Source */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Source</span>
            <select
              value={params.regimeSource}
              onChange={(e) => setParams({ ...params, regimeSource: e.target.value })}
              className="px-3 py-1.5 bg-slate-800 text-white rounded text-sm border border-gray-200"
              data-testid="labs-source-select"
            >
              {REGIME_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Stress Metric */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Stress</span>
            <select
              value={params.stressMetric}
              onChange={(e) => setParams({ ...params, stressMetric: e.target.value })}
              className="px-3 py-1.5 bg-slate-800 text-white rounded text-sm border border-gray-200"
              data-testid="labs-stress-select"
            >
              {STRESS_METRICS.map(m => (
                <option key={m} value={m}>
                  {m.replace(/([A-Z])/g, ' $1').trim()}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="ml-auto p-2 rounded hover:bg-slate-800 transition-colors"
            title="Refresh"
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

function TotalsPanel({ totals, meta }) {
  const usableRatio = totals.observations > 0 
    ? totals.usablePairs / totals.observations 
    : 0;

  return (
    <Card data-testid="labs-totals">
      <CardContent className="py-4">
        <div className="flex flex-wrap items-center gap-6">
          {/* Observations */}
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <span className="text-2xl font-bold">{totals.observations}</span>
            <span className="text-sm text-slate-500">observations</span>
          </div>

          {/* Usable Pairs */}
          <div className="flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-green-500" />
            <span className="text-2xl font-bold text-green-600">{totals.usablePairs}</span>
            <span className="text-sm text-slate-500">usable pairs</span>
            <Badge variant="outline" className="text-xs">
              {(usableRatio * 100).toFixed(0)}%
            </Badge>
          </div>

          {/* Dropped */}
          {totals.droppedNoForward > 0 && (
            <div className="flex items-center gap-1 text-sm text-slate-400">
              <span>{totals.droppedNoForward} no forward</span>
            </div>
          )}
          {totals.droppedUnstable > 0 && (
            <div className="flex items-center gap-1 text-sm text-slate-400">
              <span>{totals.droppedUnstable} unstable</span>
            </div>
          )}

          {/* Warning */}
          {totals.usablePairs < 50 && (
            <div className="flex items-center gap-1 text-amber-600 ml-auto">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">Low sample size</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// REGIME FORWARD TABLE
// ═══════════════════════════════════════════════════════════════

function RegimeForwardTable({ data, onSelectRegime, selectedRegime }) {
  if (!data || data.length === 0) {
    return (
      <Card data-testid="labs-table-empty">
        <CardContent className="py-12 text-center">
          <BarChart3 className="w-10 h-10 mx-auto mb-3 text-gray-700" />
          <p className="text-slate-500">No regime data available</p>
          <p className="text-sm text-slate-400 mt-1">
            Need more observations with stable regimes
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="labs-table">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-slate-400" />
          Forward Outcome by Regime
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium text-slate-600">Regime</th>
                <th className="text-right py-3 px-4 font-medium text-slate-600">Samples</th>
                <th className="text-center py-3 px-4 font-medium text-slate-600">Change %</th>
                <th className="text-center py-3 px-4 font-medium text-slate-600">Top Next</th>
                <th className="text-right py-3 px-4 font-medium text-slate-600">Stress Δ</th>
                <th className="text-right py-3 px-4 font-medium text-slate-600">p90</th>
                <th className="text-center py-3 px-4 font-medium text-slate-600">Cascade</th>
                <th className="px-2"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((entry) => {
                const changeColor = getChangeRateColor(entry.regimeChangeRate);
                const cascadeColor = getCascadeRateColor(entry.cascadeRate);
                const stressColor = getStressDeltaColor(entry.stressDelta.mean);
                const topNext = entry.nextRegimeDist[0];
                const isSelected = selectedRegime === entry.regime;

                return (
                  <tr
                    key={entry.regime}
                    onClick={() => onSelectRegime(isSelected ? null : entry.regime)}
                    className={`
                      border-b border-slate-100 cursor-pointer transition-colors
                      ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}
                    `}
                    data-testid={`regime-row-${entry.regime}`}
                  >
                    {/* Regime */}
                    <td className="py-3 px-4">
                      <Badge className="bg-slate-600">
                        {entry.regime.replace(/_/g, ' ')}
                      </Badge>
                    </td>

                    {/* Samples */}
                    <td className="py-3 px-4 text-right font-medium">
                      {entry.sampleCount}
                    </td>

                    {/* Change Rate */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              entry.regimeChangeRate > 0.5 ? 'bg-red-500' :
                              entry.regimeChangeRate > 0.2 ? 'bg-yellow-500' : 'bg-gray-400'
                            }`}
                            style={{ width: `${entry.regimeChangeRate * 100}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${changeColor.text}`}>
                          {(entry.regimeChangeRate * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>

                    {/* Top Next Regime */}
                    <td className="py-3 px-4 text-center">
                      {topNext && (
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-slate-700">{topNext.regime}</span>
                          <span className="text-xs text-slate-400">({topNext.pct}%)</span>
                        </div>
                      )}
                    </td>

                    {/* Stress Delta Mean */}
                    <td className="py-3 px-4 text-right">
                      <span className={`font-medium ${stressColor.text}`}>
                        {entry.stressDelta.mean > 0 ? '+' : ''}
                        {entry.stressDelta.mean.toFixed(2)}
                      </span>
                    </td>

                    {/* Stress Delta p90 */}
                    <td className="py-3 px-4 text-right text-slate-500">
                      {entry.stressDelta.p90 > 0 ? '+' : ''}
                      {entry.stressDelta.p90.toFixed(2)}
                    </td>

                    {/* Cascade Rate */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center">
                        <Badge className={cascadeColor.bg}>
                          <Flame className="w-3 h-3 mr-1" />
                          {(entry.cascadeRate * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </td>

                    {/* Expand Arrow */}
                    <td className="px-2">
                      {isSelected ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// REGIME DETAIL PANEL
// ═══════════════════════════════════════════════════════════════

function RegimeDetailPanel({ regime, data }) {
  const entry = data.find(e => e.regime === regime);
  if (!entry) return null;

  return (
    <Card data-testid="regime-detail-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          {regime.replace(/_/g, ' ')} — Detailed Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Transition Matrix */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
            <ArrowRight className="w-4 h-4" />
            Transition Distribution
          </h4>
          <div className="space-y-2">
            {entry.nextRegimeDist.slice(0, 5).map(item => (
              <div key={item.regime} className="flex items-center gap-3">
                <span className="text-sm text-slate-600 w-32 truncate">
                  {item.regime}
                </span>
                <div className="flex-1 h-4 bg-slate-100 rounded overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-12 text-right">
                  {item.pct}%
                </span>
                <span className="text-xs text-slate-400 w-10">
                  ({item.count})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stress Distribution */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
            <Percent className="w-4 h-4" />
            Stress Delta Distribution
          </h4>
          <div className="grid grid-cols-5 gap-2">
            {entry.stressDelta.buckets.map((bucket) => (
              <div 
                key={bucket.bucket}
                className="text-center p-2 bg-slate-50 rounded"
              >
                <div 
                  className="h-8 bg-gradient-to-t from-blue-500 to-blue-300 rounded mb-1"
                  style={{ height: `${Math.max(8, bucket.pct * 2)}px` }}
                />
                <span className="text-xs text-slate-500">{bucket.bucket}</span>
                <p className="text-xs font-medium">{bucket.pct}%</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 text-center">
            <div className="p-2 bg-slate-50 rounded">
              <p className="text-xs text-slate-500">Min</p>
              <p className="text-sm font-medium">{entry.stressDelta.min.toFixed(2)}</p>
            </div>
            <div className="p-2 bg-blue-50 rounded">
              <p className="text-xs text-blue-500">Median (p50)</p>
              <p className="text-sm font-medium text-blue-700">{entry.stressDelta.p50.toFixed(2)}</p>
            </div>
            <div className="p-2 bg-slate-50 rounded">
              <p className="text-xs text-slate-500">Max</p>
              <p className="text-sm font-medium">{entry.stressDelta.max.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Pattern Triggers */}
        {entry.patternTriggersTop.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-500" />
              Patterns Before Cascade
            </h4>
            <div className="flex flex-wrap gap-2">
              {entry.patternTriggersTop.map(p => (
                <Badge key={p.patternId} variant="outline">
                  {p.patternId} ({p.pct}%)
                </Badge>
              ))}
            </div>
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
    <Card data-testid="labs-notes">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="w-5 h-5 text-slate-400" />
          Interpretations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {notes.map((note, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
              <span className="text-blue-500 mt-1">•</span>
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

export default function LabsRegimeForwardPage() {
  const [params, setParams] = useState({
    symbol: 'BTCUSDT',
    horizon: '1h',
    window: '7d',
    regimeSource: 'indicator',
    stressMetric: 'marketStress',
  });

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRegime, setSelectedRegime] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        symbol: params.symbol,
        horizon: params.horizon,
        window: params.window,
        regimeSource: params.regimeSource,
        stressMetric: params.stressMetric,
      });

      const res = await api.get(`/api/v10/exchange/labs/regime-forward?${queryParams}`);
      
      if (res.data?.ok) {
        setData(res.data);
      } else {
        setError(res.data?.error || 'Failed to load data');
      }
    } catch (err) {
      console.error('LABS fetch error:', err);
      setError('Failed to load LABS data');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" data-testid="labs-regime-forward-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">LABS: Regime Forward Outcome</h1>
        <p className="text-sm text-gray-500 mt-1">
          Research analytics • What happens AFTER each regime? • S10.LABS-01
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
      {loading && !data && (
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
      {data && (
        <>
          {/* Totals */}
          <TotalsPanel totals={data.totals} meta={data.meta} />

          {/* Main Table + Detail */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RegimeForwardTable
                data={data.byRegime}
                onSelectRegime={setSelectedRegime}
                selectedRegime={selectedRegime}
              />
            </div>
            <div>
              {selectedRegime && (
                <RegimeDetailPanel regime={selectedRegime} data={data.byRegime} />
              )}
              {!selectedRegime && data.notes?.interpretation?.length > 0 && (
                <NotesPanel notes={data.notes.interpretation} />
              )}
            </div>
          </div>

          {/* Notes (when regime selected) */}
          {selectedRegime && data.notes?.interpretation?.length > 0 && (
            <NotesPanel notes={data.notes.interpretation} />
          )}

          {/* Disclaimer */}
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Research only:</strong> This analysis shows statistical patterns, 
              not predictions. Past regime transitions do not guarantee future behavior.
              No trading signals or recommendations are provided.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
