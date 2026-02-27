/**
 * C1 — Alignment Explorer UI
 * 
 * Research analytics: Exchange × Sentiment Alignment
 * 
 * RULES:
 * - Read-only
 * - Alignment ≠ signal
 * - We analyze how Exchange and Sentiment verdicts relate
 * - NO trading signals
 */

import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  Loader2,
  AlertTriangle,
  Activity,
  TrendingUp,
  TrendingDown,
  MinusCircle,
  CheckCircle,
  XCircle,
  HelpCircle,
  ArrowLeftRight,
  BarChart3,
  PieChart,
  Info,
  Layers,
  Gauge,
  Target,
  ShieldCheck,
  ShieldX,
  Scale,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/api/client';

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'];

const ALIGNMENT_CONFIG = {
  CONFIRMED: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', barColor: 'bg-green-500', label: 'Confirmed', desc: 'Exchange & Sentiment agree' },
  CONTRADICTED: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', barColor: 'bg-red-500', label: 'Contradicted', desc: 'Exchange & Sentiment disagree' },
  IGNORED: { icon: MinusCircle, color: 'text-gray-500', bg: 'bg-gray-100', barColor: 'bg-gray-400', label: 'Ignored', desc: 'Both neutral, no direction' },
  EXCHANGE_ONLY: { icon: Layers, color: 'text-blue-600', bg: 'bg-blue-100', barColor: 'bg-blue-500', label: 'Exchange Only', desc: 'Exchange confident, sentiment not usable' },
  SENTIMENT_ONLY: { icon: Activity, color: 'text-purple-600', bg: 'bg-purple-100', barColor: 'bg-purple-500', label: 'Sentiment Only', desc: 'Sentiment confident, exchange not ready' },
  NO_DATA: { icon: HelpCircle, color: 'text-slate-400', bg: 'bg-slate-50', barColor: 'bg-slate-300', label: 'No Data', desc: 'Insufficient data from both' },
};

const VERDICT_CONFIG = {
  BULLISH: { icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
  BEARISH: { icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-100' },
  NEUTRAL: { icon: MinusCircle, color: 'text-gray-500', bg: 'bg-gray-100' },
};

// ═══════════════════════════════════════════════════════════════
// CONTROLS PANEL
// ═══════════════════════════════════════════════════════════════

function ControlsPanel({ params, setParams, onRefresh, loading }) {
  return (
    <Card className="border-0 shadow-sm bg-white" data-testid="alignment-controls">
      <CardContent className="py-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Symbols</span>
            <select
              value={params.symbols}
              onChange={(e) => setParams({ ...params, symbols: e.target.value })}
              className="px-3 py-1.5 bg-slate-800 text-white rounded text-sm border border-gray-200"
              data-testid="alignment-symbols-select"
            >
              <option value="BTCUSDT">BTCUSDT</option>
              <option value="BTCUSDT,ETHUSDT">BTC + ETH</option>
              <option value="BTCUSDT,ETHUSDT,SOLUSDT">BTC + ETH + SOL</option>
              <option value="BTCUSDT,ETHUSDT,SOLUSDT,BNBUSDT,XRPUSDT">All 5</option>
            </select>
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="ml-auto p-2 rounded hover:bg-slate-800 transition-colors"
            data-testid="alignment-refresh-btn"
          >
            <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// DIAGNOSTICS SUMMARY
// ═══════════════════════════════════════════════════════════════

function DiagnosticsSummary({ diagnostics }) {
  if (!diagnostics) return null;

  const { counts, rates, avgStrength, avgTrustShift, totalItems } = diagnostics;

  return (
    <Card data-testid="alignment-diagnostics">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-slate-400" />
          Alignment Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-2xl font-bold text-slate-800">{totalItems}</div>
            <div className="text-xs text-slate-500">Total Alignments</div>
          </div>
          
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {((rates?.confirmationRate || 0) * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-slate-500">Confirmation Rate</div>
          </div>
          
          <div className="p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {((rates?.contradictionRate || 0) * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-slate-500">Contradiction Rate</div>
          </div>
          
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {(avgStrength * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-slate-500">Avg Strength</div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 p-3 bg-slate-100 rounded-lg">
          <Scale className="w-5 h-5 text-slate-500" />
          <div>
            <span className="text-sm text-slate-600">Avg Trust Shift:</span>
            <span className={`ml-2 font-bold ${
              avgTrustShift > 0 ? 'text-green-600' : 
              avgTrustShift < 0 ? 'text-red-600' : 'text-gray-500'
            }`}>
              {avgTrustShift > 0 ? '+' : ''}{(avgTrustShift * 100).toFixed(1)}%
            </span>
          </div>
          <div className="ml-auto text-xs text-slate-400">
            Hint for Meta-Brain confidence adjustment
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// DISTRIBUTION PANEL
// ═══════════════════════════════════════════════════════════════

function DistributionPanel({ distribution }) {
  if (!distribution) return null;

  const alignmentTypes = ['CONFIRMED', 'CONTRADICTED', 'IGNORED', 'EXCHANGE_ONLY', 'SENTIMENT_ONLY', 'NO_DATA'];
  const total = Object.values(distribution).reduce((sum, v) => sum + (v || 0), 0);

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
          {alignmentTypes.map(type => {
            const config = ALIGNMENT_CONFIG[type];
            const count = distribution[type] || 0;
            const pct = total > 0 ? (count / total * 100) : 0;
            const Icon = config.icon;
            
            return (
              <div key={type} className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${config.color}`} />
                <span className="text-sm font-medium w-32">{config.label}</span>
                <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${config.barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-sm font-bold w-12 text-right">{pct.toFixed(0)}%</span>
                <span className="text-xs text-slate-400 w-8">({count})</span>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 space-y-1">
          {alignmentTypes.map(type => (
            <p key={type}><strong>{ALIGNMENT_CONFIG[type].label}:</strong> {ALIGNMENT_CONFIG[type].desc}</p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// ALIGNMENT CARD
// ═══════════════════════════════════════════════════════════════

function AlignmentCard({ alignment }) {
  if (!alignment) return null;

  const { symbol, exchange, sentiment, alignment: core } = alignment;
  const typeConfig = ALIGNMENT_CONFIG[core.type] || ALIGNMENT_CONFIG.NO_DATA;
  const TypeIcon = typeConfig.icon;

  const exchangeVerdict = VERDICT_CONFIG[exchange.verdict] || VERDICT_CONFIG.NEUTRAL;
  const sentimentVerdict = VERDICT_CONFIG[sentiment.verdict] || VERDICT_CONFIG.NEUTRAL;
  const ExchangeIcon = exchangeVerdict.icon;
  const SentimentIcon = sentimentVerdict.icon;

  return (
    <Card data-testid={`alignment-card-${symbol}`} className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">{symbol}</CardTitle>
          <Badge className={`${typeConfig.bg} ${typeConfig.color} border-0`}>
            <TypeIcon className="w-3 h-3 mr-1" />
            {typeConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Two Layer Comparison */}
        <div className="grid grid-cols-2 gap-4">
          {/* Exchange Layer */}
          <div className={`p-3 rounded-lg ${exchangeVerdict.bg}`}>
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-slate-600">Exchange</span>
            </div>
            <div className="flex items-center gap-2">
              <ExchangeIcon className={`w-5 h-5 ${exchangeVerdict.color}`} />
              <span className={`font-bold ${exchangeVerdict.color}`}>{exchange.verdict}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Gauge className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-600">
                Confidence: <strong>{(exchange.confidence * 100).toFixed(0)}%</strong>
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              {exchange.readiness === 'READY' ? (
                <ShieldCheck className="w-3 h-3 text-green-500" />
              ) : (
                <ShieldX className="w-3 h-3 text-orange-500" />
              )}
              <span className="text-xs text-slate-500">{exchange.readiness}</span>
            </div>
          </div>

          {/* Sentiment Layer */}
          <div className={`p-3 rounded-lg ${sentimentVerdict.bg}`}>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-slate-600">Sentiment</span>
            </div>
            <div className="flex items-center gap-2">
              <SentimentIcon className={`w-5 h-5 ${sentimentVerdict.color}`} />
              <span className={`font-bold ${sentimentVerdict.color}`}>{sentiment.verdict}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Gauge className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-600">
                Confidence: <strong>{(sentiment.confidence * 100).toFixed(0)}%</strong>
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              {sentiment.usable ? (
                <ShieldCheck className="w-3 h-3 text-green-500" />
              ) : (
                <ShieldX className="w-3 h-3 text-orange-500" />
              )}
              <span className="text-xs text-slate-500">{sentiment.usable ? 'Usable' : 'Not Usable'}</span>
            </div>
          </div>
        </div>

        {/* Alignment Metrics */}
        <div className="p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-xs text-slate-500">Strength</span>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" />
                <span className="text-lg font-bold text-slate-800">
                  {(core.strength * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            
            <div className="border-l pl-4">
              <span className="text-xs text-slate-500">Trust Shift</span>
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-purple-500" />
                <span className={`text-lg font-bold ${
                  core.trustShift > 0 ? 'text-green-600' : 
                  core.trustShift < 0 ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {core.trustShift > 0 ? '+' : ''}{(core.trustShift * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Explanation */}
        {core.explanation && core.explanation.length > 0 && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 mt-0.5" />
              <div className="text-xs text-slate-700 space-y-1">
                {core.explanation.map((exp, i) => (
                  <p key={i}>{exp}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Drivers */}
        {core.drivers && (
          <div className="space-y-2">
            {core.drivers.exchangeDrivers?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-blue-500 font-medium">Exchange:</span>
                {core.drivers.exchangeDrivers.slice(0, 3).map((d, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{d}</Badge>
                ))}
              </div>
            )}
            {core.drivers.sentimentDrivers?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-purple-500 font-medium">Sentiment:</span>
                {core.drivers.sentimentDrivers.slice(0, 3).map((d, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{d}</Badge>
                ))}
              </div>
            )}
            {core.drivers.conflictDrivers?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-red-500 font-medium">Conflict:</span>
                {core.drivers.conflictDrivers.slice(0, 3).map((d, i) => (
                  <Badge key={i} variant="outline" className="text-xs bg-red-50">{d}</Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// INSIGHTS PANEL
// ═══════════════════════════════════════════════════════════════

function InsightsPanel({ insights }) {
  if (!insights || insights.length === 0) return null;

  return (
    <Card data-testid="alignment-insights">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-500" />
          Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {insights.map((insight, i) => (
            <div key={i} className="flex items-start gap-2 p-2 bg-slate-50 rounded">
              <Activity className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <span className="text-sm text-slate-700">{insight}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function AlignmentExplorerPage() {
  const [params, setParams] = useState({
    symbols: 'BTCUSDT,ETHUSDT,SOLUSDT',
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    alignments: [],
    diagnostics: null,
    distribution: null,
    insights: [],
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch alignments for selected symbols
      const alignmentsRes = await api.get(`/api/v10/fusion/alignments?symbols=${params.symbols}`);
      
      // Fetch diagnostics
      const diagnosticsRes = await api.get(`/api/v10/fusion/alignment/diagnostics?symbols=${params.symbols}`);
      
      // axios returns response.data
      const alignmentsData = alignmentsRes.data;
      const diagnosticsData = diagnosticsRes.data;
      
      setData({
        alignments: alignmentsData?.alignments || [],
        diagnostics: diagnosticsData?.diagnostics || null,
        distribution: diagnosticsData?.distribution || null,
        insights: diagnosticsData?.insights || [],
      });
    } catch (err) {
      console.error('[Alignment] Fetch error:', err);
      setError(err.message || 'Failed to fetch alignment data');
    } finally {
      setLoading(false);
    }
  }, [params.symbols]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6" data-testid="alignment-explorer-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <ArrowLeftRight className="w-7 h-7 text-blue-600" />
            Alignment Explorer
            <Badge className="bg-blue-600 text-white">C1</Badge>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Exchange x Sentiment Fusion — How do layers align?
          </p>
        </div>
        
        <Badge variant="outline" className="text-xs">
          Research Analytics — NOT a trading signal
        </Badge>
      </div>

      {/* Controls */}
      <ControlsPanel
        params={params}
        setParams={setParams}
        onRefresh={fetchData}
        loading={loading}
      />

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Top row: Diagnostics + Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DiagnosticsSummary diagnostics={data.diagnostics} />
            <DistributionPanel distribution={data.distribution} />
          </div>

          {/* Alignment Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {data.alignments.map(alignment => (
              <AlignmentCard key={alignment.symbol} alignment={alignment} />
            ))}
          </div>

          {/* Insights */}
          <InsightsPanel insights={data.insights} />

          {/* Disclaimer */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="py-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                <div className="text-sm text-slate-700">
                  <strong>Disclaimer:</strong> This is a research analytics page. 
                  Alignment data represents the relationship between Exchange and Sentiment layers, 
                  NOT a prediction of market direction. Do NOT use as a trading signal.
                  Trust Shift is a HINT for downstream processing (C3 Meta-Brain), not applied here.
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
