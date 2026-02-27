/**
 * Twitter Adapter Panel
 * 
 * Admin UI for Twitter adapter status and configuration.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Database, Users, MessageSquare, Share2 } from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

interface AdapterStatus {
  adapter: {
    enabled: boolean;
    mode: string;
    read_only: boolean;
    readers: { authors: string; engagements: string; graph: string };
    confidence_cap: number;
    source: string;
  };
  config: {
    enabled: boolean;
    mode: string;
    read_only: boolean;
    writes_disabled: boolean;
    alerts_disabled: boolean;
  };
  sources: {
    primary_collection: string;
    authors: { status: string; from: string };
    engagements: { status: string; from: string };
    graph: { status: string; from: string; reason: string };
  };
  data: {
    available: boolean;
    tweet_count: number;
    author_count: number;
    newest_at?: string;
    stats?: {
      authors_count: number;
      engagements_count: number;
      freshness: { authors_avg_hours: number; engagements_avg_hours: number };
      warnings: string[];
    };
  };
  confidence: {
    score: number;
    label: string;
    capped: boolean;
    cap_reason?: string;
  };
  graph_status: {
    available: boolean;
    source: string;
    reason: string;
    confidence_cap: number;
  };
}

export default function TwitterAdapterPanel() {
  const [status, setStatus] = useState<AdapterStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/connections/admin/twitter-adapter/status`);
      const data = await res.json();
      if (data.ok) {
        setStatus(data.data);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch status');
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const toggleAdapter = async (enable: boolean) => {
    try {
      const endpoint = enable ? 'enable' : 'disable';
      await fetch(`${API_BASE}/api/connections/admin/twitter-adapter/${endpoint}`, { method: 'POST' });
      fetchStatus();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const setMode = async (mode: string) => {
    try {
      await fetch(`${API_BASE}/api/connections/admin/twitter-adapter/mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      fetchStatus();
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground">Loading adapter status...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-center text-destructive">
        Error: {error}
        <Button variant="outline" size="sm" className="ml-2" onClick={fetchStatus}>
          Retry
        </Button>
      </div>
    );
  }

  if (!status) return null;

  const StatusIcon = status.adapter.enabled ? CheckCircle : XCircle;
  const statusColor = status.adapter.enabled ? 'text-green-500' : 'text-red-500';

  return (
    <div className="space-y-4" data-testid="twitter-adapter-panel">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${statusColor}`} />
            <CardTitle>Twitter Adapter</CardTitle>
            <Badge variant={status.adapter.enabled ? 'default' : 'secondary'}>
              {status.adapter.mode.toUpperCase()}
            </Badge>
            {status.config.read_only && (
              <Badge variant="outline" className="text-orange-500 border-orange-500">
                READ-ONLY
              </Badge>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={fetchStatus}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={status.adapter.enabled ? 'destructive' : 'default'}
              size="sm"
              onClick={() => toggleAdapter(!status.adapter.enabled)}
              data-testid="adapter-toggle-btn"
            >
              {status.adapter.enabled ? 'Disable' : 'Enable'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMode('dry-run')}
              disabled={status.adapter.mode === 'dry-run'}
            >
              Dry Run
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMode('live')}
              disabled={status.adapter.mode === 'live'}
            >
              Live (Read-Only)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Database className="h-4 w-4" /> Data Sources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Authors */}
          <div className="flex items-center justify-between p-2 bg-muted rounded">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Authors</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={status.sources.authors.status === 'enabled' ? 'default' : 'secondary'}>
                {status.sources.authors.status}
              </Badge>
              <span className="text-xs text-muted-foreground">{status.sources.authors.from}</span>
            </div>
          </div>

          {/* Engagements */}
          <div className="flex items-center justify-between p-2 bg-muted rounded">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span>Engagements</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={status.sources.engagements.status === 'enabled' ? 'default' : 'secondary'}>
                {status.sources.engagements.status}
              </Badge>
              <span className="text-xs text-muted-foreground">{status.sources.engagements.from}</span>
            </div>
          </div>

          {/* Graph */}
          <div className="flex items-center justify-between p-2 bg-muted rounded">
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              <span>Follow Graph</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive">DISABLED</Badge>
              <span className="text-xs text-muted-foreground">No data available</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coverage Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          {status.data.available ? (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{status.data.author_count}</div>
                <div className="text-xs text-muted-foreground">Authors</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{status.data.tweet_count}</div>
                <div className="text-xs text-muted-foreground">Tweets</div>
              </div>
              <div>
                <div className="text-2xl font-bold">0</div>
                <div className="text-xs text-muted-foreground">Edges (N/A)</div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              No Twitter data available. Run parser to collect data.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confidence */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Confidence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{(status.confidence.score * 100).toFixed(0)}%</div>
              <div className="text-xs text-muted-foreground">Current confidence</div>
            </div>
            {status.confidence.capped && (
              <div className="flex items-center gap-2 text-orange-500">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Capped at 75%</span>
              </div>
            )}
          </div>
          {status.confidence.cap_reason && (
            <div className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded">
              {status.confidence.cap_reason}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Graph Warning */}
      <Card className="border-orange-500">
        <CardContent className="pt-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0" />
            <div>
              <div className="font-medium text-orange-500">Graph Not Available</div>
              <div className="text-sm text-muted-foreground mt-1">
                {status.graph_status.reason}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
