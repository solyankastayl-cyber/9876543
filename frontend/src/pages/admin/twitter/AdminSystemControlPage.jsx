/**
 * Phase 7.2 - Admin Twitter System Control Panel (UX Polish)
 * 
 * Features:
 * - Auto-refresh health (30s) + tasks (when RUNNING/PENDING)
 * - Status highlighting with visual priorities
 * - Improved Inspect modal with collapsible sections
 * - Quick actions with toast feedback
 * - Health context (trends, last events)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TwitterAdminLayout } from '../../../components/admin/TwitterAdminLayout';
import { toast } from 'sonner';
import { 
  RefreshCw, 
  Activity, 
  Server, 
  Database, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  RotateCcw,
  Zap,
  Copy,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Circle
} from 'lucide-react';
import systemApi from '../../../api/twitterSystemAdmin.api';

// ==================== CONSTANTS ====================

const HEALTH_REFRESH_INTERVAL = 30000; // 30 seconds
const TASKS_REFRESH_INTERVAL = 10000;  // 10 seconds when active

const STATUS_COLORS = {
  OK: 'bg-green-100 text-green-800 border-green-200',
  STALE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  EXPIRED: 'bg-orange-100 text-orange-800 border-orange-200',
  INVALID: 'bg-red-100 text-red-800 border-red-200',
  PENDING: 'bg-blue-100 text-blue-800 border-blue-200',
  RUNNING: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  DONE: 'bg-gray-100 text-gray-600 border-gray-200',
  FAILED: 'bg-red-100 text-red-800 border-red-200',
  COOLDOWN: 'bg-orange-100 text-orange-800 border-orange-200',
  UP: 'bg-green-100 text-green-800',
  DOWN: 'bg-red-100 text-red-800',
  ONLINE: 'bg-green-100 text-green-800',
  IDLE: 'bg-gray-100 text-gray-800',
  HEALTHY: 'bg-green-100 text-green-800',
  DEGRADED: 'bg-yellow-100 text-yellow-800',
  UNSTABLE: 'bg-red-100 text-red-800',
};

// ==================== UTILITIES ====================

function formatCountdown(dateStr) {
  if (!dateStr) return null;
  const until = new Date(dateStr);
  const now = new Date();
  const diff = until - now;
  if (diff <= 0) return null;
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return 'never';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getTrend(current, previous) {
  if (previous === undefined || previous === null) return 'stable';
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'stable';
}

// ==================== COMPONENTS ====================

function StatusBadge({ status, pulse = false }) {
  const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border ${colorClass}`}>
      {pulse && <span className="w-2 h-2 bg-current rounded-full animate-pulse" />}
      {status}
    </span>
  );
}

function LiveIndicator({ lastUpdate, isLive }) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
      <span>{isLive ? 'LIVE' : 'PAUSED'}</span>
      {lastUpdate && <span className="text-gray-400">• {formatTimeAgo(lastUpdate)}</span>}
    </div>
  );
}

function TrendIndicator({ trend, size = 'sm' }) {
  const sizeClass = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  if (trend === 'up') return <TrendingUp className={`${sizeClass} text-red-500`} />;
  if (trend === 'down') return <TrendingDown className={`${sizeClass} text-green-500`} />;
  return <Minus className={`${sizeClass} text-gray-400`} />;
}

function CooldownTimer({ until }) {
  const [countdown, setCountdown] = useState(formatCountdown(until));
  
  useEffect(() => {
    if (!until) return;
    const interval = setInterval(() => {
      setCountdown(formatCountdown(until));
    }, 1000);
    return () => clearInterval(interval);
  }, [until]);
  
  if (!countdown) return null;
  return (
    <span className="text-xs font-mono text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
      ⏱ {countdown}
    </span>
  );
}

function Tooltip({ children, content }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && content && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs bg-gray-900 text-white rounded shadow-lg max-w-xs whitespace-pre-wrap">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

// Health Card with context
function HealthCard({ title, value, status, icon: Icon, subtitle, trend, lastEvent }) {
  const statusColor = status === 'UP' || status === 'ONLINE' || status === 'HEALTHY' 
    ? 'text-green-500' 
    : status === 'DEGRADED' || status === 'STALE'
      ? 'text-yellow-500'
      : status === 'DOWN' || status === 'UNSTABLE'
        ? 'text-red-500'
        : 'text-gray-500';

  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</h3>
        <div className="flex items-center gap-1">
          {trend && <TrendIndicator trend={trend} />}
          <Icon className={`w-4 h-4 ${statusColor}`} />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-xl font-bold ${statusColor}`}>{value}</span>
        {status && <StatusBadge status={status} />}
      </div>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      {lastEvent && (
        <p className="text-xs text-gray-400 mt-1">Last: {formatTimeAgo(lastEvent)}</p>
      )}
    </div>
  );
}

// Collapsible Section for Inspect Modal
function CollapsibleSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="text-sm font-medium text-gray-700">{title}</span>
        {open ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
      </button>
      {open && <div className="p-4 bg-white">{children}</div>}
    </div>
  );
}

// Improved Inspect Modal
function InspectModal({ item, type, onClose }) {
  if (!item) return null;
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const isTask = type === 'task';
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isTask ? 'Task Details' : 'Session Details'}
            </h3>
            <p className="text-xs text-gray-500 font-mono">{item.taskId || item.accountId}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 overflow-auto max-h-[60vh] space-y-3">
          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
            <div>
              <span className="text-xs text-gray-500">Status</span>
              <div className="mt-1"><StatusBadge status={item.status} /></div>
            </div>
            {isTask && (
              <>
                <div>
                  <span className="text-xs text-gray-500">Type</span>
                  <p className="text-sm font-medium">{item.type}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Scope</span>
                  <p className="text-sm font-medium">{item.scope}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Duration</span>
                  <p className="text-sm font-medium">{item.durationMs ? `${(item.durationMs / 1000).toFixed(1)}s` : '-'}</p>
                </div>
              </>
            )}
            {!isTask && (
              <>
                <div>
                  <span className="text-xs text-gray-500">Twitter</span>
                  <p className="text-sm font-medium">{item.twitter || '-'}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Risk Score</span>
                  <p className="text-sm font-medium">{item.riskScore}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Tasks 24h</span>
                  <p className="text-sm font-medium">{item.tasks24h}</p>
                </div>
              </>
            )}
          </div>

          {/* Error Section */}
          {item.lastError && (
            <CollapsibleSection title="Last Error" defaultOpen={true}>
              <div className="p-3 bg-red-50 rounded border border-red-200">
                <p className="text-sm text-red-700 font-mono">{item.lastError}</p>
              </div>
            </CollapsibleSection>
          )}

          {/* Payload */}
          {item.payload && (
            <CollapsibleSection title="Payload">
              <pre className="text-xs font-mono bg-gray-50 p-3 rounded overflow-x-auto">
                {JSON.stringify(item.payload, null, 2)}
              </pre>
            </CollapsibleSection>
          )}

          {/* Runtime Meta */}
          <CollapsibleSection title="Runtime Meta">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-gray-500">Created:</span> {item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</div>
              <div><span className="text-gray-500">Started:</span> {item.startedAt ? new Date(item.startedAt).toLocaleString() : '-'}</div>
              <div><span className="text-gray-500">Completed:</span> {item.completedAt ? new Date(item.completedAt).toLocaleString() : '-'}</div>
              <div><span className="text-gray-500">Retries:</span> {item.retryCount ?? 0}</div>
            </div>
          </CollapsibleSection>

          {/* Raw JSON */}
          <CollapsibleSection title="Raw JSON">
            <div className="relative">
              <button
                onClick={() => copyToClipboard(JSON.stringify(item, null, 2))}
                className="absolute top-2 right-2 p-1.5 bg-white rounded border border-gray-200 hover:bg-gray-50"
              >
                <Copy className="w-4 h-4 text-gray-500" />
              </button>
              <pre className="text-xs font-mono bg-gray-50 p-3 rounded overflow-x-auto max-h-48">
                {JSON.stringify(item, null, 2)}
              </pre>
            </div>
          </CollapsibleSection>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

export default function AdminSystemControlPage() {
  // State
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('health');
  
  // Data
  const [health, setHealth] = useState(null);
  const [worker, setWorker] = useState(null);
  const [quality, setQuality] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [tasks, setTasks] = useState([]);
  
  // History for trends
  const [prevAbortRate, setPrevAbortRate] = useState(null);
  const [prevQualityRate, setPrevQualityRate] = useState(null);
  
  // Auto-refresh state
  const [lastHealthUpdate, setLastHealthUpdate] = useState(null);
  const [isLive, setIsLive] = useState(true);
  const [userInteracting, setUserInteracting] = useState(false);
  
  // Filters
  const [sessionFilter, setSessionFilter] = useState('');
  const [taskFilter, setTaskFilter] = useState({ status: '', scope: '' });
  
  // Modal
  const [inspectItem, setInspectItem] = useState(null);
  const [inspectType, setInspectType] = useState('task');
  
  // Action loading states
  const [actionLoading, setActionLoading] = useState({});
  
  // Refs for auto-refresh
  const healthIntervalRef = useRef(null);
  const tasksIntervalRef = useRef(null);

  // Check if tasks need active polling
  const hasActiveTasks = tasks.some(t => ['RUNNING', 'PENDING', 'COOLDOWN'].includes(t.status));

  // ==================== DATA FETCHING ====================
  
  const fetchHealth = useCallback(async () => {
    try {
      const [healthRes, workerRes, qualityRes] = await Promise.all([
        systemApi.getSystemHealth(),
        systemApi.getWorkerStatus(),
        systemApi.getQualityMetrics(),
      ]);
      
      if (healthRes.ok) {
        setPrevAbortRate(health?.abortRate1h);
        setHealth(healthRes.data);
      }
      if (workerRes.ok) setWorker(workerRes.data);
      if (qualityRes.ok) {
        setPrevQualityRate(quality?.summary?.healthRate);
        setQuality(qualityRes.data);
      }
      setLastHealthUpdate(new Date().toISOString());
    } catch (err) {
      console.error('[AdminSystemControl] fetchHealth error:', err);
    }
  }, [health?.abortRate1h, quality?.summary?.healthRate]);

  const fetchSessions = useCallback(async (status = sessionFilter) => {
    try {
      const params = { limit: 50 };
      if (status) params.status = status;
      const res = await systemApi.getSessions(params);
      if (res.ok) setSessions(res.data);
    } catch (err) {
      console.error('[AdminSystemControl] fetchSessions error:', err);
    }
  }, [sessionFilter]);

  const fetchTasks = useCallback(async (filters = taskFilter) => {
    try {
      const params = { limit: 50 };
      if (filters.status) params.status = filters.status;
      if (filters.scope) params.scope = filters.scope;
      const res = await systemApi.getTasks(params);
      if (res.ok) setTasks(res.data.tasks || []);
    } catch (err) {
      console.error('[AdminSystemControl] fetchTasks error:', err);
    }
  }, [taskFilter]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchHealth(), fetchSessions(), fetchTasks()]);
    setLoading(false);
  }, [fetchHealth, fetchSessions, fetchTasks]);

  // Initial load
  useEffect(() => {
    fetchAll();
  }, []);

  // ==================== AUTO-REFRESH ====================
  
  // Health auto-refresh (always on when live)
  useEffect(() => {
    if (!isLive || userInteracting || inspectItem) {
      if (healthIntervalRef.current) {
        clearInterval(healthIntervalRef.current);
        healthIntervalRef.current = null;
      }
      return;
    }
    
    healthIntervalRef.current = setInterval(fetchHealth, HEALTH_REFRESH_INTERVAL);
    return () => {
      if (healthIntervalRef.current) clearInterval(healthIntervalRef.current);
    };
  }, [isLive, userInteracting, inspectItem, fetchHealth]);

  // Tasks auto-refresh (only when active tasks exist)
  useEffect(() => {
    if (!isLive || userInteracting || inspectItem || !hasActiveTasks) {
      if (tasksIntervalRef.current) {
        clearInterval(tasksIntervalRef.current);
        tasksIntervalRef.current = null;
      }
      return;
    }
    
    tasksIntervalRef.current = setInterval(fetchTasks, TASKS_REFRESH_INTERVAL);
    return () => {
      if (tasksIntervalRef.current) clearInterval(tasksIntervalRef.current);
    };
  }, [isLive, userInteracting, inspectItem, hasActiveTasks, fetchTasks]);

  // Pause on user interaction
  const handleUserInteraction = useCallback(() => {
    setUserInteracting(true);
    setTimeout(() => setUserInteracting(false), 5000);
  }, []);

  // ==================== ACTIONS ====================
  
  const handleForceResync = async (session) => {
    if (session.status === 'INVALID') {
      toast.error('Cannot resync INVALID session');
      return;
    }
    
    const confirmed = window.confirm(`Force resync for ${session.twitter || session.accountId}?`);
    if (!confirmed) return;
    
    setActionLoading(prev => ({ ...prev, [session.accountId]: true }));
    try {
      const res = await systemApi.forceResyncSession(session.accountId);
      if (res.ok) {
        toast.success(`Resync triggered for ${session.twitter || 'session'}`);
        await fetchSessions();
      } else {
        toast.error('Resync failed');
      }
    } catch (err) {
      toast.error('Resync failed: ' + (err.message || 'Unknown error'));
    } finally {
      setActionLoading(prev => ({ ...prev, [session.accountId]: false }));
    }
  };

  const handleRetryTask = async (task) => {
    if (task.status !== 'FAILED') {
      toast.error('Only FAILED tasks can be retried');
      return;
    }
    
    setActionLoading(prev => ({ ...prev, [task.taskId]: true }));
    try {
      const res = await systemApi.retryTask(task.taskId);
      if (res.ok) {
        toast.success('Task queued for retry');
        await fetchTasks();
      } else {
        toast.error('Retry failed');
      }
    } catch (err) {
      toast.error('Retry failed');
    } finally {
      setActionLoading(prev => ({ ...prev, [task.taskId]: false }));
    }
  };

  const openInspect = (item, type) => {
    setInspectItem(item);
    setInspectType(type);
  };

  // ==================== RENDER ====================
  
  if (loading) {
    return (
      <TwitterAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading system data...</p>
          </div>
        </div>
      </TwitterAdminLayout>
    );
  }

  const abortTrend = getTrend(health?.abortRate1h, prevAbortRate);
  const qualityTrend = getTrend(quality?.summary?.healthRate, prevQualityRate);

  return (
    <TwitterAdminLayout>
      <div className="p-6 space-y-6" onScroll={handleUserInteraction}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Control Panel</h1>
            <p className="text-gray-500 text-sm mt-1">Phase 7.2 — Admin System Console</p>
          </div>
          <div className="flex items-center gap-4">
            <LiveIndicator lastUpdate={lastHealthUpdate} isLive={isLive && !userInteracting && !inspectItem} />
            <button
              onClick={() => setIsLive(!isLive)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                isLive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}
              data-testid="toggle-live-btn"
            >
              {isLive ? 'Auto ON' : 'Auto OFF'}
            </button>
            <button
              onClick={fetchAll}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              data-testid="refresh-all-btn"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Health Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4" data-testid="health-cards">
          <HealthCard
            title="Parser"
            value={health?.parser || 'UNKNOWN'}
            status={health?.parser}
            icon={Zap}
          />
          <HealthCard
            title="Worker"
            value={worker?.worker?.status || 'UNKNOWN'}
            status={worker?.worker?.status}
            icon={Server}
            subtitle={`${worker?.worker?.currentTasks || 0}/${worker?.worker?.maxConcurrent || 0} tasks`}
          />
          <HealthCard
            title="Queue"
            value={health?.queueSize ?? 0}
            icon={Database}
            subtitle={`P:${worker?.queue?.pending || 0} R:${worker?.queue?.running || 0} F:${worker?.queue?.failed || 0}`}
          />
          <HealthCard
            title="Abort Rate"
            value={`${health?.abortRate1h || 0}%`}
            status={health?.abortRate1h > 30 ? 'DEGRADED' : health?.abortRate1h > 10 ? 'STALE' : 'HEALTHY'}
            icon={AlertTriangle}
            trend={abortTrend}
          />
          <HealthCard
            title="Quality"
            value={`${quality?.summary?.healthRate || 100}%`}
            status={quality?.summary?.healthRate >= 80 ? 'HEALTHY' : quality?.summary?.healthRate >= 50 ? 'DEGRADED' : 'UNSTABLE'}
            icon={Activity}
            trend={qualityTrend === 'up' ? 'down' : qualityTrend === 'down' ? 'up' : 'stable'}
            subtitle={`${quality?.summary?.degraded || 0} degraded`}
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'health', label: 'Health', icon: Activity },
                { id: 'sessions', label: 'Sessions', icon: CheckCircle, count: sessions.length },
                { id: 'tasks', label: 'Tasks', icon: Clock, count: tasks.length, hasActive: hasActiveTasks },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  data-testid={`tab-${tab.id}`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                  {tab.hasActive && (
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Health Tab */}
            {activeTab === 'health' && (
              <div className="space-y-6" data-testid="health-tab-content">
                <h3 className="text-lg font-semibold text-gray-900">System Health Overview</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Worker Details */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-3">Worker & Queue</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status:</span>
                        <span className="font-medium">{worker?.worker?.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Current:</span>
                        <span className="font-medium">{worker?.worker?.currentTasks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Pending:</span>
                        <span className="font-medium text-blue-600">{worker?.queue?.pending}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Running:</span>
                        <span className="font-medium text-indigo-600">{worker?.queue?.running}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Done:</span>
                        <span className="font-medium text-green-600">{worker?.queue?.done}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Failed:</span>
                        <span className="font-medium text-red-600">{worker?.queue?.failed}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quality Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-3">Quality Metrics</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Targets:</span>
                        <span className="font-medium">{quality?.summary?.total || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Healthy:</span>
                        <span className="font-medium text-green-600">{quality?.summary?.healthy || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Degraded:</span>
                        <span className="font-medium text-yellow-600">{quality?.summary?.degraded || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Unstable:</span>
                        <span className="font-medium text-red-600">{quality?.summary?.unstable || 0}</span>
                      </div>
                      <div className="flex justify-between col-span-2">
                        <span className="text-gray-500">Avg Score:</span>
                        <span className="font-medium">{quality?.summary?.avgScore || 100}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sessions Tab */}
            {activeTab === 'sessions' && (
              <div className="space-y-4" data-testid="sessions-tab-content" onMouseMove={handleUserInteraction}>
                <div className="flex items-center gap-4">
                  <select
                    value={sessionFilter}
                    onChange={(e) => {
                      setSessionFilter(e.target.value);
                      fetchSessions(e.target.value);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    data-testid="session-status-filter"
                  >
                    <option value="">All Statuses</option>
                    <option value="OK">OK</option>
                    <option value="STALE">STALE</option>
                    <option value="EXPIRED">EXPIRED</option>
                    <option value="INVALID">INVALID</option>
                  </select>
                  <span className="text-sm text-gray-500">{sessions.length} sessions</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cooldown</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Sync</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tasks 24h</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sessions.map((session, idx) => (
                        <tr key={session.accountId || idx} className={`hover:bg-gray-50 ${
                          session.status === 'INVALID' || session.status === 'EXPIRED' ? 'bg-red-50' :
                          session.status === 'STALE' ? 'bg-yellow-50' : ''
                        }`}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{session.twitter || '-'}</div>
                            <div className="text-xs text-gray-500 font-mono">{session.userId?.slice(0, 12)}...</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <StatusBadge status={session.status} />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`text-sm font-bold ${
                              session.riskScore > 70 ? 'text-red-600' :
                              session.riskScore > 40 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {session.riskScore || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {session.cooldownUntil ? (
                              <CooldownTimer until={session.cooldownUntil} />
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {session.lastSyncAt ? formatTimeAgo(session.lastSyncAt) : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {session.tasks24h || 0}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openInspect(session, 'session')}
                                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                                data-testid={`inspect-session-${idx}`}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleForceResync(session)}
                                disabled={actionLoading[session.accountId] || session.status === 'INVALID'}
                                className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                                  session.status === 'INVALID' 
                                    ? 'text-gray-400 cursor-not-allowed' 
                                    : 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50'
                                }`}
                                data-testid={`resync-btn-${idx}`}
                              >
                                <RotateCcw className={`w-3 h-3 ${actionLoading[session.accountId] ? 'animate-spin' : ''}`} />
                                Resync
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {sessions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">No sessions found</div>
                  )}
                </div>
              </div>
            )}

            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
              <div className="space-y-4" data-testid="tasks-tab-content" onMouseMove={handleUserInteraction}>
                <div className="flex items-center gap-4">
                  <select
                    value={taskFilter.status}
                    onChange={(e) => {
                      const newFilter = { ...taskFilter, status: e.target.value };
                      setTaskFilter(newFilter);
                      fetchTasks(newFilter);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    data-testid="task-status-filter"
                  >
                    <option value="">All Statuses</option>
                    <option value="PENDING">PENDING</option>
                    <option value="RUNNING">RUNNING</option>
                    <option value="DONE">DONE</option>
                    <option value="FAILED">FAILED</option>
                  </select>
                  <select
                    value={taskFilter.scope}
                    onChange={(e) => {
                      const newFilter = { ...taskFilter, scope: e.target.value };
                      setTaskFilter(newFilter);
                      fetchTasks(newFilter);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    data-testid="task-scope-filter"
                  >
                    <option value="">All Scopes</option>
                    <option value="SYSTEM">SYSTEM</option>
                    <option value="USER">USER</option>
                  </select>
                  <span className="text-sm text-gray-500">{tasks.length} tasks</span>
                  {hasActiveTasks && (
                    <span className="flex items-center gap-1 text-xs text-indigo-600">
                      <Circle className="w-2 h-2 fill-current animate-pulse" />
                      Active tasks — auto-refreshing
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scope</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fetched</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Error</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tasks.map((task, idx) => (
                        <tr key={task.taskId || idx} className={`hover:bg-gray-50 ${
                          task.status === 'FAILED' ? 'bg-red-50' :
                          task.status === 'RUNNING' ? 'bg-indigo-50' : ''
                        }`}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-xs font-mono text-gray-600">{task.taskId?.slice(-8)}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {task.type}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 text-xs rounded ${
                              task.scope === 'SYSTEM' ? 'bg-purple-100 text-purple-700' : 'bg-cyan-100 text-cyan-700'
                            }`}>
                              {task.scope}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <StatusBadge status={task.status} pulse={task.status === 'RUNNING'} />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {task.fetched ?? '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {task.durationMs ? `${(task.durationMs / 1000).toFixed(1)}s` : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {task.lastError ? (
                              <Tooltip content={task.lastError}>
                                <span className="text-xs text-red-600 cursor-help underline decoration-dotted">
                                  {task.errorCode || 'ERROR'}
                                </span>
                              </Tooltip>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openInspect(task, 'task')}
                                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                                data-testid={`inspect-btn-${idx}`}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {task.status === 'FAILED' && (
                                <button
                                  onClick={() => handleRetryTask(task)}
                                  disabled={actionLoading[task.taskId]}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded disabled:opacity-50"
                                  data-testid={`retry-btn-${idx}`}
                                >
                                  <RotateCcw className={`w-3 h-3 ${actionLoading[task.taskId] ? 'animate-spin' : ''}`} />
                                  Retry
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {tasks.length === 0 && (
                    <div className="text-center py-8 text-gray-500">No tasks found</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Inspect Modal */}
        <InspectModal 
          item={inspectItem} 
          type={inspectType} 
          onClose={() => setInspectItem(null)} 
        />
      </div>
    </TwitterAdminLayout>
  );
}
