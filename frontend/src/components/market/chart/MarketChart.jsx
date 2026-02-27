/**
 * PHASE 1.3 + 1.4 — Market Chart Container
 * =========================================
 * 
 * Full chart component with price, verdicts, divergence markers, and truth overlay.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, RefreshCw, Activity, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import PriceChart from './PriceChart';
import VerdictOverlay from './VerdictOverlay';
import DivergenceMarkers from './DivergenceMarkers';
import TruthOverlay from './TruthOverlay';
import api from '../../../lib/api';

export default function MarketChart({ 
  symbol, 
  timeframe = '1h',
  className = '',
}) {
  const [data, setData] = useState(null);
  const [truthRecords, setTruthRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchData = useCallback(async () => {
    if (!symbol) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch chart data and truth records in parallel
      const [chartRes, truthRes] = await Promise.all([
        api.get(`/v10/market/chart/${symbol}?tf=${timeframe}&limit=200`),
        api.get(`/v10/market/truth/${symbol}?tf=${timeframe}&limit=200`).catch(() => ({ data: { records: [] } })),
      ]);
      
      setData(chartRes.data);
      setTruthRecords(truthRes.data.records || []);
    } catch (err) {
      setError(err.message || 'Failed to load chart data');
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const priceRange = useMemo(() => {
    if (!data?.price?.length) return null;
    
    const prices = data.price.map(p => p.c);
    return {
      from: data.window.from,
      to: data.window.to,
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [data]);
  
  const chartWidth = 900;
  const chartHeight = 320;
  
  if (loading) {
    return (
      <div className={`bg-slate-800/30 border border-slate-700 rounded-lg p-8 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`bg-slate-800/30 border border-slate-700 rounded-lg p-8 ${className}`}>
        <div className="flex flex-col items-center justify-center h-64">
          <AlertTriangle className="w-8 h-8 text-red-400 mb-3" />
          <p className="text-red-400 mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className={`bg-slate-800/30 border border-slate-700 border-dashed rounded-lg p-8 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">No data available</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-slate-800/30 border border-slate-700 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="font-semibold text-slate-100">Price & Verdict History</h3>
            <p className="text-xs text-slate-500">
              {data.stats.priceCount} bars • {data.stats.verdictCount} verdicts • 
              {data.stats.divergenceCount} divergences ({(data.stats.divergenceRate * 100).toFixed(1)}% rate)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge 
            variant="outline" 
            className={data.meta.dataMode === 'LIVE' 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}
          >
            {data.meta.dataMode}
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchData} className="bg-slate-800 border-slate-600">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Chart */}
      <div className="p-4">
        <div className="relative" style={{ width: chartWidth, height: chartHeight }}>
          {/* Verdict zones (background) */}
          <VerdictOverlay
            verdicts={data.verdicts}
            priceRange={priceRange}
            width={chartWidth}
            height={chartHeight}
          />
          
          {/* Price chart */}
          <PriceChart
            bars={data.price}
            width={chartWidth}
            height={chartHeight}
          />
          
          {/* Truth overlay (Phase 1.4) - shows confirmed/diverged markers */}
          {truthRecords.length > 0 && (
            <TruthOverlay
              truthRecords={truthRecords}
              priceRange={priceRange}
              prices={data.price}
              width={chartWidth}
              height={chartHeight}
            />
          )}
          
          {/* Divergence markers (foreground) */}
          <DivergenceMarkers
            divergences={data.divergences}
            priceRange={priceRange}
            prices={data.price}
            width={chartWidth}
            height={chartHeight}
          />
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 p-3 border-t border-slate-700 bg-slate-900/30">
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 bg-emerald-500/30 rounded-sm"></div>
          <span className="text-xs text-slate-400">BULLISH zone</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 bg-red-500/30 rounded-sm"></div>
          <span className="text-xs text-slate-400">BEARISH zone</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-2 h-2 text-white" />
          </div>
          <span className="text-xs text-slate-400">Confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-[8px] text-white">✕</span>
          </div>
          <span className="text-xs text-slate-400">Diverged</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-blue-500 rounded"></div>
          <span className="text-xs text-slate-400">Price</span>
        </div>
      </div>
      
      {/* Divergence List */}
      {data.divergences?.length > 0 && (
        <div className="border-t border-slate-700">
          <div className="p-3 bg-red-500/5">
            <p className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-3 h-3" />
              Recent Divergences ({data.divergences.length})
            </p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {data.divergences.slice(0, 5).map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    {new Date(d.ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className={d.verdict === 'BULLISH' ? 'text-emerald-400' : 'text-red-400'}>
                    {d.verdict}
                  </span>
                  <span className="text-slate-500">→</span>
                  <span className={d.actualMove === 'UP' ? 'text-emerald-400' : 'text-red-400'}>
                    {d.actualMove} {(d.magnitude * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
