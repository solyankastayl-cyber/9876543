import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ArrowRightLeft, DollarSign, TrendingUp, Clock, ExternalLink } from 'lucide-react';
import { chartColors } from '../styles/chartTheme';
import { WhyButton } from './Explainability';

const GlassCard = ({ children, className = "", hover = false }) => (
  <div className={`glass-card ${hover ? 'glass-card-hover' : ''} ${className}`}>
    {children}
  </div>
);

// Custom Tooltip
const SwapTooltip = ({ active, payload, label }) => {
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

export default function SwapsPnL() {
  const [viewMode, setViewMode] = useState('summary');
  const [timeframe, setTimeframe] = useState('6M');

  const pnlSummary = {
    totalSwaps: 234,
    totalVolume: 2450000,
    realizedPnL: 89450,
    unrealizedPnL: 23400,
    winRate: 64.2,
  };

  const swapHistory = [
    { id: 1, type: 'buy', tokenIn: 'USDC', tokenOut: 'ETH', tokenOutLogo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png', amountIn: 25000, amountOut: 10.5, priceAtSwap: 2380.95, currentPrice: 2520, pnl: 1460.53, pnlPct: 5.8, dex: 'Uniswap V3', time: '2h ago', status: 'profit' },
    { id: 2, type: 'sell', tokenIn: 'ETH', tokenOut: 'USDC', tokenOutLogo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png', amountIn: 5.2, amountOut: 13200, priceAtSwap: 2538.46, currentPrice: 2520, pnl: 96.00, pnlPct: 0.7, dex: 'Uniswap V3', time: '5h ago', status: 'profit' },
    { id: 3, type: 'buy', tokenIn: 'USDC', tokenOut: 'SOL', tokenOutLogo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png', amountIn: 15000, amountOut: 85, priceAtSwap: 176.47, currentPrice: 168.50, pnl: -677.45, pnlPct: -4.5, dex: '1inch', time: '1d ago', status: 'loss' },
    { id: 4, type: 'buy', tokenIn: 'ETH', tokenOut: 'UNI', tokenOutLogo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7083.png', amountIn: 2.5, amountOut: 450, priceAtSwap: 13.89, currentPrice: 15.20, pnl: 589.50, pnlPct: 9.4, dex: 'Uniswap V3', time: '2d ago', status: 'profit' },
    { id: 5, type: 'sell', tokenIn: 'AAVE', tokenOut: 'USDC', tokenOutLogo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png', amountIn: 25, amountOut: 4875, priceAtSwap: 195.00, currentPrice: 188.50, pnl: 162.50, pnlPct: 3.4, dex: 'Cowswap', time: '3d ago', status: 'profit' },
  ];

  const positions = [
    { token: 'ETH', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png', amount: 15.7, avgCost: 2340, currentPrice: 2520, value: 39564, pnl: 2826, pnlPct: 7.7 },
    { token: 'SOL', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png', amount: 85, avgCost: 176.47, currentPrice: 168.50, value: 14322.50, pnl: -677.45, pnlPct: -4.5 },
    { token: 'UNI', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7083.png', amount: 450, avgCost: 13.89, currentPrice: 15.20, value: 6840, pnl: 589.50, pnlPct: 9.4 },
  ];

  // Cumulative PnL data for area chart
  const cumulativePnL = [
    { month: 'Aug', value: -2400, cumulative: -2400 },
    { month: 'Sep', value: 8900, cumulative: 6500 },
    { month: 'Oct', value: 12500, cumulative: 19000 },
    { month: 'Nov', value: -3200, cumulative: 15800 },
    { month: 'Dec', value: 23400, cumulative: 39200 },
    { month: 'Jan', value: 15600, cumulative: 54800 },
  ];

  const formatValue = (value) => {
    if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(2)}`;
  };

  return (
    <GlassCard className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="chart-title">DEX Swaps PnL</h3>
          <WhyButton 
            entityType="Smart Money" 
            entityName="PnL Calculation"
            reasons={[
              { icon: DollarSign, label: 'Cost Basis Method', detail: 'FIFO (First In, First Out) for realized gains' },
              { icon: ArrowRightLeft, label: 'Swap Detection', detail: 'Tracks all DEX swaps via on-chain events' },
              { icon: TrendingUp, label: 'Price Source', detail: 'Real-time prices from CoinGecko API' },
            ]}
          />
        </div>
        <div className="time-selector">
          {[
            { value: 'summary', label: 'Summary' },
            { value: 'swaps', label: 'Swaps' },
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

      {viewMode === 'summary' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="chart-metric">
              <div className="chart-metric-label">Realized PnL</div>
              <div className="chart-metric-value positive">+{formatValue(pnlSummary.realizedPnL)}</div>
            </div>
            <div className="chart-metric">
              <div className="chart-metric-label">Unrealized PnL</div>
              <div className="text-lg font-bold text-blue-600">+{formatValue(pnlSummary.unrealizedPnL)}</div>
            </div>
            <div className="chart-metric">
              <div className="chart-metric-label">Win Rate</div>
              <div className="text-lg font-bold text-purple-600">{pnlSummary.winRate}%</div>
            </div>
          </div>

          {/* Cumulative Area Chart */}
          <div className="flex-1 mb-4">
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
                    <linearGradient id="swapPnlGradient" x1="0" y1="0" x2="0" y2="1">
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
                  <Tooltip content={<SwapTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="cumulative" 
                    stroke={chartColors.primary}
                    strokeWidth={2.5}
                    fill="url(#swapPnlGradient)"
                    dot={false}
                    activeDot={{ r: 5, stroke: chartColors.primary, strokeWidth: 2, fill: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500">Total Swaps</div>
              <div className="text-sm font-bold text-gray-900">{pnlSummary.totalSwaps}</div>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500">Total Volume</div>
              <div className="text-sm font-bold text-gray-900">{formatValue(pnlSummary.totalVolume)}</div>
            </div>
          </div>
        </>
      )}

      {viewMode === 'swaps' && (
        <div className="flex-1 overflow-auto">
          <div className="space-y-2">
            {swapHistory.map((swap) => (
              <div key={swap.id} className={`p-3 rounded-2xl border ${swap.status === 'profit' ? 'bg-emerald-50/30 border-emerald-100' : 'bg-red-50/30 border-red-100'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-0.5 rounded text-xs font-bold ${swap.type === 'buy' ? 'text-white' : 'text-white'}`} style={{ background: swap.type === 'buy' ? chartColors.positive : chartColors.negative }}>
                      {swap.type.toUpperCase()}
                    </div>
                    <img src={swap.tokenOutLogo} alt="" className="w-5 h-5 rounded-full" />
                    <span className="text-sm font-semibold text-gray-900">
                      {swap.type === 'buy' ? `${swap.amountOut} ${swap.tokenOut}` : `${swap.amountIn} ${swap.tokenIn}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{swap.dex}</span>
                    <Clock className="w-3 h-3" />
                    <span>{swap.time}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="text-gray-600">Price: ${swap.priceAtSwap.toFixed(2)} → ${swap.currentPrice.toFixed(2)}</div>
                  <div className="font-bold" style={{ color: swap.pnl >= 0 ? chartColors.positive : chartColors.negative }}>
                    {swap.pnl >= 0 ? '+' : ''}{formatValue(swap.pnl)} ({swap.pnl >= 0 ? '+' : ''}{swap.pnlPct}%)
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
              <div key={i} className="p-3 bg-gray-50 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <img src={pos.logo} alt={pos.token} className="w-8 h-8 rounded-full" />
                    <div>
                      <div className="font-bold text-gray-900">{pos.token}</div>
                      <div className="text-xs text-gray-500">{pos.amount} tokens</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{formatValue(pos.value)}</div>
                    <div className="text-xs font-bold" style={{ color: pos.pnl >= 0 ? chartColors.positive : chartColors.negative }}>
                      {pos.pnl >= 0 ? '+' : ''}{formatValue(pos.pnl)} ({pos.pnl >= 0 ? '+' : ''}{pos.pnlPct}%)
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Avg Cost: ${pos.avgCost.toFixed(2)}</span>
                  <span>Current: ${pos.currentPrice.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Total */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Total PnL:</span>
          <span className="font-bold" style={{ color: chartColors.positive }}>
            +{formatValue(pnlSummary.realizedPnL + pnlSummary.unrealizedPnL)}
          </span>
        </div>
      </div>
    </GlassCard>
  );
}
