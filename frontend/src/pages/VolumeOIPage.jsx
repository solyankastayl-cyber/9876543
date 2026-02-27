/**
 * S10.3 — Volume & OI Regimes Page
 * 
 * "In what mode is the market living right now?"
 * 
 * Displays:
 * - Current Regime (ACCUMULATION / SQUEEZE / etc)
 * - Confidence level
 * - Key Drivers (human-readable)
 * - Regime Timeline
 * 
 * NO signals, NO predictions — only structure
 */

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  RefreshCw,
  Loader2,
  BarChart3,
  Layers,
  Clock,
  ChevronRight,
  Flame,
  Target,
  Waves,
  Minus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api } from '@/api/client';

// Regime configuration
const REGIME_CONFIG = {
  ACCUMULATION: {
    label: 'Accumulation',
    description: 'Building positions quietly',
    color: 'text-blue-600',
    bgColor: 'bg-blue-500',
    icon: Target,
  },
  DISTRIBUTION: {
    label: 'Distribution',
    description: 'Exiting positions quietly',
    color: 'text-purple-600',
    bgColor: 'bg-purple-500',
    icon: Layers,
  },
  LONG_SQUEEZE: {
    label: 'Long Squeeze',
    description: 'Longs being liquidated',
    color: 'text-red-600',
    bgColor: 'bg-red-500',
    icon: TrendingDown,
  },
  SHORT_SQUEEZE: {
    label: 'Short Squeeze',
    description: 'Shorts being liquidated',
    color: 'text-green-600',
    bgColor: 'bg-green-500',
    icon: TrendingUp,
  },
  EXPANSION: {
    label: 'Expansion',
    description: 'Healthy trending market',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500',
    icon: Activity,
  },
  EXHAUSTION: {
    label: 'Exhaustion',
    description: 'Trend losing steam',
    color: 'text-orange-600',
    bgColor: 'bg-orange-500',
    icon: Waves,
  },
  NEUTRAL: {
    label: 'Neutral',
    description: 'No clear regime',
    color: 'text-gray-600',
    bgColor: 'bg-gray-500',
    icon: Minus,
  },
};

export default function VolumeOIPage() {
  const [regimeState, setRegimeState] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setError(null);
      
      const [regimeRes, historyRes] = await Promise.all([
        api.get(`/api/v10/exchange/regime/${selectedSymbol}`),
        api.get(`/api/v10/exchange/regime/history/${selectedSymbol}?limit=10`),
      ]);
      
      if (regimeRes.data?.ok) {
        setRegimeState(regimeRes.data.data);
      }
      
      if (historyRes.data?.ok) {
        setHistory(historyRes.data.data || []);
      }
    } catch (err) {
      console.error('Regime fetch error:', err);
      setError('Failed to fetch regime data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const regime = regimeState?.regime || 'NEUTRAL';
  const regimeConfig = REGIME_CONFIG[regime] || REGIME_CONFIG.NEUTRAL;
  const RegimeIcon = regimeConfig.icon;
  const metrics = regimeState?.metrics || {};

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="volume-oi-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Volume & OI Regimes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Market structure analysis • S10.3
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
            onClick={fetchData}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
          {error} — Enable exchange module in admin to see live data
        </div>
      )}

      {/* Main Regime Display */}
      <Card className={`border-l-4 ${regimeConfig.bgColor.replace('bg-', 'border-')}`} data-testid="current-regime-card">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-xl ${regimeConfig.bgColor} bg-opacity-20`}>
                <RegimeIcon className={`w-10 h-10 ${regimeConfig.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Current Market Regime</p>
                <h2 className={`text-3xl font-bold ${regimeConfig.color}`}>
                  {regimeConfig.label}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {regimeConfig.description}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">Confidence</p>
              <div className="flex items-center gap-2">
                <span className="text-4xl font-bold text-gray-900">
                  {((regimeState?.confidence || 0) * 100).toFixed(0)}%
                </span>
              </div>
              <Progress 
                value={(regimeState?.confidence || 0) * 100} 
                className="w-32 h-2 mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drivers & Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Key Drivers */}
        <Card data-testid="drivers-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChevronRight className="w-5 h-5 text-gray-400" />
              Key Drivers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(regimeState?.drivers || ['No clear pattern detected']).map((driver, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className={`w-2 h-2 rounded-full ${regimeConfig.bgColor}`} />
                  <span className="text-sm text-gray-700">{driver}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Metrics */}
        <Card data-testid="metrics-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-400" />
              Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Volume Delta */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Volume vs Baseline</span>
                  <span className={`font-medium ${
                    (metrics.volumeDelta || 0) > 0 ? 'text-green-600' : 
                    (metrics.volumeDelta || 0) < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {(metrics.volumeDelta || 0) > 0 ? '+' : ''}{(metrics.volumeDelta || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${(metrics.volumeDelta || 0) > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(Math.abs(metrics.volumeDelta || 0), 100)}%` }}
                  />
                </div>
              </div>

              {/* OI Delta */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Open Interest Change</span>
                  <span className={`font-medium ${
                    (metrics.oiDelta || 0) > 0 ? 'text-green-600' : 
                    (metrics.oiDelta || 0) < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {(metrics.oiDelta || 0) > 0 ? '+' : ''}{(metrics.oiDelta || 0).toFixed(2)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${(metrics.oiDelta || 0) > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(Math.abs(metrics.oiDelta || 0) * 10, 100)}%` }}
                  />
                </div>
              </div>

              {/* Price Delta */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Price Change</span>
                  <span className={`font-medium ${
                    (metrics.priceDelta || 0) > 0 ? 'text-green-600' : 
                    (metrics.priceDelta || 0) < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {(metrics.priceDelta || 0) > 0 ? '+' : ''}{(metrics.priceDelta || 0).toFixed(2)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${(metrics.priceDelta || 0) > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(Math.abs(metrics.priceDelta || 0) * 20, 100)}%` }}
                  />
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Direction</p>
                  <p className="text-sm font-medium">
                    {metrics.priceDirection || 'FLAT'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Flow Bias</p>
                  <p className="text-sm font-medium">
                    {metrics.orderFlowBias || 'NEUTRAL'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Liq. Pressure</p>
                  <p className="text-sm font-medium">
                    {(metrics.liquidationPressure || 0).toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Regime Timeline */}
      <Card data-testid="timeline-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            Regime Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <div className="space-y-2">
              {/* Timeline Bar */}
              <div className="flex h-8 rounded-lg overflow-hidden">
                {history.map((entry, i) => {
                  const config = REGIME_CONFIG[entry.regime] || REGIME_CONFIG.NEUTRAL;
                  return (
                    <div
                      key={i}
                      className={`${config.bgColor} flex-1 flex items-center justify-center text-white text-xs font-medium`}
                      title={`${config.label} - ${((entry.confidence || 0) * 100).toFixed(0)}%`}
                    >
                      {history.length <= 5 && config.label.slice(0, 3)}
                    </div>
                  );
                })}
              </div>

              {/* Timeline Legend */}
              <div className="flex flex-wrap gap-2 mt-4">
                {Object.entries(REGIME_CONFIG).map(([key, config]) => (
                  <div key={key} className="flex items-center gap-1 text-xs">
                    <div className={`w-3 h-3 rounded ${config.bgColor}`} />
                    <span className="text-gray-500">{config.label}</span>
                  </div>
                ))}
              </div>

              {/* History List */}
              <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                {history.slice().reverse().map((entry, i) => {
                  const config = REGIME_CONFIG[entry.regime] || REGIME_CONFIG.NEUTRAL;
                  return (
                    <div 
                      key={i}
                      className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${config.bgColor}`} />
                        <span className="text-sm font-medium">{config.label}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{((entry.confidence || 0) * 100).toFixed(0)}%</span>
                        <span>
                          {entry.startedAt 
                            ? new Date(entry.startedAt).toLocaleTimeString() 
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-8 h-8 mx-auto mb-2 text-gray-700" />
              <p>No regime history available</p>
              <p className="text-xs mt-1">History builds up over time</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last Update */}
      <div className="text-xs text-gray-400 text-right">
        Last update: {regimeState?.timestamp ? new Date(regimeState.timestamp).toLocaleTimeString() : 'Never'}
      </div>
    </div>
  );
}
