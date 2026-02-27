/**
 * Shadow Mode Dashboard Component
 * 
 * V1 vs V2 comparison metrics and kill switch status
 */
import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, TrendingUp, TrendingDown, Activity, Shield } from 'lucide-react';
import { shadowApi } from '../api/engineV2Api';

const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-100 shadow-lg ${className}`}>
    {children}
  </div>
);

// Kill switch status colors
const KILL_SWITCH_CONFIG = {
  'OK': { 
    label: 'Shadow Stable', 
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: CheckCircle 
  },
  'ALERT': { 
    label: 'Shadow Divergence', 
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: AlertTriangle 
  },
  'FORCE_V1': { 
    label: 'V1 Forced', 
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: XCircle 
  },
};

export default function ShadowDashboard({ window = '24h' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const result = await shadowApi.summary(window);
        if (result.ok) {
          setData(result.data);
        } else {
          setError(result.message || 'Failed to fetch shadow data');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [window]);
  
  if (loading) {
    return (
      <GlassCard className="p-5 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded"></div>
          ))}
        </div>
      </GlassCard>
    );
  }
  
  if (error || !data) {
    return (
      <GlassCard className="p-5">
        <div className="text-center text-gray-500">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <p>{error || 'No shadow data available'}</p>
        </div>
      </GlassCard>
    );
  }
  
  const { metrics, killSwitch } = data;
  const killSwitchConfig = KILL_SWITCH_CONFIG[killSwitch.status] || KILL_SWITCH_CONFIG.OK;
  const KillSwitchIcon = killSwitchConfig.icon;
  
  // Metric card component
  const MetricCard = ({ label, value, suffix = '', icon: Icon, color = 'text-gray-700', trend = null }) => (
    <div className="bg-gray-50 rounded-xl p-3">
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className={`w-4 h-4 ${color}`} />}
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <div className="flex items-end gap-1">
        <span className={`text-2xl font-bold ${color}`}>{value}</span>
        <span className="text-sm text-gray-500 mb-0.5">{suffix}</span>
        {trend !== null && (
          <span className={`ml-auto text-xs ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}
          </span>
        )}
      </div>
    </div>
  );
  
  return (
    <GlassCard className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center shadow-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Shadow Mode</h3>
            <p className="text-xs text-gray-500">V1 vs V2 Comparison</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${killSwitchConfig.color}`}>
          <KillSwitchIcon className="w-4 h-4" />
          <span className="text-xs font-semibold">{killSwitchConfig.label}</span>
        </div>
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <MetricCard 
          label="Agreement Rate" 
          value={(metrics.agreementRate * 100).toFixed(1)} 
          suffix="%" 
          icon={CheckCircle}
          color={metrics.agreementRate >= 0.8 ? 'text-emerald-600' : metrics.agreementRate >= 0.6 ? 'text-amber-600' : 'text-red-600'}
        />
        <MetricCard 
          label="Flip Rate" 
          value={(metrics.decisionFlipRate * 100).toFixed(1)} 
          suffix="%" 
          icon={Activity}
          color={metrics.decisionFlipRate <= 0.2 ? 'text-emerald-600' : metrics.decisionFlipRate <= 0.35 ? 'text-amber-600' : 'text-red-600'}
        />
        <MetricCard 
          label="False Positives" 
          value={(metrics.falsePositivesRate * 100).toFixed(1)} 
          suffix="%" 
          icon={TrendingUp}
          color={metrics.falsePositivesRate <= 0.1 ? 'text-emerald-600' : 'text-amber-600'}
        />
        <MetricCard 
          label="False Negatives" 
          value={(metrics.falseNegativesRate * 100).toFixed(1)} 
          suffix="%" 
          icon={TrendingDown}
          color={metrics.falseNegativesRate <= 0.1 ? 'text-emerald-600' : 'text-amber-600'}
        />
      </div>
      
      {/* Delta Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <MetricCard 
          label="Avg Evidence Δ" 
          value={metrics.avgEvidenceDelta.toFixed(1)} 
          trend={metrics.avgEvidenceDelta}
        />
        <MetricCard 
          label="Avg Risk Δ" 
          value={metrics.avgRiskDelta.toFixed(1)} 
          trend={-metrics.avgRiskDelta}
        />
        <MetricCard 
          label="Avg Coverage Δ" 
          value={metrics.avgCoverageDelta.toFixed(1)} 
          trend={metrics.avgCoverageDelta}
        />
        <MetricCard 
          label="Samples" 
          value={metrics.samples} 
          icon={Activity}
        />
      </div>
      
      {/* Kill Switch Alerts */}
      {killSwitch.reasons.length > 0 && (
        <div className={`p-3 rounded-xl border ${killSwitchConfig.color}`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-semibold">Alert Reasons</span>
          </div>
          <div className="space-y-1">
            {killSwitch.reasons.map((reason, i) => (
              <div key={i} className="text-xs">{reason}</div>
            ))}
          </div>
        </div>
      )}
      
      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
        <span>Window: {metrics.window}</span>
        <span>Last updated: {new Date(metrics.computedAt).toLocaleTimeString()}</span>
      </div>
    </GlassCard>
  );
}
