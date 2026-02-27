import { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, CartesianGrid } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Target, Award, AlertCircle } from 'lucide-react';
import { chartColors } from '../styles/chartTheme';

const GlassCard = ({ children, className = "", hover = false }) => (
  <div className={`glass-card ${hover ? 'glass-card-hover' : ''} ${className}`}>
    {children}
  </div>
);

// Custom Tooltip
const PnLTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  
  const value = payload[0]?.value || 0;
  const isPositive = value >= 0;
  
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      <div className="chart-tooltip-separator" />
      <div className="chart-tooltip-item">
        <span className="chart-tooltip-name">PnL</span>
        <span className="chart-tooltip-value" style={{ color: isPositive ? chartColors.positive : chartColors.negative }}>
          {isPositive ? '+' : ''}${(Math.abs(value) / 1000).toFixed(1)}K
        </span>
      </div>
    </div>
  );
};

export default function CostBasisPnL() {
  const [viewMode, setViewMode] = useState('overview');
  const [timeframe, setTimeframe] = useState('6M');

  const pnlSummary = {
    realizedPnL: 347193,
    unrealizedPnL: 89456,
    totalPnL: 436649,
    winRate: 68.4,
    avgWin: 12450,
    avgLoss: -4230,
    largestWin: 89500,
    largestLoss: -23400,
    totalTrades: 234,
    profitFactor: 2.94,
  };

  const positions = [
    { token: 'BTC', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png', costBasis: 42500, currentPrice: 94250, qty: 2.45, pnl: 126837, pnlPct: 54.7, status: 'profit' },
    { token: 'ETH', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png', costBasis: 2850, currentPrice: 3342, qty: 45.8, pnl: 22533, pnlPct: 17.3, status: 'profit' },
    { token: 'SOL', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png', costBasis: 145, currentPrice: 178.43, qty: 1250, pnl: 41787, pnlPct: 23.1, status: 'profit' },
    { token: 'MATIC', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png', costBasis: 1.12, currentPrice: 0.87, qty: 89500, pnl: -22375, pnlPct: -22.3, status: 'loss' },
    { token: 'AVAX', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png', costBasis: 38.50, currentPrice: 42.80, qty: 450, pnl: 1935, pnlPct: 11.2, status: 'profit' },
  ];

  // Cumulative PnL for area chart
  const cumulativePnL = [
    { month: 'Jul', value: 34500, cumulative: 34500 },
    { month: 'Aug', value: -8200, cumulative: 26300 },
    { month: 'Sep', value: 56700, cumulative: 83000 },
    { month: 'Oct', value: 23400, cumulative: 106400 },
    { month: 'Nov', value: 67800, cumulative: 174200 },
    { month: 'Dec', value: 45200, cumulative: 219400 },
  ];

  const winLossData = [
    { name: 'Wins', value: pnlSummary.winRate, color: chartColors.positive },
    { name: 'Losses', value: 100 - pnlSummary.winRate, color: chartColors.negative },
  ];

  const formatValue = (value) => {
    if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <GlassCard className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="chart-title">Cost Basis & PnL</h3>
        <div className="time-selector">
          {[
            { value: 'overview', label: 'Overview' },
            { value: 'positions', label: 'Positions' },
          ].map(mode => (
            <button
              key={mode.value}
              onClick={() => setViewMode(mode.value)}
              className={`time-selector-btn ${viewMode === mode.value ? 'active' : ''}`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'overview' && (
        <>
          {/* PnL Summary Cards */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="chart-metric">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4" style={{ color: chartColors.positive }} />
                <span className="chart-metric-label">Realized</span>
              </div>
              <div className="chart-metric-value positive">+{formatValue(pnlSummary.realizedPnL)}</div>
            </div>
            <div className="chart-metric">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-blue-500" />
                <span className="chart-metric-label">Unrealized</span>
              </div>
              <div className="text-lg font-bold text-blue-600">+{formatValue(pnlSummary.unrealizedPnL)}</div>
            </div>
            <div className="chart-metric">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-purple-500" />
                <span className="chart-metric-label">Total PnL</span>
              </div>
              <div className="text-lg font-bold text-purple-600">+{formatValue(pnlSummary.totalPnL)}</div>
            </div>
          </div>

          {/* Win Rate & Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-20 h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={winLossData}
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={38}
                      dataKey="value"
                    >
                      {winLossData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{pnlSummary.winRate}%</div>
                <div className="text-xs text-gray-500">Win Rate</div>
                <div className="text-xs text-gray-500 mt-1">{pnlSummary.totalTrades} trades</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Avg Win</span>
                <span className="font-bold" style={{ color: chartColors.positive }}>+{formatValue(pnlSummary.avgWin)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Avg Loss</span>
                <span className="font-bold" style={{ color: chartColors.negative }}>{formatValue(pnlSummary.avgLoss)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Profit Factor</span>
                <span className="font-bold text-gray-900">{pnlSummary.profitFactor}x</span>
              </div>
            </div>
          </div>

          {/* Cumulative PnL Area Chart */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="chart-metric-label">Cumulative PnL</span>
              <div className="time-selector">
                {['3M', '6M', '1Y'].map(tf => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`time-selector-btn ${timeframe === tf ? 'active' : ''}`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cumulativePnL}>
                  <defs>
                    <linearGradient id="pnlAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColors.primary} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={chartColors.primary} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="0" stroke="rgba(0,0,0,0.03)" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 500 }} 
                    stroke="transparent"
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 500 }} 
                    stroke="transparent"
                    tickLine={false}
                    tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`}
                    width={50}
                  />
                  <Tooltip content={<PnLTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="cumulative" 
                    stroke={chartColors.primary}
                    strokeWidth={2.5}
                    fill="url(#pnlAreaGradient)"
                    dot={false}
                    activeDot={{ r: 5, stroke: chartColors.primary, strokeWidth: 2, fill: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {viewMode === 'positions' && (
        <div className="flex-1 overflow-auto">
          <div className="space-y-2">
            {positions.map((pos, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl hover:bg-gray-100/50 transition-colors">
                <div className="flex items-center gap-3">
                  <img src={pos.logo} alt={pos.token} className="w-8 h-8 rounded-full" />
                  <div>
                    <div className="font-bold text-gray-900">{pos.token}</div>
                    <div className="text-xs text-gray-500">{pos.qty.toLocaleString()} tokens</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">
                    ${pos.costBasis.toLocaleString()} → ${pos.currentPrice.toLocaleString()}
                  </div>
                  <div className="font-bold" style={{ color: pos.pnl >= 0 ? chartColors.positive : chartColors.negative }}>
                    {pos.pnl >= 0 ? '+' : ''}{formatValue(pos.pnl)} ({pos.pnl >= 0 ? '+' : ''}{pos.pnlPct}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Best/Worst Trades */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Award className="w-3.5 h-3.5" style={{ color: chartColors.positive }} />
            <span className="text-gray-500">Best:</span>
            <span className="font-bold" style={{ color: chartColors.positive }}>+{formatValue(pnlSummary.largestWin)}</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5" style={{ color: chartColors.negative }} />
            <span className="text-gray-500">Worst:</span>
            <span className="font-bold" style={{ color: chartColors.negative }}>{formatValue(pnlSummary.largestLoss)}</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
