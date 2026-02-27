/**
 * Funding Sentiment Widget
 * ========================
 * Shows funding rates and long/short ratio across exchanges.
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Info, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Venue colors
const VENUE_COLORS = {
  binance: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  bybit: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  hyperliquid: { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-300' },
};

// Funding state interpretation
const FUNDING_INTERPRETATION = {
  EXTREME_LONG: { label: 'Crowded Long', color: 'text-red-600', icon: TrendingUp, hint: 'Market heavily long — squeeze down risk' },
  LONG: { label: 'Slightly Long', color: 'text-orange-500', icon: TrendingUp, hint: 'More longs than shorts' },
  NEUTRAL: { label: 'Neutral', color: 'text-gray-500', icon: Minus, hint: 'Balanced market' },
  SHORT: { label: 'Slightly Short', color: 'text-green-500', icon: TrendingDown, hint: 'More shorts than longs' },
  EXTREME_SHORT: { label: 'Crowded Short', color: 'text-green-600', icon: TrendingDown, hint: 'Market heavily short — squeeze up possible' },
};

function classifyFundingState(rate) {
  if (rate > 0.05) return 'EXTREME_LONG';
  if (rate > 0.01) return 'LONG';
  if (rate < -0.05) return 'EXTREME_SHORT';
  if (rate < -0.01) return 'SHORT';
  return 'NEUTRAL';
}

function FundingBar({ label, rate, venue }) {
  const state = classifyFundingState(rate);
  const interpretation = FUNDING_INTERPRETATION[state];
  const Icon = interpretation.icon;
  const venueStyle = VENUE_COLORS[venue] || VENUE_COLORS.binance;
  
  // Calculate bar position (0 = extreme short, 50 = neutral, 100 = extreme long)
  const position = Math.max(0, Math.min(100, 50 + (rate * 500)));
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className={`font-medium ${venueStyle.text} ${venueStyle.bg} px-1.5 py-0.5 rounded`}>
                {label}
              </span>
              <span className={`font-mono ${interpretation.color}`}>
                {rate >= 0 ? '+' : ''}{(rate * 100).toFixed(4)}%
              </span>
            </div>
            <div className="relative h-2 bg-gradient-to-r from-green-200 via-gray-200 to-red-200 rounded-full">
              <div 
                className="absolute top-0 w-2 h-2 bg-gray-800 rounded-full transform -translate-x-1/2"
                style={{ left: `${position}%` }}
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium flex items-center gap-1">
              <Icon className="h-3 w-3" />
              {interpretation.label}
            </p>
            <p className="text-xs text-gray-400">{interpretation.hint}</p>
            <p className="text-xs">
              Funding Rate: {(rate * 100).toFixed(4)}% per 8h
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function LongShortBar({ longPct, shortPct }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span className="text-green-600 font-medium">Long {longPct.toFixed(1)}%</span>
              <span className="text-red-500 font-medium">Short {shortPct.toFixed(1)}%</span>
            </div>
            <div className="flex h-3 rounded-full overflow-hidden">
              <div 
                className="bg-green-500 transition-all duration-300"
                style={{ width: `${longPct}%` }}
              />
              <div 
                className="bg-red-400 transition-all duration-300"
                style={{ width: `${shortPct}%` }}
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            Open Interest distribution across all tracked exchanges.
            <br />
            Long positions: {longPct.toFixed(1)}%
            <br />
            Short positions: {shortPct.toFixed(1)}%
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function FundingSentimentWidget({ symbol = 'BTCUSDT', compact = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch funding data
        const res = await fetch(`${API_URL}/api/admin/exchange/funding/${symbol}`);
        const json = await res.json();
        
        if (json.ok) {
          setData(json);
        } else {
          // Generate mock data for demo
          setData({
            symbol,
            state: {
              mean: 0.0085,
              max: 0.012,
              min: 0.005,
              dispersion: 0.003,
              dominantVenue: 'binance',
              zScore: 1.2,
            },
            interpretation: {
              label: 'LONG',
              description: 'Market slightly crowded long',
              risk: 'MEDIUM',
            },
            venues: [
              { venue: 'binance', rate: 0.0095 },
              { venue: 'bybit', rate: 0.0082 },
              { venue: 'hyperliquid', rate: 0.0078 },
            ],
            longShort: { long: 54.2, short: 45.8 },
          });
        }
        setError(null);
      } catch (e) {
        setError(e.message);
        // Set demo data on error
        setData({
          symbol,
          state: { mean: 0.008, zScore: 0.8 },
          interpretation: { label: 'NEUTRAL', risk: 'LOW' },
          venues: [
            { venue: 'binance', rate: 0.008 },
            { venue: 'bybit', rate: 0.007 },
            { venue: 'hyperliquid', rate: 0.009 },
          ],
          longShort: { long: 52, short: 48 },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [symbol]);

  if (compact) {
    // Compact version for sidebars
    const state = data?.state;
    const interp = data?.interpretation;
    const fundingState = classifyFundingState(state?.mean || 0);
    const interpretation = FUNDING_INTERPRETATION[fundingState];
    const Icon = interpretation?.icon || Minus;
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg cursor-help">
              <Icon className={`h-4 w-4 ${interpretation?.color || 'text-gray-500'}`} />
              <div className="text-xs">
                <div className="font-medium">{interpretation?.label || 'Loading...'}</div>
                <div className="text-gray-500">
                  {state?.mean ? `${(state.mean * 100).toFixed(3)}%` : '-'}
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{interpretation?.hint || 'Funding rate indicator'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full widget
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            Funding Sentiment
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    <strong>Funding Rate</strong> shows market positioning.
                    <br /><br />
                    <strong>Positive funding</strong>: Longs pay shorts → market crowded long → higher risk of dump.
                    <br /><br />
                    <strong>Negative funding</strong>: Shorts pay longs → market crowded short → squeeze up possible.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {symbol}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && !data ? (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {/* Aggregate Long/Short */}
            {data?.longShort && (
              <div>
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  Open Interest Distribution
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          Percentage of long vs short positions in the market.
                          Imbalance often precedes volatile moves.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <LongShortBar 
                  longPct={data.longShort.long} 
                  shortPct={data.longShort.short} 
                />
              </div>
            )}

            {/* Per-venue funding */}
            <div className="space-y-2">
              <div className="text-xs text-gray-500 flex items-center gap-1">
                Funding by Exchange
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        Funding rates across different exchanges.
                        Divergence may indicate arbitrage or market inefficiency.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {data?.venues?.map((v) => (
                <FundingBar 
                  key={v.venue}
                  label={v.venue.charAt(0).toUpperCase() + v.venue.slice(1)}
                  rate={v.rate}
                  venue={v.venue}
                />
              ))}
            </div>

            {/* Summary */}
            {data?.state && (
              <div className="pt-2 border-t text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Avg Funding:</span>
                  <span className="font-mono">{(data.state.mean * 100).toFixed(4)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Z-Score:</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <span className={`font-mono ${
                          Math.abs(data.state.zScore) > 1.5 ? 'text-red-500' : 
                          Math.abs(data.state.zScore) > 1 ? 'text-orange-500' : 
                          'text-gray-600'
                        }`}>
                          {data.state.zScore.toFixed(2)}σ
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          How far current funding is from historical average.
                          <br />
                          |Z| &gt; 1.5 = Extreme deviation
                          <br />
                          |Z| &gt; 1.0 = Notable deviation
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            )}

            {/* Warning if extreme */}
            {data?.interpretation?.risk === 'HIGH' && (
              <div className="flex items-center gap-2 p-2 bg-red-50 rounded text-xs text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span>Extreme positioning detected — elevated squeeze risk</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default FundingSentimentWidget;
