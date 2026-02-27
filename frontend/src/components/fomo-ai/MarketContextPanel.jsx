/**
 * Market Context Panel (Premium Dark Theme)
 * 
 * Fear & Greed, BTC Dominance, Active Signals
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, AlertTriangle, Activity, 
  RefreshCw, Info, Gauge
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Metric explanations
const METRIC_INFO = {
  fearGreed: 'Fear & Greed Index measures market sentiment (0-100). Extreme Fear (<25) often signals buying opportunities, Extreme Greed (>75) signals caution.',
  btcDom: 'BTC Dominance shows Bitcoin\'s market cap relative to total crypto market. Rising dominance = risk-off (capital flowing to BTC).',
  stableDom: 'Stablecoin dominance indicates capital parked in safe assets. Rising = defensive positioning.',
};

export function MarketContextPanel({ symbol }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v10/macro/impact`);
        const json = await res.json();
        if (json.ok) setData(json.data);
      } catch (err) {
        console.error('Market context fetch error:', err);
      }
      setLoading(false);
    };
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const getFearGreedColor = (value) => {
    if (value <= 25) return { color: 'text-red-400', bg: 'bg-red-500/20', label: 'Extreme Fear' };
    if (value <= 45) return { color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'Fear' };
    if (value <= 55) return { color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'Neutral' };
    if (value <= 75) return { color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Greed' };
    return { color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Extreme Greed' };
  };

  const fearGreedValue = data?.signal?.fearGreed || 50;
  const fgStyle = getFearGreedColor(fearGreedValue);
  const btcDom = data?.signal?.btcDominance || 0;
  const stableDom = data?.signal?.stableDominance || 0;
  const activeFlags = data?.signal?.flags || [];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-[#121217]/80 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden"
      data-testid="market-context-panel"
    >
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          Market Context
        </h3>
        {loading && <RefreshCw className="w-3 h-3 text-gray-500 animate-spin" />}
      </div>

      <div className="p-4 space-y-4">
        {/* Fear & Greed */}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">Fear & Greed Index</span>
                  <span className={`text-2xl font-bold ${fgStyle.color}`}>{fearGreedValue}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${fearGreedValue}%` }}
                    className={`h-full ${fgStyle.bg}`}
                    style={{ 
                      background: `linear-gradient(90deg, #ef4444 0%, #f97316 25%, #6b7280 50%, #22c55e 75%, #22c55e 100%)`,
                      width: `${fearGreedValue}%`
                    }}
                  />
                </div>
                <div className="text-xs text-center mt-1">
                  <span className={fgStyle.color}>{fgStyle.label}</span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs bg-[#1a1a22] border-white/10">
              <p className="text-xs">{METRIC_INFO.fearGreed}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* BTC & Stable Dominance */}
        <div className="grid grid-cols-2 gap-3">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-3 bg-white/5 rounded-xl cursor-help">
                  <div className="text-xs text-gray-500 mb-1">BTC Dom</div>
                  <div className="text-lg font-bold text-white">{btcDom.toFixed(1)}%</div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-[#1a1a22] border-white/10">
                <p className="text-xs">{METRIC_INFO.btcDom}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-3 bg-white/5 rounded-xl cursor-help">
                  <div className="text-xs text-gray-500 mb-1">Stable Dom</div>
                  <div className="text-lg font-bold text-white">{stableDom.toFixed(1)}%</div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-[#1a1a22] border-white/10">
                <p className="text-xs">{METRIC_INFO.stableDom}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Active Signals */}
        {activeFlags.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 mb-2">Active Signals</div>
            <div className="flex flex-wrap gap-1.5">
              {activeFlags.slice(0, 4).map((flag, i) => (
                <motion.span
                  key={flag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className={`text-xs px-2 py-1 rounded-lg border font-medium ${
                    flag.includes('PANIC') || flag.includes('FEAR')
                      ? 'text-red-400 bg-red-500/10 border-red-500/20'
                      : flag.includes('GREED') || flag.includes('EUPHORIA')
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                      : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                  }`}
                >
                  {flag.replace(/_/g, ' ')}
                </motion.span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
