/**
 * Admin Settings Page - ETAP 3
 * 
 * Unified settings management in admin panel.
 * Categories: System, Networks, ML, Market APIs
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { api } from '../../api/client';
import { 
  Settings, Cpu, Globe, Brain, Cloud, 
  Save, RefreshCw, Loader2, AlertTriangle, CheckCircle,
  RotateCcw, Shield, Info
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { InfoTooltip, ADMIN_TOOLTIPS } from '../../components/admin/InfoTooltip';

// ============ TAB NAVIGATION ============
function SettingsTabs({ active, onChange }) {
  const tabs = [
    { id: 'system', label: 'System', icon: Cpu },
    { id: 'networks', label: 'Networks', icon: Globe },
    { id: 'ml', label: 'ML', icon: Brain },
    { id: 'market', label: 'Market APIs', icon: Cloud },
  ];

  return (
    <div className="border-b border-slate-200 mb-6">
      <nav className="flex gap-6">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              data-testid={`settings-tab-${tab.id}`}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                active === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// ============ SYSTEM SETTINGS TAB ============
function SystemSettingsTab({ data, onChange, onSave, onReset, saving }) {
  const payload = data?.payload || {};

  return (
    <div className="space-y-6">
      {/* Decision Mode */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Decision Mode
          <InfoTooltip text={ADMIN_TOOLTIPS.decisionMode} />
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Controls how the system makes trading decisions
        </p>
        <div className="grid grid-cols-3 gap-3">
          {['RULES_ONLY', 'ADVISORY', 'INFLUENCE'].map(mode => (
            <button
              key={mode}
              onClick={() => onChange({ decisionMode: mode })}
              className={`p-4 rounded-lg border-2 text-center transition-colors ${
                payload.decisionMode === mode
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="font-medium text-slate-900">{mode.replace('_', ' ')}</div>
              <div className="text-xs text-slate-500 mt-1">
                {mode === 'RULES_ONLY' && 'Pure rule-based decisions'}
                {mode === 'ADVISORY' && 'ML provides suggestions'}
                {mode === 'INFLUENCE' && 'ML adjusts confidence'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Kill Switch */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          Kill Switch
          <InfoTooltip text={ADMIN_TOOLTIPS.killSwitch} />
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">
              Emergency stop - disables all automated trading
            </p>
          </div>
          <button
            onClick={() => onChange({ killSwitch: !payload.killSwitch })}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              payload.killSwitch
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {payload.killSwitch ? 'ACTIVATED' : 'ARMED'}
          </button>
        </div>
      </div>

      {/* ML Influence */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          ML Influence
          <InfoTooltip text={ADMIN_TOOLTIPS.mlInfluence} />
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-600">Influence Level: {payload.mlInfluence || 0}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={payload.mlInfluence || 0}
              onChange={(e) => onChange({ mlInfluence: parseInt(e.target.value) })}
              className="w-full mt-2"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600">Drift Threshold: {(payload.driftThreshold || 0.15) * 100}%</label>
            <input
              type="range"
              min="5"
              max="50"
              value={(payload.driftThreshold || 0.15) * 100}
              onChange={(e) => onChange({ driftThreshold: parseInt(e.target.value) / 100 })}
              className="w-full mt-2"
            />
          </div>
        </div>
      </div>

      {/* Feature Flags */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          Feature Flags
          <InfoTooltip text={ADMIN_TOOLTIPS.featureFlags} />
        </h3>
        <div className="space-y-3">
          {Object.entries(payload.featureFlags || {}).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm font-medium text-slate-700">{key}</span>
              <button
                onClick={() => onChange({ 
                  featureFlags: { ...payload.featureFlags, [key]: !value } 
                })}
                className={`px-3 py-1 rounded text-xs font-medium ${
                  value 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {value ? 'ON' : 'OFF'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Button 
          variant="outline" 
          onClick={onReset}
          disabled={saving}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset to Defaults
        </Button>
        <Button 
          onClick={onSave}
          disabled={saving}
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}

// ============ NETWORKS SETTINGS TAB ============
function NetworksSettingsTab({ data, onChange, onSave, onReset, saving }) {
  const payload = data?.payload || {};

  const networks = [
    { id: 'ethereum', name: 'Ethereum', color: 'bg-blue-500' },
    { id: 'arbitrum', name: 'Arbitrum', color: 'bg-sky-500' },
    { id: 'optimism', name: 'Optimism', color: 'bg-red-500' },
    { id: 'base', name: 'Base', color: 'bg-blue-600' },
    { id: 'polygon', name: 'Polygon', color: 'bg-purple-500' },
    { id: 'bnb', name: 'BNB Chain', color: 'bg-yellow-500' },
    { id: 'zksync', name: 'zkSync', color: 'bg-indigo-500' },
    { id: 'scroll', name: 'Scroll', color: 'bg-orange-500' },
  ];

  const toggleNetwork = (networkId) => {
    const current = payload[networkId] || { enabled: true, priority: 99, lastSync: null };
    onChange({ 
      [networkId]: { ...current, enabled: !current.enabled } 
    });
  };

  const updatePriority = (networkId, priority) => {
    const current = payload[networkId] || { enabled: true, priority: 99, lastSync: null };
    onChange({ 
      [networkId]: { ...current, priority: parseInt(priority) } 
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-600" />
          Network Configuration
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Enable/disable networks and set processing priority
        </p>

        <div className="space-y-3">
          {networks.map(network => {
            const config = payload[network.id] || { enabled: true, priority: 99, lastSync: null };
            return (
              <div 
                key={network.id} 
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${network.color}`} />
                  <span className="font-medium text-slate-900">{network.name}</span>
                  {config.lastSync && (
                    <span className="text-xs text-slate-500">
                      Last sync: {new Date(config.lastSync).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Priority:</span>
                    <select
                      value={config.priority}
                      onChange={(e) => updatePriority(network.id, e.target.value)}
                      className="text-sm border border-slate-300 rounded px-2 py-1"
                    >
                      {[1,2,3,4,5,6,7,8].map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => toggleNetwork(network.id)}
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      config.enabled 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {config.enabled ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Button variant="outline" onClick={onReset} disabled={saving}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset to Defaults
        </Button>
        <Button onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}

// ============ ML SETTINGS TAB ============
function MLSettingsTab({ data, onChange, onSave, onReset, saving }) {
  const payload = data?.payload || {};

  return (
    <div className="space-y-6">
      {/* ML Master Switch */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          ML Configuration
        </h3>
        
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg mb-4">
          <div>
            <div className="font-medium text-slate-900 flex items-center gap-2">
              ML Enabled
              <InfoTooltip text={ADMIN_TOOLTIPS.mlEnabled} />
            </div>
            <div className="text-sm text-slate-500">Master switch for all ML features</div>
          </div>
          <button
            onClick={() => onChange({ enabled: !payload.enabled })}
            className={`px-4 py-2 rounded-lg font-medium ${
              payload.enabled 
                ? 'bg-green-600 text-white' 
                : 'bg-slate-300 text-slate-600'
            }`}
          >
            {payload.enabled ? 'ENABLED' : 'DISABLED'}
          </button>
        </div>

        {/* Fallback Mode */}
        <div className="mb-6">
          <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            Fallback Mode
            <InfoTooltip text={ADMIN_TOOLTIPS.fallbackMode} />
          </label>
          <div className="grid grid-cols-3 gap-3">
            {['RULES', 'CACHED', 'DISABLE'].map(mode => (
              <button
                key={mode}
                onClick={() => onChange({ fallbackMode: mode })}
                className={`p-3 rounded-lg border-2 text-center ${
                  payload.fallbackMode === mode
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-medium text-slate-900">{mode}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Market Model */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          Market Model
          <InfoTooltip text={ADMIN_TOOLTIPS.marketModel} />
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Enabled</span>
            <button
              onClick={() => onChange({ 
                marketModel: { ...payload.marketModel, enabled: !payload.marketModel?.enabled } 
              })}
              className={`px-3 py-1 rounded text-xs font-medium ${
                payload.marketModel?.enabled 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {payload.marketModel?.enabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <div>
            <label className="text-sm text-slate-600">Version</label>
            <input
              type="text"
              value={payload.marketModel?.version || ''}
              onChange={(e) => onChange({ 
                marketModel: { ...payload.marketModel, version: e.target.value } 
              })}
              className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600">
              Confidence Threshold: {((payload.marketModel?.confidenceThreshold || 0.62) * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="50"
              max="90"
              value={(payload.marketModel?.confidenceThreshold || 0.62) * 100}
              onChange={(e) => onChange({ 
                marketModel: { ...payload.marketModel, confidenceThreshold: parseInt(e.target.value) / 100 } 
              })}
              className="w-full mt-1"
            />
          </div>
        </div>
      </div>

      {/* Actor Model */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          Actor Model
          <InfoTooltip text={ADMIN_TOOLTIPS.actorModel} />
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Enabled</span>
            <button
              onClick={() => onChange({ 
                actorModel: { ...payload.actorModel, enabled: !payload.actorModel?.enabled } 
              })}
              className={`px-3 py-1 rounded text-xs font-medium ${
                payload.actorModel?.enabled 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {payload.actorModel?.enabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <div>
            <label className="text-sm text-slate-600">Version</label>
            <input
              type="text"
              value={payload.actorModel?.version || ''}
              onChange={(e) => onChange({ 
                actorModel: { ...payload.actorModel, version: e.target.value } 
              })}
              className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Ensemble Weights */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          Ensemble Weights
          <InfoTooltip text={ADMIN_TOOLTIPS.ensembleWeights} />
        </h3>
        <div className="space-y-4">
          {['exchange', 'zones', 'ml'].map(key => (
            <div key={key}>
              <label className="text-sm text-slate-600 capitalize">
                {key}: {((payload.ensembleWeights?.[key] || 0) * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={(payload.ensembleWeights?.[key] || 0) * 100}
                onChange={(e) => onChange({ 
                  ensembleWeights: { 
                    ...payload.ensembleWeights, 
                    [key]: parseInt(e.target.value) / 100 
                  } 
                })}
                className="w-full mt-1"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Button variant="outline" onClick={onReset} disabled={saving}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset to Defaults
        </Button>
        <Button onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}

// ============ MARKET SETTINGS TAB ============
function MarketSettingsTab({ data, onChange, onSave, onReset, saving }) {
  const payload = data?.payload || {};

  return (
    <div className="space-y-6">
      {/* Providers */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Cloud className="w-5 h-5 text-blue-600" />
          Market Data Providers
          <InfoTooltip text={ADMIN_TOOLTIPS.providers} />
        </h3>
        
        <div className="space-y-3">
          {(payload.providers || []).map((provider, idx) => (
            <div key={provider.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Badge variant="outline">{provider.type.toUpperCase()}</Badge>
                <span className="font-medium text-slate-900">{provider.id}</span>
                <span className="text-xs text-slate-500">Priority: {provider.priority}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">{provider.rateLimit} rpm</span>
                <button
                  onClick={() => {
                    const newProviders = [...payload.providers];
                    newProviders[idx] = { ...provider, enabled: !provider.enabled };
                    onChange({ providers: newProviders });
                  }}
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    provider.enabled 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {provider.enabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cache Settings */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Cache Configuration</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-600">L1 Cache TTL (seconds)</label>
            <input
              type="number"
              value={payload.cacheL1Ttl || 30}
              onChange={(e) => onChange({ cacheL1Ttl: parseInt(e.target.value) })}
              className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600">L2 Cache TTL (seconds)</label>
            <input
              type="number"
              value={payload.cacheL2Ttl || 120}
              onChange={(e) => onChange({ cacheL2Ttl: parseInt(e.target.value) })}
              className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Default Provider */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Default Provider</h3>
        <select
          value={payload.defaultProvider || ''}
          onChange={(e) => onChange({ defaultProvider: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg"
        >
          {(payload.providers || []).map(p => (
            <option key={p.id} value={p.id}>{p.id}</option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Button variant="outline" onClick={onReset} disabled={saving}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset to Defaults
        </Button>
        <Button onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}

// ============ MAIN PAGE ============
export default function AdminSettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'system');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({});
  const [localChanges, setLocalChanges] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch all settings
  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await api.get('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.ok) {
        setSettings(res.data.data);
        setLocalChanges({});
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Update URL when tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setLocalChanges({});
    setSuccess(null);
  };

  // Handle local changes
  const handleChange = (changes) => {
    setLocalChanges(prev => ({ ...prev, ...changes }));
  };

  // Get merged data for current tab
  const getMergedData = (category) => {
    const base = settings[category] || {};
    return {
      ...base,
      payload: { ...(base.payload || {}), ...(localChanges || {}) }
    };
  };

  // Save changes
  const handleSave = async () => {
    if (Object.keys(localChanges).length === 0) {
      setSuccess('No changes to save');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await api.post(`/api/admin/settings/${activeTab}/update`, localChanges, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.ok) {
        setSuccess('Settings saved successfully');
        setLocalChanges({});
        fetchSettings();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = async () => {
    if (!confirm('Reset this category to default values?')) return;

    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await api.post(`/api/admin/settings/${activeTab}/reset`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.ok) {
        setSuccess('Settings reset to defaults');
        setLocalChanges({});
        fetchSettings();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                <p className="text-sm text-slate-500">System configuration and control</p>
              </div>
            </div>
            <Button variant="outline" onClick={fetchSettings} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            {success}
          </div>
        )}

        {/* Version Info */}
        {settings[activeTab] && (
          <div className="mb-4 flex items-center gap-4 text-sm text-slate-500">
            <span>Version: {settings[activeTab].version || 0}</span>
            <span>Updated by: {settings[activeTab].updatedBy || 'system'}</span>
            {settings[activeTab].updatedAt && (
              <span>Last updated: {new Date(settings[activeTab].updatedAt).toLocaleString()}</span>
            )}
          </div>
        )}

        {/* Tabs */}
        <SettingsTabs active={activeTab} onChange={handleTabChange} />

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            {activeTab === 'system' && (
              <SystemSettingsTab 
                data={getMergedData('system')}
                onChange={handleChange}
                onSave={handleSave}
                onReset={handleReset}
                saving={saving}
              />
            )}
            {activeTab === 'networks' && (
              <NetworksSettingsTab 
                data={getMergedData('networks')}
                onChange={handleChange}
                onSave={handleSave}
                onReset={handleReset}
                saving={saving}
              />
            )}
            {activeTab === 'ml' && (
              <MLSettingsTab 
                data={getMergedData('ml')}
                onChange={handleChange}
                onSave={handleSave}
                onReset={handleReset}
                saving={saving}
              />
            )}
            {activeTab === 'market' && (
              <MarketSettingsTab 
                data={getMergedData('market')}
                onChange={handleChange}
                onSave={handleSave}
                onReset={handleReset}
                saving={saving}
              />
            )}
          </>
        )}

        {/* Unsaved Changes Warning */}
        {Object.keys(localChanges).length > 0 && (
          <div className="fixed bottom-4 right-4 p-4 bg-amber-50 border border-amber-200 rounded-lg shadow-lg flex items-center gap-3">
            <Info className="w-5 h-5 text-amber-600" />
            <span className="text-sm text-amber-700">You have unsaved changes</span>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              Save
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
