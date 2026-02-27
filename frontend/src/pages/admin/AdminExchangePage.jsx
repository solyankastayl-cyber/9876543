/**
 * S10.1 — Admin Exchange Control Panel
 * 
 * Admin UI for Exchange module:
 * - Enable/disable module
 * - View provider health
 * - Configure polling
 * - Monitor rate limits
 * - Capital Monitor (v4.8.0)
 */

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Activity, 
  Play, 
  Pause, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Database,
  Server,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { api } from '@/api/client';
import CapitalMonitor from '@/components/exchange/CapitalMonitor';

const STATUS_CONFIG = {
  OK: { color: 'bg-green-500', label: 'Healthy', icon: CheckCircle },
  DEGRADED: { color: 'bg-yellow-500', label: 'Degraded', icon: AlertCircle },
  DOWN: { color: 'bg-red-500', label: 'Down', icon: XCircle },
  UNKNOWN: { color: 'bg-gray-500', label: 'Unknown', icon: AlertCircle },
};

export default function AdminExchangePage() {
  const [config, setConfig] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');

  const fetchData = async () => {
    try {
      const [configRes, healthRes] = await Promise.all([
        api.get('/api/admin/exchange/config'),
        api.get('/api/admin/exchange/health'),
      ]);

      if (configRes.data?.ok) {
        setConfig(configRes.data.data);
      }
      if (healthRes.data?.ok) {
        setHealth(healthRes.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch exchange admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const updateConfig = async (updates) => {
    setSaving(true);
    try {
      const res = await api.patch('/api/admin/exchange/config', updates);
      if (res.data?.ok) {
        setConfig(res.data.data);
      }
    } catch (error) {
      console.error('Failed to update config:', error);
    } finally {
      setSaving(false);
    }
  };

  const togglePolling = async (start) => {
    try {
      const endpoint = start ? '/api/admin/exchange/start' : '/api/admin/exchange/stop';
      await api.post(endpoint);
      await fetchData();
    } catch (error) {
      console.error('Failed to toggle polling:', error);
    }
  };

  const addSymbol = () => {
    if (newSymbol && config && !config.symbols.includes(newSymbol.toUpperCase())) {
      updateConfig({ symbols: [...config.symbols, newSymbol.toUpperCase()] });
      setNewSymbol('');
    }
  };

  const removeSymbol = (symbol) => {
    if (config) {
      updateConfig({ symbols: config.symbols.filter(s => s !== symbol) });
    }
  };

  const providerStatus = health?.provider?.status || 'UNKNOWN';
  const StatusConfig = STATUS_CONFIG[providerStatus] || STATUS_CONFIG.UNKNOWN;
  const StatusIcon = StatusConfig.icon;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6" data-testid="admin-exchange-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Exchange Module</h1>
            <p className="text-sm text-gray-500 mt-1">
              S10.1 — Exchange Intelligence Control Panel
            </p>
          </div>
          <Button variant="outline" onClick={fetchData} size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Provider Health */}
          <Card data-testid="provider-health-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5 text-gray-400" />
                Provider Health
              </CardTitle>
              <CardDescription>Binance Futures connection status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <Badge className={`${StatusConfig.color} text-white`}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {StatusConfig.label}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Latency</span>
                <span className="text-sm font-medium">{health?.provider?.latencyMs || 0}ms</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Rate Limit Used</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        (health?.provider?.rateLimitUsed || 0) > 80 ? 'bg-red-500' :
                        (health?.provider?.rateLimitUsed || 0) > 50 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${health?.provider?.rateLimitUsed || 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{(health?.provider?.rateLimitUsed || 0).toFixed(0)}%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Errors</span>
                <span className={`text-sm font-medium ${
                  (health?.provider?.errorCount || 0) > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {health?.provider?.errorCount || 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Last Update</span>
                <span className="text-xs text-gray-400">
                  {health?.provider?.lastUpdate 
                    ? new Date(health.provider.lastUpdate).toLocaleTimeString() 
                    : 'Never'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Polling Control */}
          <Card data-testid="polling-control-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-gray-400" />
                Polling Control
              </CardTitle>
              <CardDescription>Manage data fetching</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Module Enabled</Label>
                  <p className="text-xs text-gray-400">Turn exchange module on/off</p>
                </div>
                <Switch
                  checked={config?.enabled || false}
                  onCheckedChange={(checked) => updateConfig({ enabled: checked })}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Polling Status</Label>
                  <p className="text-xs text-gray-400">
                    {health?.polling?.running ? 'Currently fetching data' : 'Polling stopped'}
                  </p>
                </div>
                {health?.polling?.running ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Running
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-gray-50 text-gray-500">
                    <Pause className="w-3 h-3 mr-1" />
                    Stopped
                  </Badge>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => togglePolling(true)}
                  disabled={health?.polling?.running}
                  className="flex-1"
                  size="sm"
                >
                  <Play className="w-4 h-4 mr-1" />
                  Start
                </Button>
                <Button
                  onClick={() => togglePolling(false)}
                  disabled={!health?.polling?.running}
                  variant="outline"
                  className="flex-1"
                  size="sm"
                >
                  <Pause className="w-4 h-4 mr-1" />
                  Stop
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Polling Interval (ms)</Label>
                <Input
                  type="number"
                  value={config?.pollingIntervalMs || 30000}
                  onChange={(e) => updateConfig({ pollingIntervalMs: parseInt(e.target.value) })}
                  min={10000}
                  max={300000}
                  step={5000}
                />
                <p className="text-xs text-gray-400">
                  Minimum 10s, maximum 5min
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cache Status */}
          <Card data-testid="cache-status-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-gray-400" />
                Data Cache
              </CardTitle>
              <CardDescription>Current cached data counts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-gray-500">Markets</span>
                <span className="text-sm font-medium">{health?.cache?.markets || 0}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-gray-500">Order Books</span>
                <span className="text-sm font-medium">{health?.cache?.orderBooks || 0}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-gray-500">Trade Flows</span>
                <span className="text-sm font-medium">{health?.cache?.tradeFlows || 0}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-gray-500">Open Interest</span>
                <span className="text-sm font-medium">{health?.cache?.openInterest || 0}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-500">Liquidations</span>
                <span className="text-sm font-medium">{health?.cache?.liquidations || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Symbols Configuration */}
        <Card data-testid="symbols-config-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-400" />
              Tracked Symbols
            </CardTitle>
            <CardDescription>
              Configure which symbols to track for detailed data (order book, OI, liquidations)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {config?.symbols?.map((symbol) => (
                <Badge 
                  key={symbol} 
                  variant="secondary"
                  className="px-3 py-1 cursor-pointer hover:bg-red-100 hover:text-red-700 transition-colors"
                  onClick={() => removeSymbol(symbol)}
                >
                  {symbol}
                  <XCircle className="w-3 h-3 ml-2" />
                </Badge>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="Add symbol (e.g., DOGEUSDT)"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                className="max-w-xs"
              />
              <Button onClick={addSymbol} variant="outline" size="sm">
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Capital Monitor Widget (v4.8.0) */}
        <div data-testid="capital-monitor-section">
          <CapitalMonitor />
        </div>
      </div>
    </AdminLayout>
  );
}
