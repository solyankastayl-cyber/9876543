/**
 * Admin Audit Log Page
 * 
 * View admin action history (ADMIN only).
 * Светлая тема с AdminLayout.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { getAuditLog } from '../../api/admin.api';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { InfoTooltip } from '../../components/admin/InfoTooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  FileText,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Filter,
  Clock,
  User,
  Activity,
} from 'lucide-react';

const ACTION_COLORS = {
  LOGIN_SUCCESS: 'bg-green-100 text-green-700 border-green-300',
  LOGIN_FAILED: 'bg-red-100 text-red-700 border-red-300',
  ML_TOGGLE: 'bg-purple-100 text-purple-700 border-purple-300',
  ML_POLICY_UPDATE: 'bg-purple-100 text-purple-700 border-purple-300',
  ML_RELOAD: 'bg-purple-100 text-purple-700 border-purple-300',
  ML_MODEL_TOGGLE: 'bg-purple-100 text-purple-700 border-purple-300',
  PROVIDER_ADD: 'bg-blue-100 text-blue-700 border-blue-300',
  PROVIDER_REMOVE: 'bg-blue-100 text-blue-700 border-blue-300',
  PROVIDER_RESET: 'bg-blue-100 text-blue-700 border-blue-300',
  PROVIDER_RESET_ALL: 'bg-amber-100 text-amber-700 border-amber-300',
  CIRCUIT_BREAKER_RESET: 'bg-amber-100 text-amber-700 border-amber-300',
  SETTINGS_UPDATE: 'bg-blue-100 text-blue-700 border-blue-300',
  PASSWORD_CHANGE: 'bg-orange-100 text-orange-700 border-orange-300',
};

const ACTION_TYPES = [
  { value: 'all', label: 'All Actions' },
  { value: 'LOGIN_SUCCESS', label: 'Login Success' },
  { value: 'LOGIN_FAILED', label: 'Login Failed' },
  { value: 'ML_TOGGLE', label: 'ML Toggle' },
  { value: 'ML_POLICY_UPDATE', label: 'ML Policy Update' },
  { value: 'ML_RELOAD', label: 'ML Reload' },
  { value: 'PROVIDER_ADD', label: 'Provider Add' },
  { value: 'PROVIDER_REMOVE', label: 'Provider Remove' },
  { value: 'PROVIDER_RESET_ALL', label: 'Provider Reset All' },
  { value: 'CIRCUIT_BREAKER_RESET', label: 'Circuit Breaker Reset' },
];

function AuditLogEntry({ log }) {
  const colorClass = ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-700 border-slate-300';
  const isFailure = log.result === 'failure';
  
  return (
    <div className="flex items-start gap-4 p-4 bg-white rounded-lg border border-slate-200">
      <div className={`p-2 rounded-lg ${isFailure ? 'bg-red-100' : 'bg-green-100'}`}>
        {isFailure ? (
          <XCircle className="w-4 h-4 text-red-600" />
        ) : (
          <CheckCircle className="w-4 h-4 text-green-600" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={colorClass}>
            {log.action}
          </Badge>
          {log.resource && (
            <span className="text-xs text-slate-500">
              → {log.resource}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {log.adminUsername || log.adminId?.substring(0, 8)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(log.ts * 1000).toLocaleString()}
          </span>
          {log.ip && (
            <span>IP: {log.ip}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminAuditPage() {
  const navigate = useNavigate();
  const { isAdmin, isAuthenticated, loading: authLoading } = useAdminAuth();
  
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionFilter, setActionFilter] = useState('all');
  const [limit, setLimit] = useState(50);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAuditLog(limit, actionFilter === 'all' ? null : actionFilter);
      if (result.ok) {
        setLogs(result.data.logs || []);
        setStats(result.data.stats || null);
        setError(null);
      }
    } catch (err) {
      if (err.message === 'UNAUTHORIZED') {
        navigate('/admin/login', { replace: true });
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate, limit, actionFilter]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin/login', { replace: true });
      return;
    }
    if (!authLoading && isAuthenticated && !isAdmin) {
      navigate('/admin/system-overview', { replace: true });
      return;
    }
    if (isAdmin) {
      fetchLogs();
    }
  }, [authLoading, isAuthenticated, isAdmin, navigate, fetchLogs]);

  if (authLoading || (loading && logs.length === 0)) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <FileText className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
              <p className="text-sm text-slate-500">Admin action history</p>
            </div>
          </div>
          <Button variant="outline" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Stats Summary */}
        {stats && (
          <div className="bg-white rounded-lg border border-slate-200 p-6" data-testid="audit-stats">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              Last 24 Hours
              <InfoTooltip text="Summary of admin actions in the last 24 hours." />
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Actions</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalActions || 0}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Failures</p>
                <p className="text-2xl font-bold text-red-600">{stats.failures || 0}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Active Admins</p>
                <p className="text-2xl font-bold text-slate-900">{Object.keys(stats.byAdmin || {}).length}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Action Types</p>
                <p className="text-2xl font-bold text-slate-900">{Object.keys(stats.byAction || {}).length}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-500" />
              <Select value={String(limit)} onValueChange={(v) => setLimit(parseInt(v))}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 rows</SelectItem>
                  <SelectItem value="50">50 rows</SelectItem>
                  <SelectItem value="100">100 rows</SelectItem>
                  <SelectItem value="200">200 rows</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Logs List */}
        <div className="bg-white rounded-lg border border-slate-200 p-6" data-testid="audit-logs-list">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Recent Actions</h3>
          <p className="text-sm text-slate-500 mb-4">{logs.length} entries shown</p>
          
          {logs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No audit logs found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log, idx) => (
                <AuditLogEntry key={`${log.ts}-${idx}`} log={log} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
