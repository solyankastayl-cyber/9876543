/**
 * Exchange Research Page v2
 * 
 * ТЕПЕРЬ ЧИТАЕТ ДАННЫЕ ИЗ LABS!
 * 
 * Research = интерпретация Labs
 * - Агрегирует выводы из 18 Labs
 * - Формирует гипотезы, НЕ решения
 * - Отвечает: "что здесь может происходить?"
 * 
 * Research НЕ может:
 * - говорить BUY / SELL
 * - давать confidence
 * 
 * Research может:
 * - говорить "есть основания для X"
 * - говорить "есть конфликт между A и B"
 * 
 * Style: FomoAI Design System
 */

import { useState, useEffect } from 'react';
import { 
  FlaskConical, RefreshCw, Loader2, TrendingUp, TrendingDown,
  AlertTriangle, Activity, Zap, Eye, ChevronRight, Waves,
  Target, BarChart3, Shield, GitBranch, Info, Beaker, TestTube2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/custom-select';
import { api } from '@/api/client';

/* ═══════════════════════════════════════════════════════════════
   CSS-in-JS styles for animations (FomoAI style)
═══════════════════════════════════════════════════════════════ */
const fadeInStyle = {
  animation: 'fadeIn 0.4s ease-out forwards',
};

const slideUpStyle = {
  animation: 'slideUp 0.5s ease-out forwards',
};

if (typeof document !== 'undefined' && !document.getElementById('research-animations')) {
  const style = document.createElement('style');
  style.id = 'research-animations';
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

// Hypothesis types derived from Labs
const HYPOTHESIS_TYPES = {
  ACCUMULATION: { label: 'Accumulation Phase', color: 'bg-blue-100 text-blue-700', icon: TrendingUp },
  DISTRIBUTION: { label: 'Distribution Phase', color: 'bg-purple-100 text-purple-700', icon: TrendingDown },
  LIQUIDITY_CONCERN: { label: 'Liquidity Concern', color: 'bg-orange-100 text-orange-700', icon: Waves },
  WHALE_ACTIVITY: { label: 'Whale Activity', color: 'bg-emerald-100 text-emerald-700', icon: Target },
  STRESS_ELEVATED: { label: 'Market Stress', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  MOMENTUM_SHIFT: { label: 'Momentum Shift', color: 'bg-amber-100 text-amber-700', icon: Activity },
  REGIME_TRANSITION: { label: 'Regime Transition', color: 'bg-indigo-100 text-indigo-700', icon: GitBranch },
  VOLUME_ANOMALY: { label: 'Volume Anomaly', color: 'bg-pink-100 text-pink-700', icon: BarChart3 },
  MANIPULATION_RISK: { label: 'Manipulation Risk', color: 'bg-red-100 text-red-700', icon: Shield },
  CONFLICT_DETECTED: { label: 'Signal Conflict', color: 'bg-yellow-100 text-yellow-700', icon: Zap },
};

// Generate hypotheses from Labs snapshot
function generateHypothesesFromLabs(labs) {
  const hypotheses = [];
  
  if (!labs) return hypotheses;

  // 1. Check Whale Lab
  if (labs.whale?.state === 'ACCUMULATION') {
    hypotheses.push({
      type: 'WHALE_ACTIVITY',
      confidence: labs.whale.confidence,
      description: labs.whale.explain?.summary || 'Whale accumulation detected',
      details: labs.whale.explain?.details || [],
      source: 'Whale Lab',
      labState: labs.whale.state,
      risks: labs.whale.risks || [],
    });
  } else if (labs.whale?.state === 'DISTRIBUTION') {
    hypotheses.push({
      type: 'DISTRIBUTION',
      confidence: labs.whale.confidence,
      description: labs.whale.explain?.summary || 'Whale distribution detected',
      details: labs.whale.explain?.details || [],
      source: 'Whale Lab',
      labState: labs.whale.state,
      risks: labs.whale.risks || [],
    });
  }

  // 2. Check Accumulation Lab
  if (labs.accumulation?.state === 'ACCUMULATION') {
    hypotheses.push({
      type: 'ACCUMULATION',
      confidence: labs.accumulation.confidence,
      description: labs.accumulation.explain?.summary || 'Accumulation pattern detected',
      details: labs.accumulation.explain?.details || [],
      source: 'Accumulation Lab',
      labState: labs.accumulation.state,
      risks: [],
    });
  }

  // 3. Check Liquidity Lab
  if (labs.liquidity?.state === 'THIN_LIQUIDITY' || labs.liquidity?.state === 'LIQUIDITY_GAPS') {
    hypotheses.push({
      type: 'LIQUIDITY_CONCERN',
      confidence: labs.liquidity.confidence,
      description: labs.liquidity.explain?.summary || 'Liquidity concerns detected',
      details: labs.liquidity.explain?.details || [],
      source: 'Liquidity Lab',
      labState: labs.liquidity.state,
      risks: labs.liquidity.risks || [],
    });
  }

  // 4. Check Market Stress Lab
  if (labs.marketStress?.state === 'STRESSED' || labs.marketStress?.state === 'PANIC') {
    hypotheses.push({
      type: 'STRESS_ELEVATED',
      confidence: labs.marketStress.confidence,
      description: labs.marketStress.explain?.summary || 'Market stress elevated',
      details: labs.marketStress.explain?.details || [],
      source: 'Market Stress Lab',
      labState: labs.marketStress.state,
      risks: labs.marketStress.risks || [],
    });
  }

  // 5. Check Momentum Lab
  if (labs.momentum?.state === 'REVERSAL_RISK' || labs.momentum?.state === 'DECELERATING') {
    hypotheses.push({
      type: 'MOMENTUM_SHIFT',
      confidence: labs.momentum.confidence,
      description: labs.momentum.explain?.summary || 'Momentum shift detected',
      details: labs.momentum.explain?.details || [],
      source: 'Momentum Lab',
      labState: labs.momentum.state,
      risks: labs.momentum.risks || [],
    });
  }

  // 6. Check Regime Lab
  if (labs.regime?.state === 'TRANSITION' || labs.regime?.state === 'CHAOTIC') {
    hypotheses.push({
      type: 'REGIME_TRANSITION',
      confidence: labs.regime.confidence,
      description: labs.regime.explain?.summary || 'Market regime in transition',
      details: labs.regime.explain?.details || [],
      source: 'Regime Lab',
      labState: labs.regime.state,
      risks: labs.regime.risks || [],
    });
  }

  // 7. Check Volume Lab
  if (labs.volume?.state === 'ANOMALY' || labs.volume?.state === 'NO_CONFIRMATION') {
    hypotheses.push({
      type: 'VOLUME_ANOMALY',
      confidence: labs.volume.confidence,
      description: labs.volume.explain?.summary || 'Volume anomaly detected',
      details: labs.volume.explain?.details || [],
      source: 'Volume Lab',
      labState: labs.volume.state,
      risks: labs.volume.risks || [],
    });
  }

  // 8. Check Manipulation Lab
  if (labs.manipulation?.state !== 'CLEAN') {
    hypotheses.push({
      type: 'MANIPULATION_RISK',
      confidence: labs.manipulation.confidence,
      description: labs.manipulation.explain?.summary || 'Manipulation risk detected',
      details: labs.manipulation.explain?.details || [],
      source: 'Manipulation Lab',
      labState: labs.manipulation.state,
      risks: labs.manipulation.risks || [],
    });
  }

  // 9. Check Signal Conflict Lab
  if (labs.signalConflict?.state !== 'ALIGNED') {
    hypotheses.push({
      type: 'CONFLICT_DETECTED',
      confidence: labs.signalConflict.confidence,
      description: labs.signalConflict.explain?.summary || 'Signal conflicts detected',
      details: labs.signalConflict.explain?.details || [],
      source: 'Signal Conflict Lab',
      labState: labs.signalConflict.state,
      risks: [],
    });
  }

  return hypotheses;
}

// Generate narrative summary from Labs
function generateNarrative(labs, hypotheses) {
  if (!labs) return null;

  const parts = [];
  
  // Market structure
  if (labs.regime) {
    const regimeText = {
      'TRENDING_UP': 'in an uptrend',
      'TRENDING_DOWN': 'in a downtrend',
      'RANGE': 'ranging sideways',
      'TRANSITION': 'in transition',
      'CHAOTIC': 'showing chaotic behavior',
    };
    parts.push(`Market is ${regimeText[labs.regime.state] || labs.regime.state.toLowerCase()}`);
  }

  // Volatility
  if (labs.volatility) {
    if (labs.volatility.state === 'HIGH_VOL') {
      parts.push('with elevated volatility');
    } else if (labs.volatility.state === 'LOW_VOL') {
      parts.push('with low volatility');
    }
  }

  // Flow
  if (labs.flow) {
    if (labs.flow.state === 'BUY_DOMINANT') {
      parts.push('Buyers dominating');
    } else if (labs.flow.state === 'SELL_DOMINANT') {
      parts.push('Sellers dominating');
    }
  }

  // Risks
  const allRisks = hypotheses.flatMap(h => h.risks).filter(Boolean);
  if (allRisks.length > 0) {
    parts.push(`Active risks: ${allRisks.slice(0, 3).join(', ')}`);
  }

  return parts.length > 0 ? parts.join('. ') + '.' : 'Market within normal parameters.';
}

export default function ExchangeResearchPage() {
  const [labsSnapshot, setLabsSnapshot] = useState(null);
  const [summary, setSummary] = useState(null);
  const [hypotheses, setHypotheses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState('BTCUSDT');
  const [selectedTimeframe, setSelectedTimeframe] = useState('15m');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all Labs data
      const res = await api.get(`/api/v10/exchange/labs/v3/all?symbol=${selectedAsset}&timeframe=${selectedTimeframe}`);
      
      if (res.data?.ok) {
        setLabsSnapshot(res.data.snapshot);
        setSummary(res.data.summary);
        
        // Generate hypotheses from Labs
        const generated = generateHypothesesFromLabs(res.data.snapshot?.labs);
        setHypotheses(generated);
      }
    } catch (err) {
      console.error('Research fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [selectedAsset, selectedTimeframe]);

  const narrative = generateNarrative(labsSnapshot?.labs, hypotheses);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-purple-500 animate-spin" />
            <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-purple-300 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
          </div>
          <span className="text-sm text-gray-500 font-medium">Loading research data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50" data-testid="exchange-research" style={fadeInStyle}>
      {/* Header - FomoAI Style */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/80 px-6 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          {/* Left: Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 shadow-sm">
              <FlaskConical className="w-5 h-5 text-slate-700" />
              <span className="text-xl font-bold tracking-tight text-slate-800">Research</span>
            </div>
            
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-lg border border-slate-200 cursor-help">
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs font-medium text-slate-600">Interpretations</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-900 text-white border-0 shadow-xl max-w-xs">
                  <p className="text-xs">Research does NOT make decisions — for trading signals use FOMO AI</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-3">
            <Select value={selectedAsset} onValueChange={setSelectedAsset}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Asset" />
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
      {/* Disclaimer */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl shadow-sm" style={slideUpStyle}>
        <div className="p-2 bg-purple-100 rounded-lg">
          <Eye className="w-5 h-5 text-purple-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-purple-800">Research Mode — Powered by Labs</p>
          <p className="text-xs text-purple-600">
            These interpretations are derived from 18 autonomous Labs. 
            Research does NOT make decisions — for trading signals use FOMO AI.
          </p>
        </div>
        <Badge variant="outline" className="border-purple-300 text-purple-700 bg-purple-100/50">
          Experimental
        </Badge>
      </div>

      {/* Narrative Summary */}
      {narrative && (
        <Card className="bg-white border border-gray-200/80 rounded-xl shadow-sm card-hover" style={{ ...slideUpStyle, animationDelay: '100ms' }}>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              Market Narrative
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger><Info className="w-4 h-4 text-gray-400 cursor-help" /></TooltipTrigger>
                  <TooltipContent className="bg-gray-900 text-white border-0">
                    <p className="text-xs">AI-generated market summary</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </h3>
            <p className="text-gray-700">{narrative}</p>
            {summary && (
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    summary.overallHealth === 'healthy' ? 'bg-green-500' :
                    summary.overallHealth === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="text-xs text-gray-500">
                    System: {summary.overallHealth}
                  </span>
                </div>
                {summary.activeRisks?.length > 0 && (
                  <span className="text-xs text-orange-600">
                    {summary.activeRisks.length} active risks
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Hypotheses from Labs */}
      <Card className="bg-white border border-gray-200/80 rounded-xl shadow-sm" style={{ ...slideUpStyle, animationDelay: '200ms' }}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 rounded-lg">
              <Beaker className="w-4 h-4 text-amber-600" />
            </div>
            <CardTitle className="text-gray-800">Active Hypotheses</CardTitle>
          </div>
          <CardDescription>
            Interpretations derived from Lab analysis — sorted by confidence
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hypotheses.length > 0 ? (
            <div className="space-y-3">
              {hypotheses
                .sort((a, b) => b.confidence - a.confidence)
                .map((h, idx) => {
                  const config = HYPOTHESIS_TYPES[h.type] || HYPOTHESIS_TYPES.CONFLICT_DETECTED;
                  const Icon = config.icon;
                  
                  return (
                    <div
                      key={idx}
                      className="p-4 bg-white border border-gray-200/80 rounded-xl hover:border-gray-300 transition-all card-hover"
                      style={{ ...slideUpStyle, animationDelay: `${300 + idx * 50}ms` }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${config.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">{config.label}</span>
                            <Badge variant="outline" className="text-xs">
                              {(h.confidence * 100).toFixed(0)}% confidence
                            </Badge>
                            <Badge variant="outline" className="text-xs bg-gray-50">
                              {h.labState}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{h.description}</p>
                          
                          {/* Details from Lab */}
                          {h.details && h.details.length > 0 && (
                            <ul className="text-xs text-gray-500 space-y-0.5 mb-2">
                              {h.details.map((d, i) => (
                                <li key={i} className="flex items-center gap-1">
                                  <ChevronRight className="w-3 h-3" />
                                  {d}
                                </li>
                              ))}
                            </ul>
                          )}
                          
                          {/* Risks */}
                          {h.risks && h.risks.length > 0 && (
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-3 h-3 text-orange-500" />
                              <span className="text-xs text-orange-600">
                                Risks: {h.risks.join(', ')}
                              </span>
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-400 mt-2">
                            Source: {h.source}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FlaskConical className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No active hypotheses</p>
              <p className="text-sm text-gray-400 mt-1">
                All Labs report normal market conditions
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Labs Summary Grid */}
      <Card className="bg-white border border-gray-200/80 rounded-xl shadow-sm" style={{ ...slideUpStyle, animationDelay: '400ms' }}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 rounded-lg">
              <TestTube2 className="w-4 h-4 text-indigo-600" />
            </div>
            <CardTitle className="text-gray-800">Labs Status Overview</CardTitle>
          </div>
          <CardDescription>Current state of all 18 Labs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {labsSnapshot?.labs && Object.entries(labsSnapshot.labs).map(([name, lab]) => (
              <div
                key={name}
                className="p-2 bg-gray-50 rounded-xl text-center hover:bg-gray-100 transition-colors"
                title={lab.explain?.summary}
              >
                <span className="text-xs text-gray-500 block truncate">{name}</span>
                <span className={`text-xs font-medium block truncate ${
                  lab.confidence > 0.7 ? 'text-green-600' :
                  lab.confidence > 0.5 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {lab.state?.replace(/_/g, ' ').slice(0, 12)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links - Enhanced icons */}
      <Card className="bg-white border border-gray-200/80 rounded-xl shadow-sm" style={{ ...slideUpStyle, animationDelay: '500ms' }}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-cyan-100 rounded-lg">
              <Zap className="w-4 h-4 text-cyan-600" />
            </div>
            <CardTitle className="text-gray-800">Explore Instruments</CardTitle>
          </div>
          <CardDescription>Dive deeper with individual Labs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'All Labs', description: '18 instruments', icon: FlaskConical, path: '/exchange/labs', gradient: 'from-purple-500 to-violet-600' },
              { label: 'Volume Analysis', description: 'Flow patterns', icon: BarChart3, path: '/exchange/labs?focus=volume', gradient: 'from-blue-500 to-cyan-600' },
              { label: 'Whale Tracker', description: 'Smart money', icon: Target, path: '/exchange/labs?focus=whale', gradient: 'from-emerald-500 to-teal-600' },
              { label: 'Regime Detector', description: 'Market state', icon: TrendingUp, path: '/exchange/labs?focus=regime', gradient: 'from-orange-500 to-amber-600' },
            ].map((tool) => (
              <a
                key={tool.label}
                href={tool.path}
                className="group p-4 bg-white border border-gray-200 rounded-xl text-center transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-gray-300"
              >
                <div className={`p-3 rounded-xl bg-gradient-to-br ${tool.gradient} w-fit mx-auto mb-3 shadow-lg group-hover:shadow-xl transition-shadow`}>
                  <tool.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-900 block">{tool.label}</span>
                <span className="text-xs text-gray-500">{tool.description}</span>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
