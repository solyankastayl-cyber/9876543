/**
 * Drift Tab - Phase 6.0
 * Environment Observation Layer
 * 
 * Features:
 * - Overall drift status with recommendation
 * - Data Drift metrics
 * - Network Drift metrics
 * - Concept Drift metrics
 * - Baseline info
 * - Expansion gate status
 * 
 * IMPORTANT: This is READ-ONLY monitoring
 * Drift does NOT change system behavior automatically
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Network,
  Brain,
  Database,
  Shield,
  Clock,
  Lock,
  Unlock
} from 'lucide-react';
import { Button } from '../../ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// ============================================================
// STATUS COMPONENTS
// ============================================================

const DriftLevelBadge = ({ level, size = 'md' }) => {
  const colors = {
    OK: 'bg-green-100 text-green-700 border-green-200',
    LOW: 'bg-blue-100 text-blue-700 border-blue-200',
    MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    HIGH: 'bg-red-100 text-red-700 border-red-200',
  };
  
  const icons = {
    OK: <CheckCircle className="w-4 h-4" />,
    LOW: <Minus className="w-4 h-4" />,
    MEDIUM: <AlertTriangle className="w-4 h-4" />,
    HIGH: <XCircle className="w-4 h-4" />,
  };
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };
  
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${colors[level]} ${sizeClasses[size]}`}>
      {icons[level]}
      {level}
    </span>
  );
};

const RecommendationBanner = ({ recommendation, blocked }) => {
  const configs = {
    NONE: { 
      color: 'bg-green-50 border-green-200 text-green-800',
      icon: CheckCircle,
      message: 'System stable — no action required'
    },
    WARN: {
      color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      icon: AlertTriangle,
      message: 'Minor drift detected — proceed with caution'
    },
    REVIEW_REQUIRED: {
      color: 'bg-orange-50 border-orange-200 text-orange-800',
      icon: AlertTriangle,
      message: 'Significant drift — manual review required before changes'
    },
    FREEZE_REQUIRED: {
      color: 'bg-red-50 border-red-200 text-red-800',
      icon: XCircle,
      message: 'Critical drift — system freeze required before live expansion'
    },
  };
  
  const config = configs[recommendation] || configs.NONE;
  const Icon = config.icon;
  
  return (
    <div className={`rounded-xl p-4 border ${config.color}`}>
      <div className="flex items-center gap-3">
        <Icon className="w-6 h-6" />
        <div className="flex-1">
          <div className="font-semibold">{recommendation.replace(/_/g, ' ')}</div>
          <div className="text-sm opacity-80">{config.message}</div>
        </div>
        {blocked && (
          <div className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            <Lock className="w-4 h-4" />
            Live Expansion Blocked
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// METRIC TABLE
// ============================================================

const MetricRow = ({ metric }) => {
  const DirectionIcon = metric.direction === 'UP' ? TrendingUp : 
                        metric.direction === 'DOWN' ? TrendingDown : Minus;
  
  const directionColor = metric.direction === 'UP' ? 'text-green-500' :
                         metric.direction === 'DOWN' ? 'text-red-500' : 'text-gray-400';
  
  // Format values
  const formatValue = (val, unit) => {
    if (unit === '%') return `${(val * 100).toFixed(1)}%`;
    if (unit === 'pts') return val.toFixed(0);
    return val.toFixed(2);
  };
  
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-3 px-4 font-medium text-gray-700">{metric.label}</td>
      <td className="py-3 px-4 text-gray-500">{formatValue(metric.baseline, metric.unit)}</td>
      <td className="py-3 px-4 text-gray-900 font-medium">{formatValue(metric.current, metric.unit)}</td>
      <td className="py-3 px-4">
        <div className={`flex items-center gap-1 ${directionColor}`}>
          <DirectionIcon className="w-4 h-4" />
          <span className={metric.delta_pct > 0 ? 'text-green-600' : metric.delta_pct < 0 ? 'text-red-600' : 'text-gray-500'}>
            {metric.delta_pct > 0 ? '+' : ''}{metric.delta_pct.toFixed(1)}%
          </span>
        </div>
      </td>
      <td className="py-3 px-4">
        <DriftLevelBadge level={metric.level} size="sm" />
      </td>
    </tr>
  );
};

const MetricsTable = ({ metrics }) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <th className="py-3 px-4">Metric</th>
          <th className="py-3 px-4">Baseline</th>
          <th className="py-3 px-4">Current</th>
          <th className="py-3 px-4">Change</th>
          <th className="py-3 px-4">Status</th>
        </tr>
      </thead>
      <tbody>
        {metrics.map(m => <MetricRow key={m.key} metric={m} />)}
      </tbody>
    </table>
  </div>
);

// ============================================================
// SECTION CARD
// ============================================================

const SectionCard = ({ title, icon: Icon, level, metrics, issues }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
        <Icon className="w-4 h-4 text-gray-400" />
        {title}
      </h3>
      <DriftLevelBadge level={level} />
    </div>
    
    {issues && issues.length > 0 && (
      <div className="px-6 py-3 bg-red-50 border-b border-red-100">
        <div className="text-sm text-red-700 space-y-1">
          {issues.map((issue, i) => (
            <div key={i} className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {issue}
            </div>
          ))}
        </div>
      </div>
    )}
    
    <MetricsTable metrics={metrics} />
  </div>
);

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function DriftTab({ token }) {
  const [report, setReport] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [canExpand, setCanExpand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [reportRes, baselineRes, expandRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/connections/drift/report`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${BACKEND_URL}/api/connections/drift/baseline`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${BACKEND_URL}/api/connections/drift/can-expand`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);
      
      const reportData = await reportRes.json();
      const baselineData = await baselineRes.json();
      const expandData = await expandRes.json();
      
      if (reportData.ok) setReport(reportData.data);
      if (baselineData.ok) setBaseline(baselineData.data);
      if (expandData.ok) setCanExpand(expandData.data);
      
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to fetch drift data:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12 text-gray-500">
        Failed to load drift report
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Overall Status */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-6 h-6 text-indigo-500" />
              Environment Drift Monitor
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Phase 6.0 — Observation Layer (READ-ONLY)
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-gray-500">Overall Status</div>
              <DriftLevelBadge level={report.overall} size="lg" />
            </div>
            <Button size="sm" variant="outline" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
        
        {/* Recommendation Banner */}
        <RecommendationBanner 
          recommendation={report.recommendation} 
          blocked={report.alerts_blocked} 
        />
      </div>

      {/* Baseline Info */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Baseline:</span>
              <span className="font-medium">{baseline?.id || report.snapshot}</span>
            </div>
            <div className="text-sm text-gray-500">
              Created: {baseline?.created_at ? new Date(baseline.created_at).toLocaleDateString() : 'N/A'}
            </div>
            <div className="text-sm text-gray-500">
              Window: {report.window_days} days
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canExpand?.allowed ? (
              <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                <Unlock className="w-4 h-4" />
                Live Expansion Allowed
              </span>
            ) : (
              <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                <Lock className="w-4 h-4" />
                {canExpand?.reason || 'Blocked'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Three Drift Sections */}
      <div className="space-y-6">
        {/* Data Drift */}
        <SectionCard
          title="Data Drift"
          icon={Database}
          level={report.data.level}
          metrics={report.data.metrics}
          issues={report.data.issues}
        />
        
        {/* Network Drift */}
        <SectionCard
          title="Network Drift"
          icon={Network}
          level={report.network.level}
          metrics={report.network.metrics}
          issues={report.network.issues}
        />
        
        {/* Concept Drift (Most Important) */}
        <SectionCard
          title="Concept Drift"
          icon={Brain}
          level={report.concept.level}
          metrics={report.concept.metrics}
          issues={report.concept.issues}
        />
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-400">
        Last updated: {lastRefresh?.toLocaleString() || 'N/A'}
        <br />
        Drift v1 — Observation Only (no auto-fix)
      </div>
    </div>
  );
}
