/**
 * S10.4 — Liquidation Cascades Page
 * 
 * "When the market breaks itself"
 * 
 * Displays:
 * - Cascade Status (NONE / ACTIVE)
 * - Direction (LONG / SHORT wipe)
 * - Phase Badge (START / ACTIVE / PEAK / DECAY / END)
 * - Intensity meter
 * - Key drivers
 * - Cascade timeline
 * 
 * NO signals, NO predictions — only structural diagnosis
 */

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  RefreshCw,
  Loader2,
  Flame,
  AlertTriangle,
  Clock,
  Zap,
  Shield,
  ChevronRight,
  Minus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api } from '@/api/client';

// Phase configuration
const PHASE_CONFIG = {
  START: { label: 'Starting', color: 'bg-yellow-500', description: 'Initial spike detected' },
  ACTIVE: { label: 'Active', color: 'bg-orange-500', description: 'Sustained high rate' },
  PEAK: { label: 'Peak', color: 'bg-red-500', description: 'Maximum intensity' },
  DECAY: { label: 'Decaying', color: 'bg-blue-500', description: 'Rate dropping' },
  END: { label: 'Ended', color: 'bg-gray-500', description: 'Returned to baseline' },
};

// Intensity configuration
const INTENSITY_CONFIG = {
  LOW: { label: 'Low', color: 'text-gray-500', bgColor: 'bg-gray-200', width: 25 },
  MEDIUM: { label: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-500', width: 50 },
  HIGH: { label: 'High', color: 'text-orange-600', bgColor: 'bg-orange-500', width: 75 },
  EXTREME: { label: 'Extreme', color: 'text-red-600', bgColor: 'bg-red-500', width: 100 },
};

export default function LiquidationsPage() {
  const [cascadeState, setCascadeState] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setError(null);
      
      const [cascadeRes, historyRes] = await Promise.all([
        api.get(`/api/v10/exchange/liquidation-cascade/${selectedSymbol}`),
        api.get(`/api/v10/exchange/liquidation-cascade/history/${selectedSymbol}?limit=10`),
      ]);
      
      if (cascadeRes.data?.ok) {
        setCascadeState(cascadeRes.data.data);
      }
      
      if (historyRes.data?.ok) {
        setHistory(historyRes.data.data || []);
      }
    } catch (err) {
      console.error('Cascade fetch error:', err);
      setError('Failed to fetch cascade data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // More frequent for cascades
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const isActive = cascadeState?.active || false;
  const phase = cascadeState?.phase;
  const phaseConfig = phase ? PHASE_CONFIG[phase] : null;
  const intensity = cascadeState?.intensity || 'LOW';
  const intensityConfig = INTENSITY_CONFIG[intensity];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="liquidations-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Liquidation Cascades</h1>
          <p className="text-sm text-gray-500 mt-1">
            Market breakdown detection • S10.4
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

      {/* Main Status Card */}
      <Card 
        className={`border-l-4 ${isActive ? 'border-red-500' : 'border-gray-300'}`}
        data-testid="cascade-status-card"
      >
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-xl ${isActive ? 'bg-red-500 bg-opacity-20' : 'bg-gray-500 bg-opacity-20'}`}>
                {isActive ? (
                  <Flame className="w-10 h-10 text-red-500 animate-pulse" />
                ) : (
                  <Shield className="w-10 h-10 text-gray-400" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Cascade Status</p>
                <h2 className={`text-3xl font-bold ${isActive ? 'text-red-600' : 'text-gray-600'}`}>
                  {isActive ? 'ACTIVE' : 'NONE'}
                </h2>
                {isActive && cascadeState?.direction && (
                  <div className="flex items-center gap-2 mt-2">
                    {cascadeState.direction === 'LONG' ? (
                      <>
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-600 font-medium">Long Wipe</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600 font-medium">Short Wipe</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Phase & Confidence */}
            <div className="text-right">
              {phaseConfig && (
                <Badge className={`${phaseConfig.color} text-white mb-2`}>
                  {phaseConfig.label}
                </Badge>
              )}
              <div className="text-sm text-gray-500">Confidence</div>
              <div className="text-2xl font-bold text-gray-900">
                {((cascadeState?.confidence || 0) * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Intensity Meter */}
        <Card data-testid="intensity-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Intensity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-lg font-bold ${intensityConfig.color}`}>
                {intensityConfig.label}
              </span>
              <span className="text-sm text-gray-500">
                {((cascadeState?.intensityScore || 0) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${intensityConfig.bgColor} transition-all duration-500`}
                style={{ width: `${intensityConfig.width}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Liquidation Volume */}
        <Card data-testid="volume-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Flame className="w-4 h-4" />
              Liquidation Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ${((cascadeState?.liquidationVolumeUsd || 0) / 1000).toFixed(1)}K
            </div>
            <p className="text-xs text-gray-400 mt-1">In detection window</p>
          </CardContent>
        </Card>

        {/* OI Impact */}
        <Card data-testid="oi-impact-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              OI Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              (cascadeState?.oiDeltaPct || 0) < 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {(cascadeState?.oiDeltaPct || 0) > 0 ? '+' : ''}{(cascadeState?.oiDeltaPct || 0).toFixed(2)}%
            </div>
            <p className="text-xs text-gray-400 mt-1">Open interest change</p>
          </CardContent>
        </Card>

        {/* Price Impact */}
        <Card data-testid="price-impact-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Price Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              (cascadeState?.priceDeltaPct || 0) > 0 ? 'text-green-600' : 
              (cascadeState?.priceDeltaPct || 0) < 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {(cascadeState?.priceDeltaPct || 0) > 0 ? '+' : ''}{(cascadeState?.priceDeltaPct || 0).toFixed(2)}%
            </div>
            <p className="text-xs text-gray-400 mt-1">Price movement</p>
          </CardContent>
        </Card>
      </div>

      {/* Drivers & Context */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Drivers */}
        <Card data-testid="drivers-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChevronRight className="w-5 h-5 text-gray-400" />
              Key Drivers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(cascadeState?.drivers?.length > 0 ? cascadeState.drivers : ['No cascade detected']).map((driver, i) => (
                <div 
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    isActive ? 'bg-red-50' : 'bg-gray-50'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-red-500' : 'bg-gray-400'}`} />
                  <span className="text-sm text-gray-700">{driver}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Context */}
        <Card data-testid="context-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-gray-400" />
              Context
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-500">Market Regime</span>
                <Badge variant="outline">{cascadeState?.regimeContext || 'NEUTRAL'}</Badge>
              </div>
              
              {cascadeState?.durationSec > 0 && (
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-500">Duration</span>
                  <span className="text-sm font-medium">{cascadeState.durationSec}s</span>
                </div>
              )}
              
              {cascadeState?.startedAt && (
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-500">Started At</span>
                  <span className="text-sm font-medium">
                    {new Date(cascadeState.startedAt).toLocaleTimeString()}
                  </span>
                </div>
              )}

              {/* Regime eligibility note */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600">
                  Cascades only detected in EXPANSION, LONG_SQUEEZE, or SHORT_SQUEEZE regimes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cascade History */}
      <Card data-testid="history-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            Cascade History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <div className="space-y-3">
              {history.map((entry, i) => (
                <div 
                  key={i}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      entry.direction === 'LONG' ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      {entry.direction === 'LONG' ? (
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      ) : (
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {entry.direction} Cascade
                      </p>
                      <p className="text-xs text-gray-500">
                        Peak: {entry.peakIntensity} • Duration: {entry.durationSec}s
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      ${(entry.totalVolumeUsd / 1000).toFixed(1)}K
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(entry.startedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Flame className="w-8 h-8 mx-auto mb-2 text-gray-700" />
              <p>No cascade history</p>
              <p className="text-xs mt-1">Cascades will appear here when detected</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last Update */}
      <div className="text-xs text-gray-400 text-right">
        Last update: {cascadeState?.timestamp ? new Date(cascadeState.timestamp).toLocaleTimeString() : 'Never'}
      </div>
    </div>
  );
}
