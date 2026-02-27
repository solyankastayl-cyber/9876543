/**
 * Alt Radar Page — Altcoin Opportunity Scanner
 * =============================================
 * 
 * Visual dashboard for Alt Scanner system (Blocks 1-28)
 * Style: FomoAI Design System
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  Radar, TrendingUp, TrendingDown, Activity, RefreshCw, Loader2,
  ArrowUpRight, ArrowDownRight, Minus, Target, Zap, AlertTriangle,
  ChevronRight, Clock, BarChart2, PieChart, Layers, Eye, Shield,
  Play, Pause, Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { altScannerApi } from '@/api/altScanner.api';

/* ═══════════════════════════════════════════════════════════════
   CSS-in-JS styles for animations (FomoAI style)
═══════════════════════════════════════════════════════════════ */
const fadeInStyle = {
  animation: 'fadeIn 0.4s ease-out forwards',
};

const slideUpStyle = {
  animation: 'slideUp 0.5s ease-out forwards',
};

// Inject keyframes once
if (typeof document !== 'undefined' && !document.getElementById('altradar-animations')) {
  const style = document.createElement('style');
  style.id = 'altradar-animations';
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .card-hover { transition: all 0.2s ease; }
    .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 25px -5px rgba(0,0,0,0.1); }
  `;
  document.head.appendChild(style);
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const DIRECTION_CONFIG = {
  UP: { icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10', label: 'LONG' },
  DOWN: { icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10', label: 'SHORT' },
  FLAT: { icon: Minus, color: 'text-gray-500', bg: 'bg-gray-500/10', label: 'NEUTRAL' },
};

const REGIME_CONFIG = {
  BULL: { color: 'bg-green-500', label: 'Bull' },
  BEAR: { color: 'bg-red-500', label: 'Bear' },
  RANGE: { color: 'bg-yellow-500', label: 'Range' },
  RISK_OFF: { color: 'bg-orange-500', label: 'Risk Off' },
};

const FACET_CONFIG = {
  BREAKOUT: { color: 'text-blue-500', label: 'Breakout' },
  MEAN_REVERSION: { color: 'text-purple-500', label: 'Mean Rev' },
  MOMENTUM: { color: 'text-green-500', label: 'Momentum' },
  SHORT_SQUEEZE: { color: 'text-orange-500', label: 'Squeeze' },
};

const formatPct = (val) => val ? `${val >= 0 ? '+' : ''}${val.toFixed(2)}%` : '—';
const formatScore = (val) => val ? val.toFixed(0) : '—';

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function AltRadarPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('radar');
  
  // Data states
  const [radar, setRadar] = useState(null);
  const [health, setHealth] = useState(null);
  const [collector, setCollector] = useState(null);
  const [strategies, setStrategies] = useState(null);
  
  // ─────────────────────────────────────────────────────────────
  // DATA FETCHING
  // ─────────────────────────────────────────────────────────────
  
  const fetchData = useCallback(async (showLoader = true) => {
    if (showLoader) setRefreshing(true);
    try {
      const [healthRes, radarRes, collectorRes, strategiesRes] = await Promise.all([
        altScannerApi.getHealth(),
        altScannerApi.getRadarFull(),
        altScannerApi.getCollectorStatus(),
        altScannerApi.getStrategies(),
      ]);
      
      if (healthRes.ok !== false) setHealth(healthRes);
      if (radarRes.ok) setRadar(radarRes);
      if (collectorRes.ok !== false) setCollector(collectorRes);
      if (strategiesRes.ok !== false) setStrategies(strategiesRes);
    } catch (err) {
      console.error('Alt Radar fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(false), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = () => fetchData(true);

  const toggleCollector = async () => {
    if (collector?.collector?.isRunning) {
      await altScannerApi.stopCollector();
    } else {
      await altScannerApi.startCollector();
    }
    fetchData(false);
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────────────────────────
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-blue-500 animate-spin" />
            <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-blue-300 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
          </div>
          <span className="text-sm text-gray-500 font-medium">Scanning altcoins...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50" style={fadeInStyle}>
      {/* ═══════════════════════════════════════════════════════════════
          HEADER: FomoAI Style
      ═══════════════════════════════════════════════════════════════ */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/80 px-6 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          {/* Left: Title + Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 shadow-sm">
              <Radar className="w-5 h-5 text-slate-700" />
              <span className="text-xl font-bold tracking-tight text-slate-800">Alt Radar</span>
              <Badge variant="outline" className={`text-xs ${collector?.collector?.isRunning ? 'bg-green-100 text-green-700 border-green-300' : 'bg-slate-200 text-slate-600 border-slate-300'}`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1 ${collector?.collector?.isRunning ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
                {collector?.collector?.isRunning ? 'SCANNING' : 'STOPPED'}
              </Badge>
            </div>
            
            {/* Regime Badge */}
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-lg border border-slate-200 cursor-help">
                    <BarChart2 className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs font-medium text-slate-600">{radar?.currentRegime || 'UNKNOWN'}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-900 text-white border-0 shadow-xl">
                  <p className="text-xs">Current market regime</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={toggleCollector}
              className={`border rounded-xl transition-all duration-200 ${
                collector?.collector?.isRunning 
                  ? 'border-green-200 bg-green-50 hover:bg-green-100' 
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              {collector?.collector?.isRunning ? (
                <>
                  <Pause className="h-4 w-4 mr-2 text-green-600" />
                  <span className="text-green-700 font-medium">Collecting</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-gray-600 font-medium">Start</span>
                </>
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded-lg hover:bg-gray-100"
            >
              <RefreshCw className={`h-4 w-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          title="Venue" 
          value={radar?.venue || 'BYBIT'} 
          icon={Activity}
          color="blue"
          tooltip="Data source exchange"
        />
        <StatCard 
          title="Regime" 
          value={radar?.currentRegime || 'UNKNOWN'} 
          icon={BarChart2}
          color={radar?.currentRegime === 'BULL' ? 'green' : radar?.currentRegime === 'BEAR' ? 'red' : 'yellow'}
          tooltip="Current market regime"
        />
        <StatCard 
          title="Opportunities" 
          value={radar?.opportunities?.length || 0} 
          icon={Target}
          color="purple"
          tooltip="Detected trading opportunities"
        />
        <StatCard 
          title="ML Samples" 
          value={collector?.mlModel?.totalSamples || 0} 
          icon={Layers}
          color="cyan"
          tooltip="Machine learning training samples"
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-1">
          <TabsTrigger value="radar" className="rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 transition-all duration-200">
            <Radar className="h-4 w-4 mr-2" />
            Opportunities
          </TabsTrigger>
          <TabsTrigger value="portfolio" className="rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 transition-all duration-200">
            <PieChart className="h-4 w-4 mr-2" />
            Portfolio
          </TabsTrigger>
          <TabsTrigger value="patterns" className="rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 transition-all duration-200">
            <Layers className="h-4 w-4 mr-2" />
            Patterns
          </TabsTrigger>
          <TabsTrigger value="system" className="rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 transition-all duration-200">
            <Shield className="h-4 w-4 mr-2" />
            System
          </TabsTrigger>
        </TabsList>

        {/* Opportunities Tab */}
        <TabsContent value="radar" className="space-y-4">
          <OpportunitiesSection opportunities={radar?.opportunities || []} />
        </TabsContent>

        {/* Portfolio Tab */}
        <TabsContent value="portfolio" className="space-y-4">
          <PortfolioSection 
            portfolio={radar?.portfolio} 
            actionItems={radar?.actionItems}
            warnings={radar?.warnings}
          />
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="space-y-4">
          <PatternsSection 
            propagationSignals={radar?.propagationSignals || []}
            preferredSectors={radar?.preferredSectors || []}
            avoidSectors={radar?.avoidSectors || []}
          />
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <SystemSection 
            health={health}
            collector={collector}
            strategies={strategies}
          />
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS (FomoAI Style)
// ═══════════════════════════════════════════════════════════════

function StatCard({ title, value, icon: Icon, color, tooltip }) {
  const colors = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    red: 'text-red-600 bg-red-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    purple: 'text-purple-600 bg-purple-100',
    cyan: 'text-cyan-600 bg-cyan-100',
  };
  
  return (
    <Card className="bg-white border border-gray-200/80 rounded-xl shadow-sm card-hover" style={{ ...slideUpStyle, animationDelay: '100ms' }}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1">
              <p className="text-gray-500 text-sm">{title}</p>
              {tooltip && (
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger><Info className="w-3 h-3 text-gray-400 cursor-help" /></TooltipTrigger>
                    <TooltipContent className="bg-gray-900 text-white border-0">
                      <p className="text-xs">{tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <p className="text-gray-900 text-xl font-bold mt-1">{value}</p>
          </div>
          <div className={`p-2 rounded-lg ${colors[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OpportunitiesSection({ opportunities }) {
  if (!opportunities?.length) {
    return (
      <Card className="bg-white border border-gray-200/80 rounded-xl shadow-sm">
        <CardContent className="p-8 text-center">
          <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Target className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">No opportunities detected</p>
          <p className="text-gray-400 text-sm mt-2">Waiting for market patterns...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {opportunities.slice(0, 15).map((opp, idx) => (
        <OpportunityCard key={opp.symbol + idx} opp={opp} rank={idx + 1} />
      ))}
    </div>
  );
}

function OpportunityCard({ opp, rank }) {
  const dirConfig = DIRECTION_CONFIG[opp.direction] || DIRECTION_CONFIG.FLAT;
  const DirIcon = dirConfig.icon;
  const facetConfig = FACET_CONFIG[opp.facet] || { color: 'text-gray-500', label: opp.facet };
  
  return (
    <Card className="bg-white border border-gray-200/80 rounded-xl shadow-sm card-hover" style={{ ...slideUpStyle, animationDelay: `${rank * 50}ms` }}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Left: Rank + Symbol */}
          <div className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              rank <= 3 ? 'bg-gradient-to-br from-yellow-100 to-amber-100 text-amber-700 border border-amber-200' : 'bg-gray-100 text-gray-500'
            }`}>
              {rank}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-gray-900 font-semibold">{opp.symbol}</span>
                <Badge variant="outline" className={`${dirConfig.bg} ${dirConfig.color} border-0 font-medium`}>
                  <DirIcon className="h-3 w-3 mr-1" />
                  {dirConfig.label}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-medium ${facetConfig.color}`}>{facetConfig.label}</span>
                {opp.clusterLabel && (
                  <span className="text-xs text-gray-400">• {opp.clusterLabel}</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Right: Score + Confidence */}
          <div className="text-right">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">Score:</span>
              <span className="text-gray-900 font-bold text-lg">{formatScore(opp.opportunityScore || opp.totalScore)}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={(opp.confidence || 0) * 100} className="w-16 h-1.5" />
              <span className="text-gray-500 text-xs">{((opp.confidence || 0) * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
        
        {/* Reasons */}
        {opp.reasons?.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex flex-wrap gap-2">
              {opp.reasons.slice(0, 3).map((reason, i) => (
                <Badge key={i} variant="secondary" className="bg-gray-50 text-gray-600 text-xs border border-gray-100">
                  {reason}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PortfolioSection({ portfolio, actionItems, warnings }) {
  if (!portfolio) {
    return (
      <Card className="bg-white border border-gray-200/80 rounded-xl shadow-sm">
        <CardContent className="p-8 text-center">
          <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <PieChart className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">No portfolio constructed</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Portfolio Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border border-gray-200/80 rounded-xl shadow-sm card-hover">
          <CardContent className="p-4">
            <p className="text-gray-500 text-sm">Positions</p>
            <p className="text-gray-900 text-2xl font-bold">{portfolio.positions?.length || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm card-hover">
          <CardContent className="p-4">
            <p className="text-green-600 text-sm">Long Exposure</p>
            <p className="text-green-700 text-2xl font-bold">{((portfolio.longExposure || 0) * 100).toFixed(0)}%</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-xl shadow-sm card-hover">
          <CardContent className="p-4">
            <p className="text-red-600 text-sm">Short Exposure</p>
            <p className="text-red-700 text-2xl font-bold">{((portfolio.shortExposure || 0) * 100).toFixed(0)}%</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-200/80 rounded-xl shadow-sm card-hover">
          <CardContent className="p-4">
            <p className="text-gray-500 text-sm">Net Exposure</p>
            <p className="text-gray-900 text-2xl font-bold">{((portfolio.netExposure || 0) * 100).toFixed(0)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Positions */}
      {portfolio.positions?.length > 0 && (
        <Card className="bg-white border border-gray-200/80 rounded-xl shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <Layers className="w-4 h-4 text-indigo-600" />
              </div>
              <CardTitle className="text-gray-800 text-lg">Positions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {portfolio.positions.map((pos, idx) => (
                <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border ${
                  pos.direction === 'UP' ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-900 font-semibold">{pos.symbol}</span>
                    <Badge className={`text-xs ${pos.direction === 'UP' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                      {pos.direction === 'UP' ? 'LONG' : 'SHORT'}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-900 font-mono font-bold">{(pos.weight * 100).toFixed(1)}%</span>
                    <span className="text-gray-500 text-sm ml-2">${pos.notional?.toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Items & Warnings */}
      <div className="grid md:grid-cols-2 gap-4">
        {actionItems?.length > 0 && (
          <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-yellow-100 rounded-lg">
                  <Zap className="w-4 h-4 text-yellow-600" />
                </div>
                <CardTitle className="text-gray-800 text-lg">Action Items</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {actionItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700 text-sm bg-white/60 p-2 rounded-lg">
                    <ChevronRight className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {warnings?.length > 0 && (
          <Card className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-100 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                </div>
                <CardTitle className="text-gray-800 text-lg">Warnings</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {warnings.map((warn, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-orange-800 text-sm bg-white/60 p-2 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    {warn}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function PatternsSection({ propagationSignals, preferredSectors, avoidSectors }) {
  return (
    <div className="space-y-4">
      {/* Sector Preferences */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm card-hover">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <CardTitle className="text-gray-800 text-lg">Preferred Sectors</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {preferredSectors?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {preferredSectors.map((sector, idx) => (
                  <Badge key={idx} className="bg-green-100 text-green-700 border border-green-200 px-3 py-1">
                    {sector}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No preferred sectors in current regime</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-xl shadow-sm card-hover">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
              <CardTitle className="text-gray-800 text-lg">Avoid Sectors</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {avoidSectors?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {avoidSectors.map((sector, idx) => (
                  <Badge key={idx} className="bg-red-100 text-red-700 border border-red-200 px-3 py-1">
                    {sector}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No sectors to avoid in current regime</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Propagation Signals */}
      <Card className="bg-white border border-gray-200/80 rounded-xl shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-yellow-100 rounded-lg">
              <Zap className="w-4 h-4 text-yellow-600" />
            </div>
            <CardTitle className="text-gray-800 text-lg">Propagation Signals</CardTitle>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger><Info className="w-4 h-4 text-gray-400 cursor-help" /></TooltipTrigger>
                <TooltipContent className="bg-gray-900 text-white border-0 max-w-xs">
                  <p className="text-xs">Assets following successful patterns from peers</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription className="text-gray-500">
            Assets following successful patterns from peers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {propagationSignals?.length > 0 ? (
            <div className="space-y-3">
              {propagationSignals.map((signal, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 font-semibold">{signal.symbol}</span>
                      <Badge className={`text-xs ${
                        signal.urgency === 'HIGH' ? 'bg-red-500 text-white' : 
                        signal.urgency === 'MEDIUM' ? 'bg-yellow-500 text-white' : 
                        'bg-gray-400 text-white'
                      }`}>
                        {signal.urgency}
                      </Badge>
                    </div>
                    <span className="text-gray-500 text-sm">{signal.patternLabel}</span>
                  </div>
                  {signal.reasons?.length > 0 && (
                    <p className="text-gray-500 text-xs mt-2">{signal.reasons[0]}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-4">No active propagation signals</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SystemSection({ health, collector, strategies }) {
  return (
    <div className="space-y-4">
      {/* Health */}
      <Card className="bg-white border border-gray-200/80 rounded-xl shadow-sm card-hover">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Shield className="w-4 h-4 text-blue-600" />
            </div>
            <CardTitle className="text-gray-800 text-lg">System Health</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-gray-500 text-sm">Status</p>
              <p className={`font-bold ${health?.status === 'OPERATIONAL' ? 'text-green-600' : 'text-red-600'}`}>
                {health?.status || 'UNKNOWN'}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-gray-500 text-sm">Venue</p>
              <p className="text-gray-900 font-bold">{health?.venue || 'N/A'}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-gray-500 text-sm">Universe Size</p>
              <p className="text-gray-900 font-bold">{health?.universeSize || 0}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-gray-500 text-sm">Indicator Providers</p>
              <p className="text-gray-900 font-bold">{health?.components?.indicatorEngine?.providers || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ML Model */}
      <Card className="bg-white border border-gray-200/80 rounded-xl shadow-sm card-hover">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-100 rounded-lg">
              <Layers className="w-4 h-4 text-purple-600" />
            </div>
            <CardTitle className="text-gray-800 text-lg">ML Model Status</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-gray-500 text-sm">Total Samples</p>
              <p className="text-gray-900 font-bold">{collector?.mlModel?.totalSamples || 0}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-gray-500 text-sm">Is Trained</p>
              <p className={`font-bold ${collector?.mlModel?.isTrained ? 'text-green-600' : 'text-yellow-600'}`}>
                {collector?.mlModel?.isTrained ? 'YES' : 'NO'}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-gray-500 text-sm">Accuracy</p>
              <p className="text-gray-900 font-bold">{((collector?.mlModel?.accuracy || 0) * 100).toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-gray-500 text-sm">Pending Predictions</p>
              <p className="text-gray-900 font-bold">{collector?.collector?.pendingPredictions || 0}</p>
            </div>
          </div>
          
          {/* Progress to training */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 font-medium">Progress to training (100 samples)</span>
              <span className="text-purple-700 font-bold">{Math.min(100, (collector?.mlModel?.totalSamples || 0))}%</span>
            </div>
            <Progress value={Math.min(100, (collector?.mlModel?.totalSamples || 0))} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Strategies */}
      <Card className="bg-white border border-gray-200/80 rounded-xl shadow-sm card-hover">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-cyan-100 rounded-lg">
              <Target className="w-4 h-4 text-cyan-600" />
            </div>
            <CardTitle className="text-gray-800 text-lg">Strategy Health</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-green-50 rounded-xl border border-green-100">
              <p className="text-green-600 text-sm">Active</p>
              <p className="text-green-700 font-bold text-xl">{strategies?.activeStrategies || 0}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-100">
              <p className="text-yellow-600 text-sm">Paused</p>
              <p className="text-yellow-700 font-bold text-xl">{strategies?.pausedStrategies || 0}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-xl border border-red-100">
              <p className="text-red-600 text-sm">Disabled</p>
              <p className="text-red-700 font-bold text-xl">{strategies?.disabledStrategies || 0}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-gray-500 text-sm">System Health</p>
              <p className={`font-bold text-xl ${
                strategies?.systemHealth === 'HEALTHY' ? 'text-green-600' : 
                strategies?.systemHealth === 'WARNING' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {strategies?.systemHealth || 'UNKNOWN'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
