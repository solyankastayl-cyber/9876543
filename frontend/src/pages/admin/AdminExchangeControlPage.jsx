/**
 * Y2 — Exchange Admin Page
 * =========================
 * 
 * Admin Control Plane for Exchange providers and jobs.
 * 
 * Features:
 * - View all providers (Bybit, Binance, Mock)
 * - Enable/disable providers
 * - Change provider priorities
 * - Test provider connectivity
 * - Reset circuit breakers
 * - View and manage jobs
 * - Health overview with alerts
 */

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { Input } from '../../components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs';
import {
  Server,
  RefreshCw,
  PlayCircle,
  StopCircle,
  TestTube,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Loader2,
  Clock,
  Zap,
  Settings,
  TrendingUp,
  Globe,
  Wifi,
  WifiOff,
  Plus,
  Trash2,
  Shield,
} from 'lucide-react';
import api from '../../lib/api';

// ═══════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════

function HealthBadge({ status }) {
  const config = {
    UP: { color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle, text: 'UP' },
    DEGRADED: { color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: AlertTriangle, text: 'DEGRADED' },
    DOWN: { color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle, text: 'DOWN' },
  }[status] || { color: 'bg-slate-500/10 text-slate-500 border-slate-500/20', icon: Activity, text: status };
  
  const Icon = config.icon;
  
  return (
    <Badge variant="outline" className={`${config.color} font-medium`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.text}
    </Badge>
  );
}

function JobStatusBadge({ status, running }) {
  if (running) {
    return (
      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-medium">
        <Activity className="w-3 h-3 mr-1 animate-pulse" />
        RUNNING
      </Badge>
    );
  }
  
  const config = {
    IDLE: { color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', text: 'IDLE' },
    STOPPED: { color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', text: 'STOPPED' },
    ERROR: { color: 'bg-red-500/10 text-red-500 border-red-500/20', text: 'ERROR' },
  }[status] || { color: 'bg-slate-500/10 text-slate-400', text: status };
  
  return (
    <Badge variant="outline" className={`${config.color} font-medium`}>
      {config.text}
    </Badge>
  );
}

function ProviderCard({ provider, onToggle, onPriorityChange, onTest, onReset, testSymbol, loading }) {
  const [localPriority, setLocalPriority] = useState(provider.priority);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  
  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await onTest(provider.id, testSymbol);
      setTestResult(result);
    } finally {
      setTesting(false);
    }
  };
  
  const handlePriorityBlur = () => {
    if (localPriority !== provider.priority && localPriority >= 0) {
      onPriorityChange(provider.id, localPriority);
    }
  };
  
  return (
    <div 
      className={`p-4 rounded-lg border transition-all shadow-sm ${
        provider.enabled 
          ? 'bg-white border-gray-200' 
          : 'bg-gray-50 border-gray-200 opacity-60'
      }`}
      data-testid={`exchange-provider-${provider.id}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${provider.enabled ? 'bg-indigo-50' : 'bg-gray-100'}`}>
            <Server className={`w-5 h-5 ${provider.enabled ? 'text-indigo-500' : 'text-gray-400'}`} />
          </div>
          <div>
            <p className="font-semibold text-gray-800">{provider.id}</p>
            <p className="text-xs text-gray-500">Priority: {provider.priority}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <HealthBadge status={provider.health?.status || 'UP'} />
          <Switch
            checked={provider.enabled}
            onCheckedChange={(checked) => onToggle(provider.id, checked)}
            disabled={loading}
            data-testid={`provider-toggle-${provider.id}`}
          />
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="p-2 bg-gray-50 rounded text-center">
          <p className="text-xs text-gray-500">Priority</p>
          <Input
            type="number"
            min={0}
            value={localPriority}
            onChange={(e) => setLocalPriority(Number(e.target.value))}
            onBlur={handlePriorityBlur}
            className="h-7 w-16 mx-auto text-center bg-white border-gray-300 text-gray-800"
            data-testid={`provider-priority-${provider.id}`}
          />
        </div>
        <div className="p-2 bg-gray-50 rounded text-center">
          <p className="text-xs text-gray-500">Errors</p>
          <p className={`font-semibold ${provider.health?.errorCount > 0 ? 'text-red-500' : 'text-gray-700'}`}>
            {provider.health?.errorCount || 0}
          </p>
        </div>
        <div className="p-2 bg-gray-50 rounded text-center">
          <p className="text-xs text-gray-500">Last OK</p>
          <p className="text-xs text-gray-600">
            {provider.health?.lastOkAt 
              ? new Date(provider.health.lastOkAt).toLocaleTimeString()
              : '—'}
          </p>
        </div>
      </div>
      
      {/* Last Error */}
      {provider.health?.lastError && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
          <AlertTriangle className="w-3 h-3 inline mr-1" />
          {provider.health.lastError}
        </div>
      )}
      
      {/* Test Result */}
      {testResult && (
        <div className={`mb-3 p-2 rounded text-xs ${
          testResult.ok 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-600'
            : 'bg-red-50 border border-red-200 text-red-600'
        }`}>
          {testResult.ok ? (
            <>
              <CheckCircle className="w-3 h-3 inline mr-1" />
              Latency: {testResult.latencyMs}ms | Mid: ${testResult.sample?.mid?.toFixed(2)}
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3 inline mr-1" />
              {testResult.error}
            </>
          )}
        </div>
      )}
      
      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-gray-200">
        <Button
          variant="outline"
          size="sm"
          onClick={handleTest}
          disabled={testing || loading}
          className="flex-1 bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          data-testid={`provider-test-${provider.id}`}
        >
          {testing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <TestTube className="w-3 h-3 mr-1" />}
          Test
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onReset(provider.id)}
          disabled={loading}
          className="flex-1 bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          data-testid={`provider-reset-${provider.id}`}
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset
        </Button>
      </div>
    </div>
  );
}

function JobCard({ job, onStart, onStop, onRunOnce, loading }) {
  const [running, setRunning] = useState(false);
  
  const handleRunOnce = async () => {
    setRunning(true);
    try {
      await onRunOnce(job.id);
    } finally {
      setRunning(false);
    }
  };
  
  return (
    <div 
      className="p-4 rounded-lg border bg-white border-gray-200 shadow-sm"
      data-testid={`exchange-job-${job.id}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${job.running ? 'bg-emerald-50' : 'bg-gray-100'}`}>
            <Zap className={`w-5 h-5 ${job.running ? 'text-emerald-500' : 'text-gray-400'}`} />
          </div>
          <div>
            <p className="font-semibold text-gray-800">{job.displayName || job.id}</p>
            <p className="text-xs text-gray-500">
              Interval: {(job.scheduleMs / 1000).toFixed(0)}s
            </p>
          </div>
        </div>
        <JobStatusBadge status={job.status} running={job.running} />
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-2 bg-gray-50 rounded text-center">
          <p className="text-xs text-gray-500">Last Run</p>
          <p className="text-xs text-gray-600">
            {job.lastRunAt 
              ? new Date(job.lastRunAt).toLocaleTimeString()
              : '—'}
          </p>
        </div>
        <div className="p-2 bg-gray-50 rounded text-center">
          <p className="text-xs text-gray-500">Last Status</p>
          <p className={`text-xs font-semibold ${
            job.lastRunStatus === 'OK' ? 'text-emerald-500' : 
            job.lastRunStatus === 'ERROR' ? 'text-red-500' : 'text-gray-500'
          }`}>
            {job.lastRunStatus || '—'}
          </p>
        </div>
      </div>
      
      {/* Symbols */}
      {job.config?.trackedSymbols && (
        <div className="mb-3 flex flex-wrap gap-1">
          {job.config.trackedSymbols.slice(0, 5).map(s => (
            <span key={s} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-700">
              {s}
            </span>
          ))}
          {job.config.trackedSymbols.length > 5 && (
            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-500">
              +{job.config.trackedSymbols.length - 5} more
            </span>
          )}
        </div>
      )}
      
      {/* Error */}
      {job.lastError && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
          <AlertTriangle className="w-3 h-3 inline mr-1" />
          {job.lastError}
        </div>
      )}
      
      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-gray-200">
        {job.running ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStop(job.id)}
            disabled={loading}
            className="flex-1 bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
            data-testid={`job-stop-${job.id}`}
          >
            <StopCircle className="w-3 h-3 mr-1" />
            Stop
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStart(job.id)}
            disabled={loading}
            className="flex-1 bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
            data-testid={`job-start-${job.id}`}
          >
            <PlayCircle className="w-3 h-3 mr-1" />
            Start
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleRunOnce}
          disabled={running || loading}
          className="flex-1 bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          data-testid={`job-run-once-${job.id}`}
        >
          {running ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Zap className="w-3 h-3 mr-1" />}
          Run Once
        </Button>
      </div>
    </div>
  );
}

function AlertCard({ alert }) {
  const config = {
    ERROR: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', icon: XCircle },
    WARN: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', icon: AlertTriangle },
    INFO: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', icon: Activity },
  }[alert.level] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', icon: Activity };
  
  const Icon = config.icon;
  
  return (
    <div className={`p-3 rounded-lg ${config.bg} border ${config.border}`}>
      <div className="flex items-start gap-2">
        <Icon className={`w-4 h-4 mt-0.5 ${config.text}`} />
        <div className="flex-1">
          <p className={`text-sm font-medium ${config.text}`}>{alert.code}</p>
          <p className="text-xs text-gray-500 mt-0.5">{alert.message}</p>
        </div>
        <span className="text-xs text-gray-400">
          {new Date(alert.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// NETWORK TAB COMPONENT
// ═══════════════════════════════════════════════════════════════

function NetworkTab({ onRefresh }) {
  const [networkConfig, setNetworkConfig] = useState(null);
  const [networkHealth, setNetworkHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Proxy form fields (local state for immediate UI updates)
  const [proxyType, setProxyType] = useState('http');
  const [proxyIp, setProxyIp] = useState('');
  const [proxyPort, setProxyPort] = useState('');
  const [proxyUsername, setProxyUsername] = useState('');
  const [proxyPassword, setProxyPassword] = useState('');
  const [proxyTimeout, setProxyTimeout] = useState(8000);
  
  // New proxy form for pool
  const [newProxyId, setNewProxyId] = useState('');
  const [newProxyUrl, setNewProxyUrl] = useState('');
  
  const fetchNetworkData = useCallback(async () => {
    try {
      setLoading(true);
      const [configRes, healthRes] = await Promise.all([
        api.get('/v10/admin/network/config'),
        api.get('/v10/admin/network/health'),
      ]);
      const config = configRes.data.config;
      setNetworkConfig(config);
      setNetworkHealth(healthRes.data.health);
      
      // Populate form fields from config
      if (config.proxy) {
        setProxyType(config.proxy.type || 'http');
        setProxyIp(config.proxy.ip || '');
        setProxyPort(config.proxy.port || '');
        setProxyUsername(config.proxy.username || '');
        setProxyPassword(config.proxy.password || '');
        setProxyTimeout(config.proxy.timeoutMs || 8000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchNetworkData();
  }, [fetchNetworkData]);
  
  const handleTestConnectivity = async () => {
    setTesting(true);
    try {
      const res = await api.post('/v10/admin/network/test');
      // Refresh health after test
      const healthRes = await api.get('/v10/admin/network/health');
      setNetworkHealth(healthRes.data.health);
      alert(`Test complete: ${res.data.summary.ok}/${res.data.summary.total} providers OK`);
    } catch (err) {
      setError(err.message);
    } finally {
      setTesting(false);
    }
  };
  
  const handleUpdateEgressMode = async (mode) => {
    setSaving(true);
    try {
      const res = await api.patch('/v10/admin/network/config', { egressMode: mode });
      setNetworkConfig(res.data.config);
      onRefresh?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };
  
  const handleUpdateProxy = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setError(null);
    
    try {
      // Build URL from separate fields
      let proxyUrl = `${proxyType}://`;
      if (proxyUsername && proxyPassword) {
        proxyUrl += `${proxyUsername}:${proxyPassword}@`;
      } else if (proxyUsername) {
        proxyUrl += `${proxyUsername}@`;
      }
      proxyUrl += `${proxyIp}:${proxyPort}`;
      
      // Save proxy config
      const res = await api.patch('/v10/admin/network/config', {
        proxy: {
          url: proxyUrl,
          type: proxyType,
          ip: proxyIp,
          port: proxyPort,
          username: proxyUsername || '',
          password: proxyPassword || '',
          timeoutMs: proxyTimeout,
          enabled: true,
        },
      });
      setNetworkConfig(res.data.config);
      setSaveSuccess(true);
      
      // Automatically test connectivity after saving
      setTesting(true);
      try {
        await api.post('/v10/admin/network/test');
        const healthRes = await api.get('/v10/admin/network/health');
        setNetworkHealth(healthRes.data.health);
      } catch (testErr) {
        console.error('Test failed:', testErr);
      } finally {
        setTesting(false);
      }
      
      onRefresh?.();
    } catch (err) {
      setError(err.message);
      setSaveSuccess(false);
    } finally {
      setSaving(false);
    }
  };
  
  const handleAddProxy = async () => {
    if (!newProxyId || !newProxyUrl) return;
    
    setSaving(true);
    try {
      await api.post('/v10/admin/network/proxy/add', {
        id: newProxyId,
        url: newProxyUrl,
        weight: 1,
      });
      setNewProxyId('');
      setNewProxyUrl('');
      await fetchNetworkData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };
  
  const handleRemoveProxy = async (id) => {
    if (!confirm(`Remove proxy "${id}"?`)) return;
    
    try {
      await api.delete(`/v10/admin/network/proxy/${id}`);
      await fetchNetworkData();
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleResetProxy = async (id) => {
    try {
      await api.post(`/v10/admin/network/proxy/${id}/reset`);
      await fetchNetworkData();
    } catch (err) {
      setError(err.message);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }
  
  const probes = networkHealth?.probes || [];
  
  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm">
          <AlertTriangle className="w-4 h-4" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-xs hover:underline">Dismiss</button>
        </div>
      )}
      
      {/* Connectivity Status */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-500" />
            <h3 className="font-semibold text-gray-800">Provider Connectivity</h3>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleTestConnectivity}
            disabled={testing}
            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            data-testid="network-test-btn"
          >
            {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TestTube className="w-4 h-4 mr-2" />}
            Test All
          </Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {probes.map(probe => (
            <div 
              key={probe.provider}
              className={`p-3 rounded-lg border ${
                probe.ok 
                  ? 'bg-emerald-50 border-emerald-200' 
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {probe.ok ? (
                  <Wifi className="w-4 h-4 text-emerald-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${probe.ok ? 'text-emerald-700' : 'text-red-700'}`}>
                  {probe.provider}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {probe.ok ? `${probe.latencyMs}ms` : probe.reason || 'DOWN'}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Egress Mode */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-gray-800">Egress Mode</h3>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          {['direct', 'proxy', 'proxy_pool'].map(mode => (
            <button
              key={mode}
              onClick={() => handleUpdateEgressMode(mode)}
              disabled={saving}
              className={`p-4 rounded-lg border text-center transition-colors ${
                networkConfig?.egressMode === mode
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
              data-testid={`egress-mode-${mode}`}
            >
              <div className="font-semibold uppercase">{mode.replace('_', ' ')}</div>
              <div className="text-xs mt-1 text-gray-500">
                {mode === 'direct' && 'Connect directly'}
                {mode === 'proxy' && 'Single proxy'}
                {mode === 'proxy_pool' && 'Proxy rotation'}
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Single Proxy Config */}
      {networkConfig?.egressMode === 'proxy' && (
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Proxy Configuration</h3>
            {/* Proxy Status */}
            {networkConfig.proxy?.ip && (
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                probes.some(p => p.ok && p.provider !== 'COINBASE') 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {probes.some(p => p.ok && p.provider !== 'COINBASE') 
                  ? '● Connected' 
                  : '○ Not Connected'}
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            {/* Success/Error Messages */}
            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                Proxy saved! Testing connectivity...
              </div>
            )}
            
            {/* Proxy Type */}
            <div>
              <label className="text-xs text-gray-500 block mb-2">Proxy Type</label>
              <div className="flex gap-3">
                {['http', 'socks5'].map(type => (
                  <button
                    key={type}
                    onClick={() => setProxyType(type)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      proxyType === type
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                    data-testid={`proxy-type-${type}`}
                  >
                    {type.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            
            {/* IP and Port */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">IP Address</label>
                <Input
                  type="text"
                  value={proxyIp}
                  onChange={(e) => setProxyIp(e.target.value)}
                  placeholder="192.168.1.100"
                  className="bg-white border-gray-300 text-gray-800"
                  data-testid="proxy-ip-input"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Port</label>
                <Input
                  type="text"
                  value={proxyPort}
                  onChange={(e) => setProxyPort(e.target.value)}
                  placeholder="8080"
                  className="bg-white border-gray-300 text-gray-800"
                  data-testid="proxy-port-input"
                />
              </div>
            </div>
            
            {/* Login and Password */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Login (Username)</label>
                <Input
                  type="text"
                  value={proxyUsername}
                  onChange={(e) => setProxyUsername(e.target.value)}
                  placeholder="username"
                  className="bg-white border-gray-300 text-gray-800"
                  data-testid="proxy-username-input"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Password</label>
                <Input
                  type="password"
                  value={proxyPassword}
                  onChange={(e) => setProxyPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-white border-gray-300 text-gray-800"
                  data-testid="proxy-password-input"
                />
              </div>
            </div>
            
            {/* Timeout */}
            <div>
              <label className="text-xs text-gray-500 block mb-1">Timeout (ms)</label>
              <Input
                type="number"
                value={proxyTimeout}
                onChange={(e) => setProxyTimeout(parseInt(e.target.value) || 8000)}
                className="bg-white border-gray-300 text-gray-800 w-32"
              />
            </div>
            
            {/* Preview */}
            {proxyIp && proxyPort && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <label className="text-xs text-gray-500 block mb-1">Generated URL</label>
                <code className="text-sm text-gray-700">
                  {proxyType}://
                  {proxyUsername ? `${proxyUsername}:***@` : ''}
                  {proxyIp}:{proxyPort}
                </code>
              </div>
            )}
            
            {/* Save Button */}
            <Button 
              onClick={handleUpdateProxy}
              disabled={saving || testing || !proxyIp || !proxyPort}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              data-testid="save-proxy-btn"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                'Save & Test Proxy'
              )}
            </Button>
          </div>
        </div>
      )}
      
      {/* Proxy Pool */}
      {networkConfig?.egressMode === 'proxy_pool' && (
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Proxy Pool</h3>
          
          {/* Existing proxies */}
          {networkConfig.proxyPool?.length > 0 ? (
            <div className="space-y-2 mb-4">
              {networkConfig.proxyPool.map(proxy => (
                <div 
                  key={proxy.id}
                  className={`p-3 rounded-lg border flex items-center justify-between ${
                    proxy.enabled 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div>
                    <span className="font-medium text-gray-800">{proxy.id}</span>
                    <span className="text-xs text-gray-500 ml-2">{proxy.url}</span>
                    {proxy.errorCount > 0 && (
                      <span className="text-xs text-red-500 ml-2">({proxy.errorCount} errors)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleResetProxy(proxy.id)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleRemoveProxy(proxy.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm mb-4">No proxies in pool</p>
          )}
          
          {/* Add new proxy */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-500 block mb-1">Proxy ID</label>
              <Input
                value={newProxyId}
                onChange={(e) => setNewProxyId(e.target.value)}
                placeholder="proxy-1"
                className="bg-white border-gray-300 text-gray-800"
              />
            </div>
            <div className="flex-[2]">
              <label className="text-xs text-gray-500 block mb-1">Proxy URL</label>
              <Input
                value={newProxyUrl}
                onChange={(e) => setNewProxyUrl(e.target.value)}
                placeholder="http://user:pass@ip:port"
                className="bg-white border-gray-300 text-gray-800"
              />
            </div>
            <Button 
              onClick={handleAddProxy}
              disabled={saving || !newProxyId || !newProxyUrl}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              data-testid="add-proxy-btn"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function AdminExchangeControlPage() {
  const [providers, setProviders] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testSymbol, setTestSymbol] = useState('BTCUSDT');
  
  // ─────────────────────────────────────────────────────────────
  // DATA FETCHING
  // ─────────────────────────────────────────────────────────────
  
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [providersRes, jobsRes, healthRes] = await Promise.all([
        api.get('/v10/exchange/admin/providers'),
        api.get('/v10/exchange/admin/jobs'),
        api.get('/v10/exchange/admin/health'),
      ]);
      
      setProviders(providersRes.data?.providers || []);
      setJobs(jobsRes.data?.jobs || []);
      setHealth(healthRes.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);
  
  // ─────────────────────────────────────────────────────────────
  // PROVIDER ACTIONS
  // ─────────────────────────────────────────────────────────────
  
  const handleToggleProvider = async (id, enabled) => {
    try {
      await api.patch(`/v10/exchange/admin/providers/${id}`, { enabled });
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handlePriorityChange = async (id, priority) => {
    try {
      await api.patch(`/v10/exchange/admin/providers/${id}`, { priority });
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleTestProvider = async (id, symbol) => {
    try {
      const res = await api.post(`/v10/exchange/admin/providers/${id}/test`, { symbol });
      return res.data;
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };
  
  const handleResetProvider = async (id) => {
    try {
      await api.post(`/v10/exchange/admin/providers/${id}/reset`);
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  };
  
  // ─────────────────────────────────────────────────────────────
  // JOB ACTIONS
  // ─────────────────────────────────────────────────────────────
  
  const handleStartJob = async (id) => {
    try {
      await api.post(`/v10/exchange/admin/jobs/${id}/start`);
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleStopJob = async (id) => {
    try {
      await api.post(`/v10/exchange/admin/jobs/${id}/stop`);
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleRunOnce = async (id) => {
    try {
      await api.post(`/v10/exchange/admin/jobs/${id}/run-once`, { symbol: testSymbol });
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  };
  
  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  
  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Settings className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Exchange Control</h1>
              <p className="text-sm text-gray-500">Manage data providers and ingestion jobs</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Test Symbol:</span>
              <Input
                value={testSymbol}
                onChange={(e) => setTestSymbol(e.target.value.toUpperCase())}
                className="w-28 h-8 bg-white border-gray-300 text-gray-800"
                placeholder="BTCUSDT"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={fetchData} 
              disabled={loading}
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              data-testid="exchange-refresh-btn"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        
        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            {error}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:bg-red-100"
            >
              Dismiss
            </Button>
          </div>
        )}
        
        {/* Health Summary */}
        {health && (
          <div className="grid grid-cols-4 gap-4" data-testid="exchange-health-summary">
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Server className="w-4 h-4 text-indigo-500" />
                <span className="text-xs text-gray-500 uppercase">Providers</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-800">{health.providers?.up || 0}</span>
                <span className="text-sm text-gray-500">/ {health.providers?.total || 0}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {health.providers?.degraded > 0 && (
                  <span className="text-amber-500">{health.providers.degraded} degraded</span>
                )}
                {health.providers?.down > 0 && (
                  <span className="text-red-500 ml-2">{health.providers.down} down</span>
                )}
              </div>
            </div>
            
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-gray-500 uppercase">Jobs</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-800">{health.jobs?.running || 0}</span>
                <span className="text-sm text-gray-500">/ {health.jobs?.total || 0}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {health.jobs?.error > 0 && (
                  <span className="text-red-500">{health.jobs.error} with errors</span>
                )}
              </div>
            </div>
            
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <span className="text-xs text-gray-500 uppercase">Data Mode</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-xl font-bold ${
                  health.dataStatus?.mode === 'LIVE' ? 'text-emerald-500' :
                  health.dataStatus?.mode === 'MOCK' ? 'text-amber-500' : 'text-gray-600'
                }`}>
                  {health.dataStatus?.mode || 'UNKNOWN'}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {health.dataStatus?.activeSymbols || 0} active symbols
              </div>
            </div>
            
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-gray-500 uppercase">Alerts</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${
                  (health.alerts?.length || 0) > 0 ? 'text-amber-500' : 'text-gray-600'
                }`}>
                  {health.alerts?.length || 0}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {(health.alerts?.length || 0) === 0 ? 'All systems normal' : 'Attention needed'}
              </div>
            </div>
          </div>
        )}
        
        {/* Tabs */}
        <Tabs defaultValue="providers" className="w-full">
          <TabsList className="bg-gray-100 border border-gray-200">
            <TabsTrigger value="providers" className="data-[state=active]:bg-white data-[state=active]:text-gray-800">
              <Server className="w-4 h-4 mr-2" />
              Providers ({providers.length})
            </TabsTrigger>
            <TabsTrigger value="jobs" className="data-[state=active]:bg-white data-[state=active]:text-gray-800">
              <Zap className="w-4 h-4 mr-2" />
              Jobs ({jobs.length})
            </TabsTrigger>
            <TabsTrigger value="network" className="data-[state=active]:bg-white data-[state=active]:text-gray-800" data-testid="network-tab">
              <Globe className="w-4 h-4 mr-2" />
              Network
            </TabsTrigger>
            <TabsTrigger value="alerts" className="data-[state=active]:bg-white data-[state=active]:text-gray-800">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Alerts ({health?.alerts?.length || 0})
            </TabsTrigger>
          </TabsList>
          
          {/* Providers Tab */}
          <TabsContent value="providers" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : providers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Server className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No providers configured</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {providers
                  .sort((a, b) => b.priority - a.priority)
                  .map(provider => (
                    <ProviderCard
                      key={provider.id}
                      provider={provider}
                      onToggle={handleToggleProvider}
                      onPriorityChange={handlePriorityChange}
                      onTest={handleTestProvider}
                      onReset={handleResetProvider}
                      testSymbol={testSymbol}
                      loading={loading}
                    />
                  ))}
              </div>
            )}
          </TabsContent>
          
          {/* Jobs Tab */}
          <TabsContent value="jobs" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No jobs configured</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {jobs.map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onStart={handleStartJob}
                    onStop={handleStopJob}
                    onRunOnce={handleRunOnce}
                    loading={loading}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Network Tab */}
          <TabsContent value="network" className="mt-4">
            <NetworkTab onRefresh={fetchData} />
          </TabsContent>
          
          {/* Alerts Tab */}
          <TabsContent value="alerts" className="mt-4">
            {!health?.alerts || health.alerts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-400" />
                <p className="text-emerald-600">All systems operational</p>
              </div>
            ) : (
              <div className="space-y-3">
                {health.alerts.map((alert, idx) => (
                  <AlertCard key={idx} alert={alert} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
