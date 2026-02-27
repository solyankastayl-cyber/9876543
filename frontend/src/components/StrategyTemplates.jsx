import { useState } from 'react';
import { Layers, TrendingUp, Shield, Zap, ChevronRight, Check } from 'lucide-react';
import TrustBadge, { ReliabilityBadge } from './TrustBadge';

const GlassCard = ({ children, className = "", hover = false }) => (
  <div className={`glass-card ${hover ? 'hover:shadow-[0_6px_24px_rgba(0,0,0,0.1)] transition-all duration-300' : ''} ${className}`}>
    {children}
  </div>
);

export default function StrategyTemplates() {
  const [activeStrategy, setActiveStrategy] = useState(null);

  const strategies = [
    {
      id: 'smart_money_follow',
      name: 'Smart Money Follow',
      icon: TrendingUp,
      description: 'Track and mirror top fund movements',
      riskLevel: 'Medium',
      timeframe: '1-4 weeks',
      color: 'from-emerald-500 to-green-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      rules: [
        'Alert when 3+ funds accumulate same token',
        'Entry on confirmed accumulation (>$10M)',
        'Exit when distribution starts',
        'Stop loss: -15% from entry'
      ],
      performance: { winRate: 67, avgReturn: '+23%', trades: 45 }
    },
    {
      id: 'dislocation_hunter',
      name: 'Dislocation Hunter',
      icon: Zap,
      description: 'Exploit market structure divergences',
      riskLevel: 'High',
      timeframe: '1-7 days',
      color: 'from-purple-500 to-indigo-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      rules: [
        'Enter when Smart Money vs Retail diverge',
        'CEX pressure high + SM accumulating = BUY',
        'DEX buying + SM distributing = SELL',
        'Quick exits: 24-48h max hold'
      ],
      performance: { winRate: 58, avgReturn: '+31%', trades: 23 }
    },
    {
      id: 'narrative_rider',
      name: 'Narrative Rider',
      icon: Layers,
      description: 'Catch emerging sector rotations early',
      riskLevel: 'Medium-High',
      timeframe: '2-8 weeks',
      color: 'from-cyan-500 to-blue-600',
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-700',
      rules: [
        'Enter "Early" stage narratives only',
        'Buy basket of correlated tokens',
        'Scale out at "Confirmed" stage',
        'Full exit at "Crowded" stage'
      ],
      performance: { winRate: 62, avgReturn: '+41%', trades: 18 }
    },
    {
      id: 'whale_shield',
      name: 'Whale Shield',
      icon: Shield,
      description: 'Defensive strategy to avoid dumps',
      riskLevel: 'Low',
      timeframe: 'Ongoing',
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      rules: [
        'Alert on large distribution signals',
        'Reduce exposure when 2+ whales exit',
        'Move to stables during Risk-Off regime',
        'Re-enter on accumulation confirmation'
      ],
      performance: { winRate: 74, avgReturn: '-5% drawdown avoided', trades: 31 }
    }
  ];

  const getRiskColor = (risk) => {
    if (risk === 'Low') return 'bg-green-100 text-green-700';
    if (risk === 'Medium') return 'bg-yellow-100 text-yellow-700';
    if (risk === 'Medium-High') return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="px-6 mb-6">
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Strategy Templates</h2>
              <p className="text-sm text-gray-500">Pre-built strategies based on on-chain signals</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {strategies.map((strategy) => {
            const Icon = strategy.icon;
            const isActive = activeStrategy === strategy.id;
            
            return (
              <div
                key={strategy.id}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  isActive 
                    ? `border-purple-400 shadow-lg ${strategy.bgColor}` 
                    : 'border-gray-100 hover:border-gray-300 hover:shadow-md'
                }`}
                onClick={() => setActiveStrategy(isActive ? null : strategy.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${strategy.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">{strategy.name}</h3>
                      <p className="text-xs text-gray-500">{strategy.description}</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isActive ? 'rotate-90' : ''}`} />
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${getRiskColor(strategy.riskLevel)}`}>
                    {strategy.riskLevel}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-600">
                    {strategy.timeframe}
                  </span>
                </div>

                {/* Performance Stats */}
                <div className="flex items-center gap-4 text-xs mb-3">
                  <div>
                    <span className="text-gray-500">Win Rate:</span>
                    <span className="font-bold text-gray-900 ml-1">{strategy.performance.winRate}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Avg:</span>
                    <span className="font-bold text-emerald-600 ml-1">{strategy.performance.avgReturn}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Trades:</span>
                    <span className="font-bold text-gray-900 ml-1">{strategy.performance.trades}</span>
                  </div>
                </div>

                {/* Trust & Reliability (Phase 15) */}
                <div className="flex items-center gap-2">
                  <TrustBadge score={strategy.performance.winRate + 10} size="sm" />
                  <ReliabilityBadge tier={strategy.performance.winRate >= 70 ? 'A' : strategy.performance.winRate >= 60 ? 'B' : 'C'} />
                </div>

                {/* Expanded Rules */}
                {isActive && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-2">Strategy Rules</div>
                    <ul className="space-y-1.5">
                      {strategy.rules.map((rule, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <Check className={`w-4 h-4 ${strategy.textColor} flex-shrink-0 mt-0.5`} />
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                    <button className={`mt-4 w-full py-2.5 bg-gradient-to-r ${strategy.color} text-white rounded-2xl font-bold text-sm hover:shadow-lg transition-all`}>
                      🚀 Activate Strategy
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-2xl text-center">
          <span className="text-xs text-gray-500">
            📊 Performance metrics are based on backtested data. Past performance doesn't guarantee future results.
          </span>
        </div>
      </GlassCard>
    </div>
  );
}
