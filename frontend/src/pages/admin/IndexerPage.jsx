/**
 * D4 - Admin Indexer Control Page
 * 
 * Управление DEX индексатором:
 * - Переключение режимов (LIMITED/STANDARD/FULL)
 * - Pause/Resume
 * - Boost mode
 * - RPC providers
 * - Checkpoints & progress
 */
import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  HardDrive,
  Play,
  Pause,
  Zap,
  RefreshCw,
  Server,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Status badge colors
const STATUS_COLORS = {
  RUNNING: 'bg-green-100 text-green-700 border-green-200',
  DEGRADED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  PAUSED: 'bg-blue-100 text-blue-700 border-blue-200',
  ERROR: 'bg-red-100 text-red-700 border-red-200',
  OK: 'bg-green-100 text-green-700',
};

const MODE_DESCRIPTIONS = {
  LIMITED: 'Минимальная нагрузка, только POOLS. Для free tier RPC.',
  STANDARD: 'Стандартный режим, все стадии. Для paid tier.',
  FULL: 'Максимальная скорость. Требует premium RPC.',
};

export default function IndexerPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [boostMinutes, setBoostMinutes] = useState(10);

  // Fetch status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/indexer/status`);
      const data = await res.json();
      if (data.ok) {
        setStatus(data);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch status');
      }
    } catch (err) {
      setError('Indexer unavailable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Actions
  const doAction = async (endpoint, body = null) => {
    setActionLoading(endpoint);
    try {
      const res = await fetch(`${API_URL}/api/admin/indexer/${endpoint}`, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      await fetchStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const setMode = (mode) => doAction('mode', { mode });
  const pause = () => doAction('pause');
  const resume = () => doAction('resume');
  const boost = () => doAction('boost', { minutes: boostMinutes });
  const toggleProvider = (network, providerId, enabled) =>
    doAction(`rpc/${enabled ? 'enable' : 'disable'}`, { network, providerId });

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </AdminLayout>
    );
  }

  const indexer = status?.indexer || {};
  const rpcPools = status?.rpcPools || {};
  const checkpoints = status?.checkpoints || {};
  const summary = status?.summary || {};

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HardDrive className="w-6 h-6 text-slate-700" />
            <h1 className="text-xl font-semibold text-slate-900">Indexer Control</h1>
          </div>
          <button
            onClick={fetchStatus}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Status Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <StatusBadge status={indexer.runtimeStatus || 'RUNNING'} />
              <div className="text-sm text-slate-600">
                Mode: <span className="font-medium text-slate-900">{indexer.mode}</span>
              </div>
              {indexer.boostActive && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                  <Zap className="w-3 h-3" />
                  BOOST
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500">
              {summary.activeProviders}/{summary.totalProviders} providers · {summary.networks?.length || 0} networks
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Control Panel */}
          <div className="space-y-4">
            {/* Mode Switcher */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <h3 className="font-medium text-slate-900 mb-3">Indexer Mode</h3>
              <div className="space-y-2">
                {['LIMITED', 'STANDARD', 'FULL'].map((mode) => (
                  <label
                    key={mode}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      indexer.mode === mode
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="mode"
                      checked={indexer.mode === mode}
                      onChange={() => setMode(mode)}
                      disabled={actionLoading}
                      className="text-blue-600"
                    />
                    <div>
                      <div className="font-medium text-slate-900">{mode}</div>
                      <div className="text-xs text-slate-500">{MODE_DESCRIPTIONS[mode]}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Pause/Resume */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <h3 className="font-medium text-slate-900 mb-3">Control</h3>
              <div className="flex gap-2">
                <button
                  onClick={pause}
                  disabled={indexer.paused || actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Pause className="w-4 h-4" />
                  Pause
                </button>
                <button
                  onClick={resume}
                  disabled={!indexer.paused || actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-4 h-4" />
                  Resume
                </button>
              </div>
            </div>

            {/* Boost */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <h3 className="font-medium text-slate-900 mb-3">Boost Mode</h3>
              <p className="text-xs text-slate-500 mb-3">
                Временно включить FULL mode для быстрого catch-up
              </p>
              <div className="flex gap-2">
                <select
                  value={boostMinutes}
                  onChange={(e) => setBoostMinutes(Number(e.target.value))}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  <option value={5}>5 минут</option>
                  <option value={10}>10 минут</option>
                  <option value={30}>30 минут</option>
                  <option value={60}>60 минут</option>
                </select>
                <button
                  onClick={boost}
                  disabled={indexer.boostActive || actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
                >
                  <Zap className="w-4 h-4" />
                  Boost
                </button>
              </div>
            </div>
          </div>

          {/* Monitoring Panel */}
          <div className="space-y-4">
            {/* Networks Status */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <h3 className="font-medium text-slate-900 mb-3">Networks</h3>
              <div className="space-y-2">
                {Object.entries(rpcPools).map(([network, pool]) => (
                  <div
                    key={network}
                    className="flex items-center justify-between p-2 bg-slate-50 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-900 capitalize">{network}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={pool.availableProviders > 0 ? 'text-green-600' : 'text-red-600'}>
                        {pool.availableProviders}/{pool.totalProviders} providers
                      </span>
                      <span className="text-slate-500">
                        {pool.totalRps} rps
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Checkpoints / Stage Progress */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <h3 className="font-medium text-slate-900 mb-3">Stage Progress</h3>
              <div className="space-y-2">
                {Object.entries(checkpoints).length > 0 ? (
                  Object.entries(checkpoints).map(([key, cp]) => (
                    <div key={key} className="p-2 bg-slate-50 rounded">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-700">{cp.stage}</span>
                        <StatusDot status={cp.status} />
                      </div>
                      <div className="text-xs text-slate-500">
                        Block: {cp.lastBlock?.toLocaleString()} · {cp.network}/{cp.dex}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-500 text-center py-4">
                    No checkpoints yet
                  </div>
                )}
              </div>
            </div>

            {/* RPC Providers */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <h3 className="font-medium text-slate-900 mb-3">RPC Providers</h3>
              <div className="space-y-3">
                {Object.entries(rpcPools).map(([network, pool]) => (
                  <div key={network}>
                    <div className="text-xs font-medium text-slate-500 uppercase mb-1">{network}</div>
                    <div className="space-y-1">
                      {pool.providers?.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-2 bg-slate-50 rounded text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <Server className="w-3 h-3 text-slate-400" />
                            <span>{p.id}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ProviderStatusBadge status={p.status} inCooldown={p.inCooldown} />
                            <button
                              onClick={() => toggleProvider(network, p.id, !p.enabled)}
                              disabled={actionLoading}
                              className={`px-2 py-0.5 text-xs rounded ${
                                p.enabled
                                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                  : 'bg-green-100 text-green-600 hover:bg-green-200'
                              }`}
                            >
                              {p.enabled ? 'Disable' : 'Enable'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// Components
function StatusBadge({ status }) {
  const colors = STATUS_COLORS[status] || 'bg-slate-100 text-slate-700';
  const Icon = status === 'RUNNING' ? CheckCircle : status === 'ERROR' ? XCircle : Activity;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium border ${colors}`}>
      <Icon className="w-4 h-4" />
      {status}
    </span>
  );
}

function StatusDot({ status }) {
  const color = status === 'OK' ? 'bg-green-500' : status === 'ERROR' ? 'bg-red-500' : 'bg-amber-500';
  return <span className={`w-2 h-2 rounded-full ${color}`} />;
}

function ProviderStatusBadge({ status, inCooldown }) {
  if (inCooldown) {
    return (
      <span className="flex items-center gap-1 text-xs text-amber-600">
        <Clock className="w-3 h-3" />
        Cooldown
      </span>
    );
  }
  
  const colors = {
    HEALTHY: 'text-green-600',
    DEGRADED: 'text-amber-600',
    DISABLED: 'text-red-600',
  };
  
  return <span className={`text-xs ${colors[status] || 'text-slate-500'}`}>{status}</span>;
}
