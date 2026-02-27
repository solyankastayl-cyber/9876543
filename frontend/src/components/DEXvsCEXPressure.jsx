import { useState } from 'react';
import { Activity, TrendingUp, TrendingDown, AlertTriangle, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { chartColors } from '../styles/chartTheme';

const GlassCard = ({ children, className = "", hover = false }) => (
  <div className={`glass-card ${hover ? 'glass-card-hover' : ''} ${className}`}>
    {children}
  </div>
);

// Custom Tooltip matching design
const PressureTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      <div className="chart-tooltip-separator" />
      {payload.map((entry, index) => (
        <div key={index} className="chart-tooltip-item">
          <span className="chart-tooltip-name" style={{ color: entry.color }}>{entry.name}</span>
          <span className="chart-tooltip-value">${Math.abs(entry.value).toLocaleString()}K</span>
        </div>
      ))}
    </div>
  );
};

export default function DEXvsCEXPressure() {
  const [selectedToken, setSelectedToken] = useState('ETH');
  const [timeframe, setTimeframe] = useState('24H');

  const tokens = ['ETH', 'BTC', 'SOL', 'ARB', 'MATIC'];
  
  const pressureData = {
    'ETH': {
      dex_net_buy: 45000000,
      cex_netflow: -23000000,
      dex_volume: 234000000,
      cex_volume: 456000000,
      sell_probability: 0.68,
      price_change: 3.4,
      hourly: [
        { time: '00:00', dex: 2300, cex: 1200, price: 2420 },
        { time: '04:00', dex: 3400, cex: 2100, price: 2445 },
        { time: '08:00', dex: 4500, cex: 3400, price: 2480 },
        { time: '12:00', dex: 5600, cex: 2800, price: 2510 },
        { time: '16:00', dex: 4200, cex: 3600, price: 2495 },
        { time: '20:00', dex: 3800, cex: 4200, price: 2520 },
      ],
    },
    'BTC': {
      dex_net_buy: 12000000,
      cex_netflow: 34000000,
      dex_volume: 89000000,
      cex_volume: 678000000,
      sell_probability: 0.23,
      price_change: 5.2,
      hourly: [
        { time: '00:00', dex: 1200, cex: 3400, price: 92000 },
        { time: '04:00', dex: 1500, cex: 4200, price: 93200 },
        { time: '08:00', dex: 1800, cex: 5600, price: 94100 },
        { time: '12:00', dex: 2100, cex: 6200, price: 94800 },
        { time: '16:00', dex: 1900, cex: 5800, price: 94200 },
        { time: '20:00', dex: 1600, cex: 4800, price: 94250 },
      ],
    },
    'SOL': {
      dex_net_buy: 23000000,
      cex_netflow: -12000000,
      dex_volume: 145000000,
      cex_volume: 234000000,
      sell_probability: 0.54,
      price_change: 2.1,
      hourly: [
        { time: '00:00', dex: 1800, cex: 900, price: 174 },
        { time: '04:00', dex: 2300, cex: 1200, price: 176 },
        { time: '08:00', dex: 2800, cex: 1800, price: 177 },
        { time: '12:00', dex: 3200, cex: 2100, price: 178 },
        { time: '16:00', dex: 2900, cex: 1600, price: 177 },
        { time: '20:00', dex: 2400, cex: 1400, price: 178 },
      ],
    },
    'ARB': {
      dex_net_buy: 34000000,
      cex_netflow: -28000000,
      dex_volume: 98000000,
      cex_volume: 156000000,
      sell_probability: 0.76,
      price_change: -1.8,
      hourly: [
        { time: '00:00', dex: 2800, cex: 2200, price: 1.12 },
        { time: '04:00', dex: 3200, cex: 2800, price: 1.10 },
        { time: '08:00', dex: 3900, cex: 3400, price: 1.08 },
        { time: '12:00', dex: 4200, cex: 4200, price: 1.05 },
        { time: '16:00', dex: 3800, cex: 3800, price: 1.06 },
        { time: '20:00', dex: 3200, cex: 3200, price: 1.08 },
      ],
    },
    'MATIC': {
      dex_net_buy: 15000000,
      cex_netflow: 8000000,
      dex_volume: 67000000,
      cex_volume: 123000000,
      sell_probability: 0.32,
      price_change: 4.6,
      hourly: [
        { time: '00:00', dex: 1200, cex: 800, price: 0.92 },
        { time: '04:00', dex: 1500, cex: 1200, price: 0.94 },
        { time: '08:00', dex: 1800, cex: 1400, price: 0.96 },
        { time: '12:00', dex: 2100, cex: 1600, price: 0.97 },
        { time: '16:00', dex: 1900, cex: 1300, price: 0.96 },
        { time: '20:00', dex: 1600, cex: 1100, price: 0.98 },
      ],
    },
  };

  const data = pressureData[selectedToken];

  const getRiskLevel = (probability) => {
    if (probability > 0.7) return { label: 'High Risk', color: 'text-red-500 bg-red-50', icon: AlertTriangle };
    if (probability > 0.5) return { label: 'Medium Risk', color: 'text-orange-500 bg-orange-50', icon: AlertTriangle };
    return { label: 'Low Risk', color: 'text-emerald-500 bg-emerald-50', icon: TrendingUp };
  };

  const risk = getRiskLevel(data.sell_probability);
  const RiskIcon = risk.icon;

  return (
    <div className="px-2 mb-6">
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Market Pressure Signal</h2>
              <p className="text-sm text-gray-500">Unified DEX/CEX flow analysis (drill-down available)</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {tokens.map(token => (
              <button
                key={token}
                onClick={() => setSelectedToken(token)}
                className={`px-4 py-2 text-sm font-semibold rounded-2xl transition-all ${
                  selectedToken === token
                    ? 'bg-gradient-to-r from-teal-400 to-cyan-500 text-white shadow-lg shadow-teal-500/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {token}
              </button>
            ))}
          </div>
        </div>

        {/* SIMPLIFIED: One unified signal */}
        <div className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Market Signal</div>
              <div className="text-4xl font-bold text-gray-900">{selectedToken}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Sell Pressure</div>
              <div className={`text-5xl font-bold ${data.sell_probability > 0.6 ? 'text-red-500' : data.sell_probability > 0.4 ? 'text-yellow-500' : 'text-emerald-500'}`}>
                {(data.sell_probability * 100).toFixed(0)}%
              </div>
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-2xl text-sm font-bold mt-2 ${risk.color}`}>
                <RiskIcon className="w-4 h-4" />
                {risk.label}
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-200">
            <div>
              <div className="text-xs text-gray-500 mb-1">DEX Net Flow</div>
              <div className={`text-lg font-bold ${data.dex_net_buy >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {data.dex_net_buy >= 0 ? '+' : ''}${(Math.abs(data.dex_net_buy) / 1e6).toFixed(1)}M
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">CEX Net Flow</div>
              <div className={`text-lg font-bold ${data.cex_netflow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {data.cex_netflow >= 0 ? '+' : ''}${(Math.abs(data.cex_netflow) / 1e6).toFixed(1)}M
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">24H Price Change</div>
              <div className={`text-lg font-bold ${data.price_change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {data.price_change >= 0 ? '+' : ''}{data.price_change}%
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button className="w-full mt-4 px-4 py-2 text-sm font-bold bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition-colors">
            📊 View Detailed Timeline (drill-down)
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
