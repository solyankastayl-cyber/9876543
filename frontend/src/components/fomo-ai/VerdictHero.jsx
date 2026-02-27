/**
 * Verdict Hero Component (Premium Dark Theme)
 * 
 * The "Money Shot" - Large verdict display with confidence meter
 * Shows BUY/SELL/AVOID with clear visual hierarchy
 */

import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, AlertCircle, Shield, Zap, 
  Share2, Check, Loader2, Info, ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Verdict explanations
const VERDICT_INFO = {
  BUY: 'Strong bullish signals detected across multiple layers. Favorable risk/reward setup with positive momentum confirmation.',
  SELL: 'Bearish signals dominating. Risk indicators suggest downside pressure with negative momentum.',
  AVOID: 'Mixed or unclear signals. Market conditions too uncertain for confident positioning. Wait for clearer setup.',
  NEUTRAL: 'Balanced signals. No strong directional bias detected. Consider range-bound strategies.',
};

// Flag explanations
const FLAG_INFO = {
  PASS_DATA_MODE: 'Data quality verified. Real-time market data is available and reliable.',
  PASS_ML_READY: 'ML models calibrated and ready. Historical pattern recognition active.',
  WARN_ML_DRIFT: 'ML model performance degradation detected. Predictions may be less accurate.',
  PASS_WHALE_RISK: 'No significant whale activity detected. Large holder positioning is stable.',
  PASS_MARKET_STRESS: 'Market stress levels normal. Volatility within expected bounds.',
  PASS_NO_CONTRADICTION: 'All signal layers aligned. No conflicting indicators detected.',
  VERDICT_NEUTRAL: 'Final verdict after applying all filters and risk adjustments.',
  VERDICT_BUY: 'Bullish verdict after full analysis pipeline.',
  VERDICT_SELL: 'Bearish verdict after full analysis pipeline.',
};

export function VerdictHero({ decision, symbol, onRefresh }) {
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  
  if (!decision || !decision.ok) return null;

  const { action, confidence, explainability } = decision;
  
  const getVerdictStyle = () => {
    switch (action) {
      case 'BUY':
        return {
          gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
          border: 'border-emerald-500/30',
          text: 'text-emerald-400',
          glow: 'shadow-[0_0_60px_rgba(16,185,129,0.2)]',
          icon: TrendingUp,
          iconBg: 'bg-emerald-500/20',
          meterColor: 'bg-emerald-500',
        };
      case 'SELL':
        return {
          gradient: 'from-red-500/20 via-red-500/5 to-transparent',
          border: 'border-red-500/30',
          text: 'text-red-400',
          glow: 'shadow-[0_0_60px_rgba(239,68,68,0.2)]',
          icon: TrendingDown,
          iconBg: 'bg-red-500/20',
          meterColor: 'bg-red-500',
        };
      default:
        return {
          gradient: 'from-gray-500/20 via-gray-500/5 to-transparent',
          border: 'border-gray-500/30',
          text: 'text-gray-400',
          glow: 'shadow-[0_0_40px_rgba(107,114,128,0.15)]',
          icon: AlertCircle,
          iconBg: 'bg-gray-500/20',
          meterColor: 'bg-gray-500',
        };
    }
  };

  const style = getVerdictStyle();
  const Icon = style.icon;
  const dataMode = explainability?.dataMode || 'LIVE';
  const appliedRules = explainability?.appliedRules || [];

  const handleShare = async () => {
    setSharing(true);
    try {
      const res = await fetch(`${API_URL}/api/v10/snapshot/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: symbol || decision.symbol }),
      });
      const data = await res.json();
      if (data.ok && data.shareUrl) {
        setShareUrl(data.shareUrl);
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
    setSharing(false);
  };

  const handleCopy = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-[#121217]/80 backdrop-blur-xl rounded-2xl border ${style.border} ${style.glow} overflow-hidden`}
      data-testid="verdict-hero"
    >
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-r ${style.gradient}`} />
      
      <div className="relative p-6">
        <div className="flex items-center justify-between">
          {/* Left: Verdict + Confidence */}
          <div className="flex items-center gap-6">
            {/* Icon */}
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className={`p-4 rounded-2xl ${style.iconBg}`}
            >
              <Icon className={`w-12 h-12 ${style.text}`} />
            </motion.div>
            
            {/* Verdict Text */}
            <div>
              <div className="flex items-center gap-3">
                <motion.span 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className={`text-5xl font-black tracking-tight ${style.text}`}
                >
                  {action}
                </motion.span>
                
                {/* Live Badge */}
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  dataMode === 'LIVE' 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {dataMode}
                </span>
                
                {/* Info Tooltip */}
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="p-1 rounded-lg hover:bg-white/5 transition-colors">
                        <Info className="w-4 h-4 text-gray-500" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-sm bg-[#1a1a22] border-white/10">
                      <p className="text-sm">{VERDICT_INFO[action] || VERDICT_INFO.NEUTRAL}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="text-gray-400 mt-1 flex items-center gap-2">
                <span>Confidence:</span>
                <span className="text-white font-semibold">{(confidence * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Center: Confidence Meter */}
          <div className="hidden md:flex flex-col items-center gap-2 w-64">
            <div className="w-full">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>Low</span>
                <span className="text-white font-medium">{(confidence * 100).toFixed(0)}%</span>
                <span>High</span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${confidence * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full rounded-full ${style.meterColor}`}
                  style={{
                    boxShadow: `0 0 20px ${action === 'BUY' ? 'rgba(16,185,129,0.5)' : action === 'SELL' ? 'rgba(239,68,68,0.5)' : 'rgba(107,114,128,0.3)'}`
                  }}
                />
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center gap-4 mt-2">
              {explainability?.mlReady && (
                <div className="flex items-center gap-1 text-xs text-purple-400">
                  <Zap className="w-3 h-3" />
                  <span>ML Active</span>
                </div>
              )}
              {explainability?.riskFlags?.whaleRisk === 'LOW' && (
                <div className="flex items-center gap-1 text-xs text-emerald-400">
                  <Shield className="w-3 h-3" />
                  <span>Low Risk</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {!shareUrl ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShare}
                disabled={sharing}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                data-testid="share-button"
              >
                {sharing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
                Share
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-xl text-sm font-medium text-emerald-400 transition-all"
                data-testid="copy-link-button"
              >
                {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </motion.button>
            )}
          </div>
        </div>

        {/* Applied Rules / Signal Flags */}
        {appliedRules.length > 0 && (
          <div className="mt-5 pt-5 border-t border-white/5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500 uppercase tracking-wider">Applied:</span>
              {appliedRules.map((rule, i) => (
                <TooltipProvider key={i} delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium cursor-help transition-all hover:bg-white/10 ${
                          rule.startsWith('PASS') 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : rule.startsWith('WARN')
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : rule.startsWith('FAIL')
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-white/5 text-gray-400 border border-white/10'
                        }`}
                      >
                        {rule.replace(/_/g, ' ')}
                      </motion.span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs bg-[#1a1a22] border-white/10">
                      <p className="text-xs">{FLAG_INFO[rule] || 'Signal flag from analysis pipeline'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
