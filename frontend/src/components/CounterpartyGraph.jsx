import { useState } from 'react';
import { Users, Building, Zap, ArrowRightLeft, RefreshCw, ExternalLink } from 'lucide-react';

const GlassCard = ({ children, className = "", hover = false }) => (
  <div className={`bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] ${hover ? 'hover:shadow-[0_6px_24px_rgba(0,0,0,0.1)] transition-all duration-300' : ''} ${className}`}>
    {children}
  </div>
);

export default function CounterpartyGraph() {
  const [viewMode, setViewMode] = useState('by_type');
  const [selectedType, setSelectedType] = useState('all');

  // Counterparty types summary
  const typeSummary = [
    { type: 'CEX', count: 8, volume: '$12.4M', pct: 42, color: '#3B82F6', icon: Building },
    { type: 'DEX', count: 15, volume: '$8.9M', pct: 30, color: '#10B981', icon: ArrowRightLeft },
    { type: 'Smart Money', count: 23, volume: '$5.2M', pct: 18, color: '#8B5CF6', icon: Zap },
    { type: 'Other', count: 156, volume: '$2.9M', pct: 10, color: '#94A3B8', icon: Users },
  ];

  // Top counterparties
  const topCounterparties = [
    { 
      entity: 'Binance', 
      type: 'CEX', 
      logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png',
      transactions: 1247, 
      volume: '$5.2M', 
      inflow: '$3.1M',
      outflow: '$2.1M',
      repeatRate: 89,
      lastInteraction: '2h ago'
    },
    { 
      entity: 'Uniswap V3', 
      type: 'DEX', 
      logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7083.png',
      transactions: 892, 
      volume: '$3.8M', 
      inflow: '$1.9M',
      outflow: '$1.9M',
      repeatRate: 76,
      lastInteraction: '15m ago'
    },
    { 
      entity: 'Wintermute', 
      type: 'Smart Money', 
      logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
      transactions: 234, 
      volume: '$2.1M', 
      inflow: '$1.4M',
      outflow: '$0.7M',
      repeatRate: 67,
      lastInteraction: '1d ago'
    },
    { 
      entity: 'OKX', 
      type: 'CEX', 
      logo: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/294.png',
      transactions: 634, 
      volume: '$1.8M', 
      inflow: '$0.9M',
      outflow: '$0.9M',
      repeatRate: 54,
      lastInteraction: '6h ago'
    },
    { 
      entity: 'Aave V3', 
      type: 'DEX', 
      logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7278.png',
      transactions: 156, 
      volume: '$1.2M', 
      inflow: '$0.8M',
      outflow: '$0.4M',
      repeatRate: 45,
      lastInteraction: '3d ago'
    },
  ];

  // Repeat interactions
  const repeatInteractions = [
    { address: '0x742d...5f0bEb', interactions: 89, volume: '$2.4M', relationship: 'frequent' },
    { address: '0xa3f8...e2d4c1', interactions: 67, volume: '$1.8M', relationship: 'regular' },
    { address: '0x1bc9...7f8a32', interactions: 45, volume: '$0.9M', relationship: 'occasional' },
  ];

  const filteredCounterparties = selectedType === 'all' 
    ? topCounterparties 
    : topCounterparties.filter(c => c.type === selectedType);

  const getRelationshipBadge = (relationship) => {
    switch(relationship) {
      case 'frequent': return 'bg-emerald-100 text-emerald-700';
      case 'regular': return 'bg-blue-100 text-blue-700';
      case 'occasional': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <GlassCard className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-700 uppercase">Counterparty Graph</h3>
        <div className="flex gap-1.5">
          {[
            { value: 'by_type', label: 'By Type' },
            { value: 'repeat', label: 'Repeat' },
          ].map(mode => (
            <button
              key={mode.value}
              onClick={() => setViewMode(mode.value)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                viewMode === mode.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Type Summary */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {typeSummary.map((type, i) => {
          const Icon = type.icon;
          return (
            <button
              key={i}
              onClick={() => setSelectedType(selectedType === type.type ? 'all' : type.type)}
              className={`p-2 rounded-2xl border text-left transition-all ${
                selectedType === type.type 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3.5 h-3.5" style={{ color: type.color }} />
                <span className="text-xs font-semibold text-gray-700">{type.type}</span>
              </div>
              <div className="text-sm font-bold text-gray-900">{type.volume}</div>
              <div className="text-[10px] text-gray-500">{type.count} entities • {type.pct}%</div>
            </button>
          );
        })}
      </div>

      {viewMode === 'by_type' && (
        <div className="flex-1 overflow-auto">
          <div className="space-y-2">
            {filteredCounterparties.map((cp, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <img src={cp.logo} alt={cp.entity} className="w-7 h-7 rounded-full" />
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{cp.entity}</div>
                      <div className="text-[10px] text-gray-500">{cp.type} • {cp.lastInteraction}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">{cp.volume}</div>
                    <div className="text-[10px] text-gray-500">{cp.transactions} txns</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex gap-3">
                    <span className="text-emerald-600">↓ {cp.inflow}</span>
                    <span className="text-red-600">↑ {cp.outflow}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-600">{cp.repeatRate}% repeat</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'repeat' && (
        <div className="flex-1 overflow-auto">
          <div className="text-xs font-semibold text-gray-500 mb-3 uppercase">Frequent Interactions</div>
          <div className="space-y-2">
            {repeatInteractions.map((interaction, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-2">
                  <code className="text-xs text-blue-600 font-mono">{interaction.address}</code>
                  <ExternalLink className="w-3 h-3 text-gray-400 hover:text-gray-600 cursor-pointer" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-bold text-gray-900">{interaction.interactions} txns</div>
                    <div className="text-[10px] text-gray-500">{interaction.volume}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getRelationshipBadge(interaction.relationship)}`}>
                    {interaction.relationship}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Network Stats */}
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl">
            <div className="text-xs font-semibold text-gray-700 mb-2">Network Stats</div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-lg font-bold text-blue-600">202</div>
                <div className="text-[10px] text-gray-500">Unique Counterparties</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-600">67%</div>
                <div className="text-[10px] text-gray-500">Repeat Rate</div>
              </div>
              <div>
                <div className="text-lg font-bold text-emerald-600">4.2</div>
                <div className="text-[10px] text-gray-500">Avg Interactions</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Total Volume */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Total Counterparty Volume:</span>
          <span className="font-bold text-gray-900">$29.4M</span>
        </div>
      </div>
    </GlassCard>
  );
}
