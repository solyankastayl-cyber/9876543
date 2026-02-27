/**
 * S10.LABS-02 — Regime Attribution UI
 * 
 * Research analytics: WHY did the regime change?
 * 
 * RULES:
 * - Read-only
 * - Indicators are MEASUREMENTS, not causes
 * - NO signals, NO predictions
 * - Attribution ≠ correlation
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
  ArrowRight,
  BarChart3,
  TrendingUp,
  Layers,
  Target,
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

const REGIMES = [
  'NEUTRAL',
  'ACCUMULATION',
  'DISTRIBUTION',
  'EXPANSION',
  'EXHAUSTION',
  'SHORT_SQUEEZE',
  'LONG_SQUEEZE',
];

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'PRICE_STRUCTURE', label: 'Price Structure' },
  { value: 'MOMENTUM', label: 'Momentum' },
  { value: 'VOLUME', label: 'Volume' },
  { value: 'ORDER_BOOK', label: 'Order Book' },
  { value: 'POSITIONING', label: 'Positioning' },
];

const CATEGORY_COLORS = {
  PRICE_STRUCTURE: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  MOMENTUM: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  VOLUME: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  ORDER_BOOK: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  POSITIONING: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
};

// ═══════════════════════════════════════════════════════════════
// CONTROLS PANEL
// ═══════════════════════════════════════════════════════════════

function ControlsPanel({ params, setParams, onRefresh, loading }) {
  return (
    <Card className="border-0 shadow-sm bg-white" data-testid="attribution-controls">
      <CardContent className="py-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Symbol */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Symbol</span>
            <select
              value={params.symbol}
              onChange={(e) => setParams({ ...params, symbol: e.target.value })}
              className="px-3 py-1.5 bg-slate-800 text-white rounded text-sm border border-gray-200"
              data-testid="attr-symbol-select"
            >
              {SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* From Regime */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">From</span>
            <select
              value={params.fromRegime}
              onChange={(e) => setParams({ ...params, fromRegime: e.target.value })}
              className="px-3 py-1.5 bg-slate-800 text-white rounded text-sm border border-gray-200"
              data-testid="attr-from-select"
            >
              <option value="">Any</option>
              {REGIMES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Arrow */}
          <ArrowRight className="w-4 h-4 text-slate-500" />

          {/* To Regime */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">To</span>
            <select
              value={params.toRegime}
              onChange={(e) => setParams({ ...params, toRegime: e.target.value })}
              className="px-3 py-1.5 bg-slate-800 text-white rounded text-sm border border-gray-200"
              data-testid="attr-to-select"
            >
              <option value="">Any</option>
              {REGIMES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Horizon */}
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

          {/* Window */}
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

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Category</span>
            <select
              value={params.indicatorCategory}
              onChange={(e) => setParams({ ...params, indicatorCategory: e.target.value })}
              className="px-3 py-1.5 bg-slate-800 text-white rounded text-sm border border-gray-200"
            >
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {/* Refresh */}
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

function TotalsPanel({ totals }) {
  return (
    <Card data-testid="attribution-totals">
      <CardContent className="py-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <span className="text-2xl font-bold">{totals.observations}</span>
            <span className="text-sm text-slate-500">observations</span>
          </div>

          <div className="flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-green-500" />
            <span className="text-2xl font-bold text-green-600">{totals.transitionPairs}</span>
            <span className="text-sm text-slate-500">transitions</span>
          </div>

          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-500" />
            <span className="text-2xl font-bold text-purple-600">{totals.uniqueTransitions}</span>
            <span className="text-sm text-slate-500">unique types</span>
          </div>

          {totals.transitionPairs < 30 && (
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
// TRANSITION LIST
// ═══════════════════════════════════════════════════════════════

function TransitionList({ transitions, selectedTransition, onSelect }) {
  if (!transitions || transitions.length === 0) {
    return (
      <Card data-testid="transition-list-empty">
        <CardContent className="py-12 text-center">
          <ArrowRight className="w-10 h-10 mx-auto mb-3 text-gray-700" />
          <p className="text-slate-500">No transitions found</p>
          <p className="text-sm text-slate-400 mt-1">
            Need more observations with regime changes
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="transition-list">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRight className="w-5 h-5 text-slate-400" />
          Regime Transitions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {transitions.map((t, idx) => {
            const isSelected = selectedTransition === idx;
            const topDriver = t.topDrivers?.[0];
            
            return (
              <button
                key={`${t.from}-${t.to}`}
                onClick={() => onSelect(isSelected ? null : idx)}
                className={`
                  w-full p-3 rounded-lg text-left transition-colors
                  ${isSelected ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50 hover:bg-slate-100'}
                `}
                data-testid={`transition-${t.from}-${t.to}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{t.from}</Badge>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <Badge className="bg-slate-700">{t.to}</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500">{t.samples} samples</span>
                    {isSelected ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>
                
                {/* Quick preview of top driver */}
                {topDriver && !isSelected && (
                  <div className="mt-2 text-xs text-slate-500">
                    Top driver: <span className="font-medium">{topDriver.indicator.replace(/_/g, ' ')}</span>
                    {' '}(score: {topDriver.attributionScore.toFixed(2)})
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// TOP DRIVERS PANEL
// ═══════════════════════════════════════════════════════════════

function TopDriversPanel({ transition }) {
  if (!transition) return null;
  
  const { topDrivers, weakDrivers, notes } = transition;

  return (
    <Card data-testid="top-drivers-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          {transition.from} → {transition.to} — Attribution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Top Drivers */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-green-500" />
            Top Drivers ({topDrivers.length})
          </h4>
          {topDrivers.length > 0 ? (
            <div className="space-y-3">
              {topDrivers.map((driver, idx) => {
                const catColor = CATEGORY_COLORS[driver.category] || CATEGORY_COLORS.PRICE_STRUCTURE;
                
                return (
                  <div key={driver.indicator} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-6">{idx + 1}.</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-slate-700">
                          {driver.indicator.replace(/_/g, ' ')}
                        </span>
                        <Badge className={`text-xs ${catColor.bg} ${catColor.text}`}>
                          {driver.category.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      {/* Score bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${driver.attributionScore * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-600 w-10">
                          {(driver.attributionScore * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${driver.meanDelta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {driver.meanDelta > 0 ? '+' : ''}{driver.meanDelta.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-400">avg Δ</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No clear dominant drivers</p>
          )}
        </div>

        {/* Weak Drivers */}
        {weakDrivers && weakDrivers.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-500 mb-2">
              Contributing Factors
            </h4>
            <div className="flex flex-wrap gap-2">
              {weakDrivers.map(driver => (
                <Badge key={driver.indicator} variant="outline" className="text-xs">
                  {driver.indicator.replace(/_/g, ' ')} ({(driver.attributionScore * 100).toFixed(0)}%)
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {notes && notes.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-500" />
              Interpretation
            </h4>
            <ul className="space-y-1">
              {notes.map((note, i) => (
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
// INDICATOR DELTA TABLE
// ═══════════════════════════════════════════════════════════════

function IndicatorDeltaTable({ transition }) {
  const [showAll, setShowAll] = useState(false);
  
  if (!transition) return null;
  
  const indicators = showAll 
    ? transition.allIndicators 
    : transition.allIndicators.slice(0, 10);

  return (
    <Card data-testid="indicator-delta-table">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-slate-400" />
            All Indicator Deltas
          </div>
          <span className="text-sm font-normal text-slate-500">
            {transition.allIndicators.length} indicators
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 font-medium text-slate-600">Indicator</th>
                <th className="text-center py-2 px-3 font-medium text-slate-600">Category</th>
                <th className="text-right py-2 px-3 font-medium text-slate-600">Mean Δ</th>
                <th className="text-right py-2 px-3 font-medium text-slate-600">Median Δ</th>
                <th className="text-right py-2 px-3 font-medium text-slate-600">Std</th>
                <th className="text-right py-2 px-3 font-medium text-slate-600">Score</th>
              </tr>
            </thead>
            <tbody>
              {indicators.map((ind) => {
                const catColor = CATEGORY_COLORS[ind.category] || CATEGORY_COLORS.PRICE_STRUCTURE;
                
                return (
                  <tr key={ind.indicator} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-3 font-medium text-slate-700">
                      {ind.indicator.replace(/_/g, ' ')}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <Badge className={`text-xs ${catColor.bg} ${catColor.text}`}>
                        {ind.category}
                      </Badge>
                    </td>
                    <td className={`py-2 px-3 text-right font-medium ${ind.meanDelta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {ind.meanDelta > 0 ? '+' : ''}{ind.meanDelta.toFixed(3)}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-600">
                      {ind.medianDelta > 0 ? '+' : ''}{ind.medianDelta.toFixed(3)}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-500">
                      {ind.stdDelta.toFixed(3)}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <div className="w-12 h-1.5 bg-slate-200 rounded overflow-hidden">
                          <div 
                            className="h-full bg-blue-500" 
                            style={{ width: `${ind.attributionScore * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-600 w-8">
                          {(ind.attributionScore * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {transition.allIndicators.length > 10 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="mt-3 text-sm text-blue-600 hover:text-blue-700"
          >
            {showAll ? 'Show less' : `Show all ${transition.allIndicators.length} indicators`}
          </button>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function LabsRegimeAttributionPage() {
  const [params, setParams] = useState({
    symbol: 'BTCUSDT',
    fromRegime: '',
    toRegime: '',
    horizon: '1h',
    window: '7d',
    indicatorCategory: '',
  });

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTransition, setSelectedTransition] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        symbol: params.symbol,
        horizon: params.horizon,
        window: params.window,
      });
      
      if (params.fromRegime) queryParams.set('fromRegime', params.fromRegime);
      if (params.toRegime) queryParams.set('toRegime', params.toRegime);
      if (params.indicatorCategory) queryParams.set('indicatorCategory', params.indicatorCategory);

      const res = await api.get(`/api/v10/exchange/labs/regime-attribution?${queryParams}`);
      
      if (res.data?.ok) {
        setData(res.data);
        setSelectedTransition(null);
      } else {
        setError(res.data?.error || 'Failed to load data');
      }
    } catch (err) {
      console.error('Attribution fetch error:', err);
      setError('Failed to load attribution data');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentTransition = selectedTransition !== null ? data?.transitions?.[selectedTransition] : null;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" data-testid="labs-attribution-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">LABS: Regime Attribution</h1>
        <p className="text-sm text-gray-500 mt-1">
          Research analytics • WHY did the regime change? • S10.LABS-02
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
          <TotalsPanel totals={data.totals} />

          {/* Main Layout */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Transition List */}
            <TransitionList
              transitions={data.transitions}
              selectedTransition={selectedTransition}
              onSelect={setSelectedTransition}
            />

            {/* Top Drivers Panel */}
            <TopDriversPanel transition={currentTransition} />
          </div>

          {/* Indicator Delta Table */}
          {currentTransition && (
            <IndicatorDeltaTable transition={currentTransition} />
          )}

          {/* Disclaimer */}
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Research only:</strong> Attribution scores indicate statistical association 
              during regime transitions, not causation. Indicators are measurements of market state, 
              not trading signals. No recommendations are provided.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
