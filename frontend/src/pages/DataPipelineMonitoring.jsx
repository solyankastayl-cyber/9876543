/**
 * Data Pipeline Monitoring Dashboard - PHASE 4.3
 * 
 * Monitor data health: Ingestion, Aggregations, Snapshots
 * 
 * Sources:
 * - GET /api/system/health
 * - GET /api/engine/v2/health
 * - GET /api/rankings/dashboard
 * 
 * Blocks:
 * - Ingestion Health Card
 * - Aggregation Health Card
 * - Snapshot Health Card
 * - Overall Pipeline Status
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Database, Server, Activity, AlertTriangle, CheckCircle, XCircle,
  RefreshCw, Loader2, Clock, Zap, Layers, FileStack, Wifi,
  TrendingUp, AlertCircle, Info, Radio
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { api } from '../api/client';

// ============ STATUS INDICATOR ============
function StatusIndicator({ status }) {
  const config = {
    ok: { color: 'bg-green-500', label: 'Healthy', icon: CheckCircle },
    degraded: { color: 'bg-amber-500', label: 'Degraded', icon: AlertTriangle },
    critical: { color: 'bg-red-500', label: 'Critical', icon: XCircle },
    offline: { color: 'bg-gray-400', label: 'Offline', icon: XCircle },
  };

  const c = config[status] || config.degraded;
  const Icon = c.icon;

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full ${c.color} animate-pulse`} />
      <span className={`text-sm font-medium ${
        status === 'ok' ? 'text-green-700' :
        status === 'degraded' ? 'text-amber-700' :
        status === 'critical' ? 'text-red-700' : 'text-gray-500'
      }`}>
        {c.label}
      </span>
    </div>
  );
}

// ============ SERVICE CARD ============
function ServiceCard({ title, icon: Icon, status, metrics, notes, tooltip }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`p-5 rounded-xl border shadow-sm cursor-help ${
            status === 'ok' ? 'bg-green-50 border-green-200' :
            status === 'degraded' ? 'bg-amber-50 border-amber-200' :
            status === 'critical' ? 'bg-red-50 border-red-200' :
            'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  status === 'ok' ? 'bg-green-100' :
                  status === 'degraded' ? 'bg-amber-100' :
                  status === 'critical' ? 'bg-red-100' :
                  'bg-gray-100'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    status === 'ok' ? 'text-green-600' :
                    status === 'degraded' ? 'text-amber-600' :
                    status === 'critical' ? 'text-red-600' :
                    'text-gray-500'
                  }`} />
                </div>
                <h3 className="font-semibold text-gray-900">{title}</h3>
              </div>
              <StatusIndicator status={status} />
            </div>

            {/* Metrics */}
            {metrics && (
              <div className="grid grid-cols-2 gap-3 mb-3">
                {metrics.map((m, idx) => (
                  <div key={idx} className="p-2 bg-white/80 rounded-lg">
                    <div className="text-[10px] text-gray-500 uppercase">{m.label}</div>
                    <div className={`text-lg font-bold ${m.color || 'text-gray-900'}`}>
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Notes */}
            {notes && notes.length > 0 && (
              <div className="pt-3 border-t border-gray-200/50">
                {notes.map((note, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                    <Info className="w-3 h-3" />
                    {note}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-white text-white border-gray-200 max-w-xs">
          <p className="text-sm">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============ PIPELINE OVERVIEW ============
function PipelineOverview({ systemHealth, engineHealth }) {
  const stages = [
    {
      name: 'Ingestion',
      icon: Database,
      status: systemHealth?.services?.db?.status || 'degraded',
      detail: systemHealth?.services?.db?.latencyMs 
        ? `${systemHealth.services.db.latencyMs}ms latency`
        : 'No data',
    },
    {
      name: 'RPC',
      icon: Wifi,
      status: systemHealth?.services?.rpc?.status || 'degraded',
      detail: systemHealth?.services?.rpc?.provider || 'Unknown',
    },
    {
      name: 'Processing',
      icon: Layers,
      status: systemHealth?.services?.bootstrapWorker?.status || 'degraded',
      detail: `${systemHealth?.services?.bootstrapWorker?.recentActivity || 0} recent`,
    },
    {
      name: 'Engine',
      icon: Zap,
      status: engineHealth?.status === 'OK' ? 'ok' : 
              engineHealth?.status === 'WARNING' ? 'degraded' : 'critical',
      detail: `Coverage: ${engineHealth?.avgCoverage?.toFixed(0) || 0}%`,
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
      <h3 className="font-semibold text-gray-900 mb-4">Data Pipeline Flow</h3>
      
      <div className="flex items-center justify-between">
        {stages.map((stage, idx) => (
          <div key={idx} className="flex items-center">
            {/* Stage */}
            <div className="flex flex-col items-center">
              <div className={`p-3 rounded-xl ${
                stage.status === 'ok' ? 'bg-green-100' :
                stage.status === 'degraded' ? 'bg-amber-100' :
                'bg-red-100'
              }`}>
                <stage.icon className={`w-6 h-6 ${
                  stage.status === 'ok' ? 'text-green-600' :
                  stage.status === 'degraded' ? 'text-amber-600' :
                  'text-red-600'
                }`} />
              </div>
              <div className="mt-2 text-center">
                <div className="text-sm font-medium text-gray-900">{stage.name}</div>
                <div className="text-xs text-gray-500">{stage.detail}</div>
              </div>
            </div>
            
            {/* Arrow */}
            {idx < stages.length - 1 && (
              <div className="mx-4 flex-1 h-0.5 bg-gray-200 relative">
                <div className={`absolute inset-0 ${
                  stage.status === 'ok' ? 'bg-green-400' :
                  stage.status === 'degraded' ? 'bg-amber-400' :
                  'bg-red-400'
                }`} style={{ width: stage.status === 'ok' ? '100%' : '0%' }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ METRICS GRID ============
function MetricsGrid({ systemHealth }) {
  const bootstrap = systemHealth?.metrics?.bootstrap || {};
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Queued</div>
        <div className="text-2xl font-bold text-gray-900">{bootstrap.queued || 0}</div>
      </div>
      <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Active</div>
        <div className="text-2xl font-bold text-blue-600">{bootstrap.active || 0}</div>
      </div>
      <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Completed</div>
        <div className="text-2xl font-bold text-green-600">{bootstrap.done || 0}</div>
      </div>
      <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Failed</div>
        <div className={`text-2xl font-bold ${bootstrap.failed > 0 ? 'text-red-600' : 'text-gray-400'}`}>
          {bootstrap.failed || 0}
        </div>
      </div>
    </div>
  );
}

// ============ MAIN PAGE ============
export default function DataPipelineMonitoring({ embedded = false }) {
  const [loading, setLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState(null);
  const [engineHealth, setEngineHealth] = useState(null);
  const [rankingsData, setRankingsData] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [sysRes, engRes, rankRes] = await Promise.all([
        api.get('/api/system/health'),
        api.get('/api/engine/v2/health'),
        api.get('/api/rankings/dashboard'),
      ]);

      setSystemHealth(sysRes.data);
      if (engRes.data.ok) setEngineHealth(engRes.data.data);
      if (rankRes.data.ok) setRankingsData(rankRes.data.data);
    } catch (err) {
      setError(err.message);
      console.error('Pipeline fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  const overallStatus = systemHealth?.status || 'degraded';

  const content = (
    <>
      {/* Header - only when not embedded */}
      {!embedded && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">Data Pipeline</h1>
              <StatusIndicator status={overallStatus} />
            </div>
            <p className="text-gray-500 text-sm">
              Monitor ingestion, aggregations, and snapshot health
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-50 transition-colors"
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
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
            >
              <Zap className="w-4 h-4" />
              Engine
            </Link>
          </div>
        </div>
      )}

      {/* Embedded header */}
      {embedded && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <StatusIndicator status={overallStatus} />
            <p className="text-gray-500 text-sm">
              Monitor ingestion, aggregations, and snapshot health
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Pipeline Overview */}
      {!loading && <PipelineOverview systemHealth={systemHealth} engineHealth={engineHealth} />}

      {/* Bootstrap Metrics */}
      {!loading && <MetricsGrid systemHealth={systemHealth} />}

      {/* Services Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Database */}
          <ServiceCard
            title="Database"
            icon={Database}
            status={systemHealth?.services?.db?.status || 'degraded'}
            metrics={[
              { label: 'Latency', value: `${systemHealth?.services?.db?.latencyMs || 0}ms` },
              { label: 'Status', value: systemHealth?.services?.db?.status?.toUpperCase() || 'N/A' },
            ]}
            tooltip="MongoDB connection health and query latency."
          />

          {/* RPC */}
          <ServiceCard
            title="RPC Provider"
            icon={Wifi}
            status={systemHealth?.services?.rpc?.status || 'degraded'}
            metrics={[
              { label: 'Provider', value: systemHealth?.services?.rpc?.provider || 'None' },
              { label: 'Recent Tasks', value: systemHealth?.services?.rpc?.recentTasks || 0 },
            ]}
            notes={systemHealth?.notes?.filter(n => n.includes('RPC'))}
            tooltip="Blockchain RPC connectivity for on-chain data."
          />

          {/* WebSocket */}
          <ServiceCard
            title="WebSocket"
            icon={Radio}
            status={systemHealth?.services?.ws?.status || 'degraded'}
            metrics={[
              { label: 'Clients', value: systemHealth?.services?.ws?.clients || 0 },
              { label: 'Subscriptions', value: Object.values(systemHealth?.services?.ws?.subscriptions || {}).reduce((a, b) => a + b, 0) },
            ]}
            tooltip="Real-time WebSocket connections for live updates."
          />

          {/* Bootstrap Worker */}
          <ServiceCard
            title="Bootstrap Worker"
            icon={Layers}
            status={systemHealth?.services?.bootstrapWorker?.status || 'degraded'}
            metrics={[
              { label: 'Activity', value: systemHealth?.services?.bootstrapWorker?.recentActivity || 0 },
              { label: 'Throughput/hr', value: systemHealth?.metrics?.bootstrap?.throughputPerHour || 0 },
            ]}
            tooltip="Background job processor for data aggregation."
          />

          {/* Engine */}
          <ServiceCard
            title="Engine V2"
            icon={Zap}
            status={engineHealth?.status === 'OK' ? 'ok' : 
                    engineHealth?.status === 'WARNING' ? 'degraded' : 'critical'}
            metrics={[
              { label: 'Coverage', value: `${engineHealth?.avgCoverage?.toFixed(0) || 0}%`, color: (engineHealth?.avgCoverage || 0) >= 60 ? 'text-green-600' : 'text-red-600' },
              { label: 'Risk', value: `${engineHealth?.avgRisk?.toFixed(0) || 0}`, color: (engineHealth?.avgRisk || 0) < 70 ? 'text-green-600' : 'text-red-600' },
            ]}
            notes={engineHealth?.driftFlags}
            tooltip="Decision engine health and signal coverage."
          />

          {/* Rankings */}
          <ServiceCard
            title="Rankings"
            icon={TrendingUp}
            status={rankingsData?.summary?.total > 0 ? 'ok' : 'degraded'}
            metrics={[
              { label: 'Total Tokens', value: rankingsData?.summary?.total || 0 },
              { label: 'With Engine', value: rankingsData?.summary?.withEngineData || 0 },
            ]}
            tooltip="Token rankings health based on engine data."
          />
        </div>
      )}

      {/* System Notes */}
      {systemHealth?.notes && systemHealth.notes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-amber-800">System Notes</h3>
          </div>
          <ul className="space-y-1">
            {systemHealth.notes.map((note, idx) => (
              <li key={idx} className="text-sm text-amber-700 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Info Footer */}
      <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500 flex items-center gap-2">
            <Info className="w-3 h-3" />
            Pipeline health updated every 30 seconds. Without healthy data flow, ML cannot be enabled.
          </p>
          <p className="text-xs text-gray-400">
            Last check: {systemHealth?.ts ? new Date(systemHealth.ts).toLocaleString() : 'Never'}
          </p>
        </div>
      </div>
    </>
  );

  // Embedded mode - return content directly
  if (embedded) {
    return <div className="space-y-6">{content}</div>;
  }

  // Standalone page with wrapper
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 py-6">
        {content}
      </main>
    </div>
  );
}
