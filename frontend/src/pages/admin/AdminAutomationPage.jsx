/**
 * Automation Admin Page — S4.ADM.4
 * ==================================
 * 
 * Контроль очередей и воркеров:
 * - Queue depth
 * - Stats
 * - Start/Stop
 * - Manual process
 */

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { AlertCircle, Play, Square, Trash2, RefreshCw, Activity, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function AdminAutomationPage() {
  const [status, setStatus] = useState(null);
  const [queue, setQueue] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [processCount, setProcessCount] = useState(10);

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, queueRes, resultsRes] = await Promise.all([
        fetch(`${API_URL}/api/v4/admin/sentiment/automation/status`),
        fetch(`${API_URL}/api/v4/admin/sentiment/automation/queue`),
        fetch(`${API_URL}/api/v4/admin/sentiment/automation/results?limit=10`),
      ]);
      
      const [statusData, queueData, resultsData] = await Promise.all([
        statusRes.json(),
        queueRes.json(),
        resultsRes.json(),
      ]);
      
      if (statusData.ok) setStatus(statusData.data);
      if (queueData.ok) setQueue(queueData.data);
      if (resultsData.ok) setResults(resultsData.data);
      
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleStart = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v4/admin/sentiment/automation/start`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Start error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v4/admin/sentiment/automation/stop`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Stop error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcessNow = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v4/admin/sentiment/automation/process-now`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Process error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Are you sure you want to clear the queue?')) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v4/admin/sentiment/automation/clear`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Clear error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset ALL automation state?')) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v4/admin/sentiment/automation/reset`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6">
          <h1 className="text-2xl font-bold text-slate-900">Automation Admin</h1>
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span>Error: {error}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  const getStatusBadge = (isRunning) => {
    if (isRunning) {
      return <Badge className="bg-green-100 text-green-800">RUNNING</Badge>;
    }
    return <Badge className="bg-gray-200 text-gray-600">IDLE</Badge>;
  };

  const getLabelColor = (label) => {
    switch (label) {
      case 'POSITIVE': return 'bg-green-100 text-green-800';
      case 'NEGATIVE': return 'bg-red-100 text-red-800';
      case 'NEUTRAL': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100';
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6" data-testid="automation-admin-page">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Activity className="h-6 w-6" />
          Automation Admin
        </h1>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Status & Controls */}
      <Card data-testid="automation-status-card">
        <CardHeader>
          <CardTitle>Automation Status</CardTitle>
          <CardDescription>Queue worker control panel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {getStatusBadge(status?.isRunning)}
              <span className="text-sm text-gray-600">
                Auto-processing: {status?.isRunning ? 'Active' : 'Stopped'}
              </span>
            </div>
            <div className="flex gap-2">
              {status?.isRunning ? (
                <Button 
                  variant="destructive" 
                  onClick={handleStop}
                  disabled={actionLoading}
                  data-testid="stop-automation-btn"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              ) : (
                <Button 
                  onClick={handleStart}
                  disabled={actionLoading}
                  data-testid="start-automation-btn"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </Button>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-600">
                {status?.stats?.queueDepth || 0}
              </p>
              <p className="text-xs text-blue-700">Queue Depth</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-gray-600">
                {status?.stats?.totalEnqueued || 0}
              </p>
              <p className="text-xs text-gray-700">Total Enqueued</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">
                {status?.stats?.totalProcessed || 0}
              </p>
              <p className="text-xs text-green-700">Processed</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {status?.stats?.totalDropped || 0}
              </p>
              <p className="text-xs text-yellow-700">Dropped</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-600">
                {status?.stats?.totalFailed || 0}
              </p>
              <p className="text-xs text-red-700">Failed</p>
            </div>
          </div>

          {/* Processing Time */}
          {status?.stats?.avgProcessingTimeMs !== undefined && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                Avg processing time: <span className="font-mono">{status.stats.avgProcessingTimeMs}ms</span>
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Controls */}
      <Card data-testid="manual-controls-card">
        <CardHeader>
          <CardTitle>Manual Controls</CardTitle>
          <CardDescription>Admin-only queue operations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-semibold">Process Now</h3>
              <p className="text-sm text-gray-600">Manually trigger batch processing</p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleProcessNow}
              disabled={actionLoading || (queue?.pending === 0)}
              data-testid="process-now-btn"
            >
              <Play className="h-4 w-4 mr-2" />
              Process Next Batch
            </Button>
          </div>

          <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-semibold">Clear Queue</h3>
              <p className="text-sm text-gray-600">Remove all pending items</p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleClear}
              disabled={actionLoading || (queue?.pending === 0)}
              data-testid="clear-queue-btn"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>

          <div className="flex items-center gap-4 p-4 bg-red-50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-semibold">Reset All</h3>
              <p className="text-sm text-gray-600">Reset queue, stats, and results</p>
            </div>
            <Button 
              variant="destructive" 
              onClick={handleReset}
              disabled={actionLoading}
              data-testid="reset-all-btn"
            >
              Reset All State
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Queue Contents */}
      {queue && queue.items && queue.items.length > 0 && (
        <Card data-testid="queue-contents-card">
          <CardHeader>
            <CardTitle>Queue Contents ({queue.depth} items)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {queue.items.slice(0, 10).map((item, idx) => (
                <div key={item.id || idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <div className="flex-1 truncate">
                    <span className="font-mono text-xs text-gray-500">{item.tweet_id}</span>
                    <p className="truncate">{item.text?.substring(0, 60)}...</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Results */}
      {results && results.results && results.results.length > 0 && (
        <Card data-testid="recent-results-card">
          <CardHeader>
            <CardTitle>Recent Results ({results.count} total)</CardTitle>
            <CardDescription>
              Distribution: {JSON.stringify(results.summary?.labelCounts || {})}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {results.results.slice(0, 10).map((result, idx) => (
                <div key={result.tweet_id || idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <div className="flex-1">
                    <span className="font-mono text-xs text-gray-500">{result.tweet_id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getLabelColor(result.label)}>
                      {result.label}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {result.score?.toFixed(3)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {result.confidence}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 flex-wrap">
            <a href="/admin/ml/overview" className="text-blue-600 hover:underline text-sm">
              ← Back to ML Overview
            </a>
            <a href="/admin/ml/sentiment" className="text-blue-600 hover:underline text-sm">
              → Sentiment Admin
            </a>
          </div>
        </CardContent>
      </Card>
      </div>
    </AdminLayout>
  );
}
