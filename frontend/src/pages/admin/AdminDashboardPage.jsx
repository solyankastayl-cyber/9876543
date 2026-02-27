/**
 * Admin Dashboard Page
 * 
 * Main admin control panel with system overview.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { getDashboard } from '../../api/admin.api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Shield,
  Activity,
  Server,
  Brain,
  Database,
  RefreshCw,
  LogOut,
  Settings,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Loader2,
  MessageCircle,
} from 'lucide-react';

// Status indicator component
function StatusIndicator({ status }) {
  const config = {
    healthy: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    degraded: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    unhealthy: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  };
  const { icon: Icon, color, bg } = config[status] || config.unhealthy;
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${bg}`}>
      <Icon className={`w-3.5 h-3.5 ${color}`} />
      <span className={`text-xs font-medium capitalize ${color}`}>{status}</span>
    </div>
  );
}

// Stat card component
function StatCard({ title, value, subtitle, icon: Icon, trend }) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-300/50">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-600 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="p-2 rounded-lg bg-slate-700/50">
            <Icon className="w-5 h-5 text-slate-600" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user, logout, isAdmin, loading: authLoading, isAuthenticated } = useAdminAuth();
  
  const [dashboard, setDashboard] = useState(null);
  const [sentimentStatus, setSentimentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Fetch sentiment status
  const fetchSentimentStatus = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/v4/admin/sentiment/status`);
      const data = await res.json();
      if (data.ok) {
        setSentimentStatus(data.data);
      }
    } catch (err) {
      console.log('[Dashboard] Sentiment status fetch failed:', err);
    }
  }, []);

  const fetchDashboard = useCallback(async () => {
    try {
      const result = await getDashboard();
      if (result.ok) {
        setDashboard(result.data);
        setLastUpdate(new Date());
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
  }, [navigate]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin/login', { replace: true });
      return;
    }
    if (isAuthenticated) {
      fetchDashboard();
      fetchSentimentStatus();
      // Auto-refresh every 30s
      const interval = setInterval(() => {
        fetchDashboard();
        fetchSentimentStatus();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [authLoading, isAuthenticated, navigate, fetchDashboard, fetchSentimentStatus]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const { providers, ml, price, audit } = dashboard || {};

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Admin Panel</h1>
                <p className="text-xs text-slate-600">BlockView System Control</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right mr-2">
                <p className="text-sm text-slate-900 font-medium">{user?.username || 'Admin'}</p>
                <Badge variant="outline" className="text-xs border-slate-600 text-slate-600">
                  {user?.role || 'ADMIN'}
                </Badge>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchDashboard}
                data-testid="admin-refresh-btn"
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-800"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                data-testid="admin-logout-btn"
                className="text-slate-600 hover:text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Quick Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-8">
          <Link to="/admin/ml" data-testid="admin-nav-ml">
            <Card className="bg-white/50 border-slate-200 hover:border-emerald-500/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <Brain className="w-5 h-5 text-purple-400" />
                <span className="text-sm font-medium text-slate-900">ML Control</span>
              </CardContent>
            </Card>
          </Link>
          <Link to="/admin/ml/sentiment" data-testid="admin-nav-sentiment">
            <Card className="bg-white/50 border-slate-200 hover:border-purple-500/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-purple-400" />
                <span className="text-sm font-medium text-slate-900">Sentiment</span>
              </CardContent>
            </Card>
          </Link>
          <Link to="/admin/fractal" data-testid="admin-nav-fractal">
            <Card className="bg-white/50 border-slate-200 hover:border-amber-500/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <Activity className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-medium text-slate-900">Fractal</span>
              </CardContent>
            </Card>
          </Link>
          <Link to="/admin/providers" data-testid="admin-nav-providers">
            <Card className="bg-white/50 border-slate-200 hover:border-emerald-500/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <Server className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-medium text-slate-900">Providers</span>
              </CardContent>
            </Card>
          </Link>
          {isAdmin && (
            <Link to="/admin/audit" data-testid="admin-nav-audit">
              <Card className="bg-white/50 border-slate-200 hover:border-emerald-500/50 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <span className="text-sm font-medium text-slate-900">Audit Log</span>
                </CardContent>
              </Card>
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin/users" data-testid="admin-nav-users">
              <Card className="bg-white/50 border-slate-200 hover:border-emerald-500/50 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <Settings className="w-5 h-5 text-slate-600" />
                  <span className="text-sm font-medium text-slate-900">Users</span>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Providers Status */}
          <Card className="bg-white/50 border-slate-200" data-testid="admin-providers-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium text-slate-900 flex items-center gap-2">
                  <Server className="w-4 h-4 text-blue-400" />
                  External Providers
                </CardTitle>
                <StatusIndicator status={providers?.summary?.healthy > 0 ? 'healthy' : 'unhealthy'} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <StatCard title="Total" value={providers?.summary?.total || 0} icon={Database} />
                <StatCard title="Healthy" value={providers?.summary?.healthy || 0} icon={CheckCircle} />
                <StatCard title="Requests" value={providers?.summary?.totalRequests || 0} icon={Activity} />
                <StatCard title="Errors" value={providers?.summary?.totalErrors || 0} icon={AlertTriangle} />
              </div>
            </CardContent>
          </Card>

          {/* ML Status */}
          <Card className="bg-white/50 border-slate-200" data-testid="admin-ml-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium text-slate-900 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-400" />
                  ML Runtime
                </CardTitle>
                <StatusIndicator status={ml?.pythonHealthy ? 'healthy' : 'degraded'} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <StatCard 
                  title="Python Service" 
                  value={ml?.pythonHealthy ? 'Online' : 'Offline'} 
                  icon={Zap} 
                />
                <StatCard 
                  title="Circuit Breaker" 
                  value={ml?.circuitBreaker?.state || 'CLOSED'} 
                  icon={Activity} 
                />
                <StatCard 
                  title="Inferences/hr" 
                  value={ml?.inferenceStats?.total || 0} 
                  icon={Brain} 
                />
                <StatCard 
                  title="Fallbacks" 
                  value={ml?.inferenceStats?.fallbacks || 0} 
                  icon={AlertTriangle} 
                />
              </div>
            </CardContent>
          </Card>

          {/* Sentiment Engine Status */}
          <Card className="bg-white/50 border-slate-200" data-testid="admin-sentiment-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium text-slate-900 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-purple-400" />
                  Sentiment Engine
                </CardTitle>
                <StatusIndicator status={sentimentStatus?.health === 'HEALTHY' ? 'healthy' : 'degraded'} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <StatCard 
                  title="Mode" 
                  value={sentimentStatus?.engineMode?.toUpperCase() || 'N/A'} 
                  icon={Zap} 
                />
                <StatCard 
                  title="Uptime" 
                  value={sentimentStatus?.uptimeSec ? `${Math.floor(sentimentStatus.uptimeSec / 60)}m` : 'N/A'} 
                  icon={Clock} 
                />
                <StatCard 
                  title="Latency" 
                  value={`${sentimentStatus?.avgLatencyMs || 0}ms`} 
                  icon={Activity} 
                />
                <StatCard 
                  title="Storage" 
                  value={sentimentStatus?.storageEnabled ? 'ON' : 'OFF'} 
                  icon={Database} 
                />
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Model: {sentimentStatus?.modelVersion || 'N/A'}</span>
                  <Link to="/admin/ml/sentiment" className="text-purple-500 hover:text-purple-600">
                    Manage →
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price Feed Status */}
          <Card className="bg-white/50 border-slate-200" data-testid="admin-price-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium text-slate-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  Price Feed
                </CardTitle>
                <StatusIndicator status={price?.job?.isRunning ? 'healthy' : 'degraded'} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <StatCard 
                  title="Snapshot Job" 
                  value={price?.job?.isRunning ? 'Running' : 'Stopped'} 
                  icon={Activity} 
                />
                <StatCard 
                  title="Universe" 
                  value={price?.universe?.activeAssets || 0} 
                  subtitle="assets"
                  icon={Database} 
                />
                <StatCard 
                  title="Cache Hit" 
                  value={`${Math.round((price?.cache?.hitRate || 0) * 100)}%`} 
                  icon={Zap} 
                />
                <StatCard 
                  title="Snapshots" 
                  value={price?.snapshots?.total || 0} 
                  subtitle="last hour"
                  icon={Clock} 
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Audit Summary (Admin only) */}
        {isAdmin && audit && (
          <Card className="bg-white/50 border-slate-200" data-testid="admin-audit-summary">
            <CardHeader>
              <CardTitle className="text-base font-medium text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                Audit Summary (24h)
              </CardTitle>
              <CardDescription className="text-slate-600">
                Recent administrative actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard title="Total Actions" value={audit.totalActions || 0} icon={Activity} />
                <StatCard title="Failures" value={audit.failures || 0} icon={AlertTriangle} />
                <StatCard 
                  title="Top Action" 
                  value={Object.keys(audit.byAction || {})[0] || 'N/A'} 
                  icon={Zap} 
                />
                <StatCard 
                  title="Active Admins" 
                  value={Object.keys(audit.byAdmin || {}).length || 0} 
                  icon={Shield} 
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-500">
          {lastUpdate && (
            <p>Last updated: {lastUpdate.toLocaleTimeString()}</p>
          )}
        </div>
      </main>
    </div>
  );
}
