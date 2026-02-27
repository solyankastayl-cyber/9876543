/**
 * Pattern Detection Admin Tab - Phase 5.A.3
 * 
 * Features:
 * - Pattern counts: LIKE_FARM / SPIKE_PUMP / OVERLAP_FARM
 * - Severity thresholds editor
 * - Last detected patterns table
 * - Toggle per pattern (ON/OFF)
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  Network, 
  RefreshCw, 
  Settings, 
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Activity,
  Zap
} from 'lucide-react';
import { Button } from '../../ui/button';
import { IconLikeFarm, IconSpikePump, IconOverlapFarm } from '../../icons/FomoIcons';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// Pattern Icons - SVG components
const PATTERN_ICONS = {
  LIKE_FARM: IconLikeFarm,
  SPIKE_PUMP: IconSpikePump,
  OVERLAP_FARM: IconOverlapFarm,
};

// Stat Card
const StatCard = ({ label, value, color = 'gray', icon: Icon }) => {
  const colors = {
    green: 'bg-green-50 text-green-600 border-green-100',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    gray: 'bg-gray-50 text-gray-600 border-gray-100',
  };
  
  return (
    <div className={`rounded-xl p-4 border ${colors[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium opacity-75">{label}</span>
        {Icon && <Icon size={20} />}
      </div>
      <span className="text-2xl font-bold">{value}</span>
    </div>
  );
};

// Section Card
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

// Pattern Toggle
const PatternToggle = ({ name, label, enabled, onToggle, description, threshold }) => {
  const PatternIcon = PATTERN_ICONS[name];
  return (
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
    <div className="flex items-center gap-3">
      {PatternIcon ? <PatternIcon size={24} className="text-gray-600" /> : <span className="w-6 h-6" />}
      <div>
        <div className="font-medium text-gray-900">{label}</div>
        <div className="text-xs text-gray-500">{description}</div>
        <div className="text-xs text-gray-400 mt-1">Threshold: {threshold}</div>
      </div>
    </div>
    <button
      onClick={() => onToggle(!enabled)}
      data-testid={`toggle-pattern-${name.toLowerCase()}`}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
        enabled 
          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
          : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
      }`}
    >
      {enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      {enabled ? 'ON' : 'OFF'}
    </button>
  </div>
  );
};

export default function PatternsTab({ token }) {
  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentPatterns, setRecentPatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [configRes, statsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/admin/connections/ml/patterns/config`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${BACKEND_URL}/api/admin/connections/ml/patterns/stats`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);
      
      const [configData, statsData] = await Promise.all([
        configRes.json(),
        statsRes.json(),
      ]);
      
      if (configData.ok) setConfig(configData.data);
      if (statsData.ok) {
        setStats(statsData.data);
        setRecentPatterns(statsData.data?.recent || []);
      }
    } catch (err) {
      setToast({ message: 'Failed to load patterns data', type: 'error' });
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateConfig = async (updates) => {
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/connections/ml/patterns/config`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.ok) {
        setToast({ message: 'Patterns config updated', type: 'success' });
        setConfig(data.data);
      } else {
        setToast({ message: data.message || 'Update failed', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Failed to update config', type: 'error' });
    }
    setSaving(false);
  };

  const togglePattern = (pattern, enabled) => {
    const updates = { [pattern]: { enabled } };
    updateConfig(updates);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading patterns data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg text-white z-50 ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Network className="w-6 h-6 text-red-500 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Pattern Detection (A/B/C)</h3>
            <p className="text-sm text-red-700 mt-1">
              Detects manipulation: like farming, spike pumps, cross-audience farms.
            </p>
          </div>
          <div className="ml-auto">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              config?.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {config?.enabled ? '✅ Enabled' : '❌ Disabled'}
            </span>
          </div>
        </div>
      </div>

      {/* Detection Counts */}
      <SectionCard title="Detections (24h)" icon={BarChart3}>
        <div className="grid grid-cols-3 gap-4">
          <StatCard 
            label="Like Farm (A)" 
            value={stats?.counts?.LIKE_FARM || 0} 
            color="purple"
            icon={PATTERN_ICONS.LIKE_FARM}
          />
          <StatCard 
            label="Spike Pump (B)" 
            value={stats?.counts?.SPIKE_PUMP || 0} 
            color="yellow"
            icon={PATTERN_ICONS.SPIKE_PUMP}
          />
          <StatCard 
            label="Overlap Farm (C)" 
            value={stats?.counts?.OVERLAP_FARM || 0} 
            color="red"
            icon={PATTERN_ICONS.OVERLAP_FARM}
          />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div className="p-2 bg-green-50 rounded text-center">
            <span className="text-green-600 font-medium">LOW:</span> {stats?.by_severity?.LOW || 0}
          </div>
          <div className="p-2 bg-yellow-50 rounded text-center">
            <span className="text-yellow-600 font-medium">MEDIUM:</span> {stats?.by_severity?.MEDIUM || 0}
          </div>
          <div className="p-2 bg-red-50 rounded text-center">
            <span className="text-red-600 font-medium">HIGH:</span> {stats?.by_severity?.HIGH || 0}
          </div>
        </div>
      </SectionCard>

      {/* Pattern Toggles */}
      <SectionCard title="Pattern Controls" icon={Settings}>
        <div className="space-y-3">
          <PatternToggle
            name="LIKE_FARM"
            label="A: Like/Reply Imbalance"
            enabled={config?.imbalance?.enabled}
            onToggle={(enabled) => updateConfig({ imbalance: { ...config.imbalance, enabled }})}
            description="Likes 10x+ more than replies/reposts"
            threshold={`ratio > ${config?.imbalance?.threshold || 10}, min ${config?.imbalance?.min_likes || 100} likes`}
          />
          <PatternToggle
            name="SPIKE_PUMP"
            label="B: Spike Pump"
            enabled={config?.spike?.enabled}
            onToggle={(enabled) => updateConfig({ spike: { ...config.spike, enabled }})}
            description="Engagement spike far above normal"
            threshold={`z-score > ${config?.spike?.z_threshold || 2.5}, min ${config?.spike?.min_engagement || 50} engagement`}
          />
          <PatternToggle
            name="OVERLAP_FARM"
            label="C: Cross-Audience Farm"
            enabled={config?.overlap?.enabled}
            onToggle={(enabled) => updateConfig({ overlap: { ...config.overlap, enabled }})}
            description="High overlap with low audience purity"
            threshold={`pressure > ${((config?.overlap?.pressure_threshold || 0.4) * 100).toFixed(0)}%, purity < ${config?.overlap?.purity_min || 50}%`}
          />
        </div>
      </SectionCard>

      {/* Severity Thresholds */}
      <SectionCard title="Severity Thresholds" icon={AlertTriangle}>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
            <div className="text-sm text-yellow-600 mb-1">MEDIUM severity</div>
            <div className="text-2xl font-bold text-yellow-700">
              Risk ≥ {config?.severity?.medium_risk || 40}
            </div>
            <div className="text-xs text-yellow-500 mt-1">
              Actions: DEGRADE_CONFIDENCE, REQUIRE_MORE_DATA
            </div>
          </div>
          <div className="p-4 bg-red-50 rounded-xl border border-red-100">
            <div className="text-sm text-red-600 mb-1">HIGH severity</div>
            <div className="text-2xl font-bold text-red-700">
              Risk ≥ {config?.severity?.high_risk || 70}
            </div>
            <div className="text-xs text-red-500 mt-1">
              Actions: SUPPRESS_ALERTS, DEGRADE_CONFIDENCE
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Recent Detections */}
      <SectionCard 
        title="Recent Detections" 
        icon={Activity}
        action={
          <Button size="sm" variant="outline" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
        }
      >
        {recentPatterns.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Network className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No patterns detected in last 24h</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="text-left py-3 px-2">Time</th>
                  <th className="text-left py-3 px-2">Account</th>
                  <th className="text-left py-3 px-2">Patterns</th>
                  <th className="text-left py-3 px-2">Risk</th>
                  <th className="text-left py-3 px-2">Severity</th>
                </tr>
              </thead>
              <tbody>
                {recentPatterns.map((p, idx) => (
                  <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-2 text-sm text-gray-500">
                      {new Date(p.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-2 font-medium text-gray-900">
                      @{p.account || 'unknown'}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex gap-1">
                        {(p.flags || []).map(f => {
                          const FlagIcon = PATTERN_ICONS[f];
                          return (
                          <span key={f} className="text-lg" title={f}>
                            {FlagIcon ? <FlagIcon size={18} /> : <span>?</span>}
                          </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        p.risk_score >= 70 ? 'bg-red-100 text-red-700' :
                        p.risk_score >= 40 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {p.risk_score}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        p.severity === 'HIGH' ? 'bg-red-100 text-red-700' :
                        p.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {p.severity}
                      </span>
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
}
