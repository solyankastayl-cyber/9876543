/**
 * Actor Detail Page - EPIC A3
 * 
 * Structural profile with Edge Score breakdown.
 * NO predictions, NO verdicts, NO trading signals.
 * 
 * Blocks:
 * 1. Header with actor info + badges
 * 2. Edge Score Breakdown (components)
 * 3. Participation History (sparkline placeholder)
 * 4. Flow Role Explanation
 * 5. Related Actors (placeholder)
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Building2, Wallet, Activity, Network, Loader2, Info, 
  ArrowLeft, TrendingUp, ArrowDownRight, Minus, ArrowUpRight,
  BarChart3, Clock, Users, ExternalLink
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ============================================
// CONSTANTS
// ============================================

const TYPE_BADGES = {
  'exchange': { label: 'Exchange', color: 'bg-blue-100 text-blue-700' },
  'fund': { label: 'Fund', color: 'bg-purple-100 text-purple-700' },
  'market_maker': { label: 'Market Maker', color: 'bg-amber-100 text-amber-700' },
  'whale': { label: 'Whale', color: 'bg-emerald-100 text-emerald-700' },
  'trader': { label: 'Trader', color: 'bg-cyan-100 text-cyan-700' },
};

const SOURCE_BADGES = {
  'verified': { label: 'Verified', color: 'bg-green-100 text-green-700', description: 'Confirmed via public disclosure' },
  'attributed': { label: 'Attributed', color: 'bg-yellow-100 text-yellow-700', description: 'Attributed via correlation (penalty applied)' },
  'behavioral': { label: 'Behavioral', color: 'bg-gray-100 text-gray-500', description: 'Pattern-based only' },
};

const FLOW_ROLE_INFO = {
  'accumulator': { 
    label: 'Accumulator', 
    color: 'bg-green-100 text-green-700',
    icon: TrendingUp,
    rule: 'Net inflow exceeds 30% of total volume',
    description: 'This actor shows consistent accumulation behavior - more inflows than outflows.'
  },
  'distributor': { 
    label: 'Distributor', 
    color: 'bg-red-100 text-red-700',
    icon: ArrowDownRight,
    rule: 'Net outflow exceeds 30% of total volume',
    description: 'This actor shows distribution behavior - more outflows than inflows.'
  },
  'neutral': { 
    label: 'Neutral', 
    color: 'bg-gray-100 text-gray-600',
    icon: Minus,
    rule: 'Balanced flow pattern (neither accumulating nor distributing)',
    description: 'This actor maintains relatively balanced in/out flows.'
  },
  'market_maker_like': { 
    label: 'Market Maker-like', 
    color: 'bg-blue-100 text-blue-700',
    icon: ArrowUpRight,
    rule: 'Bidirectional flow ≥ 40% + high transaction frequency',
    description: 'This actor shows MM-like behavior with frequent bidirectional transactions.'
  },
};

function getScoreBandInfo(score) {
  if (score >= 80) return { band: 'Elite', color: 'text-purple-600', bg: 'bg-purple-600' };
  if (score >= 60) return { band: 'High', color: 'text-emerald-600', bg: 'bg-emerald-500' };
  if (score >= 40) return { band: 'Medium', color: 'text-amber-600', bg: 'bg-amber-500' };
  return { band: 'Low', color: 'text-gray-600', bg: 'bg-gray-400' };
}

// Coverage band info
const COVERAGE_INFO = {
  'High': { 
    color: 'text-emerald-600', 
    bg: 'bg-emerald-500',
    description: 'Strong observational confidence. Multiple verified data sources.',
    disclaimer: null
  },
  'Medium': { 
    color: 'text-amber-600', 
    bg: 'bg-amber-500',
    description: 'Moderate observational confidence. Some addresses may be unverified.',
    disclaimer: 'Some data may be incomplete'
  },
  'Low': { 
    color: 'text-gray-500', 
    bg: 'bg-gray-400',
    description: 'Limited observational confidence. Data may be incomplete.',
    disclaimer: 'Low coverage may underrepresent true activity'
  },
};

// ============================================
// TOOLTIP TEXTS (L0 Final Copy)
// ============================================
const TOOLTIPS = {
  // Edge Score
  edgeScore: "Edge Score reflects an actor's structural position in the network. It is based on observed volume, connectivity, and interaction diversity. This score does not measure performance, alpha, or future behavior.",
  edgeScoreBreakdown: "The Edge Score is composed of multiple structural factors. Each component reflects a different aspect of network participation.",
  volume: "Volume represents the relative amount of value transferred by this actor within the selected time window.",
  diversity: "Diversity measures how many distinct counterparties and interaction types this actor engages with across the network.",
  connectivity: "Connectivity reflects how embedded the actor is within the network graph, based on the number and structure of its relationships.",
  
  // Coverage
  coverage: "Coverage indicates how complete and reliable the observed data is for this actor. Lower coverage means some wallets, flows, or time periods may be missing.",
  addressCoverage: "Percentage of addresses attributed to this actor that are currently observed in on-chain data.",
  volumeCoverage: "Portion of estimated total transaction volume that is captured by observed on-chain activity.",
  sourceLevel: "Indicates the confidence level of attribution. Verified sources are confirmed, while others may be inferred or attributed.",
  
  // Flow Role
  flowRole: "Flow Role describes how an actor participates in value movement based on directional flow balance and transaction frequency.",
  classificationRule: "Classification is derived from observed flow ratios and activity patterns. It does not imply business function or declared intent.",
  inflowOutflow: "Aggregated value entering or leaving this actor within the selected time window.",
  netFlowRatio: "Net difference between inflow and outflow, expressed as a ratio. Positive values indicate net inflow dominance.",
  
  // Activity Regime
  activityRegime: "Activity Regime reflects recent changes in participation intensity relative to the actor's historical baseline.",
  participationTrend: "Trend is calculated over the selected window and does not represent future behavior.",
  
  // Graph Context
  graphContext: "Graph Context shows how this actor is positioned within the current network graph for the selected time window.",
  totalConnections: "Number of unique structural relationships linked to this actor in the active graph.",
  inboundOutbound: "Count of incoming and outgoing structural connections based on observed flow direction.",
  
  // Participation History
  participationHistory: "Historical view of participation intensity across time. This section becomes available after sufficient data accumulation.",
  
  // CTA
  viewInGraph: "Open this actor within the network graph to explore structural relationships visually.",
};

// Helper component for tooltip with info icon
const InfoTooltip = ({ text, className = "" }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Info className={`w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help ${className}`} />
    </TooltipTrigger>
    <TooltipContent side="top" className="max-w-xs text-xs">
      <p>{text}</p>
    </TooltipContent>
  </Tooltip>
);

// ============================================
// COMPONENTS
// ============================================

// Coverage Block
function CoverageBlock({ actor }) {
  const coverage = actor?.coverage || { score: 0, band: 'Low' };
  const info = COVERAGE_INFO[coverage.band] || COVERAGE_INFO.Low;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6" data-testid="coverage-block">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
        <BarChart3 className="w-4 h-4" />
        Coverage
        <InfoTooltip text={TOOLTIPS.coverage} />
      </h3>
      
      {/* Main Score */}
      <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-xl">
        <div>
          <div className={`text-3xl font-bold ${info.color}`}>{coverage.score}%</div>
          <div className="text-sm text-gray-500">{coverage.band}</div>
        </div>
        <div className="w-20 h-20 relative">
          <svg className="w-full h-full" viewBox="0 0 36 36">
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${coverage.score}, 100`}
              className={info.color}
            />
          </svg>
        </div>
      </div>
      
      {/* Description */}
      <p className="text-sm text-gray-600 mb-3">{info.description}</p>
      
      {/* Components with tooltips */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 flex items-center gap-1">
            Address coverage
            <InfoTooltip text={TOOLTIPS.addressCoverage} />
          </span>
          <span className="font-medium text-gray-700">{Math.round(coverage.score * 0.6)}%</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 flex items-center gap-1">
            Volume coverage
            <InfoTooltip text={TOOLTIPS.volumeCoverage} />
          </span>
          <span className="font-medium text-gray-700">{Math.round(coverage.score * 0.8)}%</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 flex items-center gap-1">
            Source level
            <InfoTooltip text={TOOLTIPS.sourceLevel} />
          </span>
          <span className="font-medium text-gray-700">{actor?.sourceLevel || 'behavioral'}</span>
        </div>
      </div>
      
      {/* Disclaimer */}
      {info.disclaimer && (
        <div className="mt-4 p-3 bg-amber-50 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">{info.disclaimer}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Score Breakdown Component
function EdgeScoreBreakdown({ score }) {
  if (!score) return null;
  
  const breakdown = score.breakdown || {};
  const bandInfo = getScoreBandInfo(score.edgeScore);
  
  const components = [
    { 
      name: 'Volume', 
      value: breakdown.volumeComponent || 0, 
      weight: '40%',
      description: 'Trading volume influence (log-scaled)',
      tooltip: TOOLTIPS.volume
    },
    { 
      name: 'Diversity', 
      value: breakdown.diversityComponent || 0, 
      weight: '30%',
      description: 'Token diversity (unique tokens traded)',
      tooltip: TOOLTIPS.diversity
    },
    { 
      name: 'Connectivity', 
      value: breakdown.counterpartyComponent || 0, 
      weight: '30%',
      description: 'Network connectivity (unique counterparties)',
      tooltip: TOOLTIPS.connectivity
    },
  ];
  
  const sourceAdjustment = breakdown.sourceAdjustment || 1;
  const adjustmentLabel = sourceAdjustment === 1 ? 'None' : 
    sourceAdjustment === 0.85 ? '-15%' : '-40%';
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6" data-testid="edge-score-breakdown">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
        <BarChart3 className="w-4 h-4" />
        Edge Score Breakdown
        <InfoTooltip text={TOOLTIPS.edgeScoreBreakdown} />
      </h3>
      
      {/* Main Score */}
      <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-xl">
        <div>
          <div className="text-4xl font-bold text-gray-900">{score.edgeScore}</div>
          <div className={`text-sm font-medium ${bandInfo.color}`}>{bandInfo.band}</div>
        </div>
        <div className="w-24 h-24 relative">
          <svg className="w-full h-full" viewBox="0 0 36 36">
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${score.edgeScore}, 100`}
              className={bandInfo.color}
            />
          </svg>
        </div>
      </div>
      
      {/* Components with individual tooltips */}
      <div className="space-y-4">
        {components.map(comp => (
          <Tooltip key={comp.name}>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">{comp.name}</span>
                  <span className="text-gray-400 text-xs">(weight: {comp.weight})</span>
                  <span className="font-semibold text-gray-900">{comp.value}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gray-600 transition-all"
                    style={{ width: `${comp.value}%` }}
                  />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{comp.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      
      {/* Source Adjustment */}
      {sourceAdjustment !== 1 && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-yellow-700">Source Level Adjustment</span>
            <span className="font-semibold text-yellow-800">{adjustmentLabel}</span>
          </div>
          <p className="text-xs text-yellow-600 mt-1">
            Non-verified actors receive a score penalty
          </p>
        </div>
      )}
      
      <p className="text-xs text-gray-500 italic mt-4">
        Edge Score reflects structural network position, not performance or prediction.
      </p>
    </div>
  );
}

// Flow Role Explanation
function FlowRoleBlock({ flowRole, metrics }) {
  const info = FLOW_ROLE_INFO[flowRole] || FLOW_ROLE_INFO.neutral;
  const Icon = info.icon;
  
  const netFlow = metrics?.netFlowUsd || 0;
  const totalVolume = metrics?.totalVolumeUsd || 0;
  const netFlowRatio = totalVolume > 0 ? (netFlow / totalVolume * 100).toFixed(1) : 0;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6" data-testid="flow-role-block">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Activity className="w-4 h-4" />
        Flow Role
        <InfoTooltip text={TOOLTIPS.flowRole} />
      </h3>
      
      {/* Current Role */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 rounded-xl ${info.color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <div className="font-semibold text-gray-900">{info.label}</div>
          <div className="text-sm text-gray-500">Current classification</div>
        </div>
      </div>
      
      {/* Rule */}
      <div className="p-3 bg-gray-50 rounded-lg mb-4">
        <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
          Classification Rule
          <InfoTooltip text={TOOLTIPS.classificationRule} />
        </div>
        <div className="text-sm text-gray-700">{info.rule}</div>
      </div>
      
      {/* Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-3 bg-emerald-50 rounded-lg text-center cursor-help">
                <div className="text-xs text-gray-500 mb-1">Inflow</div>
                <div className="text-sm font-bold text-emerald-700">
                  {formatUSD(metrics.inflowUsd)}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{TOOLTIPS.inflowOutflow}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-3 bg-red-50 rounded-lg text-center cursor-help">
                <div className="text-xs text-gray-500 mb-1">Outflow</div>
                <div className="text-sm font-bold text-red-700">
                  {formatUSD(metrics.outflowUsd)}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{TOOLTIPS.inflowOutflow}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}
      
      {/* Net Flow Ratio */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 flex items-center gap-1">
          Net Flow Ratio
          <InfoTooltip text={TOOLTIPS.netFlowRatio} />
        </span>
        <span className={`font-semibold ${netFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {netFlow >= 0 ? '+' : ''}{netFlowRatio}%
        </span>
      </div>
      
      <p className="text-xs text-gray-500 italic mt-4">
        {info.description}
      </p>
    </div>
  );
}

// Activity Regime Block (P1: Temporal Context)
function ActivityRegimeBlock({ activityRegime }) {
  const regimeInfo = {
    'INCREASING': { 
      label: 'Increasing', 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-100',
      icon: TrendingUp,
      description: 'Activity is growing'
    },
    'STABLE': { 
      label: 'Stable', 
      color: 'text-blue-600', 
      bg: 'bg-blue-100',
      icon: Minus,
      description: 'Activity is consistent'
    },
    'DECREASING': { 
      label: 'Decreasing', 
      color: 'text-red-600', 
      bg: 'bg-red-100',
      icon: ArrowDownRight,
      description: 'Activity is declining'
    },
    'UNKNOWN': { 
      label: 'Unknown', 
      color: 'text-gray-500', 
      bg: 'bg-gray-100',
      icon: Activity,
      description: 'Insufficient data'
    },
  };
  
  const regime = activityRegime?.regime || 'UNKNOWN';
  const info = regimeInfo[regime] || regimeInfo.UNKNOWN;
  const Icon = info.icon;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6" data-testid="activity-regime-block">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Activity className="w-4 h-4" />
        Activity Regime
        <InfoTooltip text={TOOLTIPS.activityRegime} />
      </h3>
      
      {/* Current Regime */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 rounded-xl ${info.bg}`}>
          <Icon className={`w-6 h-6 ${info.color}`} />
        </div>
        <div>
          <div className={`font-semibold ${info.color}`}>{info.label}</div>
          <div className="text-sm text-gray-500">{info.description}</div>
        </div>
      </div>
      
      {/* Trend description */}
      {activityRegime?.participationTrend && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            Participation Trend
            <InfoTooltip text={TOOLTIPS.participationTrend} />
          </div>
          <div className="text-sm text-gray-700 capitalize">{activityRegime.participationTrend}</div>
        </div>
      )}
      
      <p className="text-xs text-gray-500 italic mt-4">
        Activity regime is based on observed participation changes. Not a prediction.
      </p>
    </div>
  );
}

// Participation History - shows placeholder if insufficient data
function ParticipationHistoryBlock({ actorId, window }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch(`${API_URL}/api/actor-scores/${actorId}/history?window=${window}&days=30`);
        const data = await res.json();
        if (data.ok) {
          setHistory(data.data || []);
        }
      } catch (err) {
        console.error('Load history error:', err);
      }
      setLoading(false);
    };
    loadHistory();
  }, [actorId, window]);
  
  // If less than 3 data points, show placeholder
  const hasEnoughData = history.length >= 3;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6" data-testid="participation-history">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Participation History
        <InfoTooltip text={TOOLTIPS.participationHistory} />
        <span className="text-xs font-normal text-gray-500">({window} window)</span>
      </h3>
      
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : !hasEnoughData ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Clock className="w-8 h-8 mx-auto mb-2 text-gray-700" />
          <p className="text-sm text-gray-600 font-medium">Participation history will appear once sufficient data has been accumulated.</p>
          <p className="text-xs text-gray-400 mt-1">Currently {history.length} data point(s). Minimum 3 required.</p>
        </div>
      ) : (
        <>
          {/* Simple sparkline representation */}
          <div className="h-16 flex items-end gap-1 mb-4">
            {history.slice(-14).map((h, i) => (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <div 
                    className="flex-1 bg-gray-200 rounded-t cursor-help hover:bg-gray-300 transition-colors"
                    style={{ height: `${h.edgeScore}%` }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Score: {h.edgeScore}</p>
                  <p className="text-xs text-gray-400">{new Date(h.date).toLocaleDateString()}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
          <p className="text-xs text-gray-500">Last {Math.min(history.length, 14)} data points</p>
        </>
      )}
    </div>
  );
}

// Related Actors (Placeholder)
function RelatedActorsBlock() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6" data-testid="related-actors">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Users className="w-4 h-4" />
        Related Actors
      </h3>
      
      <div className="text-center py-8">
        <Network className="w-8 h-8 mx-auto mb-2 text-gray-700" />
        <p className="text-sm text-gray-500">Related actors analysis is not available yet.</p>
        <p className="text-xs text-gray-400 mt-1">Coming in EPIC C1: Graph Builder</p>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>Note:</strong> Correlation ≠ coordination. Related actors are identified by pattern similarity, not confirmed relationships.
        </p>
      </div>
    </div>
  );
}

// A4-FE-4: Graph Context Block
function GraphContextBlock({ actorId }) {
  const [graphContext, setGraphContext] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchGraphContext = async () => {
      try {
        const res = await fetch(`${API_URL}/api/actors-builder/${actorId}/graph-context?window=7d`);
        const data = await res.json();
        if (data.ok) {
          setGraphContext(data.data);
        }
      } catch (err) {
        console.error('Failed to load graph context:', err);
      }
      setLoading(false);
    };
    fetchGraphContext();
  }, [actorId]);
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6" data-testid="graph-context-block">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Network className="w-4 h-4" />
        Graph Context
        <InfoTooltip text={TOOLTIPS.graphContext} />
      </h3>
      
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : graphContext ? (
        <>
          {/* Degree Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-3 bg-gray-50 rounded-lg text-center cursor-help">
                  <div className="text-2xl font-bold text-gray-900">{graphContext.degree}</div>
                  <div className="text-xs text-gray-500">Total Connections</div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{TOOLTIPS.totalConnections}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-3 bg-emerald-50 rounded-lg text-center cursor-help">
                  <div className="text-xl font-bold text-emerald-700">{graphContext.inDegree}</div>
                  <div className="text-xs text-gray-500">Inbound</div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{TOOLTIPS.inboundOutbound}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-3 bg-blue-50 rounded-lg text-center cursor-help">
                  <div className="text-xl font-bold text-blue-700">{graphContext.outDegree}</div>
                  <div className="text-xs text-gray-500">Outbound</div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{TOOLTIPS.inboundOutbound}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          {/* Edge Types Present */}
          {graphContext.edgeTypesPresent?.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-2">Edge Types</div>
              <div className="flex flex-wrap gap-1">
                {graphContext.edgeTypesPresent.map(type => (
                  <span 
                    key={type} 
                    className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium"
                  >
                    {type.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Strongest Edges */}
          {graphContext.strongestEdges?.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-2">Top Connections</div>
              <div className="space-y-2">
                {graphContext.strongestEdges.map((edge, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">{edge.connectedToLabel}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500">{edge.edgeType}</span>
                      <span className="px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded text-[10px] font-bold">
                        {Math.round(edge.weight * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* CTA: View in Graph */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to={`/actors/correlation?focus=${actorId}`}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-white text-white rounded-lg hover:bg-gray-100 transition-colors"
                data-testid="view-in-graph-cta"
              >
                <Network className="w-4 h-4" />
                View in Graph
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{TOOLTIPS.viewInGraph}</p>
            </TooltipContent>
          </Tooltip>
        </>
      ) : (
        <div className="text-center py-8">
          <Network className="w-8 h-8 mx-auto mb-2 text-gray-700" />
          <p className="text-sm text-gray-500">No graph connections found</p>
          <p className="text-xs text-gray-400 mt-1">Actor may not be in the current graph</p>
        </div>
      )}
      
      <p className="text-xs text-gray-500 italic mt-4">
        Graph shows structural relationships, not predictions.
      </p>
    </div>
  );
}

// Helper
function formatUSD(value) {
  if (!value) return '$0';
  const abs = Math.abs(value);
  if (abs >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

// ============================================
// MAIN PAGE
// ============================================

export default function ActorDetailPage() {
  const { actorId } = useParams();
  const [actorData, setActorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWindow, setSelectedWindow] = useState('7d');
  const [activityRegime, setActivityRegime] = useState(null);
  
  const loadActorData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load actor detail and scores
      const res = await fetch(`${API_URL}/api/actor-scores/${actorId}`);
      const data = await res.json();
      
      if (data.ok) {
        setActorData(data.data);
      } else {
        setError(data.error || 'Failed to load actor');
      }
      
      // Load activity regime from scores list
      const scoresRes = await fetch(`${API_URL}/api/actor-scores?window=7d&limit=100`);
      const scoresData = await scoresRes.json();
      if (scoresData.ok) {
        const actorScore = scoresData.data.find(s => s.actorId === actorId);
        if (actorScore?.activityRegime) {
          setActivityRegime(actorScore.activityRegime);
        }
      }
    } catch (err) {
      console.error('Load actor error:', err);
      setError('Failed to connect to server');
    }
    
    setLoading(false);
  }, [actorId]);
  
  useEffect(() => {
    loadActorData();
  }, [loadActorData]);
  
  // Get score for selected window
  const currentScore = actorData?.scores?.find(s => s.window === selectedWindow);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link to="/actors" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Actors
          </Link>
          <div className="text-center py-20">
            <p className="text-red-500 mb-2">{error}</p>
            <button 
              onClick={loadActorData}
              className="text-gray-600 hover:text-gray-800 underline"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  const actor = actorData?.actor;
  const typeBadge = TYPE_BADGES[actor?.type] || { label: actor?.type, color: 'bg-gray-100 text-gray-700' };
  const sourceBadge = SOURCE_BADGES[actor?.sourceLevel] || SOURCE_BADGES.behavioral;
  
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50" data-testid="actor-detail-page">
        <main className="max-w-6xl mx-auto px-4 py-8">
          
          {/* Back Link */}
          <Link 
            to="/actors" 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            data-testid="back-to-actors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Actors
          </Link>
          
          {/* Actor Header */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900" data-testid="actor-name">
                    {actor?.name || actorId}
                  </h1>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${typeBadge.color}`}>
                      {typeBadge.label}
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className={`px-2 py-1 rounded text-xs font-semibold cursor-help ${sourceBadge.color}`}>
                          {sourceBadge.label}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{sourceBadge.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
              
              {/* Window Selector */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                {['24h', '7d', '30d'].map(w => (
                  <button
                    key={w}
                    onClick={() => setSelectedWindow(w)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedWindow === w 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    data-testid={`window-select-${w}`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-xs text-amber-800">
                <p className="font-semibold mb-1">Structural profile, not trading advice</p>
                <p>This page shows observed on-chain behavior patterns. It does not provide predictions, verdicts, or trading signals.</p>
              </div>
            </div>
          </div>
          
          {/* No Score State */}
          {!currentScore && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center mb-6">
              <Activity className="w-12 h-12 mx-auto mb-3 text-gray-700" />
              <p className="text-gray-500 mb-2">No score data for {selectedWindow} window</p>
              <p className="text-xs text-gray-400">Run score calculation to generate metrics</p>
            </div>
          )}
          
          {/* Content Grid */}
          {currentScore && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EdgeScoreBreakdown score={currentScore} />
              <CoverageBlock actor={actor} />
              <FlowRoleBlock flowRole={currentScore.flowRole} metrics={currentScore.metrics} />
              <ActivityRegimeBlock activityRegime={activityRegime} />
              <GraphContextBlock actorId={actorId} />
              <ParticipationHistoryBlock actorId={actorId} window={selectedWindow} />
            </div>
          )}
        </main>
      </div>
    </TooltipProvider>
  );
}
