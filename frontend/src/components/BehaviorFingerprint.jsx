import { useState } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { Activity, Zap, Clock, RefreshCw, TrendingUp, Wallet, BarChart3, Target } from 'lucide-react';

const GlassCard = ({ children, className = "", hover = false }) => (
  <div className={`glass-card ${hover ? 'hover:shadow-[0_6px_24px_rgba(0,0,0,0.1)] transition-all duration-300' : ''} ${className}`}>
    {children}
  </div>
);

export default function BehaviorFingerprint() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');

  const walletType = {
    primary: 'Smart Money Trader',
    confidence: 87,
    tags: ['High Frequency', 'DEX Heavy', 'Alpha Hunter'],
    riskProfile: 'Moderate-Aggressive',
  };

  const behaviorMetrics = [
    { metric: 'DEX Activity', value: 85, fullMark: 100 },
    { metric: 'CEX Usage', value: 45, fullMark: 100 },
    { metric: 'DeFi Farming', value: 72, fullMark: 100 },
    { metric: 'NFT Trading', value: 28, fullMark: 100 },
    { metric: 'Long-Term Hold', value: 38, fullMark: 100 },
    { metric: 'Quick Flips', value: 78, fullMark: 100 },
  ];

  const tradingPatterns = [
    { pattern: 'Avg Hold Time', value: '4.2 days', icon: Clock, trend: 'decreasing' },
    { pattern: 'Trade Frequency', value: '12.4/day', icon: Activity, trend: 'increasing' },
    { pattern: 'Avg Trade Size', value: '$8,450', icon: BarChart3, trend: 'stable' },
    { pattern: 'Gas Efficiency', value: '78%', icon: Zap, trend: 'increasing' },
  ];

  const activityBreakdown = [
    { type: 'DEX Swaps', pct: 42, color: '#007AFF' },
    { type: 'Lending/Borrowing', pct: 23, color: '#AF52DE' },
    { type: 'LP Farming', pct: 18, color: '#34C759' },
    { type: 'CEX Transfers', pct: 12, color: '#FF9500' },
    { type: 'Other', pct: 5, color: '#8E8E93' },
  ];

  const similarWallets = [
    { address: '0x742d...5f0bEb', similarity: 94, balance: '$2.1M' },
    { address: '0xa3f8...e2d4c1', similarity: 89, balance: '$890K' },
    { address: '0x1bc9...7f8a32', similarity: 86, balance: '$1.4M' },
  ];

  const getTrendIcon = (trend) => {
    if (trend === 'increasing') return <TrendingUp className="w-3 h-3 text-emerald-500" />;
    if (trend === 'decreasing') return <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />;
    return <RefreshCw className="w-3 h-3 text-gray-400" />;
  };

  return (
    <GlassCard className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Behavior Fingerprint</h3>
        <div className="time-selector">
          {['all', '30d', '7d'].map(tf => (
            <button
              key={tf}
              onClick={() => setSelectedTimeframe(tf)}
              className={`time-selector-btn ${selectedTimeframe === tf ? 'active' : ''}`}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Wallet Classification */}
      <div className="roi-box mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="roi-label mb-0">Classification</div>
          <div className="flex items-center gap-2">
            <div className="progress-bar-container w-16 h-2">
              <div 
                className="progress-bar-fill h-full" 
                style={{ width: `${walletType.confidence}%` }}
              />
            </div>
            <span className="text-xs font-bold text-emerald-600">{walletType.confidence}%</span>
          </div>
        </div>
        <div className="text-lg font-extrabold text-gray-900 mb-2">{walletType.primary}</div>
        <div className="flex flex-wrap gap-1.5">
          {walletType.tags.map((tag, i) => (
            <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-700 font-medium uppercase tracking-wide">{tag}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 flex-1">
        {/* Radar Chart - ЛЕВАЯ ЧАСТЬ */}
        <div className="flex flex-col">
          <div className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Activity Profile</div>
          <div className="flex-1 min-h-[150px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={150}>
              <RadarChart data={behaviorMetrics}>
                <PolarGrid stroke="rgba(0,0,0,0.06)" />
                <PolarAngleAxis 
                  dataKey="metric" 
                  tick={{ fontSize: 9, fill: '#6B7280', fontWeight: 500 }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]} 
                  tick={{ fontSize: 8, fill: '#9CA3AF' }}
                />
                <Radar 
                  name="Activity" 
                  dataKey="value" 
                  stroke="#374151" 
                  fill="#6B7280" 
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key Metrics - ЦЕНТР (сжатая таблица) */}
        <div className="flex flex-col">
          <div className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Key Metrics</div>
          <div className="space-y-1.5 flex-1">
            {tradingPatterns.map((pattern, i) => {
              const Icon = pattern.icon;
              return (
                <div key={i} className="flex items-center justify-between p-1.5 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-gray-600" />
                    <span className="text-xs text-gray-600">{pattern.pattern}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-900">{pattern.value}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity Breakdown - ПРАВАЯ ЧАСТЬ */}
        <div className="flex flex-col">
          <div className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Activity Breakdown</div>
          <div className="space-y-1.5 flex-1">
            {activityBreakdown.map((activity, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-700">{activity.type}</span>
                  <span className="text-xs font-bold text-gray-900">{activity.pct}%</span>
                </div>
                <div className="progress-bar-container h-1.5">
                  <div 
                    className="h-full rounded-full bg-gray-700"
                    style={{ width: `${activity.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
