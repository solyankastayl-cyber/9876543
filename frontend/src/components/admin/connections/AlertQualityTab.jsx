/**
 * Alert Quality Model (AQM) Admin Tab - Phase 5.A.3
 * 
 * Features:
 * - Distribution: HIGH/MEDIUM/LOW/NOISE
 * - Weights editor
 * - Fatigue controls
 * - Dry-run tester
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  Brain, 
  RefreshCw, 
  Settings, 
  Play, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Sliders,
  TestTube
} from 'lucide-react';
import { Button } from '../../ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// Stat Card
const StatCard = ({ label, value, color = 'gray', icon: Icon }) => {
  const colors = {
    green: 'bg-green-50 text-green-600 border-green-100',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    gray: 'bg-gray-50 text-gray-600 border-gray-100',
  };
  
  return (
    <div className={`rounded-xl p-4 border ${colors[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium opacity-75">{label}</span>
        {Icon && <Icon className="w-4 h-4 opacity-50" />}
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

// Weight Slider
const WeightSlider = ({ label, value, onChange, min = 0, max = 1, step = 0.05, disabled }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs">
      <span className="font-medium text-gray-700">{label}</span>
      <span className="text-gray-500">{(value * 100).toFixed(0)}%</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      disabled={disabled}
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
    />
  </div>
);

export default function AlertQualityTab({ token }) {
  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [configRes, statsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/admin/connections/ml/quality/config`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${BACKEND_URL}/api/admin/connections/ml/quality/stats`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);
      
      const [configData, statsData] = await Promise.all([
        configRes.json(),
        statsRes.json(),
      ]);
      
      if (configData.ok) setConfig(configData.data);
      if (statsData.ok) setStats(statsData.data);
    } catch (err) {
      setToast({ message: 'Failed to load AQM data', type: 'error' });
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateConfig = async (updates) => {
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/connections/ml/quality/config`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.ok) {
        setToast({ message: 'AQM config updated', type: 'success' });
        setConfig(data.data);
      } else {
        setToast({ message: data.message || 'Update failed', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Failed to update config', type: 'error' });
    }
    setSaving(false);
  };

  const runDryTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/connections/ml/quality/evaluate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          alert_type: 'EARLY_BREAKOUT',
          scores: { twitter_score: 750, influence: 60, quality: 70, trend: 55, network: 65, consistency: 50 },
          confidence: { score: 72, level: 'HIGH' },
          early_signal: { score: 25, velocity: 2.5, acceleration: 0.3 },
          network: { authority: 0.7, hops_to_elite: 2, elite_exposure_pct: 15 },
          audience: { smart_followers_pct: 35, purity_score: 75 },
          temporal: { last_alert_hours_ago: 48, alert_count_24h: 2 },
          meta: { mode: 'MOCK', pilot_account: false },
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setTestResult(data.data);
      }
    } catch (err) {
      setToast({ message: 'Test failed', type: 'error' });
    }
    setTesting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading AQM data...</span>
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
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Brain className="w-6 h-6 text-purple-500 mt-0.5" />
          <div>
            <h3 className="font-semibold text-purple-900">Alert Quality Model (AQM)</h3>
            <p className="text-sm text-purple-700 mt-1">
              Evaluates alert usefulness. High score = send, Noise = suppress.
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

      {/* Distribution Stats */}
      <SectionCard title="Label Distribution (24h)" icon={BarChart3}>
        <div className="grid grid-cols-4 gap-4">
          <StatCard 
            label="HIGH" 
            value={stats?.distribution?.HIGH || 0} 
            color="green"
            icon={CheckCircle}
          />
          <StatCard 
            label="MEDIUM" 
            value={stats?.distribution?.MEDIUM || 0} 
            color="yellow"
            icon={TrendingUp}
          />
          <StatCard 
            label="LOW" 
            value={stats?.distribution?.LOW || 0} 
            color="orange"
            icon={AlertTriangle}
          />
          <StatCard 
            label="NOISE" 
            value={stats?.distribution?.NOISE || 0} 
            color="red"
            icon={AlertTriangle}
          />
        </div>
        <div className="mt-4 text-sm text-gray-500">
          <span className="font-medium">Suppressed:</span> {stats?.suppressed_count || 0} alerts blocked by AQM
        </div>
      </SectionCard>

      {/* Weights Editor */}
      <SectionCard 
        title="Score Weights" 
        icon={Sliders}
        action={
          <span className="text-xs text-gray-400">v{config?.version || '1.0.0'}</span>
        }
      >
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <WeightSlider
              label="Early Signal"
              value={config?.weights?.early_signal || 0.30}
              onChange={(v) => updateConfig({ weights: { ...config.weights, early_signal: v }})}
              disabled={saving}
            />
            <WeightSlider
              label="Confidence"
              value={config?.weights?.confidence || 0.25}
              onChange={(v) => updateConfig({ weights: { ...config.weights, confidence: v }})}
              disabled={saving}
            />
            <WeightSlider
              label="Smart Followers"
              value={config?.weights?.smart_followers || 0.20}
              onChange={(v) => updateConfig({ weights: { ...config.weights, smart_followers: v }})}
              disabled={saving}
            />
          </div>
          <div className="space-y-4">
            <WeightSlider
              label="Authority"
              value={config?.weights?.authority || 0.15}
              onChange={(v) => updateConfig({ weights: { ...config.weights, authority: v }})}
              disabled={saving}
            />
            <WeightSlider
              label="Alert Fatigue (penalty)"
              value={config?.weights?.alert_fatigue || 0.10}
              onChange={(v) => updateConfig({ weights: { ...config.weights, alert_fatigue: v }})}
              disabled={saving}
            />
            <div className="text-xs text-yellow-600 flex items-center gap-1 mt-2">
              <AlertTriangle className="w-3 h-3" />
              Weights should ideally sum to 1.0 (excluding fatigue)
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Thresholds */}
      <SectionCard title="Thresholds" icon={Settings}>
        <div className="grid grid-cols-4 gap-4">
          <div className="p-3 bg-green-50 rounded-xl border border-green-100">
            <div className="text-xs text-green-600 mb-1">HIGH threshold</div>
            <div className="text-xl font-bold text-green-700">
              ≥{((config?.thresholds?.high || 0.75) * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-green-500">→ SEND</div>
          </div>
          <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-100">
            <div className="text-xs text-yellow-600 mb-1">MEDIUM threshold</div>
            <div className="text-xl font-bold text-yellow-700">
              ≥{((config?.thresholds?.medium || 0.55) * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-yellow-500">→ SEND</div>
          </div>
          <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
            <div className="text-xs text-orange-600 mb-1">LOW threshold</div>
            <div className="text-xl font-bold text-orange-700">
              ≥{((config?.thresholds?.low || 0.40) * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-orange-500">→ SEND_LOW_PRIORITY</div>
          </div>
          <div className="p-3 bg-red-50 rounded-xl border border-red-100">
            <div className="text-xs text-red-600 mb-1">NOISE threshold</div>
            <div className="text-xl font-bold text-red-700">
              &lt;{((config?.thresholds?.low || 0.40) * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-red-500">→ SUPPRESS</div>
          </div>
        </div>
      </SectionCard>

      {/* Dry-Run Tester */}
      <SectionCard 
        title="Dry-Run Tester" 
        icon={TestTube}
        action={
          <Button size="sm" onClick={runDryTest} disabled={testing} data-testid="run-aqm-test">
            {testing ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Play className="w-4 h-4 mr-1" />}
            Run Test
          </Button>
        }
      >
        <p className="text-sm text-gray-600 mb-4">
          Test AQM with a sample alert context to see the evaluation result.
        </p>
        
        {testResult && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Result:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                testResult.label === 'HIGH' ? 'bg-green-100 text-green-700' :
                testResult.label === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                testResult.label === 'LOW' ? 'bg-orange-100 text-orange-700' :
                'bg-red-100 text-red-700'
              }`}>
                {testResult.label} ({(testResult.probability * 100).toFixed(0)}%)
              </span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-gray-700">Recommendation:</span>
              <span className={`ml-2 ${
                testResult.recommendation === 'SEND' ? 'text-green-600' :
                testResult.recommendation === 'SEND_LOW_PRIORITY' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {testResult.recommendation}
              </span>
            </div>
            {testResult.explain && (
              <div className="text-sm space-y-1">
                <div className="text-gray-700 font-medium">Explanation:</div>
                <div className="text-green-600">
                  ✓ {testResult.explain.top_positive_factors?.slice(0, 2).join(', ') || 'N/A'}
                </div>
                <div className="text-red-600">
                  ✗ {testResult.explain.top_negative_factors?.slice(0, 2).join(', ') || 'N/A'}
                </div>
              </div>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
