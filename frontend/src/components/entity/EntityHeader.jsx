import { Shield, CheckCircle, Copy, AlertTriangle } from 'lucide-react';
import { calculateSignalScore, tierConfig, getBehaviorIconStyle } from './entityUtils';

export const EntityHeader = ({ entity, viewMode, setViewMode }) => {
  const { score, tier, topReasons } = calculateSignalScore(entity);
  const tc = tierConfig[tier];

  const copyAddress = () => {
    navigator.clipboard.writeText(entity.address);
  };

  return (
    <div className="px-4 py-3 border-b border-gray-100 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Entity Icon */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getBehaviorIconStyle(entity.behavior?.current)}`}>
            <Shield className="w-6 h-6 text-white" />
          </div>
          
          {/* Entity Info */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900">{entity.label}</h1>
              {entity.verified && (
                <CheckCircle className="w-5 h-5 text-blue-500" />
              )}
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium uppercase">
                {entity.type}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="font-mono">{entity.address.slice(0, 10)}...{entity.address.slice(-8)}</span>
              <button 
                onClick={copyAddress} 
                className="p-1 hover:bg-gray-100 rounded"
                data-testid="copy-address-btn"
              >
                <Copy className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Signal Score Badge */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">Signal Score</div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded-lg text-lg font-bold ${tc.color} ${tc.textColor}`}>
                {score}
              </span>
              <div className="text-left">
                <div className="text-xs text-gray-500 uppercase">{tier}</div>
                <div className="flex items-center gap-1">
                  {topReasons.slice(0, 2).map((r, i) => (
                    <span key={i} className="text-xs" title={r.reason}>{r.icon}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Risk Score */}
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">Risk Score</div>
            <div className={`flex items-center gap-1 ${
              entity.riskScore < 30 ? 'text-emerald-600' : entity.riskScore < 60 ? 'text-amber-600' : 'text-red-600'
            }`}>
              <AlertTriangle className="w-4 h-4" />
              <span className="text-lg font-bold">{entity.riskScore}</span>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex items-center gap-2 mt-4">
        {['signal', 'analysis', 'raw'].map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            data-testid={`view-mode-${mode}`}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              viewMode === mode 
                ? 'bg-gray-900 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {mode === 'signal' && 'Signal View'}
            {mode === 'analysis' && 'Analysis'}
            {mode === 'raw' && 'Raw Activity'}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EntityHeader;
