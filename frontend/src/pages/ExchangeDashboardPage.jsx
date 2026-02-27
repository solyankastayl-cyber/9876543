/**
 * Exchange Dashboard — UNIFIED ENTRY POINT (v2)
 * 
 * Architecture:
 * - ONE central screen
 * - View Mode toggles depth (Core/Advanced/Research)
 * - Labs = Research mode, NOT a menu item
 * 
 * Style: FomoAI Design System with Micro-Animations
 */

import { useState, useEffect } from 'react';
import { 
  Activity, BarChart2, RefreshCw, Loader2, CheckCircle, XCircle, 
  Clock, ArrowUpRight, ArrowDownRight, Minus, Eye, FlaskConical, 
  ChevronRight, Info, Zap, TrendingUp, TrendingDown, Gauge
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { api } from '@/api/client';
import { injectExchangeAnimations, animations, getStaggerDelay } from '@/styles/exchangeAnimations';

// Inject micro-animations
injectExchangeAnimations();

const VIEW_MODES = {
  core: { id: 'core', label: 'Core', icon: Eye },
  advanced: { id: 'advanced', label: 'Advanced', icon: BarChart2 },
  research: { id: 'research', label: 'Research', icon: FlaskConical },
};

const REGIME_CONFIG = {
  UNKNOWN: { label: 'Unknown', color: 'bg-gray-500', textColor: 'text-gray-600' },
  LOW_ACTIVITY: { label: 'Low Activity', color: 'bg-blue-500', textColor: 'text-blue-600' },
  TRENDING: { label: 'Trending', color: 'bg-green-500', textColor: 'text-green-600' },
  SQUEEZE: { label: 'Squeeze', color: 'bg-orange-500', textColor: 'text-orange-600' },
  DISTRIBUTION: { label: 'Distribution', color: 'bg-purple-500', textColor: 'text-purple-600' },
};

const formatVolume = (vol) => {
  if (!vol) return '$0';
  if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}B`;
  if (vol >= 1e6) return `$${(vol / 1e6).toFixed(2)}M`;
  if (vol >= 1e3) return `$${(vol / 1e3).toFixed(2)}K`;
  return `$${vol.toFixed(2)}`;
};

export default function ExchangeDashboardPage() {
  const [viewMode, setViewMode] = useState('core');
  const [overview, setOverview] = useState(null);
  const [health, setHealth] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [orderflow, setOrderflow] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [overviewRes, healthRes, universeRes] = await Promise.all([
        api.get('/api/v10/exchange/overview').catch(() => ({ data: { ok: false } })),
        api.get('/api/v10/exchange/health').catch(() => ({ data: null })),
        api.get('/api/v10/exchange/universe?status=INCLUDED').catch(() => ({ data: { ok: false, items: [] } })),
      ]);
      if (overviewRes.data?.ok) setOverview(overviewRes.data.data);
      if (healthRes.data) setHealth(healthRes.data);
      
      // Map universe items to market format
      if (universeRes.data?.ok && universeRes.data.items) {
        const mappedMarkets = universeRes.data.items.map(item => ({
          symbol: item.symbol,
          price: 0, // Price not in universe
          change24h: 0,
          volume24h: item.raw?.volume24h || 0,
          volatility: 0,
          universeScore: item.scores?.universeScore || 0,
          whaleScore: item.scores?.whaleScore || 0,
          liquidityScore: item.scores?.liquidityScore || 0,
        }));
        setMarkets(mappedMarkets);
      }

      // Advanced data
      if (viewMode !== 'core') {
        const orderflowRes = await api.get('/api/v10/exchange/orderflow').catch(() => ({ data: { ok: false } }));
        if (orderflowRes.data?.ok) setOrderflow(orderflowRes.data.data);
      }
    } catch (err) {
      console.error('Exchange fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [viewMode]);

  const regimeConfig = REGIME_CONFIG[overview?.regime] || REGIME_CONFIG.UNKNOWN;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-blue-500 animate-spin" />
            <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-blue-300 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
          </div>
          <span className="text-sm text-gray-500 font-medium">Loading exchange data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 animate-fadeIn" data-testid="exchange-dashboard">
      {/* ═══════════════════════════════════════════════════════════════
          HEADER: FomoAI Style with Micro-Animations
      ═══════════════════════════════════════════════════════════════ */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/80 px-6 py-3 sticky top-0 z-50 animate-slideDown">
        <div className="flex items-center justify-between">
          {/* Left: Title + Regime Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 shadow-sm">
              <Activity className="w-5 h-5 text-slate-700" />
              <span className="text-xl font-bold tracking-tight text-slate-800">{regimeConfig.label}</span>
              <Badge variant="outline" className={`text-xs ${health?.polling?.running ? 'bg-green-100 text-green-700 border-green-300' : 'bg-slate-200 text-slate-600 border-slate-300'}`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1 ${health?.polling?.running ? 'bg-green-500 live-indicator' : 'bg-slate-400'}`} />
                {health?.polling?.running ? 'LIVE' : 'OFFLINE'}
              </Badge>
            </div>
            
            {/* Provider Status */}
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-lg border border-slate-200 cursor-help">
                    <Zap className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs font-medium text-slate-600">{health?.provider?.provider || 'N/A'}</span>
                    <Badge className="text-xs px-1.5 py-0 bg-slate-700 text-white">
                      {health?.provider?.latencyMs || 0}ms
                    </Badge>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-900 text-white border-0 shadow-xl tooltip-animate">
                  <p className="text-xs">Data provider latency</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Right: View Mode + Refresh */}
          <div className="flex items-center gap-3">
            <Tabs value={viewMode} onValueChange={setViewMode} className="bg-white rounded-xl border border-gray-200/80 shadow-sm">
              <TabsList className="p-1 bg-transparent">
                {Object.values(VIEW_MODES).map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <TabsTrigger 
                      key={mode.id} 
                      value={mode.id} 
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 transition-all duration-200 btn-hover"
                      data-testid={`viewmode-${mode.id}`}
                    >
                      <Icon className="w-4 h-4 icon-hover" />
                      {mode.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={fetchData} 
              className="rounded-lg hover:bg-gray-100 transition-colors btn-hover pop-click"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">

      {/* Research Mode Warning */}
      {viewMode === 'research' && (
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl shadow-sm animate-slideUp" style={{ animationDelay: '50ms' }}>
          <div className="p-2 bg-amber-100 rounded-lg wiggle-hover">
            <FlaskConical className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Research Mode</p>
            <p className="text-xs text-amber-600">Experimental metrics. Not used directly in decisions.</p>
          </div>
          <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-100/50 badge-pulse">Experimental</Badge>
        </div>
      )}

      {/* Main Content: Market State + Assessment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Market State Card */}
        <Card className="lg:col-span-2 bg-white border border-gray-200/80 rounded-xl shadow-sm card-hover animate-slideUp stagger-2" data-testid="market-state-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-slate-100 rounded-lg">
                <Activity className="w-4 h-4 text-slate-600" />
              </div>
              <CardTitle className="text-gray-800">Market State</CardTitle>
            </div>
            <CardDescription>Current market conditions and regime</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* Regime */}
              <div className="space-y-2 animate-fadeIn stagger-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Regime</p>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full interactive ${
                  overview?.regime === 'TRENDING' ? 'bg-green-100' :
                  overview?.regime === 'SQUEEZE' ? 'bg-orange-100' :
                  overview?.regime === 'DISTRIBUTION' ? 'bg-purple-100' :
                  'bg-gray-100'
                }`}>
                  <div className={`w-2 h-2 rounded-full live-indicator ${regimeConfig.color}`} />
                  <span className={`font-semibold ${regimeConfig.textColor}`}>{regimeConfig.label}</span>
                </div>
              </div>

              {/* Volatility */}
              <div className="space-y-2 animate-fadeIn stagger-4">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Volatility</p>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger><Info className="w-3 h-3 text-gray-400 cursor-help icon-hover" /></TooltipTrigger>
                      <TooltipContent className="bg-gray-900 text-white border-0 tooltip-animate">
                        <p className="text-xs">Market volatility index (0-100)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-gray-900 number-animate">{overview?.volatilityIndex?.toFixed(0) || '0'}</span>
                  <span className="text-sm text-gray-400">/100</span>
                </div>
                <Progress value={overview?.volatilityIndex || 0} className="h-1.5 progress-animate" />
              </div>

              {/* Pressure */}
              <div className="space-y-2 animate-fadeIn stagger-5">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pressure</p>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger><Info className="w-3 h-3 text-gray-400 cursor-help icon-hover" /></TooltipTrigger>
                      <TooltipContent className="bg-gray-900 text-white border-0 tooltip-animate">
                        <p className="text-xs">Buy/Sell aggression ratio</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-2">
                  {(overview?.aggressionRatio || 0) > 0.1 ? (
                    <div className="p-1 bg-green-100 rounded bounce-hover">
                      <ArrowUpRight className="w-4 h-4 text-green-600" />
                    </div>
                  ) : (overview?.aggressionRatio || 0) < -0.1 ? (
                    <div className="p-1 bg-red-100 rounded bounce-hover">
                      <ArrowDownRight className="w-4 h-4 text-red-600" />
                    </div>
                  ) : (
                    <div className="p-1 bg-gray-100 rounded">
                      <Minus className="w-4 h-4 text-gray-500" />
                    </div>
                  )}
                  <span className={`text-xl font-bold number-animate ${
                    (overview?.aggressionRatio || 0) > 0 ? 'text-green-600' : 
                    (overview?.aggressionRatio || 0) < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {((overview?.aggressionRatio || 0) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Liquidation Risk */}
              <div className="space-y-2 animate-fadeIn stagger-6">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Liq. Risk</p>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger><Info className="w-3 h-3 text-gray-400 cursor-help icon-hover" /></TooltipTrigger>
                      <TooltipContent className="bg-gray-900 text-white border-0 tooltip-animate">
                        <p className="text-xs">Liquidation cascade risk level</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`p-1 rounded bounce-hover ${
                    (overview?.liquidationPressure || 0) > 50 ? 'bg-red-100' : 
                    (overview?.liquidationPressure || 0) > 20 ? 'bg-orange-100' : 'bg-gray-100'
                  }`}>
                    <Zap className={`w-4 h-4 ${
                      (overview?.liquidationPressure || 0) > 50 ? 'text-red-600' : 
                      (overview?.liquidationPressure || 0) > 20 ? 'text-orange-600' : 'text-gray-500'
                    }`} />
                  </div>
                  <span className="text-xl font-bold text-gray-900 number-animate">{overview?.liquidationPressure?.toFixed(0) || '0'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assessment Card */}
        <Card className="bg-white border border-gray-200/80 rounded-xl shadow-sm card-hover animate-slideUp stagger-3" data-testid="decision-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-slate-100 rounded-lg">
                <Gauge className="w-4 h-4 text-slate-600" />
              </div>
              <CardTitle className="text-gray-800">Assessment</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200">
                {overview?.regime === 'TRENDING' && <TrendingUp className="w-5 h-5 text-slate-700" />}
                {overview?.regime === 'SQUEEZE' && <Zap className="w-5 h-5 text-slate-700" />}
                {overview?.regime === 'DISTRIBUTION' && <Activity className="w-5 h-5 text-slate-700" />}
                {(!overview?.regime || overview?.regime === 'UNKNOWN' || overview?.regime === 'LOW_ACTIVITY') && <Minus className="w-5 h-5 text-slate-500" />}
                <span className="text-lg font-bold text-slate-800">
                  {overview?.regime === 'TRENDING' ? 'Trending Market' :
                   overview?.regime === 'SQUEEZE' ? 'Caution: Squeeze' :
                   overview?.regime === 'DISTRIBUTION' ? 'Distribution Phase' :
                   'Neutral / Low Activity'}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Key Factors</p>
              <ul className="space-y-2 text-sm text-gray-600">
                {overview?.volatilityIndex > 50 && (
                  <li className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg row-hover animate-slideInLeft stagger-4">
                    <ChevronRight className="w-4 h-4 text-blue-500" />
                    <span>High volatility ({overview.volatilityIndex.toFixed(0)})</span>
                  </li>
                )}
                {overview?.liquidationPressure > 30 && (
                  <li className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg row-hover animate-slideInLeft stagger-5">
                    <ChevronRight className="w-4 h-4 text-orange-500" />
                    <span>Elevated liquidation risk</span>
                  </li>
                )}
                {Math.abs(overview?.aggressionRatio || 0) > 0.2 && (
                  <li className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg row-hover animate-slideInLeft stagger-6">
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                    <span>{(overview?.aggressionRatio || 0) > 0 ? 'Buyer pressure' : 'Seller pressure'}</span>
                  </li>
                )}
                {(!overview?.volatilityIndex || overview.volatilityIndex < 30) && (
                  <li className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg row-hover animate-slideInLeft stagger-7">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <span>Low activity period</span>
                  </li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Mode: Order Flow */}
      {viewMode !== 'core' && orderflow && (
        <Card className="bg-white border border-gray-200/80 rounded-xl shadow-sm card-hover animate-slideUp stagger-4" data-testid="orderflow-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-cyan-100 rounded-lg bounce-hover">
                <BarChart2 className="w-4 h-4 text-cyan-600" />
              </div>
              <CardTitle className="text-gray-800 text-sm">Order Flow Analysis</CardTitle>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger><Info className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors cursor-help icon-hover" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs bg-gray-900 text-white border-0 shadow-xl tooltip-animate">
                    <p className="text-xs">Real-time buy/sell pressure analysis from exchange order flow.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <CardDescription>Buy/Sell pressure breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-xl border border-green-100 interactive">
                <p className="text-xs text-gray-500 mb-1">Buy Volume</p>
                <p className="text-lg font-bold text-green-600 number-animate">{formatVolume(orderflow.buyVolume)}</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-xl border border-red-100 interactive">
                <p className="text-xs text-gray-500 mb-1">Sell Volume</p>
                <p className="text-lg font-bold text-red-600 number-animate">{formatVolume(orderflow.sellVolume)}</p>
              </div>
              <div className={`text-center p-4 rounded-xl border interactive ${(orderflow.delta || 0) > 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                <p className="text-xs text-gray-500 mb-1">Delta</p>
                <p className={`text-lg font-bold number-animate ${(orderflow.delta || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatVolume(orderflow.delta)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Research Mode: Labs Data */}
      {viewMode === 'research' && (
        <Card className="bg-gradient-to-r from-amber-50/50 to-orange-50/50 border border-amber-200 rounded-xl shadow-sm animate-slideUp stagger-5" data-testid="labs-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 rounded-lg wiggle-hover">
                <FlaskConical className="w-4 h-4 text-amber-600" />
              </div>
              <CardTitle className="text-amber-800">Research Data (ex-Labs)</CardTitle>
            </div>
            <CardDescription className="text-amber-600">
              Experimental metrics not used in production decisions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-white rounded-xl border border-amber-100 shadow-sm interactive">
                <p className="text-xs text-gray-500">Regime Forward</p>
                <p className="text-lg font-bold text-gray-900 number-animate">N/A</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-amber-100 shadow-sm interactive">
                <p className="text-xs text-gray-500">Pattern Risk</p>
                <p className="text-lg font-bold text-gray-900 number-animate">N/A</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-amber-100 shadow-sm interactive">
                <p className="text-xs text-gray-500">Whale Risk</p>
                <p className="text-lg font-bold text-gray-900 number-animate">N/A</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-amber-100 shadow-sm interactive">
                <p className="text-xs text-gray-500">Sentiment Score</p>
                <p className="text-lg font-bold text-gray-900 number-animate">N/A</p>
              </div>
            </div>
            <p className="text-xs text-amber-600 mt-4 text-center">
              Enable Labs endpoints in admin to see experimental data
            </p>
          </CardContent>
        </Card>
      )}

      {/* Markets Table */}
      <Card className="bg-white border border-gray-200/80 rounded-xl shadow-sm card-hover animate-slideUp stagger-6" data-testid="markets-table">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 rounded-lg bounce-hover">
              <BarChart2 className="w-4 h-4 text-indigo-600" />
            </div>
            <CardTitle className="text-gray-800">Top Markets</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {markets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="pb-3 font-medium">Symbol</th>
                    <th className="pb-3 font-medium text-right">Universe Score</th>
                    <th className="pb-3 font-medium text-right">Whale Score</th>
                    <th className="pb-3 font-medium text-right">Volume 24h</th>
                    <th className="pb-3 font-medium text-right">Liquidity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {markets.slice(0, viewMode === 'core' ? 5 : 10).map((market, idx) => (
                    <tr key={market.symbol} className="row-hover animate-fadeIn" style={{ animationDelay: `${idx * 50}ms` }}>
                      <td className="py-3 font-semibold text-gray-900">{market.symbol}</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Progress value={(market.universeScore || 0) * 100} className="w-16 h-1.5 progress-animate" />
                          <span className="text-xs font-medium text-gray-700 w-10">
                            {((market.universeScore || 0) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          (market.whaleScore || 0) > 0.5 ? 'bg-purple-50 text-purple-700' : 'bg-gray-50 text-gray-600'
                        }`}>
                          {((market.whaleScore || 0) * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-3 text-right text-gray-600">{formatVolume(market.volume24h)}</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Progress value={(market.liquidityScore || 0) * 100} className="w-16 h-1.5 progress-animate" />
                          <span className="text-xs text-gray-500 w-8">
                            {((market.liquidityScore || 0) * 100).toFixed(0)}%
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
              <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No market data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Footer */}
      <div className="flex items-center justify-between text-xs text-gray-400 px-1 pb-4 animate-fadeIn stagger-8">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 interactive">
            <Clock className="w-3 h-3 icon-hover" />
            {overview?.lastUpdate ? new Date(overview.lastUpdate).toLocaleTimeString() : 'Never'}
          </span>
          <span>Provider: {health?.provider?.provider || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Mode: {VIEW_MODES[viewMode]?.label || viewMode}</span>
          <span>Latency: {health?.provider?.latencyMs || 0}ms</span>
        </div>
      </div>
      </div>
    </div>
  );
}
