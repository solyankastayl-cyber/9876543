import { useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  ChevronLeft, TrendingUp, TrendingDown, ArrowUpRight, Shield, CheckCircle,
  Copy, Activity, AlertTriangle, ExternalLink, Users
} from 'lucide-react';
import {
  GlassCard,
  EntityHeader,
  SignalScorePanel,
  EntityTimeline,
  BehaviorPanel,
  mockEntity,
  calculateSignalScore,
  tierConfig,
  getBehaviorIconStyle,
  txTypeConfig,
  directionColors,
} from '../components/entity';

// ==================== ACTION INSIGHT COMPONENT ====================
const ActionInsight = ({ entity }) => {
  const { behavior, type, contextSignals } = entity;
  
  const getInsight = () => {
    if (behavior.current === 'distributing' && behavior.alignedWith?.length > 0) {
      return {
        text: `Distribution phase aligned with ${behavior.alignedWith.length} entities. Similar patterns preceded volatility spikes.`,
        severity: 'high',
        tags: ['volatility', 'coordination', 'exit_risk']
      };
    }
    if (behavior.current === 'accumulating' && contextSignals.marketTrend === 'bullish') {
      return {
        text: `Accumulation aligns with bullish momentum. High conviction signal.`,
        severity: 'positive',
        tags: ['trend_aligned', 'accumulation']
      };
    }
    if (behavior.current === 'accumulating' && contextSignals.marketTrend === 'bearish') {
      return {
        text: `Counter-trend accumulation. Building position against market sentiment.`,
        severity: 'notable',
        tags: ['contrarian', 'high_conviction']
      };
    }
    return {
      text: `Monitoring for behavioral changes. Activity within normal range.`,
      severity: 'neutral',
      tags: ['monitoring']
    };
  };

  const insight = getInsight();
  
  const tagConfig = {
    volatility: { icon: '⚠️', label: 'Volatility', color: 'bg-amber-100 text-amber-700' },
    coordination: { icon: '🔗', label: 'Coordination', color: 'bg-blue-100 text-blue-700' },
    exit_risk: { icon: '🚪', label: 'Exit Risk', color: 'bg-red-100 text-red-700' },
    trend_aligned: { icon: '📈', label: 'Trend Aligned', color: 'bg-emerald-100 text-emerald-700' },
    accumulation: { icon: '💰', label: 'Accumulation', color: 'bg-emerald-100 text-emerald-700' },
    contrarian: { icon: '🔄', label: 'Contrarian', color: 'bg-purple-100 text-purple-700' },
    high_conviction: { icon: '💎', label: 'High Conviction', color: 'bg-purple-100 text-purple-700' },
    monitoring: { icon: '👁️', label: 'Monitoring', color: 'bg-gray-100 text-gray-500' }
  };

  const severityStyles = {
    high: 'bg-gray-100 border-gray-300',
    positive: 'bg-emerald-50/50 border-emerald-200',
    notable: 'bg-amber-50/50 border-amber-200',
    neutral: 'bg-white border-gray-100'
  };

  return (
    <div className="px-4 py-2">
      <div className={`p-3 rounded-lg border ${severityStyles[insight.severity]}`}>
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm text-gray-700 flex-1">{insight.text}</p>
          <div className="flex items-center gap-1 flex-shrink-0 flex-wrap justify-end">
            {insight.tags?.map(tag => (
              <span 
                key={tag} 
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${tagConfig[tag]?.color || 'bg-gray-100 text-gray-600'}`}
              >
                <span>{tagConfig[tag]?.icon}</span>
                <span className="hidden sm:inline">{tagConfig[tag]?.label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== FLOW TREND CHART ====================
const FlowTrendChart = ({ data, behavior, entity }) => {
  const maxValue = Math.max(...data.map(d => d.amount));
  
  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Net Flow Trend
        </h3>
        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
          behavior === 'accumulating' ? 'bg-emerald-100 text-emerald-700' :
          behavior === 'distributing' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {behavior}
        </span>
      </div>
      
      <div className="flex items-end gap-1 h-24">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div 
              className={`w-full rounded-t transition-all ${
                behavior === 'accumulating' ? 'bg-emerald-500' :
                behavior === 'distributing' ? 'bg-red-500' : 'bg-gray-400'
              }`}
              style={{ height: `${(d.amount / maxValue) * 100}%`, minHeight: '4px' }}
            />
            <span className="text-[8px] text-gray-400 mt-1">{d.date}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
        {behavior === 'accumulating' 
          ? 'Consistent inflow pattern over past weeks'
          : behavior === 'distributing'
          ? 'Distribution activity detected'
          : 'Mixed activity patterns'
        }
      </div>
    </GlassCard>
  );
};

// ==================== TRANSACTION ACTIVITY ====================
const CompactTransactionActivity = ({ transactions }) => {
  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase">Recent Transactions</h3>
        <Link to="/entities" className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
          View All <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
      
      <div className="space-y-2">
        {transactions.slice(0, 4).map((tx, i) => {
          const config = txTypeConfig[tx.type] || txTypeConfig.transfer;
          return (
            <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded flex items-center justify-center ${config.bg}`}>
                  <span className={`text-sm ${config.text}`}>{config.icon}</span>
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-gray-900">{tx.token}</span>
                    <span className={`text-xs ${tx.type === 'sell' ? 'text-red-500' : 'text-emerald-600'}`}>
                      {tx.type === 'sell' ? '↓' : '↑'}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400">{tx.time}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">{tx.valueUsd}</div>
                {tx.pattern && (
                  <span className="text-[9px] text-gray-400 uppercase">{tx.pattern.replace(/_/g, ' ')}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};

// ==================== CONTEXT SIGNALS ====================
const ContextSignals = ({ signals }) => {
  return (
    <div className="px-4 py-2">
      <GlassCard className="p-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Context Signals</h3>
        
        <div className="grid grid-cols-3 gap-4">
          {/* Market Trend */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Market Trend</div>
            <div className="flex items-center gap-2">
              {signals.marketTrend === 'bullish' 
                ? <TrendingUp className="w-4 h-4 text-emerald-600" />
                : <TrendingDown className="w-4 h-4 text-red-500" />
              }
              <span className="font-semibold text-gray-900 capitalize">{signals.marketTrend}</span>
            </div>
          </div>
          
          {/* Peer Activity */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Peer Activity</div>
            <div className="space-y-1">
              {signals.peers?.slice(0, 2).map((peer, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{peer.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    peer.behavior === 'Accumulating' ? 'bg-emerald-100 text-emerald-700' :
                    peer.behavior === 'Distributing' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                  }`}>{peer.behavior}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Bridge Cluster */}
          {signals.bridge && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Bridge Cluster</div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-gray-900">Cluster {signals.bridge.cluster}</span>
                <span className="text-xs text-gray-500">({signals.bridge.entities} entities)</span>
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

// ==================== RAW ACTIVITY VIEW ====================
const RawActivityView = ({ transactions, holdings }) => {
  return (
    <div className="px-4 py-4 space-y-4">
      <GlassCard className="p-4">
        <h3 className="text-sm font-bold text-gray-900 mb-3">All Transactions</h3>
        <div className="space-y-2">
          {transactions.map((tx, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded flex items-center justify-center ${
                  tx.type === 'buy' ? 'bg-emerald-100' : tx.type === 'sell' ? 'bg-red-100' : 'bg-gray-100'
                }`}>
                  <span className="text-sm font-bold">{tx.type[0].toUpperCase()}</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{tx.token}</div>
                  <div className="text-xs text-gray-500">{tx.time}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">{tx.valueUsd}</div>
                <div className="text-xs text-gray-500">{tx.amount}</div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
      
      <GlassCard className="p-4">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Holdings Breakdown</h3>
        <div className="space-y-2">
          {holdings.map((h, i) => (
            <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{h.symbol}</span>
                <span className="text-sm text-gray-500">{h.percentage}%</span>
              </div>
              <span className="font-bold text-gray-900">${(h.value / 1000000).toFixed(1)}M</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

// ==================== BEHAVIOR AND PORTFOLIO ====================
const BehaviorAndPortfolio = ({ behavior, entityType, holdings }) => (
  <BehaviorPanel behavior={behavior} entityType={entityType} holdings={holdings} />
);

// ==================== ENTITY DATABASE ====================
const entityDatabase = {
  '1': { label: 'Vitalik Buterin', type: 'influencer', balance: '$45.2M', txCount: '1,247', behavior: 'accumulating' },
  '2': { label: 'Binance Hot Wallet', type: 'exchange', balance: '$2.8B', txCount: '89,234', behavior: 'distributing' },
  'binance': { label: 'Binance', type: 'exchange', balance: '$28.4B', txCount: '125,000+', behavior: 'accumulating' },
  'coinbase': { label: 'Coinbase', type: 'exchange', balance: '$18.9B', txCount: '89,000+', behavior: 'distributing' },
  'kraken': { label: 'Kraken', type: 'exchange', balance: '$8.2B', txCount: '45,000+', behavior: 'accumulating' },
  'a16z': { label: 'a16z Crypto', type: 'fund', balance: '$4.5B', txCount: '2,340', behavior: 'accumulating' },
  'paradigm': { label: 'Paradigm', type: 'fund', balance: '$3.2B', txCount: '1,560', behavior: 'holding' },
};

const buildEntity = (id) => {
  const entityInfo = entityDatabase[id] || { label: `Entity ${id}`, type: 'unknown', balance: '$0', txCount: '0', behavior: 'neutral' };
  
  return {
    id,
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    ...entityInfo,
    verified: true,
    riskScore: entityInfo.behavior === 'distributing' ? 45 : 12,
    
    behavior: {
      current: entityInfo.behavior,
      change: { from: 'Neutral', to: entityInfo.behavior, time: '18h ago' },
      alignedWith: [
        { id: 'binance', label: 'Binance', correlation: 0.89 },
        { id: 'kraken', label: 'Kraken', correlation: 0.76 }
      ],
      confidence: 78
    },

    contextSignals: {
      marketTrend: 'bullish',
      peers: [
        { name: 'a16z', behavior: 'Accumulating' },
        { name: 'Paradigm', behavior: 'Holding' }
      ],
      bridge: { cluster: 'A', entities: '3 entities' }
    },

    timeline: {
      events: [
        { type: 'behavior', title: 'Behavior Change', date: 'Week 5', description: 'Started accumulating ETH after market dip' },
        { type: 'bridge', title: 'Bridge Alignment', date: 'Week 4', description: 'Joined Cluster A with Binance, Kraken' },
        { type: 'risk', title: 'Risk Shift', date: 'Week 3', description: 'Risk level decreased: Medium → Low' }
      ]
    },

    holdings: [
      { symbol: 'ETH', value: 25000000, percentage: 55, change24h: 2.4 },
      { symbol: 'USDC', value: 10000000, percentage: 22, change24h: 0 },
      { symbol: 'UNI', value: 5000000, percentage: 11, change24h: -1.2 },
      { symbol: 'AAVE', value: 3000000, percentage: 7, change24h: 3.1 },
      { symbol: 'Other', value: 2200000, percentage: 5, change24h: 0.5 }
    ],

    accumulation: [
      { date: 'W1', amount: 1000 },
      { date: 'W2', amount: 1200 },
      { date: 'W3', amount: 1150 },
      { date: 'W4', amount: 1400 },
      { date: 'W5', amount: 1600 },
      { date: 'W6', amount: 1800 },
      { date: 'W7', amount: 2000 }
    ],

    transactions: [
      { type: 'buy', token: 'UNI', amount: '1,250', valueUsd: '$125,000', pattern: 'first_entry', time: '2h ago' },
      { type: 'sell', token: 'AAVE', amount: '450', valueUsd: '$87,500', pattern: 'exit_after_accumulation', time: '5h ago' },
      { type: 'transfer', token: 'ETH', amount: '15', valueUsd: '$50,000', pattern: 'cross_entity', time: '1d ago' },
      { type: 'buy', token: 'ETH', amount: '60', valueUsd: '$200,000', pattern: null, time: '2d ago' }
    ]
  };
};

// ==================== MAIN ENTITY PAGE ====================
export default function EntityPage() {
  const { id } = useParams();
  const [viewMode, setViewMode] = useState('overview');
  
  // Build entity data based on id
  const entity = useMemo(() => buildEntity(id), [id]);

  return (
    <div className="min-h-screen bg-gray-50" data-testid="entity-page">
      
      <div className="px-4 pt-4">
        <Link to="/signals" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
          <ChevronLeft className="w-4 h-4" />
          Signals
        </Link>
      </div>

      <EntityHeader entity={entity} viewMode={viewMode} setViewMode={setViewMode} />

      {viewMode === 'overview' && (
        <>
          <ActionInsight entity={entity} />
          
          <div className="px-4 py-2 grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <SignalScorePanel entity={entity} />
            </div>
            <div className="col-span-2">
              <BehaviorAndPortfolio 
                behavior={entity.behavior} 
                entityType={entity.type} 
                holdings={entity.holdings}
              />
            </div>
          </div>
          
          <div className="px-4 py-2 grid grid-cols-2 gap-4">
            <FlowTrendChart data={entity.accumulation} behavior={entity.behavior.current} entity={entity} />
            <CompactTransactionActivity transactions={entity.transactions} />
          </div>
          
          <ContextSignals signals={entity.contextSignals} />
        </>
      )}

      {viewMode === 'analysis' && (
        <EntityTimeline events={entity.timeline.events} transactions={entity.transactions} />
      )}

      {viewMode === 'raw' && (
        <RawActivityView transactions={entity.transactions} holdings={entity.holdings} />
      )}
    </div>
  );
}
