/**
 * Alt Movers Page (Block 2.14)
 * ============================
 * "Lagging assets in winning clusters"
 * 
 * Light theme, spacious layout, explanatory UI.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, TrendingUp, AlertTriangle, Zap, Info, Clock, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Presets with descriptions
const PRESETS = {
  conservative: { 
    label: 'Conservative', 
    winnersThreshold: 0.08, 
    lagThreshold: 0.01, 
    minMomentum: 0.30,
    hint: 'High confidence, fewer signals. Requires 30%+ cluster momentum and 8%+ moves.'
  },
  momentum: { 
    label: 'Momentum', 
    winnersThreshold: 0.06, 
    lagThreshold: 0.02, 
    minMomentum: 0.20,
    hint: 'Balanced approach. Standard settings for most market conditions.'
  },
  early: { 
    label: 'Early', 
    winnersThreshold: 0.05, 
    lagThreshold: 0.00, 
    minMomentum: 0.15,
    hint: 'Early signals, higher risk. Catches moves before full confirmation.'
  },
};

// Cluster momentum chip with tooltip
function ClusterChip({ clusterId, momentum, size, winners }) {
  const color = momentum >= 0.35 ? 'bg-green-100 text-green-800' :
                momentum >= 0.20 ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-600';
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color} cursor-help`}>
            C#{clusterId} {(momentum * 100).toFixed(0)}%
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <p className="font-medium">Cluster #{clusterId}</p>
            <p>Momentum: {(momentum * 100).toFixed(1)}% of assets moved up</p>
            {size && <p>Size: {size} assets</p>}
            {winners && <p>Winners: {winners} assets already moved</p>}
            <p className="text-gray-400 pt-1">
              Higher momentum = stronger rotation pattern
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Score bar component with tooltip
function ScoreBar({ score }) {
  const color = score >= 0.7 ? 'bg-green-500' :
                score >= 0.5 ? 'bg-yellow-500' :
                'bg-red-400';
  
  const interpretation = score >= 0.7 ? 'High probability candidate' :
                         score >= 0.5 ? 'Moderate potential' :
                         'Low probability';
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-help">
            <div className="w-24 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${color}`} 
                style={{ width: `${score * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-700">{score.toFixed(2)}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <p className="font-medium">{interpretation}</p>
            <p>Combined score: {(score * 100).toFixed(1)}%</p>
            <p className="text-gray-400">
              Score = 45% cluster momentum + 30% centroid closeness + 15% lag factor + 10% liquidity
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Candidate card component with detailed tooltips
function CandidateCard({ candidate }) {
  const { base, symbolKey, score, clusterId, momentum, ret, distance, reasons } = candidate;
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{base}</h3>
            <p className="text-xs text-gray-500">{symbolKey}</p>
          </div>
          <ClusterChip clusterId={clusterId} momentum={momentum} />
        </div>
        
        <div className="space-y-2 mb-3">
          <div className="flex justify-between items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-sm text-gray-600 cursor-help flex items-center gap-1">
                    Score <Info className="h-3 w-3" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">
                    Combined probability score based on cluster momentum, 
                    pattern similarity, and market conditions.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <ScoreBar score={score} />
          </div>
          
          <div className="flex justify-between items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-sm text-gray-600 cursor-help flex items-center gap-1">
                    Lagging <Info className="h-3 w-3" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">
                    How much this asset has moved vs cluster winners.
                    Lower = more potential upside if pattern plays out.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className={`text-sm font-medium ${ret >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {ret >= 0 ? '+' : ''}{(ret * 100).toFixed(1)}%
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-sm text-gray-600 cursor-help flex items-center gap-1">
                    Distance <Info className="h-3 w-3" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">
                    Cosine distance to cluster centroid.
                    Lower = more similar to winning pattern.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="text-sm text-gray-700">{distance.toFixed(3)}</span>
          </div>
        </div>
        
        <div className="border-t pt-2">
          <p className="text-xs text-gray-500 mb-1">Reasons:</p>
          <ul className="space-y-0.5">
            {reasons.map((r, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-center gap-1">
                <span className="w-1 h-1 bg-gray-400 rounded-full" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AltMoversPage() {
  // Controls state
  const [venue, setVenue] = useState('hyperliquid');
  const [marketType, setMarketType] = useState('perp');
  const [tf, setTf] = useState('5m');
  const [horizon, setHorizon] = useState('4h');
  const [preset, setPreset] = useState('momentum');
  
  // Data state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  
  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        venue,
        marketType,
        tf,
        horizon,
        preset,
        outLimit: '30',
      });
      const res = await fetch(`${API_URL}/api/market/alt-movers?${params}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Failed to fetch');
      setData(json);
    } catch (e) {
      setError(e.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [venue, marketType, tf, horizon, preset]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const hasData = data?.candidates?.length > 0;
  const hotClusters = data?.hotClusters || [];
  const candidates = data?.candidates || [];
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Alt Movers</h1>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <p className="text-gray-600">
            Lagging assets in winning clusters — potential rotation candidates
          </p>
        </div>
        
        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm text-gray-600 cursor-help">Exchange:</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Source exchange for market data</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Select value={venue} onValueChange={setVenue}>
                  <SelectTrigger className="w-32" data-testid="venue-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="binance">Binance</SelectItem>
                    <SelectItem value="bybit">Bybit</SelectItem>
                    <SelectItem value="hyperliquid">HyperLiquid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm text-gray-600 cursor-help">Market:</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Perpetual futures have funding rates, spot does not</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Select value={marketType} onValueChange={setMarketType}>
                  <SelectTrigger className="w-24" data-testid="market-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="perp">Perp</SelectItem>
                    <SelectItem value="spot">Spot</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm text-gray-600 cursor-help">TF:</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Timeframe for snapshot data. 5m = more granular, 1h = smoother</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Select value={tf} onValueChange={setTf}>
                  <SelectTrigger className="w-20" data-testid="tf-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5m">5m</SelectItem>
                    <SelectItem value="15m">15m</SelectItem>
                    <SelectItem value="1h">1h</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm text-gray-600 cursor-help">Horizon:</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Look-back period for returns. 4h = short-term rotations, 24h = daily moves</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Select value={horizon} onValueChange={setHorizon}>
                  <SelectTrigger className="w-20" data-testid="horizon-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">1h</SelectItem>
                    <SelectItem value="4h">4h</SelectItem>
                    <SelectItem value="24h">24h</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm text-gray-600 cursor-help">Preset:</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{PRESETS[preset]?.hint || 'Select detection sensitivity'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Select value={preset} onValueChange={setPreset}>
                  <SelectTrigger className="w-32" data-testid="preset-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRESETS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Error state */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </CardContent>
          </Card>
        )}
        
        {/* Loading state */}
        {loading && !data && (
          <Card className="mb-6">
            <CardContent className="p-8 text-center">
              <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-3" />
              <p className="text-gray-600">Loading movers data...</p>
            </CardContent>
          </Card>
        )}
        
        {/* Empty state */}
        {!loading && !error && !hasData && (
          <Card className="mb-6">
            <CardContent className="p-8 text-center">
              <Info className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No hot clusters detected</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Market is fragmented. No dominant patterns with enough momentum were found.
                Try different parameters or wait for market conditions to change.
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* Cluster Momentum Summary */}
        {hasData && hotClusters.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                Hot Clusters
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex flex-wrap gap-2">
                {hotClusters.map((c) => (
                  <TooltipProvider key={c.clusterId}>
                    <Tooltip>
                      <TooltipTrigger>
                        <ClusterChip clusterId={c.clusterId} momentum={c.momentum} />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Size: {c.size} | Winners: {c.winners}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Candidates Grid */}
        {hasData && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Candidates ({candidates.length})
              </h2>
              {data?.ts && (
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {new Date(data.ts).toLocaleTimeString()}
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="candidates-grid">
              {candidates.map((c, i) => (
                <CandidateCard key={`${c.symbolKey}-${i}`} candidate={c} />
              ))}
            </div>
          </div>
        )}
        
        {/* Info footer */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-gray-500 mt-0.5" />
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">How it works</p>
              <p>
                Alt Movers identifies clusters of assets with similar market patterns.
                When a cluster shows strong momentum (many assets moving up), we find
                assets in the same cluster that haven't moved yet — potential rotation candidates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
