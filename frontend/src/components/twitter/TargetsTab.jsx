/**
 * A.2.3 - Enhanced Targets Tab
 * 
 * Полный контроль над парсингом:
 * - Keywords tab (A.2.3.1)
 * - Accounts tab (A.2.3.2)
 * - Capacity Overview (A.2.3.3)
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, User, Plus, Trash2, Edit2, ToggleLeft, ToggleRight, 
  Zap, Clock, Play, ChevronDown, ChevronUp, Info, AlertTriangle,
  ArrowUpCircle, ArrowRightCircle, ArrowDownCircle, Filter,
  MessageSquare, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  getTargets, 
  createTarget, 
  updateTarget,
  deleteTarget, 
  toggleTarget, 
  getQuota, 
  scheduleCommit 
} from '@/api/twitterTargets.api';

// ============================================================
// Constants
// ============================================================

const BASE_ACCOUNT_CAPACITY = 280; // posts/hour for NORMAL profile

const PRIORITY_CONFIG = {
  HIGH: { multiplier: 1.3, label: 'High', color: 'text-red-600', bg: 'bg-red-100', icon: ArrowUpCircle },
  MEDIUM: { multiplier: 1.0, label: 'Medium', color: 'text-amber-600', bg: 'bg-amber-100', icon: ArrowRightCircle },
  LOW: { multiplier: 0.6, label: 'Low', color: 'text-green-600', bg: 'bg-green-100', icon: ArrowDownCircle },
};

const MODE_MULTIPLIER = {
  TWEETS: 1.0,
  REPLIES: 0.6,
  BOTH: 1.4,
};

const STATUS_CONFIG = {
  ACTIVE: { label: 'Active', color: 'text-green-700', bg: 'bg-green-100' },
  PAUSED: { label: 'Paused', color: 'text-gray-500', bg: 'bg-gray-100' },
  NO_SESSION: { label: 'No Session', color: 'text-amber-700', bg: 'bg-amber-100' },
};

// ============================================================
// Utility Functions
// ============================================================

function mapPriorityFromNumber(num) {
  if (num >= 4) return 'HIGH';
  if (num >= 2) return 'MEDIUM';
  return 'LOW';
}

function mapPriorityToNumber(priority) {
  if (priority === 'HIGH') return 5;
  if (priority === 'MEDIUM') return 3;
  return 1;
}

function estimateKeywordYield(priority, activeCount, filters = {}) {
  if (activeCount === 0) return 0;
  
  let base = BASE_ACCOUNT_CAPACITY / activeCount;
  let penalty = 1;
  
  if (filters.minLikes > 20) penalty *= 0.7;
  if (filters.minLikes > 50) penalty *= 0.4;
  if (filters.minReposts > 10) penalty *= 0.8;
  
  return Math.round(base * PRIORITY_CONFIG[priority].multiplier * penalty);
}

function estimateAccountYield(priority, mode = 'TWEETS') {
  const BASE_ACCOUNT_TARGET_YIELD = 140;
  return Math.round(
    BASE_ACCOUNT_TARGET_YIELD * 
    PRIORITY_CONFIG[priority].multiplier * 
    (MODE_MULTIPLIER[mode] || 1)
  );
}

function getTargetStatus(target, hasOkSession) {
  if (!target.enabled) return 'PAUSED';
  if (!hasOkSession) return 'NO_SESSION';
  return 'ACTIVE';
}

// ============================================================
// Components
// ============================================================

// Priority Badge
function PriorityBadge({ priority }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM;
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

// Status Badge
function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PAUSED;
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
      {config.label}
    </span>
  );
}

// Yield Display
function YieldDisplay({ yield: yieldValue }) {
  return (
    <div className="group relative">
      <span className="text-sm text-gray-700">~{yieldValue}/h</span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
        Estimated based on priority and filters
      </div>
    </div>
  );
}

// Filters Summary
function FiltersSummary({ filters }) {
  const parts = [];
  if (filters?.minLikes) parts.push(`likes ≥ ${filters.minLikes}`);
  if (filters?.minReposts) parts.push(`RT ≥ ${filters.minReposts}`);
  if (filters?.timeRange) parts.push(filters.timeRange);
  
  if (parts.length === 0) return <span className="text-gray-400 text-xs">No filters</span>;
  
  return (
    <span className="text-xs text-gray-600">{parts.join(', ')}</span>
  );
}

// Keyword Row
function KeywordRow({ target, activeCount, hasOkSession, onToggle, onEdit, onDelete }) {
  const priority = mapPriorityFromNumber(target.priority || 3);
  const status = getTargetStatus(target, hasOkSession);
  const estYield = estimateKeywordYield(priority, activeCount, target.filters || {});
  
  return (
    <div 
      className={`grid grid-cols-[auto,1fr,100px,80px,120px,100px,auto] gap-4 items-center p-3 rounded-lg border ${
        target.enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-70'
      }`}
      data-testid={`keyword-row-${target.query}`}
    >
      {/* Toggle */}
      <Switch
        checked={target.enabled}
        onCheckedChange={() => onToggle(target._id)}
        data-testid={`toggle-${target.query}`}
      />
      
      {/* Keyword */}
      <div className="flex items-center gap-2 min-w-0">
        <Search className="w-4 h-4 text-purple-500 flex-shrink-0" />
        <span className="font-medium text-gray-900 truncate">{target.query}</span>
      </div>
      
      {/* Priority */}
      <PriorityBadge priority={priority} />
      
      {/* Est. Yield */}
      <YieldDisplay yield={estYield} />
      
      {/* Filters */}
      <FiltersSummary filters={target.filters} />
      
      {/* Status */}
      <StatusBadge status={status} />
      
      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onEdit(target)}
          className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700"
          data-testid={`edit-${target.query}`}
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(target._id, target.query)}
          className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
          data-testid={`delete-${target.query}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Account Row
function AccountRow({ target, hasOkSession, onToggle, onEdit, onDelete }) {
  const priority = mapPriorityFromNumber(target.priority || 3);
  const status = getTargetStatus(target, hasOkSession);
  const mode = target.mode || 'TWEETS';
  const estYield = estimateAccountYield(priority, mode);
  
  return (
    <div 
      className={`grid grid-cols-[auto,1fr,100px,80px,100px,100px,auto] gap-4 items-center p-3 rounded-lg border ${
        target.enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-70'
      }`}
      data-testid={`account-row-${target.query}`}
    >
      {/* Toggle */}
      <Switch
        checked={target.enabled}
        onCheckedChange={() => onToggle(target._id)}
      />
      
      {/* Account */}
      <div className="flex items-center gap-2 min-w-0">
        <User className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <span className="font-medium text-gray-900 truncate">@{target.query}</span>
      </div>
      
      {/* Priority */}
      <PriorityBadge priority={priority} />
      
      {/* Est. Yield */}
      <YieldDisplay yield={estYield} />
      
      {/* Mode */}
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
        mode === 'BOTH' ? 'bg-indigo-100 text-indigo-700' :
        mode === 'REPLIES' ? 'bg-purple-100 text-purple-700' :
        'bg-blue-100 text-blue-700'
      }`}>
        {mode === 'BOTH' ? 'Tweets+Replies' : mode === 'REPLIES' ? 'Replies' : 'Tweets'}
      </span>
      
      {/* Status */}
      <StatusBadge status={status} />
      
      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onEdit(target)}
          className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(target._id, target.query)}
          className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Add/Edit Target Modal
function TargetModal({ mode, type, initialData, activeCount, onSave, onClose }) {
  const isEdit = mode === 'edit';
  const isKeyword = type === 'KEYWORD';
  
  const [query, setQuery] = useState(initialData?.query || '');
  const [priority, setPriority] = useState(
    initialData ? mapPriorityFromNumber(initialData.priority) : 'MEDIUM'
  );
  const [enabled, setEnabled] = useState(initialData?.enabled ?? true);
  const [minLikes, setMinLikes] = useState(initialData?.filters?.minLikes || '');
  const [minReposts, setMinReposts] = useState(initialData?.filters?.minReposts || '');
  const [timeRange, setTimeRange] = useState(initialData?.filters?.timeRange || '24h');
  const [accountMode, setAccountMode] = useState(initialData?.mode || 'TWEETS');
  const [loading, setLoading] = useState(false);
  
  // Live yield preview
  const previewYield = useMemo(() => {
    if (isKeyword) {
      const filters = {
        minLikes: parseInt(minLikes) || 0,
        minReposts: parseInt(minReposts) || 0,
      };
      return estimateKeywordYield(priority, activeCount || 1, filters);
    } else {
      return estimateAccountYield(priority, accountMode);
    }
  }, [isKeyword, priority, activeCount, minLikes, minReposts, accountMode]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast.error(isKeyword ? 'Keyword is required' : 'Username is required');
      return;
    }
    
    if (!isKeyword && !/^[a-zA-Z0-9_]{1,15}$/.test(query.trim())) {
      toast.error('Invalid Twitter username');
      return;
    }
    
    setLoading(true);
    try {
      const dto = {
        type,
        query: query.trim(),
        priority: mapPriorityToNumber(priority),
        enabled,
        ...(isKeyword && {
          filters: {
            minLikes: parseInt(minLikes) || undefined,
            minReposts: parseInt(minReposts) || undefined,
            timeRange,
          },
        }),
        ...(!isKeyword && {
          mode: accountMode,
        }),
      };
      
      if (isEdit && initialData?._id) {
        await onSave(initialData._id, dto);
      } else {
        await onSave(null, dto);
      }
      
      toast.success(isEdit ? 'Target updated' : 'Target created');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save target');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid={`${mode}-${type.toLowerCase()}-modal`}>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit' : 'Add'} {isKeyword ? 'Keyword' : 'Account'} Target
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Query */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isKeyword ? 'Keyword' : 'Twitter Username'}
              </label>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isKeyword ? 'bitcoin, ethereum, crypto' : 'elonmusk'}
                disabled={isEdit}
                data-testid="target-query-input"
              />
              {!isKeyword && (
                <p className="text-xs text-gray-500 mt-1">Without @ symbol</p>
              )}
            </div>
            
            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <div className="flex gap-2">
                {(['HIGH', 'MEDIUM', 'LOW']).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      priority === p
                        ? `${PRIORITY_CONFIG[p].bg} ${PRIORITY_CONFIG[p].color} border-current`
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    data-testid={`priority-${p.toLowerCase()}`}
                  >
                    {PRIORITY_CONFIG[p].label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Keyword Filters */}
            {isKeyword && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Filters</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">Min Likes</label>
                    <Input
                      type="number"
                      value={minLikes}
                      onChange={(e) => setMinLikes(e.target.value)}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Min Reposts</label>
                    <Input
                      type="number"
                      value={minReposts}
                      onChange={(e) => setMinReposts(e.target.value)}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Time Range</label>
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">Last 24 hours</SelectItem>
                      <SelectItem value="48h">Last 48 hours</SelectItem>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            {/* Account Mode */}
            {!isKeyword && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
                <div className="flex gap-2">
                  {[
                    { value: 'TWEETS', label: 'Tweets only' },
                    { value: 'REPLIES', label: 'Replies only' },
                    { value: 'BOTH', label: 'Both (recommended)' },
                  ].map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setAccountMode(m.value)}
                      className={`flex-1 py-2 px-2 rounded-lg border text-xs font-medium transition-colors ${
                        accountMode === m.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Enabled */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Enabled</span>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>
            
            {/* Live Preview */}
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-900">
                Estimated yield: ~{previewYield} posts/hour
              </div>
              <div className="text-xs text-blue-700 mt-1">
                Based on current filters and priority
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} data-testid="save-target-btn">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                isEdit ? 'Update' : 'Create'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Capacity Overview Component (A.2.3.3)
function CapacityOverview({ targets, quota, hasOkSession }) {
  const totalCapacity = quota?.postsPerHour || BASE_ACCOUNT_CAPACITY;
  
  const keywordTargets = targets.filter(t => t.type === 'KEYWORD' && t.enabled);
  const accountTargets = targets.filter(t => t.type === 'ACCOUNT' && t.enabled);
  
  const keywordsShare = 0.55;
  const accountsShare = 0.35;
  const reservedShare = 0.10;
  
  // Calculate execution order
  const executionOrder = useMemo(() => {
    const allEnabled = targets.filter(t => t.enabled);
    
    return allEnabled
      .map(t => ({
        id: t._id,
        label: t.type === 'KEYWORD' ? `#${t.query}` : `@${t.query}`,
        type: t.type,
        priority: mapPriorityFromNumber(t.priority || 3),
        estimatedYield: t.type === 'KEYWORD' 
          ? estimateKeywordYield(mapPriorityFromNumber(t.priority || 3), allEnabled.length, t.filters)
          : estimateAccountYield(mapPriorityFromNumber(t.priority || 3), t.mode || 'TWEETS'),
      }))
      .sort((a, b) => {
        // Priority first
        const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        // Then by type (KEYWORD > ACCOUNT)
        if (a.type !== b.type) {
          return a.type === 'KEYWORD' ? -1 : 1;
        }
        // Then by yield
        return b.estimatedYield - a.estimatedYield;
      })
      .slice(0, 6);
  }, [targets]);
  
  if (!hasOkSession && targets.length === 0) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-500" />
        <p className="text-amber-800 font-medium">No available parsing capacity</p>
        <p className="text-sm text-amber-600 mt-1">Connect a Twitter account or refresh session cookies</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 p-4 bg-gradient-to-br from-slate-50 to-gray-50 rounded-lg border border-gray-200">
      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
        <Zap className="w-4 h-4 text-amber-500" />
        Parsing Overview
      </h4>
      
      {/* A. Total Capacity */}
      <div className="p-3 bg-white rounded-lg border">
        <div className="text-sm text-gray-500 mb-1">Total parsing capacity</div>
        <div className="text-2xl font-bold text-gray-900">≈ {totalCapacity} posts / hour</div>
        <div className="text-sm text-gray-500">
          ≈ {totalCapacity * 24} posts / day • ≈ {Math.round(totalCapacity * 24 * 30 / 1000)}k posts / month
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Based on {keywordTargets.length + accountTargets.length} active targets
          {!hasOkSession && (
            <span className="text-amber-600 ml-1">• Capacity reduced due to session health</span>
          )}
        </div>
      </div>
      
      {/* B. Allocation Breakdown */}
      <div className="p-3 bg-white rounded-lg border">
        <div className="text-sm text-gray-500 mb-2">Allocation Breakdown</div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 w-20">Keywords</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500" style={{ width: `${keywordsShare * 100}%` }} />
            </div>
            <span className="text-xs text-gray-600 w-10">{Math.round(keywordsShare * 100)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 w-20">Accounts</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: `${accountsShare * 100}%` }} />
            </div>
            <span className="text-xs text-gray-600 w-10">{Math.round(accountsShare * 100)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 w-20">Reserved</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gray-400" style={{ width: `${reservedShare * 100}%` }} />
            </div>
            <span className="text-xs text-gray-600 w-10">{Math.round(reservedShare * 100)}%</span>
          </div>
        </div>
        <div className="text-[10px] text-gray-400 mt-2">
          Reserved capacity is used for retries, session warm-up and safety margins
        </div>
      </div>
      
      {/* C. Execution Order Preview */}
      {executionOrder.length > 0 && (
        <div className="p-3 bg-white rounded-lg border">
          <div className="text-sm text-gray-500 mb-2 flex items-center gap-1">
            Execution Order
            <div className="group relative">
              <Info className="w-3 h-3 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Order is determined by priority and estimated data yield
              </div>
            </div>
          </div>
          <div className="space-y-1">
            {executionOrder.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-2 text-xs">
                <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-medium">
                  {idx + 1}
                </span>
                <span className={item.type === 'KEYWORD' ? 'text-purple-700' : 'text-blue-700'}>
                  {item.label}
                </span>
                <PriorityBadge priority={item.priority} />
                <span className="text-gray-400 ml-auto">~{item.estimatedYield}/h</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function TargetsTab() {
  const [targets, setTargets] = useState([]);
  const [stats, setStats] = useState(null);
  const [quota, setQuota] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('keywords'); // 'keywords' | 'accounts'
  const [showModal, setShowModal] = useState(null); // { mode: 'add'|'edit', type: 'KEYWORD'|'ACCOUNT', data?: target }
  
  // Assume session is OK if we have quota (simplified check)
  const hasOkSession = quota && quota.remainingHour > 0;
  
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [targetsData, quotaData] = await Promise.all([
        getTargets(),
        getQuota(),
      ]);
      setTargets(targetsData.targets || []);
      setStats(targetsData.stats);
      setQuota(quotaData);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggle = async (id) => {
    try {
      const updated = await toggleTarget(id);
      setTargets(targets.map(t => t._id === id ? updated : t));
      toast.success(updated.enabled ? 'Target enabled' : 'Target disabled');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id, query) => {
    if (!window.confirm(`Delete target "${query}"? This won't affect historical data.`)) return;
    try {
      await deleteTarget(id);
      setTargets(targets.filter(t => t._id !== id));
      toast.success('Target deleted');
    } catch (err) {
      toast.error(err.message);
    }
  };
  
  const handleSave = async (id, dto) => {
    if (id) {
      // Update
      const updated = await updateTarget(id, dto);
      setTargets(targets.map(t => t._id === id ? updated : t));
    } else {
      // Create
      const created = await createTarget(dto);
      setTargets([created, ...targets]);
    }
  };

  const handleRunNow = async () => {
    try {
      const result = await scheduleCommit();
      toast.success(`${result.committed} tasks scheduled (${result.totalPosts} posts)`);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };
  
  // Filter targets by type
  const keywordTargets = targets.filter(t => t.type === 'KEYWORD');
  const accountTargets = targets.filter(t => t.type === 'ACCOUNT');
  const activeKeywordsCount = keywordTargets.filter(t => t.enabled).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="py-6 px-4" data-testid="targets-tab">
      {/* Quota Summary */}
      {quota && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900">Parsing Capacity</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {quota.remainingHour} / {quota.postsPerHour} posts/hour
              </p>
              <p className="text-sm text-gray-500">
                {quota.plannedThisHour > 0 && `${quota.plannedThisHour} planned • `}
                Resets in {quota.windowResetsIn}m
              </p>
            </div>
            <Button onClick={handleRunNow} className="gap-2" data-testid="run-now-btn">
              <Play className="w-4 h-4" />
              Run Now
            </Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('keywords')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'keywords'
                ? 'bg-purple-100 text-purple-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            data-testid="keywords-subtab"
          >
            <Search className="w-4 h-4 inline mr-2" />
            Keywords ({keywordTargets.length})
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'accounts'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            data-testid="accounts-subtab"
          >
            <User className="w-4 h-4 inline mr-2" />
            Accounts ({accountTargets.length})
          </button>
        </div>
        
        <Button
          onClick={() => setShowModal({ 
            mode: 'add', 
            type: activeTab === 'keywords' ? 'KEYWORD' : 'ACCOUNT' 
          })}
          variant="outline"
          className="gap-2"
          data-testid="add-target-btn"
        >
          <Plus className="w-4 h-4" />
          Add {activeTab === 'keywords' ? 'Keyword' : 'Account'}
        </Button>
      </div>

      {/* Keywords Tab Content */}
      {activeTab === 'keywords' && (
        <div className="space-y-2 mb-6">
          {keywordTargets.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-lg">
              <Search className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-gray-500">No keywords added yet</p>
              <Button
                onClick={() => setShowModal({ mode: 'add', type: 'KEYWORD' })}
                variant="link"
                className="mt-2"
              >
                Add first keyword
              </Button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="grid grid-cols-[auto,1fr,100px,80px,120px,100px,auto] gap-4 px-3 text-xs text-gray-500 font-medium">
                <span className="w-9"></span>
                <span>Keyword</span>
                <span>Priority</span>
                <span>Est. Yield</span>
                <span>Filters</span>
                <span>Status</span>
                <span className="w-16"></span>
              </div>
              {keywordTargets.map((target) => (
                <KeywordRow
                  key={target._id}
                  target={target}
                  activeCount={activeKeywordsCount}
                  hasOkSession={hasOkSession}
                  onToggle={handleToggle}
                  onEdit={(t) => setShowModal({ mode: 'edit', type: 'KEYWORD', data: t })}
                  onDelete={handleDelete}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* Accounts Tab Content */}
      {activeTab === 'accounts' && (
        <div className="space-y-2 mb-6">
          {accountTargets.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-lg">
              <User className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-gray-500">No Twitter accounts monitored yet</p>
              <p className="text-xs text-gray-400 mt-1">Monitor specific Twitter accounts for posts and replies</p>
              <Button
                onClick={() => setShowModal({ mode: 'add', type: 'ACCOUNT' })}
                variant="link"
                className="mt-2"
              >
                Add account
              </Button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="grid grid-cols-[auto,1fr,100px,80px,100px,100px,auto] gap-4 px-3 text-xs text-gray-500 font-medium">
                <span className="w-9"></span>
                <span>Account</span>
                <span>Priority</span>
                <span>Est. Yield</span>
                <span>Mode</span>
                <span>Status</span>
                <span className="w-16"></span>
              </div>
              {accountTargets.map((target) => (
                <AccountRow
                  key={target._id}
                  target={target}
                  hasOkSession={hasOkSession}
                  onToggle={handleToggle}
                  onEdit={(t) => setShowModal({ mode: 'edit', type: 'ACCOUNT', data: t })}
                  onDelete={handleDelete}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* Capacity Overview */}
      <CapacityOverview 
        targets={targets} 
        quota={quota} 
        hasOkSession={hasOkSession}
      />

      {/* Modal */}
      {showModal && (
        <TargetModal
          mode={showModal.mode}
          type={showModal.type}
          initialData={showModal.data}
          activeCount={activeKeywordsCount || 1}
          onSave={handleSave}
          onClose={() => setShowModal(null)}
        />
      )}
    </div>
  );
}

export default TargetsTab;
