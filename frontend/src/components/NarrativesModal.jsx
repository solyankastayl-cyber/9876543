import { X, TrendingUp, Clock } from 'lucide-react';

export default function NarrativesModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const allNarratives = [
    { 
      name: 'AI & Infrastructure', 
      stage: 'Early',
      momentum: 'Accelerating',
      action: 'Monitor & Accumulate', 
      tokens: ['RENDER', 'FET', 'AGIX', 'OCEAN'],
      volumeChange: '+45%',
      smartMoneyFlow: '+$89M'
    },
    { 
      name: 'Layer 2 Scaling', 
      stage: 'Confirmed',
      momentum: 'Strong',
      action: 'Strong Position', 
      tokens: ['ARB', 'OP', 'MATIC', 'IMX'],
      volumeChange: '+28%',
      smartMoneyFlow: '+$156M'
    },
    { 
      name: 'RWA (Real World Assets)', 
      stage: 'Crowded',
      momentum: 'Slowing',
      action: 'Consider Exit', 
      tokens: ['ONDO', 'TRU', 'PROPS', 'RIO'],
      volumeChange: '-12%',
      smartMoneyFlow: '-$34M'
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Market Narratives</h2>
            <p className="text-sm text-gray-500">Track emerging trends and sector rotations</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allNarratives.map((narrative, i) => (
              <div
                key={i}
                className="p-4 bg-gray-50 rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-2">{narrative.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-1 rounded-lg bg-gray-200 text-gray-700">
                        {narrative.stage}
                      </span>
                      <span className="text-xs font-medium text-gray-600">
                        {narrative.momentum}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="p-2 bg-white rounded-lg border border-gray-100">
                    <div className="text-xs text-gray-500 mb-0.5">Volume Change</div>
                    <div className="text-sm font-bold text-gray-900">
                      {narrative.volumeChange}
                    </div>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-gray-100">
                    <div className="text-xs text-gray-500 mb-0.5">Smart Money</div>
                    <div className="text-sm font-bold text-gray-900">
                      {narrative.smartMoneyFlow}
                    </div>
                  </div>
                </div>

                {/* Action */}
                <div className="mb-3 p-2 bg-white rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-500 mb-0.5">Recommended Action</div>
                  <div className="text-sm font-bold text-gray-900">{narrative.action}</div>
                </div>

                {/* Tokens */}
                <div>
                  <div className="text-xs text-gray-500 mb-2">Key Tokens</div>
                  <div className="flex flex-wrap gap-1.5">
                    {narrative.tokens.map((token, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-300 cursor-pointer transition-colors"
                      >
                        {token}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 px-6 py-4">
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{allNarratives.length}</span> narratives detected • Updated in real-time
          </div>
        </div>
      </div>
    </div>
  );
}
