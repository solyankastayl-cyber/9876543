import { useState } from 'react';
import { ArrowRight, Flame, Droplets, ExternalLink, RefreshCw } from 'lucide-react';

const GlassCard = ({ children, className = "", hover = false }) => (
  <div className={`glass-card ${hover ? 'hover:shadow-[0_6px_24px_rgba(0,0,0,0.1)] transition-all duration-300' : ''} ${className}`}>
    {children}
  </div>
);

export default function SupplyFlowMap({ tokenSymbol = 'ETH' }) {
  const [timeframe, setTimeframe] = useState('24h');

  const flowData = {
    '1h': {
      minted: 0,
      burned: 127.5,
      lp_added: 1250000,
      lp_removed: 890000,
      bridge_in: 345000,
      bridge_out: 234000,
    },
    '24h': {
      minted: 0,
      burned: 3847.2,
      lp_added: 45200000,
      lp_removed: 38900000,
      bridge_in: 12500000,
      bridge_out: 8900000,
    },
    '7d': {
      minted: 0,
      burned: 28456.8,
      lp_added: 234500000,
      lp_removed: 198700000,
      bridge_in: 89500000,
      bridge_out: 67800000,
    },
  };

  const currentFlow = flowData[timeframe];

  const bridgeBreakdown = [
    { name: 'Arbitrum', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png', in: 4500000, out: 2300000 },
    { name: 'Optimism', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11840.png', in: 3200000, out: 2100000 },
    { name: 'Polygon', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png', in: 2800000, out: 2500000 },
    { name: 'Base', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/27716.png', in: 2000000, out: 2000000 },
  ];

  const lpPools = [
    { dex: 'Uniswap V3', pair: `${tokenSymbol}/USDC`, tvl: 234000000, change: 2.4 },
    { dex: 'Curve', pair: `${tokenSymbol}/stETH`, tvl: 189000000, change: -1.2 },
    { dex: 'Balancer', pair: `${tokenSymbol}/WBTC`, tvl: 78000000, change: 0.8 },
  ];

  const formatValue = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const netMint = currentFlow.minted - currentFlow.burned;
  const netLP = currentFlow.lp_added - currentFlow.lp_removed;
  const netBridge = currentFlow.bridge_in - currentFlow.bridge_out;

  return (
    <GlassCard className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Supply Flow Map</h3>
        <div className="time-selector">
          {['1h', '24h', '7d'].map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`time-selector-btn ${timeframe === tf ? 'active' : ''}`}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="roi-box">
          <div className="roi-label">Mint/Burn</div>
          <div className={`roi-value ${netMint >= 0 ? 'positive' : 'negative'}`}>
            {netMint >= 0 ? '+' : ''}{netMint.toFixed(1)}
          </div>
        </div>
        <div className="roi-box">
          <div className="roi-label">LP Flow</div>
          <div className={`roi-value ${netLP >= 0 ? 'positive' : 'negative'}`}>
            {formatValue(netLP)}
          </div>
        </div>
        <div className="roi-box">
          <div className="roi-label">Bridge Flow</div>
          <div className={`roi-value ${netBridge >= 0 ? 'positive' : 'negative'}`}>
            {formatValue(netBridge)}
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-auto">
        <div className="space-y-2">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Bridge Activity</div>
          {bridgeBreakdown.map((bridge, i) => {
            const net = bridge.in - bridge.out;
            return (
              <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-2xl hover:bg-gray-100/50 transition-colors">
                <div className="flex items-center gap-2">
                  <img src={bridge.logo} alt={bridge.name} className="w-6 h-6 rounded-full" />
                  <span className="text-sm font-semibold text-gray-900">{bridge.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-500">In: {formatValue(bridge.in)}</div>
                    <div className="text-xs text-gray-500">Out: {formatValue(bridge.out)}</div>
                  </div>
                  <div className={`text-sm font-bold ${net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {net >= 0 ? '+' : ''}{formatValue(net)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Top LP Pools</div>
          {lpPools.map((pool, i) => (
            <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-2xl hover:bg-gray-100/50 transition-colors">
              <div>
                <div className="text-sm font-semibold text-gray-900">{pool.dex}</div>
                <div className="text-xs text-gray-500">{pool.pair}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900">{formatValue(pool.tvl)}</div>
                <div className={`text-xs font-semibold ${pool.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {pool.change >= 0 ? '+' : ''}{pool.change}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
