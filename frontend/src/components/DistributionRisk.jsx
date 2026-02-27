import { useState } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { Shield, TrendingUp, TrendingDown, Search, ChevronDown, Info } from 'lucide-react';
import { chartColors } from '../styles/chartTheme';

const GlassCard = ({ children, className = "", hover = false }) => (
  <div className={`glass-card ${hover ? 'glass-card-hover' : ''} ${className}`}>
    {children}
  </div>
);

// Modern Horizontal Bar with gradient - COMPACT version
const HorizontalBar = ({ label, value, maxValue = 100, color = '#00C9A7', showValue = true, subLabel = '', isNegative = false }) => {
  const percentage = Math.min((Math.abs(value) / maxValue) * 100, 100);
  const barColor = isNegative ? '#FF6B8A' : color;
  
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-100/50 last:border-0">
      <div className="w-28 flex-shrink-0">
        <div className="text-xs font-semibold text-gray-800">{label}</div>
        {subLabel && <div className="text-[10px] text-gray-500">{subLabel}</div>}
      </div>
      
      <div className="flex-1 relative">
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full rounded-full transition-all duration-700 ease-out relative"
            style={{ 
              width: `${percentage}%`,
              background: `linear-gradient(90deg, ${barColor}cc 0%, ${barColor} 100%)`,
              boxShadow: `0 1px 4px ${barColor}30`
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent rounded-full" />
          </div>
        </div>
      </div>
      
      {showValue && (
        <div className="w-14 text-right">
          <span className={`text-sm font-bold ${isNegative ? 'text-red-400' : 'text-gray-900'}`}>
            {isNegative ? '-' : ''}{typeof value === 'number' ? value.toFixed(1) : value}%
          </span>
        </div>
      )}
    </div>
  );
};

// ROI Multiplier Bar - COMPACT version
const MultiplierBar = ({ name, logo, multiplier, maxMultiplier = 15, isAverage = false }) => {
  const percentage = (multiplier / maxMultiplier) * 100;
  const barColor = isAverage ? '#94A3B8' : multiplier < 6 ? '#FF6B8A' : '#00C9A7';
  
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-32 flex items-center gap-2 flex-shrink-0">
        {logo ? (
          <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
            <img src={logo} alt={name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <span className="text-[10px] font-bold text-gray-600">{name.slice(0, 2).toUpperCase()}</span>
          </div>
        )}
        <span className={`text-xs font-semibold ${isAverage ? 'text-gray-500 italic' : 'text-gray-800'}`}>
          {name}
        </span>
      </div>
      
      <div className="flex-1 relative">
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full rounded-full transition-all duration-700 ease-out relative"
            style={{ 
              width: `${percentage}%`,
              background: isAverage 
                ? 'linear-gradient(90deg, #CBD5E1 0%, #94A3B8 100%)'
                : `linear-gradient(90deg, ${barColor}bb 0%, ${barColor} 100%)`,
              boxShadow: `0 1px 4px ${barColor}25`
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full" />
          </div>
        </div>
      </div>
      
      <div className="w-12 text-right">
        <span className={`text-xs font-bold ${isAverage ? 'text-gray-500' : multiplier < 6 ? 'text-red-400' : 'text-gray-900'}`}>
          x{multiplier}
        </span>
      </div>
    </div>
  );
};

export default function DistributionRisk({ tokenSymbol = 'ETH' }) {
  const [viewMode, setViewMode] = useState('allocation');
  const [timeframe, setTimeframe] = useState('30D');

  // Industry allocation data (like in screenshot 1)
  const industryAllocation = [
    { name: 'DeFi', value: 34.2, projects: 156, topProject: 'Uniswap', change: 8.5, color: '#00C9A7' },
    { name: 'NFT/Gaming', value: 22.8, projects: 89, topProject: 'Axie Infinity', change: 3.2, color: '#3B82F6' },
    { name: 'L2 Solutions', value: 18.5, projects: 45, topProject: 'Arbitrum', change: 12.4, color: '#8B5CF6' },
    { name: 'AI/ML', value: 12.3, projects: 34, topProject: 'Render', change: 25.7, color: '#F97316' },
    { name: 'Memecoins', value: 8.7, projects: 234, topProject: 'PEPE', change: -15.3, color: '#FF6B8A' },
    { name: 'RWA', value: 3.5, projects: 12, topProject: 'Ondo', change: 45.2, color: '#06B6D4' },
  ];

  // ROI multiplier data (like in screenshot 3)
  const roiMultipliers = [
    { name: 'Axie Infinity', multiplier: 13.2, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/6783.png' },
    { name: 'The Sandbox', multiplier: 12.5, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/6210.png' },
    { name: 'Decentraland', multiplier: 9.0, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1966.png' },
    { name: 'Industry Average', multiplier: 6.0, logo: null, isAverage: true },
    { name: 'SharkRace Club', multiplier: 4.0, logo: null },
  ];

  // Risk indicators
  const riskMetrics = {
    hhi: 847,
    hhiLabel: 'Low Concentration',
    whaleControl: 32.4,
    cexConcentration: 14.6,
    top10Control: 38.2,
  };

  const timeframes = ['24H', '7D', '30D', '90D', 'YTD'];

  return (
    <GlassCard className="p-5 h-full flex flex-col">
      {/* Header with Compare + Search */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-600">Compare</span>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input 
              type="text"
              placeholder="Search project"
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

      {/* View Mode Toggle */}
      <div className="flex gap-2 mb-5">
        {[
          { value: 'allocation', label: 'Industry Allocation' },
          { value: 'roi', label: 'ROI Multiplier' },
        ].map(mode => (
          <button
            key={mode.value}
            onClick={() => setViewMode(mode.value)}
            className={`px-4 py-2 text-sm font-semibold rounded-2xl transition-all ${
              viewMode === mode.value
                ? 'bg-gradient-to-r from-teal-400 to-cyan-500 text-white shadow-lg shadow-teal-500/20'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Industry Allocation View */}
      {viewMode === 'allocation' && (
        <div className="flex-1">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Investment Allocation by Industry</div>
          
          <div className="space-y-1">
            {industryAllocation.map((item) => (
              <div key={item.name} className="relative group">
                <HorizontalBar
                  label={item.name}
                  subLabel={`${item.projects} projects`}
                  value={item.value}
                  maxValue={40}
                  color={item.color}
                  isNegative={item.change < 0}
                />
                
                {/* Tooltip on hover - FIXED positioning */}
                <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10">
                  <div className="bg-white text-white p-3 rounded-2xl shadow-xl min-w-[180px]">
                    <div className="text-xs text-gray-400 mb-1">Top Project</div>
                    <div className="font-bold">{item.topProject}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-400">Change:</span>
                      <span className={`text-sm font-bold ${item.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {item.change >= 0 ? '+' : ''}{item.change}%
                      </span>
                    </div>
                    <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-8 border-transparent border-r-slate-900" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Risk Metrics */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Concentration Risk</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-700">HHI Index</span>
                </div>
                <div className="text-2xl font-bold text-emerald-600">{riskMetrics.hhi}</div>
                <div className="text-xs text-emerald-600">{riskMetrics.hhiLabel}</div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-2xl">
                <div className="text-xs text-gray-500 mb-1">Top 10 Control</div>
                <div className="text-xl font-bold text-gray-900">{riskMetrics.top10Control}%</div>
                <div className="h-1.5 bg-gray-200 rounded-full mt-1">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
                    style={{ width: `${(riskMetrics.top10Control / 50) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROI Multiplier View */}
      {viewMode === 'roi' && (
        <div className="flex-1">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">ROI Multiplier vs. Top Performers</div>
          
          <div className="space-y-0">
            {roiMultipliers.map((item) => (
              <MultiplierBar
                key={item.name}
                name={item.name}
                logo={item.logo}
                multiplier={item.multiplier}
                isAverage={item.isAverage}
              />
            ))}
          </div>
          
          {/* Legend */}
          <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" />
              <span>Above Average</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-gray-300 to-gray-400" />
              <span>Industry Average</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-300 to-red-400" />
              <span>Below Average</span>
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
