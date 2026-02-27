/**
 * Why Decision Panel (Premium Dark Theme)
 * 
 * Compact explanation of decision layers with tooltips
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, ChevronRight, TrendingUp, TrendingDown, 
  Minus, AlertCircle, BarChart3, Brain, Globe, Shield, Info
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

// Layer explanations
const LAYER_INFO = {
  exchange: 'Analyzes on-chain exchange data: order flow, liquidations, whale activity, and market microstructure.',
  ml: 'Machine learning models calibrate raw signals using historical pattern recognition and drift detection.',
  macro: 'Macro context layer adjusts confidence based on Fear & Greed Index, BTC Dominance, and stablecoin flows.',
  risks: 'Risk assessment layer identifies potential dangers: whale positioning, liquidation cascades, signal contradictions.',
};

export function WhyDecisionPanel({ decision }) {
  const [macroData, setMacroData] = useState(null);
  const [expandedLayer, setExpandedLayer] = useState(null);
  
  useEffect(() => {
    const fetchMacro = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v10/macro/impact`);
        const json = await res.json();
        if (json.ok) setMacroData(json.data);
      } catch (err) {
        console.error('Macro fetch error:', err);
      }
    };
    fetchMacro();
  }, [decision]);
  
  if (!decision?.ok || !decision.explainability) return null;

  const { explainability, context } = decision;

  const layers = [
    {
      id: 'exchange',
      label: 'Exchange Layer',
      icon: BarChart3,
      verdict: explainability.verdict || 'NEUTRAL',
      confidence: explainability.rawConfidence,
      drivers: context?.drivers || [],
    },
    {
      id: 'ml',
      label: 'ML Calibration',
      icon: Brain,
      verdict: explainability.mlReady ? 'APPLIED' : 'SKIPPED',
      confidence: explainability.mlAdjustedConfidence,
      drivers: explainability.mlReady 
        ? [`Raw ${(explainability.rawConfidence * 100).toFixed(0)}% → Calibrated ${(explainability.mlAdjustedConfidence * 100).toFixed(0)}%`]
        : ['Insufficient data for ML calibration'],
    },
  ];

  // Add Macro Layer
  if (macroData?.impact) {
    const { signal, impact } = macroData;
    const macroVerdict = impact.blockedStrong ? 'BLOCKED' 
      : impact.applied ? 'ADJUSTED' 
      : 'NEUTRAL';
    
    const macroDrivers = [];
    const fgMatch = signal?.explain?.bullets?.[0]?.match(/Fear & Greed: (\d+) \((.+)\)/);
    if (fgMatch) macroDrivers.push(`Fear & Greed: ${fgMatch[1]} (${fgMatch[2]})`);
    
    if (signal?.flags?.includes('BTC_DOM_UP')) macroDrivers.push('BTC Dominance rising → Risk-off');
    if (signal?.flags?.includes('BTC_DOM_DOWN')) macroDrivers.push('BTC Dominance falling → Risk-on');
    if (impact.blockedStrong) macroDrivers.push('STRONG actions blocked');
    if (impact.confidenceMultiplier < 1) macroDrivers.push(`Confidence penalty: ${((1 - impact.confidenceMultiplier) * 100).toFixed(0)}%`);
    
    layers.push({
      id: 'macro',
      label: 'Macro Context',
      icon: Globe,
      verdict: macroVerdict,
      confidence: impact.confidenceMultiplier,
      drivers: macroDrivers,
    });
  }

  // Add Risks Layer
  if (context?.risks?.length > 0) {
    layers.push({
      id: 'risks',
      label: 'Risk Analysis',
      icon: Shield,
      verdict: 'DETECTED',
      confidence: null,
      drivers: context.risks,
    });
  }

  const getVerdictColor = (verdict) => {
    if (['BULLISH', 'CONFIRMED', 'APPLIED'].includes(verdict)) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (['BEARISH', 'DIVERGED', 'DETECTED', 'BLOCKED'].includes(verdict)) return 'text-red-400 bg-red-500/10 border-red-500/20';
    if (['ADJUSTED'].includes(verdict)) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-[#121217]/80 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden"
      data-testid="why-decision-panel"
    >
      <div className="p-4 border-b border-white/5">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
          <span className="text-lg">💡</span>
          Why This Decision
        </h3>
      </div>

      <div className="divide-y divide-white/5">
        {layers.map((layer) => {
          const Icon = layer.icon;
          const isExpanded = expandedLayer === layer.id;
          const hasDrivers = layer.drivers.length > 0;
          
          return (
            <div key={layer.id}>
              <button
                onClick={() => hasDrivers && setExpandedLayer(isExpanded ? null : layer.id)}
                disabled={!hasDrivers}
                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors disabled:cursor-default"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/5">
                    <Icon className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white text-sm">{layer.label}</span>
                      <TooltipProvider delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={(e) => e.stopPropagation()} className="p-0.5">
                              <Info className="w-3 h-3 text-gray-500 hover:text-gray-400" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs bg-[#1a1a22] border-white/10">
                            <p className="text-xs">{LAYER_INFO[layer.id]}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    {layer.confidence !== null && (
                      <span className="text-xs text-gray-500">
                        {(layer.confidence * 100).toFixed(0)}% confidence
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-lg border font-medium ${getVerdictColor(layer.verdict)}`}>
                    {layer.verdict}
                  </span>
                  {hasDrivers && (
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </motion.div>
                  )}
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && hasDrivers && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pl-14 space-y-1">
                      {layer.drivers.map((driver, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="text-xs text-gray-400 flex items-start gap-2"
                        >
                          <span className="text-gray-600">•</span>
                          <span>{driver}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
