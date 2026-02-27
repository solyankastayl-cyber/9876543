/**
 * AlertsPage - Alert Rules Management (P0 Architecture)
 * 
 * AlertsPage = управление правилами, НЕ событиями
 * Events ≠ Alerts
 * Events — transient, Alerts — persistent rules
 */
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Bell, Plus, Pause, Play, Trash2, Settings, 
  Loader2, AlertCircle, ExternalLink, Clock,
  Activity, Wallet, Users, Building
} from 'lucide-react';
import CreateAlertModal from '../components/CreateAlertModal';
import EmptyState from '../components/EmptyState';
import { alertsApi } from '../api';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import ContextPath from '../components/ContextPath';

// Signal type with PRODUCT LANGUAGE
const SIGNAL_TYPES = {
  'accumulation': {
    emoji: '📥',
    label: 'Consistent Buying',
    insight: 'Large wallets are accumulating',
    description: 'Large wallets are accumulating this token'
  },
  'distribution': {
    emoji: '📤',
    label: 'Increasing Selling',
    insight: 'Holders are distributing',
    description: 'Holders are distributing to the market'
  },
  'large_move': {
    emoji: '💰',
    label: 'Large Movement',
    insight: 'Significant transfer detected',
    description: 'Significant token movement detected'
  },
  'smart_money_entry': {
    emoji: '🐋',
    label: 'Smart Money Entry',
    insight: 'Profitable wallets entering',
    description: 'Historically profitable wallets entering'
  },
  'smart_money_exit': {
    emoji: '🏃',
    label: 'Smart Money Exit',
    insight: 'Profitable wallets exiting',
    description: 'Historically profitable wallets exiting'
  },
  'activity_spike': {
    emoji: '⚡',
    label: 'Activity Spike',
    insight: 'Unusual activity surge',
    description: 'Sudden increase in activity'
  },
};

// Lifecycle states with UX LANGUAGE (not technical)
const LIFECYCLE_STATES = {
  active: { label: 'Monitoring', color: 'bg-emerald-100 text-emerald-700' },
  triggered: { label: 'Observed', color: 'bg-blue-100 text-blue-700' },
  repeating: { label: 'Ongoing', color: 'bg-purple-100 text-purple-700' },
  paused: { label: 'Paused', color: 'bg-gray-100 text-gray-500' },
  resolved: { label: 'Inactive', color: 'bg-gray-100 text-gray-400' },
};

// Legacy emoji map for compatibility
const SIGNAL_EMOJIS = Object.keys(SIGNAL_TYPES).reduce((acc, key) => {
  acc[key] = SIGNAL_TYPES[key].emoji;
  return acc;
}, {});

// Scope icons
const SCOPE_ICONS = {
  'token': Activity,
  'wallet': Wallet,
  'actor': Users,
  'entity': Building,
};

// Format time ago
function timeAgo(date) {
  if (!date) return 'Never';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// Calculate triggers in last 24h from recentTriggerTimestamps
function getTriggersIn24h(timestamps) {
  if (!timestamps || !Array.isArray(timestamps)) return 0;
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
  return timestamps.filter(ts => new Date(ts).getTime() > twentyFourHoursAgo).length;
}

// Calculate noiseScore from stats24h
function getNoiseScore(rule) {
  if (rule.stats24h?.noiseScore) return rule.stats24h.noiseScore;
  // Fallback calculation
  const triggers = rule.stats24h?.triggers24h || getTriggersIn24h(rule.recentTriggerTimestamps);
  const suppressed = rule.stats24h?.suppressedCount24h || 0;
  return triggers + (suppressed * 0.5);
}

// A5.2: Enhanced Feedback Hint Component
// Rules:
// - noiseScore >= 3 → suggest reduce sensitivity
// - noiseScore >= 6 + highestPriority !== high → suggest pause
function FeedbackHint({ rule, onPause, onReduceSensitivity }) {
  const [loading, setLoading] = useState(false);
  
  const noiseScore = getNoiseScore(rule);
  const triggersIn24h = rule.stats24h?.triggers24h || getTriggersIn24h(rule.recentTriggerTimestamps);
  const highestPriority = rule.stats24h?.highestPriority24h || 'low';
  const dominantReason = rule.stats24h?.dominantReason24h;
  const currentSensitivity = rule.sensitivity || 'medium';
  
  // A5.2 Decision logic
  const shouldReduceSensitivity = noiseScore >= 3 && highestPriority !== 'high';
  const shouldSuggestPause = noiseScore >= 6 && highestPriority !== 'high';
  
  if (!shouldReduceSensitivity) return null;
  
  const handlePause = async () => {
    setLoading(true);
    try {
      await onPause(rule._id);
    } finally {
      setLoading(false);
    }
  };
  
  const handleReduceSensitivity = async () => {
    setLoading(true);
    try {
      await onReduceSensitivity(rule._id);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg" data-testid="feedback-hint">
      <div className="flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-800">
            This alert was triggered {triggersIn24h} times in the last 24 hours.
          </p>
          <p className="text-xs text-amber-700 mt-1">
            {shouldSuggestPause 
              ? 'This monitoring is triggering very frequently with moderate priority. Consider pausing to reduce noise.'
              : 'This behavior may no longer be unusual. Consider reducing sensitivity to focus on more significant events.'}
          </p>
          
          {/* Show dominant reason if available */}
          {dominantReason && (
            <p className="text-xs text-amber-600 mt-1">
              Most common trigger: <span className="font-medium">{dominantReason.replace('_', ' ')}</span>
            </p>
          )}
          
          {/* Current sensitivity indicator */}
          <p className="text-xs text-amber-500 mt-1">
            Current sensitivity: <span className="font-medium capitalize">{currentSensitivity}</span>
          </p>
          
          <div className="flex gap-2 mt-3">
            {currentSensitivity !== 'low' && (
              <button
                onClick={handleReduceSensitivity}
                disabled={loading}
                className="px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Reduce sensitivity'}
              </button>
            )}
            {shouldSuggestPause && (
              <button
                onClick={handlePause}
                disabled={loading}
                className="px-3 py-1.5 bg-white border border-amber-300 text-amber-700 text-xs font-medium rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-50"
              >
                Pause monitoring
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Alert = Monitoring Card (A2 Contract)
// Каждая карточка отвечает: Что я отслеживаю, Почему это важно, Что происходило последний раз
function AlertRuleCard({ rule, onPause, onResume, onDelete, onEdit, onReduceSensitivity }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const ScopeIcon = SCOPE_ICONS[rule.scope] || Activity;
  const isActive = rule.status === 'active';
  
  // Get target display name
  const targetDisplay = rule.targetMeta?.symbol 
    || rule.watchlistItemId?.target?.symbol 
    || rule.watchlistItemId?.target?.name
    || rule.targetId?.slice(0, 10) + '...' + rule.targetId?.slice(-6);
  
  // Get chain
  const chain = rule.targetMeta?.chain || rule.watchlistItemId?.target?.chain || 'Ethereum';
  
  // Get trigger type
  const triggerType = rule.triggerTypes?.[0] || rule.trigger?.type || 'accumulation';
  const signalType = SIGNAL_TYPES[triggerType] || SIGNAL_TYPES.accumulation;
  
  // Get lifecycle state
  const lifecycleState = LIFECYCLE_STATES[rule.status] || LIFECYCLE_STATES.active;
  
  // Get sensitivity display
  const sensitivityDisplay = rule.trigger?.sensitivity 
    ? rule.trigger.sensitivity.charAt(0).toUpperCase() + rule.trigger.sensitivity.slice(1)
    : 'Medium';
  
  const handleToggleStatus = async () => {
    setLoading(true);
    try {
      if (isActive) {
        await onPause(rule._id);
      } else {
        await onResume(rule._id);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Stop monitoring this behavior?')) {
      setLoading(true);
      try {
        await onDelete(rule._id);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleNavigateToTarget = () => {
    navigate(`/${rule.scope}s/${rule.targetId}`);
  };

  return (
    <div 
      className={`bg-white border border-gray-200 rounded-xl p-4 transition-opacity ${!isActive ? 'opacity-60' : ''}`}
      data-testid={`monitoring-card-${rule._id}`}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className={`p-2.5 rounded-xl ${
            rule.scope === 'token' ? 'bg-purple-100' : 
            rule.scope === 'wallet' ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            <ScopeIcon className={`w-5 h-5 ${
              rule.scope === 'token' ? 'text-purple-600' : 
              rule.scope === 'wallet' ? 'text-blue-600' : 'text-gray-600'
            }`} />
          </div>
          
          {/* Target + Insight */}
          <div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleNavigateToTarget}
                className="text-base font-bold text-gray-900 hover:text-purple-600 transition-colors"
              >
                {targetDisplay}
              </button>
              <span className="text-xs text-gray-400">{chain}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-lg">{signalType.emoji}</span>
              <span className="text-sm text-gray-600">{signalType.label}</span>
            </div>
          </div>
        </div>
        
        {/* Status Badge */}
        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${lifecycleState.color}`}>
          {lifecycleState.label}
        </span>
      </div>
      
      {/* Feedback Hint - P3 Alert Feedback Loop */}
      {isActive && (
        <FeedbackHint 
          rule={rule} 
          onPause={onPause} 
          onReduceSensitivity={onReduceSensitivity} 
        />
      )}
      
      {/* Insight Summary */}
      <div className="mb-3 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-700">
          {signalType.insight}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Sensitivity: {sensitivityDisplay}
        </p>
      </div>
      
      {/* Last Observed + Channels */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          <span>
            {rule.lastTriggeredAt 
              ? `Last observed: ${timeAgo(rule.lastTriggeredAt)}`
              : 'No activity observed yet'}
          </span>
          {rule.triggerCount > 0 && (
            <span className="text-purple-600 font-medium">
              · {rule.triggerCount} total
            </span>
          )}
        </div>
        
        {/* Channels */}
        <div className="flex items-center gap-1.5">
          {rule.channels?.inApp && (
            <Tooltip>
              <TooltipTrigger>
                <Bell className="w-4 h-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent className="bg-white text-white">
                <p className="text-xs">In-App</p>
              </TooltipContent>
            </Tooltip>
          )}
          {rule.channels?.telegram && (
            <Tooltip>
              <TooltipTrigger>
                <svg className="w-4 h-4 text-[#229ED9]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
              </TooltipTrigger>
              <TooltipContent className="bg-white text-white">
                <p className="text-xs">Telegram</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
      
      {/* Actions Row - Delete скрыт, не на первом месте */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        {/* Secondary action - Delete (скрыт в меню) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="p-2 hover:bg-gray-100 text-gray-400 rounded-lg transition-colors text-xs"
              data-testid={`delete-alert-${rule._id}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="bg-white text-white">
            <p className="text-xs">Stop and remove</p>
          </TooltipContent>
        </Tooltip>
        
        {/* Primary actions */}
        <div className="flex items-center gap-1">
          {/* Edit */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onEdit(rule)}
                disabled={loading}
                className="p-2 hover:bg-gray-100 text-gray-500 rounded-lg transition-colors"
                data-testid={`edit-alert-${rule._id}`}
              >
                <Settings className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-white text-white">
              <p className="text-xs">Change sensitivity</p>
            </TooltipContent>
          </Tooltip>
          
          {/* Pause/Resume - Primary */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleToggleStatus}
                disabled={loading}
                className={`p-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'hover:bg-amber-50 text-amber-600' 
                    : 'hover:bg-emerald-50 text-emerald-600'
                }`}
                data-testid={`toggle-alert-${rule._id}`}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isActive ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-white text-white">
              <p className="text-xs">{isActive ? 'Pause monitoring' : 'Resume monitoring'}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, paused
  const [editingRule, setEditingRule] = useState(null);
  const navigate = useNavigate();

  // Load alert rules
  const loadRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await alertsApi.getAlertRules(filter === 'active');
      
      if (response?.ok) {
        let data = response.data || [];
        
        // Apply local filter for paused
        if (filter === 'paused') {
          data = data.filter(r => r.status === 'paused');
        }
        
        setRules(data);
      } else {
        setError(response?.error || 'Failed to load alert rules');
      }
    } catch (err) {
      console.error('Failed to load alert rules:', err);
      setError('Failed to load alert rules');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  // Pause rule
  const handlePause = async (ruleId) => {
    try {
      await alertsApi.updateAlertRule(ruleId, { status: 'paused' });
      loadRules();
    } catch (err) {
      console.error('Failed to pause rule:', err);
    }
  };

  // Resume rule
  const handleResume = async (ruleId) => {
    try {
      await alertsApi.updateAlertRule(ruleId, { status: 'active' });
      loadRules();
    } catch (err) {
      console.error('Failed to resume rule:', err);
    }
  };

  // Delete rule
  const handleDelete = async (ruleId) => {
    try {
      await alertsApi.deleteAlertRule(ruleId);
      loadRules();
    } catch (err) {
      console.error('Failed to delete rule:', err);
    }
  };

  // Reduce sensitivity (P3 - Alert Feedback Loop)
  const handleReduceSensitivity = async (ruleId) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/alerts/rules/${ruleId}/reduce-sensitivity`,
        { 
          method: 'POST', 
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': 'anonymous' 
          },
          body: JSON.stringify({})
        }
      );
      const data = await response.json();
      if (data.ok) {
        loadRules();
      }
    } catch (err) {
      console.error('Failed to reduce sensitivity:', err);
    }
  };

  // Edit rule
  const handleEdit = (rule) => {
    setEditingRule(rule);
  };

  const handleEditSuccess = () => {
    setEditingRule(null);
    loadRules();
  };

  // Stats
  const activeCount = rules.filter(r => r.status === 'active').length;
  const pausedCount = rules.filter(r => r.status === 'paused').length;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50" data-testid="alerts-page">
        
        <div className="max-w-[1200px] mx-auto px-4 py-6">
          {/* Context Path */}
          <ContextPath className="mb-4">
            <ContextPath.Item href="/market">Market</ContextPath.Item>
            <ContextPath.Item current>Alerts</ContextPath.Item>
          </ContextPath>
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
              <p className="text-sm text-gray-500 mt-1">
                Market behavior monitoring
              </p>
            </div>
            <Link
              to="/tokens"
              className="flex items-center gap-2 px-4 py-2 bg-white text-white rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
              data-testid="monitor-behavior-btn"
            >
              <Plus className="w-4 h-4" />
              Monitor Behavior
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 rounded-xl">
                  <Bell className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{rules.length}</div>
                  <div className="text-xs text-gray-500">Total Rules</div>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 rounded-xl">
                  <Play className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-600">{activeCount}</div>
                  <div className="text-xs text-gray-500">Active</div>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 rounded-xl">
                  <Pause className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-600">{pausedCount}</div>
                  <div className="text-xs text-gray-500">Paused</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 mb-4">
            {['all', 'active', 'paused'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  filter === f
                    ? 'bg-white text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          )}

          {/* Rules List */}
          {!loading && rules.length === 0 && (
            <EmptyState 
              title="No market behavior observed yet"
              description="Monitor accumulation, distribution, or large moves on specific tokens or wallets."
              action={{
                label: 'Monitor Behavior',
                icon: Plus,
                onClick: () => navigate('/tokens')
              }}
            />
          )}
          
          {!loading && rules.length > 0 && (
            <div className="space-y-3">
              {rules.map((rule) => (
                <AlertRuleCard
                  key={rule._id}
                  rule={rule}
                  onPause={handlePause}
                  onResume={handleResume}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onReduceSensitivity={handleReduceSensitivity}
                />
              ))}
            </div>
          )}
        </div>

        {/* Edit Alert Modal */}
        {editingRule && (
          <CreateAlertModal
            isOpen={!!editingRule}
            onClose={() => setEditingRule(null)}
            tokenAddress={editingRule.targetId}
            tokenSymbol={editingRule.watchlistItemId?.target?.symbol}
            tokenName={editingRule.watchlistItemId?.target?.name}
            chain={editingRule.watchlistItemId?.target?.chain || 'Ethereum'}
            editMode={true}
            existingRule={editingRule}
            onSuccess={handleEditSuccess}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
