import { calculateSignalScore, tierConfig } from './entityUtils';
import { GlassCard } from './GlassCard';

export const SignalScorePanel = ({ entity }) => {
  const { score, breakdown, tier } = calculateSignalScore(entity);
  const tc = tierConfig[tier];

  return (
    <GlassCard className={`p-5 border-l-4 ${
      tier === 'critical' ? 'border-l-gray-900' : 
      tier === 'notable' ? 'border-l-amber-500' : 'border-l-gray-300'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase mb-1">Signal Score</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900">{score}</span>
            <span className="text-lg text-gray-400">/100</span>
          </div>
        </div>
        <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${tc.color} ${tc.textColor}`}>
          {tc.label}
        </span>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-2">
        {breakdown.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">{item.icon}</span>
              <span className="text-sm text-gray-700">{item.reason}</span>
            </div>
            <span className="text-sm font-bold text-emerald-600">+{item.score}</span>
          </div>
        ))}
      </div>

      {/* Score Bar */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${
              tier === 'critical' ? 'bg-gray-900' : 
              tier === 'notable' ? 'bg-amber-500' : 'bg-gray-400'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-gray-400">
          <span>0</span>
          <span>40</span>
          <span>70</span>
          <span>100</span>
        </div>
      </div>
    </GlassCard>
  );
};

export default SignalScorePanel;
