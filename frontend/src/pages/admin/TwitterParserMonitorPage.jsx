/**
 * Twitter Parser Monitor Admin Page
 * Real-time overview of parser system health and capacity
 * LIGHT THEME VERSION
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  getParserMonitor,
  getEgressSlots,
  runFreezeValidation,
  getFreezeStatus,
  getFreezeLast,
  abortFreezeValidation,
} from '../../api/twitterParserAdmin.api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  ArrowLeft,
  RefreshCw,
  Activity,
  Server,
  Users,
  Gauge,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Globe,
  Play,
  Square,
  Download,
  FlaskConical,
} from 'lucide-react';

const HEALTH_CONFIG = {
  UNKNOWN: { label: 'Unknown', color: 'bg-gray-50 text-gray-600 border-gray-200' },
  HEALTHY: { label: 'Healthy', color: 'bg-green-50 text-green-700 border-green-200' },
  DEGRADED: { label: 'Degraded', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  ERROR: { label: 'Error', color: 'bg-red-50 text-red-700 border-red-200' },
};

function SlotCard({ slot }) {
  const health = HEALTH_CONFIG[slot.health?.status] || HEALTH_CONFIG.UNKNOWN;
  const usage = slot.usage?.usedInWindow || 0;
  const limit = slot.limits?.requestsPerHour || 200;
  const percent = Math.round((usage / limit) * 100);

  return (
    <div className={`p-4 rounded-xl border ${health.color.replace('text-', 'border-').replace('bg-', 'bg-')}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {slot.type === 'REMOTE_WORKER' ? <Server className="w-4 h-4" /> :
           slot.type === 'PROXY' ? <Globe className="w-4 h-4" /> :
           <Zap className="w-4 h-4" />}
          <span className="font-medium text-gray-900">{slot.label}</span>
        </div>
        <Badge variant="outline" className={health.color}>
          {health.label}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
        <div>
          <p className="text-gray-500">Type</p>
          <p className="font-medium text-gray-900">{slot.type}</p>
        </div>
        <div>
          <p className="text-gray-500">Usage</p>
          <p className="font-medium text-gray-900">{usage} / {limit}</p>
        </div>
      </div>
      
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            percent > 90 ? 'bg-red-500' : percent > 70 ? 'bg-amber-500' : 'bg-teal-500'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 text-right mt-1">{percent}%</p>
    </div>
  );
}

export default function TwitterParserMonitorPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAdminAuth();

  const [monitor, setMonitor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // P3 FREEZE Validation state
  const [freezeStatus, setFreezeStatus] = useState(null);
  const [freezeResult, setFreezeResult] = useState(null);
  const [freezeLoading, setFreezeLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [monitorRes, slotsRes] = await Promise.all([
        getParserMonitor(),
        getEgressSlots(),
      ]);
      
      if (monitorRes.ok) setMonitor(monitorRes.data);
      if (slotsRes.ok) setSlots(slotsRes.data || []);
      setLastUpdate(new Date());

      // Fetch freeze status
      try {
        const statusRes = await getFreezeStatus();
        if (statusRes.ok) setFreezeStatus(statusRes.data);
      } catch (e) {
        // Ignore - freeze endpoints might not exist yet
      }

      try {
        const resultRes = await getFreezeLast();
        if (resultRes.ok) setFreezeResult(resultRes.data);
      } catch (e) {
        // Ignore
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRunFreeze = async (profile) => {
    setFreezeLoading(true);
    try {
      await runFreezeValidation(profile);
      // Start polling for status
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await getFreezeStatus();
          if (statusRes.ok) {
            setFreezeStatus(statusRes.data);
            if (statusRes.data.status !== 'RUNNING') {
              clearInterval(pollInterval);
              // Fetch final result
              const resultRes = await getFreezeLast();
              if (resultRes.ok) setFreezeResult(resultRes.data);
            }
          }
        } catch (e) {}
      }, 2000);
      // Store interval for cleanup
      setTimeout(() => clearInterval(pollInterval), 3600000); // 1 hour max
    } catch (err) {
      setError(err.message);
    } finally {
      setFreezeLoading(false);
    }
  };

  const handleAbortFreeze = async () => {
    try {
      await abortFreezeValidation();
      const statusRes = await getFreezeStatus();
      if (statusRes.ok) setFreezeStatus(statusRes.data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchData();
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [authLoading, isAuthenticated, fetchData]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  const systemHealth = monitor ? (
    monitor.errorSlots > 0 ? 'ERROR' :
    monitor.degradedSlots > 0 ? 'DEGRADED' :
    monitor.healthySlots > 0 ? 'HEALTHY' : 'UNKNOWN'
  ) : 'UNKNOWN';

  const healthConfig = HEALTH_CONFIG[systemHealth];

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50" data-testid="admin-monitor-page">
        {/* Page Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">System Monitor</h1>
              <p className="text-sm text-gray-500">
                Real-time health and capacity
                {lastUpdate && (
                  <span className="ml-2">• Updated {lastUpdate.toLocaleTimeString()}</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={healthConfig.color}>
                System {healthConfig.label}
              </Badge>
              <Button variant="outline" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex gap-6">
              <Link to="/admin/twitter-parser/accounts" className="py-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 text-sm font-medium">
                Accounts
              </Link>
              <Link to="/admin/twitter-parser/sessions" className="py-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 text-sm font-medium">
                Sessions
              </Link>
              <Link to="/admin/twitter-parser/slots" className="py-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 text-sm font-medium">
                Slots
              </Link>
              <Link to="/admin/twitter-parser/monitor" className="py-3 border-b-2 border-teal-500 text-teal-600 text-sm font-medium">
                Monitor
              </Link>
            </div>
          </div>
        </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-gray-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Active Accounts</p>
                  <p className="text-3xl font-bold text-gray-900">{monitor?.activeAccounts || 0}</p>
                  <p className="text-xs text-gray-400">of {monitor?.totalAccounts || 0} total</p>
                </div>
                <div className="p-3 bg-green-50 rounded-xl">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-gray-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Enabled Slots</p>
                  <p className="text-3xl font-bold text-gray-900">{monitor?.enabledSlots || 0}</p>
                  <p className="text-xs text-gray-400">of {monitor?.totalSlots || 0} total</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Server className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-gray-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Capacity/Hour</p>
                  <p className="text-3xl font-bold text-gray-900">{monitor?.totalCapacityPerHour || 0}</p>
                  <p className="text-xs text-gray-400">requests available</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl">
                  <Gauge className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-gray-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Available Now</p>
                  <p className="text-3xl font-bold text-gray-900">{monitor?.availableThisHour || 0}</p>
                  <p className="text-xs text-gray-400">{monitor?.usedThisHour || 0} used this hour</p>
                </div>
                <div className="p-3 bg-teal-50 rounded-xl">
                  <Zap className="w-6 h-6 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Capacity & Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="border-gray-200 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Capacity Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Hourly Capacity</span>
                  <span className="font-medium text-gray-900">
                    {monitor?.usedThisHour || 0} / {monitor?.totalCapacityPerHour || 0}
                  </span>
                </div>
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all"
                    style={{ width: `${monitor?.totalCapacityPerHour ? ((monitor.usedThisHour || 0) / monitor.totalCapacityPerHour) * 100 : 0}%` }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{monitor?.healthySlots || 0}</p>
                  <p className="text-xs text-gray-500">Healthy</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">{monitor?.degradedSlots || 0}</p>
                  <p className="text-xs text-gray-500">Degraded</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{monitor?.errorSlots || 0}</p>
                  <p className="text-xs text-gray-500">Error</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/admin/twitter-parser/accounts" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Accounts
                </Button>
              </Link>
              <Link to="/admin/twitter-parser/slots" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Server className="w-4 h-4 mr-2" />
                  Manage Slots
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* P3 FREEZE Validation */}
        <Card className="border-gray-200 mb-6" data-testid="freeze-validation-card">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <FlaskConical className="w-5 h-5" />
              P3 FREEZE Validation
              {freezeStatus?.status === 'RUNNING' && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 ml-2">
                  Running
                </Badge>
              )}
              {freezeResult?.verdict === 'APPROVED' && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 ml-2">
                  v4.0 APPROVED
                </Badge>
              )}
              {freezeResult?.verdict === 'BLOCKED' && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 ml-2">
                  BLOCKED
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Controls */}
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Run validation tests to verify system stability before freezing v4.0 architecture.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => handleRunFreeze('SMOKE')}
                    disabled={freezeLoading || freezeStatus?.status === 'RUNNING'}
                    className="bg-teal-600 hover:bg-teal-700"
                    data-testid="run-smoke-btn"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Run SMOKE (10 min)
                  </Button>
                  <Button
                    onClick={() => handleRunFreeze('STRESS')}
                    disabled={freezeLoading || freezeStatus?.status === 'RUNNING'}
                    variant="outline"
                    data-testid="run-stress-btn"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Run STRESS (30 min)
                  </Button>
                  {freezeStatus?.status === 'RUNNING' && (
                    <Button
                      onClick={handleAbortFreeze}
                      variant="destructive"
                      data-testid="abort-freeze-btn"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Abort
                    </Button>
                  )}
                </div>

                {/* Progress */}
                {freezeStatus?.status === 'RUNNING' && freezeStatus?.progress && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-blue-700">Progress: {freezeStatus.profile}</span>
                      <span className="font-medium text-blue-900">
                        {freezeStatus.progress.tasksGenerated} / {freezeStatus.progress.tasksTotal}
                      </span>
                    </div>
                    <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${(freezeStatus.progress.tasksGenerated / freezeStatus.progress.tasksTotal) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      Elapsed: {Math.round(freezeStatus.progress.elapsedMs / 1000)}s / {freezeStatus.progress.durationMs / 1000}s
                    </p>
                  </div>
                )}
              </div>

              {/* Results */}
              <div>
                {freezeResult && (
                  <div className={`p-4 rounded-lg border ${
                    freezeResult.verdict === 'APPROVED' 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-3">
                      {freezeResult.verdict === 'APPROVED' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className={`font-bold ${
                        freezeResult.verdict === 'APPROVED' ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {freezeResult.verdict}
                      </span>
                      <span className="text-sm text-gray-500">({freezeResult.profile})</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                      <div>
                        <p className="text-gray-500">Success Rate</p>
                        <p className="font-medium">{(freezeResult.rates?.successRate * 100 || 0).toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Error Rate</p>
                        <p className="font-medium">{(freezeResult.rates?.errorRate * 100 || 0).toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Retry Rate</p>
                        <p className="font-medium">{(freezeResult.rates?.retryRate * 100 || 0).toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Runtime P95</p>
                        <p className="font-medium">{freezeResult.stats?.latency?.runtimeP95 || 0}ms</p>
                      </div>
                    </div>

                    {freezeResult.reasons?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-red-200">
                        <p className="text-sm font-medium text-red-700 mb-2">Blockers:</p>
                        <ul className="text-sm text-red-600 space-y-1">
                          {freezeResult.reasons.map((reason, i) => (
                            <li key={i}>• {reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <p className="text-xs text-gray-400 mt-3">
                      Completed: {new Date(freezeResult.completedAt).toLocaleString()}
                    </p>
                  </div>
                )}

                {!freezeResult && !freezeStatus?.status && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                    <FlaskConical className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">No validation results yet</p>
                    <p className="text-xs text-gray-400">Run SMOKE test to validate system</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Slots Grid */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Server className="w-5 h-5" />
              Egress Slots ({slots.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {slots.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Server className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No egress slots configured</p>
                <Link to="/admin/twitter-parser/slots" className="text-teal-600 hover:underline mt-2 inline-block">
                  Add your first slot →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {slots.map(slot => (
                  <SlotCard key={slot._id} slot={slot} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      </div>
    </AdminLayout>
  );
}
