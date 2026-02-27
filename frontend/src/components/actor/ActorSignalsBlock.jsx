/**
 * Actor Signals Block (Sprint 3 - Signals Layer v2)
 * 
 * Displays recent behavior deviations for an actor
 * 
 * Philosophy:
 * - Signals = observed deviations, NOT predictions
 * - severity = degree of deviation, NOT bullishness
 * - NO buy/sell language
 */
import { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, ArrowRightLeft, Layers, 
  AlertTriangle, Info, ExternalLink, ChevronRight
} from 'lucide-react';
import { api } from '../../api/client';

const SIGNAL_TYPE_CONFIG = {
  flow_deviation: {
    icon: TrendingUp,
    label: 'Flow Deviation',
    color: 'text-blue-600 bg-blue-50',
  },
  corridor_volume_spike: {
    icon: ArrowRightLeft,
    label: 'Corridor Spike',
    color: 'text-purple-600 bg-purple-50',
  },
  cluster_participation: {
    icon: Layers,
    label: 'Cluster Change',
    color: 'text-amber-600 bg-amber-50',
  },
  behavior_regime_shift: {
    icon: TrendingDown,
    label: 'Regime Shift',
    color: 'text-rose-600 bg-rose-50',
  },
};

const SEVERITY_CONFIG = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-600' },
  medium: { label: 'Medium', color: 'bg-amber-100 text-amber-700' },
  high: { label: 'High', color: 'bg-red-100 text-red-700' },
};

export default function ActorSignalsBlock({ actorSlug }) {
  const [signals, setSignals] = useState([]);
  const [baseline, setBaseline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSignals() {
      if (!actorSlug) return;
      
      setLoading(true);
      try {
        const response = await api.get(`/api/actors/${actorSlug}/signals`);
        if (response.data.ok) {
          setSignals(response.data.data.signals || []);
          setBaseline(response.data.data.baseline);
        }
      } catch (err) {
        setError('Failed to load signals');
        console.error('Signals fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchSignals();
  }, [actorSlug]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-100 rounded-xl"></div>
            <div className="h-16 bg-gray-100 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100" data-testid="actor-signals-block">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-semibold text-gray-900">Recent Deviations</h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {signals.length} active
          </span>
        </div>
        
        {/* Info tooltip */}
        <div className="relative group">
          <Info className="w-4 h-4 text-gray-400 cursor-help" />
          <div className="absolute right-0 top-6 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
            Signals show observed behavior deviations from baseline. Not predictions or recommendations.
          </div>
        </div>
      </div>

      {/* Signals list */}
      {signals.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">No deviations detected</p>
          <p className="text-gray-400 text-xs mt-1">Activity within baseline range</p>
        </div>
      ) : (
        <div className="space-y-3">
          {signals.slice(0, 5).map((signal) => {
            const typeConfig = SIGNAL_TYPE_CONFIG[signal.signalType] || SIGNAL_TYPE_CONFIG.flow_deviation;
            const severityConfig = SEVERITY_CONFIG[signal.severity] || SEVERITY_CONFIG.low;
            const Icon = typeConfig.icon;
            
            return (
              <div 
                key={signal.id}
                className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer group"
                data-testid={`signal-${signal.id}`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`p-2 rounded-lg ${typeConfig.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900">
                        {typeConfig.label}
                      </span>
                      
                      {/* Deviation multiplier */}
                      {signal.deviation > 1 && (
                        <span className="text-xs font-bold text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200">
                          {signal.deviation}×
                        </span>
                      )}
                      
                      {/* Severity */}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${severityConfig.color}`}>
                        {severityConfig.label}
                      </span>
                    </div>
                    
                    {/* Interpretation */}
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {signal.interpretation}
                    </p>
                    
                    {/* Time */}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(signal.detectedAt).toLocaleString()}
                    </p>
                  </div>
                  
                  {/* Arrow */}
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Baseline info */}
      {baseline && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Baseline ({baseline.window}):</span>
            <span className="font-medium">
              {baseline.behavior?.dominantPattern || 'unknown'} pattern
            </span>
            <span>•</span>
            <span>{baseline.behavior?.activityLevel || 'unknown'} activity</span>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 mt-3 italic">
        Deviations from observed baseline. Not trading advice.
      </p>
    </div>
  );
}
