/**
 * Settings Page - UNIFIED INTELLIGENCE CONTROL
 * 
 * Architecture: ML is subordinate layer, not feature
 * All ML controls ONLY in Settings → Intelligence
 * 
 * Tabs:
 * - System: General runtime info
 * - Engine: Engine V2 configuration  
 * - Intelligence: ML Advisor Control, ML Health, Safety
 */
import { useState, useEffect, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { 
  Settings, Shield, Brain, Cpu, ChevronLeft, 
  CheckCircle, AlertTriangle, Lock, Info, Database,
  Activity, Zap, Eye, RefreshCw, Loader2, HelpCircle, XCircle, Beaker,
  BarChart3, LineChart, Cloud
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { MLToggle } from '../components/MLToggle';
import { TrainingSandbox } from '../components/TrainingSandbox';
import { api } from '../api/client';
import { 
  CalibrationStatusCard, 
  CalibrationBuildPanel, 
  CalibrationRunHistory,
  CalibrationAttackTests 
} from '../components/calibration';
import {
  ModeSelector,
  KillSwitchPanel,
  ModeAuditHistory,
  ModeAttackTests
} from '../components/modes';
import { SystemRuntimeStatus } from '../components/SystemRuntimeStatus';

// Lazy load heavy components
const SystemOverview = lazy(() => import('./SystemOverview'));
const DataPipelineMonitoring = lazy(() => import('./DataPipelineMonitoring'));

// ============ SECTION HEADER WITH TOOLTIP ============
function SectionHeader({ icon: Icon, title, tooltip, iconColor = 'text-gray-500', badge }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className={`w-5 h-5 ${iconColor}`} />
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {badge && (
        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">{badge}</span>
      )}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="ml-1 text-gray-400 hover:text-gray-600">
              <HelpCircle className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs bg-white text-white border-gray-200">
            <p className="text-sm">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

// ============ TAB NAVIGATION ============
function TabNav({ active, onChange }) {
  const tabs = [
    { id: 'system', label: 'System', icon: Cpu },
    { id: 'engine', label: 'Engine', icon: Zap },
    { id: 'intelligence', label: 'Intelligence', icon: Brain },
    { id: 'modes', label: 'ML Modes', icon: Shield, badge: 'Phase 6' },
    { id: 'calibration', label: 'Calibration', icon: Activity, badge: 'Phase 5' },
    { id: 'training', label: 'Training', icon: Beaker },
    { id: 'market-apis', label: 'Market APIs', icon: Cloud, badge: 'P1.5.B' },
    { id: 'overview', label: 'System Overview', icon: BarChart3 },
    { id: 'pipeline', label: 'Data Pipeline', icon: LineChart },
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="flex gap-6 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              data-testid={`tab-${tab.id}`}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                active === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'training' && (
                <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] rounded font-medium">
                  SANDBOX
                </span>
              )}
              {tab.badge && (
                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] rounded font-medium">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// ============ SYSTEM TAB ============
function SystemTab({ systemHealth }) {
  return (
    <div className="space-y-6">
      {/* Runtime State */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <SectionHeader 
          icon={Cpu} 
          title="Runtime State" 
          tooltip="Current system runtime status including version, environment and database performance metrics."
        />
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 uppercase">Status</div>
            <div className={`text-lg font-bold ${
              systemHealth?.status === 'ok' ? 'text-green-600' :
              systemHealth?.status === 'degraded' ? 'text-amber-600' : 'text-red-600'
            }`}>
              {systemHealth?.status?.toUpperCase() || 'LOADING'}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 uppercase">Version</div>
            <div className="text-lg font-bold text-gray-900">
              {systemHealth?.version?.build || 'N/A'}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 uppercase">Environment</div>
            <div className="text-lg font-bold text-gray-900">
              {systemHealth?.version?.env?.toUpperCase() || 'DEV'}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 uppercase">DB Latency</div>
            <div className="text-lg font-bold text-gray-900">
              {systemHealth?.services?.db?.latencyMs || 0}ms
            </div>
          </div>
        </div>
      </div>

      {/* Services Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <SectionHeader 
          icon={Database} 
          title="Services" 
          tooltip="Health status of all backend services: Database, RPC Provider, WebSocket connections, and Bootstrap Worker."
        />
        
        <div className="space-y-3">
          {['db', 'rpc', 'ws', 'bootstrapWorker'].map(service => {
            const status = systemHealth?.services?.[service]?.status || 'unknown';
            return (
              <div key={service} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {service === 'db' ? 'Database' : 
                   service === 'rpc' ? 'RPC Provider' :
                   service === 'ws' ? 'WebSocket' : 'Bootstrap Worker'}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  status === 'ok' ? 'bg-green-100 text-green-700' :
                  status === 'degraded' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {status.toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============ ENGINE TAB ============
function EngineTab({ engineHealth }) {
  return (
    <div className="space-y-6">
      {/* Engine V2 Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <SectionHeader 
          icon={Zap} 
          title="Engine V2 Configuration" 
          tooltip="Decision engine configuration. Rules Engine makes all final decisions. Decision Gates block risky operations. Shadow Mode runs V2 parallel to V1 for comparison."
          iconColor="text-blue-500"
        />
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 uppercase mb-1">Engine Status</div>
            <div className={`text-xl font-bold ${
              engineHealth?.status === 'OK' ? 'text-green-600' :
              engineHealth?.status === 'WARNING' ? 'text-amber-600' : 'text-red-600'
            }`}>
              {engineHealth?.status || 'LOADING'}
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 uppercase mb-1">Signals Count</div>
            <div className="text-xl font-bold text-gray-900">
              {engineHealth?.signalsCount || 0}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Rules Engine</span>
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">ACTIVE</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Decision Gates</span>
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">ENABLED</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Mode</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">PRODUCTION</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Shadow Mode</span>
            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-bold">ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <SectionHeader 
          icon={Activity} 
          title="Engine Metrics" 
          tooltip="Coverage: % of market visible to system (≥60% required). Risk: Downside/instability assessment (≤70 acceptable). Drift flags indicate data anomalies."
        />
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 uppercase mb-1">Avg Coverage</div>
            <div className={`text-2xl font-bold ${
              (engineHealth?.avgCoverage || 0) >= 60 ? 'text-green-600' : 'text-red-600'
            }`}>
              {engineHealth?.avgCoverage?.toFixed(0) || 0}%
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 uppercase mb-1">Avg Risk</div>
            <div className={`text-2xl font-bold ${
              (engineHealth?.avgRisk || 0) < 70 ? 'text-green-600' : 'text-red-600'
            }`}>
              {engineHealth?.avgRisk?.toFixed(0) || 0}
            </div>
          </div>
        </div>

        {/* Drift Flags */}
        {engineHealth?.driftFlags?.length > 0 && (
          <div className="mt-4 p-3 bg-amber-50 rounded-lg">
            <div className="text-xs text-amber-600 uppercase mb-2">Drift Flags</div>
            <div className="flex flex-wrap gap-2">
              {engineHealth.driftFlags.map((flag, idx) => (
                <span key={idx} className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">
                  {flag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ INTELLIGENCE TAB ============
function IntelligenceTab({ shadowData, mlHealth, mlDataset, mlDrift, mlReadiness }) {
  // Readiness badge
  const getReadinessBadge = () => {
    const status = mlReadiness?.status || 'NOT_READY';
    const config = {
      READY: { bg: 'bg-green-100', text: 'text-green-700', label: 'READY' },
      NOT_READY: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'NOT READY' },
      BLOCKED: { bg: 'bg-red-100', text: 'text-red-700', label: 'BLOCKED' },
    };
    const c = config[status] || config.NOT_READY;
    return <span className={`px-2 py-1 rounded text-xs font-bold ${c.bg} ${c.text}`}>{c.label}</span>;
  };

  // Drift status badge
  const getDriftBadge = () => {
    const status = mlDrift?.status || 'STABLE';
    const config = {
      STABLE: { bg: 'bg-green-100', text: 'text-green-700' },
      WARNING: { bg: 'bg-amber-100', text: 'text-amber-700' },
      CRITICAL: { bg: 'bg-red-100', text: 'text-red-700' },
    };
    const c = config[status] || config.STABLE;
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.bg} ${c.text}`}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      {/* System Runtime Status - TOP */}
      <SystemRuntimeStatus />

      {/* ML Advisor Control - MAIN */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <SectionHeader 
          icon={Brain} 
          title="ML Advisor Control" 
          tooltip="Control ML influence level. OFF = pure rules. ADVISOR = ML adjusts confidence ±10%. ASSIST = ML can reorder within buckets. ML never changes BUY/SELL decisions."
          iconColor="text-purple-500"
        />
        
        <MLToggle />
        
        {/* Safety Note */}
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
            <p className="text-sm text-amber-800">
              <strong>Safety Note:</strong> ML never changes BUY/SELL or bypasses decision gates. 
              It only adjusts confidence/risk within ±10%.
            </p>
          </div>
        </div>
      </div>

      {/* ML Health - REAL DATA */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <SectionHeader 
            icon={Activity} 
            title="ML Health" 
            tooltip="Read-only ML training readiness metrics. Dataset size, outcome balance, and drift indicators. Training is NOT available until all criteria are met."
            badge="Read-Only"
          />
          {getReadinessBadge()}
        </div>
        
        {/* Dataset Readiness */}
        <div className="mb-6">
          <h4 className="text-xs text-gray-500 uppercase tracking-wide mb-3">Dataset Readiness</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <div className="text-[10px] text-gray-500 uppercase">Signals</div>
              <div className="text-xl font-bold text-gray-900">{mlDataset?.total || 0}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <div className="text-[10px] text-gray-500 uppercase">Labeled</div>
              <div className="text-xl font-bold text-gray-900">
                {(mlDataset?.byOutcome?.SUCCESS || 0) + (mlDataset?.byOutcome?.FLAT || 0) + (mlDataset?.byOutcome?.FAIL || 0)}
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <div className="text-[10px] text-gray-500 uppercase">Success Rate</div>
              <div className={`text-xl font-bold ${(mlDataset?.successRate || 0) > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                {((mlDataset?.successRate || 0) * 100).toFixed(0)}%
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <div className="text-[10px] text-gray-500 uppercase">Recent 7d</div>
              <div className="text-xl font-bold text-gray-900">{mlDataset?.recent7d || 0}</div>
            </div>
          </div>
          
          {/* Outcome Balance Bar */}
          {mlDataset?.total > 0 && (
            <div className="mt-3">
              <div className="text-[10px] text-gray-500 uppercase mb-1">Outcome Balance</div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
                <div 
                  className="bg-green-500 h-full" 
                  style={{ width: `${(mlDataset?.byOutcome?.SUCCESS || 0) / Math.max(mlDataset?.total, 1) * 100}%` }}
                />
                <div 
                  className="bg-gray-400 h-full" 
                  style={{ width: `${(mlDataset?.byOutcome?.FLAT || 0) / Math.max(mlDataset?.total, 1) * 100}%` }}
                />
                <div 
                  className="bg-red-500 h-full" 
                  style={{ width: `${(mlDataset?.byOutcome?.FAIL || 0) / Math.max(mlDataset?.total, 1) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                <span>Success</span>
                <span>Flat</span>
                <span>Fail</span>
              </div>
            </div>
          )}
        </div>

        {/* Drift Monitoring */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs text-gray-500 uppercase tracking-wide">Drift Monitoring</h4>
            {getDriftBadge()}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-[10px] text-gray-500 uppercase mb-1">Coverage Drift</div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ width: `${(mlDrift?.feature_drift?.coverage || 0) * 100}%` }}
                />
              </div>
              <div className="text-xs text-gray-600 mt-1">{((mlDrift?.feature_drift?.coverage || 0) * 100).toFixed(1)}%</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-[10px] text-gray-500 uppercase mb-1">Actor Diversity</div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ width: `${(mlDrift?.feature_drift?.actor_diversity || 0) * 100}%` }}
                />
              </div>
              <div className="text-xs text-gray-600 mt-1">{((mlDrift?.feature_drift?.actor_diversity || 0) * 100).toFixed(1)}%</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-[10px] text-gray-500 uppercase mb-1">Label Drift</div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ width: `${(mlDrift?.label_drift || 0) * 100}%` }}
                />
              </div>
              <div className="text-xs text-gray-600 mt-1">{((mlDrift?.label_drift || 0) * 100).toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* Safety Gates */}
        <div className="mb-4">
          <h4 className="text-xs text-gray-500 uppercase tracking-wide mb-3">Safety Gates</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {[
              { key: 'coverageOk', label: 'Coverage' },
              { key: 'datasetOk', label: 'Dataset' },
              { key: 'modelQualityOk', label: 'Quality' },
              { key: 'driftOk', label: 'Drift' },
              { key: 'shadowOk', label: 'Shadow' },
            ].map(gate => {
              const ok = mlReadiness?.gates?.[gate.key];
              return (
                <div key={gate.key} className={`p-2 rounded-lg text-center ${ok ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className={`text-xs font-medium ${ok ? 'text-green-700' : 'text-red-700'}`}>
                    {ok ? '✓' : '✗'} {gate.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Blocking Reasons */}
        {mlReadiness?.blocking_reasons?.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-xs text-red-600 uppercase mb-2">Blocking Reasons</div>
            <ul className="space-y-1">
              {mlReadiness.blocking_reasons.map((reason, idx) => (
                <li key={idx} className="text-sm text-red-700 flex items-center gap-2">
                  <XCircle className="w-3 h-3" />
                  {reason.replace(/_/g, ' ')}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {mlReadiness?.recommendations?.length > 0 && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-xs text-blue-600 uppercase mb-2">Recommendations</div>
            <ul className="space-y-1">
              {mlReadiness.recommendations.map((rec, idx) => (
                <li key={idx} className="text-sm text-blue-700 flex items-center gap-2">
                  <Info className="w-3 h-3" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Safety Guarantees - ALWAYS VISIBLE */}
      <div className="bg-green-50 rounded-xl border border-green-200 p-6">
        <SectionHeader 
          icon={Shield} 
          title="Safety Guarantees" 
          tooltip="System safety controls. All guarantees are enforced at architecture level and cannot be bypassed by any layer including ML."
          iconColor="text-green-600"
        />
        
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <div className="text-sm font-medium text-gray-900">Kill Switch</div>
              <div className="text-xs text-gray-500">Emergency stop enabled and tested</div>
            </div>
            <span className="ml-auto px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">ENABLED</span>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <div className="text-sm font-medium text-gray-900">Shadow Mode</div>
              <div className="text-xs text-gray-500">Required for any ML change</div>
            </div>
            <span className="ml-auto px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">REQUIRED</span>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <div className="text-sm font-medium text-gray-900">Manual Approval</div>
              <div className="text-xs text-gray-500">All ML changes require operator approval</div>
            </div>
            <span className="ml-auto px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">REQUIRED</span>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <div className="text-sm font-medium text-gray-900">Rollback</div>
              <div className="text-xs text-gray-500">Instant rollback guaranteed</div>
            </div>
            <span className="ml-auto px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">GUARANTEED</span>
          </div>
        </div>
      </div>

      {/* Kill Switch Status */}
      <div className={`rounded-xl border p-6 ${
        shadowData?.killSwitch?.status === 'OK' 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <SectionHeader 
          icon={Lock} 
          title="Kill Switch Status" 
          tooltip="Emergency stop control. ARMED = system normal, ready to trigger if thresholds violated. TRIGGERED = V2 decisions blocked, system in safe mode."
        />
        
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-2xl font-bold ${
              shadowData?.killSwitch?.status === 'OK' ? 'text-green-600' : 'text-red-600'
            }`}>
              {shadowData?.killSwitch?.status === 'OK' ? 'ARMED' : 'TRIGGERED'}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {shadowData?.killSwitch?.status === 'OK' 
                ? 'System operating normally within safety thresholds'
                : 'V2 decisions blocked due to safety threshold violation'}
            </p>
          </div>
          
          {shadowData?.killSwitch?.reasons?.length > 0 && (
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase">Reasons</div>
              {shadowData.killSwitch.reasons.map((r, i) => (
                <div key={i} className="text-sm text-red-600">{r}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Shadow ML Dashboard Link */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <SectionHeader 
          icon={Eye} 
          title="Shadow ML Evaluation" 
          tooltip="Phase 4 Shadow ML Dashboard: View ML prediction quality, readiness gates, alerts, and historical runs. Read-only observation."
          iconColor="text-indigo-500"
        />
        
        <p className="text-sm text-gray-600 mb-4">
          Access the full Shadow ML Evaluation dashboard to monitor ML model health, 
          readiness gates for Phase 5, and historical evaluation runs.
        </p>
        
        <Link
          to="/intelligence"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          data-testid="open-intelligence-dashboard"
        >
          <Eye className="w-4 h-4" />
          Open ML Intelligence Dashboard
        </Link>
      </div>

      {/* Hard Disclaimer - ALWAYS VISIBLE */}
      <div className="p-4 bg-gray-100 rounded-xl border border-gray-200">
        <p className="text-xs text-gray-600 text-center">
          <strong>ML is currently running in observation mode.</strong><br />
          It does not influence Engine decisions, Rankings, or Risk.
        </p>
      </div>
    </div>
  );
}

// UI Freeze Version - ЭТАП 2
const UI_FREEZE_VERSION = "v2.0-ml-observe";

// ============ ML MODES TAB (PHASE 6) ============
function ModesTab() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <ModeSelector key={`selector-${refreshKey}`} onModeChange={handleRefresh} />
      </div>

      {/* Kill Switch Panel */}
      <KillSwitchPanel key={`kill-${refreshKey}`} onKillSwitchChange={handleRefresh} />

      {/* Mode Audit History */}
      <ModeAuditHistory key={`audit-${refreshKey}`} limit={15} />

      {/* Attack Tests */}
      <ModeAttackTests />

      {/* Safety Guarantees */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="bg-green-50 rounded-xl border border-green-200 p-6 cursor-help">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Phase 6 Safety Guarantees</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  ML does NOT change decision (BUY/SELL/NEUTRAL)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  ML does NOT bypass Engine gates
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  ML does NOT change bucket (HIGH/MED/LOW)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  ASSIST: reorder within bucket only (max ±2 positions)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Kill Switch = absolute authority (instant shutdown)
                </li>
              </ul>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-sm bg-white text-white border-gray-200">
            <p className="text-sm">These are hardcoded architectural constraints verified by 7 attack tests. No API exists to bypass them.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

// ============ CALIBRATION TAB (PHASE 5) ============
function CalibrationTab() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <CalibrationStatusCard 
        key={`status-${refreshKey}`}
        window="7d" 
        onRefresh={handleRefresh} 
      />

      {/* Build Panel */}
      <CalibrationBuildPanel onBuildComplete={handleRefresh} />

      {/* Run History */}
      <CalibrationRunHistory key={`history-${refreshKey}`} window={null} limit={10} />

      {/* Attack Tests */}
      <CalibrationAttackTests />

      {/* Safety Info */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="bg-green-50 rounded-xl border border-green-200 p-6 cursor-help">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Phase 5 Safety Guarantees</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Calibration only adjusts confidence within ±10% bounds
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  BUY/SELL/NEUTRAL decisions are never changed
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  All changes are logged in ml_calibration_audit
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Instant rollback when anomalies are detected
                </li>
              </ul>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-sm bg-white text-white border-gray-200">
            <p className="text-sm">These are hardcoded architectural constraints verified by 5 attack tests. Calibration is bounded and auditable.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

// ============ MARKET APIS TAB (P1.5.B) ============
function MarketApisTab() {
  const [sources, setSources] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState(null);
  const [editingSource, setEditingSource] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchSources = async () => {
    try {
      const res = await api.get('/api/settings/market-sources');
      if (res.data.ok) {
        setSources(res.data.sources);
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch market sources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleTest = async (sourceId) => {
    setTestingId(sourceId);
    try {
      const res = await api.post(`/api/settings/market-sources/${sourceId}/test`);
      if (res.data.ok && res.data.result.success) {
        alert(`✅ Connected! Latency: ${res.data.result.latencyMs}ms\n${res.data.result.message}`);
      } else {
        alert(`❌ Failed: ${res.data.result?.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setTestingId(null);
    }
  };

  const handleToggle = async (sourceId) => {
    try {
      await api.post(`/api/settings/market-sources/${sourceId}/toggle`);
      fetchSources();
    } catch (err) {
      console.error('Toggle failed:', err);
    }
  };

  const handleDelete = async (sourceId) => {
    if (!confirm('Delete this source?')) return;
    try {
      await api.delete(`/api/settings/market-sources/${sourceId}`);
      fetchSources();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
      needs_key: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Needs Key' },
      rate_limited: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rate Limited' },
      error: { bg: 'bg-red-100', text: 'text-red-700', label: 'Error' },
      disabled: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Disabled' },
    };
    const b = badges[status] || badges.disabled;
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${b.bg} ${b.text}`}>
        {b.label}
      </span>
    );
  };

  const getProviderBadge = (provider) => {
    const badges = {
      coingecko: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
      binance: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      coinmarketcap: { bg: 'bg-blue-100', text: 'text-blue-700' },
    };
    const b = badges[provider] || { bg: 'bg-gray-100', text: 'text-gray-700' };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${b.bg} ${b.text}`}>
        {provider.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <SectionHeader 
          icon={Cloud} 
          title="Market API Sources" 
          tooltip="Manage API keys for market data providers. Multiple sources enable higher rate limits and automatic failover."
          badge="P1.5.B"
        />
        
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {['coingecko', 'binance', 'coinmarketcap'].map(provider => (
              <div key={provider} className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 uppercase">{provider}</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-bold text-gray-900">
                    {stats.providers[provider]?.enabled || 0}
                  </span>
                  <span className="text-xs text-gray-500">
                    / {stats.providers[provider]?.total || 0} sources
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {stats.providers[provider]?.totalRpm || 0} RPM total
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            + Add Source
          </button>
        </div>

        {/* Sources Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase border-b">
                <th className="pb-3 pr-4">Provider</th>
                <th className="pb-3 pr-4">Label</th>
                <th className="pb-3 pr-4">API Key</th>
                <th className="pb-3 pr-4 text-center">RPM</th>
                <th className="pb-3 pr-4 text-center">Weight</th>
                <th className="pb-3 pr-4 text-center">Status</th>
                <th className="pb-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sources.map(source => (
                <tr key={source._id} className="border-b border-gray-100">
                  <td className="py-3 pr-4">{getProviderBadge(source.provider)}</td>
                  <td className="py-3 pr-4 font-medium">{source.label}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-gray-500">
                    {source.apiKey || <span className="italic text-gray-400">none</span>}
                  </td>
                  <td className="py-3 pr-4 text-center">{source.limits.rpm}</td>
                  <td className="py-3 pr-4 text-center">{source.weight}</td>
                  <td className="py-3 pr-4 text-center">{getStatusBadge(source.status)}</td>
                  <td className="py-3 pr-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleTest(source._id)}
                        disabled={testingId === source._id}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                      >
                        {testingId === source._id ? '...' : 'Test'}
                      </button>
                      <button
                        onClick={() => handleToggle(source._id)}
                        className={`px-2 py-1 text-xs rounded ${
                          source.enabled 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {source.enabled ? 'ON' : 'OFF'}
                      </button>
                      <button
                        onClick={() => handleDelete(source._id)}
                        className="px-2 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded"
                      >
                        ×
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sources.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No sources configured. Click "Add Source" to get started.
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddSourceModal 
          onClose={() => setShowAddModal(false)} 
          onSaved={() => { setShowAddModal(false); fetchSources(); }}
        />
      )}

      {/* Info */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">About Market API Pool</h3>
        </div>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            Multiple sources = higher combined rate limits
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            Automatic failover when one source hits rate limit
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            Weighted round-robin distributes requests
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            Market data is context only, not trading signals
          </li>
        </ul>
      </div>
    </div>
  );
}

// Add Source Modal
function AddSourceModal({ onClose, onSaved }) {
  const [provider, setProvider] = useState('coingecko');
  const [label, setLabel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [rpm, setRpm] = useState(30);
  const [weight, setWeight] = useState(5);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!label.trim()) {
      alert('Label is required');
      return;
    }
    
    if (provider === 'coinmarketcap' && !apiKey.trim()) {
      alert('CoinMarketCap requires an API key');
      return;
    }

    setSaving(true);
    try {
      await api.post('/api/settings/market-sources', {
        provider,
        label: label.trim(),
        apiKey: apiKey.trim() || undefined,
        rpm: parseInt(rpm) || 30,
        weight: parseInt(weight) || 5,
        enabled: true
      });
      onSaved();
    } catch (err) {
      alert(`Failed to create: ${err.response?.data?.error || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">Add Market API Source</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Provider</label>
            <select 
              value={provider} 
              onChange={e => setProvider(e.target.value)}
              className="w-full border rounded-lg p-2"
            >
              <option value="coingecko">CoinGecko</option>
              <option value="binance">Binance</option>
              <option value="coinmarketcap">CoinMarketCap</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Label</label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. CoinGecko Pro #1"
              className="w-full border rounded-lg p-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">API Key (optional for CG/Binance)</label>
            <input
              type="text"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Your API key"
              className="w-full border rounded-lg p-2 font-mono text-sm"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">RPM (requests/min)</label>
              <input
                type="number"
                value={rpm}
                onChange={e => setRpm(e.target.value)}
                className="w-full border rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Weight (1-10)</label>
              <input
                type="number"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                min="1"
                max="10"
                className="w-full border rounded-lg p-2"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Add Source'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ MAIN PAGE ============
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('intelligence');
  const [loading, setLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState(null);
  const [engineHealth, setEngineHealth] = useState(null);
  const [shadowData, setShadowData] = useState(null);
  // ML Health data - ЭТАП 1
  const [mlHealth, setMlHealth] = useState(null);
  const [mlDataset, setMlDataset] = useState(null);
  const [mlDrift, setMlDrift] = useState(null);
  const [mlReadiness, setMlReadiness] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sysRes, engRes, shadowRes, mlHealthRes, mlDatasetRes, mlDriftRes, mlReadinessRes] = await Promise.all([
        api.get('/api/system/health'),
        api.get('/api/engine/v2/health'),
        api.get('/api/shadow/summary'),
        api.get('/api/ml/health'),
        api.get('/api/ml/dataset/stats'),
        api.get('/api/ml/drift/summary'),
        api.get('/api/ml/readiness'),
      ]);

      setSystemHealth(sysRes.data);
      if (engRes.data.ok) setEngineHealth(engRes.data.data);
      if (shadowRes.data.ok) setShadowData(shadowRes.data.data);
      if (mlHealthRes.data.ok) setMlHealth(mlHealthRes.data.data);
      if (mlDatasetRes.data.ok) setMlDataset(mlDatasetRes.data.data);
      if (mlDriftRes.data.ok) setMlDrift(mlDriftRes.data.data);
      if (mlReadinessRes.data.ok) setMlReadiness(mlReadinessRes.data.data);
    } catch (err) {
      console.error('Settings fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Log UI freeze version
    console.log(`[Settings] UI_FREEZE_VERSION: ${UI_FREEZE_VERSION}`);
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Settings className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Settings</h1>
                <p className="text-sm text-gray-500">System configuration and intelligence control</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </button>
              
              <Link
                to="/"
                className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4">
          <TabNav active={activeTab} onChange={setActiveTab} />
        </div>
      </div>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === 'system' && <SystemTab systemHealth={systemHealth} />}
        {activeTab === 'engine' && <EngineTab engineHealth={engineHealth} />}
        {activeTab === 'intelligence' && (
          <IntelligenceTab 
            shadowData={shadowData}
            mlHealth={mlHealth}
            mlDataset={mlDataset}
            mlDrift={mlDrift}
            mlReadiness={mlReadiness}
          />
        )}
        {activeTab === 'modes' && <ModesTab />}
        {activeTab === 'calibration' && <CalibrationTab />}
        {activeTab === 'training' && <TrainingSandbox />}
        {activeTab === 'market-apis' && <MarketApisTab />}
        {activeTab === 'overview' && (
          <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>}>
            <SystemOverview embedded />
          </Suspense>
        )}
        {activeTab === 'pipeline' && (
          <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>}>
            <DataPipelineMonitoring embedded />
          </Suspense>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <p className="text-xs text-gray-500 text-center">
            FOMO {UI_FREEZE_VERSION} | Rules-First Intelligence System | ML is advisor only, never decides
          </p>
        </div>
      </footer>
    </div>
  );
}
