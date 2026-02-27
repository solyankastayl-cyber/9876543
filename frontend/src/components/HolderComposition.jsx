import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { Users, Building, Zap, User, Code, GitBranch, TrendingUp, TrendingDown, Info, Search } from 'lucide-react';
import { WhyButton } from './Explainability';
import { chartColors } from '../styles/chartTheme';

const GlassCard = ({ children, className = "", hover = false }) => (
  <div className={`glass-card ${hover ? 'glass-card-hover' : ''} ${className}`}>
    {children}
  </div>
);

// Active shape for hover effect on donut
const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
  
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 4}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))' }}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={innerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill="#fff"
      />
    </g>
  );
};

export default function HolderComposition() {
  const [activeIndex, setActiveIndex] = useState(null);
  const [viewMode, setViewMode] = useState('freshness'); // DEFAULT: Freshness (more important)

  const compositionData = [
    { type: 'CEX', value: 35.2, count: 12, color: '#3B82F6', icon: Building, change: -2.3 },
    { type: 'Smart Money', value: 18.7, count: 234, color: '#8B5CF6', icon: Zap, change: 5.8 },
    { type: 'Funds', value: 12.4, count: 45, color: '#00C9A7', icon: Users, change: 1.2 },
    { type: 'Retail', value: 22.1, count: 8923, color: '#F97316', icon: User, change: -3.1 },
    { type: 'Contracts', value: 8.3, count: 67, color: '#EC4899', icon: Code, change: 0.8 },
    { type: 'Bridges', value: 3.3, count: 8, color: '#06B6D4', icon: GitBranch, change: -0.4 },
  ];

  const freshnessData = [
    { period: '<7 days', pct: 14.2, holders: 1247, color: '#FF6B8A' },
    { period: '7-30 days', pct: 32.3, holders: 2834, color: '#F97316' },
    { period: '30-90 days', pct: 36.0, holders: 3156, color: '#3B82F6' },
    { period: '>90 days', pct: 17.5, holders: 1540, color: '#00C9A7' },
  ];

  const strongHands = freshnessData.filter(f => f.period.includes('30-90') || f.period.includes('>90')).reduce((sum, f) => sum + f.pct, 0);

  const onPieEnter = (_, index) => setActiveIndex(index);
  const onPieLeave = () => setActiveIndex(null);

  return (
    <GlassCard className="p-5 h-full flex flex-col">
      {/* Header with Compare + Search (unified style) */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-600">Compare</span>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input 
              type="text"
              placeholder="Search holder"
              className="pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-2xl w-48 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all"
            />
          </div>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
          {['composition', 'freshness'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === mode
                  ? 'bg-white text-emerald-500 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {mode === 'composition' ? 'By Type' : 'Freshness'}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'composition' && (
        <>
          {/* Donut Chart with center info */}
          <div className="relative h-52 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={compositionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                >
                  {compositionData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Info */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                {activeIndex !== null ? (
                  <>
                    <div className="text-2xl font-bold text-gray-900">{compositionData[activeIndex].value}%</div>
                    <div className="text-xs text-gray-500">{compositionData[activeIndex].type}</div>
                    <div className="text-xs text-gray-400">{compositionData[activeIndex].count.toLocaleString()} holders</div>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-gray-900">100%</div>
                    <div className="text-xs text-gray-500">Total Supply</div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Legend with horizontal bars - UNIFIED STYLE */}
          <div className="flex-1 space-y-2">
            {compositionData.map((item, i) => {
              const Icon = item.icon;
              const isPositive = item.change >= 0;
              return (
                <div 
                  key={i} 
                  className={`flex items-center gap-3 p-3 rounded-2xl transition-all cursor-pointer ${activeIndex === i ? 'bg-gray-100 shadow-sm' : 'hover:bg-gray-50'}`}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: `${item.color}15` }}>
                    <Icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-gray-800">{item.type}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{item.value}%</span>
                        <span className={`text-xs font-semibold flex items-center gap-0.5 ${isPositive ? 'text-emerald-500' : 'text-red-400'}`}>
                          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {isPositive ? '+' : ''}{item.change}%
                        </span>
                      </div>
                    </div>
                    
                    {/* Progress bar - smooth rounded ends */}
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className="h-full rounded-full transition-all duration-500 relative"
                        style={{ 
                          width: `${item.value}%`,
                          background: `linear-gradient(90deg, ${item.color}cc 0%, ${item.color} 100%)`
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {viewMode === 'freshness' && (
        <div className="flex-1">
          {/* Strong Hands Indicator */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Strong Hands (>30d)</div>
                <div className="text-3xl font-bold text-emerald-600">{strongHands.toFixed(1)}%</div>
              </div>
              <div className="w-16 h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[{ value: strongHands }, { value: 100 - strongHands }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={20}
                      outerRadius={30}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                    >
                      <Cell fill="#00C9A7" />
                      <Cell fill="#E5E7EB" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Freshness Breakdown */}
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Holding Duration</div>
          <div className="space-y-3">
            {freshnessData.map((item, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                    <span className="text-sm font-semibold text-gray-800">{item.period}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-900">{item.pct}%</span>
                    <span className="text-xs text-gray-500 ml-2">({item.holders.toLocaleString()})</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-700"
                    style={{ 
                      width: `${item.pct}%`,
                      background: `linear-gradient(90deg, ${item.color}99 0%, ${item.color} 100%)`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Summary */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-gray-500">
            <Info className="w-3.5 h-3.5" />
            <span>Data updated 5m ago</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="text-gray-500">CEX Dominance:</span>
              <span className="font-bold text-blue-600">35.2%</span>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
