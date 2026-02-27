import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Sector } from 'recharts';
import { Activity, ArrowUpRight, ArrowDownRight, Repeat, Wallet, Send, Download, TrendingUp, Clock } from 'lucide-react';
import { chartColors } from '../styles/chartTheme';

const GlassCard = ({ children, className = "", hover = false }) => (
  <div className={`glass-card ${hover ? 'glass-card-hover' : ''} ${className}`}>
    {children}
  </div>
);

// Activity type icons
const activityIcons = {
  'Buys': { icon: ArrowUpRight, color: '#00C9A7' },
  'Sells': { icon: ArrowDownRight, color: '#FF6B8A' },
  'Swaps': { icon: Repeat, color: '#8B5CF6' },
  'Transfers In': { icon: Download, color: '#3B82F6' },
  'Transfers Out': { icon: Send, color: '#F97316' },
};

// Custom Tooltip
const ActivityTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{data.type}</div>
      <div className="chart-tooltip-separator" />
      <div className="chart-tooltip-item">
        <span className="chart-tooltip-name">Count</span>
        <span className="chart-tooltip-value">{data.count.toLocaleString()}</span>
      </div>
      <div className="chart-tooltip-item">
        <span className="chart-tooltip-name">Volume</span>
        <span className="chart-tooltip-value">${(data.volume / 1e6).toFixed(1)}M</span>
      </div>
      <div className="chart-tooltip-item">
        <span className="chart-tooltip-name">Share</span>
        <span className="chart-tooltip-value">{data.pct}%</span>
      </div>
    </div>
  );
};

// Horizontal Activity Bar
const ActivityBar = ({ type, count, volume, pct, maxPct = 40 }) => {
  const config = activityIcons[type] || { icon: Activity, color: '#6B7280' };
  const Icon = config.icon;
  const barWidth = (pct / maxPct) * 100;
  
  return (
    <div className="py-3 border-b border-gray-100/50 last:border-0 group hover:bg-gray-50/30 rounded-2xl px-2 -mx-2 transition-all">
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${config.color}15` }}
        >
          <Icon className="w-5 h-5" style={{ color: config.color }} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-semibold text-gray-800">{type}</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">{count.toLocaleString()} txns</span>
              <span className="text-sm font-bold" style={{ color: config.color }}>{pct}%</span>
            </div>
          </div>
          
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-700 ease-out relative"
              style={{ 
                width: `${barWidth}%`,
                background: `linear-gradient(90deg, ${config.color}99 0%, ${config.color} 100%)`,
                boxShadow: `0 2px 8px ${config.color}30`
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-full" />
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-400">Volume: ${(volume / 1e6).toFixed(1)}M</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ActivityBreakdown({ tokenSymbol = 'ETH' }) {
  const [timeframe, setTimeframe] = useState('24H');
  const [viewMode, setViewMode] = useState('breakdown');

  const activityData = {
    '24H': [
      { type: 'Buys', count: 4523, volume: 45600000, pct: 32.4 },
      { type: 'Sells', count: 3890, volume: 38900000, pct: 27.8 },
      { type: 'Swaps', count: 2345, volume: 23450000, pct: 16.8 },
      { type: 'Transfers In', count: 1678, volume: 16780000, pct: 12.0 },
      { type: 'Transfers Out', count: 1534, volume: 15340000, pct: 11.0 },
    ],
    '7D': [
      { type: 'Buys', count: 28450, volume: 284500000, pct: 34.2 },
      { type: 'Sells', count: 22340, volume: 223400000, pct: 26.8 },
      { type: 'Swaps', count: 15670, volume: 156700000, pct: 18.8 },
      { type: 'Transfers In', count: 9234, volume: 92340000, pct: 11.1 },
      { type: 'Transfers Out', count: 7560, volume: 75600000, pct: 9.1 },
    ],
  };

  const hourlyActivity = [
    { hour: '00', buys: 120, sells: 98 },
    { hour: '04', buys: 85, sells: 72 },
    { hour: '08', buys: 234, sells: 189 },
    { hour: '12', buys: 345, sells: 312 },
    { hour: '16', buys: 456, sells: 398 },
    { hour: '20', buys: 289, sells: 245 },
  ];

  const currentData = activityData[timeframe] || activityData['24H'];
  const totalTxns = currentData.reduce((sum, d) => sum + d.count, 0);
  const totalVolume = currentData.reduce((sum, d) => sum + d.volume, 0);
  const buyPct = currentData.find(d => d.type === 'Buys')?.pct || 0;
  const sellPct = currentData.find(d => d.type === 'Sells')?.pct || 0;
  const netSentiment = buyPct > sellPct ? 'bullish' : 'bearish';

  const timeframes = ['1H', '24H', '7D', '30D'];

  return (
    <GlassCard className="p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Activity Breakdown</h3>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 bg-gray-50 rounded-2xl">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-semibold text-gray-500">Transactions</span>
          </div>
          <div className="text-xl font-bold text-gray-900">{(totalTxns / 1000).toFixed(1)}K</div>
        </div>
        
        <div className="p-3 bg-gray-50 rounded-2xl">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-semibold text-gray-500">Volume</span>
          </div>
          <div className="text-xl font-bold text-gray-900">${(totalVolume / 1e6).toFixed(0)}M</div>
        </div>
        
        <div className={`p-3 rounded-2xl ${netSentiment === 'bullish' ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className={`w-4 h-4 ${netSentiment === 'bullish' ? 'text-emerald-500' : 'text-red-400 rotate-180'}`} />
            <span className={`text-xs font-semibold ${netSentiment === 'bullish' ? 'text-emerald-600' : 'text-red-500'}`}>Sentiment</span>
          </div>
          <div className={`text-xl font-bold ${netSentiment === 'bullish' ? 'text-emerald-600' : 'text-red-500'}`}>
            {netSentiment === 'bullish' ? 'Bullish' : 'Bearish'}
          </div>
        </div>
      </div>

      {/* Buy vs Sell Quick Bar */}
      <div className="mb-4 p-3 bg-gray-50 rounded-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-emerald-600">Buys {buyPct}%</span>
          <span className="text-xs font-semibold text-red-400">Sells {sellPct}%</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden flex">
          <div 
            className="h-full transition-all duration-500"
            style={{ 
              width: `${buyPct}%`,
              background: 'linear-gradient(90deg, #00C9A7 0%, #4ADEC7 100%)'
            }}
          />
          <div 
            className="h-full transition-all duration-500"
            style={{ 
              width: `${sellPct}%`,
              background: 'linear-gradient(90deg, #FF8FA5 0%, #FF6B8A 100%)'
            }}
          />
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-4">
        {[
          { value: 'breakdown', label: 'Breakdown' },
          { value: 'hourly', label: 'Hourly' },
        ].map(mode => (
          <button
            key={mode.value}
            onClick={() => setViewMode(mode.value)}
            className={`px-4 py-2 text-xs font-semibold rounded-2xl transition-all flex-1 ${
              viewMode === mode.value
                ? 'bg-white text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Activity Breakdown View */}
      {viewMode === 'breakdown' && (
        <div className="flex-1 overflow-auto">
          {currentData.map((item, i) => (
            <ActivityBar
              key={i}
              type={item.type}
              count={item.count}
              volume={item.volume}
              pct={item.pct}
            />
          ))}
        </div>
      )}

      {/* Hourly View */}
      {viewMode === 'hourly' && (
        <div className="flex-1">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyActivity} barGap={2}>
                <XAxis 
                  dataKey="hour" 
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  stroke="transparent"
                  tickLine={false}
                  tickFormatter={(v) => `${v}:00`}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  stroke="transparent"
                  tickLine={false}
                />
                <Tooltip content={<ActivityTooltip />} />
                <Bar dataKey="buys" fill="url(#buysGradient)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sells" fill="url(#sellsGradient)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="buysGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00C9A7" stopOpacity={1} />
                    <stop offset="100%" stopColor="#4ADEC7" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="sellsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF6B8A" stopOpacity={1} />
                    <stop offset="100%" stopColor="#FF8FA5" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" />
              <span className="text-xs text-gray-600">Buys</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-300 to-red-400" />
              <span className="text-xs text-gray-600">Sells</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Updated 2m ago</span>
          </div>
          <span>Peak: 16:00 UTC ({Math.max(...hourlyActivity.map(h => h.buys + h.sells))} txns)</span>
        </div>
      </div>
    </GlassCard>
  );
}
