import { useState } from 'react';
import { TrendingUp, TrendingDown, Activity, Search, Zap, AlertCircle, ChevronRight } from 'lucide-react';
import { chartColors } from '../styles/chartTheme';

const GlassCard = ({ children, className = "", hover = false }) => (
  <div className={`glass-card ${hover ? 'glass-card-hover' : ''} ${className}`}>
    {children}
  </div>
);

// Modern Trade Size Bar - COMPACT with rounded ends
const TradeSizeBar = ({ size, buyVolume, sellVolume, netFlow, maxVolume = 10000 }) => {
  const totalVolume = buyVolume + sellVolume;
  const buyPct = (buyVolume / totalVolume) * 100;
  const sellPct = (sellVolume / totalVolume) * 100;
  const isPositive = netFlow >= 0;
  
  return (
    <div className="py-2 border-b border-gray-100/50 last:border-0 group hover:bg-gray-50/30 rounded-lg px-2 -mx-2 transition-all">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-800">{size}</span>
          <span className="text-[10px] text-gray-400">({totalVolume.toLocaleString()})</span>
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-emerald-500' : 'text-red-400'}`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isPositive ? '+' : ''}{netFlow.toLocaleString()}
        </div>
      </div>
      
      {/* Dual Bar - Buy vs Sell - UNIFIED HEIGHT */}
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden flex relative shadow-inner">
        <div 
          className="h-full rounded-l-full transition-all duration-700 relative"
          style={{ 
            width: `${buyPct}%`,
            background: 'linear-gradient(90deg, #00C9A7 0%, #4ADEC7 100%)',
          }}
        />
        <div 
          className="h-full rounded-r-full transition-all duration-700"
          style={{ 
            width: `${sellPct}%`,
            background: 'linear-gradient(90deg, #FF8FA5 0%, #FF6B8A 100%)',
          }}
        />
      </div>
      
      <div className="flex justify-between mt-1 text-[10px]">
        <span className="text-emerald-600 font-semibold">Buy {buyPct.toFixed(0)}%</span>
        <span className="text-red-400 font-semibold">Sell {sellPct.toFixed(0)}%</span>
      </div>
    </div>
  );
};

// Aggregator Flow Bar - COMPACT
const AggregatorBar = ({ name, volume, pct, buyRatio, color }) => {
  return (
    <div className="py-2 border-b border-gray-100/50 last:border-0 group">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div 
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: `${color}15` }}
          >
            <Zap className="w-3 h-3" style={{ color }} />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-800">{name}</span>
            <div className="text-[10px] text-gray-500">${(volume / 1e6).toFixed(1)}M</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold" style={{ color }}>{pct}%</div>
        </div>
      </div>
      
      {/* Volume Bar - UNIFIED HEIGHT */}
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
        <div 
          className="h-full rounded-full transition-all duration-700"
          style={{ 
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}99 0%, ${color} 100%)`
          }}
        />
      </div>
    </div>
  );
};

export default function DEXMicrostructure({ tokenSymbol = 'ETH' }) {
  const [viewMode, setViewMode] = useState('tradesize');
  const [timeframe, setTimeframe] = useState('24H');

  const tradeSizeData = [
    { size: '<$1K (Retail)', buy: 2340, sell: 1890, netFlow: 450 },
    { size: '$1K-10K (Active)', buy: 5670, sell: 6120, netFlow: -450 },
    { size: '$10K-100K (Pro)', buy: 890, sell: 670, netFlow: 220 },
    { size: '$100K-1M (Inst.)', buy: 120, sell: 80, netFlow: 40 },
    { size: '>$1M (Whale)', buy: 30, sell: 10, netFlow: 20 },
  ];

  const aggregatorData = [
    { name: '1inch', volume: 45600000, pct: 34.2, buyRatio: 52, color: '#00C9A7' },
    { name: '0x API', volume: 32400000, pct: 24.3, buyRatio: 48, color: '#8B5CF6' },
    { name: 'Paraswap', volume: 28900000, pct: 21.7, buyRatio: 55, color: '#3B82F6' },
    { name: 'Cowswap', volume: 26400000, pct: 19.8, buyRatio: 51, color: '#F97316' },
  ];

  // Calculate overall metrics
  const totalBuys = tradeSizeData.reduce((sum, d) => sum + d.buy, 0);
  const totalSells = tradeSizeData.reduce((sum, d) => sum + d.sell, 0);
  const buyPressure = ((totalBuys / (totalBuys + totalSells)) * 100).toFixed(1);
  const netPressure = totalBuys > totalSells ? 'bullish' : 'bearish';
  const totalNetFlow = tradeSizeData.reduce((sum, d) => sum + d.netFlow, 0);

  const timeframes = ['1H', '4H', '24H', '7D'];

  return (
    <GlassCard className="p-5 h-full flex flex-col">
      {/* Header with Compare style */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-600">Compare</span>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input 
              type="text"
              placeholder="Search trade"
              className="pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-2xl w-48 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all"
            />
          </div>
        </div>
        
        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
          {timeframes.map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                timeframe === tf
                  ? 'bg-white text-emerald-500 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Main Pressure Indicator - REDESIGNED (No border, cleaner) */}
      <div className={`p-4 rounded-2xl mb-4 ${netPressure === 'bullish' ? 'bg-emerald-50/50' : 'bg-red-50/50'}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Buy Pressure</div>
            <div className="text-3xl font-bold" style={{ color: netPressure === 'bullish' ? chartColors.positive : chartColors.negative }}>
              {buyPressure}%
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              {netPressure === 'bullish' ? (
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
              <span className={`text-sm font-bold ${netPressure === 'bullish' ? 'text-emerald-600' : 'text-red-500'}`}>
                {netPressure === 'bullish' ? 'Bullish' : 'Bearish'}
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Net Flow</div>
            <div className={`text-2xl font-bold ${totalNetFlow >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
              {totalNetFlow >= 0 ? '+' : ''}{totalNetFlow.toLocaleString()}
            </div>
          </div>
        </div>
        
        {/* Pressure Bar - UNIFIED HEIGHT */}
        <div className="mt-4">
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
            <div 
              className="h-full rounded-l-full transition-all duration-700 relative"
              style={{ 
                width: `${buyPressure}%`,
                background: 'linear-gradient(90deg, #00C9A7 0%, #4ADEC7 100%)',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-l-full" />
            </div>
            <div 
              className="h-full rounded-r-full transition-all duration-700 relative"
              style={{ 
                width: `${100 - parseFloat(buyPressure)}%`,
                background: 'linear-gradient(90deg, #FF8FA5 0%, #FF6B8A 100%)',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-r-full" />
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs font-semibold">
            <span className="text-emerald-600">Buyers</span>
            <span className="text-red-400">Sellers</span>
          </div>
        </div>
      </div>

      {/* View Mode Toggle - UNIFIED STYLE */}
      <div className="flex gap-2 mb-4">
        {[
          { value: 'tradesize', label: 'By Trade Size' },
          { value: 'aggregator', label: 'Aggregator Flow' },
        ].map(mode => (
          <button
            key={mode.value}
            onClick={() => setViewMode(mode.value)}
            className={`px-4 py-2 text-sm font-semibold rounded-2xl transition-all flex-1 ${
              viewMode === mode.value
                ? 'bg-gradient-to-r from-teal-400 to-cyan-500 text-white shadow-lg shadow-teal-500/20'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Trade Size View */}
      {viewMode === 'tradesize' && (
        <div className="flex-1 overflow-auto">
          {tradeSizeData.map((item, i) => (
            <TradeSizeBar
              key={i}
              size={item.size}
              buyVolume={item.buy}
              sellVolume={item.sell}
              netFlow={item.netFlow}
              maxVolume={8000}
            />
          ))}
        </div>
      )}

      {/* Aggregator Flow View */}
      {viewMode === 'aggregator' && (
        <div className="flex-1 overflow-auto">
          {aggregatorData.map((agg, i) => (
            <AggregatorBar
              key={i}
              name={agg.name}
              volume={agg.volume}
              pct={agg.pct}
              buyRatio={agg.buyRatio}
              color={agg.color}
            />
          ))}
        </div>
      )}

      {/* Alert */}
      {buyPressure > 55 && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-emerald-700">Strong Buy Signal</div>
            <div className="text-xs text-emerald-600">Whale accumulation detected with institutional inflow</div>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
