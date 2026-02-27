/**
 * BLOCK L2 + L3 — Lifecycle Tab
 * 
 * Unified lifecycle observability + governance controls
 * - Constitution Binding (L3.1)
 * - Drift Auto-Revoke (L3.2) 
 * - Drift Recovery (L3.3)
 * - State Integrity (L3.4)
 * - Auto-Promotion (L3.5)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  RefreshCw, AlertTriangle, CheckCircle, Clock, 
  Play, Square, RotateCcw, Zap, Shield, Activity,
  Hash, TrendingUp, AlertCircle, ShieldCheck, ArrowUpCircle
} from 'lucide-react';
import {
  fetchLifecycleState,
  fetchLifecycleEvents,
  forceWarmup,
  forceApply,
  revokeModel,
  resetSimulation,
  initializeLifecycle,
  applyConstitution,
  updateDrift,
  incrementLiveSamples,
  checkIntegrity,
} from '../../../api/lifecycle.api';

// Status badge colors
const STATUS_CONFIG = {
  SIMULATION: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: Activity, label: 'Simulation' },
  WARMUP: { color: 'bg-amber-100 text-amber-800 border-amber-300', icon: Clock, label: 'Warmup' },
  APPLIED: { color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle, label: 'Applied' },
  APPLIED_MANUAL: { color: 'bg-green-100 text-green-800 border-green-300', icon: Shield, label: 'Applied (Manual)' },
  REVOKED: { color: 'bg-red-100 text-red-800 border-red-300', icon: AlertTriangle, label: 'Revoked' },
};

const DRIFT_CONFIG = {
  OK: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  WATCH: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  WARN: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  CRITICAL: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
};

const MODE_CONFIG = {
  DEV: { color: 'bg-purple-100 text-purple-800', label: 'DEV' },
  PROD: { color: 'bg-emerald-100 text-emerald-800', label: 'PROD' },
};

// Combined Status Card
function CombinedStatusCard({ combined }) {
  if (!combined) return null;
  
  return (
    <div className={`rounded-xl border-2 p-4 mb-6 ${combined.ready ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${combined.ready ? 'bg-emerald-500' : 'bg-gray-400'}`}>
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Combined Mode</h3>
            <p className={`text-sm ${combined.ready ? 'text-emerald-600' : 'text-gray-500'}`}>
              {combined.ready ? 'READY — Both models applied in PROD' : 'DISABLED'}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${combined.ready ? 'bg-emerald-500 text-white' : 'bg-gray-300 text-gray-700'}`}>
          {combined.ready ? 'ACTIVE' : 'BLOCKED'}
        </span>
      </div>
      
      {!combined.ready && combined.blockers?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Blockers:</p>
          <div className="flex flex-wrap gap-2">
            {combined.blockers.map((blocker, i) => (
              <span key={i} className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                {blocker}
              </span>
            ))}
          </div>
          {combined.suggestedAction && (
            <p className="mt-2 text-sm text-blue-600">
              Suggested: {combined.suggestedAction}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// L3 Dev Controls Panel
function DevControlsPanel({ onAction, loading, systemMode }) {
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [driftLevel, setDriftLevel] = useState('OK');
  const [constitutionHash, setConstitutionHash] = useState('');
  const [sampleCount, setSampleCount] = useState(1);

  if (systemMode !== 'DEV') return null;

  return (
    <div className="bg-purple-50 rounded-xl border border-purple-200 p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-purple-900">DEV Controls (L3 Testing)</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Asset Selector */}
        <div>
          <label className="text-xs text-gray-600 block mb-1">Asset</label>
          <select 
            value={selectedAsset} 
            onChange={e => setSelectedAsset(e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
          >
            <option value="BTC">BTC</option>
            <option value="SPX">SPX</option>
          </select>
        </div>
        
        {/* Drift Simulator */}
        <div>
          <label className="text-xs text-gray-600 block mb-1">Drift Level</label>
          <div className="flex gap-1">
            <select 
              value={driftLevel} 
              onChange={e => setDriftLevel(e.target.value)}
              className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-sm"
            >
              <option value="OK">OK</option>
              <option value="WATCH">WATCH</option>
              <option value="WARN">WARN</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
            <button
              onClick={() => onAction('drift', selectedAsset, { severity: driftLevel })}
              disabled={loading}
              className="px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 disabled:opacity-50"
            >
              Set
            </button>
          </div>
        </div>
        
        {/* Live Samples */}
        <div>
          <label className="text-xs text-gray-600 block mb-1">Add Samples</label>
          <div className="flex gap-1">
            <input 
              type="number" 
              min="1" 
              max="30"
              value={sampleCount}
              onChange={e => setSampleCount(parseInt(e.target.value) || 1)}
              className="w-16 px-2 py-1.5 border border-gray-200 rounded text-sm"
            />
            <button
              onClick={() => onAction('samples', selectedAsset, { count: sampleCount })}
              disabled={loading}
              className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50"
            >
              +{sampleCount}
            </button>
          </div>
        </div>
        
        {/* Constitution Hash */}
        <div>
          <label className="text-xs text-gray-600 block mb-1">Constitution</label>
          <div className="flex gap-1">
            <input 
              type="text" 
              placeholder="hash..."
              value={constitutionHash}
              onChange={e => setConstitutionHash(e.target.value)}
              className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-sm font-mono"
            />
            <button
              onClick={() => onAction('constitution', selectedAsset, { hash: constitutionHash || `hash_${Date.now()}` })}
              disabled={loading}
              className="px-2 py-1 bg-indigo-500 text-white text-xs rounded hover:bg-indigo-600 disabled:opacity-50"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-purple-200 flex gap-2">
        <button
          onClick={() => onAction('integrity', selectedAsset)}
          disabled={loading}
          className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1"
        >
          <ShieldCheck className="w-4 h-4" /> Check Integrity
        </button>
      </div>
    </div>
  );
}

// Lifecycle Card for BTC/SPX
function LifecycleCard({ state, onAction, loading }) {
  if (!state) return null;
  
  const statusConfig = STATUS_CONFIG[state.status] || STATUS_CONFIG.SIMULATION;
  const StatusIcon = statusConfig.icon;
  const modeConfig = MODE_CONFIG[state.systemMode] || MODE_CONFIG.DEV;
  const driftConfig = DRIFT_CONFIG[state.drift?.severity] || DRIFT_CONFIG.OK;
  
  const warmupProgress = state.warmup?.progressPct || 0;
  const liveSamples = state.live?.liveSamples || 0;
  const isRevoked = state.status === 'REVOKED';
  const isApplied = state.status === 'APPLIED' || state.status === 'APPLIED_MANUAL';
  
  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${isRevoked ? 'border-red-300' : 'border-gray-200'}`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b flex items-center justify-between ${isRevoked ? 'bg-red-50 border-red-200' : 'border-gray-100'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${state.modelId === 'BTC' ? 'bg-orange-500' : 'bg-blue-500'}`}>
            <span className="text-white font-bold text-sm">{state.modelId}</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{state.modelId} Terminal</h3>
            <p className="text-xs text-gray-500">v{state.engineVersion || '2.1'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${modeConfig.color}`}>
            {modeConfig.label}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${statusConfig.color}`}>
            <StatusIcon className="w-3 h-3" />
            {statusConfig.label}
          </span>
        </div>
      </div>
      
      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Revoked Warning */}
        {isRevoked && (
          <div className="p-3 bg-red-100 rounded-lg border border-red-300 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Model Revoked</p>
              <p className="text-xs text-red-600">Drift protection triggered. Re-enter warmup to reactivate.</p>
            </div>
          </div>
        )}
        
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Live Samples</p>
            <p className="text-lg font-semibold text-gray-900">{liveSamples}/30</p>
            <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${liveSamples >= 30 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(100, (liveSamples / 30) * 100)}%` }}
              />
            </div>
          </div>
          
          <div className={`p-3 rounded-lg border ${driftConfig.bg} ${driftConfig.border}`}>
            <p className="text-xs text-gray-500">Drift Severity</p>
            <p className={`text-lg font-semibold ${driftConfig.color}`}>
              {state.drift?.severity || 'OK'}
            </p>
            {state.drift?.lastCheckedAt && (
              <p className="text-xs text-gray-400">
                {new Date(state.drift.lastCheckedAt).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        
        {/* Warmup Progress (if in warmup) */}
        {state.status === 'WARMUP' && (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-amber-800">Warmup Progress</span>
              <span className="text-sm text-amber-600">{warmupProgress}%</span>
            </div>
            <div className="h-2 bg-amber-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${warmupProgress}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-amber-600">
              {state.warmup?.resolvedDays || 0} / {state.warmup?.targetDays || 30} days
            </p>
          </div>
        )}
        
        {/* Constitution Hash (L3.1) */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Hash className="w-4 h-4 text-gray-400" />
            <p className="text-xs text-gray-500">Constitution Hash</p>
          </div>
          <p className="font-mono text-xs text-gray-600 truncate">
            {state.constitutionHash || '—'}
          </p>
          {state.governanceAppliedAt && (
            <p className="text-xs text-gray-400 mt-1">
              Applied: {new Date(state.governanceAppliedAt).toLocaleString()}
            </p>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          {state.status === 'SIMULATION' && (
            <button
              onClick={() => onAction('warmup', state.modelId)}
              disabled={loading}
              className="px-3 py-1.5 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 disabled:opacity-50 flex items-center gap-1"
            >
              <Play className="w-3 h-3" /> Start Warmup
            </button>
          )}
          
          {(state.status === 'WARMUP' || state.status === 'SIMULATION') && (
            <button
              onClick={() => onAction('apply', state.modelId)}
              disabled={loading || state.drift?.severity === 'CRITICAL'}
              className="px-3 py-1.5 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-1"
              title={state.drift?.severity === 'CRITICAL' ? 'Blocked: drift CRITICAL' : ''}
            >
              <CheckCircle className="w-3 h-3" /> Force Apply
            </button>
          )}
          
          {isRevoked && (
            <button
              onClick={() => onAction('warmup', state.modelId)}
              disabled={loading}
              className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-1"
            >
              <ArrowUpCircle className="w-3 h-3" /> Re-Enter Warmup
            </button>
          )}
          
          {isApplied && (
            <button
              onClick={() => onAction('revoke', state.modelId)}
              disabled={loading}
              className="px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center gap-1"
            >
              <Square className="w-3 h-3" /> Revoke
            </button>
          )}
          
          {state.systemMode === 'DEV' && state.status !== 'SIMULATION' && (
            <button
              onClick={() => onAction('reset', state.modelId)}
              disabled={loading}
              className="px-3 py-1.5 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 disabled:opacity-50 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Timeline Component
function LifecycleTimeline({ events }) {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No lifecycle events yet
      </div>
    );
  }
  
  const eventTypeColors = {
    GENERATED: 'bg-blue-500',
    WARMUP_START: 'bg-amber-500',
    WARMUP_PROGRESS: 'bg-amber-400',
    AUTO_APPLY: 'bg-emerald-500',
    FORCE_APPLY: 'bg-green-600',
    FORCE_WARMUP: 'bg-amber-600',
    REVOKE: 'bg-red-500',
    RESET_SIMULATION: 'bg-gray-500',
    DRIFT_WARN: 'bg-orange-500',
    DRIFT_CRITICAL: 'bg-red-600',
    DRIFT_CRITICAL_REVOKE: 'bg-red-700',
    DRIFT_RECOVERY_WARMUP: 'bg-blue-600',
    DEV_TRUTH_MODE: 'bg-purple-500',
    CONSTITUTION_APPLIED: 'bg-indigo-500',
    STATE_AUTOFIX: 'bg-pink-500',
  };
  
  return (
    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
      {events.map((event, idx) => (
        <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div className={`w-2 h-2 mt-2 rounded-full ${eventTypeColors[event.type] || 'bg-gray-400'}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm text-gray-900">{event.type}</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">{event.modelId}</span>
              <span className="text-xs text-gray-400">{event.actor}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(event.ts).toLocaleString()}
            </p>
            {event.meta && Object.keys(event.meta).length > 0 && (
              <pre className="mt-1 text-xs text-gray-500 bg-white p-1 rounded overflow-x-auto max-w-full">
                {JSON.stringify(event.meta, null, 2)}
              </pre>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Main Tab Component
export default function LifecycleTab() {
  const [data, setData] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [eventFilter, setEventFilter] = useState('all');
  const [toast, setToast] = useState(null);
  
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };
  
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [stateRes, eventsRes] = await Promise.all([
        fetchLifecycleState(),
        fetchLifecycleEvents(eventFilter === 'all' ? null : eventFilter, 100),
      ]);
      
      if (stateRes.ok) setData(stateRes.data);
      if (eventsRes.ok) setEvents(eventsRes.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [eventFilter]);
  
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);
  
  const handleAction = async (action, asset, params = {}) => {
    setActionLoading(true);
    try {
      let result;
      switch (action) {
        case 'warmup':
          result = await forceWarmup(asset, 30);
          break;
        case 'apply':
          result = await forceApply(asset, 'Admin force apply');
          break;
        case 'revoke':
          result = await revokeModel(asset, 'Admin revoke');
          break;
        case 'reset':
          result = await resetSimulation(asset, 'Admin reset to simulation');
          break;
        case 'drift':
          result = await updateDrift(asset, params.severity);
          if (result.ok && result.data?.revoked) {
            showToast(`${asset} auto-revoked due to CRITICAL drift`, 'error');
          }
          break;
        case 'samples':
          result = await incrementLiveSamples(asset, params.count);
          if (result.ok && result.data?.promoted) {
            showToast(`${asset} auto-promoted to APPLIED!`, 'success');
          }
          break;
        case 'constitution':
          result = await applyConstitution(asset, params.hash);
          if (result.ok && result.data?.newStatus === 'WARMUP') {
            showToast(`${asset} reset to WARMUP (constitution changed)`, 'warning');
          }
          break;
        case 'integrity':
          result = await checkIntegrity(asset);
          if (result.ok && !result.data?.integrityResult?.valid) {
            showToast(`${asset} state normalized: ${result.data?.integrityResult?.fixes?.join(', ')}`, 'warning');
          }
          break;
        default:
          break;
      }
      
      if (result && !result.ok) {
        showToast(`Error: ${result.error}`, 'error');
      }
      
      await loadData();
    } catch (err) {
      showToast(`Action failed: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleInitialize = async () => {
    setActionLoading(true);
    try {
      const result = await initializeLifecycle();
      if (result.ok) {
        showToast('States initialized', 'success');
        await loadData();
      } else {
        showToast(`Init failed: ${result.error}`, 'error');
      }
    } catch (err) {
      showToast(`Init failed: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };
  
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }
  
  const noStates = !data?.states || data.states.length === 0;
  const systemMode = data?.btc?.systemMode || data?.spx?.systemMode || 'DEV';
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-6" data-testid="lifecycle-tab">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'error' ? 'bg-red-500 text-white' :
          toast.type === 'success' ? 'bg-emerald-500 text-white' :
          toast.type === 'warning' ? 'bg-amber-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Lifecycle Management</h2>
          <p className="text-sm text-gray-500">BTC & SPX lifecycle observability and control (L2+L3)</p>
        </div>
        <div className="flex items-center gap-2">
          {noStates && (
            <button
              onClick={handleInitialize}
              disabled={actionLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Zap className="w-4 h-4" /> Initialize States
            </button>
          )}
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}
      
      {/* DEV Controls (L3 Testing) */}
      <DevControlsPanel 
        onAction={handleAction}
        loading={actionLoading}
        systemMode={systemMode}
      />
      
      {/* Combined Status */}
      <CombinedStatusCard combined={data?.combined} />
      
      {/* Model Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <LifecycleCard 
          state={data?.btc} 
          onAction={handleAction}
          loading={actionLoading}
        />
        <LifecycleCard 
          state={data?.spx} 
          onAction={handleAction}
          loading={actionLoading}
        />
      </div>
      
      {/* Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Event Timeline</h3>
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1"
          >
            <option value="all">All Events</option>
            <option value="BTC">BTC Only</option>
            <option value="SPX">SPX Only</option>
          </select>
        </div>
        <div className="p-4">
          <LifecycleTimeline events={events} />
        </div>
      </div>
    </div>
  );
}
