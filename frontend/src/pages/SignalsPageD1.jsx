/**
 * EPIC D1 — Signals Page
 * 
 * Structural alerts derived from on-chain behavior.
 * NOT trading advice. NOT predictions.
 * 
 * UI SPEC v1.0 Implementation
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  X, Info, ChevronLeft, ChevronRight, 
  ExternalLink, MoreHorizontal, Archive, Copy, 
  User, Building2, Waypoints, TrendingUp, 
  ArrowRightLeft, Activity, GitBranch, MessageCircle
} from 'lucide-react';
import { d1SignalsApi } from '../api/d1SignalsApi';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import TelegramConnect from '../components/TelegramConnect';

// ==================== CONSTANTS ====================

const WINDOWS = ['24h', '7d', '30d'];
const STATUSES = ['new', 'active', 'cooling', 'archived'];
const SEVERITIES = ['low', 'medium', 'high'];
const SCOPES = ['actor', 'entity', 'wallet', 'corridor'];
const SIGNAL_TYPES = [
  'NEW_CORRIDOR',
  'DENSITY_SPIKE', 
  'DIRECTION_IMBALANCE',
  'ACTOR_REGIME_CHANGE',
  'NEW_BRIDGE'
];

const TYPE_CONFIG = {
  NEW_CORRIDOR: { 
    label: 'New Corridor', 
    icon: Waypoints,
    description: 'A new persistent transaction path has emerged.'
  },
  DENSITY_SPIKE: { 
    label: 'Density Spike', 
    icon: TrendingUp,
    description: 'Transaction activity increased sharply within an existing corridor.'
  },
  DIRECTION_IMBALANCE: { 
    label: 'Direction Imbalance', 
    icon: ArrowRightLeft,
    description: 'Flow became strongly one-sided.'
  },
  ACTOR_REGIME_CHANGE: { 
    label: 'Regime Change', 
    icon: Activity,
    description: 'Actor behavior pattern shifted.'
  },
  NEW_BRIDGE: { 
    label: 'New Bridge', 
    icon: GitBranch,
    description: 'A new structural connection between clusters appeared.'
  }
};

const SEVERITY_CONFIG = {
  low: { color: 'bg-gray-400', text: 'text-gray-600', bg: 'bg-gray-50' },
  medium: { color: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50' },
  high: { color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' }
};

const CONFIDENCE_CONFIG = {
  HIGH: { 
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200', 
    icon: '●',
    tooltip: 'Высокое покрытие данных. Все ключевые источники доступны.'
  },
  MEDIUM: { 
    color: 'bg-amber-100 text-amber-700 border-amber-200', 
    icon: '◐',
    tooltip: 'Среднее покрытие данных. Некоторые источники могут отсутствовать.'
  },
  LOW: { 
    color: 'bg-orange-100 text-orange-700 border-orange-200', 
    icon: '○',
    tooltip: 'Низкое покрытие данных. Ограниченная история транзакций.'
  },
  HIDDEN: { 
    color: 'bg-gray-100 text-gray-400 border-gray-200', 
    icon: '○',
    tooltip: 'Минимальное покрытие данных. Сигнал не отправляется в Telegram.'
  }
};

const STATUS_CONFIG = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-700' },
  active: { label: 'Active', color: 'bg-green-100 text-green-700' },
  cooling: { label: 'Cooling', color: 'bg-yellow-100 text-yellow-700' },
  archived: { label: 'Archived', color: 'bg-gray-100 text-gray-500' }
};

const ENTITY_ICON = {
  actor: User,
  entity: Building2,
  wallet: Waypoints
};

// ==================== HELPERS ====================

function formatTimeAgo(date) {
  if (!date) return '';
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now - then) / 1000);
  
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return then.toLocaleDateString();
}

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

// ==================== COMPONENTS ====================

// Disclaimer Banner
function DisclaimerBanner() {
  return (
    <div className="bg-slate-50 border-b border-slate-200 px-4 py-2">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Info className="w-3.5 h-3.5" />
        <span>Structural alerts derived from on-chain behavior. Not trading advice.</span>
      </div>
    </div>
  );
}

// Search Input
function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
        data-testid="signals-search"
      />
      {value && (
        <button 
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// Window Selector (Segmented Control)
function WindowSelector({ value, onChange }) {
  return (
    <div className="flex bg-slate-100 rounded-lg p-0.5">
      {WINDOWS.map(w => (
        <button
          key={w}
          onClick={() => onChange(w)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            value === w 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
          data-testid={`window-${w}`}
        >
          {w}
        </button>
      ))}
    </div>
  );
}

// Status Toggle Pills
function StatusToggle({ selected, onChange }) {
  const toggle = (status) => {
    if (selected.includes(status)) {
      onChange(selected.filter(s => s !== status));
    } else {
      onChange([...selected, status]);
    }
  };
  
  return (
    <div className="flex gap-1">
      {STATUSES.map(s => (
        <button
          key={s}
          onClick={() => toggle(s)}
          className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
            selected.includes(s)
              ? STATUS_CONFIG[s].color
              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
          }`}
          data-testid={`status-${s}`}
        >
          {STATUS_CONFIG[s].label}
        </button>
      ))}
    </div>
  );
}

// Severity Pills
function SeverityPills({ selected, onChange }) {
  const toggle = (sev) => {
    if (selected.includes(sev)) {
      onChange(selected.filter(s => s !== sev));
    } else {
      onChange([...selected, sev]);
    }
  };
  
  return (
    <div className="flex gap-1">
      {SEVERITIES.map(s => (
        <button
          key={s}
          onClick={() => toggle(s)}
          className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors capitalize ${
            selected.includes(s)
              ? `${SEVERITY_CONFIG[s].bg} ${SEVERITY_CONFIG[s].text}`
              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
          }`}
          data-testid={`severity-${s}`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

// Scope Pills
function ScopePills({ selected, onChange }) {
  const toggle = (scope) => {
    if (selected.includes(scope)) {
      onChange(selected.filter(s => s !== scope));
    } else {
      onChange([...selected, scope]);
    }
  };
  
  return (
    <div className="flex gap-1">
      {SCOPES.map(s => (
        <button
          key={s}
          onClick={() => toggle(s)}
          className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors capitalize ${
            selected.includes(s)
              ? 'bg-white text-white'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
          data-testid={`scope-${s}`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

// Type Dropdown
function TypeDropdown({ selected, onChange }) {
  const [open, setOpen] = useState(false);
  
  const toggle = (type) => {
    if (selected.includes(type)) {
      onChange(selected.filter(t => t !== type));
    } else {
      onChange([...selected, type]);
    }
  };
  
  const label = selected.length === 0 || selected.length === SIGNAL_TYPES.length 
    ? 'All Types' 
    : `${selected.length} types`;
  
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 text-xs font-medium bg-slate-100 rounded-lg hover:bg-slate-200 flex items-center gap-1"
        data-testid="type-dropdown"
      >
        {label}
        <ChevronRight className={`w-3 h-3 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
            {SIGNAL_TYPES.map(type => {
              const config = TYPE_CONFIG[type];
              const Icon = config.icon;
              const isSelected = selected.includes(type);
              
              return (
                <button
                  key={type}
                  onClick={() => toggle(type)}
                  className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-50 ${
                    isSelected ? 'bg-slate-50' : ''
                  }`}
                >
                  <div className={`w-4 h-4 rounded border ${isSelected ? 'bg-white border-slate-900' : 'border-slate-300'} flex items-center justify-center`}>
                    {isSelected && <span className="text-white text-xs">✓</span>}
                  </div>
                  <Icon className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-700">{config.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// Entity Chip
function EntityChip({ entity }) {
  const Icon = ENTITY_ICON[entity.kind] || User;
  
  return (
    <Link 
      to={entity.kind === 'actor' ? `/actors/${entity.id}` : `/entities/${entity.id}`}
      className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-700 hover:bg-slate-200 transition-colors"
    >
      <Icon className="w-3 h-3" />
      <span className="font-medium">{entity.label}</span>
    </Link>
  );
}

// Confidence Badge Component
function ConfidenceBadge({ label, score }) {
  const config = CONFIDENCE_CONFIG[label] || CONFIDENCE_CONFIG.MEDIUM;
  const isHidden = label === 'HIDDEN';
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div 
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium cursor-help ${config.color}`}
          data-testid="confidence-badge"
        >
          <span>{config.icon}</span>
          <span>{score ?? 0}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <div className="text-xs">
          <p className="font-medium mb-1">Confidence: {label}</p>
          <p className="text-slate-500">{config.tooltip}</p>
          {isHidden && (
            <p className="mt-1 text-amber-600">⚠️ Не отправлено в Telegram из-за низкого confidence</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// Signal Card
function SignalCard({ signal, onArchive }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  const typeConfig = TYPE_CONFIG[signal.type] || { label: signal.type, icon: Activity };
  const TypeIcon = typeConfig.icon;
  const severityConfig = SEVERITY_CONFIG[signal.severity] || SEVERITY_CONFIG.medium;
  const statusConfig = STATUS_CONFIG[signal.status] || STATUS_CONFIG.active;
  const isHidden = signal.confidenceLabel === 'HIDDEN';
  
  const entities = signal.entities || [];
  const displayEntities = entities.slice(0, 4);
  const moreCount = entities.length - 4;
  
  const metrics = signal.metrics || {};
  
  // Navigate to detail page
  const handleViewDetails = () => {
    navigate(`/signals/${signal.id}`);
  };
  
  return (
    <div 
      className={`bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all overflow-hidden cursor-pointer ${isHidden ? 'opacity-60' : ''}`}
      data-testid={`signal-card-${signal.id}`}
      onClick={handleViewDetails}
    >
      {/* Severity Strip */}
      <div className={`h-1 ${severityConfig.color}`} />
      
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Type Badge */}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-white text-white rounded text-xs font-medium">
              <TypeIcon className="w-3 h-3" />
              <span>{typeConfig.label}</span>
            </div>
            
            {/* Status Badge */}
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
            
            {/* Confidence Badge */}
            <ConfidenceBadge 
              label={signal.confidenceLabel || 'MEDIUM'} 
              score={signal.confidenceScore}
            />
          </div>
          
          {/* Timestamp */}
          <span className="text-xs text-slate-400">{formatTimeAgo(signal.createdAt)}</span>
        </div>
        
        {/* Title & Description */}
        <h3 className="font-semibold text-slate-900 mb-1 line-clamp-1">{signal.title}</h3>
        <p className="text-sm text-slate-500 mb-3 line-clamp-2">{signal.subtitle || typeConfig.description}</p>
        
        {/* Entities */}
        {displayEntities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3" onClick={(e) => e.stopPropagation()}>
            {displayEntities.map((e, i) => (
              <EntityChip key={`${e.id}-${i}`} entity={e} />
            ))}
            {moreCount > 0 && (
              <span className="text-xs text-slate-400 self-center">+{moreCount} more</span>
            )}
          </div>
        )}
        
        {/* Metrics */}
        <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
          {metrics.density?.deltaPct !== null && metrics.density?.deltaPct !== undefined && (
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Δ Density {formatPercent(metrics.density.deltaPct)}
            </span>
          )}
          {metrics.netFlowRatio && (
            <span className="flex items-center gap-1">
              <ArrowRightLeft className="w-3 h-3" />
              Ratio {metrics.netFlowRatio.toFixed(2)}
            </span>
          )}
          {metrics.edgesCount && (
            <span className="flex items-center gap-1">
              <Waypoints className="w-3 h-3" />
              {metrics.edgesCount} edges
            </span>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(signal.links?.graph || `/actors/correlation?focus=${signal.id}`); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors"
            data-testid={`view-in-graph-${signal.id}`}
          >
            <ExternalLink className="w-3 h-3" />
            View in Graph
          </button>
          
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
                <div className="absolute right-0 bottom-full mb-1 w-36 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleViewDetails(); setMenuOpen(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Info className="w-4 h-4" />
                    Details
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onArchive(signal.id); setMenuOpen(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Archive className="w-4 h-4" />
                    Archive
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(window.location.origin + `/signals/${signal.id}`); setMenuOpen(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy link
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Signal Detail Modal
function SignalDetailModal({ signal, onClose }) {
  if (!signal) return null;
  
  const typeConfig = TYPE_CONFIG[signal.type] || { label: signal.type, icon: Activity };
  const TypeIcon = typeConfig.icon;
  const severityConfig = SEVERITY_CONFIG[signal.severity] || SEVERITY_CONFIG.medium;
  const statusConfig = STATUS_CONFIG[signal.status] || STATUS_CONFIG.active;
  
  const evidence = signal.evidence || {};
  const summary = signal.summary || {};
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80">
      <div 
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-8 rounded-full ${severityConfig.color}`} />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-white text-white rounded text-xs font-medium">
                  <TypeIcon className="w-3 h-3" />
                  <span>{typeConfig.label}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                {signal.window} window • {formatTimeAgo(signal.createdAt)}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">{signal.title}</h2>
            <p className="text-slate-500">{signal.subtitle}</p>
          </div>
          
          {/* Disclaimer */}
          <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500 flex items-start gap-2">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{signal.disclaimer || 'Structural alert based on observed on-chain activity. Not predictive. Not trading advice.'}</span>
          </div>
          
          {/* Rule Explanation */}
          {evidence.rule && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                Why this signal was triggered
              </h3>
              <div className="text-sm text-slate-700">
                <p><strong>Rule:</strong> {evidence.rule.name}</p>
                {summary.whyNow && <p className="mt-1">{summary.whyNow}</p>}
              </div>
            </div>
          )}
          
          {/* Evidence */}
          {(evidence.baseline || evidence.current) && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Evidence</h3>
              <div className="bg-slate-50 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-2 text-left text-slate-500 font-medium">Metric</th>
                      <th className="px-4 py-2 text-right text-slate-500 font-medium">Before</th>
                      <th className="px-4 py-2 text-right text-slate-500 font-medium">After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evidence.baseline?.density !== undefined && (
                      <tr className="border-b border-slate-100">
                        <td className="px-4 py-2 text-slate-700">Density</td>
                        <td className="px-4 py-2 text-right text-slate-500">{evidence.baseline.density}</td>
                        <td className="px-4 py-2 text-right text-slate-900 font-medium">{evidence.current?.density}</td>
                      </tr>
                    )}
                    {evidence.flows && (
                      <>
                        <tr className="border-b border-slate-100">
                          <td className="px-4 py-2 text-slate-700">Inflow</td>
                          <td className="px-4 py-2 text-right text-slate-500">—</td>
                          <td className="px-4 py-2 text-right text-slate-900 font-medium">${formatNumber(evidence.flows.inflowUsd)}</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="px-4 py-2 text-slate-700">Outflow</td>
                          <td className="px-4 py-2 text-right text-slate-500">—</td>
                          <td className="px-4 py-2 text-right text-slate-900 font-medium">${formatNumber(evidence.flows.outflowUsd)}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Entities */}
          {signal.entities?.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Involved Actors & Entities</h3>
              <div className="flex flex-wrap gap-2">
                {signal.entities.map((e, i) => (
                  <EntityChip key={`${e.id}-${i}`} entity={e} />
                ))}
              </div>
            </div>
          )}
          
          {/* So What */}
          {summary.soWhat && (
            <div className="text-sm text-slate-600 italic">
              {summary.soWhat}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 flex items-center justify-between">
          <button
            onClick={() => window.location.href = signal.links?.graph || `/actors/correlation?focus=${signal.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-white text-white rounded-lg text-sm font-medium hover:bg-slate-800"
          >
            <ExternalLink className="w-4 h-4" />
            Open in Graph
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Empty State
function EmptyState({ hasFilters, onClearFilters }) {
  if (hasFilters) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🔍</div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No signals match your filters</h3>
        <p className="text-slate-500 mb-4">Try adjusting your search or filter criteria</p>
        <button
          onClick={onClearFilters}
          className="px-4 py-2 bg-white text-white rounded-lg text-sm font-medium hover:bg-slate-800"
          data-testid="clear-filters-btn"
        >
          Clear all filters
        </button>
      </div>
    );
  }
  
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">📡</div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">No signals generated yet</h3>
      <p className="text-slate-500">Signals will appear once the engine detects structural changes.</p>
    </div>
  );
}

// Pagination
function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <span className="text-sm text-slate-600">
        Page {page} of {totalPages}
      </span>
      
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

// ==================== MAIN PAGE ====================

export default function SignalsPageD1() {
  // State
  const [signals, setSignals] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [window, setWindow] = useState('7d');
  const [statusFilter, setStatusFilter] = useState(['new', 'active']);
  const [severityFilter, setSeverityFilter] = useState([]);
  const [scopeFilter, setScopeFilter] = useState([]);
  const [typeFilter, setTypeFilter] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  
  // Total pages
  const [totalPages, setTotalPages] = useState(1);
  
  // Check if any filters are active
  const hasFilters = useMemo(() => {
    return searchQuery || 
           severityFilter.length > 0 || 
           scopeFilter.length > 0 || 
           typeFilter.length > 0 ||
           (statusFilter.length > 0 && statusFilter.length < 4);
  }, [searchQuery, severityFilter, scopeFilter, typeFilter, statusFilter]);
  
  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter(['new', 'active']);
    setSeverityFilter([]);
    setScopeFilter([]);
    setTypeFilter([]);
    setPage(1);
  }, []);
  
  // Fetch signals
  const fetchSignals = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        window,
        status: statusFilter.length > 0 ? statusFilter : undefined,
        severity: severityFilter.length > 0 ? severityFilter : undefined,
        scope: scopeFilter.length > 0 ? scopeFilter : undefined,
        type: typeFilter.length > 0 ? typeFilter : undefined,
        q: searchQuery || undefined,
        page,
        limit: 12
      };
      
      const [signalsRes, statsRes] = await Promise.all([
        d1SignalsApi.getSignals(params),
        d1SignalsApi.getStats(window)
      ]);
      
      if (signalsRes.ok) {
        setSignals(signalsRes.items || []);
        setTotalPages(Math.ceil((signalsRes.meta?.total || 0) / 12));
      } else {
        setSignals([]);
      }
      
      if (statsRes.ok) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error('Failed to fetch signals:', err);
      setError('Failed to load signals');
      setSignals([]);
    } finally {
      setLoading(false);
    }
  }, [window, statusFilter, severityFilter, scopeFilter, typeFilter, searchQuery, page]);
  
  // Fetch on mount and filter changes
  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);
  
  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [window, statusFilter, severityFilter, scopeFilter, typeFilter, searchQuery]);
  
  // Archive handler
  const handleArchive = async (id) => {
    try {
      await d1SignalsApi.archive(id);
      fetchSignals();
    } catch (err) {
      console.error('Failed to archive signal:', err);
    }
  };
  
  // Active count
  const activeCount = stats?.counts?.active || 0;
  const newCount = stats?.counts?.new || 0;
  
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50" data-testid="signals-page-d1">
        {/* Header */}
        <div className="bg-white border-b border-slate-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900">Signals</h1>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">
                        Signals highlight structural changes in on-chain behavior. They are not predictions or trading advice.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-sm text-slate-500">Structural alerts from on-chain behavior</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-64">
                  <SearchInput 
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search signals, actors..."
                  />
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <span className="px-2 py-1 bg-white text-white rounded font-semibold">{newCount + activeCount}</span>
                  <span className="text-slate-500">active</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Disclaimer */}
          <DisclaimerBanner />
        </div>
        
        {/* Filters */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Window */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Window</span>
                <WindowSelector value={window} onChange={setWindow} />
              </div>
              
              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Status</span>
                <StatusToggle selected={statusFilter} onChange={setStatusFilter} />
              </div>
              
              {/* Severity */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Severity</span>
                <SeverityPills selected={severityFilter} onChange={setSeverityFilter} />
              </div>
              
              {/* Type */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Type</span>
                <TypeDropdown selected={typeFilter} onChange={setTypeFilter} />
              </div>
              
              {/* Scope */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Scope</span>
                <ScopePills selected={scopeFilter} onChange={setScopeFilter} />
              </div>
            </div>
            
            {/* Clear Filters */}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear filters
              </button>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
                </div>
              ) : error ? (
                <div className="text-center py-16 text-red-500">{error}</div>
              ) : signals.length === 0 ? (
                <EmptyState hasFilters={hasFilters} onClearFilters={clearFilters} />
              ) : (
                <>
                  {/* Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {signals.map(signal => (
                      <SignalCard 
                        key={signal.id}
                        signal={signal}
                        onArchive={handleArchive}
                      />
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  <Pagination 
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </>
              )}
            </div>
            
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              {/* Telegram Connect */}
              <TelegramConnect />
              
              {/* Stats Summary */}
              {stats && (
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Signal Stats</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Active</span>
                      <span className="font-medium">{stats.counts?.active || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">New</span>
                      <span className="font-medium">{stats.counts?.new || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total</span>
                      <span className="font-medium">{stats.counts?.total || 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
