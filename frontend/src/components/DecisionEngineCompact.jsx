import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, ChevronDown, Zap } from 'lucide-react';
import AlertModal from './AlertModal';
import { toast } from 'sonner';

export default function DecisionEngineCompact({ 
  state = 'bullish',
  confidence = 57,
  scoreBreakdown = { smartMoney: 75, regime: 99, anomalies: 25, risk: 20 }
}) {
  const [showWhy, setShowWhy] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showEdgeModal, setShowEdgeModal] = useState(false);

  const config = {
    bullish: {
      label: 'BULLISH',
      bg: 'bg-gradient-to-br from-emerald-500 to-green-600',
      icon: TrendingUp,
    },
    neutral: {
      label: 'NEUTRAL',
      bg: 'bg-gradient-to-br from-blue-500 to-cyan-600',
      icon: Minus,
    },
    risky: {
      label: 'RISKY',
      bg: 'bg-gradient-to-br from-red-500 to-orange-600',
      icon: TrendingDown,
    }
  }[state];

  const Icon = config.icon;

  const reasons = [
    { text: '3 smart money entities accumulating', detail: 'vs 1 distributing' },
    { text: 'Net inflow: +$89.2M', detail: 'Strong buy pressure' },
    { text: '2 new positions opened', detail: 'Fresh capital entering' },
  ];

  // Market Dislocation data
  const dislocation = {
    active: true,
    bullets: [
      'Smart money accumulating vs CEX selling',
      'Historically bullish (67%)'
    ]
  };

  const handleTrack = () => {
    // Добавление в watchlist
    toast.success('Added to Watchlist', {
      description: 'Market signal is now being tracked',
      duration: 3000,
    });
  };

  const handleExploreEdge = () => {
    setShowEdgeModal(true);
  };

  return (
    <div className="space-y-4">
      {/* Decision Engine Card */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
        {/* Header */}
        <div className={`${config.bg} p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-white/80 text-xs font-semibold uppercase">Market Signal</div>
                <div className="text-2xl font-bold text-white">{config.label}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-white">{confidence}%</div>
              <div className="text-white/70 text-xs">Confidence</div>
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-semibold">Decision Score</span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg font-medium">
              {scoreBreakdown.smartMoney > 50 ? '↑↑' : '↑'} Smart Money
            </span>
            <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-lg font-medium">
              {scoreBreakdown.regime > 50 ? '↑↑' : '↑'} Regime
            </span>
            <span className="px-2 py-1 bg-cyan-50 text-cyan-700 rounded-lg font-medium">
              ± Anomalies
            </span>
            <span className="px-2 py-1 bg-red-50 text-red-700 rounded-lg font-medium">
              − Risk
            </span>
          </div>
        </div>

        {/* Why? Collapsible */}
        <div className="border-b border-gray-100">
          <button 
            onClick={() => setShowWhy(!showWhy)}
            className="w-full p-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-semibold text-gray-700">Why?</span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showWhy ? 'rotate-180' : ''}`} />
          </button>
          
          {showWhy && (
            <div className="px-4 pb-4 space-y-2">
              {reasons.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  <div>
                    <span className="text-gray-900 font-medium">{r.text}</span>
                    <span className="text-gray-500 ml-1">— {r.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 flex gap-2">
          <button 
            onClick={() => setShowAlertModal(true)}
            className={`flex-1 py-2.5 ${config.bg} text-white rounded-2xl font-bold text-sm hover:shadow-lg transition-all`}
          >
            🔔 Set Alert
          </button>
          <button 
            onClick={handleTrack}
            className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-colors"
          >
            📍 Track
          </button>
        </div>
      </div>

      {/* Market Dislocation */}
      {dislocation.active && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border-2 border-purple-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-bold text-purple-900">Market Dislocation</span>
            <span className="ml-auto px-2 py-0.5 bg-purple-200 text-purple-800 text-xs font-bold rounded">EDGE</span>
          </div>
          <ul className="space-y-1 mb-3">
            {dislocation.bullets.map((b, i) => (
              <li key={i} className="text-sm text-purple-800 flex items-start gap-2">
                <span className="text-purple-500">•</span>
                {b}
              </li>
            ))}
          </ul>
          <button 
            onClick={handleExploreEdge}
            className="w-full py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-2xl font-bold text-sm transition-colors"
          >
            🎯 Explore Edge
          </button>
        </div>
      )}

      <AlertModal 
        isOpen={showAlertModal} 
        onClose={() => setShowAlertModal(false)}
        defaultType="accumulation"
      />
      
      {showEdgeModal && <EdgeExplorerModal onClose={() => setShowEdgeModal(false)} />}
    </div>
  );
}

// Edge Explorer Modal Component
function EdgeExplorerModal({ onClose }) {
  const edgeData = {
    type: 'Smart Money vs CEX Divergence',
    confidence: 67,
    historicalWinRate: '67% (12 of 18 occurrences)',
    timeframe: '24H-72H typical duration',
    signals: [
      { label: 'Smart Money Flow', value: '+$234M', positive: true, detail: 'Alameda, DWF Labs, Pantera accumulating' },
      { label: 'CEX Net Outflow', value: '-$189M', positive: false, detail: 'Heavy selling on Binance, Bybit' },
      { label: 'Price Action', value: '-2.3%', positive: false, detail: 'Temporary dip despite accumulation' },
      { label: 'Volume Profile', value: '+45%', positive: true, detail: 'Increased accumulation volume' },
    ],
    historicalCases: [
      { date: 'Dec 2025', outcome: 'Bullish', priceMove: '+12.4%', duration: '48H' },
      { date: 'Nov 2025', outcome: 'Bullish', priceMove: '+8.7%', duration: '36H' },
      { date: 'Oct 2025', outcome: 'Neutral', priceMove: '+1.2%', duration: '24H' },
      { date: 'Sep 2025', outcome: 'Bullish', priceMove: '+15.6%', duration: '72H' },
    ],
    recommendations: [
      'Monitor smart money wallet activity closely',
      'Consider entry on continued accumulation',
      'Set stop-loss if CEX pressure reverses',
      'Target: +8-12% based on historical average'
    ]
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{edgeData.type}</h2>
                <p className="text-purple-100 text-sm">Edge Opportunity Analysis</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="px-4 py-2 bg-white/20 rounded-2xl">
              <div className="text-white/80 text-xs">Confidence</div>
              <div className="text-white font-bold text-lg">{edgeData.confidence}%</div>
            </div>
            <div className="px-4 py-2 bg-white/20 rounded-2xl">
              <div className="text-white/80 text-xs">Win Rate</div>
              <div className="text-white font-bold text-lg">{edgeData.historicalWinRate.split(' ')[0]}</div>
            </div>
            <div className="px-4 py-2 bg-white/20 rounded-2xl">
              <div className="text-white/80 text-xs">Duration</div>
              <div className="text-white font-bold text-lg">{edgeData.timeframe.split(' ')[0]}</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-200px)]">
          {/* Current Signals */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Current Signals</h3>
            <div className="grid grid-cols-2 gap-3">
              {edgeData.signals.map((signal, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">{signal.label}</div>
                  <div className={`text-lg font-bold mb-1 ${signal.positive ? 'text-emerald-600' : 'text-red-600'}`}>
                    {signal.value}
                  </div>
                  <div className="text-xs text-gray-600">{signal.detail}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Historical Cases */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Historical Cases</h3>
            <div className="space-y-2">
              {edgeData.historicalCases.map((case_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-200">
                  <span className="text-sm font-medium text-gray-700">{case_.date}</span>
                  <span className={`text-sm font-bold px-2 py-1 rounded ${case_.outcome === 'Bullish' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                    {case_.outcome}
                  </span>
                  <span className="text-sm font-bold text-emerald-600">{case_.priceMove}</span>
                  <span className="text-sm text-gray-500">{case_.duration}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Recommended Actions</h3>
            <div className="space-y-2">
              {edgeData.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2 p-3 bg-cyan-50 rounded-2xl border border-cyan-200">
                  <span className="text-cyan-600 font-bold mt-0.5">{i + 1}.</span>
                  <span className="text-sm text-gray-700">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
