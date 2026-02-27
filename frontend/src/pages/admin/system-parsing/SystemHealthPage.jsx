// Admin System Parsing - Health Dashboard
import React, { useState, useEffect } from 'react';
import { Activity, Server, Database, Clock, AlertTriangle, CheckCircle, XCircle, Timer, Play, Pause, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function SystemHealthPage() {
  const [health, setHealth] = useState(null);
  const [scheduler, setScheduler] = useState(null);
  const [loading, setLoading] = useState(true);
  const [schedulerLoading, setSchedulerLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v4/admin/system/health`);
      const data = await res.json();
      if (data.ok) {
        setHealth(data.data);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedulerStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v4/admin/system/scheduler/status`);
      const data = await res.json();
      if (data.ok) {
        setScheduler(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch scheduler status:', err);
    }
  };

  const handleSchedulerAction = async (action) => {
    setSchedulerLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v4/admin/system/scheduler/${action}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.ok) {
        setScheduler(data.data);
      }
    } catch (err) {
      console.error(`Scheduler ${action} failed:`, err);
    } finally {
      setSchedulerLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchSchedulerStatus();
    const interval = setInterval(() => {
      fetchHealth();
      fetchSchedulerStatus();
    }, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const StatusBadge = ({ status }) => {
    const isOk = status === 'ok' || status === 'ready';
    return (
      <span className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
        isOk ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
      }`}>
        {isOk ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        {status?.toUpperCase()}
      </span>
    );
  };

  if (loading && !health) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="health-loading">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error && !health) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-400" data-testid="health-error">
        <AlertTriangle className="w-12 h-12 mb-4" />
        <p>Failed to load health data: {error}</p>
        <Button onClick={fetchHealth} className="mt-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="system-health-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-500" />
          System Health
        </h2>
        <Button variant="outline" size="sm" onClick={fetchHealth} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Services Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <Server className="w-4 h-4" />
              Parser Service
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <StatusBadge status={health?.parser?.status} />
              <span className="text-xs text-zinc-500">{health?.parser?.url}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Browser
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge status={health?.browser?.status} />
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Tasks Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div>
                <span className="text-2xl font-bold">{health?.tasks?.running || 0}</span>
                <span className="text-xs text-zinc-500 ml-1">running</span>
              </div>
              <div>
                <span className="text-xl text-zinc-400">{health?.tasks?.pending || 0}</span>
                <span className="text-xs text-zinc-500 ml-1">pending</span>
              </div>
              {health?.tasks?.failedToday > 0 && (
                <div>
                  <span className="text-xl text-red-400">{health?.tasks?.failedToday}</span>
                  <span className="text-xs text-zinc-500 ml-1">failed</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions Overview */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm font-medium">SYSTEM Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold">{health?.sessions?.total || 0}</div>
              <div className="text-xs text-zinc-500">Total</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-400">{health?.sessions?.ok || 0}</div>
              <div className="text-xs text-zinc-500">OK</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-400">{health?.sessions?.stale || 0}</div>
              <div className="text-xs text-zinc-500">Stale</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-400">{health?.sessions?.invalid || 0}</div>
              <div className="text-xs text-zinc-500">Invalid</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Policy Limits */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm font-medium">SYSTEM Policy Limits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="text-xs text-zinc-500">Max Tasks/Hour</div>
              <div className="text-lg font-semibold">{health?.limits?.maxTasksPerHour}</div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="text-xs text-zinc-500">Max Posts/Day</div>
              <div className="text-lg font-semibold">{health?.limits?.maxPostsPerDay}</div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="text-xs text-zinc-500">Cooldown</div>
              <div className="text-lg font-semibold">{health?.limits?.cooldownMinutes} min</div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="text-xs text-zinc-500">Max Concurrent</div>
              <div className="text-lg font-semibold">{health?.limits?.maxConcurrentTasks}</div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="text-xs text-zinc-500">Max Retries</div>
              <div className="text-lg font-semibold">{health?.limits?.maxRetries}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scheduler Status */}
      <Card className="bg-zinc-900 border-zinc-800" data-testid="scheduler-status-card">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Timer className="w-4 h-4" />
            SYSTEM Scheduler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status & Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-sm font-medium ${
                scheduler?.enabled 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : 'bg-zinc-700/50 text-zinc-400'
              }`}>
                {scheduler?.enabled ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    ENABLED
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    DISABLED
                  </>
                )}
              </span>
              <span className="text-sm text-zinc-500">
                Interval: {scheduler?.intervalMinutes || 15} min
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSchedulerAction('tick')}
                disabled={schedulerLoading}
                data-testid="scheduler-tick-btn"
              >
                <RefreshCw className={`w-4 h-4 mr-1.5 ${schedulerLoading ? 'animate-spin' : ''}`} />
                Run Tick
              </Button>
              {scheduler?.enabled ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSchedulerAction('stop')}
                  disabled={schedulerLoading}
                  data-testid="scheduler-stop-btn"
                  className="text-red-400 hover:text-red-300"
                >
                  <Pause className="w-4 h-4 mr-1.5" />
                  Stop
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSchedulerAction('start')}
                  disabled={schedulerLoading}
                  data-testid="scheduler-start-btn"
                  className="text-emerald-400 hover:text-emerald-300"
                >
                  <Play className="w-4 h-4 mr-1.5" />
                  Start
                </Button>
              )}
            </div>
          </div>

          {/* Scheduler Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="text-xs text-zinc-500">Running Tasks</div>
              <div className="text-lg font-semibold">{scheduler?.runningTasks || 0}</div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="text-xs text-zinc-500">Max Concurrent</div>
              <div className="text-lg font-semibold">{scheduler?.maxConcurrentTasks || 0}</div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="text-xs text-zinc-500">Top K per Tick</div>
              <div className="text-lg font-semibold">{scheduler?.topKPerTick || 0}</div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="text-xs text-zinc-500">Last Tick</div>
              <div className="text-sm font-medium truncate">
                {scheduler?.lastTickAt 
                  ? new Date(scheduler.lastTickAt).toLocaleTimeString() 
                  : 'Never'}
              </div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="text-xs text-zinc-500">Next Tick</div>
              <div className="text-sm font-medium truncate">
                {scheduler?.nextTickAt 
                  ? new Date(scheduler.nextTickAt).toLocaleTimeString() 
                  : 'N/A'}
              </div>
            </div>
          </div>

          {/* Last Tick Result */}
          {scheduler?.lastTickResult && (
            <div className="bg-zinc-800/30 rounded-lg p-3">
              <div className="text-xs text-zinc-500 mb-2">Last Tick Result</div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-zinc-400">
                  Attempted: <span className="text-white font-medium">{scheduler.lastTickResult.attempted}</span>
                </span>
                <span className="text-emerald-400">
                  Started: <span className="font-medium">{scheduler.lastTickResult.started}</span>
                </span>
                <span className="text-red-400">
                  Blocked: <span className="font-medium">{scheduler.lastTickResult.blocked}</span>
                </span>
                <span className="text-yellow-400">
                  Policy Skip: <span className="font-medium">{scheduler.lastTickResult.skippedPolicy}</span>
                </span>
                <span className="text-zinc-500">
                  No Session: <span className="font-medium">{scheduler.lastTickResult.skippedNoSession}</span>
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
