/**
 * Exchange Markets Page
 * 
 * Shows Universe with Verdicts.
 * Table of symbols with scores, verdicts, and whale data.
 * Style: FomoAI Design System
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Activity, BarChart3, Shield, Clock, Info, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/custom-select';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const ITEMS_PER_PAGE = 10;

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
if (typeof document !== 'undefined' && !document.getElementById('markets-animations')) {
  const style = document.createElement('style');
  style.id = 'markets-animations';
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

// Verdict colors
const VERDICT_STYLES = {
  BULLISH: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', icon: TrendingUp },
  BEARISH: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', icon: TrendingDown },
  NEUTRAL: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', icon: Minus },
};

const STRENGTH_STYLES = {
  STRONG: 'bg-blue-100 text-blue-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  WEAK: 'bg-gray-100 text-gray-500',
};

export default function ExchangeMarketsPage() {
  const [universe, setUniverse] = useState([]);
  const [verdicts, setVerdicts] = useState({});
  const [universeHealth, setUniverseHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [sortBy, setSortBy] = useState('universeScore');
  const [filterStatus, setFilterStatus] = useState('INCLUDED');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch universe
      const universeRes = await fetch(`${API_URL}/api/v10/exchange/universe?status=${filterStatus}`).then(r => r.json());
      
      if (universeRes.ok) {
        setUniverse(universeRes.items || []);
        
        // Fetch verdicts for all symbols
        const symbols = (universeRes.items || []).map(i => i.symbol).join(',');
        if (symbols) {
          const verdictsRes = await fetch(`${API_URL}/api/v10/exchange/verdicts?symbols=${symbols}`).then(r => r.json());
          if (verdictsRes.ok) {
            const vMap = {};
            (verdictsRes.verdicts || []).forEach(v => {
              vMap[v.symbol] = v;
            });
            setVerdicts(vMap);
          }
        }
      }

      // Fetch health
      const healthRes = await fetch(`${API_URL}/api/v10/exchange/universe/health`).then(r => r.json());
      if (healthRes.ok) {
        setUniverseHealth(healthRes);
      }

      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getTimeSince = (date) => {
    if (!date) return 'Never';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const formatNumber = (num) => {
    if (!num) return '-';
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(0)}K`;
    return `$${num.toFixed(0)}`;
  };

  const sortedUniverse = [...universe].sort((a, b) => {
    if (sortBy === 'universeScore') return b.scores.universeScore - a.scores.universeScore;
    if (sortBy === 'volume') return (b.raw?.volume24h || 0) - (a.raw?.volume24h || 0);
    if (sortBy === 'whaleScore') return b.scores.whaleScore - a.scores.whaleScore;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedUniverse.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedUniverse.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedUniverse, currentPage]);

  // Reset page when filter/sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50" data-testid="exchange-markets-page" style={fadeInStyle}>
      {/* ═══════════════════════════════════════════════════════════════
          HEADER: FomoAI Style
      ═══════════════════════════════════════════════════════════════ */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/80 px-6 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          {/* Left: Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 shadow-sm">
              <BarChart3 className="w-5 h-5 text-slate-700" />
              <span className="text-xl font-bold tracking-tight text-slate-800">Markets</span>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-3">
            {/* Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INCLUDED">Included</SelectItem>
                <SelectItem value="WATCH">Watch</SelectItem>
                <SelectItem value="EXCLUDED">Excluded</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="universeScore">Universe Score</SelectItem>
                <SelectItem value="volume">Volume 24h</SelectItem>
                <SelectItem value="whaleScore">Whale Score</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1 text-sm text-gray-400 px-2 py-1 bg-gray-50 rounded-lg">
              <Clock className="w-4 h-4" />
              {getTimeSince(lastUpdate)}
            </div>

            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          Error: {error}
        </div>
      )}

      {/* Health Summary */}
      {universeHealth && (
        <div className="grid grid-cols-5 gap-4">
          <Card className="bg-white border border-gray-200/80 rounded-xl shadow-sm card-hover" style={{ ...slideUpStyle, animationDelay: '100ms' }}>
            <CardContent className="py-4">
              <div className="text-gray-500 text-sm mb-1">Total Coins</div>
              <div className="text-2xl font-bold text-gray-900">{universeHealth.symbols}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm card-hover" style={{ ...slideUpStyle, animationDelay: '150ms' }}>
            <CardContent className="py-4">
              <div className="text-green-600 text-sm mb-1">Included</div>
              <div className="text-2xl font-bold text-green-700">{universeHealth.included}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl shadow-sm card-hover" style={{ ...slideUpStyle, animationDelay: '200ms' }}>
            <CardContent className="py-4">
              <div className="text-yellow-600 text-sm mb-1">Watch</div>
              <div className="text-2xl font-bold text-yellow-700">{universeHealth.watch}</div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-200/80 rounded-xl shadow-sm card-hover" style={{ ...slideUpStyle, animationDelay: '250ms' }}>
            <CardContent className="py-4">
              <div className="text-gray-500 text-sm mb-1">Excluded</div>
              <div className="text-2xl font-bold text-gray-500">{universeHealth.excluded}</div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-200/80 rounded-xl shadow-sm card-hover" style={{ ...slideUpStyle, animationDelay: '300ms' }}>
            <CardContent className="py-4">
              <div className="text-gray-500 text-sm mb-1">Hyperliquid</div>
              <div className={`text-2xl font-bold ${universeHealth.sources?.hyperliquid === 'UP' ? 'text-green-600' : 'text-red-600'}`}>
                {universeHealth.sources?.hyperliquid || 'DOWN'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Markets Table */}
      <Card className="bg-white border border-gray-200/80 rounded-xl shadow-sm" style={{ ...slideUpStyle, animationDelay: '350ms' }}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-slate-100 rounded-lg">
                <Activity className="w-4 h-4 text-slate-600" />
              </div>
              <CardTitle className="text-gray-800">Markets ({sortedUniverse.length})</CardTitle>
            </div>
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="text-left py-3 px-2">Symbol</th>
                    <th className="text-center py-3 px-2">Verdict</th>
                    <th className="text-center py-3 px-2">Strength</th>
                    <th className="text-right py-3 px-2">Universe</th>
                    <th className="text-right py-3 px-2">Liquidity</th>
                    <th className="text-right py-3 px-2">Derivatives</th>
                    <th className="text-right py-3 px-2">Whale</th>
                    <th className="text-right py-3 px-2">Volume 24h</th>
                    <th className="text-center py-3 px-2">Whale Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item, idx) => {
                    const verdict = verdicts[item.symbol];
                    const vStyle = verdict ? VERDICT_STYLES[verdict.verdict] : VERDICT_STYLES.NEUTRAL;
                    const VIcon = vStyle.icon;

                    return (
                      <tr key={item.symbol} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors" style={{ ...slideUpStyle, animationDelay: `${400 + idx * 30}ms` }}>
                        <td className="py-3 px-2">
                          <div className="font-semibold text-gray-900">{item.symbol}</div>
                          <div className="text-xs text-gray-500">{item.base}</div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          {verdict ? (
                            <Badge className={`${vStyle.bg} ${vStyle.text} border ${vStyle.border}`}>
                              <VIcon className="w-3 h-3 mr-1" />
                              {verdict.verdict}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {verdict?.strength && (
                            <Badge className={STRENGTH_STYLES[verdict.strength]}>
                              {verdict.strength}
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Progress 
                              value={item.scores.universeScore * 100} 
                              className="w-16 h-2"
                            />
                            <span className="font-mono text-gray-900 font-medium">
                              {(item.scores.universeScore * 100).toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-gray-600">
                          {(item.scores.liquidityScore * 100).toFixed(0)}%
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-gray-600">
                          {(item.scores.derivativesScore * 100).toFixed(0)}%
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-gray-600">
                          {(item.scores.whaleScore * 100).toFixed(0)}%
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-gray-600">
                          {formatNumber(item.raw?.volume24h)}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {verdict?.evidence?.whales?.riskBucket && (
                            <Badge className={`text-xs ${
                              verdict.evidence.whales.riskBucket === 'HIGH' ? 'bg-red-100 text-red-700 border-red-200' :
                              verdict.evidence.whales.riskBucket === 'MID' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                              'bg-green-100 text-green-700 border-green-200'
                            }`}>
                              <Shield className="w-3 h-3 mr-1" />
                              {verdict.evidence.whales.riskBucket}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
          {/* Pagination - always visible */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, sortedUniverse.length)} of {sortedUniverse.length}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsLeft className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              
              <div className="flex items-center gap-1 px-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                        currentPage === pageNum 
                          ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200 text-center">
        <p className="text-xs text-gray-500">
          Exchange Markets show symbol universe scores and market verdicts. Verdicts are NOT trading signals.
        </p>
      </div>
      </div>
    </div>
  );
}
