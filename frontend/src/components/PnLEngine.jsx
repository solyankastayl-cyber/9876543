import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Target, Award, AlertCircle, ArrowRightLeft, Clock } from 'lucide-react';
import { chartColors } from '../styles/chartTheme';
import { WhyButton } from './Explainability';

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

export default function PnLEngine() {
  const [viewMode, setViewMode] = useState('overview'); // overview | trades | positions
  const [timeframe, setTimeframe] = useState('6M');

  // Combined PnL data
  const pnlSummary = {
    realizedPnL: 436643, // Combined: Cost Basis + DEX Swaps
    unrealizedPnL: 112856,
    totalPnL: 549499,
    winRate: 66.8,
    avgWin: 13200,
    avgLoss: -3950,
    largestWin: 89500,
    largestLoss: -23400,
    totalTrades: 468, // CEX + DEX
    profitFactor: 3.34,
    totalSwaps: 234,
    totalVolume: 2450000,
  };

  // Positions (holdings from all sources)
  const positions = [
    { token: 'BTC', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png', costBasis: 42500, currentPrice: 94250, qty: 2.45, pnl: 126837, pnlPct: 54.7, source: 'CEX' },
    { token: 'ETH', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png', costBasis: 2850, currentPrice: 3342, qty: 61.5, pnl: 30293, pnlPct: 17.3, source: 'Mixed' },
    { token: 'SOL', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png', costBasis: 145, currentPrice: 178.43, qty: 1335, pnl: 44610, pnlPct: 23.1, source: 'Mixed' },
    { token: 'MATIC', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png', costBasis: 1.12, currentPrice: 0.87, qty: 89500, pnl: -22375, pnlPct: -22.3, source: 'CEX' },
    { token: 'UNI', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7083.png', costBasis: 13.89, currentPrice: 15.20, qty: 450, pnl: 589, pnlPct: 9.4, source: 'DEX' },
  ];

  // Trade History (Combined CEX + DEX)
  const tradeHistory = [
    { id: 1, type: 'buy', token: 'ETH', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png', amount: 10.5, priceAtEntry: 2380.95, currentPrice: 3342, pnl: 10089, pnlPct: 40.3, venue: 'Uniswap V3', time: '2h ago', source: 'DEX' },
    { id: 2, type: 'sell', token: 'ETH', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png', amount: 5.2, priceAtEntry: 2538.46, currentPrice: 3342, pnl: 4178, pnlPct: 31.7, venue: 'Binance', time: '5h ago', source: 'CEX' },
    { id: 3, type: 'buy', token: 'SOL', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png', amount: 85, priceAtEntry: 176.47, currentPrice: 168.50, pnl: -677, pnlPct: -4.5, venue: '1inch', time: '1d ago', source: 'DEX' },
    { id: 4, type: 'buy', token: 'UNI', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7083.png', amount: 450, priceAtEntry: 13.89, currentPrice: 15.20, pnl: 589, pnlPct: 9.4, venue: 'Uniswap V3', time: '2d ago', source: 'DEX' },
    { id: 5, type: 'buy', token: 'BTC', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png', amount: 2.45, priceAtEntry: 42500, currentPrice: 94250, pnl: 126837, pnlPct: 121.8, venue: 'Bybit', time: '3d ago', source: 'CEX' },
  ];

  // Cumulative PnL data
  const cumulativePnL = [
    { month: 'Jul', value: 48200, cumulative: 48200 },
    { month: 'Aug', value: 12300, cumulative: 60500 },
    { month: 'Sep', value: 89400, cumulative: 149900 },
    { month: 'Oct', value: 56700, cumulative: 206600 },
    { month: 'Nov', value: 134800, cumulative: 341400 },
    { month: 'Dec', value: 98100, cumulative: 439500 },
    { month: 'Jan', value: 110000, cumulative: 549500 },
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
        <div className="flex items-center gap-2">
          <h3 className="chart-title">PnL Engine</h3>
          <WhyButton 
            entityType="Unified PnL" 
            entityName="All Sources"
            reasons={[
              { icon: DollarSign, label: 'Cost Basis Method', detail: 'FIFO (First In, First Out) across all venues' },
              { icon: ArrowRightLeft, label: 'Multi-Source', detail: 'CEX deposits/withdrawals + DEX swaps combined' },
              { icon: TrendingUp, label: 'Real-time', detail: 'Live prices from CoinGecko + on-chain data' },
            ]}
          />
        </div>
        <div className="time-selector">
          {[
            { value: 'overview', label: 'Overview' },
            { value: 'trades', label: 'Trades' },
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
              <span className="chart-metric-label">Cumulative PnL (All Sources)</span>
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
                    <linearGradient id="pnlEngineGradient" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#pnlEngineGradient)"
                    dot={false}
                    activeDot={{ r: 5, stroke: chartColors.primary, strokeWidth: 2, fill: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {viewMode === 'trades' && (
        <div className="flex-1 overflow-auto">
          <div className="space-y-2">
            {tradeHistory.map((trade) => (
              <div key={trade.id} className={`p-3 rounded-2xl border ${trade.pnl >= 0 ? 'bg-emerald-50/30 border-emerald-100' : 'bg-red-50/30 border-red-100'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-0.5 rounded text-xs font-bold text-white`} style={{ background: trade.type === 'buy' ? chartColors.positive : chartColors.negative }}>
                      {trade.type.toUpperCase()}
                    </div>
                    <img src={trade.logo} alt={trade.token} className="w-5 h-5 rounded-full" />
                    <span className="text-sm font-semibold text-gray-900">{trade.amount} {trade.token}</span>
                    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${trade.source === 'CEX' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {trade.source}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{trade.venue}</span>
                    <Clock className="w-3 h-3" />
                    <span>{trade.time}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="text-gray-600">Entry: ${trade.priceAtEntry.toFixed(2)} → Current: ${trade.currentPrice.toFixed(2)}</div>
                  <div className="font-bold" style={{ color: trade.pnl >= 0 ? chartColors.positive : chartColors.negative }}>
                    {trade.pnl >= 0 ? '+' : ''}{formatValue(trade.pnl)} ({trade.pnl >= 0 ? '+' : ''}{trade.pnlPct}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'positions' && (
        <div className="flex-1 overflow-auto">
          <div className="space-y-2">
            {positions.map((pos, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl hover:bg-gray-100/50 transition-colors">
                <div className="flex items-center gap-3">
                  <img src={pos.logo} alt={pos.token} className="w-8 h-8 rounded-full" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{pos.token}</span>
                      <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${pos.source === 'CEX' ? 'bg-blue-100 text-blue-700' : pos.source === 'DEX' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                        {pos.source}
                      </span>
                    </div>
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
