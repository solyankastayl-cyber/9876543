import { useState } from 'react';
import { Network, ChevronRight } from 'lucide-react';

const GlassCard = ({ children, className = "", hover = false }) => (
  <div className={`glass-card ${hover ? 'hover:shadow-[0_6px_24px_rgba(0,0,0,0.1)] transition-all duration-300' : ''} ${className}`}>
    {children}
  </div>
);

export default function NarrativeDetection() {
  const [selectedCluster, setSelectedCluster] = useState('vc_funds');

  // Simplified narratives - 3 lines each
  const narratives = {
    vc_funds: [
      { 
        name: "AI & Infrastructure",
        stage: 'Early',
        momentum: 'Accelerating',
        action: 'Monitor & Accumulate',
        stageColor: 'bg-emerald-100 text-emerald-700 border-emerald-300',
        stageIcon: '🌱'
      },
      { 
        name: "Layer 2 Scaling",
        stage: 'Confirmed',
        momentum: 'Steady',
        action: 'Strong Position',
        stageColor: 'bg-blue-100 text-blue-700 border-blue-300',
        stageIcon: '✅'
      },
      { 
        name: "Real World Assets",
        stage: 'Crowded',
        momentum: 'Slowing',
        action: 'Caution - Consider Exit',
        stageColor: 'bg-yellow-100 text-yellow-700 border-yellow-300',
        stageIcon: '⚠️'
      },
    ],
    market_makers: [
      { 
        name: "High Liquidity Pairs",
        stage: 'Confirmed',
        momentum: 'Steady',
        action: 'Strong Position',
        stageColor: 'bg-blue-100 text-blue-700 border-blue-300',
        stageIcon: '✅'
      },
      { 
        name: "Memecoin Rotation",
        stage: 'Exhaustion',
        momentum: 'Declining',
        action: 'Exit Risk High',
        stageColor: 'bg-red-100 text-red-700 border-red-300',
        stageIcon: '🔴'
      },
    ],
    whales: [
      { 
        name: "Bitcoin Ecosystem",
        stage: 'Confirmed',
        momentum: 'Accelerating',
        action: 'Strong Position',
        stageColor: 'bg-blue-100 text-blue-700 border-blue-300',
        stageIcon: '✅'
      },
      { 
        name: "Solana DeFi",
        stage: 'Early',
        momentum: 'Accelerating',
        action: 'Monitor & Accumulate',
        stageColor: 'bg-emerald-100 text-emerald-700 border-emerald-300',
        stageIcon: '🌱'
      },
    ],
  };

  const currentNarratives = narratives[selectedCluster] || [];

  const getMomentumIcon = (momentum) => {
    if (momentum === 'Accelerating') return '📈';
    if (momentum === 'Steady') return '➡️';
    if (momentum === 'Slowing') return '📉';
    if (momentum === 'Declining') return '⬇️';
    return '→';
  };

  return (
    <div className="px-6 mb-6">
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Network className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Top Narratives</h2>
              <p className="text-xs text-gray-500">Smart money rotation signals</p>
            </div>
          </div>
          
          <div className="flex gap-1.5">
            {[
              { value: 'vc_funds', label: 'VCs' },
              { value: 'market_makers', label: 'MMs' },
              { value: 'whales', label: 'Whales' },
            ].map(cluster => (
              <button
                key={cluster.value}
                onClick={() => setSelectedCluster(cluster.value)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  selectedCluster === cluster.value
                    ? 'bg-cyan-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cluster.label}
              </button>
            ))}
          </div>
        </div>

        {/* Simplified Narratives - 3 lines each */}
        <div className="space-y-3">
          {currentNarratives.slice(0, 3).map((narrative, i) => (
            <div 
              key={i}
              className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer"
            >
              {/* Line 1: Name + Stage */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-bold text-gray-900">{narrative.name}</span>
                <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${narrative.stageColor}`}>
                  {narrative.stageIcon} {narrative.stage}
                </span>
              </div>
              
              {/* Line 2: Momentum */}
              <div className="text-xs text-gray-600 mb-1">
                Momentum: <span className="font-semibold">{getMomentumIcon(narrative.momentum)} {narrative.momentum}</span>
              </div>
              
              {/* Line 3: Action */}
              <div className="text-xs text-cyan-600 font-semibold">
                Action: {narrative.action}
              </div>
            </div>
          ))}
        </div>

        <button className="mt-3 w-full py-2 text-xs font-bold text-cyan-600 bg-cyan-50 hover:bg-cyan-100 rounded-lg transition-colors flex items-center justify-center gap-1">
          View All Narratives
          <ChevronRight className="w-3 h-3" />
        </button>
      </GlassCard>
    </div>
  );
}
