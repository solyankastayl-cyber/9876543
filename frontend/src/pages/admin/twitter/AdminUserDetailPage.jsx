/**
 * A.3.2 - Admin User Detail Page
 * 
 * Detailed view of a specific user:
 * - User header with status
 * - Accounts list
 * - Sessions list
 * - Activity stats
 * - Admin actions
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TwitterAdminLayout } from '../../../components/admin/TwitterAdminLayout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  ChevronLeft, User, MessageCircle, Calendar,
  AlertTriangle, CheckCircle, XCircle, AlertCircle,
  Pause, Play, RefreshCcw, Trash2, Shield,
  Activity, Clock, Zap, BarChart3
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

async function fetchUserDetail(userId) {
  const res = await fetch(`${API_BASE}/api/v4/admin/twitter/users/${userId}`);
  return res.json();
}

async function fetchUserTasks(userId) {
  const res = await fetch(`${API_BASE}/api/v4/admin/twitter/users/${userId}/tasks?limit=10`);
  return res.json();
}

async function adminAction(endpoint, method = 'POST', body = null) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : null,
  });
  return res.json();
}

const HEALTH_CONFIG = {
  HEALTHY: { label: 'Healthy', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  WARNING: { label: 'Warning', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
  DEGRADED: { label: 'Degraded', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
  BLOCKED: { label: 'Blocked', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const STATUS_CONFIG = {
  OK: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
  STALE: { color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
  INVALID: { color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function AdminUserDetailPage() {
  const { userId } = useParams();
  const [detail, setDetail] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [detailRes, tasksRes] = await Promise.all([
        fetchUserDetail(userId),
        fetchUserTasks(userId),
      ]);
      
      if (detailRes.ok) {
        setDetail(detailRes.data);
      } else {
        toast.error(detailRes.message || 'User not found');
      }
      
      if (tasksRes.ok) {
        setTasks(tasksRes.data);
      }
    } catch (err) {
      console.error('Failed to load user detail:', err);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  }, [userId]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Calculate user health from sessions
  const calculateHealth = () => {
    if (!detail) return 'HEALTHY';
    const { sessions } = detail;
    const total = sessions.length;
    const okCount = sessions.filter(s => s.status === 'OK').length;
    const staleCount = sessions.filter(s => s.status === 'STALE').length;
    const invalidCount = sessions.filter(s => s.status === 'INVALID').length;
    
    if (total === 0 || invalidCount === total) return 'BLOCKED';
    if (staleCount === total || detail.stats.aborts24h >= 5) return 'DEGRADED';
    if (staleCount > 0) return 'WARNING';
    return 'HEALTHY';
  };
  
  const health = calculateHealth();
  const healthConfig = HEALTH_CONFIG[health];
  const HealthIcon = healthConfig?.icon || CheckCircle;
  
  // Admin Actions
  const handleDisableUser = async () => {
    if (!window.confirm('Disable parsing for this user? All accounts will be suspended.')) return;
    
    setActionLoading('disable');
    try {
      const res = await adminAction(`/api/v4/admin/twitter/users/${userId}/disable`);
      if (res.ok) {
        toast.success(res.message);
        loadData();
      } else {
        toast.error(res.message || 'Action failed');
      }
    } finally {
      setActionLoading(null);
    }
  };
  
  const handleEnableUser = async () => {
    setActionLoading('enable');
    try {
      const res = await adminAction(`/api/v4/admin/twitter/users/${userId}/enable`);
      if (res.ok) {
        toast.success(res.message);
        loadData();
      } else {
        toast.error(res.message || 'Action failed');
      }
    } finally {
      setActionLoading(null);
    }
  };
  
  const handleCooldown = async () => {
    if (!window.confirm('Force cooldown? All sessions will be marked STALE.')) return;
    
    setActionLoading('cooldown');
    try {
      const res = await adminAction(`/api/v4/admin/twitter/users/${userId}/cooldown`);
      if (res.ok) {
        toast.success(res.message);
        loadData();
      } else {
        toast.error(res.message || 'Action failed');
      }
    } finally {
      setActionLoading(null);
    }
  };
  
  const handleInvalidateSessions = async () => {
    if (!window.confirm('Invalidate ALL sessions? User must re-sync cookies.')) return;
    
    setActionLoading('invalidate');
    try {
      const res = await adminAction(`/api/v4/admin/twitter/users/${userId}/invalidate-sessions`);
      if (res.ok) {
        toast.success(res.message);
        loadData();
      } else {
        toast.error(res.message || 'Action failed');
      }
    } finally {
      setActionLoading(null);
    }
  };
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };
  
  const formatDuration = (ms) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };
  
  if (loading) {
    return (
      <TwitterAdminLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="h-32 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </TwitterAdminLayout>
    );
  }
  
  if (!detail) {
    return (
      <TwitterAdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">User not found</p>
          <Link to="/admin/twitter" className="text-blue-600 hover:underline mt-2 inline-block">
            Back to Users
          </Link>
        </div>
      </TwitterAdminLayout>
    );
  }
  
  return (
    <TwitterAdminLayout>
      <div data-testid="admin-user-detail-page">
        {/* Back Button */}
        <Link 
          to="/admin/twitter"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Users
        </Link>
        
        {/* User Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{detail.user.userId}</h1>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {new Date(detail.user.createdAt).toLocaleDateString()}
                  </span>
                  {detail.user.telegramConnected && (
                    <span className="flex items-center gap-1 text-blue-600">
                      <MessageCircle className="w-4 h-4" />
                      @{detail.user.telegramUsername || 'Connected'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <span className={cn(
              'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium',
              healthConfig?.color
            )}>
              <HealthIcon className="w-4 h-4" />
              {healthConfig?.label}
            </span>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Activity className="w-4 h-4" />
              Tasks (24h)
            </div>
            <div className="text-2xl font-bold">{detail.stats.tasks24h}</div>
            <div className="text-xs text-gray-400">{detail.stats.tasks7d} last 7d</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <AlertTriangle className="w-4 h-4" />
              Aborts (24h)
            </div>
            <div className={cn(
              'text-2xl font-bold',
              detail.stats.aborts24h > 3 ? 'text-red-600' : ''
            )}>
              {detail.stats.aborts24h}
            </div>
            <div className="text-xs text-gray-400">{detail.stats.aborts7d} last 7d</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Zap className="w-4 h-4" />
              Tweets (24h)
            </div>
            <div className="text-2xl font-bold">{detail.stats.tweetsFetched24h}</div>
            <div className="text-xs text-gray-400">{detail.stats.tweetsFetched7d} last 7d</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Clock className="w-4 h-4" />
              Avg Runtime
            </div>
            <div className="text-2xl font-bold">{formatDuration(detail.stats.avgRuntime)}</div>
            <div className="text-xs text-gray-400">{detail.stats.cooldownCount} cooldowns</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Accounts */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Accounts ({detail.accounts.length})</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {detail.accounts.map((account) => (
                <div key={account.accountId} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">@{account.username}</div>
                    <div className="text-xs text-gray-500">
                      {account.sessionsCount.ok} OK / {account.sessionsCount.stale} Stale / {account.sessionsCount.invalid} Invalid
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {account.preferred && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        Preferred
                      </span>
                    )}
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded',
                      account.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    )}>
                      {account.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>
              ))}
              {detail.accounts.length === 0 && (
                <div className="px-4 py-6 text-center text-gray-500">No accounts</div>
              )}
            </div>
          </div>
          
          {/* Sessions */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Sessions ({detail.sessions.length})</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
              {detail.sessions.map((session) => {
                const statusConfig = STATUS_CONFIG[session.status] || STATUS_CONFIG.OK;
                const StatusIcon = statusConfig.icon;
                
                return (
                  <div key={session.sessionId} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">@{session.accountUsername}</span>
                      <span className={cn(
                        'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded',
                        statusConfig.color
                      )}>
                        <StatusIcon className="w-3 h-3" />
                        {session.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-4">
                      <span>Risk: {session.riskScore}</span>
                      <span>v{session.version}</span>
                      {session.lastAbortAt && (
                        <span className="text-red-500">
                          Abort: {new Date(session.lastAbortAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {detail.sessions.length === 0 && (
                <div className="px-4 py-6 text-center text-gray-500">No sessions</div>
              )}
            </div>
          </div>
        </div>
        
        {/* Recent Tasks */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Recent Tasks</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-2">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-2">Type</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-2">Query</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-2">Fetched</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-2">Duration</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-2">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tasks.map((task) => (
                  <tr key={task.taskId}>
                    <td className="px-4 py-2">
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded',
                        task.status === 'DONE' ? 'bg-green-100 text-green-700' :
                        task.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                        task.status === 'PARTIAL' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      )}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">{task.type}</td>
                    <td className="px-4 py-2 text-sm text-gray-700 max-w-xs truncate">{task.query || '-'}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{task.fetched}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{formatDuration(task.duration)}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{formatDate(task.createdAt)}</td>
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500">No tasks</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Admin Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-600" />
            Admin Actions
          </h2>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleDisableUser}
              disabled={actionLoading !== null}
              className="text-red-600 border-red-200 hover:bg-red-50"
              data-testid="admin-action-disable"
            >
              <Pause className="w-4 h-4 mr-2" />
              {actionLoading === 'disable' ? 'Disabling...' : 'Disable Parsing'}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleEnableUser}
              disabled={actionLoading !== null}
              className="text-green-600 border-green-200 hover:bg-green-50"
              data-testid="admin-action-enable"
            >
              <Play className="w-4 h-4 mr-2" />
              {actionLoading === 'enable' ? 'Enabling...' : 'Enable Parsing'}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleCooldown}
              disabled={actionLoading !== null}
              className="text-amber-600 border-amber-200 hover:bg-amber-50"
              data-testid="admin-action-cooldown"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              {actionLoading === 'cooldown' ? 'Cooling...' : 'Force Cooldown'}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleInvalidateSessions}
              disabled={actionLoading !== null}
              className="text-red-600 border-red-200 hover:bg-red-50"
              data-testid="admin-action-invalidate"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {actionLoading === 'invalidate' ? 'Invalidating...' : 'Invalidate Sessions'}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            All actions are logged for audit. User will be notified via Telegram if connected.
          </p>
        </div>
      </div>
    </TwitterAdminLayout>
  );
}
