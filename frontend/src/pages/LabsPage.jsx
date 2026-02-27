/**
 * S10.6 — Exchange Labs Page (Dataset Viewer)
 * 
 * Read-only view of exchange observations:
 * - Recent Observations Table
 * - Pattern Frequency
 * - Regime × Pattern Matrix
 * - Conflict Density
 * 
 * NO signals, NO predictions — just data
 */

import { useState, useEffect } from 'react';
import { 
  RefreshCw,
  Loader2,
  Database,
  BarChart3,
  Grid3X3,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Play,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { api } from '@/api/client';

// Regime colors and descriptions
const REGIME_INFO = {
  ACCUMULATION: {
    color: 'bg-blue-100 text-blue-700',
    hint: 'Whales and smart money are accumulating. Typically precedes an upward move.'
  },
  DISTRIBUTION: {
    color: 'bg-purple-100 text-purple-700', 
    hint: 'Large holders are distributing/selling. Often precedes a downward move.'
  },
  LONG_SQUEEZE: {
    color: 'bg-red-100 text-red-700',
    hint: 'Over-leveraged longs are being liquidated. Rapid downward price movement.'
  },
  SHORT_SQUEEZE: {
    color: 'bg-green-100 text-green-700',
    hint: 'Over-leveraged shorts are being liquidated. Rapid upward price movement.'
  },
  EXPANSION: {
    color: 'bg-emerald-100 text-emerald-700',
    hint: 'Market is trending with increasing volume and participation.'
  },
  EXHAUSTION: {
    color: 'bg-orange-100 text-orange-700',
    hint: 'Current trend is weakening. Potential reversal or consolidation ahead.'
  },
  NEUTRAL: {
    color: 'bg-gray-100 text-gray-700',
    hint: 'No clear pattern detected. Market is range-bound or uncertain.'
  },
};

// Category colors and descriptions  
const CATEGORY_INFO = {
  FLOW: {
    color: 'bg-blue-500',
    hint: 'Order flow analysis - buy/sell pressure imbalance'
  },
  OI: {
    color: 'bg-purple-500',
    hint: 'Open Interest - total outstanding derivative contracts'
  },
  LIQUIDATION: {
    color: 'bg-red-500',
    hint: 'Forced position closures due to margin calls'
  },
  VOLUME: {
    color: 'bg-green-500',
    hint: 'Trading volume patterns and anomalies'
  },
  STRUCTURE: {
    color: 'bg-orange-500',
    hint: 'Market structure - support/resistance, orderbook depth'
  },
};

// Legacy exports for backward compatibility
const REGIME_COLORS = Object.fromEntries(
  Object.entries(REGIME_INFO).map(([k, v]) => [k, v.color])
);
const CATEGORY_COLORS = Object.fromEntries(
  Object.entries(CATEGORY_INFO).map(([k, v]) => [k, v.color])
);

export default function LabsPage() {
  const [observations, setObservations] = useState([]);
  const [stats, setStats] = useState(null);
  const [matrix, setMatrix] = useState(null);
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setError(null);
      
      const [obsRes, statsRes, matrixRes] = await Promise.all([
        api.get(`/api/v10/exchange/observation?symbol=${selectedSymbol}&limit=20`),
        api.get('/api/v10/exchange/observation/stats'),
        api.get('/api/v10/exchange/observation/matrix'),
      ]);
      
      if (obsRes.data?.ok) {
        setObservations(obsRes.data.data || []);
      }
      
      if (statsRes.data?.ok) {
        setStats(statsRes.data);
      }
      
      if (matrixRes.data?.ok) {
        setMatrix(matrixRes.data);
      }
    } catch (err) {
      console.error('Labs fetch error:', err);
      setError('Failed to fetch dataset');
    } finally {
      setLoading(false);
    }
  };

  const seedData = async () => {
    try {
      setSeeding(true);
      await api.post('/api/admin/exchange/observation/seed', {
        symbol: selectedSymbol,
        count: 10,
      });
      await fetchData();
    } catch (err) {
      console.error('Seed error:', err);
    } finally {
      setSeeding(false);
    }
  };

  const createTick = async () => {
    try {
      await api.post('/api/v10/exchange/observation/tick', {
        symbol: selectedSymbol,
      });
      await fetchData();
    } catch (err) {
      console.error('Tick error:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedSymbol]);

  // Calculate pattern frequency sorted
  const patternFrequencySorted = stats?.patternFrequency 
    ? Object.entries(stats.patternFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    : [];

  // Calculate total patterns for percentage
  const totalPatternOccurrences = patternFrequencySorted.reduce((sum, [_, count]) => sum + count, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="labs-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exchange Labs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Observation Dataset • S10.6
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
            data-testid="symbol-selector"
          >
            {['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'].map(sym => (
              <option key={sym} value={sym}>{sym}</option>
            ))}
          </select>
          <button 
            onClick={createTick}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
            data-testid="create-tick-btn"
          >
            <Play className="w-4 h-4" />
            Create Tick
          </button>
          <button 
            onClick={fetchData}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
          {error}
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="total-observations-card">
          <CardContent className="pt-6">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-3 cursor-help">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Database className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Observations</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats?.totalObservations || 0}
                      </p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Total number of market state snapshots collected for ML training</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardContent>
        </Card>

        <Card data-testid="rate-card">
          <CardContent className="pt-6">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-3 cursor-help">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Clock className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Rate</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {(stats?.observationsPerHour || 0).toFixed(1)}/hr
                      </p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Average observations collected per hour. Higher rate = more training data</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardContent>
        </Card>

        <Card data-testid="conflict-rate-card">
          <CardContent className="pt-6">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-3 cursor-help">
                    <div className="p-3 bg-yellow-100 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Conflict Rate</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {((stats?.conflictRate || 0) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Percentage of observations with conflicting signals. High conflict indicates market uncertainty</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardContent>
        </Card>

        <Card data-testid="symbols-card">
          <CardContent className="pt-6">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-3 cursor-help">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <BarChart3 className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Symbols Tracked</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Object.keys(stats?.observationsBySymbol || {}).length}
                      </p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Number of trading pairs being monitored across exchanges</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Observations Table */}
        <Card className="lg:col-span-2" data-testid="observations-table">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-gray-400" />
              Recent Observations
            </CardTitle>
            {observations.length === 0 && (
              <button
                onClick={seedData}
                disabled={seeding}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {seeding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                Seed Test Data
              </button>
            )}
          </CardHeader>
          <CardContent>
            {observations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 font-medium text-gray-500">Time</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-500">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="cursor-help">Regime</TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Current market state classification (accumulation, distribution, squeeze, etc.)</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </th>
                      <th className="text-left py-2 px-2 font-medium text-gray-500">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="cursor-help">Patterns</TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Number of detected market patterns. ⚠️ = conflicting signals</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </th>
                      <th className="text-left py-2 px-2 font-medium text-gray-500">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="cursor-help">Flow</TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Net order flow direction — BUY (green) or SELL (red) pressure dominant</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </th>
                      <th className="text-left py-2 px-2 font-medium text-gray-500">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="cursor-help">Cascade</TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Active liquidation cascade — rapid forced position closures creating volatility</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {observations.map((obs, idx) => {
                      const regimeInfo = REGIME_INFO[obs.regime] || REGIME_INFO.NEUTRAL;
                      return (
                      <tr key={obs.id || idx} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-2 text-gray-600">
                          {new Date(obs.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-2 px-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Badge className={`cursor-help ${regimeInfo.color}`}>
                                    {obs.regime}
                                  </Badge>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">{regimeInfo.hint}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{obs.patternCount}</span>
                            {obs.hasConflict && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Conflicting patterns detected — signals disagree</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          {obs.patterns?.length > 0 && (
                            <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">
                              {obs.patterns.slice(0, 2).join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-1">
                            {obs.orderFlow === 'BUY' ? (
                              <TrendingUp className="w-4 h-4 text-green-500" />
                            ) : obs.orderFlow === 'SELL' ? (
                              <TrendingDown className="w-4 h-4 text-red-500" />
                            ) : (
                              <Minus className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="text-xs">{obs.orderFlow}</span>
                          </div>
                        </td>
                        <td className="py-2 px-2">
                          {obs.cascadeActive ? (
                            <Badge className="bg-red-100 text-red-700">Active</Badge>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Database className="w-10 h-10 mx-auto mb-3 text-gray-700" />
                <p>No observations yet</p>
                <p className="text-xs mt-1">Click "Create Tick" or "Seed Test Data" to add observations</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pattern Frequency */}
        <Card data-testid="pattern-frequency">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-400" />
              Pattern Frequency
            </CardTitle>
          </CardHeader>
          <CardContent>
            {patternFrequencySorted.length > 0 ? (
              <div className="space-y-3">
                {patternFrequencySorted.map(([pattern, count], idx) => {
                  const pct = totalPatternOccurrences > 0 
                    ? (count / totalPatternOccurrences) * 100 
                    : 0;
                  
                  return (
                    <div key={pattern}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 truncate max-w-[150px]" title={pattern}>
                          {pattern}
                        </span>
                        <span className="text-gray-500">{count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                <p className="text-sm">No pattern data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Regime Distribution */}
      <Card data-testid="regime-distribution">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="w-5 h-5 text-gray-400" />
            Regime Distribution
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    <strong>Market Regimes</strong> classify the current market state based on order flow, OI changes, and liquidation patterns.
                    <br /><br />
                    Each regime suggests different trading conditions and risk levels.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.regimeDistribution ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {Object.entries(stats.regimeDistribution).map(([regime, count]) => {
                const total = stats.totalObservations || 1;
                const pct = ((count / total) * 100).toFixed(1);
                const regimeInfo = REGIME_INFO[regime] || REGIME_INFO.NEUTRAL;
                
                return (
                  <TooltipProvider key={regime}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div 
                          className={`p-3 rounded-lg cursor-help ${regimeInfo.color}`}
                        >
                          <p className="text-xs font-medium opacity-80">{regime}</p>
                          <p className="text-xl font-bold">{count}</p>
                          <p className="text-xs opacity-70">{pct}%</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">
                          <strong>{regime}</strong>
                          <br />
                          {regimeInfo.hint}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Grid3X3 className="w-8 h-8 mx-auto mb-2 text-gray-700" />
              <p className="text-sm">No regime data</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Distribution */}
      <Card data-testid="category-distribution">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChevronRight className="w-5 h-5 text-gray-400" />
            Pattern Categories
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    <strong>Pattern Categories</strong> group detected patterns by their data source.
                    <br /><br />
                    Different categories reveal different aspects of market behaviour.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.categoryFrequency ? (
            <div className="flex gap-4 flex-wrap">
              {Object.entries(stats.categoryFrequency).map(([category, count]) => {
                const categoryInfo = CATEGORY_INFO[category];
                return (
                  <TooltipProvider key={category}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 cursor-help">
                          <div className={`w-3 h-3 rounded-full ${CATEGORY_COLORS[category] || 'bg-gray-400'}`} />
                          <span className="text-sm text-gray-700">{category}</span>
                          <span className="text-sm font-medium text-gray-900">{count}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          <strong>{category}</strong>
                          <br />
                          {categoryInfo?.hint || 'Pattern category'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No category data</p>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-sm text-blue-700">
          <strong>S10.6 Dataset:</strong> This is raw observation data collected from exchange ticks. 
          No signals, no predictions, no verdicts — just market state snapshots ready for ML training (S10.7).
        </p>
      </div>

      {/* Last Update */}
      <div className="text-xs text-gray-400 text-right">
        Last observation: {stats?.lastObservation ? new Date(stats.lastObservation).toLocaleString() : 'Never'}
      </div>
    </div>
  );
}
