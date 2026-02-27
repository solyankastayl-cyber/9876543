import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { getBehaviorInterpretation, getBehaviorIconStyle } from './entityUtils';

export const BehaviorPanel = ({ behavior, entityType, holdings }) => {
  if (!behavior) return null;

  return (
    <GlassCard className="p-5">
      <h2 className="text-xs font-bold text-gray-400 uppercase mb-4">Behavior & Portfolio</h2>
      
      {/* Current Behavior */}
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getBehaviorIconStyle(behavior.current)}`}>
          {behavior.current === 'accumulating' && <TrendingUp className="w-6 h-6 text-white" />}
          {behavior.current === 'distributing' && <TrendingDown className="w-6 h-6 text-white" />}
          {behavior.current === 'rotating' && <ArrowRight className="w-6 h-6 text-white" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900 capitalize">{behavior.current}</span>
            <span className="text-sm text-gray-500">{behavior.confidence}% confidence</span>
          </div>
          {behavior.change && (
            <div className="text-sm text-gray-500">
              Changed from <span className="font-medium text-gray-700">{behavior.change.from}</span> • {behavior.change.time}
            </div>
          )}
        </div>
      </div>

      {/* Interpretation */}
      <div className="p-3 bg-gray-50 rounded-lg mb-4">
        <p className="text-sm text-gray-600">{getBehaviorInterpretation(behavior)}</p>
      </div>

      {/* Aligned Entities */}
      {behavior.alignedWith?.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-gray-500 uppercase mb-2">Aligned With</div>
          <div className="flex flex-wrap gap-2">
            {behavior.alignedWith.map((entity, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-blue-700">{entity.label}</span>
                <span className="text-xs text-blue-500">{Math.round(entity.correlation * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Holdings */}
      {holdings?.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 uppercase mb-2">Top Holdings</div>
          <div className="space-y-2">
            {holdings.slice(0, 3).map((h, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{h.symbol}</span>
                  <span className="text-sm text-gray-500">{h.percentage}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">{h.value}</span>
                  <span className={`text-xs ${h.change24h >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {h.change24h >= 0 ? '+' : ''}{h.change24h}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
};

export default BehaviorPanel;
