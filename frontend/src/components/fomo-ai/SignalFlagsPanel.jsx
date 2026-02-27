/**
 * Signal Flags Panel (Premium Dark Theme)
 * 
 * Detailed view of all applied signal flags with explanations
 */

import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, XCircle, Info, ChevronRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MacroImpactLine } from '../macro/MacroImpactLine';

// All flag explanations
const FLAG_EXPLANATIONS = {
  // Data & System
  PASS_DATA_MODE: 'Real-time market data verified and reliable.',
  FAIL_DATA_MODE: 'Data quality issues detected. Using fallback sources.',
  PASS_ML_READY: 'ML models calibrated with sufficient historical data.',
  FAIL_ML_READY: 'Insufficient data for ML calibration.',
  WARN_ML_DRIFT: 'Model performance degradation detected. Predictions may be less reliable.',
  
  // Risk Assessment
  PASS_WHALE_RISK: 'No significant whale positioning detected.',
  WARN_WHALE_RISK: 'Elevated whale activity — potential manipulation risk.',
  FAIL_WHALE_RISK: 'High whale risk — large holder movements detected.',
  PASS_MARKET_STRESS: 'Market stress within normal bounds.',
  WARN_MARKET_STRESS: 'Elevated market stress — increased volatility expected.',
  FAIL_MARKET_STRESS: 'Extreme market stress — high risk environment.',
  
  // Signal Consistency
  PASS_NO_CONTRADICTION: 'All signal layers aligned — no conflicts.',
  WARN_CONTRADICTION: 'Minor signal conflicts detected.',
  FAIL_CONTRADICTION: 'Significant signal contradiction — mixed signals.',
  
  // Verdicts
  VERDICT_BUY: 'Final bullish verdict after full pipeline.',
  VERDICT_SELL: 'Final bearish verdict after full pipeline.',
  VERDICT_NEUTRAL: 'No clear directional signal.',
  VERDICT_AVOID: 'Conditions too uncertain for confident positioning.',
};

export function SignalFlagsPanel({ decision }) {
  if (!decision?.ok) return null;

  const { explainability } = decision;
  const appliedRules = explainability?.appliedRules || [];
  
  if (appliedRules.length === 0) return null;

  const getIcon = (rule) => {
    if (rule.startsWith('PASS')) return CheckCircle2;
    if (rule.startsWith('WARN')) return AlertCircle;
    if (rule.startsWith('FAIL')) return XCircle;
    return Info;
  };

  const getStyle = (rule) => {
    if (rule.startsWith('PASS')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (rule.startsWith('WARN')) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    if (rule.startsWith('FAIL')) return 'text-red-400 bg-red-500/10 border-red-500/20';
    if (rule.startsWith('VERDICT')) return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
  };

  // Group flags by category
  const categories = {
    data: appliedRules.filter(r => r.includes('DATA') || r.includes('ML')),
    risk: appliedRules.filter(r => r.includes('WHALE') || r.includes('STRESS') || r.includes('LIQUIDATION')),
    signal: appliedRules.filter(r => r.includes('CONTRADICTION') || r.includes('CONFLICT')),
    verdict: appliedRules.filter(r => r.startsWith('VERDICT')),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#121217]/80 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden"
      data-testid="signal-flags-panel"
    >
      {/* Macro Impact Line */}
      <div className="p-4 border-b border-white/5">
        <MacroImpactLine />
      </div>

      {/* Signal Flags */}
      <div className="p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Signal Analysis Pipeline
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Data & System */}
          <div>
            <div className="text-xs text-gray-600 mb-2">Data & System</div>
            <div className="space-y-1.5">
              {categories.data.length > 0 ? categories.data.map((rule, i) => {
                const Icon = getIcon(rule);
                return (
                  <TooltipProvider key={rule} delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-help transition-all hover:scale-[1.02] ${getStyle(rule)}`}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs font-medium truncate">{rule.replace(/_/g, ' ')}</span>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs bg-[#1a1a22] border-white/10">
                        <p className="text-xs">{FLAG_EXPLANATIONS[rule] || 'Analysis pipeline flag'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              }) : (
                <div className="text-xs text-gray-600 italic">No flags</div>
              )}
            </div>
          </div>

          {/* Risk Assessment */}
          <div>
            <div className="text-xs text-gray-600 mb-2">Risk Assessment</div>
            <div className="space-y-1.5">
              {categories.risk.length > 0 ? categories.risk.map((rule, i) => {
                const Icon = getIcon(rule);
                return (
                  <TooltipProvider key={rule} delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-help transition-all hover:scale-[1.02] ${getStyle(rule)}`}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs font-medium truncate">{rule.replace(/_/g, ' ')}</span>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs bg-[#1a1a22] border-white/10">
                        <p className="text-xs">{FLAG_EXPLANATIONS[rule] || 'Risk assessment flag'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              }) : (
                <div className="text-xs text-gray-600 italic">No flags</div>
              )}
            </div>
          </div>

          {/* Signal Consistency */}
          <div>
            <div className="text-xs text-gray-600 mb-2">Signal Consistency</div>
            <div className="space-y-1.5">
              {categories.signal.length > 0 ? categories.signal.map((rule, i) => {
                const Icon = getIcon(rule);
                return (
                  <TooltipProvider key={rule} delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-help transition-all hover:scale-[1.02] ${getStyle(rule)}`}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs font-medium truncate">{rule.replace(/_/g, ' ')}</span>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs bg-[#1a1a22] border-white/10">
                        <p className="text-xs">{FLAG_EXPLANATIONS[rule] || 'Signal consistency flag'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              }) : (
                <div className="text-xs text-gray-600 italic">No flags</div>
              )}
            </div>
          </div>

          {/* Verdict */}
          <div>
            <div className="text-xs text-gray-600 mb-2">Final Verdict</div>
            <div className="space-y-1.5">
              {categories.verdict.length > 0 ? categories.verdict.map((rule, i) => {
                const Icon = getIcon(rule);
                return (
                  <TooltipProvider key={rule} delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-help transition-all hover:scale-[1.02] ${getStyle(rule)}`}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs font-medium truncate">{rule.replace(/_/g, ' ')}</span>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs bg-[#1a1a22] border-white/10">
                        <p className="text-xs">{FLAG_EXPLANATIONS[rule] || 'Final verdict'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              }) : (
                <div className="text-xs text-gray-600 italic">No verdict</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
