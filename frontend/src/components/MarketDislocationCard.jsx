import { useState } from 'react';
import { Zap, TrendingUp, X } from 'lucide-react';

// Market Dislocation Card - Усилитель сигнала
export default function MarketDislocationCard() {
  const [showEdgeModal, setShowEdgeModal] = useState(false);

  const dislocation = {
    active: true,
    type: 'Smart Money vs CEX Divergence',
    bullets: [
      'Smart money accumulating vs CEX selling',
      'Historically bullish (67% win rate)',
      'Typical duration: 24-72H'
    ]
  };

  if (!dislocation.active) return null;

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-2xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center">
              <Zap className="w-3 h-3 text-gray-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">EDGE DETECTED</div>
              <div className="text-sm font-semibold text-gray-900">{dislocation.type}</div>
            </div>
          </div>
        </div>
        
        <ul className="space-y-1 mb-3">
          {dislocation.bullets.map((b, i) => (
            <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
              <span className="text-gray-400 mt-0.5">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        
        <button 
          onClick={() => setShowEdgeModal(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-gray-100 text-white rounded-2xl font-medium text-sm transition-colors"
        >
          <Zap className="w-4 h-4" />
          Explore Edge
        </button>
      </div>

      {showEdgeModal && <EdgeExplorerModal onClose={() => setShowEdgeModal(false)} />}
    </>
  );
}

// Edge Explorer Modal
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
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{edgeData.type}</h2>
                <p className="text-sm text-gray-500">Edge Opportunity Analysis</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <div className="px-3 py-2 bg-gray-50 rounded-2xl border border-gray-200">
              <div className="text-xs text-gray-500">Confidence</div>
              <div className="text-base font-bold text-gray-900">{edgeData.confidence}%</div>
            </div>
            <div className="px-3 py-2 bg-gray-50 rounded-2xl border border-gray-200">
              <div className="text-xs text-gray-500">Win Rate</div>
              <div className="text-base font-bold text-gray-900">{edgeData.historicalWinRate.split(' ')[0]}</div>
            </div>
            <div className="px-3 py-2 bg-gray-50 rounded-2xl border border-gray-200">
              <div className="text-xs text-gray-500">Duration</div>
              <div className="text-base font-bold text-gray-900">{edgeData.timeframe.split(' ')[0]}</div>
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
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-200">
                  <span className="text-sm font-medium text-gray-700">{case_.date}</span>
                  <span className={`text-sm font-bold px-2 py-1 rounded ${case_.outcome === 'Bullish' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
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
                <div key={i} className="flex items-start gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-200">
                  <span className="text-gray-600 font-bold mt-0.5">{i + 1}.</span>
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
