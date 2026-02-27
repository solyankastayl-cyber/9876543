import React from 'react';

const StrategyFingerprint = ({ fingerprint, strategies }) => {
  const items = [
    { key: 'dexUsage', label: 'DEX Usage' },
    { key: 'holdDuration', label: 'Hold Duration' },
    { key: 'riskTolerance', label: 'Risk Tolerance' },
    { key: 'narrativeFocus', label: 'Narrative Focus' },
    { key: 'entryTiming', label: 'Entry Timing' },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Strategy Fingerprint</h3>
      <div className="space-y-2.5">
        {items.map(item => (
          <div key={item.key}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-600">{item.label}</span>
              <span className="font-semibold text-gray-900">{fingerprint[item.key]}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gray-900 rounded-full transition-all"
                style={{ width: `${fingerprint[item.key]}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-gray-100">
        {strategies.map((strategy, i) => (
          <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
            {strategy}
          </span>
        ))}
      </div>
    </div>
  );
};

export default StrategyFingerprint;
