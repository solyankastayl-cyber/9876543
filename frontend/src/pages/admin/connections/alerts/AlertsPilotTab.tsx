/**
 * Alerts Pilot Tab
 * 
 * Admin panel for pilot alerts monitoring and control.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Play,
  Pause,
  OctagonX,
  Shield,
  Bell,
  BellOff,
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';
const PREFIX = '/api/admin/alerts/pilot';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${PREFIX}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  const data = await res.json();
  return data.data;
}

interface PilotStatus {
  enabled: boolean;
  pilot: {
    total_accounts: number;
    total_alerts_today: number;
    total_alerts_all_time: number;
    status: string;
    config: {
      max_alerts_per_day: number;
      max_alerts_per_account_per_day: number;
      cooldown_minutes: number;
    };
  };
  kill_switch: {
    enabled: boolean;
    auto_enabled: boolean;
    enabled_reason?: string;
    enabled_at?: string;
  };
  policy: {
    confidence_threshold: number;
    pilot_only: boolean;
  };
  dedup: {
    total_entries: number;
    twitter_entries: number;
  };
  today: {
    sent: number;
    suppressed: number;
    blocked: number;
  };
}

export default function AlertsPilotTab() {
  const [status, setStatus] = useState<PilotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentDecisions, setRecentDecisions] = useState<any[]>([]);
  const [suppressionStats, setSuppressionStats] = useState<Record<string, number>>({});
  const [testResult, setTestResult] = useState<any>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const [statusData, recent, suppression] = await Promise.all([
        fetchApi<PilotStatus>('/status'),
        fetchApi<any[]>('/recent?limit=20'),
        fetchApi<Record<string, number>>('/suppression-stats'),
      ]);
      setStatus(statusData);
      setRecentDecisions(recent);
      setSuppressionStats(suppression);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleEnable = async () => {
    await fetchApi('/enable', { method: 'POST' });
    fetchStatus();
  };

  const handleDisable = async () => {
    await fetchApi('/disable', { method: 'POST' });
    fetchStatus();
  };

  const handleKillSwitchOn = async () => {
    if (!window.confirm('Enable kill switch? All alerts will be blocked.')) return;
    await fetchApi('/kill-switch/on', { method: 'POST', body: JSON.stringify({ reason: 'Manual admin action' }) });
    fetchStatus();
  };

  const handleKillSwitchOff = async () => {
    await fetchApi('/kill-switch/off', { method: 'POST' });
    fetchStatus();
  };

  const handleTestRun = async () => {
    const result = await fetchApi<any>('/test-run', { method: 'POST' });
    setTestResult(result);
  };

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground">Loading alerts pilot status...</div>;
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-destructive mb-2">Error: {error}</div>
        <Button variant="outline" size="sm" onClick={fetchStatus}>
          <RefreshCw className="h-4 w-4 mr-1" /> Retry
        </Button>
      </div>
    );
  }

  if (!status) return null;

  const StatusIcon = status.enabled ? Bell : BellOff;
  const statusColor = status.enabled ? 'text-green-500' : 'text-gray-500';

  return (
    <div className="space-y-4 p-4" data-testid="alerts-pilot-tab">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon className={`h-6 w-6 ${statusColor}`} />
          <h2 className="text-xl font-bold">Alerts Pilot</h2>
          <Badge variant={status.enabled ? 'default' : 'secondary'}>
            {status.enabled ? 'ACTIVE' : 'PAUSED'}
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStatus}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Kill Switch Warning */}
      {status.kill_switch.enabled && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-red-700">
              <OctagonX className="h-5 w-5" />
              <span className="font-bold">KILL SWITCH ACTIVE</span>
              {status.kill_switch.auto_enabled && <Badge variant="outline">AUTO</Badge>}
            </div>
            <div className="text-sm text-red-600 mt-1">
              Reason: {status.kill_switch.enabled_reason || 'Unknown'}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Controls</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            variant={status.enabled ? 'outline' : 'default'}
            size="sm"
            onClick={handleEnable}
            disabled={status.kill_switch.enabled}
          >
            <Play className="h-4 w-4 mr-1" /> Enable
          </Button>
          <Button
            variant={!status.enabled ? 'outline' : 'destructive'}
            size="sm"
            onClick={handleDisable}
          >
            <Pause className="h-4 w-4 mr-1" /> Pause
          </Button>
          <div className="border-l mx-2" />
          {status.kill_switch.enabled ? (
            <Button variant="outline" size="sm" onClick={handleKillSwitchOff}>
              <Shield className="h-4 w-4 mr-1" /> Disable Kill Switch
            </Button>
          ) : (
            <Button variant="destructive" size="sm" onClick={handleKillSwitchOn}>
              <OctagonX className="h-4 w-4 mr-1" /> Emergency Stop
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Today's Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{status.today.sent}</div>
              <div className="text-xs text-muted-foreground">Sent</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{status.today.suppressed}</div>
              <div className="text-xs text-muted-foreground">Suppressed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{status.today.blocked}</div>
              <div className="text-xs text-muted-foreground">Blocked</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{status.pilot.total_accounts}</div>
              <div className="text-xs text-muted-foreground">Pilot Accounts</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suppression Reasons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Suppression Reasons</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(suppressionStats).length === 0 ? (
            <div className="text-muted-foreground text-sm">No suppressions yet</div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(suppressionStats).map(([reason, count]) => (
                <div key={reason} className="flex justify-between bg-muted p-2 rounded text-sm">
                  <span>{reason}</span>
                  <span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Run */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Test Run</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" onClick={handleTestRun} data-testid="test-run-btn">
            <Play className="h-4 w-4 mr-1" /> Run Test
          </Button>
          {testResult && (
            <div className="mt-4">
              <div className="text-sm mb-2">
                Found {testResult.candidates_found} candidates, skipped {testResult.skipped}
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="text-left">Account</th>
                    <th>Signal</th>
                    <th>Confidence</th>
                    <th>Decision</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {testResult.sample_results?.map((r: any, i: number) => (
                    <tr key={i}>
                      <td>{r.account}</td>
                      <td className="text-center">{r.signal}</td>
                      <td className="text-center">{(r.confidence * 100).toFixed(0)}%</td>
                      <td className="text-center">
                        <Badge variant={r.decision === 'SEND' ? 'default' : r.decision === 'SUPPRESS' ? 'secondary' : 'destructive'} className="text-xs">
                          {r.decision}
                        </Badge>
                      </td>
                      <td className="text-center text-muted-foreground">{r.reason || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Decisions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent Decisions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentDecisions.length === 0 ? (
            <div className="text-muted-foreground text-sm">No decisions yet</div>
          ) : (
            <div className="space-y-1 max-h-60 overflow-auto">
              {recentDecisions.slice(0, 10).map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-muted p-2 rounded">
                  <div className="flex items-center gap-2">
                    {d.decision === 'SEND' ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : d.decision === 'SUPPRESS' ? (
                      <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500" />
                    )}
                    <span>{d.account_id}</span>
                    <span className="text-muted-foreground">{d.signal_type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{d.source}</Badge>
                    {d.suppression_reason && (
                      <span className="text-muted-foreground">{d.suppression_reason}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Config Info */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4 text-xs text-muted-foreground">
          <div>Confidence threshold: {(status.policy.confidence_threshold * 100)}%</div>
          <div>Max alerts/day: {status.pilot.config.max_alerts_per_day}</div>
          <div>Cooldown: {status.pilot.config.cooldown_minutes} min</div>
          <div>Pilot only: {status.policy.pilot_only ? 'Yes' : 'No'}</div>
        </CardContent>
      </Card>
    </div>
  );
}
