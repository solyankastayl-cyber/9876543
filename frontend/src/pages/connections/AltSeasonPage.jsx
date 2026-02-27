/**
 * Alt Season & Opportunities Page - Light Theme
 * БЛОК 7-10: Opportunity ranking, market state, alt season detection
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  RefreshCw, 
  Loader2,
  ArrowUp,
  ArrowDown,
  Minus,
  ArrowLeft
} from 'lucide-react';
import { 
  IconAltSeason, 
  IconSpikePump, 
  IconNetwork, 
  IconCluster,
  IconWarning,
  IconTrophy 
} from '../../components/icons/FomoIcons';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// Info Tooltip Component
const InfoTooltip = ({ text, children }) => {
  const [show, setShow] = useState(false);
  
  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

const PHASE_COLORS = {
  EARLY: 'bg-green-100 text-green-700 border-green-200',
  MID: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  LATE: 'bg-red-100 text-red-700 border-red-200',
};

const MARKET_TAG_COLORS = {
  ALT_FRIENDLY: 'bg-green-500 text-white',
  ALT_NEUTRAL: 'bg-gray-500 text-white',
  ALT_HOSTILE: 'bg-red-500 text-white',
};

const ALT_SEASON_COLORS = {
  ALT_SEASON: { bg: 'bg-green-50', text: 'text-green-700', icon: IconAltSeason },
  EARLY_ALT: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: IconAltSeason },
  PRE_ALT: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: IconSpikePump },
  NEUTRAL: { bg: 'bg-gray-50', text: 'text-gray-700', icon: Minus },
  ROTATION: { bg: 'bg-purple-50', text: 'text-purple-700', icon: IconSpikePump },
  BTC_SEASON: { bg: 'bg-orange-50', text: 'text-orange-700', icon: IconNetwork },
  BTC_ONLY: { bg: 'bg-blue-50', text: 'text-blue-700', icon: IconNetwork },
};

export default function AltSeasonPage() {
  const [opportunities, setOpportunities] = useState([]);
  const [marketState, setMarketState] = useState(null);
  const [altSeason, setAltSeason] = useState(null);
  const [stats, setStats] = useState(null);
  const [tokenMomentum, setTokenMomentum] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [oppRes, marketRes, altRes, statsRes, tokenRes] = await Promise.all([
        fetch(`${API_BASE}/api/connections/opportunities`),
        fetch(`${API_BASE}/api/connections/market-state`),
        fetch(`${API_BASE}/api/connections/alt-season`),
        fetch(`${API_BASE}/api/connections/opportunities/stats`),
        fetch(`${API_BASE}/api/connections/momentum`),
      ]);

      const [oppData, marketData, altData, statsData, tokenData] = await Promise.all([
        oppRes.json(),
        marketRes.json(),
        altRes.json(),
        statsRes.json(),
        tokenRes.json(),
      ]);

      if (oppData.ok) setOpportunities(oppData.data || []);
      if (marketData.ok) setMarketState(marketData.data);
      // Alt season can be in data field or at top level
      if (altData.ok) {
        const altSeasonData = altData.data || {
          asp: altData.altSeasonIndex,
          altSeasonIndex: altData.altSeasonIndex,
          level: altData.signal,
          signal: altData.signal
        };
        setAltSeason(altSeasonData);
      }
      if (statsData.ok) setStats(statsData.data);
      if (tokenData.ok) {
        // Map token momentum data to expected format
        const mapped = (tokenData.data || []).map(t => ({
          symbol: t.symbol,
          score: t.currentScore || 0,
          breadth: t.uniqueInfluencers24h / 100, // Normalize
          activeClusters: Math.ceil(t.uniqueInfluencers24h / 10),
          confirmedEvents: t.mentionCount24h,
          velocity: t.velocity,
          trend: t.trend,
          smartMoneyScore: t.smartMoneyScore,
          earlySignalScore: t.earlySignalScore,
        }));
        setTokenMomentum(mapped);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const aspConfig = altSeason ? (ALT_SEASON_COLORS[altSeason.state] || ALT_SEASON_COLORS[altSeason.level] || ALT_SEASON_COLORS.NEUTRAL) : ALT_SEASON_COLORS.NEUTRAL;
  const AspIcon = aspConfig.icon;

  return (
    <div className="min-h-screen bg-gray-50 p-6" data-testid="alt-season-page">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in-up">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                <IconAltSeason size={28} className="text-white" />
              </div>
              Alt Season Monitor
            </h1>
            <p className="text-gray-500 mt-2 ml-15 max-w-2xl">
              Track market cycles and identify optimal entry points for altcoins. The system analyzes 
              Hit Ratio (% alts outperforming BTC), market breadth, exchange data, and coordinated 
              influencer attention to predict alt season probability and surface top opportunities.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/connections/clusters">
              <Button
                variant="outline"
                className="border-purple-300 text-purple-600 hover:bg-purple-50 hover:scale-105 active:scale-95 transition-all duration-200"
                data-testid="clusters-link"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="ml-2">Clusters</span>
              </Button>
            </Link>
            <Button
              onClick={fetchData}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 text-white hover:shadow-lg hover:shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all duration-200"
              data-testid="refresh-btn"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span className="ml-2">Refresh All</span>
            </Button>
          </div>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Alt Season Probability Card */}
          <Card className={`${aspConfig.bg} border-0 shadow-sm hover:shadow-lg transition-shadow duration-300 animate-fade-in-up stagger-1 group relative cursor-help`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-600">Alt Season Probability</span>
                <AspIcon size={24} className={aspConfig.text} />
              </div>
              <div className={`text-4xl font-bold ${aspConfig.text}`}>
                {altSeason ? `${((altSeason.asp || altSeason.probability || altSeason.altSeasonIndex || altSeason.altIndex / 100 || 0.5) * 100).toFixed(0)}%` : '--'}
              </div>
              <div className="mt-2">
                <Badge className={`${aspConfig.text} bg-white/50`}>
                  {altSeason?.level?.replace('_', ' ') || altSeason?.signal || 'Loading...'}
                </Badge>
              </div>
              {altSeason && (
                <div className="mt-4 text-xs text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Hit Ratio:</span>
                    <span className="font-medium">{(altSeason.components?.hitRatio || altSeason.performance?.hit_rate / 100 || 0.7).toFixed(0) * 100}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Breadth:</span>
                    <span className="font-medium">{((altSeason.components?.breadth || altSeason.probability || 0.5) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Market:</span>
                    <span className="font-medium">{((altSeason.components?.marketFriendliness || altSeason.confidence || 0.6) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              )}
            </CardContent>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Measures the likelihood of an alt season based on Hit Ratio (% of alts outperforming BTC), Breadth (% of alts in uptrend), and Market Friendliness (funding rates, OI flow).
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </Card>

          {/* Market State Card */}
          <Card className="bg-white border-gray-200 shadow-sm group relative cursor-help">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-600">Market State</span>
                <IconNetwork size={24} className="text-gray-400" />
              </div>
              <div className="mb-3">
                {marketState && (
                  <Badge className={MARKET_TAG_COLORS[marketState.tag]}>
                    {marketState.tag.replace('_', ' ')}
                  </Badge>
                )}
              </div>
              <div className="text-sm text-gray-500">
                Confidence: {marketState ? `${(marketState.confidence * 100).toFixed(0)}%` : '--'}
              </div>
              {marketState && (
                <div className="mt-4 text-xs text-gray-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Funding:</span>
                    <span className={marketState.factors.funding < 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {(marketState.factors.funding * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>OI Change:</span>
                    <span className={marketState.factors.oiChange > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {marketState.factors.oiChange.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Volatility:</span>
                    <span className="font-medium">{(marketState.factors.volatility * 100).toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </CardContent>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Current market conditions based on exchange data: Funding rates (negative = shorts paying longs), Open Interest changes, and Volatility levels. ALT_FRIENDLY indicates favorable conditions for altcoin rallies.
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </Card>

          {/* Performance Stats Card */}
          <Card className="bg-white border-gray-200 shadow-sm group relative cursor-help">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-600">Performance</span>
                <IconTrophy size={24} className="text-gray-400" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Hit Rate</span>
                  <span className="text-lg font-bold text-green-600">
                    {stats ? `${(stats.hitRate * 100).toFixed(0)}%` : '--'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">False Signals</span>
                  <span className="text-lg font-bold text-red-600">
                    {stats ? `${(stats.falseSignalRate * 100).toFixed(0)}%` : '--'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Tracked</span>
                  <span className="text-lg font-bold text-gray-900">
                    {stats?.total || 0}
                  </span>
                </div>
              </div>
            </CardContent>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Track record of opportunity signals: Hit Rate shows % of signals that resulted in profitable trades, False Signals shows failed predictions, Total Tracked counts all monitored opportunities.
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </Card>
        </div>

        {/* Opportunities Table */}
        <Card className="bg-white border-gray-200 shadow-sm group relative">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="flex items-center gap-2 text-gray-900 cursor-help">
              <IconSpikePump size={20} className="text-orange-500" />
              Top Opportunities
            </CardTitle>
            {/* Tooltip for Opportunities */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Tokens with coordinated attention from multiple influencer clusters. Score combines momentum, cluster count, early phase bonus, and exchange bias. EARLY phase = best risk/reward.
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {opportunities.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <IconWarning size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No opportunities detected</p>
                <p className="text-sm mt-2">
                  Opportunities will appear when clusters show coordinated token attention
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Token</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phase</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clusters</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bias</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reasons</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {opportunities.map((opp, idx) => (
                      <tr key={opp.symbol} className="hover:bg-gray-50" data-testid={`opp-${opp.symbol}`}>
                        <td className="px-6 py-4 text-sm text-gray-500">{idx + 1}</td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-900">{opp.symbol}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-orange-500 rounded-full"
                                style={{ width: `${opp.opportunityScore * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {(opp.opportunityScore * 100).toFixed(0)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={`${PHASE_COLORS[opp.phase]} border`}>
                            {opp.phase}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{opp.clusters}</td>
                        <td className="px-6 py-4">
                          <span className={`flex items-center gap-1 text-sm ${
                            opp.exchangeBias === 'BULL' ? 'text-green-600' :
                            opp.exchangeBias === 'BEAR' ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            {opp.exchangeBias === 'BULL' && <ArrowUp className="w-4 h-4" />}
                            {opp.exchangeBias === 'BEAR' && <ArrowDown className="w-4 h-4" />}
                            {opp.exchangeBias === 'NEUTRAL' && <Minus className="w-4 h-4" />}
                            {opp.exchangeBias}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {opp.reasons?.slice(0, 2).map((reason, i) => (
                              <span key={i} className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">
                                {reason}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Token Momentum - БЛОК 6 */}
        <Card className="bg-white border-gray-200 shadow-sm mt-6 group relative">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="flex items-center gap-2 text-gray-900 cursor-help">
              <IconSpikePump size={20} className="text-blue-500" />
              Token Momentum Scores
            </CardTitle>
            {/* Tooltip */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Real-time token attention from influencer network. Score = weighted mentions by smart money & early signal accounts. Breadth = % of unique influencers. Active Clusters = groups discussing the token.
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {tokenMomentum.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <IconCluster size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No token momentum data</p>
                <p className="text-sm mt-2">
                  Token momentum scores will appear when clusters mention tokens
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Token</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Breadth</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active Clusters</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confirmed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tokenMomentum.map((tm, idx) => (
                      <tr key={tm.symbol} className="hover:bg-gray-50" data-testid={`tm-${tm.symbol}`}>
                        <td className="px-6 py-4 text-sm text-gray-500">{idx + 1}</td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-900">{tm.symbol}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${tm.score * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {(tm.score * 100).toFixed(0)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {(tm.breadth * 100).toFixed(0)}%
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{tm.activeClusters}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{tm.confirmedEvents}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
