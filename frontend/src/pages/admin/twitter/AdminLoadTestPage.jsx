/**
 * Stage D: Load Testing Dashboard
 * 
 * Admin page for monitoring parser performance:
 * - Performance snapshot
 * - Latency distribution
 * - Abort analysis
 * - Session performance
 */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { TwitterAdminLayout } from '../../../components/admin/TwitterAdminLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { 
  Activity, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Server, 
  RefreshCw, 
  CheckCircle,
  XCircle,
  Zap
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// Stat Card Component
function StatCard({ title, value, subtitle, icon: Icon, color = 'indigo' }) {
  const colorClasses = {
    indigo: 'text-indigo-500 bg-indigo-100',
    green: 'text-green-500 bg-green-100',
    red: 'text-red-500 bg-red-100',
    amber: 'text-amber-500 bg-amber-100',
    blue: 'text-blue-500 bg-blue-100',
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

// Progress Bar Component
function ProgressBar({ value, max = 100, color = 'indigo' }) {
  const percentage = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const colorClasses = {
    indigo: 'bg-indigo-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    amber: 'bg-amber-500',
  };
  
  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div 
        className={`h-full ${colorClasses[color]} transition-all`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export default function AdminLoadTestPage() {
  const [loading, setLoading] = useState(true);
  const [timeWindow, setTimeWindow] = useState('24h');
  const [snapshot, setSnapshot] = useState(null);
  const [latency, setLatency] = useState(null);
  const [aborts, setAborts] = useState(null);
  const [sessions, setSessions] = useState([]);
  
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [snapshotRes, latencyRes, abortsRes, sessionsRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/v4/admin/twitter/performance/snapshot?window=${timeWindow}`),
        axios.get(`${BACKEND_URL}/api/v4/admin/twitter/performance/latency?window=${timeWindow}`),
        axios.get(`${BACKEND_URL}/api/v4/admin/twitter/performance/aborts?window=${timeWindow}`),
        axios.get(`${BACKEND_URL}/api/v4/admin/twitter/performance/sessions`),
      ]);
      
      if (snapshotRes.data.ok) setSnapshot(snapshotRes.data.data);
      if (latencyRes.data.ok) setLatency(latencyRes.data.data);
      if (abortsRes.data.ok) setAborts(abortsRes.data.data);
      if (sessionsRes.data.ok) setSessions(sessionsRes.data.data);
    } catch (err) {
      console.error('Failed to load performance data:', err);
    } finally {
      setLoading(false);
    }
  }, [timeWindow]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  if (loading) {
    return (
      <TwitterAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </TwitterAdminLayout>
    );
  }
  
  return (
    <TwitterAdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Performance Dashboard</h1>
            <p className="text-gray-500 text-sm">Load testing and parser performance metrics</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeWindow} onValueChange={setTimeWindow}>
              <SelectTrigger className="w-32" data-testid="time-window-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last 1h</SelectItem>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7d</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={loadData}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              data-testid="refresh-btn"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Performance Overview */}
        {snapshot && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Tasks"
              value={snapshot.tasks.total}
              subtitle={`${snapshot.tasks.done} done, ${snapshot.tasks.partial} partial, ${snapshot.tasks.failed} failed`}
              icon={Activity}
              color="indigo"
            />
            <StatCard
              title="Success Rate"
              value={`${snapshot.performance.successRate}%`}
              subtitle={`Abort rate: ${snapshot.performance.abortRate}%`}
              icon={snapshot.performance.successRate >= 80 ? CheckCircle : AlertTriangle}
              color={snapshot.performance.successRate >= 80 ? 'green' : 'amber'}
            />
            <StatCard
              title="Avg Latency"
              value={`${(snapshot.performance.avgLatencyMs / 1000).toFixed(1)}s`}
              subtitle={`${snapshot.performance.avgTweetsPerTask} tweets/task avg`}
              icon={Clock}
              color="blue"
            />
            <StatCard
              title="Active Sessions"
              value={snapshot.sessions.ok}
              subtitle={`${snapshot.sessions.stale} stale, ${snapshot.sessions.invalid} invalid`}
              icon={Server}
              color={snapshot.sessions.ok > 0 ? 'green' : 'red'}
            />
          </div>
        )}
        
        {/* Latency Distribution */}
        {latency && latency.buckets && latency.buckets.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Latency Distribution
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">P50</div>
                <div className="text-lg font-bold text-gray-900">
                  {(latency.percentiles.p50 / 1000).toFixed(1)}s
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">P90</div>
                <div className="text-lg font-bold text-gray-900">
                  {(latency.percentiles.p90 / 1000).toFixed(1)}s
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">P95</div>
                <div className="text-lg font-bold text-gray-900">
                  {(latency.percentiles.p95 / 1000).toFixed(1)}s
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">P99</div>
                <div className="text-lg font-bold text-amber-600">
                  {(latency.percentiles.p99 / 1000).toFixed(1)}s
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              {latency.buckets.map((bucket, idx) => {
                const totalCount = latency.buckets.reduce((sum, b) => sum + b.count, 0);
                const label = bucket.max >= 999999 
                  ? `${bucket.min / 1000}s+` 
                  : `${bucket.min / 1000}-${bucket.max / 1000}s`;
                
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-24 text-sm text-gray-600">{label}</div>
                    <div className="flex-1">
                      <ProgressBar 
                        value={bucket.count} 
                        max={totalCount} 
                        color={idx < 2 ? 'green' : idx < 4 ? 'amber' : 'red'}
                      />
                    </div>
                    <div className="w-16 text-sm text-gray-600 text-right">
                      {bucket.count} ({totalCount > 0 ? Math.round((bucket.count / totalCount) * 100) : 0}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Abort Analysis */}
        {aborts && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Abort Analysis
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-red-50 rounded-lg border border-red-100">
                <div className="text-xs text-red-600 mb-1">Total Aborts</div>
                <div className="text-2xl font-bold text-red-700">{aborts.totalAborts}</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Affected Users</div>
                <div className="text-2xl font-bold text-gray-900">{aborts.affectedUsers}</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Affected Sessions</div>
                <div className="text-2xl font-bold text-gray-900">{aborts.affectedSessions}</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Reason Types</div>
                <div className="text-2xl font-bold text-gray-900">{Object.keys(aborts.byReason).length}</div>
              </div>
            </div>
            
            {Object.keys(aborts.byReason).length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700 mb-2">By Reason</h3>
                {Object.entries(aborts.byReason).map(([reason, data]) => (
                  <div key={reason} className="flex items-center gap-3">
                    <div className="w-40 text-sm text-gray-600 font-mono">{reason}</div>
                    <div className="flex-1">
                      <ProgressBar 
                        value={data.count} 
                        max={aborts.totalAborts} 
                        color="red"
                      />
                    </div>
                    <div className="w-24 text-sm text-gray-600 text-right">
                      {data.count} ({data.percentage}%)
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Session Performance */}
        {sessions.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-500" />
              Session Performance
            </h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tasks (24h)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Success Rate</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Latency</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Score</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Used</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions.slice(0, 10).map((session) => (
                    <tr key={session.sessionId}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-600">
                        {session.sessionId.substring(0, 8)}...
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          session.status === 'OK' ? 'bg-green-100 text-green-800' :
                          session.status === 'STALE' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {session.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {session.taskCount}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16">
                            <ProgressBar 
                              value={session.successRate} 
                              color={session.successRate >= 80 ? 'green' : session.successRate >= 50 ? 'amber' : 'red'}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{session.successRate}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {session.avgLatencyMs > 0 ? `${(session.avgLatencyMs / 1000).toFixed(1)}s` : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          session.riskScore <= 30 ? 'text-green-600' :
                          session.riskScore <= 60 ? 'text-amber-600' :
                          'text-red-600'
                        }`}>
                          {session.riskScore}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {session.lastUsedAt 
                          ? new Date(session.lastUsedAt).toLocaleString()
                          : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Empty State */}
        {(!snapshot || snapshot.tasks.total === 0) && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Performance Data</h3>
            <p className="text-gray-500">
              No tasks have been executed in the selected time window.
              Run some parse tasks to see performance metrics.
            </p>
          </div>
        )}
      </div>
    </TwitterAdminLayout>
  );
}
