/**
 * S10.W — Whale State Page
 * 
 * Shows raw whale indicators and market state.
 * 
 * NO SIGNALS, NO PREDICTIONS — only measurements.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Activity, TrendingUp, TrendingDown, Clock, RefreshCw, Users, DollarSign, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Indicator metadata
const INDICATOR_META = {
  large_position_presence: {
    name: 'Large Position Presence',
    description: 'Presence of oversized positions vs market baseline',
    range: '[0, 1]',
    interpretation: {
      low: 'No significant whale presence',
      medium: 'Moderate whale activity',
      high: 'Large positions dominating',
    },
  },
  whale_side_bias: {
    name: 'Whale Side Bias',
    description: 'Direction skew of large positions (long vs short)',
    range: '[-1, +1]',
    interpretation: {
      low: 'Whales are net SHORT',
      neutral: 'Balanced positioning',
      high: 'Whales are net LONG',
    },
  },
  position_crowding_against_whales: {
    name: 'Position Crowding Against Whales',
    description: 'How much retail is positioned against whale direction',
    range: '[-1, +1]',
    interpretation: {
      low: 'Retail following whales',
      neutral: 'Neutral crowding',
      high: 'Retail pushing against whales',
    },
  },
  stop_hunt_probability: {
    name: 'Stop-Hunt Probability',
    description: 'Risk that market will hunt whale stops',
    range: '[0, 1]',
    interpretation: {
      low: 'Low stop-hunt risk',
      medium: 'Moderate risk',
      high: 'High stop-hunt risk',
    },
  },
  large_position_survival_time: {
    name: 'Large Position Survival Time',
    description: 'How long whale positions survive (stability)',
    range: '[-1, +1]',
    interpretation: {
      low: 'Position likely to be liquidated soon',
      neutral: 'Average survival',
      high: 'Position is stable',
    },
  },
  contrarian_pressure_index: {
    name: 'Contrarian Pressure Index',
    description: 'Ideal conditions for whale squeeze (synthesis)',
    range: '[0, 1]',
    interpretation: {
      low: 'Market is calm for whales',
      medium: 'Moderate pressure',
      high: 'Ideal conditions for whale liquidation',
    },
  },
};

export default function WhaleStatePage() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [exchange, setExchange] = useState('hyperliquid');
  const [state, setState] = useState(null);
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [stateRes, healthRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/v10/exchange/whales/state/${symbol}?exchange=${exchange}`).then(r => r.json()),
        fetch(`${API_URL}/api/v10/exchange/whales/health`).then(r => r.json()),
        fetch(`${API_URL}/api/v10/exchange/whales/stats`).then(r => r.json()),
      ]);

      setState(stateRes);
      setHealth(healthRes);
      setStats(statsRes);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [symbol, exchange]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const getTimeSince = (date) => {
    if (!date) return 'Never';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const formatNumber = (num) => {
    if (!num) return '$0';
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num.toFixed(0)}`;
  };

  const getIndicatorColor = (value, key) => {
    const isBipolar = key.includes('bias') || key.includes('crowding') || key.includes('survival');
    if (isBipolar) {
      if (Math.abs(value) > 0.6) return 'text-red-600';
      if (Math.abs(value) < 0.3) return 'text-green-600';
      return 'text-yellow-600';
    }
    if (value > 0.6) return 'text-red-600';
    if (value < 0.3) return 'text-green-600';
    return 'text-yellow-600';
  };

  const getInterpretation = (value, meta) => {
    const isBipolar = meta.range.includes('-1');
    if (isBipolar) {
      if (value > 0.3) return meta.interpretation.high;
      if (value < -0.3) return meta.interpretation.low;
      return meta.interpretation.neutral || meta.interpretation.medium;
    }
    if (value > 0.6) return meta.interpretation.high;
    if (value < 0.3) return meta.interpretation.low;
    return meta.interpretation.medium || meta.interpretation.neutral;
  };

  return (
    <div className="p-6 space-y-6" data-testid="whale-state-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">🐋</span>
            Whale State
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Large position indicators • S10.W
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
            data-testid="symbol-selector"
          >
            {symbols.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={exchange}
            onChange={(e) => setExchange(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
            data-testid="exchange-selector"
          >
            <option value="hyperliquid">Hyperliquid</option>
            <option value="binance">Binance</option>
            <option value="bybit">Bybit</option>
          </select>

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

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          Error: {error}
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Activity className="w-4 h-4" />
              Snapshots
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats?.snapshotCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Users className="w-4 h-4" />
              Events
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats?.eventCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <DollarSign className="w-4 h-4" />
              States
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats?.stateCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              Provider Health
            </div>
            <div className={`text-2xl font-bold ${
              health?.aggregatedStatus === 'UP' ? 'text-green-600' :
              health?.aggregatedStatus === 'DEGRADED' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {health?.aggregatedStatus || 'DOWN'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left: Market State */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Whale Market State
            </CardTitle>
          </CardHeader>
          <CardContent>
            {state?.state ? (
              <div className="space-y-6">
                {/* Long vs Short */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 text-green-600 text-sm mb-1">
                      <TrendingUp className="w-4 h-4" />
                      Total LONG
                    </div>
                    <div className="text-2xl font-bold text-green-700">
                      {formatNumber(state.state.totalLongUsd)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {state.state.whaleLongCount || 0} positions
                    </div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 text-red-600 text-sm mb-1">
                      <TrendingDown className="w-4 h-4" />
                      Total SHORT
                    </div>
                    <div className="text-2xl font-bold text-red-700">
                      {formatNumber(state.state.totalShortUsd)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {state.state.whaleShortCount || 0} positions
                    </div>
                  </div>
                </div>

                {/* Net Bias Bar */}
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Net Bias</span>
                    <span className={state.state.netBias > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {(state.state.netBias * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-red-500 h-full transition-all"
                      style={{ width: `${(1 - state.state.netBias) / 2 * 100}%` }}
                    />
                    <div 
                      className="bg-green-500 h-full transition-all"
                      style={{ width: `${(1 + state.state.netBias) / 2 * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>SHORT</span>
                    <span>LONG</span>
                  </div>
                </div>

                {/* Other Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Max Position</div>
                    <div className="text-xl font-bold text-gray-900">{formatNumber(state.state.maxSinglePositionUsd)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Median Position</div>
                    <div className="text-xl font-bold text-gray-900">{formatNumber(state.state.medianPositionUsd)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Concentration</div>
                    <div className="text-xl font-bold text-gray-900">{(state.state.concentrationIndex * 100).toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Crowding Risk</div>
                    <div className="text-xl font-bold text-gray-900">{(state.state.crowdingRisk * 100).toFixed(0)}%</div>
                  </div>
                </div>

                {/* Meta */}
                <div className="pt-4 border-t text-xs text-gray-400">
                  Source: {state.state.source} | Confidence: {(state.state.confidence * 100).toFixed(0)}%
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">No whale state data available</div>
            )}
          </CardContent>
        </Card>

        {/* Right: Indicators */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              Whale Indicators (6)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {state?.indicators ? (
              <div className="space-y-4">
                {Object.entries(state.indicators).map(([key, value]) => {
                  const meta = INDICATOR_META[key];
                  if (!meta) return null;
                  
                  const isBipolar = meta.range.includes('-1');
                  const barWidth = isBipolar ? Math.abs(value) * 50 : value * 100;
                  const isNegative = value < 0;
                  
                  return (
                    <div key={key} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium text-sm text-gray-900">{meta.name}</div>
                          <div className="text-xs text-gray-500">{meta.description}</div>
                        </div>
                        <div className={`text-lg font-bold font-mono ${getIndicatorColor(value, key)}`}>
                          {(value * 100).toFixed(0)}%
                        </div>
                      </div>
                      
                      {/* Bar */}
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden relative mb-2">
                        {isBipolar ? (
                          <>
                            <div className="absolute left-1/2 w-0.5 h-full bg-gray-300" />
                            <div 
                              className={`absolute h-full transition-all ${isNegative ? 'bg-red-500 right-1/2' : 'bg-green-500 left-1/2'}`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </>
                        ) : (
                          <div 
                            className={`h-full transition-all ${
                              value > 0.6 ? 'bg-red-500' : 
                              value < 0.3 ? 'bg-green-500' : 'bg-yellow-500'
                            }`}
                            style={{ width: `${barWidth}%` }}
                          />
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-600">
                        {getInterpretation(value, meta)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">No indicator data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer Disclaimer */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
        <p className="text-xs text-gray-500">
          Whale indicators are measurements of market structure. They are not trading signals and do not predict price direction.
        </p>
      </div>
    </div>
  );
}
