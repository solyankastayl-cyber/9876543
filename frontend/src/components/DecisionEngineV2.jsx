/**
 * Decision Engine V2 Component
 * 
 * Displays Engine V2 truth: real coverage, evidence, risk, direction
 */
import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Shield, Activity, Zap, Target, Info, BarChart3 } from 'lucide-react';
import { engineV2Api } from '../api/engineV2Api';

const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-100 shadow-lg ${className}`}>
    {children}
  </div>
);

// Status badge colors
const STATUS_CONFIG = {
  'DATA_COLLECTION_MODE': { 
    label: 'Data Collection', 
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: Activity 
  },
  'PROTECTION_MODE': { 
    label: 'Protection Mode', 
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: Shield 
  },
  'OPERATIONAL': { 
    label: 'Operational', 
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: Zap 
  },
  'DEGRADED': { 
    label: 'Degraded', 
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    icon: AlertTriangle 
  },
  'CRITICAL': { 
    label: 'Critical', 
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: AlertTriangle 
  },
};

// Decision badge colors
const DECISION_CONFIG = {
  'BUY': {
    label: 'BUY',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    gradientFrom: 'from-emerald-400',
    gradientTo: 'to-green-600',
    icon: TrendingUp,
  },
  'SELL': {
    label: 'SELL',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    gradientFrom: 'from-red-400',
    gradientTo: 'to-orange-600',
    icon: TrendingDown,
  },
  'NEUTRAL': {
    label: 'NEUTRAL',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    gradientFrom: 'from-blue-400',
    gradientTo: 'to-cyan-600',
    icon: Minus,
  },
};

export default function DecisionEngineV2({ 
  actor,
  asset,
  window = '24h',
  compact = false,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const result = await engineV2Api.decide({ actor, asset, window });
        if (result.ok) {
          setData(result.data);
        } else {
          setError(result.message || 'Failed to fetch engine data');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [actor, asset, window]);
  
  if (loading) {
    return (
      <GlassCard className="p-5 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-24 bg-gray-100 rounded mb-4"></div>
        <div className="h-16 bg-gray-100 rounded"></div>
      </GlassCard>
    );
  }
  
  if (error || !data) {
    return (
      <GlassCard className="p-5">
        <div className="text-center text-gray-500">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <p>{error || 'No data available'}</p>
        </div>
      </GlassCard>
    );
  }
  
  const decisionConfig = DECISION_CONFIG[data.decision] || DECISION_CONFIG.NEUTRAL;
  const statusConfig = STATUS_CONFIG[data.health.engineStatus] || STATUS_CONFIG.DATA_COLLECTION_MODE;
  const DecisionIcon = decisionConfig.icon;
  const StatusIcon = statusConfig.icon;
  
  // Score bars
  const ScoreBar = ({ label, value, max = 100, color = 'bg-blue-500' }) => (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-20">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(100, Math.max(0, (value / max) * 100))}%` }}
        />
      </div>
      <span className="text-sm font-bold text-gray-700 w-12 text-right">{value}</span>
    </div>
  );
  
  if (compact) {
    return (
      <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-2xl border-2 ${decisionConfig.borderColor} ${decisionConfig.bgColor}`}>
        <DecisionIcon className={`w-5 h-5 ${decisionConfig.color}`} />
        <div>
          <div className={`text-sm font-bold ${decisionConfig.color}`}>{decisionConfig.label}</div>
          <div className="text-xs text-gray-500">
            Cov: {data.scores.coverage}% | Risk: {data.scores.risk}
          </div>
        </div>
        <span className={`px-2 py-0.5 text-xs font-medium rounded-lg border ${statusConfig.color}`}>
          V2
        </span>
      </div>
    );
  }
  
  return (
    <GlassCard className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${decisionConfig.gradientFrom} ${decisionConfig.gradientTo} flex items-center justify-center shadow-lg`}>
            <DecisionIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Engine V2</h3>
            <p className="text-xs text-gray-500">{data.subject?.name || asset || actor || 'Unknown'}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${statusConfig.color}`}>
          <StatusIcon className="w-4 h-4" />
          <span className="text-xs font-semibold">{statusConfig.label}</span>
        </div>
      </div>
      
      {/* Decision Card */}
      <div className={`p-4 rounded-2xl border-2 ${decisionConfig.borderColor} ${decisionConfig.bgColor} mb-4`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{data.decision === 'BUY' ? '🚀' : data.decision === 'SELL' ? '⚠️' : '⚖️'}</span>
            <div>
              <div className={`text-2xl font-bold ${decisionConfig.color}`}>{decisionConfig.label}</div>
              <div className="text-sm text-gray-600">{data.confidenceBand} Confidence</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">Direction</div>
            <div className={`text-3xl font-bold ${data.scores.direction > 0 ? 'text-emerald-600' : data.scores.direction < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {data.scores.direction > 0 ? '+' : ''}{data.scores.direction}
            </div>
          </div>
        </div>
        
        {/* Score Bars */}
        <div className="space-y-2">
          <ScoreBar label="Evidence" value={data.scores.evidence} color="bg-blue-500" />
          <ScoreBar label="Coverage" value={data.scores.coverage} color="bg-emerald-500" />
          <ScoreBar label="Risk" value={data.scores.risk} color="bg-red-500" />
        </div>
      </div>
      
      {/* Gating */}
      {data.gating.blocked && (
        <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-700">Decision Gated</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.gating.reasons.map((reason, i) => (
              <span key={i} className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-lg">
                {reason.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Risk Notes */}
      {data.notes.riskNotes.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">Risk Notes</span>
          </div>
          <div className="space-y-1.5">
            {data.notes.riskNotes.map((note, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />
                <span className="text-xs text-red-700">{note}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Drift Flags */}
      {data.health.driftFlags.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">Drift Flags</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.health.driftFlags.map((flag, i) => (
              <span key={i} className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-lg">
                {flag.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Attribution Summary */}
      {data.attribution && (
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Signals: {data.attribution.summary.totalSignals}</span>
            <span>Active: {data.attribution.summary.activeSignals}</span>
            <span>Cluster: {(data.attribution.summary.clusterPassRate * 100).toFixed(0)}%</span>
            <span>Dominance: {(data.attribution.summary.avgDominance * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}
      
      {/* Window & Time */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
        <span>Window: {data.window}</span>
        <span>Computed: {new Date(data.computedAt).toLocaleTimeString()}</span>
      </div>
    </GlassCard>
  );
}
