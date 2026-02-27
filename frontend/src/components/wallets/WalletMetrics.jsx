import { getRiskColor, getRiskLabel } from './walletUtils';

export const WalletMetrics = ({ intelligence }) => {
  if (!intelligence) return null;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4 px-1">Core Metrics</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* PnL Summary */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">PnL Summary</h3>
            <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-700">FACT</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total PnL</span>
              <span className="font-bold text-gray-900">{intelligence.totalPnl}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Win Rate</span>
              <span className="font-semibold text-gray-900">{intelligence.winRate}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Profit Factor</span>
              <span className="font-semibold text-gray-900">{intelligence.profitFactor}</span>
            </div>
          </div>
        </div>

        {/* Risk Score */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Risk Score</h3>
            <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-700">FACT</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className={`text-4xl font-bold ${getRiskColor(intelligence.riskScore)}`}>
                {intelligence.riskScore}<span className="text-xl text-gray-400">/100</span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {getRiskLabel(intelligence.riskScore)}
              </div>
            </div>
            <div className="text-right text-xs text-gray-600">
              <div className="mb-1">✓ No sanctions</div>
              <div className="mb-1">✓ No mixers</div>
              <div>⚠ 2 risky approvals</div>
            </div>
          </div>
        </div>

        {/* Dominant Strategy */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dominant Strategy</h3>
            <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-700">MODEL</span>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900 mb-1">{intelligence.classification}</div>
            <div className="text-xs text-gray-600 mb-2">{intelligence.confidence}% confidence based on {intelligence.tradesAnalyzed} trades</div>
            <div className="flex items-center gap-1 flex-wrap">
              {intelligence.tokenOverlap?.map((token, i) => (
                <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                  {token}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletMetrics;
