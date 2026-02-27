/**
 * ML2 Impact Dashboard Component - Phase C2
 * 
 * Shows ML2 impact metrics:
 * - Noise Reduction
 * - Agreement Rate
 * - Reality Alignment
 * - Impact Score
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  TrendingDown, 
  CheckCircle,
  Activity,
  Target,
  RefreshCw,
  ArrowDownRight,
  BarChart3,
  Zap,
  Eye,
  Shield
} from 'lucide-react';
import { Button } from '../../ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// Impact Level Badge
const ImpactLevelBadge = ({ level }) => {
  const configs = {
    STRONG: { color: 'bg-green-100 text-green-700 border-green-300', icon: Zap },
    GOOD: { color: 'bg-blue-100 text-blue-700 border-blue-300', icon: CheckCircle },
    MODERATE: { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Activity },
    WEAK: { color: 'bg-red-100 text-red-700 border-red-300', icon: TrendingDown },
  };
  
  const cfg = configs[level] || configs.WEAK;
  const Icon = cfg.icon;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-medium ${cfg.color}`}>
      <Icon className="w-4 h-4" />
      {level || 'N/A'}
    </span>
  );
};

// Stat Card
const StatCard = ({ label, value, subtext, color = 'gray', icon: Icon, trend = null }) => {
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
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold">{value}</span>
        {trend !== null && (
          <span className={`text-xs ${trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-gray-400'}`}>
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '—'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      {subtext && <div className="text-xs mt-1 opacity-75">{subtext}</div>}
    </div>
  );
};

// Progress Bar
const ProgressBar = ({ value, max = 1, color = 'blue', label }) => {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const colors = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
  };
  
  return (
    <div>
      {label && (
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{label}</span>
          <span>{percent.toFixed(0)}%</span>
        </div>
      )}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colors[color]} transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export default function Ml2ImpactDashboard({ token }) {
  const [impact, setImpact] = useState(null);
  const [window, setWindow] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchImpact = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/connections/ml2/impact?window=${window}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (data.ok) {
        setImpact(data.data);
      } else {
        setError(data.error || 'Failed to load impact data');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [token, window]);

  useEffect(() => {
    fetchImpact();
  }, [fetchImpact]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-xl border border-red-200 p-6 text-center">
        <p className="text-red-600">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchImpact} className="mt-3">
          Retry
        </Button>
      </div>
    );
  }

  const hasData = impact && impact.totalAlerts > 0;
  
  // Calculate percentages
  const noiseReductionPercent = impact?.noiseReduction !== null 
    ? (impact.noiseReduction * 100).toFixed(1) 
    : 'N/A';
  const agreementPercent = impact?.agreementRate !== null 
    ? (impact.agreementRate * 100).toFixed(1) 
    : 'N/A';
  const realityPercent = impact?.realityAlignment !== null 
    ? (impact.realityAlignment * 100).toFixed(1) 
    : 'N/A';
  const impactScorePercent = impact?.impactScore !== null 
    ? (impact.impactScore * 100).toFixed(1) 
    : 'N/A';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              ML2 Impact Dashboard
            </h3>
            <p className="text-xs text-gray-500">Phase C2 — Feedback & Impact Layer</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Window Selector */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {['7d', '30d', '90d'].map(w => (
              <button
                key={w}
                onClick={() => setWindow(w)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition
                  ${window === w 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'}`}
              >
                {w}
              </button>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={fetchImpact}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Impact Score Hero */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Impact Score</p>
              <p className="text-4xl font-bold text-gray-900">
                {impactScorePercent}%
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Formula: (Agreement × 0.4) + (Noise Reduction × 0.4) + (Reality Alignment × 0.2)
              </p>
            </div>
            <ImpactLevelBadge level={impact?.impactLevel} />
          </div>
        </div>

        {!hasData && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <Eye className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-sm text-yellow-700">
              No alert data in the selected time window. Impact metrics will appear as alerts are processed.
            </p>
          </div>
        )}

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            label="Total Alerts" 
            value={impact?.totalAlerts || 0}
            color="blue"
            icon={Activity}
          />
          <StatCard 
            label="Sent Before ML" 
            value={impact?.sentBeforeMl || 0}
            subtext="Baseline (rule engine)"
            color="gray"
          />
          <StatCard 
            label="Sent After ML" 
            value={impact?.sentAfterMl || 0}
            subtext="With ML2 applied"
            color="green"
          />
          <StatCard 
            label="Suppressed by ML" 
            value={impact?.suppressedByMl || 0}
            subtext="Blocked as noise"
            color="red"
            icon={ArrowDownRight}
          />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Noise Reduction */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-5 h-5 text-red-500" />
              <span className="text-sm font-semibold text-gray-700">Noise Reduction</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">{noiseReductionPercent}%</p>
            {impact?.noiseReduction !== null && (
              <ProgressBar 
                value={impact.noiseReduction} 
                color={impact.noiseReduction > 0.3 ? 'green' : impact.noiseReduction > 0.1 ? 'yellow' : 'red'}
              />
            )}
            <p className="text-xs text-gray-500 mt-2">
              Alerts suppressed by ML2 / Total alerts
            </p>
          </div>

          {/* Agreement Rate */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm font-semibold text-gray-700">Agreement Rate</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">{agreementPercent}%</p>
            {impact?.agreementRate !== null && (
              <ProgressBar 
                value={impact.agreementRate}
                color={impact.agreementRate > 0.75 ? 'green' : impact.agreementRate > 0.5 ? 'yellow' : 'red'}
              />
            )}
            <p className="text-xs text-gray-500 mt-2">
              Admin "Correct" feedback / Total rated feedback
            </p>
          </div>

          {/* Reality Alignment */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-semibold text-gray-700">Reality Alignment</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">{realityPercent}%</p>
            {impact?.realityAlignment !== null && (
              <ProgressBar 
                value={impact.realityAlignment}
                color={impact.realityAlignment > 0.7 ? 'green' : impact.realityAlignment > 0.5 ? 'yellow' : 'red'}
              />
            )}
            <p className="text-xs text-gray-500 mt-2">
              CONFIRMS / (CONFIRMS + CONTRADICTS)
            </p>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs font-medium text-gray-500 mb-2">Before vs After ML2</p>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs text-gray-400">Before</p>
                <p className="text-lg font-semibold">{impact?.sentBeforeMl || 0}</p>
              </div>
              <div className="text-gray-300">→</div>
              <div>
                <p className="text-xs text-gray-400">After</p>
                <p className="text-lg font-semibold">{impact?.sentAfterMl || 0}</p>
              </div>
              {impact?.sentBeforeMl > 0 && (
                <div className={`ml-auto text-sm font-medium ${
                  impact.sentAfterMl < impact.sentBeforeMl ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {impact.sentAfterMl < impact.sentBeforeMl ? '↓' : '—'} 
                  {Math.round(((impact.sentBeforeMl - impact.sentAfterMl) / impact.sentBeforeMl) * 100)}%
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs font-medium text-gray-500 mb-2">ML2 Actions</p>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-gray-400">Suppressed</p>
                <p className="text-lg font-semibold text-red-600">{impact?.suppressedByMl || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Downgraded</p>
                <p className="text-lg font-semibold text-yellow-600">{impact?.downgradedByMl || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Low Priority</p>
                <p className="text-lg font-semibold text-blue-600">{impact?.lowPriorityAfterMl || 0}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-100">
          ML2 Impact Dashboard — Phase C2 — Window: {window}
        </div>
      </div>
    </div>
  );
}
