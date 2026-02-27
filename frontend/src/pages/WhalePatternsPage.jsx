/**
 * S10.W — Whale Patterns Page
 * 
 * Shows active whale patterns and their risk drivers.
 * 
 * NO SIGNALS, NO PREDICTIONS — only risk structure visualization.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Activity, TrendingUp, TrendingDown, Clock, RefreshCw, Minus, Shield, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Risk bucket colors (light theme)
const RISK_COLORS = {
  LOW: 'bg-green-100 text-green-700 border-green-300',
  MID: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  HIGH: 'bg-red-100 text-red-700 border-red-300',
};

// Risk bucket tooltips
const RISK_TOOLTIPS = {
  LOW: 'Low risk - whale positions are not overextended',
  MID: 'Medium risk - some signs of position stress',
  HIGH: 'High risk - potential for forced liquidations or squeezes',
};

// Health status colors
const HEALTH_COLORS = {
  UP: 'text-green-600',
  DEGRADED: 'text-yellow-600',
  DOWN: 'text-red-600',
};

// Health status tooltips
const HEALTH_TOOLTIPS = {
  UP: 'Data feed is working normally',
  DEGRADED: 'Some data sources are slow or missing',
  DOWN: 'Data feed is not available',
};

// Pattern descriptions with detailed tooltips
const PATTERN_DESCRIPTIONS = {
  WHALE_TRAP_RISK: {
    short: 'Large player is open, market shows signs of going against them',
    long: 'A whale has a significant position that may be at risk. If the market moves against them, they may be forced to close at a loss, accelerating the move.'
  },
  FORCED_SQUEEZE_RISK: {
    short: 'Market is overloaded with positions, any move triggers cascade',
    long: 'Open interest is very high relative to liquidity. A small price move could trigger a cascade of liquidations in one direction (squeeze).'
  },
  BAIT_AND_FLIP: {
    short: 'Whale opened → market went against → whale flipped/closed → move accelerated',
    long: 'Classic whale trap pattern: large player opens a position, retail follows, whale closes or flips, leaving retail trapped.'
  },
};

export default function WhalePatternsPage() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [health, setHealth] = useState(null);
  const [patterns, setPatterns] = useState(null);
  const [whaleState, setWhaleState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [selectedPattern, setSelectedPattern] = useState(null);

  const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [healthRes, patternsRes, stateRes] = await Promise.all([
        fetch(`${API_URL}/api/v10/exchange/whales/health`).then(r => r.json()),
        fetch(`${API_URL}/api/v10/exchange/whales/patterns/${symbol}`).then(r => r.json()),
        fetch(`${API_URL}/api/v10/exchange/whales/state/${symbol}?exchange=hyperliquid`).then(r => r.json()),
      ]);

      setHealth(healthRes);
      setPatterns(patternsRes.ok ? patternsRes.snapshot : null);
      setWhaleState(stateRes);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

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
    if (!num) return '0';
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num.toFixed(0)}`;
  };

  return (
    <div className="p-6 space-y-6" data-testid="whale-patterns-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">🐋</span>
            Whale Patterns
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Large position risk structure • S10.W
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

          {/* Provider Health */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Hyperliquid:</span>
            <span className={`font-medium ${HEALTH_COLORS[health?.aggregatedStatus || 'DOWN']}`}>
              {health?.aggregatedStatus || 'DOWN'}
            </span>
          </div>

          <div className="text-sm text-gray-400">
            {health?.totalPositionsTracked || 0} positions tracked
          </div>

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

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          Error: {error}
        </div>
      )}

      {/* Active Whale Risk Banner */}
      {patterns && patterns.hasHighRisk && (
        <div className={`p-4 rounded-lg border ${RISK_COLORS.HIGH}`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <div className="font-bold text-lg">HIGH WHALE RISK DETECTED</div>
              <div className="text-sm opacity-80">
                Pattern: {patterns.highestRisk?.patternId} | 
                Stability: {patterns.patterns.find(p => p.patternId === patterns.highestRisk?.patternId)?.stabilityTicks || 0} ticks
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column: Active Patterns */}
        <div className="col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">Active Patterns</h2>
          
          {patterns?.patterns?.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                No whale patterns detected for {symbol}
              </CardContent>
            </Card>
          )}

          {patterns?.patterns?.map((pattern) => (
            <Card
              key={pattern.patternId}
              className={`cursor-pointer transition-all ${
                selectedPattern?.patternId === pattern.patternId
                  ? 'ring-2 ring-blue-500'
                  : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedPattern(pattern)}
            >
              <CardContent className="py-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900">{pattern.name}</span>
                      {pattern.active && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-300">
                          ACTIVE
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {PATTERN_DESCRIPTIONS[pattern.patternId]}
                    </div>
                  </div>
                  
                  <div className={`px-3 py-1 rounded-lg border ${RISK_COLORS[pattern.riskLevel]}`}>
                    <div className="text-xs font-medium">Risk</div>
                    <div className="text-lg font-bold">{pattern.riskLevel}</div>
                  </div>
                </div>

                {/* Risk Score Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Risk Score</span>
                    <span>{(pattern.riskScore * 100).toFixed(0)}%</span>
                  </div>
                  <Progress 
                    value={pattern.riskScore * 100} 
                    className={`h-2 ${
                      pattern.riskLevel === 'HIGH' ? '[&>div]:bg-red-500' :
                      pattern.riskLevel === 'MID' ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'
                    }`}
                  />
                </div>

                {/* Pattern Info */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Whale Side</div>
                    <div className="flex items-center gap-1 font-medium text-gray-900">
                      {pattern.dominantWhaleSide === 'LONG' ? (
                        <><TrendingUp className="w-4 h-4 text-green-600" /> LONG</>
                      ) : pattern.dominantWhaleSide === 'SHORT' ? (
                        <><TrendingDown className="w-4 h-4 text-red-600" /> SHORT</>
                      ) : (
                        <><Minus className="w-4 h-4 text-gray-400" /> BALANCED</>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Stability</div>
                    <div className="font-medium text-gray-900">{pattern.stabilityTicks} ticks</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Squeeze Side</div>
                    <div className="font-medium text-gray-900">{pattern.squeezeSide || 'N/A'}</div>
                  </div>
                </div>

                {/* Drivers */}
                {pattern.reasons?.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-xs text-gray-500 mb-2">Drivers</div>
                    <div className="space-y-1">
                      {pattern.reasons.map((reason, i) => (
                        <div key={i} className="text-sm text-gray-600 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                          {reason}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Right Column: Whale State & Indicators */}
        <div className="space-y-4">
          {/* Whale State Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Whale Market State
              </CardTitle>
            </CardHeader>
            <CardContent>
              {whaleState?.state ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-500">Total Long</div>
                      <div className="text-lg font-bold text-green-600">
                        {formatNumber(whaleState.state.totalLongUsd)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Total Short</div>
                      <div className="text-lg font-bold text-red-600">
                        {formatNumber(whaleState.state.totalShortUsd)}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Net Bias</div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-red-500 h-full"
                        style={{ width: `${(1 - whaleState.state.netBias) / 2 * 100}%` }}
                      />
                      <div 
                        className="bg-green-500 h-full"
                        style={{ width: `${(1 + whaleState.state.netBias) / 2 * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>SHORT</span>
                      <span>{(whaleState.state.netBias * 100).toFixed(0)}%</span>
                      <span>LONG</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-gray-500">Concentration</div>
                      <div className="font-medium text-gray-900">{(whaleState.state.concentrationIndex * 100).toFixed(0)}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Crowding Risk</div>
                      <div className="font-medium text-gray-900">{(whaleState.state.crowdingRisk * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">No whale state data</div>
              )}
            </CardContent>
          </Card>

          {/* Whale Indicators */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Whale Indicators
              </CardTitle>
            </CardHeader>
            <CardContent>
              {whaleState?.indicators ? (
                <div className="space-y-3">
                  {Object.entries(whaleState.indicators).map(([key, value]) => {
                    const isBipolar = key === 'whale_side_bias' || key === 'position_crowding_against_whales' || key === 'large_position_survival_time';
                    const barWidth = isBipolar ? Math.abs(value) * 50 : value * 100;
                    const isNegative = isBipolar && value < 0;
                    
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">{key.replace(/_/g, ' ')}</span>
                          <span className={`font-mono font-medium ${
                            Math.abs(value) > 0.6 ? 'text-red-600' : 
                            Math.abs(value) < 0.3 ? 'text-green-600' : 'text-yellow-600'
                          }`}>
                            {(value * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden relative">
                          {isBipolar ? (
                            <>
                              <div className="absolute left-1/2 w-0.5 h-full bg-gray-300" />
                              <div 
                                className={`absolute h-full ${isNegative ? 'bg-red-500 right-1/2' : 'bg-green-500 left-1/2'}`}
                                style={{ width: `${barWidth}%` }}
                              />
                            </>
                          ) : (
                            <div 
                              className={`h-full ${
                                value > 0.6 ? 'bg-red-500' : 
                                value < 0.3 ? 'bg-green-500' : 'bg-yellow-500'
                              }`}
                              style={{ width: `${barWidth}%` }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-gray-500 text-sm">No indicator data</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
        <p className="text-xs text-gray-500">
          Whale patterns describe market structure risk. They are not trading signals and do not predict price direction.
        </p>
      </div>
    </div>
  );
}
