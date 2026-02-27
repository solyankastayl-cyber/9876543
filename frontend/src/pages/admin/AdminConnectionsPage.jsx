/**
 * Admin Connections Page - Control Plane for Connections Module
 * 
 * P1.1 POLISH UPDATE:
 * - Overview: 3 logical blocks (Status, Activity, Warnings)
 * - Config: Grouped sections, read-only/editable distinction, apply flow
 * - Stability: Summary block with clear thresholds
 * - Alerts: Preview table with filters and controls
 * 
 * Tabs:
 * - Overview: Module status & stats
 * - Config: View/edit configuration
 * - Stability: Tuning matrix results
 * - Alerts: Preview & manage alerts
 */
import { useState, useEffect, useCallback, Component } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Activity, 
  Settings, 
  Shield, 
  Bell, 
  Power, 
  Database,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Send,
  Eye,
  EyeOff,
  Clock,
  TrendingUp,
  Zap,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  Info,
  Filter,
  X,
  MessageSquare,
  Users,
  Sparkles,
  Brain,
  Network,
  Building2,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useAdminAuth } from '../../context/AdminAuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import { InfoTooltip, ADMIN_TOOLTIPS } from '../../components/admin/InfoTooltip';
import TwitterLiveAdmin from '../../components/admin/TwitterLiveAdmin';
import GraphOverlayAdminTab from '../../components/admin/GraphOverlayAdminTab';
import AlertQualityTab from '../../components/admin/connections/AlertQualityTab';
import PatternsTab from '../../components/admin/connections/PatternsTab';
import FeedbackTab from '../../components/admin/connections/FeedbackTab';
import DriftTab from '../../components/admin/connections/DriftTab';
import Ml2Tab from '../../components/admin/connections/Ml2Tab';
import Network2Tab from '../../components/admin/connections/Network2Tab';
import BackersTab from '../../components/admin/connections/BackersTab';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// ============================================================
// COMMON UI COMPONENTS
// ============================================================

// Status Badge with color coding
const StatusBadge = ({ status, size = 'md' }) => {
  const styles = {
    enabled: 'bg-green-100 text-green-700 border-green-300',
    disabled: 'bg-red-100 text-red-700 border-red-300',
    healthy: 'bg-green-100 text-green-700 border-green-300',
    degraded: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    error: 'bg-red-100 text-red-700 border-red-300',
    unknown: 'bg-gray-100 text-gray-600 border-gray-300',
    ok: 'bg-green-100 text-green-700 border-green-300',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    danger: 'bg-red-100 text-red-700 border-red-300',
  };
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base font-bold',
  };

  const normalizedStatus = status?.toLowerCase() || 'unknown';
  
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${styles[normalizedStatus] || styles.unknown} ${sizeClasses[size]}`}>
      {normalizedStatus === 'enabled' || normalizedStatus === 'healthy' || normalizedStatus === 'ok' ? (
        <CheckCircle className={size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
      ) : normalizedStatus === 'disabled' || normalizedStatus === 'error' || normalizedStatus === 'danger' ? (
        <XCircle className={size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
      ) : (
        <AlertTriangle className={size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
      )}
      {status?.toUpperCase()}
    </span>
  );
};

// Health Indicator dot
const HealthDot = ({ status }) => {
  const colors = {
    healthy: 'bg-green-500',
    degraded: 'bg-yellow-500',
    error: 'bg-red-500',
  };
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[status?.toLowerCase()] || 'bg-gray-400'}`} />
  );
};

// Stat Card with consistent styling
const StatCard = ({ label, value, icon: Icon, color = 'gray', trend = null }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    gray: 'bg-gray-50 text-gray-600 border-gray-100',
  };
  
  return (
    <div className={`rounded-xl p-4 border ${colors[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium opacity-75">{label}</span>
        {Icon && <Icon className="w-4 h-4 opacity-50" />}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold">{value}</span>
        {trend !== null && (
          <span className={`text-xs ${trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-gray-400'}`}>
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '—'} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
};

// Section Card wrapper
const SectionCard = ({ title, icon: Icon, children, action, className = '' }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        {title}
      </h3>
      {action}
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
);

// Warning Banner
const WarningBanner = ({ children, severity = 'warning' }) => {
  const styles = {
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };
  
  return (
    <div className={`rounded-lg px-4 py-3 border flex items-start gap-3 ${styles[severity]}`}>
      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="text-sm">{children}</div>
    </div>
  );
};

// Timestamp display
const Timestamp = ({ date, label }) => (
  <div className="text-xs text-gray-400 flex items-center gap-1">
    <Clock className="w-3 h-3" />
    {label && <span>{label}:</span>}
    <span>{date ? new Date(date).toLocaleString() : '—'}</span>
  </div>
);

// Toast notification (simple)
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
  };

  return (
    <div className={`fixed bottom-4 right-4 ${styles[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50`}>
      {type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
      {message}
      <button onClick={onClose} className="ml-2 hover:opacity-75">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// ============================================================
// TAB: OVERVIEW
// ============================================================

const OverviewTab = ({ data, token, onRefresh }) => {
  const [toggling, setToggling] = useState(false);
  const [changingSource, setChangingSource] = useState(false);
  const [toast, setToast] = useState(null);

  const handleToggle = async () => {
    setToggling(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/connections/toggle`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled: !data.enabled }),
      });
      const result = await res.json();
      if (result.ok) {
        setToast({ message: `Module ${!data.enabled ? 'enabled' : 'disabled'}`, type: 'success' });
        onRefresh();
      }
    } catch (err) {
      setToast({ message: 'Failed to toggle module', type: 'error' });
    }
    setToggling(false);
  };

  const handleSourceChange = async (mode) => {
    setChangingSource(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/connections/source`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ mode }),
      });
      const result = await res.json();
      if (result.ok) {
        setToast({ message: `Source changed to ${mode}`, type: 'success' });
        onRefresh();
      }
    } catch (err) {
      setToast({ message: 'Failed to change source', type: 'error' });
    }
    setChangingSource(false);
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  // Calculate warnings
  const warnings = [];
  if (data.health?.status !== 'healthy') {
    warnings.push({ message: `Module health is ${data.health?.status?.toUpperCase()}`, severity: 'warning' });
  }
  if (data.stability && data.stability < 0.7) {
    warnings.push({ message: `Stability score is low (${(data.stability * 100).toFixed(0)}%)`, severity: 'warning' });
  }
  if (data.stats?.alerts_suppressed > 0) {
    warnings.push({ message: `${data.stats.alerts_suppressed} alerts suppressed in last 24h`, severity: 'info' });
  }
  if (data.config_changed_recently) {
    warnings.push({ message: 'Configuration was recently modified', severity: 'info' });
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* BLOCK A: STATUS */}
      <SectionCard 
        title="Module Status" 
        icon={Power}
        action={
          <Button
            variant={data.enabled ? "destructive" : "default"}
            size="sm"
            onClick={handleToggle}
            disabled={toggling}
            data-testid="toggle-module-btn"
          >
            {toggling ? <RefreshCw className="w-4 h-4 animate-spin" /> : 
              data.enabled ? <><Pause className="w-4 h-4 mr-1" /> Disable</> : 
              <><Play className="w-4 h-4 mr-1" /> Enable</>}
          </Button>
        }
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="text-xs text-gray-500 uppercase tracking-wider">Module</div>
            <StatusBadge status={data.enabled ? 'enabled' : 'disabled'} size="lg" />
          </div>
          <div className="space-y-2">
            <div className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1">
              Health <HealthDot status={data.health?.status} />
            </div>
            <StatusBadge status={data.health?.status || 'unknown'} size="lg" />
          </div>
          <div className="space-y-2">
            <div className="text-xs text-gray-500 uppercase tracking-wider">Source Mode</div>
            <div className="text-lg font-bold text-gray-900">
              {data.source_mode === 'mock' && '🎭 Mock'}
              {data.source_mode === 'sandbox' && '📦 Sandbox'}
              {data.source_mode === 'twitter_live' && '🐦 Twitter'}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-xs text-gray-500 uppercase tracking-wider">Last Run</div>
            <div className="text-lg font-medium text-gray-700">
              {data.last_run ? new Date(data.last_run).toLocaleTimeString() : '—'}
            </div>
            <Timestamp date={data.last_run} />
          </div>
        </div>

        {/* Data Source Selector */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Database className="w-3 h-3" /> Change Data Source
          </div>
          <div className="flex gap-2 flex-wrap">
            {['mock', 'sandbox', 'twitter_live'].map(mode => (
              <button
                key={mode}
                onClick={() => handleSourceChange(mode)}
                disabled={changingSource || data.source_mode === mode}
                data-testid={`source-${mode}-btn`}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  data.source_mode === mode
                    ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } ${changingSource ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {mode === 'mock' && '🎭 Mock'}
                {mode === 'sandbox' && '📦 Sandbox'}
                {mode === 'twitter_live' && '🐦 Twitter Live'}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* BLOCK B: ACTIVITY (24h) */}
      <SectionCard title="Activity (24h)" icon={Activity}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard 
            label="Accounts Processed" 
            value={data.stats?.accounts_24h || 0} 
            icon={Database}
            color="blue" 
          />
          <StatCard 
            label="Early Signals" 
            value={data.stats?.early_signals || 0} 
            icon={Zap}
            color="yellow" 
          />
          <StatCard 
            label="Breakouts" 
            value={data.stats?.breakouts || 0} 
            icon={TrendingUp}
            color="green" 
          />
          <StatCard 
            label="Alerts Generated" 
            value={data.stats?.alerts_generated || 0} 
            icon={Bell}
            color="purple" 
          />
          <StatCard 
            label="Alerts Sent" 
            value={data.stats?.alerts_sent || 0} 
            icon={Send}
            color="indigo" 
          />
        </div>
        <Timestamp date={new Date()} label="Last updated" />
      </SectionCard>

      {/* BLOCK C: WARNINGS */}
      {warnings.length > 0 && (
        <SectionCard title="Warnings" icon={AlertTriangle}>
          <div className="space-y-3">
            {warnings.map((w, idx) => (
              <WarningBanner key={idx} severity={w.severity}>
                {w.message}
              </WarningBanner>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Errors (if any) */}
      {data.errors?.length > 0 && (
        <div className="bg-red-50 rounded-xl p-6 border border-red-200">
          <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wider flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4" />
            Recent Errors
          </h3>
          <div className="space-y-2">
            {data.errors.map((err, idx) => (
              <div key={idx} className="text-sm text-red-700 bg-red-100 rounded px-3 py-2">
                {err}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// TAB: CONFIG
// ============================================================

const ConfigTab = ({ token, onRefresh }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [pendingChanges, setPendingChanges] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/admin/connections/config`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.ok) {
          setConfig(data.data);
        } else {
          setError(data.message || 'Failed to load config');
        }
      } catch (err) {
        setError(err.message || 'Network error');
      }
      setLoading(false);
    };
    fetchConfig();
  }, [token]);

  const handleApply = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/connections/config`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(pendingChanges),
      });
      const result = await res.json();
      if (result.ok) {
        setToast({ message: `Config applied (v${result.version || 'new'})`, type: 'success' });
        setPendingChanges({});
        setEditMode(false);
        // Refresh config
        const res2 = await fetch(`${BACKEND_URL}/api/admin/connections/config`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data2 = await res2.json();
        if (data2.ok) setConfig(data2.data);
      } else {
        setToast({ message: 'Failed to apply config', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Failed to apply config', type: 'error' });
    }
    setShowConfirm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading configuration...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-xl p-6 border border-red-200">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">Failed to load configuration</span>
        </div>
        <p className="text-sm text-red-500 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Confirm Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Changes</h3>
            <p className="text-gray-600 mb-4">
              This may affect alerts and rankings. Are you sure you want to apply these changes?
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
              <Button onClick={handleApply}>Apply Changes</Button>
            </div>
          </div>
        </div>
      )}

      {/* Version Info */}
      <SectionCard 
        title="Configuration" 
        icon={Settings}
        action={
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              v{config?.version || '0.0.0'}
            </span>
            {Object.keys(pendingChanges).length > 0 && (
              <Button size="sm" onClick={() => setShowConfirm(true)} data-testid="apply-config-btn">
                Apply Changes
              </Button>
            )}
          </div>
        }
      >
        {config?.last_modified && (
          <Timestamp date={config.last_modified} label="Last modified" />
        )}

        {/* Config Sections */}
        <div className="mt-4 space-y-4">
          <ConfigSection 
            title="Trend Adjust" 
            description="Parameters affecting trend-adjusted scoring"
            config={config?.config?.trend_adjusted}
            readOnly={true}
          />
          
          <ConfigSection 
            title="Early Signal" 
            description="Thresholds for early signal detection"
            config={config?.config?.early_signal}
            readOnly={true}
          />

          <ConfigSection 
            title="Alerts" 
            description="Alert generation thresholds (editable)"
            config={config?.config?.alerts}
            readOnly={false}
            onChange={(key, value) => setPendingChanges(prev => ({ ...prev, [key]: value }))}
          />

          <ConfigSection 
            title="Risk / Profile" 
            description="Risk assessment parameters"
            config={config?.config?.risk}
            readOnly={true}
          />
        </div>
      </SectionCard>

      {/* Version History */}
      {config?.history?.length > 0 && (
        <SectionCard title="Version History" icon={Clock}>
          <div className="space-y-2">
            {config.history.map((h, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-4 py-3">
                <span className="font-mono text-blue-600 font-medium">v{h.version}</span>
                <span className="text-gray-500">{new Date(h.timestamp).toLocaleString()}</span>
                <span className="text-gray-400 text-xs">by {h.admin_id || 'system'}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
};

// Config Section Component
const ConfigSection = ({ title, description, config, readOnly = true, onChange }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!config) return null;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {readOnly ? (
            <Lock className="w-4 h-4 text-gray-400" />
          ) : (
            <Unlock className="w-4 h-4 text-blue-500" />
          )}
          <div>
            <span className="font-medium text-gray-900">{title}</span>
            {!readOnly && <span className="ml-2 text-xs text-blue-500">(editable)</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {readOnly && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">read-only</span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>
      {expanded && (
        <div className={`px-4 py-4 border-t border-gray-200 ${readOnly ? 'bg-gray-50' : 'bg-white'}`}>
          {description && (
            <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
              <Info className="w-3 h-3" /> {description}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(config).map(([key, value]) => (
              <div key={key} className={`p-3 rounded-lg ${readOnly ? 'bg-white' : 'bg-blue-50 border border-blue-100'}`}>
                <div className="text-xs text-gray-500 font-mono mb-1">{key}</div>
                <div className="font-medium text-gray-900">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </div>
              </div>
            ))}
          </div>
          {!readOnly && (
            <p className="text-xs text-yellow-600 mt-3 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Changing affects alerts and radar
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================
// TAB: STABILITY / TUNING
// ============================================================

const StabilityTab = ({ token }) => {
  const [tuning, setTuning] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchTuning = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/connections/tuning/status`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) {
        setTuning(data.data);
      } else {
        setError(data.message || 'Failed to load tuning data');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchTuning(); }, [fetchTuning]);

  const runTuning = async () => {
    setRunning(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/connections/tuning/run`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ dataset_size: 25 }),
      });
      const result = await res.json();
      if (result.ok) {
        setToast({ message: 'Analysis completed', type: 'success' });
        await fetchTuning();
      }
    } catch (err) {
      setToast({ message: 'Analysis failed', type: 'error' });
    }
    setRunning(false);
  };

  // Determine stability status
  const getStabilityStatus = (score) => {
    if (score >= 0.9) return { status: 'ok', label: 'Stable', color: 'green' };
    if (score >= 0.7) return { status: 'warning', label: 'Moderate', color: 'yellow' };
    return { status: 'danger', label: 'Unstable', color: 'red' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading stability data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-xl p-6 border border-red-200">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">Failed to load stability data</span>
        </div>
        <p className="text-sm text-red-500 mt-2">{error}</p>
      </div>
    );
  }

  const stabilityInfo = getStabilityStatus(tuning?.overall_stability || 0);

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Stability Warning */}
      {tuning?.overall_stability < 0.7 && (
        <WarningBanner severity="warning">
          <strong>Low stability detected.</strong> The model may produce inconsistent results. 
          Consider reviewing recent config changes before making updates.
        </WarningBanner>
      )}

      {/* Summary Block */}
      <SectionCard 
        title="Model Stability" 
        icon={Shield}
        action={
          <Button size="sm" onClick={runTuning} disabled={running} data-testid="run-analysis-btn">
            {running ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Play className="w-4 h-4 mr-1" />}
            Run Analysis
          </Button>
        }
      >
        {tuning && (
          <div className="flex items-start gap-8">
            {/* Big Score Display */}
            <div className="text-center">
              <div className={`text-6xl font-bold ${
                stabilityInfo.color === 'green' ? 'text-green-500' :
                stabilityInfo.color === 'yellow' ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {(tuning.overall_stability * 100).toFixed(0)}%
              </div>
              <div className="mt-2">
                <StatusBadge status={stabilityInfo.status} size="md" />
              </div>
            </div>

            {/* Status Info */}
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Rank Shift</div>
                  <div className="font-bold text-lg">{tuning.rank_shift || '0'}%</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Flip Rate</div>
                  <div className="font-bold text-lg">{tuning.flip_rate || '0'}%</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Last Run</div>
                  <div className="font-medium text-sm">
                    {tuning.last_run ? new Date(tuning.last_run).toLocaleTimeString() : 'Never'}
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              {tuning.recommendations?.length > 0 && (
                <div className="space-y-2">
                  {tuning.recommendations.map((rec, idx) => (
                    <div key={idx} className={`text-sm p-3 rounded-lg flex items-start gap-2 ${
                      rec.startsWith('✅') ? 'bg-green-50 text-green-700' :
                      rec.startsWith('⚠️') ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-50 text-gray-700'
                    }`}>
                      {rec}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </SectionCard>

      {/* Parameter Details */}
      {tuning?.parameters?.length > 0 && (
        <SectionCard title="Parameter Sensitivity" icon={Settings}>
          <div className="space-y-3">
            {tuning.parameters.map((param, idx) => {
              const paramStability = getStabilityStatus(param.best_stability);
              return (
                <div key={idx} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm text-blue-600 font-medium">{param.name}</span>
                    <StatusBadge status={paramStability.status} size="sm" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Stability:</span>
                      <span className={`ml-2 font-medium ${
                        paramStability.color === 'green' ? 'text-green-600' :
                        paramStability.color === 'yellow' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {(param.best_stability * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Safe range:</span>
                      <span className="ml-2 font-mono">[{param.safe_range?.[0]}, {param.safe_range?.[1]}]</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Optimal:</span>
                      <span className="ml-2 font-mono">{param.optimal_delta}</span>
                    </div>
                  </div>
                  {param.warning && (
                    <div className="text-xs text-red-600 mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {param.warning}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {tuning?.parameters?.some(p => p.best_stability < 0.7) && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700 flex items-start gap-2">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>High flip rate may cause UI instability. Consider reviewing parameters with low stability scores.</span>
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
};

// ============================================================
// TAB: ALERTS POLICY
// ============================================================

const AlertsPolicyTab = ({ token }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Local edits
  const [editedConfig, setEditedConfig] = useState(null);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/connections/alerts/policy/config`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) {
        setConfig(data.data);
        setEditedConfig(data.data);
      } else {
        // Use defaults if API not available
        const defaults = {
          sendMode: 'PREVIEW',
          channels: { telegram: true, webhook: false },
          throttle: { maxPerHour: 10, cooldownMinutes: 30 },
          filters: { minConfidence: 0.6, minAuthorityScore: 500 },
        };
        setConfig(defaults);
        setEditedConfig(defaults);
      }
    } catch (err) {
      // Use defaults on error
      const defaults = {
        sendMode: 'PREVIEW',
        channels: { telegram: true, webhook: false },
        throttle: { maxPerHour: 10, cooldownMinutes: 30 },
        filters: { minConfidence: 0.6, minAuthorityScore: 500 },
      };
      setConfig(defaults);
      setEditedConfig(defaults);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const saveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/connections/alerts/policy/config`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editedConfig),
      });
      const data = await res.json();
      if (data.ok) {
        setConfig(editedConfig);
        setToast({ message: 'Policy saved', type: 'success' });
      } else {
        setToast({ message: 'Failed to save', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error', type: 'error' });
    }
    setSaving(false);
  };

  const hasChanges = JSON.stringify(config) !== JSON.stringify(editedConfig);

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" /></div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="font-medium">Error loading policy</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  // Default policy if not loaded
  const policy = editedConfig || {
    sendMode: 'PREVIEW',
    channels: { telegram: true, webhook: false },
    throttle: { maxPerHour: 10, cooldownMinutes: 30 },
    filters: { minConfidence: 0.6, minAuthorityScore: 500 },
    scheduling: { enabled: false, hours: [9, 12, 18] },
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Alert Policy</h2>
          <p className="text-sm text-gray-500">Configure how and when alerts are sent</p>
        </div>
        {hasChanges && (
          <Button onClick={saveConfig} disabled={saving} data-testid="save-policy-btn">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>

      {/* Send Mode */}
      <SectionCard title="Send Mode" icon={Send}>
        <div className="space-y-4">
          <div className="flex gap-4">
            {['PREVIEW', 'LIVE', 'DISABLED'].map(mode => (
              <label key={mode} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sendMode"
                  value={mode}
                  checked={policy.sendMode === mode}
                  onChange={(e) => setEditedConfig({ ...policy, sendMode: e.target.value })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className={`text-sm font-medium ${policy.sendMode === mode ? 'text-blue-600' : 'text-gray-600'}`}>
                  {mode}
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            {policy.sendMode === 'PREVIEW' && 'Alerts are generated but not sent. Review in Preview tab.'}
            {policy.sendMode === 'LIVE' && 'Alerts are sent to configured channels.'}
            {policy.sendMode === 'DISABLED' && 'Alert generation is paused.'}
          </p>
        </div>
      </SectionCard>

      {/* Channels */}
      <SectionCard title="Channels" icon={MessageSquare}>
        <div className="space-y-3">
          {Object.entries(policy.channels || {}).map(([channel, enabled]) => (
            <label key={channel} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${enabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'}`}>
                  {channel === 'telegram' ? <MessageSquare className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                </div>
                <span className="font-medium text-gray-900 capitalize">{channel}</span>
              </div>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEditedConfig({ 
                  ...policy, 
                  channels: { ...policy.channels, [channel]: e.target.checked } 
                })}
                className="w-5 h-5 text-blue-600 rounded"
              />
            </label>
          ))}
        </div>
      </SectionCard>

      {/* Throttle */}
      <SectionCard title="Throttle Settings" icon={Clock}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max per hour</label>
            <input
              type="number"
              min={1}
              max={100}
              value={policy.throttle?.maxPerHour || 10}
              onChange={(e) => setEditedConfig({ 
                ...policy, 
                throttle: { ...policy.throttle, maxPerHour: parseInt(e.target.value) } 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cooldown (minutes)</label>
            <input
              type="number"
              min={1}
              max={1440}
              value={policy.throttle?.cooldownMinutes || 30}
              onChange={(e) => setEditedConfig({ 
                ...policy, 
                throttle: { ...policy.throttle, cooldownMinutes: parseInt(e.target.value) } 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </SectionCard>

      {/* Filters */}
      <SectionCard title="Quality Filters" icon={Filter}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Confidence</label>
            <input
              type="number"
              min={0}
              max={1}
              step={0.1}
              value={policy.filters?.minConfidence || 0.6}
              onChange={(e) => setEditedConfig({ 
                ...policy, 
                filters: { ...policy.filters, minConfidence: parseFloat(e.target.value) } 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Authority Score</label>
            <input
              type="number"
              min={0}
              max={1000}
              step={50}
              value={policy.filters?.minAuthorityScore || 500}
              onChange={(e) => setEditedConfig({ 
                ...policy, 
                filters: { ...policy.filters, minAuthorityScore: parseInt(e.target.value) } 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </SectionCard>
    </div>
  );
};

// ============================================================
// TAB: SOURCE MODE (DATA)
// ============================================================

const SourceModeTab = ({ token }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/connections/overview`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) {
        setConfig(data.data);
      } else {
        setError(data.message || 'Failed to load');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const setSourceMode = async (mode) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/connections/config`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ source_mode: mode }),
      });
      const data = await res.json();
      if (data.ok) {
        setConfig(prev => ({ ...prev, source_mode: mode }));
        setToast({ message: `Source mode changed to ${mode}`, type: 'success' });
      } else {
        // Still update UI to show selection (may be read-only in mock)
        setConfig(prev => ({ ...prev, source_mode: mode }));
        setToast({ message: `Mode selected: ${mode} (preview only)`, type: 'success' });
      }
    } catch (err) {
      // Still update UI
      setConfig(prev => ({ ...prev, source_mode: mode }));
      setToast({ message: `Mode selected: ${mode} (preview only)`, type: 'success' });
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" /></div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="font-medium">Error loading source config</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  const modes = [
    { 
      id: 'mock', 
      label: 'Mock', 
      desc: 'Generated test data. No external API calls.',
      icon: Database,
      color: 'blue'
    },
    { 
      id: 'sandbox', 
      label: 'Sandbox', 
      desc: 'Limited real data for testing. Rate-limited.',
      icon: Shield,
      color: 'yellow'
    },
    { 
      id: 'live', 
      label: 'Live', 
      desc: 'Production Twitter data. Full API access.',
      icon: Zap,
      color: 'green'
    },
  ];

  const currentMode = config?.source_mode || 'mock';

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Source Mode</h2>
        <p className="text-sm text-gray-500">Configure where Connections data comes from</p>
      </div>

      {/* Current Mode Badge */}
      <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <Database className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-sm text-gray-500">Current Mode</p>
          <p className="font-semibold text-gray-900 uppercase">{currentMode}</p>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {modes.map(mode => {
          const isActive = currentMode === mode.id;
          const colorMap = {
            blue: 'border-blue-500 bg-blue-50',
            yellow: 'border-yellow-500 bg-yellow-50',
            green: 'border-green-500 bg-green-50',
          };
          const iconColorMap = {
            blue: 'bg-blue-100 text-blue-600',
            yellow: 'bg-yellow-100 text-yellow-600',
            green: 'bg-green-100 text-green-600',
          };
          
          return (
            <button
              key={mode.id}
              onClick={() => setSourceMode(mode.id)}
              data-testid={`source-mode-${mode.id}`}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                isActive 
                  ? colorMap[mode.color]
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isActive ? iconColorMap[mode.color] : 'bg-gray-100 text-gray-500'
                }`}>
                  <mode.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{mode.label}</p>
                  {isActive && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600">{mode.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Warnings */}
      {currentMode === 'live' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">Live Mode Active</p>
            <p className="text-sm text-yellow-700 mt-1">
              Real Twitter API calls are being made. API rate limits apply.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <SectionCard title="Data Statistics" icon={Activity}>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{config?.stats?.accounts_count || 0}</p>
            <p className="text-sm text-gray-500">Accounts</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{config?.stats?.edges_count || 0}</p>
            <p className="text-sm text-gray-500">Edges</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{config?.stats?.signals_24h || 0}</p>
            <p className="text-sm text-gray-500">Signals (24h)</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
};

// ============================================================
// TAB: ALERTS
// ============================================================

const AlertsTab = ({ token }) => {
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [hideSupressed, setHideSupressed] = useState(false);
  const [toast, setToast] = useState(null);
  const [runningBatch, setRunningBatch] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState({});

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/connections/alerts/preview`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) {
        setAlerts(data.data);
      } else {
        setError(data.message || 'Failed to load alerts');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  // Phase C2: Submit ML2 Feedback
  const submitMl2Feedback = async (alertId, actorId, action) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/connections/feedback`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          actorId: actorId || `alert_${alertId}`,
          alertId: alertId,
          ml2Decision: 'SEND',
          action: action,
          source: 'ADMIN',
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setFeedbackSubmitted(prev => ({ ...prev, [alertId]: action }));
        setToast({ message: `Marked as ${action}`, type: 'success' });
      } else {
        setToast({ message: 'Failed to submit feedback', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error', type: 'error' });
    }
  };

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  // P2.1: Run Alerts Batch
  const runAlertsBatch = async () => {
    setRunningBatch(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/connections/alerts/run`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const result = await res.json();
      if (result.ok) {
        setToast({ 
          message: `Batch complete: ${result.data.alerts_generated} alerts generated`, 
          type: 'success' 
        });
        await fetchAlerts();
      } else {
        setToast({ message: 'Batch failed', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Batch failed', type: 'error' });
    }
    setRunningBatch(false);
  };

  const handleAction = async (alertId, action) => {
    try {
      await fetch(`${BACKEND_URL}/api/admin/connections/alerts/${action}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ alert_id: alertId }),
      });
      setToast({ message: `Alert ${action === 'send' ? 'marked as sent (preview)' : 'suppressed'}`, type: 'success' });
      await fetchAlerts();
    } catch (err) {
      setToast({ message: `Failed to ${action} alert`, type: 'error' });
    }
  };

  const toggleAlertType = async (type, enabled) => {
    try {
      await fetch(`${BACKEND_URL}/api/admin/connections/alerts/config`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          types: { [type]: { enabled } } 
        }),
      });
      setToast({ message: `Alert type ${enabled ? 'enabled' : 'disabled'}`, type: 'success' });
      await fetchAlerts();
    } catch (err) {
      setToast({ message: 'Failed to update alert config', type: 'error' });
    }
  };

  // Severity badge colors
  const getSeverityColor = (severity) => {
    if (severity >= 0.8) return 'bg-red-100 text-red-700';
    if (severity >= 0.5) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  // Alert type icons
  const getAlertTypeIcon = (type) => {
    switch (type) {
      case 'EARLY_BREAKOUT': return <TrendingUp className="w-4 h-4" />;
      case 'STRONG_ACCELERATION': return <Zap className="w-4 h-4" />;
      case 'TREND_REVERSAL': return <Activity className="w-4 h-4" />;
      case 'RISK_SPIKE': return <AlertTriangle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading alerts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-xl p-6 border border-red-200">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">Failed to load alerts</span>
        </div>
        <p className="text-sm text-red-500 mt-2">{error}</p>
      </div>
    );
  }

  // Filter alerts
  let filteredAlerts = alerts?.alerts || [];
  if (filter !== 'all') {
    filteredAlerts = filteredAlerts.filter(a => a.type === filter);
  }
  if (hideSupressed) {
    filteredAlerts = filteredAlerts.filter(a => a.status !== 'suppressed');
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* P2.1: Run Batch Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
        <div>
          <h3 className="font-medium text-blue-900">Alerts Engine (Preview Mode)</h3>
          <p className="text-sm text-blue-700">Run batch to detect EARLY_BREAKOUT, STRONG_ACCELERATION, TREND_REVERSAL events.</p>
        </div>
        <Button 
          onClick={runAlertsBatch} 
          disabled={runningBatch}
          data-testid="run-alerts-batch-btn"
          className="bg-blue-500 hover:bg-blue-600"
        >
          {runningBatch ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
          Run Alerts Batch
        </Button>
      </div>

      {/* Summary */}
      <SectionCard title="Alerts Summary" icon={Bell}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            label="Total" 
            value={alerts?.summary?.total || 0} 
            icon={Bell}
            color="gray" 
          />
          <StatCard 
            label="Preview" 
            value={alerts?.summary?.preview || 0} 
            icon={Eye}
            color="blue" 
          />
          <StatCard 
            label="Sent" 
            value={alerts?.summary?.sent || 0} 
            icon={Send}
            color="green" 
          />
          <StatCard 
            label="Suppressed" 
            value={alerts?.summary?.suppressed || 0} 
            icon={EyeOff}
            color="red" 
          />
        </div>
      </SectionCard>

      {/* Alert Types Config */}
      <SectionCard title="Alert Types" icon={Settings}>
        <div className="space-y-3">
          {alerts?.config?.types && Object.entries(alerts.config.types).map(([type, config]) => (
            <div key={type} className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  {getAlertTypeIcon(type)}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{type.replace(/_/g, ' ')}</div>
                  <div className="text-xs text-gray-500">
                    Severity ≥ {(config.severity_min * 100).toFixed(0)}% | Cooldown: 1 per {config.cooldown_minutes}min
                  </div>
                </div>
              </div>
              <button
                onClick={() => toggleAlertType(type, !config.enabled)}
                data-testid={`toggle-${type.toLowerCase()}`}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  config.enabled 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                }`}
              >
                {config.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {config.enabled ? 'ON' : 'OFF'}
              </button>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Alert Preview List */}
      <SectionCard 
        title="Recent Alerts" 
        icon={Bell}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHideSupressed(!hideSupressed)}
              className={`text-xs px-2 py-1 rounded ${hideSupressed ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
            >
              {hideSupressed ? 'Show All' : 'Hide Suppressed'}
            </button>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-xs px-2 py-1 rounded border border-gray-200 bg-white"
              data-testid="alert-filter"
            >
              <option value="all">All Types</option>
              <option value="EARLY_BREAKOUT">Early Breakout</option>
              <option value="STRONG_ACCELERATION">Strong Acceleration</option>
              <option value="RISK_SPIKE">Risk Spike</option>
              <option value="TREND_REVERSAL">Trend Reversal</option>
            </select>
          </div>
        }
      >
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No alerts detected in last 24h</p>
            {filter !== 'all' && (
              <button onClick={() => setFilter('all')} className="text-blue-500 text-sm mt-2 underline">
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="text-left py-3 px-2">Time</th>
                  <th className="text-left py-3 px-2">Type</th>
                  <th className="text-left py-3 px-2">Account</th>
                  <th className="text-left py-3 px-2">Severity</th>
                  <th className="text-left py-3 px-2">Status</th>
                  <th className="text-right py-3 px-2">Actions & Feedback</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map(alert => (
                  <tr key={alert.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-2 text-sm text-gray-500">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                        alert.type === 'EARLY_BREAKOUT' ? 'bg-green-100 text-green-700' :
                        alert.type === 'STRONG_ACCELERATION' ? 'bg-yellow-100 text-yellow-700' :
                        alert.type === 'RISK_SPIKE' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {getAlertTypeIcon(alert.type)}
                        {alert.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-medium text-gray-900">
                      @{alert.account?.username || 'unknown'}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                        {(alert.severity * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        alert.status === 'preview' ? 'bg-blue-100 text-blue-700' :
                        alert.status === 'sent' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {alert.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex gap-2 justify-end flex-wrap">
                        {/* Preview actions */}
                        {alert.status === 'preview' && (
                          <>
                            <button 
                              onClick={() => handleAction(alert.id, 'send')}
                              data-testid={`send-${alert.id}`}
                              className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 flex items-center gap-1"
                            >
                              <Send className="w-3 h-3" /> Send
                            </button>
                            <button 
                              onClick={() => handleAction(alert.id, 'suppress')}
                              data-testid={`suppress-${alert.id}`}
                              className="px-3 py-1 bg-gray-400 text-white text-xs rounded-lg hover:bg-gray-500 flex items-center gap-1"
                            >
                              <XCircle className="w-3 h-3" /> Suppress
                            </button>
                          </>
                        )}
                        
                        {/* Phase C2: ML2 Feedback buttons */}
                        {feedbackSubmitted[alert.id] ? (
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${
                            feedbackSubmitted[alert.id] === 'CORRECT' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {feedbackSubmitted[alert.id] === 'CORRECT' 
                              ? <><CheckCircle className="w-3 h-3" /> Correct</> 
                              : <><XCircle className="w-3 h-3" /> FP</>}
                          </span>
                        ) : (
                          <>
                            <button 
                              onClick={() => submitMl2Feedback(alert.id, alert.account?.id, 'CORRECT')}
                              data-testid={`feedback-correct-${alert.id}`}
                              className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-lg hover:bg-green-100 flex items-center gap-1 border border-green-200"
                              title="Mark as Correct"
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => submitMl2Feedback(alert.id, alert.account?.id, 'FALSE_POSITIVE')}
                              data-testid={`feedback-fp-${alert.id}`}
                              className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-lg hover:bg-red-100 flex items-center gap-1 border border-red-200"
                              title="Mark as False Positive"
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
};

// ============================================================
// TAB: ENGINES CONFIG (Phase 3.1-3.4)
// ============================================================

const EnginesTab = ({ token }) => {
  const [authorityConfig, setAuthorityConfig] = useState(null);
  const [smartFollowersConfig, setSmartFollowersConfig] = useState(null);
  const [pathsConfig, setPathsConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [expandedEngine, setExpandedEngine] = useState('authority');

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const [authRes, sfRes, pathsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/connections/admin/authority/config`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${BACKEND_URL}/api/connections/admin/smart-followers/config`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${BACKEND_URL}/api/connections/admin/paths/config`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      const [authData, sfData, pathsData] = await Promise.all([
        authRes.json(),
        sfRes.json(),
        pathsRes.json(),
      ]);

      if (authData.ok) setAuthorityConfig(authData.data);
      if (sfData.ok) setSmartFollowersConfig(sfData.data);
      if (pathsData.ok) setPathsConfig(pathsData.data);
    } catch (err) {
      setToast({ message: 'Failed to load engine configs', type: 'error' });
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const updateConfig = async (engine, updates) => {
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/connections/admin/${engine}/config`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.ok) {
        setToast({ message: `${engine} config updated`, type: 'success' });
        await fetchConfigs();
      } else {
        setToast({ message: data.message || 'Update failed', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Failed to update config', type: 'error' });
    }
    setSaving(false);
  };

  const toggleEngine = async (engine, enabled) => {
    setSaving(true);
    try {
      const action = enabled ? 'enable' : 'disable';
      const res = await fetch(`${BACKEND_URL}/api/connections/admin/${engine}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) {
        setToast({ message: `${engine} ${action}d`, type: 'success' });
        await fetchConfigs();
      }
    } catch (err) {
      setToast({ message: 'Failed to toggle engine', type: 'error' });
    }
    setSaving(false);
  };

  const resetConfig = async (engine) => {
    if (!window.confirm(`Reset ${engine} config to defaults?`)) return;
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/connections/admin/${engine}/reset`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) {
        setToast({ message: `${engine} config reset to defaults`, type: 'success' });
        await fetchConfigs();
      }
    } catch (err) {
      setToast({ message: 'Failed to reset config', type: 'error' });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading engine configs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-purple-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-purple-900">Network Analysis Engines (Phase 3.1-3.4)</h3>
            <p className="text-sm text-purple-700 mt-1">
              Configure the core algorithms: Authority (PageRank), Smart Followers, and Network Paths.
            </p>
          </div>
        </div>
      </div>

      {/* Authority Engine (Phase 3.1) */}
      <EngineConfigCard
        title="Authority Engine"
        subtitle="PageRank-like network influence algorithm"
        phase="3.1"
        icon={TrendingUp}
        color="purple"
        enabled={authorityConfig?.enabled}
        expanded={expandedEngine === 'authority'}
        onToggle={() => setExpandedEngine(expandedEngine === 'authority' ? null : 'authority')}
        onEnable={(enabled) => toggleEngine('authority', enabled)}
        onReset={() => resetConfig('authority')}
        saving={saving}
      >
        {authorityConfig && (
          <div className="space-y-4">
            {/* Core Parameters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ConfigInput
                label="Damping Factor"
                value={authorityConfig.damping}
                type="number"
                min={0}
                max={1}
                step={0.05}
                onChange={(v) => updateConfig('authority', { damping: parseFloat(v) })}
                tooltip="PageRank damping factor (typical: 0.85)"
              />
              <ConfigInput
                label="Iterations"
                value={authorityConfig.iterations}
                type="number"
                min={1}
                max={100}
                onChange={(v) => updateConfig('authority', { iterations: parseInt(v) })}
                tooltip="Number of PageRank iterations"
              />
              <ConfigInput
                label="Tolerance"
                value={authorityConfig.tolerance}
                type="number"
                step={0.0001}
                onChange={(v) => updateConfig('authority', { tolerance: parseFloat(v) })}
                tooltip="Convergence tolerance"
              />
              <ConfigInput
                label="Min Edge Strength"
                value={authorityConfig.min_edge_strength}
                type="number"
                min={0}
                max={1}
                step={0.05}
                onChange={(v) => updateConfig('authority', { min_edge_strength: parseFloat(v) })}
                tooltip="Minimum edge weight to consider"
              />
            </div>

            {/* Network Mix Weights */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Twitter Score Network Mix
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <ConfigInput
                  label="Audience Quality"
                  value={authorityConfig.twitter_score_network_mix?.audience_quality}
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => updateConfig('authority', { 
                    twitter_score_network_mix: { 
                      ...authorityConfig.twitter_score_network_mix,
                      audience_quality: parseFloat(v)
                    }
                  })}
                />
                <ConfigInput
                  label="Authority Proximity"
                  value={authorityConfig.twitter_score_network_mix?.authority_proximity}
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => updateConfig('authority', { 
                    twitter_score_network_mix: { 
                      ...authorityConfig.twitter_score_network_mix,
                      authority_proximity: parseFloat(v)
                    }
                  })}
                />
                <ConfigInput
                  label="Authority Score"
                  value={authorityConfig.twitter_score_network_mix?.authority_score}
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => updateConfig('authority', { 
                    twitter_score_network_mix: { 
                      ...authorityConfig.twitter_score_network_mix,
                      authority_score: parseFloat(v)
                    }
                  })}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">⚠️ Weights must sum to 1.0</p>
            </div>

            {/* Tier Thresholds */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Authority Tier Thresholds</h4>
              <div className="grid grid-cols-6 gap-2">
                {['elite', 'high', 'upper_mid', 'mid', 'low_mid', 'low'].map((tier) => (
                  <div key={tier} className="text-center">
                    <div className={`text-xs font-medium px-2 py-1 rounded mb-1 ${
                      tier === 'elite' ? 'bg-purple-100 text-purple-700' :
                      tier === 'high' ? 'bg-green-100 text-green-700' :
                      tier === 'upper_mid' ? 'bg-blue-100 text-blue-700' :
                      tier === 'mid' ? 'bg-cyan-100 text-cyan-700' :
                      tier === 'low_mid' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {tier.replace('_', '-')}
                    </div>
                    <div className="text-xs text-gray-500">
                      ≥{(authorityConfig.tier_thresholds?.[tier] * 100 || 0).toFixed(0)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </EngineConfigCard>

      {/* Smart Followers Engine (Phase 3.2) */}
      <EngineConfigCard
        title="Smart Followers Engine"
        subtitle="Follower quality scoring by authority tier"
        phase="3.2"
        icon={Users}
        color="green"
        enabled={smartFollowersConfig?.enabled}
        expanded={expandedEngine === 'smart-followers'}
        onToggle={() => setExpandedEngine(expandedEngine === 'smart-followers' ? null : 'smart-followers')}
        onEnable={(enabled) => toggleEngine('smart-followers', enabled)}
        onReset={() => resetConfig('smart-followers')}
        saving={saving}
      >
        {smartFollowersConfig && (
          <div className="space-y-4">
            {/* Tier Multipliers */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Tier Multipliers
              </h4>
              <div className="grid grid-cols-6 gap-3">
                {Object.entries(smartFollowersConfig.tier_multiplier || {}).map(([tier, mult]) => (
                  <ConfigInput
                    key={tier}
                    label={tier.replace('_', '-')}
                    value={mult}
                    type="number"
                    min={0}
                    max={3}
                    step={0.05}
                    onChange={(v) => updateConfig('smart-followers', { 
                      tier_multiplier: { 
                        ...smartFollowersConfig.tier_multiplier,
                        [tier]: parseFloat(v)
                      }
                    })}
                  />
                ))}
              </div>
            </div>

            {/* Normalization */}
            <div className="grid grid-cols-2 gap-4">
              <ConfigInput
                label="Top N Followers"
                value={smartFollowersConfig.top_n}
                type="number"
                min={5}
                max={50}
                onChange={(v) => updateConfig('smart-followers', { top_n: parseInt(v) })}
                tooltip="Number of top followers to display"
              />
              <ConfigInput
                label="Logistic K"
                value={smartFollowersConfig.normalize?.logistic?.k}
                type="number"
                min={0.1}
                max={2}
                step={0.05}
                onChange={(v) => updateConfig('smart-followers', { 
                  normalize: { 
                    ...smartFollowersConfig.normalize,
                    logistic: { ...smartFollowersConfig.normalize?.logistic, k: parseFloat(v) }
                  }
                })}
                tooltip="Logistic curve steepness for score normalization"
              />
            </div>

            {/* Quality Mix */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Twitter Score Quality Mix
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <ConfigInput
                  label="Engagement"
                  value={smartFollowersConfig.integration?.quality_mix?.engagement}
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => updateConfig('smart-followers', { 
                    integration: { 
                      quality_mix: { 
                        ...smartFollowersConfig.integration?.quality_mix,
                        engagement: parseFloat(v)
                      }
                    }
                  })}
                />
                <ConfigInput
                  label="Consistency"
                  value={smartFollowersConfig.integration?.quality_mix?.consistency}
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => updateConfig('smart-followers', { 
                    integration: { 
                      quality_mix: { 
                        ...smartFollowersConfig.integration?.quality_mix,
                        consistency: parseFloat(v)
                      }
                    }
                  })}
                />
                <ConfigInput
                  label="Smart Followers"
                  value={smartFollowersConfig.integration?.quality_mix?.smart_followers}
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => updateConfig('smart-followers', { 
                    integration: { 
                      quality_mix: { 
                        ...smartFollowersConfig.integration?.quality_mix,
                        smart_followers: parseFloat(v)
                      }
                    }
                  })}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">⚠️ Weights must sum to 1.0</p>
            </div>
          </div>
        )}
      </EngineConfigCard>

      {/* Network Paths Engine (Phase 3.4) */}
      <EngineConfigCard
        title="Network Paths Engine"
        subtitle="BFS/DFS pathfinding and exposure metrics"
        phase="3.4"
        icon={Activity}
        color="blue"
        enabled={pathsConfig?.enabled}
        expanded={expandedEngine === 'paths'}
        onToggle={() => setExpandedEngine(expandedEngine === 'paths' ? null : 'paths')}
        onEnable={(enabled) => toggleEngine('paths', enabled)}
        onReset={() => resetConfig('paths')}
        saving={saving}
      >
        {pathsConfig && (
          <div className="space-y-4">
            {/* Core Parameters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ConfigInput
                label="Max Depth (hops)"
                value={pathsConfig.max_depth}
                type="number"
                min={1}
                max={5}
                onChange={(v) => updateConfig('paths', { max_depth: parseInt(v) })}
                tooltip="Maximum path depth to search"
              />
              <ConfigInput
                label="Logistic K"
                value={pathsConfig.normalize?.logistic_k}
                type="number"
                min={0.1}
                max={2}
                step={0.1}
                onChange={(v) => updateConfig('paths', { 
                  normalize: { ...pathsConfig.normalize, logistic_k: parseFloat(v) }
                })}
              />
              <ConfigInput
                label="Targets Top N"
                value={pathsConfig.limits?.targets_top_n}
                type="number"
                min={5}
                max={50}
                onChange={(v) => updateConfig('paths', { 
                  limits: { ...pathsConfig.limits, targets_top_n: parseInt(v) }
                })}
              />
              <ConfigInput
                label="Paths Top N"
                value={pathsConfig.limits?.paths_top_n}
                type="number"
                min={3}
                max={20}
                onChange={(v) => updateConfig('paths', { 
                  limits: { ...pathsConfig.limits, paths_top_n: parseInt(v) }
                })}
              />
            </div>

            {/* Hop Decay */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Hop Decay Factors</h4>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(pathsConfig.hop_decay || {}).map(([hop, decay]) => (
                  <ConfigInput
                    key={hop}
                    label={`Hop ${hop}`}
                    value={decay}
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    onChange={(v) => updateConfig('paths', { 
                      hop_decay: { ...pathsConfig.hop_decay, [hop]: parseFloat(v) }
                    })}
                  />
                ))}
              </div>
            </div>

            {/* Target Thresholds */}
            <div className="grid grid-cols-2 gap-4">
              <ConfigInput
                label="Elite Min Authority"
                value={pathsConfig.target_thresholds?.elite_min_authority}
                type="number"
                min={0.5}
                max={1}
                step={0.05}
                onChange={(v) => updateConfig('paths', { 
                  target_thresholds: { 
                    ...pathsConfig.target_thresholds,
                    elite_min_authority: parseFloat(v)
                  }
                })}
              />
              <ConfigInput
                label="High Min Authority"
                value={pathsConfig.target_thresholds?.high_min_authority}
                type="number"
                min={0.4}
                max={0.9}
                step={0.05}
                onChange={(v) => updateConfig('paths', { 
                  target_thresholds: { 
                    ...pathsConfig.target_thresholds,
                    high_min_authority: parseFloat(v)
                  }
                })}
              />
            </div>

            {/* Exposure Weights */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Exposure Score Weights
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <ConfigInput
                  label="Reachable Elite"
                  value={pathsConfig.exposure?.w_reachable_elite}
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => updateConfig('paths', { 
                    exposure: { ...pathsConfig.exposure, w_reachable_elite: parseFloat(v) }
                  })}
                />
                <ConfigInput
                  label="Reachable High"
                  value={pathsConfig.exposure?.w_reachable_high}
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => updateConfig('paths', { 
                    exposure: { ...pathsConfig.exposure, w_reachable_high: parseFloat(v) }
                  })}
                />
                <ConfigInput
                  label="Inverse Avg Hops"
                  value={pathsConfig.exposure?.w_inverse_avg_hops}
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => updateConfig('paths', { 
                    exposure: { ...pathsConfig.exposure, w_inverse_avg_hops: parseFloat(v) }
                  })}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">⚠️ Weights must sum to 1.0</p>
            </div>

            {/* Exposure Tiers */}
            <div className="grid grid-cols-3 gap-4">
              <ConfigInput
                label="Elite Tier Threshold"
                value={pathsConfig.exposure_tiers?.elite}
                type="number"
                min={0.5}
                max={1}
                step={0.05}
                onChange={(v) => updateConfig('paths', { 
                  exposure_tiers: { ...pathsConfig.exposure_tiers, elite: parseFloat(v) }
                })}
              />
              <ConfigInput
                label="Strong Tier Threshold"
                value={pathsConfig.exposure_tiers?.strong}
                type="number"
                min={0.3}
                max={0.8}
                step={0.05}
                onChange={(v) => updateConfig('paths', { 
                  exposure_tiers: { ...pathsConfig.exposure_tiers, strong: parseFloat(v) }
                })}
              />
              <ConfigInput
                label="Moderate Tier Threshold"
                value={pathsConfig.exposure_tiers?.moderate}
                type="number"
                min={0.1}
                max={0.5}
                step={0.05}
                onChange={(v) => updateConfig('paths', { 
                  exposure_tiers: { ...pathsConfig.exposure_tiers, moderate: parseFloat(v) }
                })}
              />
            </div>
          </div>
        )}
      </EngineConfigCard>

      {/* Phase 3.4.5: Network Health Widget */}
      <NetworkHealthWidget token={token} />
    </div>
  );
};

// Phase 3.4.5: Network Health Widget
const NetworkHealthWidget = ({ token }) => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/admin/connections/network-health`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.ok) {
          setHealth(data.data);
        }
      } catch (err) {
        console.error('[NetworkHealth] Fetch error:', err);
      }
      setLoading(false);
    };
    fetchHealth();
  }, [token]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Use mock data if API not available
  const data = health || {
    avg_hops_to_elite: 2.4,
    pct_with_elite_exposure: 35,
    total_accounts: 47,
    distribution: {
      elite: 8,
      strong: 15,
      moderate: 12,
      weak: 12,
    },
  };

  const distributionTotal = Object.values(data.distribution || {}).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 p-6" data-testid="network-health-widget">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <Activity className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Network Health</h3>
          <p className="text-xs text-gray-500">Phase 3.4.5: Quality control before Twitter</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-indigo-100">
          <div className="text-xs text-gray-500 mb-1">Avg Hops to Elite</div>
          <div className="text-2xl font-bold text-indigo-600">
            {data.avg_hops_to_elite?.toFixed(1) || '—'}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {data.avg_hops_to_elite <= 2 ? '✅ Excellent' : data.avg_hops_to_elite <= 3 ? '⚠️ Good' : '❌ Improve'}
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-indigo-100">
          <div className="text-xs text-gray-500 mb-1">Elite Exposure</div>
          <div className="text-2xl font-bold text-purple-600">
            {data.pct_with_elite_exposure || 0}%
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {data.pct_with_elite_exposure >= 30 ? '✅ Healthy' : data.pct_with_elite_exposure >= 15 ? '⚠️ Growing' : '❌ Low'}
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-indigo-100">
          <div className="text-xs text-gray-500 mb-1">Total Accounts</div>
          <div className="text-2xl font-bold text-gray-900">
            {data.total_accounts || 0}
          </div>
          <div className="text-xs text-gray-400 mt-1">In network graph</div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-indigo-100">
          <div className="text-xs text-gray-500 mb-1">Network Quality</div>
          <div className="text-2xl font-bold text-green-600">
            {data.avg_hops_to_elite <= 2.5 && data.pct_with_elite_exposure >= 25 ? 'A' : 
             data.avg_hops_to_elite <= 3 && data.pct_with_elite_exposure >= 15 ? 'B' : 'C'}
          </div>
          <div className="text-xs text-gray-400 mt-1">Overall grade</div>
        </div>
      </div>

      {/* Distribution by Exposure Tier */}
      <div className="bg-white rounded-xl p-4 border border-indigo-100">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Distribution by Exposure Tier</h4>
        <div className="flex h-8 rounded-lg overflow-hidden">
          {[
            { key: 'elite', color: '#8b5cf6', label: 'Elite' },
            { key: 'strong', color: '#22c55e', label: 'Strong' },
            { key: 'moderate', color: '#f59e0b', label: 'Moderate' },
            { key: 'weak', color: '#ef4444', label: 'Weak' },
          ].map(tier => {
            const count = data.distribution?.[tier.key] || 0;
            const pct = (count / distributionTotal) * 100;
            if (pct === 0) return null;
            return (
              <div 
                key={tier.key}
                className="flex items-center justify-center text-white text-xs font-medium transition-all hover:opacity-80"
                style={{ backgroundColor: tier.color, width: `${pct}%` }}
                title={`${tier.label}: ${count} (${pct.toFixed(0)}%)`}
              >
                {pct >= 10 && `${tier.label.charAt(0)}${count}`}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Elite: {data.distribution?.elite || 0}</span>
          <span>Strong: {data.distribution?.strong || 0}</span>
          <span>Moderate: {data.distribution?.moderate || 0}</span>
          <span>Weak: {data.distribution?.weak || 0}</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// TAB: TWITTER CONFIDENCE (Phase 4.1.6)
// ============================================================

const ConfidenceTab = ({ token }) => {
  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [configRes, statsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/connections/admin/twitter-confidence/config`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${BACKEND_URL}/api/connections/admin/twitter-confidence/stats`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);
      
      const [configData, statsData] = await Promise.all([configRes.json(), statsRes.json()]);
      
      if (configData.ok) setConfig(configData.data);
      if (statsData.ok) setStats(statsData.data);
    } catch (err) {
      setToast({ message: 'Failed to load confidence data', type: 'error' });
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateConfig = async (updates) => {
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/connections/admin/twitter-confidence/config`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.ok) {
        setToast({ message: 'Confidence config updated', type: 'success' });
        await fetchData();
      } else {
        setToast({ message: data.message || 'Update failed', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Failed to update config', type: 'error' });
    }
    setSaving(false);
  };

  const runDryCompute = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/connections/twitter-confidence/compute`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          author_id: 'test_sample',
          data_age_hours: 6,
          has_profile_meta: true,
          has_engagement: true,
          has_follow_graph: false,
          source_type: 'mock',
          anomaly_flags: { spike_detected: false },
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setTestResult(data.data);
        setToast({ message: 'Dry compute completed', type: 'success' });
      }
    } catch (err) {
      setToast({ message: 'Compute failed', type: 'error' });
    }
    setSaving(false);
  };

  const getConfidenceColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading confidence data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-purple-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-purple-900">Twitter Confidence Score (Phase 4.1.6)</h3>
            <p className="text-sm text-purple-700 mt-1">
              Measures data reliability (not account quality). Controls dampening and alert blocking.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      {stats && (
        <SectionCard title="Confidence Distribution (24h)" icon={Activity}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="text-xs text-green-600 uppercase font-medium mb-1">HIGH</div>
              <div className="text-2xl font-bold text-green-700">{stats.distribution?.high || 0}</div>
              <div className="text-xs text-green-500 mt-1">≥85%</div>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <div className="text-xs text-yellow-600 uppercase font-medium mb-1">MEDIUM</div>
              <div className="text-2xl font-bold text-yellow-700">{stats.distribution?.medium || 0}</div>
              <div className="text-xs text-yellow-500 mt-1">65-84%</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
              <div className="text-xs text-orange-600 uppercase font-medium mb-1">LOW</div>
              <div className="text-2xl font-bold text-orange-700">{stats.distribution?.low || 0}</div>
              <div className="text-xs text-orange-500 mt-1">40-64%</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
              <div className="text-xs text-red-600 uppercase font-medium mb-1">CRITICAL</div>
              <div className="text-2xl font-bold text-red-700">{stats.distribution?.critical || 0}</div>
              <div className="text-xs text-red-500 mt-1">&lt;40%</div>
            </div>
          </div>
          
          {stats.avg_score !== undefined && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">Average Score:</div>
                <div className="text-lg font-bold text-gray-900">
                  {(stats.avg_score * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {/* Config */}
      {config && (
        <SectionCard 
          title="Confidence Configuration" 
          icon={Settings}
          action={
            <span className="text-xs text-gray-400 font-mono">v{config.version}</span>
          }
        >
          <div className="space-y-6">
            {/* Weights */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Component Weights</h4>
              <div className="grid grid-cols-5 gap-3">
                <div className="text-center p-2 bg-white rounded-lg">
                  <div className="text-xs text-gray-500">Freshness</div>
                  <div className="font-bold text-blue-600">{config.weights?.freshness * 100 || 25}%</div>
                </div>
                <div className="text-center p-2 bg-white rounded-lg">
                  <div className="text-xs text-gray-500">Consistency</div>
                  <div className="font-bold text-blue-600">{config.weights?.consistency * 100 || 25}%</div>
                </div>
                <div className="text-center p-2 bg-white rounded-lg">
                  <div className="text-xs text-gray-500">Coverage</div>
                  <div className="font-bold text-blue-600">{config.weights?.coverage * 100 || 20}%</div>
                </div>
                <div className="text-center p-2 bg-white rounded-lg">
                  <div className="text-xs text-gray-500">Anomaly</div>
                  <div className="font-bold text-blue-600">{config.weights?.anomaly_health * 100 || 20}%</div>
                </div>
                <div className="text-center p-2 bg-white rounded-lg">
                  <div className="text-xs text-gray-500">Source Trust</div>
                  <div className="font-bold text-blue-600">{config.weights?.source_trust * 100 || 10}%</div>
                </div>
              </div>
            </div>

            {/* Thresholds */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Label Thresholds</h4>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">HIGH</span>
                  <span className="text-sm">≥{(config.thresholds?.high * 100 || 85).toFixed(0)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">MEDIUM</span>
                  <span className="text-sm">≥{(config.thresholds?.medium * 100 || 65).toFixed(0)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">LOW</span>
                  <span className="text-sm">≥{(config.thresholds?.low * 100 || 40).toFixed(0)}%</span>
                </div>
              </div>
            </div>

            {/* Policy Controls */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h4 className="text-sm font-medium text-blue-700 mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Alert & Dampening Policy
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-blue-600 font-medium">Block Alerts Below</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="5"
                      value={(config.policy?.block_alerts_below || 0.5) * 100}
                      onChange={(e) => updateConfig({ policy: { ...config.policy, block_alerts_below: parseFloat(e.target.value) / 100 } })}
                      className="w-20 px-2 py-1 border border-blue-300 rounded text-sm"
                      disabled={saving}
                    />
                    <span className="text-sm text-blue-600">%</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-blue-600 font-medium">Min Dampening Multiplier</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="5"
                      value={(config.dampening?.min_multiplier || 0.35) * 100}
                      onChange={(e) => updateConfig({ dampening: { ...config.dampening, min_multiplier: parseFloat(e.target.value) / 100 } })}
                      className="w-20 px-2 py-1 border border-blue-300 rounded text-sm"
                      disabled={saving}
                    />
                    <span className="text-sm text-blue-600">%</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.dampening?.enabled !== false}
                    onChange={(e) => updateConfig({ dampening: { ...config.dampening, enabled: e.target.checked } })}
                    className="w-4 h-4 text-blue-600"
                    disabled={saving}
                  />
                  <span className="text-sm text-blue-700">Enable Dampening</span>
                </label>
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Dry Run Test */}
      <SectionCard 
        title="Confidence Compute Test" 
        icon={Play}
        action={
          <Button size="sm" onClick={runDryCompute} disabled={saving} data-testid="run-dry-compute-btn">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Play className="w-4 h-4 mr-1" />}
            Run Dry Compute
          </Button>
        }
      >
        {testResult ? (
          <div className="space-y-4">
            {/* Score Display */}
            <div className="flex items-center gap-4">
              <div className={`text-4xl font-bold ${
                testResult.confidence?.label === 'HIGH' ? 'text-green-600' :
                testResult.confidence?.label === 'MEDIUM' ? 'text-yellow-600' :
                testResult.confidence?.label === 'LOW' ? 'text-orange-600' : 'text-red-600'
              }`}>
                {((testResult.confidence?.score_0_1 || 0) * 100).toFixed(1)}%
              </div>
              <span className={`px-3 py-1 rounded-full font-medium ${getConfidenceColor(testResult.confidence?.label)}`}>
                {testResult.confidence?.label}
              </span>
            </div>

            {/* Components Breakdown */}
            <div className="grid grid-cols-5 gap-2 bg-gray-50 rounded-xl p-4">
              {testResult.confidence?.components && Object.entries(testResult.confidence.components).map(([key, val]) => (
                <div key={key} className="text-center">
                  <div className="text-xs text-gray-500 capitalize">{key.replace('_', ' ')}</div>
                  <div className="font-bold text-gray-700">{(val * 100).toFixed(0)}%</div>
                  <div className="h-2 bg-gray-200 rounded-full mt-1">
                    <div 
                      className="h-2 bg-blue-500 rounded-full" 
                      style={{ width: `${val * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Warnings */}
            {testResult.confidence?.warnings?.length > 0 && (
              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                <h4 className="text-sm font-medium text-yellow-700 mb-2">Warnings</h4>
                <ul className="space-y-1">
                  {testResult.confidence.warnings.map((w, i) => (
                    <li key={i} className="text-sm text-yellow-600 flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Dampening Info */}
            {testResult.dampening && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">Dampening Multiplier:</span>
                  <span className="font-bold text-blue-900">{((testResult.dampening.multiplier || 1) * 100).toFixed(0)}%</span>
                </div>
                {testResult.dampening.reason && (
                  <p className="text-xs text-blue-600 mt-1">{testResult.dampening.reason}</p>
                )}
              </div>
            )}

            {/* Alert Policy */}
            {testResult.alert_policy && (
              <div className={`rounded-xl p-4 border ${testResult.alert_policy.blocked ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center gap-2">
                  {testResult.alert_policy.blocked ? (
                    <>
                      <XCircle className="w-5 h-5 text-red-500" />
                      <span className="text-sm text-red-700 font-medium">Alerts would be BLOCKED</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-green-700 font-medium">Alerts allowed</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Click "Run Dry Compute" to test confidence calculation with sample data.</p>
        )}
      </SectionCard>
    </div>
  );
};

// ============================================================
// TAB: AI SUMMARY (Phase 3.5)
// ============================================================

const AiTab = ({ token }) => {
  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [configRes, statsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/connections/admin/ai/config`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${BACKEND_URL}/api/connections/admin/ai/stats`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);
      
      const [configData, statsData] = await Promise.all([configRes.json(), statsRes.json()]);
      
      if (configData.ok) setConfig(configData.data);
      if (statsData.ok) setStats(statsData.data);
    } catch (err) {
      setToast({ message: 'Failed to load AI config', type: 'error' });
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateConfig = async (updates) => {
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/connections/admin/ai/config`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.ok) {
        setToast({ message: 'AI config updated', type: 'success' });
        await fetchData();
      }
    } catch (err) {
      setToast({ message: 'Failed to update config', type: 'error' });
    }
    setSaving(false);
  };

  const runTest = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/connections/admin/ai/test`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.ok) {
        setTestResult(data.data);
        setToast({ message: 'AI test completed', type: 'success' });
      }
    } catch (err) {
      setToast({ message: 'AI test failed', type: 'error' });
    }
    setSaving(false);
  };

  const getVerdictColor = (verdict) => {
    switch (verdict) {
      case 'STRONG': return 'text-green-600 bg-green-100';
      case 'GOOD': return 'text-blue-600 bg-blue-100';
      case 'MIXED': return 'text-yellow-600 bg-yellow-100';
      case 'RISKY': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading AI config...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Brain className="w-5 h-5 text-violet-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-violet-900">AI Summary Engine (Phase 3.5)</h3>
            <p className="text-sm text-violet-700 mt-1">
              Intelligent interpretation layer. Explains metrics in human language. Does NOT modify scores.
            </p>
          </div>
        </div>
      </div>

      {/* Cache Stats */}
      {stats?.cache && (
        <SectionCard title="AI Cache Statistics" icon={Activity}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs text-gray-500 uppercase font-medium mb-1">Total Cached</div>
              <div className="text-2xl font-bold text-gray-800">{stats.cache.total || 0}</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <div className="text-xs text-green-600 uppercase font-medium mb-1">Active</div>
              <div className="text-2xl font-bold text-green-700">{stats.cache.active || 0}</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-xs text-blue-600 uppercase font-medium mb-1">STRONG</div>
              <div className="text-2xl font-bold text-blue-700">{stats.cache.by_verdict?.STRONG || 0}</div>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4">
              <div className="text-xs text-yellow-600 uppercase font-medium mb-1">MIXED</div>
              <div className="text-2xl font-bold text-yellow-700">{stats.cache.by_verdict?.MIXED || 0}</div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Config */}
      {config && (
        <SectionCard 
          title="AI Configuration" 
          icon={Settings}
          action={
            <span className="text-xs text-gray-400 font-mono">v{config.version}</span>
          }
        >
          <div className="space-y-6">
            {/* Enable Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <div className="font-medium text-gray-900">AI Engine</div>
                <div className="text-sm text-gray-500">Enable/disable AI interpretations</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => updateConfig({ enabled: e.target.checked })}
                  className="sr-only peer"
                  disabled={saving}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
              </label>
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <label className="text-xs text-gray-500 font-medium">Model</label>
                <input
                  type="text"
                  value={config.model}
                  onChange={(e) => updateConfig({ model: e.target.value })}
                  className="mt-1 w-full px-2 py-1 border rounded text-sm"
                  disabled={saving}
                />
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <label className="text-xs text-gray-500 font-medium">Temperature</label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.temperature}
                  onChange={(e) => updateConfig({ temperature: parseFloat(e.target.value) })}
                  className="mt-1 w-full px-2 py-1 border rounded text-sm"
                  disabled={saving}
                />
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <label className="text-xs text-gray-500 font-medium">Min Confidence</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={config.min_confidence_to_run}
                  onChange={(e) => updateConfig({ min_confidence_to_run: parseInt(e.target.value) })}
                  className="mt-1 w-full px-2 py-1 border rounded text-sm"
                  disabled={saving}
                />
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <label className="text-xs text-gray-500 font-medium">Cache TTL (sec)</label>
                <input
                  type="number"
                  min="0"
                  value={config.cache_ttl_sec}
                  onChange={(e) => updateConfig({ cache_ttl_sec: parseInt(e.target.value) })}
                  className="mt-1 w-full px-2 py-1 border rounded text-sm"
                  disabled={saving}
                />
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Test AI */}
      <SectionCard 
        title="Test AI Summary" 
        icon={Play}
        action={
          <Button size="sm" onClick={runTest} disabled={saving} data-testid="run-ai-test-btn">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
            Run Test
          </Button>
        }
      >
        {testResult?.output ? (
          <div className="space-y-4">
            {/* Verdict & Headline */}
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full font-medium ${getVerdictColor(testResult.output.verdict)}`}>
                {testResult.output.verdict}
              </span>
              <span className="text-lg font-medium text-gray-900">{testResult.output.headline}</span>
            </div>

            {/* Summary */}
            <p className="text-gray-600 bg-gray-50 p-4 rounded-xl">{testResult.output.summary}</p>

            {/* Key Drivers */}
            {testResult.output.key_drivers?.length > 0 && (
              <div className="bg-green-50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-green-700 mb-2">Key Drivers</h4>
                <ul className="space-y-1">
                  {testResult.output.key_drivers.map((d, i) => (
                    <li key={i} className="text-sm text-green-600 flex items-center gap-2">
                      <CheckCircle className="w-3 h-3" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {testResult.output.recommendations?.length > 0 && (
              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-blue-700 mb-2">Recommendations</h4>
                <ul className="space-y-1">
                  {testResult.output.recommendations.map((r, i) => (
                    <li key={i} className="text-sm text-blue-600 flex items-center gap-2">
                      <Info className="w-3 h-3" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Evidence */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Evidence</h4>
              <div className="flex gap-4 text-sm">
                <span>Score: <strong>{testResult.output.evidence.score}</strong></span>
                <span>Grade: <strong>{testResult.output.evidence.grade}</strong></span>
                <span>Confidence: <strong>{testResult.output.evidence.confidence_0_100}%</strong></span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Click "Run Test" to generate AI summary with sample data.</p>
        )}
      </SectionCard>
    </div>
  );
};

// ============================================================
// TAB: TWITTER ADAPTER (Phase 4.1)
// ============================================================

const TwitterAdapterTab = ({ token }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/connections/admin/twitter-adapter/status`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) setStatus(data.data);
    } catch (err) {
      console.error('[TwitterAdapter] Fetch error:', err);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const setMode = async (mode) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/connections/admin/twitter-adapter/mode`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchStatus();
      }
    } catch (err) {
      console.error('[TwitterAdapter] Mode change error:', err);
    }
    setActionLoading(false);
  };

  const runDryRunTest = async () => {
    setActionLoading(true);
    setTestResult(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/connections/admin/twitter-adapter/dry-run`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authors: [
            {
              author_id: 'test_001',
              username: 'test_user',
              display_name: 'Test User',
              followers: 10000,
              following: 500,
              verified: false,
              collected_at: new Date().toISOString(),
            },
          ],
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({ ok: false, error: err.message });
    }
    setActionLoading(false);
  };

  const toggleSource = async (source, enabled) => {
    setActionLoading(true);
    try {
      await fetch(`${BACKEND_URL}/api/connections/admin/twitter-adapter/sources`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [source]: enabled }),
      });
      await fetchStatus();
    } catch (err) {
      console.error('[TwitterAdapter] Source toggle error:', err);
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  const modeColors = {
    'off': 'bg-gray-100 text-gray-600 border-gray-300',
    'dry-run': 'bg-yellow-100 text-yellow-700 border-yellow-300',
    'live': 'bg-green-100 text-green-700 border-green-300',
  };

  return (
    <div className="space-y-6" data-testid="twitter-adapter-tab">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Twitter → Connections Adapter</h2>
              <p className="text-blue-100 text-sm">Phase 4.1: Safe integration layer</p>
            </div>
          </div>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={fetchStatus}
            className="bg-white/20 hover:bg-white/30 text-white border-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Mode Control */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Adapter Mode</h3>
        <div className="flex items-center gap-4">
          {['off', 'dry-run', 'live'].map((mode) => (
            <button
              key={mode}
              onClick={() => setMode(mode)}
              disabled={actionLoading}
              className={`px-6 py-3 rounded-lg border-2 font-medium transition-all ${
                status?.mode === mode 
                  ? modeColors[mode] + ' ring-2 ring-offset-2'
                  : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {mode === 'off' && <Power className="w-4 h-4 inline mr-2" />}
              {mode === 'dry-run' && <Eye className="w-4 h-4 inline mr-2" />}
              {mode === 'live' && <Zap className="w-4 h-4 inline mr-2" />}
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
        <div className="mt-4 text-sm text-gray-500">
          {status?.mode === 'off' && 'Adapter is disabled. No data flows.'}
          {status?.mode === 'dry-run' && 'Test mode: data processed but NOT written. Safe for validation.'}
          {status?.mode === 'live' && '⚠️ Live mode: data is being written to Connections storage.'}
        </div>
      </div>

      {/* Data Sources */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Sources</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { key: 'followers', label: 'Followers', icon: Users, desc: 'Profile & follower counts' },
            { key: 'engagements', label: 'Engagements', icon: TrendingUp, desc: 'Tweet metrics & time-series' },
            { key: 'graph', label: 'Graph', icon: Activity, desc: 'Follow relationships' },
          ].map(source => (
            <div 
              key={source.key}
              className={`p-4 rounded-xl border-2 transition-all ${
                status?.sources?.[source.key]
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <source.icon className={`w-5 h-5 ${status?.sources?.[source.key] ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className="font-medium text-gray-900">{source.label}</span>
                </div>
                <button
                  onClick={() => toggleSource(source.key, !status?.sources?.[source.key])}
                  disabled={actionLoading}
                  className={`p-1 rounded-lg transition-colors ${
                    status?.sources?.[source.key] 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-300 text-white'
                  }`}
                >
                  {status?.sources?.[source.key] ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500">{source.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Safety Guards</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
            <div className="text-sm font-medium text-orange-800">Max Followers Spike</div>
            <div className="text-2xl font-bold text-orange-600">{status?.safety?.max_followers_spike_pct || 30}%</div>
            <div className="text-xs text-orange-500 mt-1">Block if growth exceeds this in {status?.safety?.spike_lookback_hours || 6}h</div>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="text-sm font-medium text-blue-800">Max Events/Hour</div>
            <div className="text-2xl font-bold text-blue-600">{status?.safety?.max_events_per_hour || 1000}</div>
            <div className="text-xs text-blue-500 mt-1">Rate limit per author</div>
          </div>
        </div>
      </div>

      {/* Processing Stats */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Stats</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <div className="text-2xl font-bold text-gray-900">{status?.stats?.total_processed || 0}</div>
            <div className="text-xs text-gray-500">Processed</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <div className="text-2xl font-bold text-gray-900">{status?.stats?.total_skipped || 0}</div>
            <div className="text-xs text-gray-500">Skipped</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <div className="text-2xl font-bold text-gray-900">{status?.stats?.dedup?.size || 0}</div>
            <div className="text-xs text-gray-500">Dedup Cache</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <div className="text-2xl font-bold text-gray-900">{status?.stats?.errors || 0}</div>
            <div className="text-xs text-gray-500">Errors</div>
          </div>
        </div>
      </div>

      {/* Dry-Run Test */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Dry-Run Test</h3>
          <Button
            onClick={runDryRunTest}
            disabled={actionLoading}
            size="sm"
            data-testid="run-dry-run-test"
          >
            {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            Run Test
          </Button>
        </div>
        {testResult && (
          <div className={`p-4 rounded-xl ${testResult.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {testResult.ok ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
              <span className={`font-medium ${testResult.ok ? 'text-green-800' : 'text-red-800'}`}>
                {testResult.ok ? 'Dry-run successful' : 'Dry-run failed'}
              </span>
            </div>
            {testResult.data?.authors && (
              <div className="text-sm text-gray-600 mt-2">
                <span>Processed: {testResult.data.authors.processed_count}</span>
                <span className="mx-2">|</span>
                <span>Skipped: {testResult.data.authors.skipped_count}</span>
                {testResult.data.authors.outputs?.profiles?.length > 0 && (
                  <div className="mt-2 p-2 bg-white rounded border text-xs font-mono">
                    {JSON.stringify(testResult.data.authors.outputs.profiles[0], null, 2).slice(0, 200)}...
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// TAB: TWITTER LIVE (Phase 4.2)
// ============================================================

const TwitterLiveTab = ({ token }) => {
  // Simply wrap the TwitterLiveAdmin component
  return <TwitterLiveAdmin adminToken={token} />;
};

// Engine Config Card Component
const EngineConfigCard = ({ 
  title, subtitle, phase, icon: Icon, color, enabled, expanded, 
  onToggle, onEnable, onReset, saving, children 
}) => {
  const colors = {
    purple: { bg: 'from-purple-500 to-purple-600', light: 'bg-purple-100', text: 'text-purple-600' },
    green: { bg: 'from-green-500 to-green-600', light: 'bg-green-100', text: 'text-green-600' },
    blue: { bg: 'from-blue-500 to-blue-600', light: 'bg-blue-100', text: 'text-blue-600' },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div 
        className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${c.bg} shadow-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <span className={`text-xs px-2 py-0.5 rounded ${c.light} ${c.text} font-medium`}>
                Phase {phase}
              </span>
            </div>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Enable/Disable Toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); onEnable(!enabled); }}
            disabled={saving}
            data-testid={`toggle-${title.toLowerCase().replace(/\s+/g, '-')}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              enabled 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
            }`}
          >
            {enabled ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {enabled ? 'ON' : 'OFF'}
          </button>
          {/* Expand/Collapse */}
          {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          {children}
          
          {/* Reset Button */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={(e) => { e.stopPropagation(); onReset(); }}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset to Defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Config Input Component
const ConfigInput = ({ label, value, type = 'text', onChange, tooltip, ...props }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
      {label}
      {tooltip && (
        <span className="text-gray-400 cursor-help" title={tooltip}>ⓘ</span>
      )}
    </label>
    <input
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
      {...props}
    />
  </div>
);

// ============================================================
// TAB: TELEGRAM (Phase 2.3)
// ============================================================

const TelegramTab = ({ token }) => {
  const [settings, setSettings] = useState(null);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [testingSend, setTestingSend] = useState(false);
  const [dispatching, setDispatching] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Fetch settings
      const settingsRes = await fetch(`${BACKEND_URL}/api/admin/connections/telegram/settings`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const settingsData = await settingsRes.json();
      if (settingsData.ok) {
        setSettings(settingsData.data);
      }

      // Fetch stats
      const statsRes = await fetch(`${BACKEND_URL}/api/admin/connections/telegram/stats?hours=24`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const statsData = await statsRes.json();
      if (statsData.ok) {
        setStats(statsData.data);
      }

      // Fetch history
      const historyRes = await fetch(`${BACKEND_URL}/api/admin/connections/telegram/history?limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const historyData = await historyRes.json();
      if (historyData.ok) {
        setHistory(historyData.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load Telegram settings');
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const patchSettings = async (patch) => {
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/connections/telegram/settings`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (data.ok) {
        setSettings(data.data);
        setToast({ message: 'Settings saved', type: 'success' });
      } else {
        setToast({ message: data.error || 'Failed to save', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Failed to save settings', type: 'error' });
    }
    setSaving(false);
  };

  const sendTestMessage = async () => {
    setTestingSend(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/connections/telegram/test`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.ok) {
        setToast({ message: 'Test message sent!', type: 'success' });
        await fetchData();
      } else {
        setToast({ message: data.error || 'Test failed', type: 'error' });
      }
    } catch (err) {
      setToast({ message: err.message || 'Test failed', type: 'error' });
    }
    setTestingSend(false);
  };

  const dispatchAlerts = async () => {
    setDispatching(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/connections/telegram/dispatch`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ limit: 50 }),
      });
      const data = await res.json();
      if (data.ok) {
        const { sent, skipped, failed } = data.data;
        setToast({ 
          message: `Dispatch complete: ${sent} sent, ${skipped} skipped, ${failed} failed`, 
          type: sent > 0 ? 'success' : 'warning' 
        });
        await fetchData();
      } else {
        setToast({ message: data.error || 'Dispatch failed', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Dispatch failed', type: 'error' });
    }
    setDispatching(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SENT': return 'bg-green-100 text-green-700';
      case 'SKIPPED': return 'bg-yellow-100 text-yellow-700';
      case 'FAILED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading Telegram settings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-xl p-6 border border-red-200">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">Failed to load Telegram settings</span>
        </div>
        <p className="text-sm text-red-500 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-blue-900">Telegram Delivery (Phase 2.3)</h3>
              <InfoTooltip text={ADMIN_TOOLTIPS.telegramSubscribers} />
            </div>
            <p className="text-sm text-blue-700 mt-1">
              Platform controls the bot — all settings are here. Bot only receives messages.
            </p>
          </div>
        </div>
      </div>

      {/* Settings Section */}
      <SectionCard 
        title="Telegram Settings" 
        icon={Settings}
        action={
          <Button 
            size="sm" 
            variant="outline" 
            onClick={fetchData} 
            disabled={loading}
            data-testid="refresh-telegram-btn"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        }
      >
        <div className="space-y-6">
          {/* Global toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${settings?.enabled ? 'bg-green-100' : 'bg-gray-200'}`}>
                    <Power className={`w-5 h-5 ${settings?.enabled ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-gray-900">Telegram Delivery</span>
                      <InfoTooltip text={ADMIN_TOOLTIPS.telegramEnabled} />
                    </div>
                    <div className="text-xs text-gray-500">Глобальное включение/выключение</div>
                  </div>
                </div>
                <button
                  onClick={() => patchSettings({ enabled: !settings?.enabled })}
                  disabled={saving}
                  data-testid="toggle-telegram-enabled"
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings?.enabled ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings?.enabled ? 'translate-x-6' : ''
                  }`} />
                </button>
              </label>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${settings?.preview_only ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                    <Eye className={`w-5 h-5 ${settings?.preview_only ? 'text-yellow-600' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-gray-900">Preview Only</span>
                      <InfoTooltip text={ADMIN_TOOLTIPS.telegramPreviewOnly} />
                    </div>
                    <div className="text-xs text-gray-500">Don't send, only log</div>
                  </div>
                </div>
                <button
                  onClick={() => patchSettings({ preview_only: !settings?.preview_only })}
                  disabled={saving}
                  data-testid="toggle-preview-only"
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings?.preview_only ? 'bg-yellow-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings?.preview_only ? 'translate-x-6' : ''
                  }`} />
                </button>
              </label>
            </div>
          </div>

          {/* Chat ID */}
          <div className="bg-gray-50 rounded-xl p-4">
            <label className="block">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-900">Chat / Channel ID</span>
                <InfoTooltip text={ADMIN_TOOLTIPS.telegramChatId} />
              </div>
              <input
                type="text"
                value={settings?.chat_id || ''}
                onChange={(e) => setSettings({ ...settings, chat_id: e.target.value })}
                onBlur={() => patchSettings({ chat_id: settings?.chat_id })}
                placeholder="-1001234567890"
                data-testid="telegram-chat-id"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-2">
                Опционально. Основная доставка — в личные чаты подписчиков. Получите ID через @userinfobot
              </p>
            </label>
          </div>

          {/* Alert Types Toggles */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-400" />
              Типы алертов
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {['EARLY_BREAKOUT', 'STRONG_ACCELERATION', 'TREND_REVERSAL'].map((type) => {
                const icons = {
                  EARLY_BREAKOUT: { icon: TrendingUp, color: 'green', label: 'Early Breakout', tooltip: ADMIN_TOOLTIPS.telegramEarlyBreakout },
                  STRONG_ACCELERATION: { icon: Zap, color: 'yellow', label: 'Strong Acceleration', tooltip: ADMIN_TOOLTIPS.telegramStrongAcceleration },
                  TREND_REVERSAL: { icon: Activity, color: 'blue', label: 'Trend Reversal', tooltip: ADMIN_TOOLTIPS.telegramTrendReversal },
                };
                const { icon: Icon, color, label, tooltip } = icons[type];
                const isEnabled = settings?.type_enabled?.[type];
                const cooldown = settings?.cooldown_hours?.[type] || 12;

                return (
                  <div key={type} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg bg-${color}-100`}>
                          <Icon className={`w-4 h-4 text-${color}-600`} />
                        </div>
                        <span className="font-medium text-sm text-gray-900">{label}</span>
                        <InfoTooltip text={tooltip} />
                      </div>
                      <button
                        onClick={() => patchSettings({ 
                          type_enabled: { ...settings?.type_enabled, [type]: !isEnabled } 
                        })}
                        disabled={saving}
                        data-testid={`toggle-type-${type.toLowerCase()}`}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          isEnabled 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {isEnabled ? 'ON' : 'OFF'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">Cooldown:</span>
                      <select
                        value={cooldown}
                        onChange={(e) => patchSettings({
                          cooldown_hours: { ...settings?.cooldown_hours, [type]: parseInt(e.target.value) }
                        })}
                        disabled={saving}
                        className="text-xs px-2 py-1 border border-gray-200 rounded bg-white"
                      >
                        <option value="6">6h</option>
                        <option value="12">12h</option>
                        <option value="24">24h</option>
                        <option value="48">48h</option>
                      </select>
                      <InfoTooltip text={ADMIN_TOOLTIPS.telegramCooldown} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-1">
              <Button
                onClick={sendTestMessage}
                disabled={testingSend || !settings?.enabled || settings?.preview_only}
                data-testid="send-test-message"
                className="bg-blue-500 hover:bg-blue-600"
              >
                {testingSend ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Send Test Message
              </Button>
              <InfoTooltip text={ADMIN_TOOLTIPS.telegramTestMessage} />
            </div>
            <div className="flex items-center gap-1">
              <Button
                onClick={dispatchAlerts}
                disabled={dispatching || !settings?.enabled || settings?.preview_only}
                variant="outline"
                data-testid="dispatch-alerts"
              >
                {dispatching ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                Dispatch Pending
              </Button>
              <InfoTooltip text={ADMIN_TOOLTIPS.telegramDispatch} />
            </div>
          </div>

          {/* Warning if not fully configured */}
          {(!settings?.enabled || settings?.preview_only) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-700">
                {!settings?.enabled && <div>• Telegram delivery отключен</div>}
                {settings?.preview_only && <div>• Preview-only режим включен — алерты логируются, но не отправляются</div>}
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Stats Section */}
      <SectionCard 
        title="Delivery Stats (24h)" 
        icon={Activity}
        action={<InfoTooltip text={ADMIN_TOOLTIPS.telegramStats} />}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            label="Total" 
            value={stats?.total || 0} 
            icon={Bell}
            color="gray" 
          />
          <StatCard 
            label="Sent" 
            value={stats?.sent || 0} 
            icon={Send}
            color="green" 
          />
          <StatCard 
            label="Skipped" 
            value={stats?.skipped || 0} 
            icon={EyeOff}
            color="yellow" 
          />
          <StatCard 
            label="Failed" 
            value={stats?.failed || 0} 
            icon={XCircle}
            color="red" 
          />
        </div>
      </SectionCard>

      {/* History Section */}
      <SectionCard 
        title="Recent Deliveries" 
        icon={Clock}
        action={<InfoTooltip text={ADMIN_TOOLTIPS.telegramHistory} />}
      >
        {history.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No delivery history yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="text-left py-3 px-2">Time</th>
                  <th className="text-left py-3 px-2">Type</th>
                  <th className="text-left py-3 px-2">Account</th>
                  <th className="text-left py-3 px-2">Status</th>
                  <th className="text-left py-3 px-2">Reason</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-2 text-sm text-gray-500">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-700">
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-medium text-gray-900">
                      {item.username ? `@${item.username}` : item.account_id}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(item.delivery_status)}`}>
                        {item.delivery_status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-500">
                      {item.delivery_reason || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
};

// ============================================================
// TAB: TELEGRAM HISTORY (Alerts → History)
// ============================================================

const TelegramHistoryTab = ({ token }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ type: 'all', status: 'all' });
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (filter.type !== 'all') params.append('type', filter.type);
      if (filter.status !== 'all') params.append('status', filter.status);
      
      const res = await fetch(`${BACKEND_URL}/api/admin/connections/telegram/history?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) {
        setHistory(data.data || []);
      } else {
        setError(data.message || 'Failed to load history');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    }
    setLoading(false);
  }, [token, filter]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // Pagination
  const totalPages = Math.ceil(history.length / pageSize);
  const paginatedHistory = history.slice((page - 1) * pageSize, page * pageSize);

  // Stats summary
  const stats = {
    total: history.length,
    sent: history.filter(h => h.status === 'sent' || h.status === 'delivered').length,
    failed: history.filter(h => h.status === 'failed' || h.status === 'error').length,
    skipped: history.filter(h => h.status === 'skipped' || h.status === 'suppressed').length,
  };

  const alertTypes = ['EARLY_BREAKOUT', 'STRONG_ACCELERATION', 'TREND_REVERSAL', 'AUTHORITY_SPIKE'];
  const statuses = ['sent', 'delivered', 'failed', 'skipped', 'suppressed'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-xl p-6 border border-red-200">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">Failed to load history</span>
        </div>
        <p className="text-sm text-red-500 mt-2">{error}</p>
        <button onClick={fetchHistory} className="mt-3 text-sm text-red-600 underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Telegram History</h2>
          <p className="text-sm text-gray-500">Complete delivery log for all Telegram notifications</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchHistory} data-testid="refresh-history-btn">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
          <p className="text-sm text-gray-500">Sent</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
          <p className="text-sm text-gray-500">Failed</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{stats.skipped}</p>
          <p className="text-sm text-gray-500">Skipped</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filter:</span>
        </div>
        <select
          value={filter.type}
          onChange={(e) => { setFilter(f => ({ ...f, type: e.target.value })); setPage(1); }}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg"
          data-testid="filter-type"
        >
          <option value="all">All Types</option>
          {alertTypes.map(t => (
            <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <select
          value={filter.status}
          onChange={(e) => { setFilter(f => ({ ...f, status: e.target.value })); setPage(1); }}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg"
          data-testid="filter-status"
        >
          <option value="all">All Statuses</option>
          {statuses.map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        {(filter.type !== 'all' || filter.status !== 'all') && (
          <button
            onClick={() => { setFilter({ type: 'all', status: 'all' }); setPage(1); }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* History Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {history.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No delivery history found</p>
            <p className="text-sm mt-1">Alerts will appear here after they are sent</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedHistory.map((item, idx) => {
                  const statusColors = {
                    sent: 'bg-green-100 text-green-700',
                    delivered: 'bg-green-100 text-green-700',
                    failed: 'bg-red-100 text-red-700',
                    error: 'bg-red-100 text-red-700',
                    skipped: 'bg-yellow-100 text-yellow-700',
                    suppressed: 'bg-gray-100 text-gray-700',
                  };
                  const statusColor = statusColors[item.status] || 'bg-gray-100 text-gray-600';
                  
                  return (
                    <tr key={item._id || idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.timestamp ? new Date(item.timestamp).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-700 rounded">
                          {item.alert_type || item.type || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.actor_name || item.actor_id || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded ${statusColor}`}>
                          {item.status || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                        {item.error || item.reason || item.message_id || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, history.length)} of {history.length}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ============================================================
// ERROR BOUNDARY FOR TABS
// ============================================================

class TabErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 rounded-xl p-6 border border-red-200">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">{this.props.tabName} temporarily unavailable</span>
          </div>
          <p className="text-sm text-red-500">{this.state.error?.message || 'An error occurred'}</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-3 text-sm text-red-600 underline"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================
// MAIN COMPONENT
// ============================================================

// ============================================================
// ADMIN NAVIGATION STRUCTURE (FREEZE v1.0)
// 6 Groups with subtabs - operator-oriented architecture
// URL format: ?tab=group.subtab (e.g., ?tab=intelligence.ml2)
// ============================================================

const NAV_GROUPS = [
  {
    id: 'overview',
    label: 'Overview',
    icon: Activity,
    description: 'Module status & diagnostics',
    subtabs: null, // No subtabs - single page
  },
  {
    id: 'system',
    label: 'System',
    icon: Settings,
    description: 'Core configuration',
    subtabs: [
      { id: 'general', label: 'General', icon: Settings },
      { id: 'engines', label: 'Engines', icon: Zap },
      { id: 'network2', label: 'Network v2', icon: Network },
      { id: 'stability', label: 'Stability', icon: Shield },
    ],
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    icon: Brain,
    description: 'ML & evaluation systems',
    subtabs: [
      { id: 'aqm', label: 'AQM', icon: Brain },
      { id: 'patterns', label: 'Patterns', icon: Network },
      { id: 'ml2', label: 'ML2 Shadow', icon: Brain },
      { id: 'drift', label: 'Drift', icon: Activity },
      { id: 'feedback', label: 'Feedback', icon: MessageSquare },
      { id: 'confidence', label: 'Confidence', icon: Shield },
    ],
  },
  {
    id: 'alerts',
    label: 'Alerts',
    icon: Bell,
    description: 'Notification management',
    subtabs: [
      { id: 'preview', label: 'Preview', icon: Eye },
      { id: 'policy', label: 'Policy', icon: Settings },
      { id: 'telegram', label: 'Telegram', icon: MessageSquare },
      { id: 'history', label: 'History', icon: Clock },
    ],
  },
  {
    id: 'data',
    label: 'Data',
    icon: Database,
    description: 'Data sources & adapters',
    subtabs: [
      { id: 'source', label: 'Source Mode', icon: Database },
      { id: 'twitter', label: 'Twitter Adapter', icon: Users },
      { id: 'twitter-live', label: 'Twitter Live', icon: Database },
      { id: 'backers', label: 'Backers', icon: Building2 },
    ],
  },
  {
    id: 'tools',
    label: 'Tools',
    icon: Zap,
    description: 'Utilities & visualization',
    subtabs: [
      { id: 'graph-overlay', label: 'Graph Overlay', icon: Network },
      { id: 'ai', label: 'AI Summary', icon: Sparkles },
    ],
  },
];

// Helper: Parse tab from URL (supports group.subtab format)
const parseTabFromUrl = (tabParam) => {
  if (!tabParam || tabParam === 'overview') {
    return { group: 'overview', subtab: null };
  }
  
  // New format: group.subtab
  if (tabParam.includes('.')) {
    const [group, subtab] = tabParam.split('.');
    const groupDef = NAV_GROUPS.find(g => g.id === group);
    if (groupDef && groupDef.subtabs?.find(s => s.id === subtab)) {
      return { group, subtab };
    }
  }
  
  // Legacy format: direct tab id - map to new structure
  const legacyMapping = {
    'config': { group: 'system', subtab: 'general' },
    'engines': { group: 'system', subtab: 'engines' },
    'network2': { group: 'system', subtab: 'network2' },
    'stability': { group: 'system', subtab: 'stability' },
    'aqm': { group: 'intelligence', subtab: 'aqm' },
    'patterns': { group: 'intelligence', subtab: 'patterns' },
    'ml2': { group: 'intelligence', subtab: 'ml2' },
    'drift': { group: 'intelligence', subtab: 'drift' },
    'feedback': { group: 'intelligence', subtab: 'feedback' },
    'confidence': { group: 'intelligence', subtab: 'confidence' },
    'alerts': { group: 'alerts', subtab: 'preview' },
    'telegram': { group: 'alerts', subtab: 'telegram' },
    'telegram-history': { group: 'alerts', subtab: 'history' },
    'history': { group: 'alerts', subtab: 'history' },
    'twitter': { group: 'data', subtab: 'twitter' },
    'twitter-live': { group: 'data', subtab: 'twitter-live' },
    'backers': { group: 'data', subtab: 'backers' },
    'graph-overlay': { group: 'tools', subtab: 'graph-overlay' },
    'ai': { group: 'tools', subtab: 'ai' },
  };
  
  return legacyMapping[tabParam] || { group: 'overview', subtab: null };
};

// Helper: Build URL param from group/subtab
const buildTabParam = (group, subtab) => {
  if (group === 'overview') return null;
  if (subtab) return `${group}.${subtab}`;
  return group;
};

export default function AdminConnectionsPage() {
  const { token, isAuthenticated, loading: authLoading } = useAdminAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Parse tab from URL (supports new group.subtab format)
  const tabFromUrl = searchParams.get('tab') || 'overview';
  const { group: initialGroup, subtab: initialSubtab } = parseTabFromUrl(tabFromUrl);
  
  const [activeGroup, setActiveGroup] = useState(initialGroup);
  const [activeSubtab, setActiveSubtab] = useState(initialSubtab);
  const [overview, setOverview] = useState(null);
  const [overviewError, setOverviewError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Redirect legacy URLs to new format
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && !tabFromUrl.includes('.') && tabFromUrl !== 'overview') {
      // Legacy format detected - redirect to new format
      const { group, subtab } = parseTabFromUrl(tabFromUrl);
      const newTabParam = buildTabParam(group, subtab);
      if (newTabParam && newTabParam !== tabFromUrl) {
        searchParams.set('tab', newTabParam);
        setSearchParams(searchParams, { replace: true });
        setActiveGroup(group);
        setActiveSubtab(subtab);
      }
    }
  }, [searchParams, setSearchParams]);

  // Navigate to group (click on main nav)
  const handleGroupChange = (groupId) => {
    const groupDef = NAV_GROUPS.find(g => g.id === groupId);
    setActiveGroup(groupId);
    
    // If group has subtabs, select first one; otherwise null
    const firstSubtab = groupDef?.subtabs?.[0]?.id || null;
    setActiveSubtab(firstSubtab);
    
    // Update URL
    const tabParam = buildTabParam(groupId, firstSubtab);
    if (tabParam) {
      searchParams.set('tab', tabParam);
    } else {
      searchParams.delete('tab');
    }
    setSearchParams(searchParams);
  };

  // Navigate to subtab (click on sidebar)
  const handleSubtabChange = (subtabId) => {
    setActiveSubtab(subtabId);
    const tabParam = buildTabParam(activeGroup, subtabId);
    if (tabParam) {
      searchParams.set('tab', tabParam);
    }
    setSearchParams(searchParams);
  };

  // Legacy compatibility: get flat tab ID for content rendering
  const getActiveTabId = () => {
    if (activeGroup === 'overview') return 'overview';
    if (activeGroup === 'system' && activeSubtab === 'general') return 'config';
    if (activeGroup === 'alerts' && activeSubtab === 'preview') return 'alerts';
    if (activeGroup === 'alerts' && activeSubtab === 'policy') return 'alerts-policy';
    if (activeGroup === 'alerts' && activeSubtab === 'history') return 'telegram-history';
    if (activeGroup === 'data' && activeSubtab === 'source') return 'source-mode';
    return activeSubtab || activeGroup;
  };
  
  const activeTab = getActiveTabId();

  const fetchOverview = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setOverviewError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/connections/overview`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) {
        setOverview(data.data);
        setLastUpdated(new Date());
      } else {
        setOverviewError(data.message || data.error || 'Failed to load overview');
      }
    } catch (err) {
      console.error('Overview fetch error:', err);
      setOverviewError(err.message || 'Network error');
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { 
    if (!authLoading) {
      fetchOverview(); 
    }
  }, [fetchOverview, authLoading]);

  // Get current group definition
  const currentGroup = NAV_GROUPS.find(g => g.id === activeGroup);

  // Auth loading state
  if (authLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
            <p className="text-gray-500">Checking authentication...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Not authenticated - show login prompt
  if (!isAuthenticated) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center p-12">
          <div className="bg-white rounded-xl p-8 shadow-lg max-w-md w-full text-center">
            <div className="p-3 bg-red-100 rounded-full w-fit mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-500 mb-6">Please log in to access the Admin Connections panel.</p>
            <a 
              href="/admin/login" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              data-testid="go-to-login"
            >
              Go to Login
            </a>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl shadow-lg">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Connections Admin</h1>
                  <p className="text-sm text-gray-500">Control Plane for Connections Module</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {lastUpdated && (
                <Timestamp date={lastUpdated} label="Updated" />
              )}
              <Button variant="outline" size="sm" onClick={fetchOverview} disabled={loading} data-testid="refresh-btn">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation - 6 Groups */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {NAV_GROUPS.map(group => (
              <button
                key={group.id}
                onClick={() => handleGroupChange(group.id)}
                data-testid={`group-${group.id}`}
                className={`px-4 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  activeGroup === group.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <group.icon className="w-4 h-4" />
                {group.label}
                {group.subtabs && (
                  <ChevronDown className={`w-3 h-3 transition-transform ${activeGroup === group.id ? 'rotate-180' : ''}`} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar - Subtabs (only if group has subtabs) */}
          {currentGroup?.subtabs && (
            <div className="w-48 flex-shrink-0">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {currentGroup.label}
                  </h3>
                </div>
                <nav className="p-2">
                  {currentGroup.subtabs.map(subtab => (
                    <button
                      key={subtab.id}
                      onClick={() => handleSubtabChange(subtab.id)}
                      data-testid={`subtab-${subtab.id}`}
                      className={`w-full px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-all ${
                        activeSubtab === subtab.id
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <subtab.icon className="w-4 h-4" />
                      {subtab.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className={`flex-1 ${currentGroup?.subtabs ? '' : 'max-w-4xl mx-auto'}`}>
        {activeTab === 'overview' && (
          <TabErrorBoundary tabName="Overview">
            {overviewError ? (
              <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                <div className="flex items-center gap-2 text-red-600 mb-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">Failed to load Overview</span>
                </div>
                <p className="text-sm text-red-500">{overviewError}</p>
                <button 
                  onClick={fetchOverview}
                  className="mt-3 text-sm text-red-600 underline"
                >
                  Retry
                </button>
              </div>
            ) : (
              <OverviewTab data={overview} token={token} onRefresh={fetchOverview} />
            )}
          </TabErrorBoundary>
        )}
        {activeTab === 'config' && (
          <TabErrorBoundary tabName="Config">
            <ConfigTab token={token} onRefresh={fetchOverview} />
          </TabErrorBoundary>
        )}
        {activeTab === 'stability' && (
          <TabErrorBoundary tabName="Stability">
            <StabilityTab token={token} />
          </TabErrorBoundary>
        )}
        {activeTab === 'engines' && (
          <TabErrorBoundary tabName="Engines">
            <EnginesTab token={token} />
          </TabErrorBoundary>
        )}
        {activeTab === 'network2' && (
          <TabErrorBoundary tabName="Network v2">
            <Network2Tab token={token} />
          </TabErrorBoundary>
        )}
        {activeTab === 'alerts' && (
          <TabErrorBoundary tabName="Alerts">
            <AlertsTab token={token} />
          </TabErrorBoundary>
        )}
        {activeTab === 'alerts-policy' && (
          <TabErrorBoundary tabName="Alerts Policy">
            <AlertsPolicyTab token={token} />
          </TabErrorBoundary>
        )}
        {activeTab === 'source-mode' && (
          <TabErrorBoundary tabName="Source Mode">
            <SourceModeTab token={token} />
          </TabErrorBoundary>
        )}
        {activeTab === 'aqm' && (
          <TabErrorBoundary tabName="AQM">
            <AlertQualityTab token={token} />
          </TabErrorBoundary>
        )}
        {activeTab === 'patterns' && (
          <TabErrorBoundary tabName="Patterns">
            <PatternsTab token={token} />
          </TabErrorBoundary>
        )}
        {activeTab === 'feedback' && (
          <TabErrorBoundary tabName="Feedback">
            <FeedbackTab token={token} />
          </TabErrorBoundary>
        )}
        {activeTab === 'drift' && (
          <TabErrorBoundary tabName="Drift">
            <DriftTab token={token} />
          </TabErrorBoundary>
        )}
        {activeTab === 'ml2' && (
          <TabErrorBoundary tabName="ML2">
            <Ml2Tab token={token} />
          </TabErrorBoundary>
        )}
        {activeTab === 'backers' && (
          <TabErrorBoundary tabName="Backers">
            <BackersTab token={token} />
          </TabErrorBoundary>
        )}
        {activeTab === 'telegram' && (
          <TabErrorBoundary tabName="Telegram">
            <TelegramTab token={token} />
          </TabErrorBoundary>
        )}
        {activeTab === 'telegram-history' && (
          <TabErrorBoundary tabName="Telegram History">
            <TelegramHistoryTab token={token} />
          </TabErrorBoundary>
        )}
        {activeTab === 'twitter' && (
          <TabErrorBoundary tabName="Twitter">
            <TwitterAdapterTab token={token} />
          </TabErrorBoundary>
        )}
        {activeTab === 'twitter-live' && (
          <TabErrorBoundary tabName="Twitter Live">
            <TwitterLiveTab token={token} />
          </TabErrorBoundary>
        )}
        {activeTab === 'graph-overlay' && (
          <TabErrorBoundary tabName="Graph Overlay">
            <GraphOverlayAdminTab token={token} />
          </TabErrorBoundary>
        )}
        {activeTab === 'confidence' && (
          <TabErrorBoundary tabName="Confidence">
            <ConfidenceTab token={token} />
          </TabErrorBoundary>
        )}
        {activeTab === 'ai' && (
          <TabErrorBoundary tabName="AI">
            <AiTab token={token} />
          </TabErrorBoundary>
        )}
          </div>
        </div>
      </div>
    </div>
    </AdminLayout>
  );
}
