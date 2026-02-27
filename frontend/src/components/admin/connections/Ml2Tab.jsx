/**
 * ML2 Shadow Tab - Phase 5.3 + C2
 * 
 * Features:
 * - Mode toggle: OFF / SHADOW / ACTIVE_SAFE
 * - Shadow stats: agreement rate, would_suppress, would_downrank
 * - Recent shadow logs with comparison
 * - Disagreements (where ML2 would change decision)
 * - Phase C2: Impact Dashboard & Feedback Controls
 * 
 * IMPORTANT: ML2 in SHADOW mode NEVER affects actual decisions
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  Brain, 
  RefreshCw, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  EyeOff,
  Zap,
  BarChart3,
  Activity,
  Target,
  Filter
} from 'lucide-react';
import { Button } from '../../ui/button';
import Ml2ImpactDashboard from './Ml2ImpactDashboard';
import { FeedbackStatsPanel } from './Ml2FeedbackControls';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// ============================================================
// COMPONENTS
// ============================================================

const ModeBadge = ({ mode }) => {
  const configs = {
    OFF: { color: 'bg-gray-100 text-gray-600 border-gray-200', icon: EyeOff },
    SHADOW: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Eye },
    ACTIVE_SAFE: { color: 'bg-green-100 text-green-700 border-green-200', icon: Zap },
  };
  
  const cfg = configs[mode] || configs.OFF;
  const Icon = cfg.icon;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-medium ${cfg.color}`}>
      <Icon className="w-4 h-4" />
      {mode}
    </span>
  );
};

const StatCard = ({ label, value, subtext, color = 'gray', icon: Icon }) => {
  const colors = {
    green: 'bg-green-50 text-green-600 border-green-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    gray: 'bg-gray-50 text-gray-600 border-gray-100',
  };
  
  return (
    <div className={`rounded-xl p-4 border ${colors[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium opacity-75">{label}</span>
        {Icon && <Icon className="w-4 h-4 opacity-50" />}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subtext && <div className="text-xs mt-1 opacity-75">{subtext}</div>}
    </div>
  );
};

const SectionCard = ({ title, icon: Icon, children, action }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        {title}
      </h3>
      {action}
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const Ml2LabelBadge = ({ label }) => {
  const colors = {
    HIGH: 'bg-green-100 text-green-700',
    MEDIUM: 'bg-blue-100 text-blue-700',
    LOW: 'bg-yellow-100 text-yellow-700',
    NOISE: 'bg-red-100 text-red-700',
  };
  
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[label] || 'bg-gray-100'}`}>
      {label}
    </span>
  );
};

const RecommendationBadge = ({ rec }) => {
  const colors = {
    KEEP: 'text-green-600',
    DOWNRANK: 'text-yellow-600',
    SUPPRESS_SUGGEST: 'text-red-600',
  };
  
  return (
    <span className={`text-xs font-medium ${colors[rec] || 'text-gray-600'}`}>
      {rec}
    </span>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function Ml2Tab({ token }) {
  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [disagreements, setDisagreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [configRes, statsRes, recentRes, disagreeRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/admin/connections/ml2/config`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${BACKEND_URL}/api/admin/connections/ml2/shadow/stats`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${BACKEND_URL}/api/admin/connections/ml2/shadow/recent?limit=20`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${BACKEND_URL}/api/admin/connections/ml2/shadow/disagreements?limit=10`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);
      
      const configData = await configRes.json();
      const statsData = await statsRes.json();
      const recentData = await recentRes.json();
      const disagreeData = await disagreeRes.json();
      
      if (configData.ok) setConfig(configData.data);
      if (statsData.ok) setStats(statsData.data);
      if (recentData.ok) setRecentLogs(recentData.data?.logs || []);
      if (disagreeData.ok) setDisagreements(disagreeData.data?.logs || []);
    } catch (err) {
      console.error('Failed to fetch ML2 data:', err);
      setToast({ type: 'error', message: 'Failed to load ML2 data' });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateMode = async (newMode) => {
    setUpdating(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/connections/ml2/config`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode: newMode }),
      });
      
      const data = await res.json();
      if (data.ok) {
        setConfig(data.data);
        setToast({ type: 'success', message: `Mode changed to ${newMode}` });
      } else {
        setToast({ type: 'error', message: data.error || 'Failed to update mode' });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Network error' });
    } finally {
      setUpdating(false);
    }
  };

  // Toast component
  const Toast = ({ type, message, onClose }) => (
    <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2
      ${type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
      {type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-75 hover:opacity-100">&times;</button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <Toast 
          type={toast.type} 
          message={toast.message} 
          onClose={() => setToast(null)} 
        />
      )}
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Brain className="w-6 h-6 text-purple-500" />
              ML2 — Machine Learning Layer
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Phase 5.3 — Shadow mode: observe, learn, don't affect decisions
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ModeBadge mode={config?.mode || 'OFF'} />
            <Button size="sm" variant="outline" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
        
        {/* Mode Selector */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-gray-600 mr-2">Mode:</span>
          {['OFF', 'SHADOW', 'ACTIVE_SAFE'].map(mode => (
            <button
              key={mode}
              onClick={() => updateMode(mode)}
              disabled={updating || config?.mode === mode}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition
                ${config?.mode === mode 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'}
                ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {mode === 'SHADOW' && <Eye className="w-4 h-4 inline mr-1" />}
              {mode === 'ACTIVE_SAFE' && <Zap className="w-4 h-4 inline mr-1" />}
              {mode === 'OFF' && <EyeOff className="w-4 h-4 inline mr-1" />}
              {mode}
            </button>
          ))}
        </div>
        
        {config?.mode === 'SHADOW' && (
          <div className="mt-3 text-xs text-purple-700 bg-purple-100 rounded-lg px-3 py-2">
            Shadow Mode: ML2 evaluates every alert but does NOT change decisions. 
            Use this to build trust before enabling ACTIVE_SAFE.
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          label="Total Evaluations" 
          value={stats?.total || 0} 
          color="blue" 
          icon={BarChart3} 
        />
        <StatCard 
          label="Agreement Rate" 
          value={`${Math.round((stats?.agreement_rate || 0) * 100)}%`}
          subtext="ML2 agrees with rules"
          color="green" 
          icon={CheckCircle} 
        />
        <StatCard 
          label="Would Suppress" 
          value={`${Math.round((stats?.would_suppress || 0) * 100)}%`}
          subtext="ML2 would have blocked"
          color="red" 
          icon={XCircle} 
        />
        <StatCard 
          label="Noise Detected" 
          value={`${Math.round((stats?.noise_detected || 0) * 100)}%`}
          subtext="Classified as NOISE"
          color="yellow" 
          icon={AlertTriangle} 
        />
      </div>

      {/* By Alert Type */}
      {stats?.by_alert_type && Object.keys(stats.by_alert_type).length > 0 && (
        <SectionCard title="Agreement by Alert Type" icon={Target}>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(stats.by_alert_type).map(([type, data]) => (
              <div key={type} className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs font-medium text-gray-500 mb-1">{type}</div>
                <div className="flex items-end gap-2">
                  <span className="text-xl font-bold">{Math.round(data.agreement_rate * 100)}%</span>
                  <span className="text-xs text-gray-400">({data.total} alerts)</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Disagreements */}
      {disagreements.length > 0 && (
        <SectionCard title="Recent Disagreements" icon={AlertTriangle}>
          <p className="text-sm text-gray-500 mb-4">
            Cases where ML2 would have changed the decision
          </p>
          <div className="space-y-2">
            {disagreements.map(log => (
              <div 
                key={log.alert_id} 
                className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-medium">{log.alert_id}</div>
                  <div className="text-xs text-gray-500">
                    Rule: {log.rule_decision} → ML2: {log.change_type || log.ml2_recommendation}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-medium">{(log.ml2_prob * 100).toFixed(0)}%</div>
                    <Ml2LabelBadge label={log.ml2_label} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Recent Logs */}
      <SectionCard title="Recent Shadow Logs" icon={Activity}>
        {recentLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Eye className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No shadow logs yet. ML2 will log evaluations as alerts are processed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Alert ID</th>
                  <th className="py-3 px-4">Rule</th>
                  <th className="py-3 px-4">ML2 Prob</th>
                  <th className="py-3 px-4">ML2 Label</th>
                  <th className="py-3 px-4">Recommendation</th>
                  <th className="py-3 px-4">Changed?</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map(log => (
                  <tr key={log.alert_id} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 px-4 font-mono text-xs">{log.alert_id?.slice(0, 12)}...</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium
                        ${log.rule_decision === 'SEND' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {log.rule_decision}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">{(log.ml2_prob * 100).toFixed(0)}%</td>
                    <td className="py-3 px-4"><Ml2LabelBadge label={log.ml2_label} /></td>
                    <td className="py-3 px-4"><RecommendationBadge rec={log.ml2_recommendation} /></td>
                    <td className="py-3 px-4">
                      {log.would_change ? (
                        <span className="text-red-600 flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" />
                          Yes
                        </span>
                      ) : (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          No
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Config Details */}
      <SectionCard title="Configuration" icon={Filter}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500">Model Version</div>
            <div className="font-medium">{config?.model_version || 'ml2-shadow-v1'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Downrank Threshold</div>
            <div className="font-medium">&lt; {Math.round((config?.min_prob_downrank || 0.55) * 100)}%</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Suppress Threshold</div>
            <div className="font-medium">&lt; {Math.round((config?.min_prob_suppress || 0.40) * 100)}%</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Enabled Alert Types</div>
            <div className="font-medium text-xs">{config?.enabled_alert_types?.join(', ') || 'All'}</div>
          </div>
        </div>
      </SectionCard>

      {/* Phase C2: Impact Dashboard */}
      <Ml2ImpactDashboard token={token} />

      {/* Phase C2: Feedback Stats */}
      <FeedbackStatsPanel token={token} />

      {/* Footer */}
      <div className="text-center text-xs text-gray-400">
        ML2 Shadow Mode — Phase 5.3 + C2 (Feedback & Impact)
        <br />
        In SHADOW mode, ML2 evaluates but never affects actual decisions.
      </div>
    </div>
  );
}
