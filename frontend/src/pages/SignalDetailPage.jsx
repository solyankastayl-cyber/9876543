/**
 * EPIC D1 — Signal Detail Page
 * 
 * ETAP 4: Explainability & Evidence
 * 
 * Shows:
 * - WHAT happened (summary)
 * - WHY it triggered (rule explanation)
 * - EVIDENCE (facts only, no interpretation)
 * - Graph context (link to view)
 * 
 * NO ML. NO Trading Advice. FACTS ONLY.
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Info, ExternalLink, AlertTriangle,
  Waypoints, TrendingUp, ArrowRightLeft, Activity, GitBranch,
  Clock, Cpu, Hash, Target, Shield, Database, BarChart3, MessageCircle
} from 'lucide-react';
import { d1SignalsApi } from '../api/d1SignalsApi';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';

// ==================== CONSTANTS ====================

const TYPE_CONFIG = {
  NEW_CORRIDOR: { 
    label: 'New Corridor', 
    icon: Waypoints,
    color: 'bg-blue-600',
    description: 'New persistent transaction path detected'
  },
  DENSITY_SPIKE: { 
    label: 'Density Spike', 
    icon: TrendingUp,
    color: 'bg-orange-500',
    description: 'Sharp increase in interaction density'
  },
  DIRECTION_IMBALANCE: { 
    label: 'Direction Imbalance', 
    icon: ArrowRightLeft,
    color: 'bg-purple-600',
    description: 'One-sided flow pattern detected'
  },
  ACTOR_REGIME_CHANGE: { 
    label: 'Regime Change', 
    icon: Activity,
    color: 'bg-red-600',
    description: 'Actor behavior pattern shifted'
  },
  NEW_BRIDGE: { 
    label: 'New Bridge', 
    icon: GitBranch,
    color: 'bg-emerald-600',
    description: 'New structural connection between clusters'
  }
};

const SEVERITY_CONFIG = {
  low: { label: 'Low', color: 'bg-gray-500', text: 'text-gray-600' },
  medium: { label: 'Medium', color: 'bg-amber-500', text: 'text-amber-600' },
  high: { label: 'High', color: 'bg-red-500', text: 'text-red-600' }
};

const STATUS_CONFIG = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-700' },
  active: { label: 'Active', color: 'bg-green-100 text-green-700' },
  cooling: { label: 'Cooling', color: 'bg-yellow-100 text-yellow-700' },
  archived: { label: 'Archived', color: 'bg-gray-100 text-gray-500' }
};

const RULE_DESCRIPTIONS = {
  NEW_CORRIDOR: 'Triggers when a new persistent transaction path is detected between actors that did not have significant interaction in the baseline period.',
  DENSITY_SPIKE: 'Triggers when the number of parallel interactions between two nodes exceeds its historical baseline by a defined multiplier.',
  DIRECTION_IMBALANCE: 'Triggers when flow becomes strongly one-sided (>75% in one direction) within an existing corridor.',
  ACTOR_REGIME_CHANGE: 'Triggers when an actor\'s behavior pattern or flow role changes significantly compared to baseline.',
  NEW_BRIDGE: 'Triggers when a new structural connection appears between previously unconnected clusters or actor types.'
};

// ETAP 7: Confidence Configuration
const CONFIDENCE_CONFIG = {
  HIGH: { 
    color: 'bg-emerald-500', 
    bgLight: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    label: 'High',
    description: 'Высокое покрытие данных. Все ключевые источники доступны. Сигнал отправляется в Telegram.'
  },
  MEDIUM: { 
    color: 'bg-amber-500', 
    bgLight: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200',
    label: 'Medium',
    description: 'Среднее покрытие данных. Некоторые источники могут отсутствовать. Сигнал отправляется в Telegram.'
  },
  LOW: { 
    color: 'bg-orange-500', 
    bgLight: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-200',
    label: 'Low',
    description: 'Низкое покрытие данных. Ограниченная история транзакций. Требуется ручная проверка.'
  },
  HIDDEN: { 
    color: 'bg-gray-400', 
    bgLight: 'bg-gray-100',
    text: 'text-gray-500',
    border: 'border-gray-200',
    label: 'Hidden',
    description: 'Минимальное покрытие данных. Сигнал НЕ отправляется в Telegram автоматически.'
  }
};

const CONFIDENCE_BREAKDOWN_LABELS = {
  coverage: { 
    label: 'Покрытие данных', 
    icon: Database,
    tooltip: 'Насколько полно индексированы данные снапшота'
  },
  actors: { 
    label: 'Качество акторов', 
    icon: Target,
    tooltip: 'Верификация и источники данных об акторах'
  },
  flow: { 
    label: 'Значимость потоков', 
    icon: ArrowRightLeft,
    tooltip: 'Объем и значимость финансовых потоков'
  },
  temporal: { 
    label: 'Временная стабильность', 
    icon: Clock,
    tooltip: 'Наличие подтверждения в других временных окнах'
  },
  evidence: { 
    label: 'Качество evidence', 
    icon: BarChart3,
    tooltip: 'Полнота и детализация доказательной базы'
  }
};

// ==================== HELPERS ====================

function formatNumber(num) {
  if (num === null || num === undefined) return '—';
  if (Math.abs(num) >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (Math.abs(num) >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toLocaleString();
}

function formatPercent(num) {
  if (num === null || num === undefined) return '—';
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(0)}%`;
}

function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
}

// ==================== COMPONENTS ====================

// Info Tooltip
function InfoTip({ children }) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <Info className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-help" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}

// Block 0: Global Header (Fixed Disclaimer)
function GlobalHeader({ signal }) {
  const typeConfig = TYPE_CONFIG[signal.type] || TYPE_CONFIG.NEW_CORRIDOR;
  const TypeIcon = typeConfig.icon;
  const severityConfig = SEVERITY_CONFIG[signal.severity] || SEVERITY_CONFIG.medium;
  const statusConfig = STATUS_CONFIG[signal.status] || STATUS_CONFIG.active;
  const confidenceLabel = signal.confidenceLabel || 'MEDIUM';
  const confidenceConfig = CONFIDENCE_CONFIG[confidenceLabel] || CONFIDENCE_CONFIG.MEDIUM;

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Badges */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Type Badge */}
            <div className={`flex items-center gap-2 px-3 py-1.5 ${typeConfig.color} text-white rounded-lg text-sm font-medium`}>
              <TypeIcon className="w-4 h-4" />
              <span>{typeConfig.label}</span>
            </div>
            
            {/* Severity */}
            <div className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${severityConfig.color}`} />
              <span className={`text-sm font-medium ${severityConfig.text}`}>{severityConfig.label}</span>
              <InfoTip>
                Relative strength of deviation from baseline.
                Severity does not indicate importance or market impact.
              </InfoTip>
            </div>
            
            {/* Status */}
            <span className={`px-2 py-1 rounded text-xs font-medium ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
            
            {/* Confidence Badge */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded border ${confidenceConfig.bgLight} ${confidenceConfig.border} cursor-help`}>
                  <div className={`w-2 h-2 rounded-full ${confidenceConfig.color}`} />
                  <span className={`text-xs font-medium ${confidenceConfig.text}`}>
                    Confidence: {signal.confidenceScore ?? 0}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs font-medium mb-1">{confidenceConfig.label} Confidence</p>
                <p className="text-xs text-slate-500">{confidenceConfig.description}</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Window */}
            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
              {signal.window}
            </span>
          </div>
          
          {/* Right: ID */}
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Hash className="w-4 h-4" />
            <span className="font-mono">{signal.id}</span>
          </div>
        </div>
      </div>
      
      {/* Fixed Disclaimer */}
      <div className="bg-amber-50 border-t border-amber-200 px-6 py-2">
        <div className="flex items-center gap-2 text-xs text-amber-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>
            <strong>Structural signal.</strong> Not trading advice. Rule-based observation from Graph Layer (L0/L1).
          </span>
        </div>
      </div>
    </div>
  );
}

// Block 1: Signal Summary
function SignalSummary({ signal }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900">{signal.title}</h2>
        <InfoTip>
          This is a factual description of what changed in the graph structure.
          No assumptions about intent or market impact are made.
        </InfoTip>
      </div>
      
      <p className="text-slate-600 leading-relaxed">
        {signal.subtitle || signal.summary?.what || 'A structural change was detected in the on-chain graph.'}
      </p>
      
      {signal.summary?.whyNow && (
        <p className="mt-3 text-sm text-slate-500">
          {signal.summary.whyNow}
        </p>
      )}
    </div>
  );
}

// Block 2: Signal Metadata
function SignalMetadata({ signal }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <Target className="w-4 h-4" />
        Signal Metadata
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <dt className="text-xs text-slate-500 mb-1">Signal ID</dt>
          <dd className="text-sm font-mono text-slate-900">{signal.id}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500 mb-1">Scope</dt>
          <dd className="text-sm text-slate-900 capitalize">{signal.scope}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500 mb-1">Time Window</dt>
          <dd className="text-sm text-slate-900">{signal.window}</dd>
        </div>
        <div className="flex items-start gap-1">
          <div>
            <dt className="text-xs text-slate-500 mb-1">Engine Version</dt>
            <dd className="text-sm text-slate-900">D1.0</dd>
          </div>
          <InfoTip>
            Signals are generated by a deterministic rules-only engine.
            No machine learning models are involved at this stage.
          </InfoTip>
        </div>
      </div>
    </div>
  );
}

// Block 3: Rule Explanation
function RuleExplanation({ signal }) {
  const evidence = signal.evidence || {};
  const rule = evidence.rule || {};
  const baseline = evidence.baseline || {};
  const current = evidence.current || {};
  
  const ruleDescription = RULE_DESCRIPTIONS[signal.type] || 'Rule-based structural detection.';
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Why This Signal Was Triggered
        </h3>
        <InfoTip>
          Each signal is generated by a predefined rule with explicit thresholds.
          No adaptive or probabilistic logic is used.
        </InfoTip>
      </div>
      
      {/* Rule Card */}
      <div className="bg-blue-50 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">Rule</span>
          <span className="font-semibold text-slate-900">{signal.type}</span>
          {rule.version && (
            <span className="text-xs text-slate-500">v{rule.version}</span>
          )}
        </div>
        <p className="text-sm text-slate-700">{ruleDescription}</p>
      </div>
      
      {/* Threshold Table */}
      {(baseline.density !== undefined || current.density !== undefined) && (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left text-slate-500 font-medium">Metric</th>
                <th className="px-4 py-2 text-right text-slate-500 font-medium">Baseline</th>
                <th className="px-4 py-2 text-right text-slate-500 font-medium">Current</th>
                <th className="px-4 py-2 text-right text-slate-500 font-medium">Change</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-3 text-slate-700">Edge Density</td>
                <td className="px-4 py-3 text-right text-slate-500">{baseline.density ?? '—'}</td>
                <td className="px-4 py-3 text-right text-slate-900 font-medium">{current.density ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  {signal.metrics?.density?.deltaPct != null ? (
                    <span className={signal.metrics.density.deltaPct > 0 ? 'text-emerald-600' : 'text-red-600'}>
                      {formatPercent(signal.metrics.density.deltaPct)}
                    </span>
                  ) : '—'}
                </td>
              </tr>
              {rule.thresholds && Object.entries(rule.thresholds).map(([key, value]) => (
                <tr key={key} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-700">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</td>
                  <td className="px-4 py-3 text-right text-slate-500">—</td>
                  <td className="px-4 py-3 text-right text-slate-900 font-medium">{value}</td>
                  <td className="px-4 py-3 text-right text-slate-400">threshold</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Block 4: Evidence
function EvidenceBlock({ signal }) {
  const evidence = signal.evidence || {};
  const flows = evidence.flows || {};
  const entities = signal.entities || [];
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-slate-600" />
          Evidence Used by the Engine
        </h3>
        <InfoTip>
          Evidence consists only of graph-derived facts:
          connections, directions, densities, and confidence levels.
        </InfoTip>
      </div>
      
      {/* Entities/Actors Table */}
      {entities.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-slate-700 mb-3">Involved Actors</h4>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-slate-500 font-medium">Actor</th>
                  <th className="px-4 py-2 text-left text-slate-500 font-medium">Type</th>
                  <th className="px-4 py-2 text-left text-slate-500 font-medium">Source</th>
                  <th className="px-4 py-2 text-right text-slate-500 font-medium">Coverage</th>
                </tr>
              </thead>
              <tbody>
                {entities.map((entity, i) => (
                  <tr key={entity.id || i} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <Link 
                        to={`/actors/${entity.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {entity.label}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600 capitalize">{entity.type || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                        {entity.source || 'graph'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {entity.coverage ? `${(entity.coverage * 100).toFixed(0)}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Flow Metrics */}
      {(flows.inflowUsd || flows.outflowUsd) && (
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-3">Flow Metrics</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <dt className="text-xs text-slate-500 mb-1">Inflow</dt>
              <dd className="text-lg font-semibold text-slate-900">${formatNumber(flows.inflowUsd)}</dd>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <dt className="text-xs text-slate-500 mb-1">Outflow</dt>
              <dd className="text-lg font-semibold text-slate-900">${formatNumber(flows.outflowUsd)}</dd>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <dt className="text-xs text-slate-500 mb-1">Net Flow</dt>
              <dd className={`text-lg font-semibold ${flows.netUsd >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {flows.netUsd >= 0 ? '+' : ''}${formatNumber(flows.netUsd)}
              </dd>
            </div>
          </div>
        </div>
      )}
      
      {/* Direction */}
      {signal.direction && signal.direction !== 'neutral' && (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
          <ArrowRightLeft className="w-4 h-4" />
          <span>Direction: <strong className="capitalize">{signal.direction}</strong></span>
        </div>
      )}
    </div>
  );
}

// Block 5: Graph Context
function GraphContext({ signal }) {
  const navigate = useNavigate();
  const graphUrl = signal.links?.graph || `/actors/correlation?focus=${signal.primary?.id || signal.id}`;
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Waypoints className="w-5 h-5 text-slate-600" />
          Graph Context
        </h3>
        <InfoTip>
          The graph view shows the same data used by the engine.
          No additional processing is applied.
        </InfoTip>
      </div>
      
      <p className="text-sm text-slate-600 mb-4">
        This signal involves a subset of the actor graph. 
        You can inspect the exact structural context visually.
      </p>
      
      <button
        onClick={() => navigate(graphUrl)}
        className="flex items-center gap-2 px-4 py-2 bg-white text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
        data-testid="view-in-graph-btn"
      >
        <ExternalLink className="w-4 h-4" />
        View in Graph
      </button>
    </div>
  );
}

// ETAP 7: Block 5.5 - Confidence Breakdown
function ConfidenceBlock({ signal }) {
  const confidenceLabel = signal.confidenceLabel || 'MEDIUM';
  const confidenceScore = signal.confidenceScore ?? 0;
  const breakdown = signal.confidenceBreakdown || {};
  const reasons = signal.confidenceReasons || [];
  
  const config = CONFIDENCE_CONFIG[confidenceLabel] || CONFIDENCE_CONFIG.MEDIUM;
  const isHidden = confidenceLabel === 'HIDDEN';
  const isTelegramEligible = !isHidden && signal.severity === 'high';
  
  return (
    <div className={`bg-white rounded-xl border ${config.border} p-6`} data-testid="confidence-block">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-slate-600" />
          Signal Confidence
        </h3>
        <InfoTip>
          Confidence отражает ПОЛНОТУ ДАННЫХ, а не точность сигнала.
          Низкий confidence означает меньше исторических данных для анализа.
        </InfoTip>
      </div>
      
      {/* Score Card */}
      <div className={`${config.bgLight} rounded-lg p-4 mb-4`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-3 h-3 rounded-full ${config.color}`} />
              <span className={`font-semibold ${config.text}`}>{config.label}</span>
            </div>
            <p className="text-sm text-slate-600">{config.description}</p>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${config.text}`}>{confidenceScore}</div>
            <div className="text-xs text-slate-500">/100</div>
          </div>
        </div>
        
        {/* Telegram Status */}
        <div className={`mt-3 pt-3 border-t ${config.border} flex items-center gap-2`}>
          <MessageCircle className={`w-4 h-4 ${isTelegramEligible ? 'text-blue-600' : 'text-gray-400'}`} />
          <span className={`text-xs font-medium ${isTelegramEligible ? 'text-blue-700' : 'text-gray-500'}`}>
            {isTelegramEligible 
              ? '✓ Отправлено в Telegram' 
              : isHidden 
                ? '✗ Не отправлено (confidence < 40)' 
                : signal.severity !== 'high' 
                  ? '✗ Не отправлено (severity ≠ HIGH)'
                  : '— Статус неизвестен'}
          </span>
        </div>
      </div>
      
      {/* Breakdown */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-slate-700 mb-3">Breakdown by Component</h4>
        <div className="space-y-3">
          {Object.entries(CONFIDENCE_BREAKDOWN_LABELS).map(([key, meta]) => {
            const value = breakdown[key] ?? 0;
            const Icon = meta.icon;
            
            return (
              <div key={key} className="flex items-center gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-6 flex justify-center cursor-help">
                      <Icon className="w-4 h-4 text-slate-400" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs text-xs">
                    {meta.tooltip}
                  </TooltipContent>
                </Tooltip>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-600">{meta.label}</span>
                    <span className="text-xs font-medium text-slate-900">{value}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        value >= 70 ? 'bg-emerald-500' : 
                        value >= 40 ? 'bg-amber-500' : 
                        'bg-gray-400'
                      }`}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Reasons */}
      {reasons.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2">Contributing Factors</h4>
          <ul className="space-y-1">
            {reasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                <span className="text-slate-400 mt-0.5">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Info Note */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-xs text-blue-700">
          <strong>Что означает Confidence?</strong> Это показатель полноты данных, а не точности сигнала. 
          Низкий confidence говорит о том, что у нас меньше исторических данных для анализа — 
          это не значит, что сигнал неверный.
        </p>
      </div>
    </div>
  );
}

// Block 6: Footer
function SignalFooter({ signal }) {
  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>Generated: {formatDate(signal.createdAt)}</span>
          </div>
          {signal.updatedAt && signal.updatedAt !== signal.createdAt && (
            <span>Updated: {formatDate(signal.updatedAt)}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Cpu className="w-4 h-4" />
          <span>Engine: D1.0 (rules-only)</span>
        </div>
      </div>
      
      <div className="border-t border-slate-200 pt-4">
        <p className="text-xs text-slate-500 leading-relaxed">
          This signal describes structural changes in on-chain behavior.
          It does <strong>NOT</strong> imply price movement, intent, or trading opportunity.
        </p>
      </div>
    </div>
  );
}

// Loading State
function LoadingState() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading signal details...</p>
      </div>
    </div>
  );
}

// Error State
function ErrorState({ error, onBack }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Signal Not Found</h2>
        <p className="text-slate-500 mb-4">{error || 'The requested signal could not be loaded.'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-white text-white rounded-lg text-sm font-medium hover:bg-slate-800"
        >
          Back to Signals
        </button>
      </div>
    </div>
  );
}

// ==================== MAIN PAGE ====================

export default function SignalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [signal, setSignal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchSignal() {
      setLoading(true);
      setError(null);
      
      try {
        const res = await d1SignalsApi.getSignalById(id);
        if (res.ok && res.data) {
          setSignal(res.data);
        } else {
          setError(res.error || 'Signal not found');
        }
      } catch (err) {
        console.error('Failed to fetch signal:', err);
        setError('Failed to load signal');
      } finally {
        setLoading(false);
      }
    }
    
    if (id) {
      fetchSignal();
    }
  }, [id]);
  
  if (loading) return <LoadingState />;
  if (error || !signal) return <ErrorState error={error} onBack={() => navigate('/signals')} />;
  
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50" data-testid="signal-detail-page">
        {/* Back Button */}
        <div className="bg-white border-b border-slate-200 px-6 py-3">
          <button
            onClick={() => navigate('/signals')}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Signals
          </button>
        </div>
        
        {/* Block 0: Global Header */}
        <GlobalHeader signal={signal} />
        
        {/* Content */}
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Block 1: Summary */}
          <SignalSummary signal={signal} />
          
          {/* Block 2: Metadata */}
          <SignalMetadata signal={signal} />
          
          {/* Block 3: Rule Explanation */}
          <RuleExplanation signal={signal} />
          
          {/* Block 4: Evidence */}
          <EvidenceBlock signal={signal} />
          
          {/* Block 5: Graph Context */}
          <GraphContext signal={signal} />
          
          {/* Block 5.5: Confidence (ETAP 7) */}
          <ConfidenceBlock signal={signal} />
          
          {/* Block 6: Footer */}
          <SignalFooter signal={signal} />
        </div>
      </div>
    </TooltipProvider>
  );
}
