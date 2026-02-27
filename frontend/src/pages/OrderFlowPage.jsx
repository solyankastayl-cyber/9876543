/**
 * S10.2 — Order Flow Intelligence Page
 * 
 * "Who is pushing the price?"
 * 
 * Displays:
 * - Aggressor Dominance (BUY / SELL / NEUTRAL)
 * - Trade Intensity
 * - Absorption detected (YES / NO)
 * - Order Book Pressure
 * 
 * NO signals, NO predictions — only diagnostics
 */

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  Shield,
  Gauge,
  BarChart3,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api } from '@/api/client';

// Side color config
const SIDE_CONFIG = {
  BUY: { label: 'Buyers', color: 'text-green-600', bgColor: 'bg-green-500', icon: ArrowUpRight },
  SELL: { label: 'Sellers', color: 'text-red-600', bgColor: 'bg-red-500', icon: ArrowDownRight },
  NEUTRAL: { label: 'Neutral', color: 'text-gray-600', bgColor: 'bg-gray-500', icon: Minus },
};

const STRENGTH_CONFIG = {
  NONE: { label: 'None', color: 'text-gray-400' },
  LOW: { label: 'Low', color: 'text-yellow-500' },
  MEDIUM: { label: 'Medium', color: 'text-orange-500' },
  HIGH: { label: 'High', color: 'text-red-500' },
};

export default function OrderFlowPage() {
  const [summaries, setSummaries] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setError(null);
      const res = await api.get('/api/v10/exchange/order-flow');
      
      if (res.data?.ok) {
        setSummaries(res.data.data || []);
      }
    } catch (err) {
      console.error('Order flow fetch error:', err);
      // Try individual symbol
      try {
        const symbolRes = await api.get(`/api/v10/exchange/order-flow/${selectedSymbol}`);
        if (symbolRes.data?.ok) {
          setSummaries([symbolRes.data.data]);
        }
      } catch {
        setError('Failed to fetch order flow data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const currentSummary = summaries.find(s => s.symbol === selectedSymbol) || summaries[0];
  const flow = currentSummary?.flow;
  const absorption = currentSummary?.absorption;
  const pressure = currentSummary?.pressure;

  const aggressorConfig = SIDE_CONFIG[flow?.aggressorSide || 'NEUTRAL'];
  const AggressorIcon = aggressorConfig.icon;
  const pressureConfig = SIDE_CONFIG[pressure?.pressure || 'NEUTRAL'];
  const PressureIcon = pressureConfig.icon;
  const biasConfig = SIDE_CONFIG[currentSummary?.marketBias || 'NEUTRAL'];
  const BiasIcon = biasConfig.icon;
  const strengthConfig = STRENGTH_CONFIG[absorption?.strength || 'NONE'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="order-flow-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Flow Intelligence</h1>
          <p className="text-sm text-gray-500 mt-1">
            Who is pushing the price? • S10.2
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Symbol selector */}
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
            title="Refresh"
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

      {/* Market Bias Banner */}
      <Card className={`border-l-4 ${biasConfig.bgColor.replace('bg-', 'border-')}`} data-testid="market-bias-card">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${biasConfig.bgColor} bg-opacity-20`}>
                <BiasIcon className={`w-6 h-6 ${biasConfig.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Overall Market Bias</p>
                <p className={`text-xl font-bold ${biasConfig.color}`}>
                  {biasConfig.label} Dominated
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Bias Strength</p>
              <p className="text-2xl font-bold text-gray-900">
                {currentSummary?.biasStrength?.toFixed(0) || 0}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Aggressor Dominance */}
        <Card data-testid="aggressor-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Aggressor Dominance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-2 rounded-lg ${aggressorConfig.bgColor} bg-opacity-20`}>
                <AggressorIcon className={`w-5 h-5 ${aggressorConfig.color}`} />
              </div>
              <span className={`text-lg font-semibold ${aggressorConfig.color}`}>
                {aggressorConfig.label}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Sellers</span>
                <span>Buyers</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
                <div 
                  className="bg-red-500 transition-all"
                  style={{ width: `${50 - (flow?.aggressorRatio || 0) * 50}%` }}
                />
                <div 
                  className="bg-green-500 transition-all"
                  style={{ width: `${50 + (flow?.aggressorRatio || 0) * 50}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 text-center">
                Ratio: {((flow?.aggressorRatio || 0) * 100).toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Trade Intensity */}
        <Card data-testid="intensity-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              Trade Intensity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-bold text-gray-900">
                {flow?.tradeIntensity?.toFixed(0) || 0}
              </span>
              <span className="text-sm text-gray-400">/ 100</span>
            </div>
            <Progress 
              value={flow?.tradeIntensity || 0} 
              className="h-3"
            />
            <p className="text-xs text-gray-400 mt-2">
              {(flow?.tradeIntensity || 0) < 20 ? 'Low activity' :
               (flow?.tradeIntensity || 0) < 50 ? 'Normal activity' :
               (flow?.tradeIntensity || 0) < 80 ? 'High activity' : 'Extreme activity'}
            </p>
          </CardContent>
        </Card>

        {/* Absorption Detection */}
        <Card data-testid="absorption-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Absorption Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-3">
              {absorption?.detected ? (
                <>
                  <div className="p-2 rounded-lg bg-orange-500 bg-opacity-20">
                    <CheckCircle className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <span className="text-lg font-semibold text-orange-600">YES</span>
                    <p className="text-xs text-gray-500">
                      {SIDE_CONFIG[absorption?.side || 'NEUTRAL'].label} being absorbed
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-2 rounded-lg bg-gray-500 bg-opacity-20">
                    <XCircle className="w-5 h-5 text-gray-400" />
                  </div>
                  <span className="text-lg font-semibold text-gray-500">NO</span>
                </>
              )}
            </div>
            {absorption?.detected && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Strength:</span>
                <span className={`font-medium ${strengthConfig.color}`}>
                  {strengthConfig.label}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Book Pressure */}
        <Card data-testid="pressure-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Order Book Pressure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-2 rounded-lg ${pressureConfig.bgColor} bg-opacity-20`}>
                <PressureIcon className={`w-5 h-5 ${pressureConfig.color}`} />
              </div>
              <span className={`text-lg font-semibold ${pressureConfig.color}`}>
                {pressureConfig.label} Pressure
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Imbalance:</span>
                <span className="font-medium">
                  {((pressure?.bidAskImbalance || 0) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Confidence:</span>
                <span className="font-medium">
                  {((pressure?.confidence || 0) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Volume Breakdown */}
      <Card data-testid="volume-breakdown-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-400" />
            Volume Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Trade Flow */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-3">Trade Flow Volume</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-600">Buy Volume</span>
                  <span className="text-sm font-mono">
                    ${((flow?.buyVolume || 0) / 1000).toFixed(1)}K
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-600">Sell Volume</span>
                  <span className="text-sm font-mono">
                    ${((flow?.sellVolume || 0) / 1000).toFixed(1)}K
                  </span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden flex mt-2">
                  <div 
                    className="bg-green-500"
                    style={{ 
                      width: `${(flow?.buyVolume || 0) / ((flow?.buyVolume || 0) + (flow?.sellVolume || 1)) * 100}%` 
                    }}
                  />
                  <div 
                    className="bg-red-500"
                    style={{ 
                      width: `${(flow?.sellVolume || 0) / ((flow?.buyVolume || 0) + (flow?.sellVolume || 1)) * 100}%` 
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Order Book */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-3">Order Book Volume</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-600">Bid Volume</span>
                  <span className="text-sm font-mono">
                    ${((pressure?.bidVolume || 0) / 1000).toFixed(1)}K
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-600">Ask Volume</span>
                  <span className="text-sm font-mono">
                    ${((pressure?.askVolume || 0) / 1000).toFixed(1)}K
                  </span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden flex mt-2">
                  <div 
                    className="bg-green-500"
                    style={{ 
                      width: `${(pressure?.bidVolume || 0) / ((pressure?.bidVolume || 0) + (pressure?.askVolume || 1)) * 100}%` 
                    }}
                  />
                  <div 
                    className="bg-red-500"
                    style={{ 
                      width: `${(pressure?.askVolume || 0) / ((pressure?.bidVolume || 0) + (pressure?.askVolume || 1)) * 100}%` 
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Spread */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-3">Market Spread</h4>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  {(pressure?.spread || 0).toFixed(3)}%
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {(pressure?.spread || 0) < 0.01 ? 'Very tight' :
                 (pressure?.spread || 0) < 0.05 ? 'Normal' : 'Wide'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Update */}
      <div className="text-xs text-gray-400 text-right">
        Last update: {currentSummary?.timestamp ? new Date(currentSummary.timestamp).toLocaleTimeString() : 'Never'}
      </div>
    </div>
  );
}
