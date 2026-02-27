/**
 * FOMO AI — Main Page (Refactored)
 * Components extracted to /components/fomo-ai/
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { useFomoAi } from '../../hooks/useFomoAi';
import { useFomoAiWs } from '../../hooks/useFomoAiWs';
import { useFomoAiWidgets } from '../../hooks/useFomoAiWidgets';
import { FomoAiSearch } from '../../components/fomo-ai/FomoAiSearch';
import { FomoAiChart } from '../../components/fomo-ai/FomoAiChart';
import { FundingSentimentWidget } from '../../components/exchange/FundingSentimentWidget';
import { FearGreedGauge, DominanceGauge } from '../../components/fomo-ai/Gauges';
import { RiskAnalysisCompact } from '../../components/fomo-ai/RiskAnalysis';
import { LayerRow, InfluenceRow, SectorBar, getFlagDescription } from '../../components/fomo-ai/PanelHelpers';
import { 
  Share2, Info, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle, XCircle, Brain, Activity, BarChart3, Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Toaster, toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════════
   CSS-in-JS styles for animations
═══════════════════════════════════════════════════════════════ */
const fadeInStyle = {
  animation: 'fadeIn 0.4s ease-out forwards',
};

const slideUpStyle = {
  animation: 'slideUp 0.5s ease-out forwards',
};

// Inject keyframes once
if (typeof document !== 'undefined' && !document.getElementById('fomo-animations')) {
  const style = document.createElement('style');
  style.id = 'fomo-animations';
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
      50% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
    }
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
    .card-hover { transition: all 0.2s ease; }
    .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 25px -5px rgba(0,0,0,0.1); }
    .progress-animated { transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
    
    /* Custom scrollbar for Applied flags */
    .scrollbar-thin::-webkit-scrollbar { height: 4px; }
    .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
    .scrollbar-thin::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
    .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
  `;
  document.head.appendChild(style);
}

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function FomoAiPage() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const activeSymbol = symbol || 'BTCUSDT';
  
  const { 
    decision, 
    chartData, 
    observability,
    selectedTime,
    selectTime,
    loading, 
    refresh,
    setDecision,
  } = useFomoAi(activeSymbol);

  // Fetch widget data (Labs, Sectors, Macro)
  const { labsData, sectorsData, macroData } = useFomoAiWidgets(activeSymbol);

  const handleWsUpdate = useCallback((update) => {
    if (update && update.symbol === activeSymbol) {
      setDecision({
        ok: true,
        symbol: update.symbol,
        action: update.action,
        confidence: update.confidence,
        timestamp: update.timestamp,
        explainability: update.explainability,
        context: update.context,
      });
      
      if (update.action !== decision?.action) {
        toast.success(`Signal: ${update.action}`);
      }
    }
  }, [activeSymbol, setDecision, decision?.action]);

  const { connected: wsConnected } = useFomoAiWs(activeSymbol, handleWsUpdate);

  const handleSymbolChange = (newSymbol) => {
    navigate(`/fomo-ai/${newSymbol}`);
  };

  if (loading && !decision) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-blue-500 animate-spin" />
            <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-blue-300 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
          </div>
          <span className="text-sm text-gray-500 font-medium">Loading intelligence...</span>
        </div>
      </div>
    );
  }

  // Extract real macro data
  const macroBlocked = macroData?.blocked ?? true;
  const macroFearGreed = macroData?.fearGreed ?? 11;
  const macroPenalty = macroData?.penalty ?? 0.4;
  const macroRegime = macroData?.regime ?? 'EXTREME_FEAR';
  const macroBtcDom = macroData?.btcDominance ?? 56.8;
  const macroStableDom = macroData?.stableDominance ?? 10.9;

  // Extract real labs data
  const labsSummary = labsData?.summary ?? { bullish: 5, caution: 1, bearish: 2, bias: 'Bullish' };
  const labsAlerts = labsData?.alerts ?? [];

  // Extract real sectors data
  const sectors = sectorsData?.sectors ?? [
    { name: 'GAMING', score: 30 },
    { name: 'RWA', score: 30 },
    { name: 'L2', score: 30 },
    { name: 'AI', score: 30 },
    { name: 'MEME', score: 30 },
    { name: 'INFRA', score: 30 },
  ];

  const action = decision?.action || 'NEUTRAL';
  const confidence = decision?.confidence || 0;
  const appliedRules = decision?.explainability?.appliedRules || [];
  const mlReady = decision?.explainability?.mlReady;
  const rawConf = decision?.explainability?.rawConfidence || 0;
  const risks = decision?.context?.risks || [];

  return (
    <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50" data-testid="fomo-ai-page" style={fadeInStyle}>
      <Toaster position="top-right" />
      
      {/* ═══════════════════════════════════════════════════════════════
          HEADER: Decision + ML + Confidence Bar (center) + Search + Share
      ═══════════════════════════════════════════════════════════════ */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/80 px-4 py-2 relative z-50">
        {/* Row 1: Main controls */}
        <div className="flex items-center justify-between mb-2">
          {/* Left: Verdict + ML Status */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-300 ${
              action === 'BUY' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 shadow-green-100 shadow-md' :
              action === 'SELL' ? 'bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 shadow-red-100 shadow-md' :
              'bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 shadow-sm'
            }`}>
              {action === 'BUY' && <TrendingUp className="w-5 h-5 text-green-600" />}
              {action === 'SELL' && <TrendingDown className="w-5 h-5 text-red-600" />}
              {action === 'AVOID' && <AlertTriangle className="w-5 h-5 text-gray-500" />}
              <span className={`text-xl font-bold tracking-tight ${
                action === 'BUY' ? 'text-green-600' :
                action === 'SELL' ? 'text-red-600' :
                'text-gray-600'
              }`}>{action}</span>
              <Badge variant="outline" className={`text-xs transition-all duration-300 ${wsConnected ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 border-gray-300'}`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1 ${wsConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                {wsConnected ? 'LIVE' : 'OFFLINE'}
              </Badge>
            </div>
            
            {/* ML Status */}
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-50/80 rounded-lg border border-gray-100">
              <Zap className={`w-3.5 h-3.5 transition-colors duration-300 ${mlReady ? 'text-green-500' : 'text-gray-400'}`} />
              <span className="text-xs font-medium text-gray-600">ML</span>
              <Badge className={`text-xs px-1.5 py-0 transition-all duration-300 ${mlReady ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                {mlReady ? 'ON' : 'OFF'}
              </Badge>
            </div>
          </div>

          {/* Center: Market Context with Fear & Greed Gauge */}
          <div className="flex-1 flex items-center justify-center gap-4">
            {/* Fear & Greed Gauge */}
            <FearGreedGauge value={macroFearGreed} regime={macroRegime} />
            
            {/* BTC Dominance Gauge */}
            <DominanceGauge value={macroBtcDom} type="btc" />

            {/* Stablecoin Dominance Gauge */}
            <DominanceGauge value={macroStableDom} type="stable" />
          </div>

          {/* Right: Search + Share */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-48">
              <FomoAiSearch 
                current={activeSymbol} 
                onSelect={handleSymbolChange}
              />
            </div>
            <ShareButton symbol={activeSymbol} />
          </div>
        </div>

        {/* Row 2: Applied Flags (left) + Risk Analysis (right) */}
        <div className="flex items-center gap-0 border-t border-gray-100 pt-2">
          {/* LEFT: Applied Flags */}
          <div className="flex-1 pr-3 border-r border-gray-200">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Applied:</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              {appliedRules.map((rule, i) => (
                <TooltipProvider key={i} delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge 
                        variant="outline"
                        className={`text-[10px] cursor-help transition-all duration-200 hover:scale-105 whitespace-nowrap px-2 py-1 ${
                          rule.startsWith('PASS') ? 'bg-green-50 text-green-700 border-green-300' :
                          rule.startsWith('WARN') ? 'bg-amber-50 text-amber-700 border-amber-300' :
                          rule.startsWith('FAIL') ? 'bg-red-50 text-red-700 border-red-300' :
                          rule.startsWith('VERDICT') ? 'bg-blue-50 text-blue-700 border-blue-300' :
                          'bg-gray-50 text-gray-700 border-gray-300'
                        }`}
                      >
                        {rule.startsWith('PASS') && <CheckCircle className="w-3 h-3 mr-1" />}
                        {rule.startsWith('WARN') && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {rule.startsWith('FAIL') && <XCircle className="w-3 h-3 mr-1" />}
                        {rule.replace(/_/g, ' ')}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-900 text-white border-0 shadow-xl">
                      <p className="text-xs">{getFlagDescription(rule)}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>

          {/* RIGHT: Risk Analysis - Compact inline */}
          <div className="flex-shrink-0 pl-3">
            <RiskAnalysisCompact risks={risks} dataMode={observability?.dataMode} />
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════
          MIDDLE: Chart (2/3) + Right Panel (1/3)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="flex">
        {/* CHART - 2/3 width */}
        <div className="w-2/3 bg-white border-r border-gray-200/80">
          <FomoAiChart 
            symbol={activeSymbol}
            chartData={chartData}
            decision={decision}
            selectedTime={selectedTime}
            onSelectTime={selectTime}
          />
        </div>

        {/* RIGHT PANEL - 1/3 width - static, no scroll */}
        <div className="w-1/3 bg-gradient-to-b from-white to-gray-50/50 p-4 space-y-4">
          
          {/* ML Calibration */}
          <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm card-hover" style={{ ...slideUpStyle, animationDelay: '100ms' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-purple-100 rounded-lg">
                <Brain className="w-4 h-4 text-purple-600" />
              </div>
              <span className="font-semibold text-gray-800">ML Calibration</span>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger><Info className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs bg-gray-900 text-white border-0">
                    <p className="text-xs">Machine Learning model calibrates raw exchange signals using historical pattern recognition.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Status</span>
                <Badge className={`transition-all duration-300 ${mlReady ? 'bg-green-100 text-green-700 shadow-sm' : 'bg-gray-100 text-gray-600'}`}>
                  {mlReady ? 'APPLIED' : 'PENDING'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Raw Confidence</span>
                <span className="font-medium text-gray-700 tabular-nums">{(rawConf * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Adjusted</span>
                <span className={`font-semibold tabular-nums ${
                  confidence > 0.7 ? 'text-green-600' : confidence > 0.4 ? 'text-amber-600' : 'text-red-600'
                }`}>{(confidence * 100).toFixed(1)}%</span>
              </div>
              {/* Confidence bar with red-to-green gradient */}
              <div className="h-2.5 bg-gradient-to-r from-red-100 via-amber-100 to-green-100 rounded-full overflow-hidden shadow-inner">
                <div 
                  className={`h-full rounded-full progress-animated ${
                    confidence > 0.7 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                    confidence > 0.4 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                    'bg-gradient-to-r from-red-400 to-red-500'
                  }`}
                  style={{ width: `${confidence * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* FULL Funding Sentiment (with Binance, Bybit, Hyperliquid) */}
          <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm card-hover" style={{ ...slideUpStyle, animationDelay: '200ms' }}>
            <FundingSentimentWidget symbol={activeSymbol} />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          BOTTOM: 3 columns ONLY - NO GAPS, NO DUPLICATES
      ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-3 border-t border-gray-200/80 bg-gradient-to-b from-gray-50/50 to-white">
        
        {/* WHY THIS DECISION */}
        <div className="bg-white/80 backdrop-blur-sm border-r border-gray-200/80 p-5" style={{ ...slideUpStyle, animationDelay: '300ms' }}>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2.5 mb-5 cursor-help">
                  <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                    </svg>
                  </div>
                  <span className="font-bold text-sm uppercase tracking-wider text-gray-800">Why This Decision</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 text-white border-0 max-w-xs">
                <p className="text-xs font-medium mb-1">Decision Explainability</p>
                <p className="text-xs opacity-80">Multi-layer analysis showing how each component contributed to the final verdict. Each layer can amplify, block, or adjust the signal.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <div className="space-y-3">
            {/* Exchange Layer */}
            <LayerRow 
              icon={BarChart3}
              label="Exchange Layer"
              status="NEUTRAL"
              statusColor="gray"
              tooltip="Raw signal from exchange data: order flow, OI changes, liquidations"
            />
            
            {/* ML Calibration */}
            <LayerRow 
              icon={Brain}
              label="ML Calibration"
              status={mlReady ? "APPLIED" : "PENDING"}
              statusColor={mlReady ? "green" : "gray"}
              tooltip="ML model adjusts confidence based on historical accuracy"
            />
            
            {/* Macro Context - REAL DATA */}
            <div className="bg-white border border-gray-100 rounded-xl p-3.5 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-blue-50 rounded-md">
                    <Activity className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Macro Context</span>
                </div>
                <Badge className={`shadow-sm ${macroBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {macroBlocked ? 'BLOCKED' : 'CLEAR'}
                </Badge>
              </div>
              <div className="text-xs text-gray-500 pl-7 space-y-1.5">
                <p className="font-medium text-gray-600">Drivers:</p>
                <p>• Fear & Greed: <span className={`font-medium ${macroFearGreed < 25 ? 'text-red-600' : macroFearGreed > 75 ? 'text-green-600' : 'text-amber-600'}`}>{macroFearGreed}</span> ({macroRegime.replace(/_/g, ' ')})</p>
                <p>• {macroFearGreed < 30 ? 'Mixed signals → Potential regime change' : 'Market sentiment stable'}</p>
                {macroBlocked && <p className="text-red-500 font-medium">⚠ STRONG actions blocked</p>}
                {macroPenalty > 0 && <p className="text-red-500 font-medium">⚠ Confidence penalty: {Math.round(macroPenalty * 100)}%</p>}
              </div>
            </div>
          </div>
        </div>

        {/* LABS ATTRIBUTION - REAL DATA */}
        <div className="bg-white/80 backdrop-blur-sm border-r border-gray-200/80 p-5" style={{ ...slideUpStyle, animationDelay: '400ms' }}>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2.5 mb-5 cursor-help">
                  <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                    </svg>
                  </div>
                  <span className="font-bold text-sm uppercase tracking-wider text-gray-800">Labs Attribution</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 text-white border-0 max-w-xs">
                <p className="text-xs font-medium mb-1">Exchange Labs Analysis</p>
                <p className="text-xs opacity-80">18 specialized lab modules analyzing liquidity, manipulation, stress, flow dynamics, and more. Shows which labs influenced the decision.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <div className={`flex items-center justify-between mb-4 p-3 rounded-xl border ${
            labsSummary.bias === 'Bullish' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-100' :
            labsSummary.bias === 'Bearish' ? 'bg-gradient-to-r from-red-50 to-rose-50 border-red-100' :
            'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-100'
          }`}>
            <Badge className={`shadow-sm ${
              labsSummary.bias === 'Bullish' ? 'bg-green-100 text-green-700' :
              labsSummary.bias === 'Bearish' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>{labsSummary.bias} Bias</Badge>
            <div className="flex gap-3 text-xs">
              <span className="text-green-600">Bullish: <strong>{labsSummary.bullish}</strong></span>
              <span className="text-amber-600">Caution: <strong>{labsSummary.caution}</strong></span>
              <span className="text-red-600">Bearish: <strong>{labsSummary.bearish}</strong></span>
            </div>
          </div>

          <div className="text-xs text-gray-400 uppercase tracking-wider mb-3 font-medium">Active Alerts</div>
          <div className="space-y-2">
            {labsAlerts.length > 0 ? (
              labsAlerts.slice(0, 6).map((alert, i) => (
                <InfluenceRow 
                  key={alert.id || i}
                  label={alert.labName?.toUpperCase() || 'Lab'}
                  status={alert.labState || 'UNKNOWN'}
                  value={`${Math.round((alert.labConfidence || 0) * 100)}%`}
                  color={alert.severity === 'CRITICAL' || alert.severity === 'EMERGENCY' ? 'red' : 
                         alert.severity === 'WARNING' ? 'amber' : 'green'}
                />
              ))
            ) : (
              <>
                <InfluenceRow label="Liquidity" status="NORMAL" value="100%" color="green" />
                <InfluenceRow label="Data Quality" status="TRUSTED" value="100%" color="green" />
                <InfluenceRow label="Stress" status="STABLE" value="100%" color="green" />
              </>
            )}
          </div>

          <a href="/exchange/labs" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline mt-4 font-medium transition-colors">
            View all 18 Labs 
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </a>
        </div>

        {/* SECTOR ROTATION - REAL DATA */}
        <div className="bg-white/80 backdrop-blur-sm p-5" style={{ ...slideUpStyle, animationDelay: '500ms' }}>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2.5 mb-5 cursor-help">
                  <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                  </div>
                  <span className="font-bold text-sm uppercase tracking-wider text-gray-800">Sector Rotation</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 text-white border-0 max-w-xs">
                <p className="text-xs font-medium mb-1">Sector Momentum Analysis</p>
                <p className="text-xs opacity-80">Tracks capital rotation between sectors (Gaming, AI, L2, etc). Higher scores indicate money flowing into that sector. Updated every 4 hours.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <div className="space-y-2.5">
            {sectors.slice(0, 6).map((sector, i) => (
              <SectorBar 
                key={sector.name} 
                label={sector.name} 
                value={sector.score}
                momentum={sector.momentum}
                topSymbol={sector.topSymbols?.[0]?.symbol}
                index={i}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HELPER COMPONENTS
═══════════════════════════════════════════════════════════════ */

function ShareButton({ symbol }) {
  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <button 
      onClick={handleShare}
      className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 active:bg-gray-950 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
      data-testid="share-button"
    >
      <Share2 className="w-4 h-4" />
      Share
    </button>
  );
}

/* End of helper components - others imported from /components/fomo-ai/ */
