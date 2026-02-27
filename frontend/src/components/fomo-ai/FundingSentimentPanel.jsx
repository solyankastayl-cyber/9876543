/**
 * Funding Sentiment Panel (Premium Dark Theme)
 * 
 * Long/Short ratio visualization across exchanges
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, RefreshCw, Info, TrendingUp, TrendingDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const METRIC_INFO = {
  openInterest: 'Open Interest distribution shows the balance between long and short positions across exchanges.',
  fundingRate: 'Funding rate is the periodic payment between longs and shorts. Positive = longs pay shorts (bullish bias). Negative = shorts pay longs (bearish bias).',
};

export function FundingSentimentPanel({ symbol }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v10/exchange/funding/sentiment?symbol=${symbol || 'BTCUSDT'}`);
        const json = await res.json();
        if (json.ok) setData(json.data);
      } catch (err) {
        console.error('Funding sentiment fetch error:', err);
      }
      setLoading(false);
    };
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [symbol]);

  // Demo data if API fails
  const sentiment = data || {
    longPct: 52,
    shortPct: 48,
    avgFunding: 0.0008,
    zScore: 0.5,
    byExchange: [
      { venue: 'Binance', funding: 0.0010 },
      { venue: 'Bybit', funding: 0.0007 },
      { venue: 'Hyperliquid', funding: 0.0009 },
    ]
  };

  const longPct = sentiment.longPct || 52;
  const shortPct = sentiment.shortPct || 48;
  const avgFunding = sentiment.avgFunding || 0;
  const fundingSign = avgFunding >= 0 ? '+' : '';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-[#121217]/80 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden"
      data-testid="funding-sentiment-panel"
    >
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-400" />
          Funding Sentiment
        </h3>
        {loading && <RefreshCw className="w-3 h-3 text-gray-500 animate-spin" />}
      </div>

      <div className="p-4 space-y-4">
        {/* Long/Short Bar */}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-emerald-400 font-medium">Long {longPct.toFixed(1)}%</span>
                  <span className="text-red-400 font-medium">Short {shortPct.toFixed(1)}%</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden flex">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${longPct}%` }}
                    transition={{ duration: 0.5 }}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full"
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${shortPct}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-gradient-to-r from-red-400 to-red-500 h-full"
                  />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs bg-[#1a1a22] border-white/10">
              <p className="text-xs">{METRIC_INFO.openInterest}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Avg Funding */}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl cursor-help">
                <span className="text-xs text-gray-500">Avg Funding Rate</span>
                <span className={`text-lg font-bold ${avgFunding >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {fundingSign}{(avgFunding * 100).toFixed(4)}%
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs bg-[#1a1a22] border-white/10">
              <p className="text-xs">{METRIC_INFO.fundingRate}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* By Exchange */}
        {sentiment.byExchange && sentiment.byExchange.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 mb-2">Funding by Exchange</div>
            <div className="space-y-2">
              {sentiment.byExchange.map((ex, i) => (
                <motion.div
                  key={ex.venue}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between"
                >
                  <span className="text-xs text-gray-400">{ex.venue}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${ex.funding >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(Math.abs(ex.funding) * 10000, 100)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-mono ${ex.funding >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {ex.funding >= 0 ? '+' : ''}{(ex.funding * 100).toFixed(4)}%
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
