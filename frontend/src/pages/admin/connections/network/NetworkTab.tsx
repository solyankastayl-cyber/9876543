/**
 * Network Tab
 * 
 * Admin panel for co-engagement network control.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { RefreshCw, Play, Pause, Network, AlertTriangle, Eye } from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';
const PREFIX = '/api/admin/connections/network';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${PREFIX}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  const data = await res.json();
  return data.data;
}

interface NetworkStatus {
  network: {
    mode: string;
    source: string;
    enabled: boolean;
    weight_cap: number;
    edges_available: boolean;
    config: any;
  };
  co_engagement: {
    enabled: boolean;
    edges_count: number;
    config: any;
  };
  weight_policy: {
    enabled: boolean;
    max_weight: number;
    confidence_required: number;
  };
  graph: {
    edges_count: number;
    avg_weight: number;
    avg_confidence: number;
  } | null;
  warnings: string[];
}

export default function NetworkTab() {
  const [status, setStatus] = useState<NetworkStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<any>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchApi<NetworkStatus>('/status');
      setStatus(data);
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

  const handlePreview = async () => {
    const data = await fetchApi<any>('/preview', { method: 'POST' });
    setPreview(data);
  };

  const handleEmergencyDisable = async () => {
    if (!window.confirm('Emergency disable network? All weights will be set to 0.')) return;
    await fetchApi('/emergency-disable', { method: 'POST' });
    fetchStatus();
  };

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground">Loading network status...</div>;
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

  return (
    <div className="space-y-4 p-4" data-testid="network-tab">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className={`h-6 w-6 ${status.network.enabled ? 'text-green-500' : 'text-gray-500'}`} />
          <h2 className="text-xl font-bold">Network (Co-Engagement)</h2>
          <Badge variant={status.network.enabled ? 'default' : 'secondary'}>
            {status.network.mode}
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStatus}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Warnings */}
      {status.warnings.length > 0 && (
        <Card className="border-orange-500">
          <CardContent className="pt-4">
            {status.warnings.map((w, i) => (
              <div key={i} className="flex items-center gap-2 text-orange-700 text-sm">
                <AlertTriangle className="h-4 w-4" />
                {w}
              </div>
            ))}
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
            variant={status.network.enabled ? 'outline' : 'default'}
            size="sm"
            onClick={handleEnable}
          >
            <Play className="h-4 w-4 mr-1" /> Enable
          </Button>
          <Button
            variant={!status.network.enabled ? 'outline' : 'secondary'}
            size="sm"
            onClick={handleDisable}
          >
            <Pause className="h-4 w-4 mr-1" /> Disable
          </Button>
          <Button variant="outline" size="sm" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-1" /> Preview
          </Button>
          <Button variant="destructive" size="sm" onClick={handleEmergencyDisable}>
            Emergency Disable
          </Button>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{status.graph?.edges_count || 0}</div>
              <div className="text-xs text-muted-foreground">Total Edges</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{status.co_engagement.edges_count}</div>
              <div className="text-xs text-muted-foreground">Co-Engagement Edges</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{((status.graph?.avg_weight || 0) * 100).toFixed(0)}%</div>
              <div className="text-xs text-muted-foreground">Avg Weight</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{((status.graph?.avg_confidence || 0) * 100).toFixed(0)}%</div>
              <div className="text-xs text-muted-foreground">Avg Confidence</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Config */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Configuration</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex justify-between">
            <span>Mode</span>
            <Badge variant="outline">{status.network.mode}</Badge>
          </div>
          <div className="flex justify-between">
            <span>Source</span>
            <span>{status.network.source}</span>
          </div>
          <div className="flex justify-between">
            <span>Weight Cap</span>
            <span>{(status.network.weight_cap * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span>Similarity Threshold</span>
            <span>{(status.co_engagement.config?.min_similarity_threshold * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span>Max Edges</span>
            <span>{status.co_engagement.config?.max_total_edges}</span>
          </div>
        </CardContent>
      </Card>

      {/* Preview Results */}
      {preview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Preview Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm">
                <strong>Network:</strong> {preview.stats?.network?.total_edges || 0} edges, 
                avg weight {((preview.stats?.network?.avg_weight || 0) * 100).toFixed(0)}%
              </div>
              <div className="text-sm">
                <strong>Co-Engagement:</strong> {preview.stats?.co_engagement?.edges_count || 0} edges,
                {preview.stats?.co_engagement?.nodes_count || 0} nodes
              </div>
              
              {preview.co_engagement_edges?.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs font-medium mb-2">Top Co-Engagement Edges:</div>
                  <div className="space-y-1 max-h-40 overflow-auto">
                    {preview.co_engagement_edges.slice(0, 10).map((e: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs bg-muted p-1 rounded">
                        <span>{e.from} ↔ {e.to}</span>
                        <span>{(parseFloat(e.similarity) * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4 text-xs text-muted-foreground">
          <div>⚠️ Network uses co-engagement (not follow graph)</div>
          <div>⚠️ Follow graph not available - confidence capped at 75%</div>
          <div>⚠️ Network weight ≤ 15% (pilot limit)</div>
        </CardContent>
      </Card>
    </div>
  );
}
