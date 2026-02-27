/**
 * Top Candidates Panel (Premium Dark Theme)
 * 
 * Shows top trading candidates from Alt Movers
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, TrendingDown, Eye, RefreshCw, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const STATUS_INFO = {
  CANDIDATE: 'Strong momentum detected in cluster. Asset showing signs of potential breakout.',
  WATCH: 'Moderate signals. Worth monitoring for entry opportunities.',
  AVOID: 'Weak or conflicting signals. Not recommended for trading.',
};

export function TopCandidatesPanel() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const res = await fetch(`${API_URL}/api/market/alt-movers?venue=hyperliquid&marketType=perp&tf=5m&horizon=4h&preset=momentum&outLimit=5`);
        const json = await res.json();
        if (json.ok && json.candidates) {
          setCandidates(json.candidates);
        } else {
          // Demo data
          setCandidates([
            { symbol: 'ARB', score: 78, status: 'CANDIDATE', change: 5.2 },
            { symbol: 'OP', score: 71, status: 'CANDIDATE', change: 3.8 },
            { symbol: 'FET', score: 65, status: 'WATCH', change: 2.1 },
            { symbol: 'SOL', score: 52, status: 'WATCH', change: -0.5 },
          ]);
        }
      } catch (err) {
        console.error('Candidates fetch error:', err);
        setCandidates([]);
      }
      setLoading(false);
    };
    fetchCandidates();
    const interval = setInterval(fetchCandidates, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = (symbol) => {
    navigate(`/fomo-ai/${symbol}USDT`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-[#121217]/80 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden"
      data-testid="top-candidates-panel"
    >
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
          <Target className="w-4 h-4 text-amber-400" />
          Top Candidates
        </h3>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-1 hover:bg-white/5 rounded">
                <Info className="w-3 h-3 text-gray-500" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs bg-[#1a1a22] border-white/10">
              <p className="text-xs">Assets identified by AI clustering as having strong momentum potential.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="p-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No hot candidates detected</p>
            <p className="text-xs mt-1">Market conditions fragmented</p>
          </div>
        ) : (
          <div className="space-y-1">
            {candidates.map((c, i) => (
              <TooltipProvider key={c.symbol} delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => handleClick(c.symbol)}
                      className={`w-full p-3 rounded-xl flex items-center justify-between transition-all ${
                        c.status === 'CANDIDATE'
                          ? 'bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40'
                          : 'bg-white/5 border border-white/5 hover:border-white/10'
                      }`}
                      data-testid={`candidate-${c.symbol}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                          <span className="text-sm font-bold text-white">{c.symbol.slice(0, 2)}</span>
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-white text-sm">{c.symbol}</div>
                          <div className="flex items-center gap-1 text-xs">
                            {c.change !== undefined && (
                              <span className={c.change >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                {c.change >= 0 ? '+' : ''}{c.change.toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
                          c.status === 'CANDIDATE'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : c.status === 'WATCH'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {c.status}
                        </span>
                        {c.score !== undefined && (
                          <div className="w-12">
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  c.score >= 70 ? 'bg-emerald-500' :
                                  c.score >= 50 ? 'bg-amber-500' : 'bg-gray-500'
                                }`}
                                style={{ width: `${c.score}%` }}
                              />
                            </div>
                            <div className="text-xs text-gray-500 text-center mt-0.5">{c.score}</div>
                          </div>
                        )}
                      </div>
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs bg-[#1a1a22] border-white/10">
                    <p className="text-xs">{STATUS_INFO[c.status] || 'Trading candidate'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
