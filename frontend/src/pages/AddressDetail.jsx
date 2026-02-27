import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  ChevronLeft, Wallet, Shield, CheckCircle, AlertTriangle, Copy, ExternalLink,
  TrendingUp, TrendingDown, Activity, ArrowUpRight, ArrowDownRight, Clock, Filter
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

const GlassCard = ({ children, className = "", hover = false }) => (
  <div className={`glass-card ${hover ? 'glass-card-hover' : ''} ${className}`}>
    {children}
  </div>
);

const AddressHeader = ({ addressData }) => {
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(addressData.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="px-4 py-3">
      <GlassCard className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-3xl">
              {addressData.typeIcon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{addressData.label}</h1>
                {addressData.verified && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold">
                    <Shield className="w-3 h-3" />
                    Verified
                  </span>
                )}
                <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${addressData.typeColor}`}>
                  {addressData.type.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <code className="text-sm text-gray-600 font-mono">{addressData.address}</code>
                <button onClick={copyAddress} className="p-1 hover:bg-gray-100 rounded">
                  {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                </button>
                <ExternalLink className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer" />
              </div>
              {addressData.description && (
                <p className="text-sm text-gray-600">{addressData.description}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-xs text-gray-500 mb-1">Total Balance</div>
              <div className="text-2xl font-bold text-gray-900">{addressData.totalBalance}</div>
              <div className={`text-xs font-semibold ${addressData.balanceChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {addressData.balanceChange >= 0 ? '+' : ''}{addressData.balanceChange}% (24h)
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Total Transactions</div>
              <div className="text-2xl font-bold text-gray-900">{addressData.txCount}</div>
              <div className="text-xs text-gray-500">First seen: {addressData.firstSeen}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Risk Score</div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-gray-900">{addressData.riskScore}/100</div>
                {addressData.redFlags > 0 && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-lg text-xs font-semibold">
                    <AlertTriangle className="w-3 h-3" />
                    {addressData.redFlags}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

const EntityBehaviorSummary = ({ behavior }) => {
  const behaviorColors = {
    accumulating: { bg: 'bg-emerald-500', text: 'text-emerald-700', icon: '📈' },
    distributing: { bg: 'bg-red-500', text: 'text-red-700', icon: '📉' },
    rotating: { bg: 'bg-orange-500', text: 'text-orange-700', icon: '🔄' },
    neutral: { bg: 'bg-gray-500', text: 'text-gray-700', icon: '➡️' }
  };

  const riskColors = {
    low: 'text-emerald-600',
    medium: 'text-orange-600',
    high: 'text-red-600'
  };

  const currentBehavior = behaviorColors[behavior.current] || behaviorColors.neutral;

  return (
    <div className="px-4 py-3">
      <GlassCard className="p-6 bg-gradient-to-br from-blue-50/50 to-purple-50/50">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          Entity Behavior Summary
        </h2>
        
        <div className="space-y-4">
          {/* Current Behavior */}
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl ${currentBehavior.bg} flex items-center justify-center text-xl flex-shrink-0`}>
              {currentBehavior.icon}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-600 mb-1">Current behavior:</div>
              <div className="text-xl font-bold text-gray-900">{behavior.current.charAt(0).toUpperCase() + behavior.current.slice(1)} {behavior.asset}</div>
            </div>
          </div>

          {/* Change Info */}
          {behavior.change && (
            <div className="pl-13">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-gray-600">Change:</span>
                <span className="text-gray-900">
                  from <span className="font-semibold">{behavior.change.from}</span> → <span className="font-semibold">{behavior.change.to}</span>
                </span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                  {behavior.change.time}
                </span>
              </div>
            </div>
          )}

          {/* Context */}
          {behavior.context && behavior.context.length > 0 && (
            <div className="pl-13">
              <div className="text-sm">
                <span className="font-semibold text-gray-600">Context:</span>{' '}
                <span className="text-gray-900">
                  aligned with{' '}
                  {behavior.context.map((entity, idx) => (
                    <span key={idx}>
                      <span className="font-semibold text-blue-600">{entity}</span>
                      {idx < behavior.context.length - 1 && ', '}
                    </span>
                  ))}
                </span>
              </div>
            </div>
          )}

          {/* Risk */}
          <div className="pl-13">
            <div className="text-sm">
              <span className="font-semibold text-gray-600">Risk:</span>{' '}
              <span className={`font-bold ${riskColors[behavior.risk]}`}>
                {behavior.risk.charAt(0).toUpperCase() + behavior.risk.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

const ContextSignals = ({ signals }) => {
  const trendColors = {
    bullish: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: TrendingUp },
    bearish: { bg: 'bg-red-100', text: 'text-red-700', icon: TrendingDown },
    neutral: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Activity }
  };

  const marketTrend = trendColors[signals.marketTrend] || trendColors.neutral;
  const TrendIcon = marketTrend.icon;

  return (
    <div className="px-4 py-3">
      <GlassCard className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          Context Signals
        </h2>
        
        <div className="grid grid-cols-3 gap-4">
          {/* Market Trend */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-500 uppercase">Market Trend</div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${marketTrend.bg}`}>
              <TrendIcon className={`w-5 h-5 ${marketTrend.text}`} />
              <span className={`font-bold ${marketTrend.text}`}>
                {signals.marketTrend.charAt(0).toUpperCase() + signals.marketTrend.slice(1)}
              </span>
            </div>
          </div>

          {/* Entity Peers */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-500 uppercase">Entity Peers Behavior</div>
            <div className="space-y-1">
              {signals.entityPeers.map((peer, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span className="font-semibold text-gray-900">{peer.name}</span>
                  <span className="text-gray-600">{peer.behavior}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bridge Overlap */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-500 uppercase">Bridge Overlap</div>
            {signals.bridgeOverlap ? (
              <div className="space-y-1">
                <div className="px-3 py-2 bg-emerald-100 rounded-xl">
                  <div className="font-bold text-emerald-700 text-sm mb-1">Cluster {signals.bridgeOverlap.cluster}</div>
                  <div className="text-xs text-emerald-600">{signals.bridgeOverlap.entities} entities aligned</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic">No bridge overlap detected</div>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

const Holdings = ({ holdings }) => {
  const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
  
  return (
    <GlassCard className="p-4 h-full">
      <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">Current Holdings</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={holdings}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {holdings.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => `$${value.toLocaleString()}`}
                contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '11px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="space-y-2">
          {holdings.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-2 hover:bg-gray-50/50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <img src={item.logo} alt={item.symbol} className="w-5 h-5 rounded-full" />
                <span className="font-semibold text-sm text-gray-900">{item.symbol}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900">${item.value.toLocaleString()}</div>
                <div className="text-xs text-gray-500">{item.percentage}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
};

const ActivityTimeline = ({ activities }) => {
  return (
    <GlassCard className="p-4 h-full">
      <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">Recent Activity</h3>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {activities.map((activity, i) => (
          <div key={i} className="flex items-start gap-3 p-2 hover:bg-gray-50/50 rounded-lg">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              activity.type === 'buy' ? 'bg-emerald-100' :
              activity.type === 'sell' ? 'bg-red-100' : 'bg-blue-100'
            }`}>
              {activity.type === 'buy' ? <ArrowDownRight className="w-4 h-4 text-emerald-600" /> :
               activity.type === 'sell' ? <ArrowUpRight className="w-4 h-4 text-red-600" /> :
               <Activity className="w-4 h-4 text-blue-600" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-900">{activity.action}</span>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
              <div className="text-xs text-gray-600">{activity.details}</div>
              <div className="text-xs font-semibold text-gray-900 mt-1">{activity.amount}</div>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

const TokenAccumulation = ({ tokenData, behaviorChanges }) => {
  const [showPrice, setShowPrice] = useState(true);
  
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-xs font-semibold text-gray-600 mb-1">{data.date}</p>
          <p className="text-sm font-bold text-emerald-600">Amount: {data.amount}</p>
          {showPrice && data.price && (
            <p className="text-sm font-bold text-blue-600">Price: ${data.price}</p>
          )}
          {data.behaviorChange && (
            <p className="text-xs text-orange-600 font-semibold mt-1">
              ⚠ Behavior change: {data.behaviorChange}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <GlassCard className="p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-700 uppercase">Token Accumulation Trend</h3>
          <p className="text-xs text-gray-500 mt-1">Track holding changes over time</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPrice(!showPrice)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              showPrice ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {showPrice ? 'Hide' : 'Show'} Price Overlay
          </button>
          <div className="flex gap-1">
            {['1W', '1M', '3M', 'ALL'].map(p => (
              <button key={p} className="px-2 py-1 text-xs font-bold bg-gray-100 text-gray-600 rounded hover:bg-gray-200">{p}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={tokenData}>
            <defs>
              <linearGradient id="colorAccumulation" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '10px' }} />
            <YAxis yAxisId="left" stroke="#10B981" style={{ fontSize: '10px' }} />
            {showPrice && <YAxis yAxisId="right" orientation="right" stroke="#3B82F6" style={{ fontSize: '10px' }} />}
            <Tooltip content={<CustomTooltip />} />
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="amount" 
              stroke="#10B981" 
              strokeWidth={2} 
              fillOpacity={1} 
              fill="url(#colorAccumulation)" 
            />
            {showPrice && (
              <Area 
                yAxisId="right"
                type="monotone" 
                dataKey="price" 
                stroke="#3B82F6" 
                strokeWidth={2} 
                strokeDasharray="5 5"
                fillOpacity={1} 
                fill="url(#colorPrice)" 
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Behavior Change Markers Legend */}
      {behaviorChanges && behaviorChanges.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs font-semibold text-gray-600 mb-2">Behavior Changes:</div>
          <div className="flex flex-wrap gap-2">
            {behaviorChanges.map((change, idx) => (
              <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-semibold">
                <span>⚠</span>
                <span>{change.date}: {change.from} → {change.to}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
};

const TransactionHistory = ({ transactions }) => {
  const [filterType, setFilterType] = useState('all');
  const [showNoise, setShowNoise] = useState(false);
  
  const filteredTx = transactions.filter(tx => {
    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesNoise = showNoise || !tx.isNoise;
    return matchesType && matchesNoise;
  });

  const getPatternBadge = (pattern) => {
    const badges = {
      'first_entry': { bg: 'bg-purple-100', text: 'text-purple-700', label: '🎯 First Entry' },
      'exit_after_accumulation': { bg: 'bg-orange-100', text: 'text-orange-700', label: '📤 Exit After Accumulation' },
      'cross_entity': { bg: 'bg-blue-100', text: 'text-blue-700', label: '🔁 Cross-Entity' },
      'large_transfer': { bg: 'bg-red-100', text: 'text-red-700', label: '⚠ Large Transfer' }
    };
    return badges[pattern] || null;
  };

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-700 uppercase">Transaction History</h3>
          <p className="text-xs text-gray-500 mt-1">Pattern events highlighted</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNoise(!showNoise)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              showNoise ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {showNoise ? 'Hide' : 'Show'} Noise
          </button>
          {['all', 'buy', 'sell', 'transfer'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 text-xs font-medium rounded-lg ${
                filterType === type ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 px-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
              <th className="py-2 px-3 text-left text-xs font-semibold text-gray-500 uppercase">Token</th>
              <th className="py-2 px-3 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
              <th className="py-2 px-3 text-right text-xs font-semibold text-gray-500 uppercase">Value (USD)</th>
              <th className="py-2 px-3 text-left text-xs font-semibold text-gray-500 uppercase">From/To</th>
              <th className="py-2 px-3 text-left text-xs font-semibold text-gray-500 uppercase">Pattern</th>
              <th className="py-2 px-3 text-right text-xs font-semibold text-gray-500 uppercase">Time</th>
            </tr>
          </thead>
          <tbody>
            {filteredTx.map((tx, i) => {
              const pattern = getPatternBadge(tx.pattern);
              return (
                <tr 
                  key={i} 
                  className={`border-b border-gray-50 hover:bg-gray-50/50 ${
                    tx.pattern ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <td className="py-2 px-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                      tx.type === 'buy' ? 'bg-emerald-100 text-emerald-700' :
                      tx.type === 'sell' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {tx.type === 'buy' ? <ArrowDownRight className="w-3 h-3" /> :
                       tx.type === 'sell' ? <ArrowUpRight className="w-3 h-3" /> :
                       <Activity className="w-3 h-3" />}
                      {tx.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <img src={tx.tokenLogo} alt={tx.token} className="w-5 h-5 rounded-full" />
                      <span className="font-semibold">{tx.token}</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right font-semibold">{tx.amount}</td>
                  <td className="py-2 px-3 text-right font-bold text-gray-900">{tx.valueUsd}</td>
                  <td className="py-2 px-3">
                    <code className="text-xs text-gray-600">{tx.counterparty}</code>
                  </td>
                  <td className="py-2 px-3">
                    {pattern && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${pattern.bg} ${pattern.text}`}>
                        {pattern.label}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right text-xs text-gray-500">{tx.time}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Pattern Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs font-semibold text-gray-600 mb-2">Pattern Events:</div>
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">🎯 First Entry</span>
          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-semibold">📤 Exit After Accumulation</span>
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">🔁 Cross-Entity Transfer</span>
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">⚠ Large Transfer</span>
        </div>
      </div>
    </GlassCard>
  );
};

export default function AddressDetail() {
  const { address } = useParams();
  const [addressData, setAddressData] = useState(null);

  useEffect(() => {
    // Mock data с новыми полями
    const mockData = {
      address: address || '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      label: 'Vitalik Buterin',
      type: 'influencer',
      typeIcon: '📢',
      typeColor: 'bg-purple-100 text-purple-700',
      verified: true,
      description: 'Co-founder of Ethereum. Active in DeFi and NFT space.',
      totalBalance: '$45.2M',
      balanceChange: 5.4,
      txCount: '1,247',
      firstSeen: 'Jul 2015',
      riskScore: 12,
      redFlags: 0,
    };

    // Entity Behavior Summary data
    const mockBehavior = {
      current: 'accumulating',
      asset: 'ETH',
      change: {
        from: 'Neutral',
        to: 'Accumulating',
        time: '18h ago'
      },
      context: ['Binance', 'Kraken', 'Jump Trading'],
      risk: 'medium'
    };

    // Context Signals data
    const mockContextSignals = {
      marketTrend: 'bullish',
      entityPeers: [
        { name: 'a16z', behavior: 'Accumulating' },
        { name: 'Paradigm', behavior: 'Holding' },
        { name: 'Jump Trading', behavior: 'Accumulating' }
      ],
      bridgeOverlap: {
        cluster: 'A',
        entities: 3
      }
    };

    const mockHoldings = [
      { symbol: 'ETH', value: 25000000, percentage: 55.3, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png' },
      { symbol: 'USDC', value: 10000000, percentage: 22.1, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png' },
      { symbol: 'UNI', value: 5000000, percentage: 11.1, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7083.png' },
      { symbol: 'AAVE', value: 3000000, percentage: 6.6, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7278.png' },
      { symbol: 'Other', value: 2200000, percentage: 4.9, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png' },
    ];

    const mockActivities = [
      { type: 'buy', action: 'Bought UNI', details: 'Uniswap V3', amount: '$125,000', time: '2 hours ago' },
      { type: 'sell', action: 'Sold AAVE', details: 'Aave Protocol', amount: '$87,500', time: '5 hours ago' },
      { type: 'transfer', action: 'Transfer ETH', details: 'To 0x742d...', amount: '$50,000', time: '1 day ago' },
      { type: 'buy', action: 'Bought ETH', details: 'Uniswap V2', amount: '$200,000', time: '2 days ago' },
      { type: 'transfer', action: 'Received USDC', details: 'From Binance', amount: '$100,000', time: '3 days ago' },
    ];

    const mockTokenData = [
      { date: 'Week 1', amount: 1000, price: 3200 },
      { date: 'Week 2', amount: 1200, price: 3250 },
      { date: 'Week 3', amount: 1150, price: 3180 },
      { date: 'Week 4', amount: 1400, price: 3300, behaviorChange: 'Started accumulating' },
      { date: 'Week 5', amount: 1600, price: 3400 },
      { date: 'Week 6', amount: 1550, price: 3350 },
      { date: 'Week 7', amount: 1800, price: 3500 },
      { date: 'Week 8', amount: 2000, price: 3600 },
    ];

    const mockBehaviorChanges = [
      { date: 'Week 4', from: 'Neutral', to: 'Accumulating' }
    ];

    const mockTransactions = [
      { type: 'buy', token: 'UNI', tokenLogo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7083.png', amount: '1,250', valueUsd: '$125,000', counterparty: 'Uniswap V3', time: '2 hours ago', pattern: 'first_entry', isNoise: false },
      { type: 'sell', token: 'AAVE', tokenLogo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7278.png', amount: '450', valueUsd: '$87,500', counterparty: 'Aave Protocol', time: '5 hours ago', pattern: 'exit_after_accumulation', isNoise: false },
      { type: 'transfer', token: 'ETH', tokenLogo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png', amount: '15', valueUsd: '$50,000', counterparty: '0x742d...f0bEb', time: '1 day ago', pattern: 'cross_entity', isNoise: false },
      { type: 'buy', token: 'ETH', tokenLogo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png', amount: '60', valueUsd: '$200,000', counterparty: 'Uniswap V2', time: '2 days ago', pattern: 'large_transfer', isNoise: false },
      { type: 'transfer', token: 'USDC', tokenLogo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png', amount: '100,000', valueUsd: '$100,000', counterparty: 'Binance', time: '3 days ago', pattern: null, isNoise: false },
      { type: 'transfer', token: 'USDT', tokenLogo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png', amount: '50', valueUsd: '$50', counterparty: '0xabc...123', time: '4 days ago', pattern: null, isNoise: true },
      { type: 'transfer', token: 'DAI', tokenLogo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/4943.png', amount: '25', valueUsd: '$25', counterparty: '0xdef...456', time: '5 days ago', pattern: null, isNoise: true },
    ];

    setAddressData({ 
      ...mockData, 
      behavior: mockBehavior,
      contextSignals: mockContextSignals,
      holdings: mockHoldings, 
      activities: mockActivities,
      tokenData: mockTokenData,
      behaviorChanges: mockBehaviorChanges,
      transactions: mockTransactions
    });
  }, [address]);

  if (!addressData) return <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 flex items-center justify-center"><div className="text-xl font-semibold text-gray-600">Loading...</div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <AddressHeader addressData={addressData} />
      
      {/* Entity Behavior Summary - NEW */}
      <EntityBehaviorSummary behavior={addressData.behavior} />
      
      {/* Context Signals - NEW */}
      <ContextSignals signals={addressData.contextSignals} />
      
      <div className="px-4 pb-4 grid grid-cols-2 gap-4">
        <Holdings holdings={addressData.holdings} />
        <ActivityTimeline activities={addressData.activities} />
      </div>

      <div className="px-4 pb-4">
        <TokenAccumulation 
          tokenData={addressData.tokenData} 
          behaviorChanges={addressData.behaviorChanges}
        />
      </div>

      <div className="px-4 pb-4">
        <TransactionHistory transactions={addressData.transactions} />
      </div>
    </div>
  );
}
