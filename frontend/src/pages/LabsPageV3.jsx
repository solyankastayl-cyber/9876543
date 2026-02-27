/**
 * Exchange Labs v3 — Canonical Labs Page
 * 
 * 18 автономных аналитических инструментов:
 * - Group A: Market Structure (Regime, Volatility, Liquidity, Stress)
 * - Group B: Flow & Participation (Volume, Flow, Momentum, Participation)
 * - Group C: Smart Money & Risk (Whale, Accumulation, Manipulation, Liquidation)
 * - Group D: Price Behavior (Corridor, S/R, Price Acceptance)
 * - Group E: Meta / Quality (Data Quality, Signal Conflict, Stability)
 * 
 * v3.1: Added historical comparison and alerting
 * 
 * Labs НЕ принимают решений (NO BUY/SELL)
 * Labs ОПИСЫВАЮТ РЕАЛЬНОСТЬ
 * 
 * Style: FomoAI Design System
 */

import { useState, useEffect } from 'react';
import { 
  RefreshCw, Loader2, ChevronRight, AlertTriangle, Bell,
  Activity, TrendingUp, TrendingDown, Zap, BarChart3,
  Users, Waves, Target, Shield, Database, GitBranch, Lock, Info,
  FlaskConical
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/custom-select';
import { api } from '@/api/client';
import { LabsAlertsPanel } from '@/components/labs/LabsAlertsPanel';

/* ═══════════════════════════════════════════════════════════════
   CSS-in-JS styles for animations (FomoAI style)
═══════════════════════════════════════════════════════════════ */
const fadeInStyle = {
  animation: 'fadeIn 0.4s ease-out forwards',
};

const slideUpStyle = {
  animation: 'slideUp 0.5s ease-out forwards',
};

if (typeof document !== 'undefined' && !document.getElementById('labs-animations')) {
  const style = document.createElement('style');
  style.id = 'labs-animations';
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

// Lab groups configuration
const LAB_GROUPS = {
  A: {
    name: 'Market Structure',
    icon: Activity,
    color: 'blue',
    labs: ['regime', 'volatility', 'liquidity', 'marketStress'],
  },
  B: {
    name: 'Flow & Participation',
    icon: Waves,
    color: 'green',
    labs: ['volume', 'flow', 'momentum', 'participation'],
  },
  C: {
    name: 'Smart Money & Risk',
    icon: Target,
    color: 'purple',
    labs: ['whale', 'accumulation', 'manipulation', 'liquidation'],
  },
  D: {
    name: 'Price Behavior',
    icon: TrendingUp,
    color: 'orange',
    labs: ['corridor', 'supportResistance', 'priceAcceptance'],
  },
  E: {
    name: 'Meta / Quality',
    icon: Shield,
    color: 'gray',
    labs: ['dataQuality', 'signalConflict', 'stability'],
  },
};

// Lab display names
const LAB_NAMES = {
  regime: 'Regime',
  volatility: 'Volatility',
  liquidity: 'Liquidity',
  marketStress: 'Market Stress',
  volume: 'Volume',
  flow: 'Flow',
  momentum: 'Momentum',
  participation: 'Participation',
  whale: 'Whale',
  accumulation: 'Accumulation',
  manipulation: 'Manipulation',
  liquidation: 'Liquidation',
  corridor: 'Corridor',
  supportResistance: 'Support/Resistance',
  priceAcceptance: 'Price Acceptance',
  dataQuality: 'Data Quality',
  signalConflict: 'Signal Conflict',
  stability: 'Stability',
};

// Lab descriptions for tooltips
const LAB_DESCRIPTIONS = {
  // Group A: Market Structure
  regime: 'Identifies current market phase: trend, range, accumulation or distribution. Helps understand the overall context for decision making.',
  volatility: 'Measures price amplitude and speed of change. HIGH_VOL means strong swings, NORMAL_VOL — stable market, PANIC — extreme volatility.',
  liquidity: 'Evaluates order book depth and market liquidity. THIN_LIQUIDITY means high slippage risk, DEEP_LIQUIDITY — safe order execution.',
  marketStress: 'Composite indicator of market tension. STABLE = low stress, STRESSED = elevated tension, CHAOTIC = high risk of sharp moves.',
  
  // Group B: Flow & Participation
  volume: 'Analyzes trading volume relative to average. NO_CONFIRMATION = low volume, STRONG_CONFIRMATION = volume-confirmed movement.',
  flow: 'Tracks order flow direction (buys vs sells). BUY_DOMINANT = buyers prevail, SELL_DOMINANT = sellers prevail.',
  momentum: 'Measures price movement strength and speed. ACCELERATING = trend strengthening, DECELERATING = slowing down, STALLED = no impulse.',
  participation: 'Evaluates market breadth — how many participants support the move. NARROW = limited participation, broad = healthy trend.',
  
  // Group C: Smart Money & Risk
  whale: 'Detects large player activity through big trades and OI changes. NO_WHALES = no whale activity, whale activity may signal reversal.',
  accumulation: 'Identifies smart money accumulation/distribution phases. ACCUMULATION = large buying, DISTRIBUTION = large selling.',
  manipulation: 'Detects manipulation signs: spoofing, wash trading, pump & dump. CLEAN = fair market, MANIPULATION = anomalies detected.',
  liquidation: 'Tracks liquidations and cascade liquidation risk. BALANCED = stable, CASCADE_RISK = high chain liquidation risk.',
  
  // Group D: Price Behavior
  corridor: 'Identifies current price corridor/range. INSIDE_RANGE = within bounds, BREAKOUT = range exit.',
  supportResistance: 'Analyzes key support and resistance levels. Shows proximity to important levels and their strength.',
  priceAcceptance: 'Evaluates market acceptance of current prices. STABLE = price accepted, UNSTABLE = market "doesn\'t believe" current levels.',
  
  // Group E: Meta / Quality
  dataQuality: 'Evaluates input data quality and completeness. UNTRUSTED = unreliable data, decisions may be faulty.',
  signalConflict: 'Determines signal consistency between indicators. ALIGNED = all agree, STRONG_CONFLICT = contradictory signals.',
  stability: 'Measures indicator reading stability. STABLE = consistent signals, FRAGILE = frequent state changes.',
};

// Group descriptions
const GROUP_DESCRIPTIONS = {
  A: 'Market structure analysis: phase, volatility, liquidity and overall stress level',
  B: 'Capital flows: volume, order direction, momentum and participation breadth',
  C: 'Large player activity: whales, accumulation/distribution, manipulation, liquidations',
  D: 'Price behavior: corridors, support/resistance levels, price acceptance',
  E: 'Meta-indicators: data quality, signal conflicts, reading stability',
};

// State colors for badges
const STATE_COLORS = {
  // Positive states
  STRONG_CONFIRMATION: 'bg-green-100 text-green-700',
  ACCUMULATION: 'bg-green-100 text-green-700',
  DEEP_LIQUIDITY: 'bg-green-100 text-green-700',
  STABLE: 'bg-green-100 text-green-700',
  ALIGNED: 'bg-green-100 text-green-700',
  CLEAN: 'bg-green-100 text-green-700',
  BUY_DOMINANT: 'bg-green-100 text-green-700',
  ACCELERATING: 'bg-green-100 text-green-700',
  TRENDING_UP: 'bg-green-100 text-green-700',
  
  // Neutral states
  NORMAL_VOL: 'bg-gray-100 text-gray-700',
  NORMAL_LIQUIDITY: 'bg-gray-100 text-gray-700',
  BALANCED: 'bg-gray-100 text-gray-700',
  NEUTRAL: 'bg-gray-100 text-gray-700',
  RANGE: 'bg-gray-100 text-gray-700',
  INSIDE_RANGE: 'bg-gray-100 text-gray-700',
  WEAK_CONFIRMATION: 'bg-yellow-100 text-yellow-700',
  NARROW_PARTICIPATION: 'bg-yellow-100 text-yellow-700',
  PARTIAL_CONFLICT: 'bg-yellow-100 text-yellow-700',
  
  // Warning states
  HIGH_VOL: 'bg-orange-100 text-orange-700',
  THIN_LIQUIDITY: 'bg-orange-100 text-orange-700',
  STRESSED: 'bg-orange-100 text-orange-700',
  DISTRIBUTION: 'bg-orange-100 text-orange-700',
  SELL_DOMINANT: 'bg-orange-100 text-orange-700',
  DECELERATING: 'bg-orange-100 text-orange-700',
  TRENDING_DOWN: 'bg-orange-100 text-orange-700',
  FRAGILE: 'bg-orange-100 text-orange-700',
  PARTIAL: 'bg-orange-100 text-orange-700',
  
  // Critical states
  PANIC: 'bg-red-100 text-red-700',
  CASCADE_RISK: 'bg-red-100 text-red-700',
  MANIPULATION: 'bg-red-100 text-red-700',
  STRONG_CONFLICT: 'bg-red-100 text-red-700',
  UNSTABLE: 'bg-red-100 text-red-700',
  DEGRADED: 'bg-red-100 text-red-700',
  UNTRUSTED: 'bg-red-100 text-red-700',
  CHAOTIC: 'bg-red-100 text-red-700',
  
  // Default
  default: 'bg-blue-100 text-blue-700',
};

function getStateColor(state) {
  return STATE_COLORS[state] || STATE_COLORS.default;
}

// Single Lab Card component with tooltip - FomoAI Style
function LabCard({ labName, labData, onClick }) {
  const description = LAB_DESCRIPTIONS[labName] || 'No description available';
  
  if (!labData) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="opacity-50 cursor-help bg-white border border-gray-200/80 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-500">{LAB_NAMES[labName] || labName}</span>
                  <Badge variant="outline" className="text-gray-400">No Data</Badge>
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs bg-gray-900 text-white border-0">
            <p className="text-xs">{description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const { state, confidence, explain, risks } = labData;

  return (
    <Card 
      className="bg-white border border-gray-200/80 rounded-xl shadow-sm hover:border-blue-300 cursor-pointer transition-all card-hover"
      onClick={() => onClick(labName)}
      data-testid={`lab-card-${labName}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-gray-900">{LAB_NAMES[labName] || labName}</span>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="inline-flex">
                    <Info className="w-3.5 h-3.5 text-gray-400 cursor-help hover:text-gray-600" data-testid={`lab-info-${labName}`} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs bg-gray-900 text-white border-0">
                  <p className="text-xs">{description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Badge className={getStateColor(state)}>
            {state?.replace(/_/g, ' ')}
          </Badge>
        </div>
        
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Confidence</span>
            <span className="font-medium">{(confidence * 100).toFixed(0)}%</span>
          </div>
          <Progress value={confidence * 100} className="h-1.5" />
        </div>
        
        <p className="text-xs text-gray-600 line-clamp-2 mb-2">
          {explain?.summary || 'No summary available'}
        </p>
        
        {risks && risks.length > 0 && (
          <div className="flex items-center gap-1 p-1.5 bg-orange-50 rounded-lg">
            <AlertTriangle className="w-3 h-3 text-orange-500" />
            <span className="text-xs text-orange-600">{risks.length} risk(s)</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Lab Detail Modal/Panel
function LabDetailPanel({ labName, labData, onClose }) {
  if (!labData) return null;

  const { state, confidence, signals, risks, explain, meta } = labData;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <Card className="w-full max-w-lg m-4" onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              {LAB_NAMES[labName] || labName} Lab
            </CardTitle>
            <Badge className={getStateColor(state)}>
              {state?.replace(/_/g, ' ')}
            </Badge>
          </div>
          <CardDescription>{explain?.summary}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Confidence */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Confidence</span>
              <span className="font-semibold">{(confidence * 100).toFixed(0)}%</span>
            </div>
            <Progress value={confidence * 100} className="h-2" />
          </div>

          {/* Signals */}
          {signals && Object.keys(signals).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Signals</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(signals).map(([key, value]) => (
                  <div key={key} className="p-2 bg-gray-50 rounded text-xs">
                    <span className="text-gray-500 block">{key}</span>
                    <span className="font-medium text-gray-900">
                      {typeof value === 'number' ? value.toFixed(2) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risks */}
          {risks && risks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Risks</h4>
              <div className="flex flex-wrap gap-1">
                {risks.map((risk, i) => (
                  <Badge key={i} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    {risk}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Details */}
          {explain?.details && explain.details.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Details</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                {explain.details.map((detail, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ChevronRight className="w-3 h-3 mt-0.5 text-gray-400" />
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Meta */}
          {meta && (
            <div className="pt-3 border-t border-gray-100 text-xs text-gray-500">
              <span>Symbol: {meta.symbol}</span>
              <span className="mx-2">•</span>
              <span>Timeframe: {meta.timeframe}</span>
              <span className="mx-2">•</span>
              <span>Data: {(meta.dataCompleteness * 100).toFixed(0)}%</span>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            Close
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LabsPageV3() {
  const [snapshot, setSnapshot] = useState(null);
  const [summary, setSummary] = useState(null);
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [selectedTimeframe, setSelectedTimeframe] = useState('15m');
  const [loading, setLoading] = useState(true);
  const [selectedLab, setSelectedLab] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/v10/exchange/labs/v3/all?symbol=${selectedSymbol}&timeframe=${selectedTimeframe}`);
      if (res.data?.ok) {
        setSnapshot(res.data.snapshot);
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Labs fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedSymbol, selectedTimeframe]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-blue-500 animate-spin" />
            <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-blue-300 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
          </div>
          <span className="text-sm text-gray-500 font-medium">Loading Labs data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50" data-testid="labs-page-v3" style={fadeInStyle}>
      {/* Header - FomoAI Style */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/80 px-6 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          {/* Left: Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 shadow-sm">
              <Database className="w-5 h-5 text-slate-700" />
              <span className="text-xl font-bold tracking-tight text-slate-800">Labs</span>
              <Badge variant="outline" className="text-xs bg-slate-200 text-slate-700 border-slate-300">
                18 instruments
              </Badge>
            </div>
            
            {/* Health indicator */}
            {summary && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${
                summary.overallHealth === 'healthy' ? 'bg-green-50 border-green-200' :
                summary.overallHealth === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                'bg-red-50 border-red-200'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  summary.overallHealth === 'healthy' ? 'bg-green-500' :
                  summary.overallHealth === 'warning' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`} />
                <span className={`text-xs font-medium ${
                  summary.overallHealth === 'healthy' ? 'text-green-700' :
                  summary.overallHealth === 'warning' ? 'text-yellow-700' :
                  'text-red-700'
                }`}>{summary.overallHealth.toUpperCase()}</span>
              </div>
            )}
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-3">
            <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Symbol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BTCUSDT">BTC/USDT</SelectItem>
                <SelectItem value="ETHUSDT">ETH/USDT</SelectItem>
                <SelectItem value="SOLUSDT">SOL/USDT</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5m">5m</SelectItem>
                <SelectItem value="15m">15m</SelectItem>
                <SelectItem value="1h">1h</SelectItem>
                <SelectItem value="4h">4h</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={fetchData}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
      {/* Summary Card */}
      {summary && summary.activeRisks?.length > 0 && (
        <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl shadow-sm" style={slideUpStyle}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <span className="font-semibold text-orange-800">Active Risks Detected</span>
                  <p className="text-xs text-orange-600">{summary.activeRisks.join(', ')}</p>
                </div>
              </div>
              <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                {summary.activeRisks.length} risks
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Labs Alerts Panel */}
      <LabsAlertsPanel symbol={selectedSymbol} />

      {/* Lab Groups */}
      {Object.entries(LAB_GROUPS).map(([groupKey, group], groupIdx) => {
        const GroupIcon = group.icon;
        const groupDescription = GROUP_DESCRIPTIONS[groupKey] || '';
        
        const colorClasses = {
          blue: 'bg-blue-100 text-blue-600',
          green: 'bg-green-100 text-green-600',
          purple: 'bg-purple-100 text-purple-600',
          orange: 'bg-orange-100 text-orange-600',
          gray: 'bg-gray-100 text-gray-600',
        };
        
        return (
          <div key={groupKey} className="space-y-3" style={{ ...slideUpStyle, animationDelay: `${(groupIdx + 1) * 100}ms` }}>
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${colorClasses[group.color]}`}>
                <GroupIcon className="w-4 h-4" />
              </div>
              <h2 className="font-semibold text-gray-900">
                Group {groupKey}: {group.name}
              </h2>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="inline-flex">
                      <Info className="w-4 h-4 text-gray-400 cursor-help hover:text-gray-600" data-testid={`group-info-${groupKey}`} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs bg-gray-900 text-white border-0">
                    <p className="text-xs">{groupDescription}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Badge variant="outline" className="text-xs">
                {group.labs.length} labs
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {group.labs.map((labName) => (
                <LabCard
                  key={labName}
                  labName={labName}
                  labData={snapshot?.labs?.[labName]}
                  onClick={setSelectedLab}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Disclaimer */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm" style={{ ...slideUpStyle, animationDelay: '600ms' }}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Lock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-blue-800">Labs Principle</p>
              <p className="text-sm text-blue-600">
                Labs do NOT make decisions. They describe market reality.
                For trading decisions, use FOMO AI. For interpretations, use Research.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Lab Detail Modal */}
      {selectedLab && snapshot?.labs?.[selectedLab] && (
        <LabDetailPanel
          labName={selectedLab}
          labData={snapshot.labs[selectedLab]}
          onClose={() => setSelectedLab(null)}
        />
      )}
    </div>
  );
}
