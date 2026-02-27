/**
 * S10.LABS-03 — Pattern Risk UI
 * 
 * Research analytics: Which patterns are DANGEROUS vs NOISE?
 * 
 * RULES:
 * - Read-only
 * - Pattern ≠ signal
 * - We analyze RISK, not direction
 * - NO predictions, NO signals
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
  Shield,
  Flame,
  TrendingUp,
  Clock,
  Target,
  Zap,
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
  { value: '', label: 'All Regimes' },
  { value: 'NEUTRAL', label: 'NEUTRAL' },
  { value: 'ACCUMULATION', label: 'ACCUMULATION' },
  { value: 'DISTRIBUTION', label: 'DISTRIBUTION' },
  { value: 'EXPANSION', label: 'EXPANSION' },
  { value: 'EXHAUSTION', label: 'EXHAUSTION' },
  { value: 'SHORT_SQUEEZE', label: 'SHORT_SQUEEZE' },
  { value: 'LONG_SQUEEZE', label: 'LONG_SQUEEZE' },
];

// ═══════════════════════════════════════════════════════════════
// COLOR UTILITIES
// ═══════════════════════════════════════════════════════════════

function getRiskColor(score) {
  if (score >= 0.6) return { bg: 'bg-red-500', light: 'bg-red-100', text: 'text-red-700', label: 'dangerous' };
  if (score >= 0.3) return { bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-700', label: 'moderate' };
  return { bg: 'bg-gray-400', light: 'bg-gray-100', text: 'text-gray-600', label: 'noise' };
}

function formatDuration(ms) {
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

// ═══════════════════════════════════════════════════════════════
// CONTROLS PANEL
// ═══════════════════════════════════════════════════════════════

function ControlsPanel({ params, setParams, onRefresh, loading }) {
  return (
    <Card className="border-0 shadow-sm bg-white" data-testid="pattern-risk-controls">
      <CardContent className="py-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Symbol */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Symbol</span>
            <select
              value={params.symbol}
              onChange={(e) => setParams({ ...params, symbol: e.target.value })}
              className="px-3 py-1.5 bg-slate-800 text-white rounded text-sm border border-gray-200"
              data-testid="risk-symbol-select"
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

          {/* Regime Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Regime</span>
            <select
              value={params.regimeFilter}
              onChange={(e) => setParams({ ...params, regimeFilter: e.target.value })}
              className="px-3 py-1.5 bg-slate-800 text-white rounded text-sm border border-gray-200"
            >
              {REGIMES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
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

function TotalsPanel({ totals, ranking }) {
  return (
    <Card data-testid="pattern-risk-totals">
      <CardContent className="py-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <span className="text-2xl font-bold">{totals.observations}</span>
            <span className="text-sm text-slate-500">observations</span>
          </div>

          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-500" />
            <span className="text-2xl font-bold text-purple-600">{totals.totalPatternOccurrences}</span>
            <span className="text-sm text-slate-500">pattern occurrences</span>
          </div>

          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            <span className="text-2xl font-bold text-green-600">{totals.patternsAnalyzed}</span>
            <span className="text-sm text-slate-500">patterns analyzed</span>
          </div>

          {/* Risk summary */}
          <div className="ml-auto flex items-center gap-3">
            <Badge className="bg-red-500">
              <Flame className="w-3 h-3 mr-1" />
              {ranking.dangerous.length} dangerous
            </Badge>
            <Badge className="bg-orange-500">
              {ranking.moderate.length} moderate
            </Badge>
            <Badge variant="outline" className="text-gray-500">
              {ranking.noise.length} noise
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// RISK SCORE GAUGE
// ═══════════════════════════════════════════════════════════════

function RiskScoreGauge({ score, confidence }) {
  const color = getRiskColor(score);
  const angle = score * 180 - 90; // -90 to 90 degrees
  
  return (
    <div className="flex flex-col items-center">
      {/* Semi-circle gauge */}
      <div className="relative w-32 h-16 overflow-hidden">
        <div className="absolute w-32 h-32 rounded-full border-8 border-slate-200" 
             style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }} />
        <div 
          className={`absolute w-32 h-32 rounded-full border-8 ${color.bg}`}
          style={{ 
            clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)',
            transform: `rotate(${angle}deg)`,
            transformOrigin: 'center center',
          }} 
        />
        <div className="absolute inset-0 flex items-end justify-center pb-1">
          <span className={`text-2xl font-bold ${color.text}`}>
            {(score * 100).toFixed(0)}
          </span>
        </div>
      </div>
      <Badge className={`mt-2 ${color.light} ${color.text}`}>
        {color.label}
      </Badge>
      <p className="text-xs text-slate-400 mt-1">
        Confidence: {(confidence * 100).toFixed(0)}%
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EFFECTS BREAKDOWN
// ═══════════════════════════════════════════════════════════════

function EffectsBreakdown({ effects }) {
  const effectsData = [
    { 
      key: 'cascadeRate', 
      label: 'Cascade Rate',
      value: effects.cascadeRate,
      icon: Flame,
      color: 'bg-red-500',
      weight: '40%',
    },
    { 
      key: 'stressEscalation', 
      label: 'Stress Escalation',
      value: effects.stressEscalation,
      icon: TrendingUp,
      color: 'bg-orange-500',
      weight: '30%',
    },
    { 
      key: 'regimeDegradation', 
      label: 'Regime Degradation',
      value: effects.regimeDegradation,
      icon: AlertTriangle,
      color: 'bg-yellow-500',
      weight: '30%',
    },
  ];

  return (
    <div className="space-y-3">
      {effectsData.map(effect => (
        <div key={effect.key}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <effect.icon className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-700">{effect.label}</span>
              <span className="text-xs text-slate-400">({effect.weight})</span>
            </div>
            <span className="text-sm font-bold">
              {(effect.value * 100).toFixed(0)}%
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${effect.color} transition-all`}
              style={{ width: `${effect.value * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PATTERN LIST
// ═══════════════════════════════════════════════════════════════

function PatternList({ patterns, selectedPattern, onSelect }) {
  if (!patterns || patterns.length === 0) {
    return (
      <Card data-testid="pattern-list-empty">
        <CardContent className="py-12 text-center">
          <Shield className="w-10 h-10 mx-auto mb-3 text-gray-700" />
          <p className="text-slate-500">No patterns found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="pattern-list">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-slate-400" />
          Pattern Risk Ranking
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {patterns.map((p, idx) => {
            const isSelected = selectedPattern === idx;
            const riskColor = getRiskColor(p.riskScore);
            
            return (
              <button
                key={p.pattern}
                onClick={() => onSelect(isSelected ? null : idx)}
                className={`
                  w-full p-3 rounded-lg text-left transition-colors
                  ${isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50'}
                `}
                data-testid={`pattern-${p.pattern}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Risk indicator */}
                    <div className={`w-3 h-3 rounded-full ${riskColor.bg}`} />
                    
                    {/* Pattern name */}
                    <span className="font-medium text-slate-700">
                      {p.pattern.replace(/_/g, ' ')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Risk score */}
                    <Badge className={`${riskColor.light} ${riskColor.text}`}>
                      {(p.riskScore * 100).toFixed(0)}%
                    </Badge>
                    
                    {/* Samples */}
                    <span className="text-xs text-slate-400">
                      {p.samples} samples
                    </span>
                    
                    {isSelected ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>
                
                {/* Quick preview */}
                {!isSelected && (
                  <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                    <span>Cascade: {(p.effects.cascadeRate * 100).toFixed(0)}%</span>
                    <span>Stress: {(p.effects.stressEscalation * 100).toFixed(0)}%</span>
                    <span>FP: {(p.falsePositiveRate * 100).toFixed(0)}%</span>
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
// PATTERN DETAIL PANEL
// ═══════════════════════════════════════════════════════════════

function PatternDetailPanel({ pattern }) {
  if (!pattern) return null;

  return (
    <Card data-testid="pattern-detail-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-500" />
          {pattern.pattern.replace(/_/g, ' ')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Risk Score Gauge */}
        <div className="flex justify-center">
          <RiskScoreGauge score={pattern.riskScore} confidence={pattern.confidence} />
        </div>

        {/* Effects Breakdown */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-3">Risk Composition</h4>
          <EffectsBreakdown effects={pattern.effects} />
        </div>

        {/* Time to Impact */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600">Median Time to Impact</span>
          </div>
          <span className="text-lg font-bold text-slate-700">
            {formatDuration(pattern.medianTimeToImpact)}
          </span>
        </div>

        {/* False Positive Rate */}
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-700">Safe Cases (No Impact)</span>
          </div>
          <span className="text-lg font-bold text-green-700">
            {(pattern.falsePositiveRate * 100).toFixed(0)}%
          </span>
        </div>

        {/* Regime Context */}
        {pattern.regimeContext && pattern.regimeContext.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2">Regime Context</h4>
            <div className="flex flex-wrap gap-2">
              {pattern.regimeContext.slice(0, 5).map(ctx => (
                <Badge key={ctx.regime} variant="outline">
                  {ctx.regime} ({ctx.pct}%)
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {pattern.notes && pattern.notes.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-500" />
              Interpretation
            </h4>
            <ul className="space-y-1">
              {pattern.notes.map((note, i) => (
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
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function LabsPatternRiskPage() {
  const [params, setParams] = useState({
    symbol: 'BTCUSDT',
    horizon: '1h',
    window: '7d',
    regimeFilter: '',
  });

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPattern, setSelectedPattern] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        symbol: params.symbol,
        horizon: params.horizon,
        window: params.window,
      });
      
      if (params.regimeFilter) {
        queryParams.set('regimeFilter', params.regimeFilter);
      }

      const res = await api.get(`/api/v10/exchange/labs/pattern-risk?${queryParams}`);
      
      if (res.data?.ok) {
        setData(res.data);
        setSelectedPattern(null);
      } else {
        setError(res.data?.error || 'Failed to load data');
      }
    } catch (err) {
      console.error('Pattern risk fetch error:', err);
      setError('Failed to load pattern risk data');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentPattern = selectedPattern !== null ? data?.patterns?.[selectedPattern] : null;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" data-testid="labs-pattern-risk-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">LABS: Pattern Risk</h1>
        <p className="text-sm text-gray-500 mt-1">
          Research analytics • Which patterns are DANGEROUS vs NOISE? • S10.LABS-03
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
          <TotalsPanel totals={data.totals} ranking={data.ranking} />

          {/* Main Layout */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Pattern List */}
            <PatternList
              patterns={data.patterns}
              selectedPattern={selectedPattern}
              onSelect={setSelectedPattern}
            />

            {/* Pattern Detail Panel */}
            <PatternDetailPanel pattern={currentPattern} />
          </div>

          {/* Disclaimer */}
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Research only:</strong> Risk scores indicate statistical association 
              with negative outcomes (cascades, stress, regime degradation), not certainty.
              Patterns are structural observations, not trading signals. No recommendations provided.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
