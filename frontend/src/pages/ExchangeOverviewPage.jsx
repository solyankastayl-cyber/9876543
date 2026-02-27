/**
 * S10.1 — Exchange Overview Page
 * 
 * "Market Weather" - read-only display of exchange reality
 * 
 * NO signals, NO ML, NO decisions
 * Only facts: volatility, aggression, OI, liquidations
 */

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap, 
  BarChart2, 
  AlertTriangle,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api } from '@/api/client';

// Regime display config
const REGIME_CONFIG = {
  UNKNOWN: { label: 'Unknown', color: 'bg-gray-500', icon: Minus },
  LOW_ACTIVITY: { label: 'Low Activity', color: 'bg-blue-500', icon: Activity },
  TRENDING: { label: 'Trending', color: 'bg-green-500', icon: TrendingUp },
  SQUEEZE: { label: 'Squeeze', color: 'bg-orange-500', icon: AlertTriangle },
  DISTRIBUTION: { label: 'Distribution', color: 'bg-purple-500', icon: BarChart2 },
};

export default function ExchangeOverviewPage() {
  const [overview, setOverview] = useState(null);
  const [health, setHealth] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setError(null);
      
      const [overviewRes, healthRes, marketsRes] = await Promise.all([
        api.get('/api/v10/exchange/overview').catch(() => ({ data: { ok: false } })),
        api.get('/api/v10/exchange/health').catch(() => ({ data: null })),
        api.get('/api/v10/exchange/markets').catch(() => ({ data: { ok: false, data: [] } })),
      ]);

      if (overviewRes.data?.ok) {
        setOverview(overviewRes.data.data);
      }
      
      if (healthRes.data) {
        setHealth(healthRes.data);
      }
      
      if (marketsRes.data?.ok) {
        setMarkets(marketsRes.data.data || []);
      }
    } catch (err) {
      setError('Failed to fetch exchange data');
      console.error('Exchange fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const regimeConfig = overview ? REGIME_CONFIG[overview.regime] : REGIME_CONFIG.UNKNOWN;
  const RegimeIcon = regimeConfig.icon;

  // Format large numbers
  const formatVolume = (vol) => {
    if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}B`;
    if (vol >= 1e6) return `$${(vol / 1e6).toFixed(2)}M`;
    if (vol >= 1e3) return `$${(vol / 1e3).toFixed(2)}K`;
    return `$${vol.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="exchange-overview-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exchange Intelligence</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time market context • S10.1 Foundation
          </p>
        </div>
        <div className="flex items-center gap-3">
          {health?.polling?.running ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              Live
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
              <XCircle className="w-3 h-3 mr-1" />
              Offline
            </Badge>
          )}
          <button 
            onClick={fetchData}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Market Regime */}
        <Card className="col-span-1" data-testid="regime-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Market Regime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${regimeConfig.color} bg-opacity-20`}>
                <RegimeIcon className={`w-5 h-5 ${regimeConfig.color.replace('bg-', 'text-')}`} />
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {regimeConfig.label}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Placeholder for S10.2+
            </p>
          </CardContent>
        </Card>

        {/* Volatility Index */}
        <Card data-testid="volatility-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Volatility Index</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">
                {overview?.volatilityIndex?.toFixed(1) || '0.0'}
              </span>
              <span className="text-sm text-gray-400">/ 100</span>
            </div>
            <Progress 
              value={overview?.volatilityIndex || 0} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        {/* Aggression Ratio */}
        <Card data-testid="aggression-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Buy vs Sell Pressure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {(overview?.aggressionRatio || 0) > 0.1 ? (
                <ArrowUpRight className="w-5 h-5 text-green-500" />
              ) : (overview?.aggressionRatio || 0) < -0.1 ? (
                <ArrowDownRight className="w-5 h-5 text-red-500" />
              ) : (
                <Minus className="w-5 h-5 text-gray-400" />
              )}
              <span className={`text-2xl font-bold ${
                (overview?.aggressionRatio || 0) > 0 ? 'text-green-600' : 
                (overview?.aggressionRatio || 0) < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {((overview?.aggressionRatio || 0) * 100).toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {(overview?.aggressionRatio || 0) > 0 ? 'Buyers aggressive' : 
               (overview?.aggressionRatio || 0) < 0 ? 'Sellers aggressive' : 'Neutral'}
            </p>
          </CardContent>
        </Card>

        {/* OI Trend */}
        <Card data-testid="oi-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Open Interest</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {overview?.oiTrend === 'EXPANDING' ? (
                <>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <span className="text-lg font-semibold text-green-600">Expanding</span>
                </>
              ) : overview?.oiTrend === 'CONTRACTING' ? (
                <>
                  <TrendingDown className="w-5 h-5 text-red-500" />
                  <span className="text-lg font-semibold text-red-600">Contracting</span>
                </>
              ) : (
                <>
                  <Minus className="w-5 h-5 text-gray-400" />
                  <span className="text-lg font-semibold text-gray-600">Neutral</span>
                </>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Position interest trend
            </p>
          </CardContent>
        </Card>

        {/* Liquidation Pressure */}
        <Card data-testid="liquidation-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Liquidation Pressure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Zap className={`w-5 h-5 ${
                (overview?.liquidationPressure || 0) > 50 ? 'text-red-500' : 
                (overview?.liquidationPressure || 0) > 20 ? 'text-orange-500' : 'text-gray-400'
              }`} />
              <span className="text-2xl font-bold text-gray-900">
                {overview?.liquidationPressure?.toFixed(0) || '0'}
              </span>
              <span className="text-sm text-gray-400">/ 100</span>
            </div>
            <Progress 
              value={overview?.liquidationPressure || 0} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Markets Table */}
      <Card data-testid="markets-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-gray-400" />
            Top Markets
          </CardTitle>
        </CardHeader>
        <CardContent>
          {markets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-3 font-medium">Symbol</th>
                    <th className="pb-3 font-medium text-right">Price</th>
                    <th className="pb-3 font-medium text-right">24h Change</th>
                    <th className="pb-3 font-medium text-right">Volume 24h</th>
                    <th className="pb-3 font-medium text-right">Volatility</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {markets.slice(0, 10).map((market) => (
                    <tr key={market.symbol} className="hover:bg-gray-50">
                      <td className="py-3 font-medium text-gray-900">{market.symbol}</td>
                      <td className="py-3 text-right font-mono">
                        ${market.price < 1 ? market.price.toFixed(6) : market.price.toFixed(2)}
                      </td>
                      <td className={`py-3 text-right font-medium ${
                        market.change24h > 0 ? 'text-green-600' : 
                        market.change24h < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {market.change24h > 0 ? '+' : ''}{market.change24h.toFixed(2)}%
                      </td>
                      <td className="py-3 text-right text-gray-600">
                        {formatVolume(market.volume24h)}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Progress 
                            value={market.volatility * 100} 
                            className="w-16 h-1.5"
                          />
                          <span className="text-xs text-gray-500 w-8">
                            {(market.volatility * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-8 h-8 mx-auto mb-2 text-gray-700" />
              <p>No market data available</p>
              <p className="text-xs mt-1">Enable exchange module in admin to start fetching</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Footer */}
      {health && (
        <div className="flex items-center justify-between text-xs text-gray-400 px-1">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Last update: {overview?.lastUpdate ? new Date(overview.lastUpdate).toLocaleTimeString() : 'Never'}
            </span>
            <span>Provider: {health.provider?.provider || 'N/A'}</span>
            <span>Latency: {health.provider?.latencyMs || 0}ms</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Rate limit: {health.provider?.rateLimitUsed?.toFixed(0) || 0}%</span>
            <span>Cache: {health.cache?.markets || 0} markets</span>
          </div>
        </div>
      )}
    </div>
  );
}
