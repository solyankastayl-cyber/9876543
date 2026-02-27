/**
 * Engine Dashboard V2 - PHASE 4.1
 * 
 * Source: GET /api/engine/v2/health + GET /api/shadow/summary
 * 
 * Blocks:
 * - B1: Engine Health Card (Status, Protection, Kill Switch, Drift)
 * - B2: Coverage / Risk Trends
 * - B3: Shadow Mode Panel
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, Activity, AlertTriangle, CheckCircle, XCircle,
  RefreshCw, Loader2, Zap, GitCompare, TrendingUp, TrendingDown,
  Database, Lock, Unlock, Eye
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { api } from '../api/client';

// ============ ENGINE STATUS CARD ============
function EngineStatusCard({ status, protectionMode, killSwitch, driftFlags }) {
  const statusConfig = {
    CRITICAL: { 
      bg: 'bg-red-500/10', 
      border: 'border-red-500/30', 
      color: 'text-red-400',
      icon: XCircle 
    },
    WARNING: { 
      bg: 'bg-amber-500/10', 
      border: 'border-amber-500/30', 
      color: 'text-amber-400',
      icon: AlertTriangle 
    },
    OK: { 
      bg: 'bg-green-500/10', 
      border: 'border-green-500/30', 
      color: 'text-green-400',
      icon: CheckCircle 
    },
    DATA_COLLECTION: {
      bg: 'bg-gray-500/10',
      border: 'border-gray-500/30',
      color: 'text-gray-500',
      icon: Database
    }
  };

  const config = statusConfig[status] || statusConfig.WARNING;
  const StatusIcon = config.icon;

  return (
    <div className={`p-5 rounded-xl ${config.bg} border ${config.border}`}>
      <div className="flex items-center gap-3 mb-4">
        <StatusIcon className={`w-6 h-6 ${config.color}`} />
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Engine Status</div>
          <div className={`text-lg font-bold ${config.color}`}>{status}</div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Protection Mode */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg cursor-help">
                {protectionMode ? (
                  <Lock className="w-4 h-4 text-amber-400" />
                ) : (
                  <Unlock className="w-4 h-4 text-green-400" />
                )}
                <div>
                  <div className="text-[10px] text-gray-500">Protection</div>
                  <div className={`text-xs font-medium ${protectionMode ? 'text-amber-400' : 'text-green-400'}`}>
                    {protectionMode ? 'ON' : 'OFF'}
                  </div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-white border-gray-200">
              <p className="text-sm">Protection mode restricts decisions when coverage is low.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* Kill Switch */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg cursor-help">
                <Shield className={`w-4 h-4 ${killSwitch?.status === 'TRIGGERED' ? 'text-red-400' : 'text-gray-500'}`} />
                <div>
                  <div className="text-[10px] text-gray-500">Kill Switch</div>
                  <div className={`text-xs font-medium ${killSwitch?.status === 'TRIGGERED' ? 'text-red-400' : 'text-gray-500'}`}>
                    {killSwitch?.status === 'TRIGGERED' ? 'TRIGGERED' : 'ARMED'}
                  </div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-white border-gray-200">
              <p className="text-sm">Kill switch triggers when V2 deviates significantly from V1.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Drift Flags */}
      {driftFlags && driftFlags.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-[10px] text-gray-500 uppercase mb-2">Drift Flags</div>
          <div className="flex flex-wrap gap-1">
            {driftFlags.map((flag, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded">
                {flag.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ METRIC CARD ============
function MetricCard({ label, value, trend, tooltip, colorLogic }) {
  const getColor = () => {
    if (colorLogic === 'coverage') {
      if (value >= 60) return 'text-green-400';
      if (value >= 40) return 'text-amber-400';
      return 'text-red-400';
    }
    if (colorLogic === 'risk') {
      if (value >= 70) return 'text-red-400';
      if (value >= 40) return 'text-amber-400';
      return 'text-green-400';
    }
    return 'text-gray-900';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 cursor-help">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">{label}</div>
            <div className={`text-2xl font-bold ${getColor()}`}>
              {typeof value === 'number' ? value.toFixed(0) : value}
              {typeof value === 'number' && '%'}
            </div>
            {trend !== undefined && (
              <div className={`flex items-center gap-1 mt-1 text-xs ${
                trend >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(trend).toFixed(1)}%
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-white border-gray-200 max-w-xs">
          <p className="text-sm">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============ SHADOW MODE PANEL ============
function ShadowModePanel({ data }) {
  if (!data) {
    return (
      <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <GitCompare className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-gray-900">Shadow Mode (V1 vs V2)</h3>
        </div>
        <p className="text-sm text-gray-500">Loading shadow metrics...</p>
      </div>
    );
  }

  const { metrics, killSwitch } = data;
  
  return (
    <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-gray-900">Shadow Mode (V1 vs V2)</h3>
        </div>
        <span className="text-xs text-gray-500">{metrics?.samples || 0} samples</span>
      </div>
      
      {/* Kill Switch Status */}
      <div className={`p-3 rounded-lg mb-4 ${
        killSwitch?.status === 'OK' ? 'bg-green-500/10' : 'bg-red-500/10'
      }`}>
        <div className="flex items-center gap-2">
          {killSwitch?.status === 'OK' ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400" />
          )}
          <span className={`text-sm font-medium ${
            killSwitch?.status === 'OK' ? 'text-green-400' : 'text-red-400'
          }`}>
            Kill Switch: {killSwitch?.status || 'Unknown'}
          </span>
        </div>
        {killSwitch?.reasons?.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            {killSwitch.reasons.join(', ')}
          </div>
        )}
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-white rounded-lg text-center">
          <div className="text-lg font-bold text-gray-900">
            {((metrics?.agreementRate || 0) * 100).toFixed(0)}%
          </div>
          <div className="text-[10px] text-gray-500 uppercase">Agreement</div>
        </div>
        <div className="p-3 bg-white rounded-lg text-center">
          <div className="text-lg font-bold text-amber-400">
            {((metrics?.decisionFlipRate || 0) * 100).toFixed(0)}%
          </div>
          <div className="text-[10px] text-gray-500 uppercase">Flip Rate</div>
        </div>
        <div className="p-3 bg-white rounded-lg text-center">
          <div className="text-lg font-bold text-gray-900">
            {(metrics?.avgRiskDelta || 0).toFixed(1)}
          </div>
          <div className="text-[10px] text-gray-500 uppercase">Risk Delta</div>
        </div>
      </div>
      
      {/* Info */}
      <p className="mt-4 text-[10px] text-gray-600 text-center">
        Comparison between legacy engine and Engine v2. No production impact.
      </p>
    </div>
  );
}

// ============ GATES PANEL ============
function GatesPanel({ gating }) {
  const gates = [
    { name: 'Coverage Gate', threshold: '≥60%', status: true },
    { name: 'Risk Gate', threshold: '<80', status: true },
    { name: 'Evidence Gate', threshold: '≥40', status: true },
  ];
  
  return (
    <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-blue-400" />
        <h3 className="font-semibold text-gray-900">Active Engine Gates</h3>
      </div>
      
      <div className="space-y-2">
        {gates.map((gate, idx) => (
          <TooltipProvider key={idx}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-between p-2 bg-white rounded-lg cursor-help">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-gray-700">{gate.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">{gate.threshold}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-white border-gray-200">
                <p className="text-sm">This gate restricts decisions when threshold is violated.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
}

// ============ MAIN DASHBOARD ============
export default function EngineDashboardV2() {
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(null);
  const [shadow, setShadow] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [healthRes, shadowRes] = await Promise.all([
        api.get('/api/engine/v2/health'),
        api.get('/api/shadow/summary'),
      ]);

      if (healthRes.data.ok) setHealth(healthRes.data.data);
      if (shadowRes.data.ok) setShadow(shadowRes.data.data);
    } catch (err) {
      setError(err.message);
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isProtectionMode = health?.avgCoverage < 60 || health?.status === 'CRITICAL';

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">Engine Dashboard</h1>
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-medium rounded">
                v2
              </span>
            </div>
            <p className="text-gray-500 text-sm">Health metrics and shadow mode comparison</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 text-sm disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </button>
            
            <Link
              to="/engine"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-gray-900 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
            >
              <Zap className="w-4 h-4" />
              Engine
            </Link>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
          </div>
        )}

        {/* Dashboard Grid */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* B1: Engine Status Card */}
            <EngineStatusCard
              status={health?.status || 'WARNING'}
              protectionMode={isProtectionMode}
              killSwitch={shadow?.killSwitch}
              driftFlags={health?.driftFlags}
            />
            
            {/* B3: Gates Panel */}
            <GatesPanel />
            
            {/* B2: Coverage / Risk Metrics */}
            <div className="lg:col-span-2 grid grid-cols-4 gap-4">
              <MetricCard
                label="Coverage (Avg)"
                value={health?.avgCoverage || 0}
                tooltip="Observable market share across actors, clusters and sources."
                colorLogic="coverage"
              />
              <MetricCard
                label="Risk (Avg)"
                value={health?.avgRisk || 0}
                tooltip="Aggregated downside and instability risk."
                colorLogic="risk"
              />
              <MetricCard
                label="Signals Count"
                value={health?.signalsCount || 0}
                tooltip="Total number of active signals in the system."
              />
              <MetricCard
                label="Decision Quality"
                value={health?.status === 'OK' ? 'HIGH' : health?.status === 'WARNING' ? 'MEDIUM' : 'LOW'}
                tooltip="Rule-based confidence after penalties and confirmations. No ML influence."
              />
            </div>
            
            {/* B3: Shadow Mode Panel */}
            <div className="lg:col-span-2">
              <ShadowModePanel data={shadow} />
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            <strong>Engine v2</strong> | Shadow Mode: Active | ML: Disabled | 
            This dashboard shows quality metrics, not trading performance.
          </p>
        </div>
      </main>
    </div>
  );
}
