/**
 * FOMO Alerts Admin Page
 * 
 * Full control over FOMO AI alert system
 * - User alerts (@t_fomo_bot)
 * - Admin alerts (@a_fomo_bot)
 * - Global rules
 * - Preview & Logs
 */

import { useState, useEffect } from 'react';
import { 
  Bell, Send, MessageSquare, Settings, Shield, Zap, Activity,
  CheckCircle, XCircle, Loader2, RefreshCw, TestTube, Eye, 
  AlertTriangle, TrendingUp, Brain, Radio
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function FomoAlertsAdminPage() {
  const [activeTab, setActiveTab] = useState('user');
  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    enabled: true,
    user: {
      enabled: true,
      botToken: '',
      chatId: '',
      decisionChanged: true,
      highConfidence: true,
      riskIncreased: true,
      confidenceThreshold: 0.65,
      symbols: [],
      cooldownMs: 15 * 60 * 1000,
    },
    admin: {
      enabled: true,
      botToken: '',
      chatId: '',
      mlPromoted: true,
      mlRollback: true,
      mlShadowCritical: true,
      providerDown: true,
      wsDisconnect: true,
      dataCompleteness: true,
      trustWarning: true,
      minSeverity: 'WARNING',
      cooldownMs: 10 * 60 * 1000,
    },
    global: {
      requireLiveData: true,
      requireMlReady: false,
      noUserAlertsOnAvoid: true,
      maxAlertsPerHour: 50,
      dedupeWindowMs: 10 * 60 * 1000,
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [configRes, statsRes, logsRes] = await Promise.all([
        fetch(`${API_URL}/api/v10/fomo-alerts/config`),
        fetch(`${API_URL}/api/v10/fomo-alerts/stats`),
        fetch(`${API_URL}/api/v10/fomo-alerts/logs?limit=50`),
      ]);
      
      const [configData, statsData, logsData] = await Promise.all([
        configRes.json(),
        statsRes.json(),
        logsRes.json(),
      ]);
      
      if (configData.ok) {
        setConfig(configData.config);
        setFormData(prev => ({
          ...prev,
          enabled: configData.config.enabled,
          user: { ...prev.user, ...configData.config.user, botToken: '', chatId: configData.config.user?.chatId || '' },
          admin: { ...prev.admin, ...configData.config.admin, botToken: '', chatId: configData.config.admin?.chatId || '' },
          global: { ...prev.global, ...configData.config.global },
        }));
      }
      
      if (statsData.ok) setStats(statsData.stats);
      if (logsData.ok) setLogs(logsData.logs);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const update = {
        enabled: formData.enabled,
        user: {
          ...formData.user,
          botToken: formData.user.botToken || undefined,
        },
        admin: {
          ...formData.admin,
          botToken: formData.admin.botToken || undefined,
        },
        global: formData.global,
      };
      
      const res = await fetch(`${API_URL}/api/v10/fomo-alerts/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      });
      
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Save failed:', err);
    }
    setSaving(false);
  };

  const handleTest = async (scope) => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`${API_URL}/api/v10/fomo-alerts/test/${scope}`, {
        method: 'POST',
      });
      const data = await res.json();
      setTestResult({ scope, ok: data.ok, message: data.message, error: data.error });
    } catch (err) {
      setTestResult({ scope, ok: false, error: err.message });
    }
    setTesting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-purple-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">FOMO AI Alerts</h1>
              <p className="text-sm text-gray-500">Telegram notifications for decisions & system events</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Alerts" value={stats.total} icon={Bell} />
            <StatCard label="Sent" value={stats.sent} icon={CheckCircle} color="green" />
            <StatCard label="Skipped" value={stats.skipped} icon={XCircle} color="gray" />
            <StatCard label="Hourly Remaining" value={stats.hourlyRemaining} icon={Activity} color="blue" />
          </div>
        )}

        {/* Global Toggle */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">FOMO AI Alerts System</h3>
              <p className="text-sm text-gray-500">Master switch for all alerts</p>
            </div>
            <Toggle
              checked={formData.enabled}
              onChange={(v) => setFormData({ ...formData, enabled: v })}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'user', label: 'User Alerts', icon: Send },
            { id: 'admin', label: 'Admin Alerts', icon: Shield },
            { id: 'global', label: 'Global Rules', icon: Settings },
            { id: 'logs', label: 'Logs', icon: Eye },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'user' && (
          <UserAlertsTab 
            formData={formData} 
            setFormData={setFormData} 
            config={config}
            onTest={() => handleTest('user')}
            testing={testing}
          />
        )}
        
        {activeTab === 'admin' && (
          <AdminAlertsTab 
            formData={formData} 
            setFormData={setFormData}
            config={config}
            onTest={() => handleTest('admin')}
            testing={testing}
          />
        )}
        
        {activeTab === 'global' && (
          <GlobalRulesTab formData={formData} setFormData={setFormData} />
        )}
        
        {activeTab === 'logs' && (
          <LogsTab logs={logs} stats={stats} />
        )}

        {/* Test Result */}
        {testResult && (
          <div className={`mt-6 p-4 rounded-lg ${testResult.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-2">
              {testResult.ok ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={testResult.ok ? 'text-green-700' : 'text-red-700'}>
                {testResult.scope.toUpperCase()}: {testResult.message || testResult.error}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function StatCard({ label, value, icon: Icon, color = 'purple' }) {
  const colors = {
    purple: 'bg-purple-50 text-purple-700',
    green: 'bg-green-50 text-green-700',
    gray: 'bg-gray-50 text-gray-600',
    blue: 'bg-blue-50 text-blue-700',
  };
  
  return (
    <div className={`rounded-xl p-4 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{label}</span>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-2xl font-bold">{value}</span>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input 
        type="checkbox" 
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
    </label>
  );
}

function UserAlertsTab({ formData, setFormData, config, onTest, testing }) {
  const user = formData.user;
  const update = (key, value) => setFormData({
    ...formData,
    user: { ...user, [key]: value }
  });

  return (
    <div className="space-y-6">
      {/* Bot Config */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Send className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900">@t_fomo_bot (User Bot)</h3>
            {config?.user?.botToken && (
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">Configured</span>
            )}
          </div>
          <Toggle checked={user.enabled} onChange={(v) => update('enabled', v)} />
        </div>
        
        {user.enabled && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Bot Token</label>
                <input
                  type="password"
                  placeholder={config?.user?.botToken ? '***CONFIGURED***' : 'From @BotFather'}
                  value={user.botToken}
                  onChange={(e) => update('botToken', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Chat ID</label>
                <input
                  type="text"
                  placeholder="Channel or group ID"
                  value={user.chatId}
                  onChange={(e) => update('chatId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            
            <button
              onClick={onTest}
              disabled={testing || !config?.user?.botToken}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 text-sm"
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
              Send Test Message
            </button>
          </div>
        )}
      </div>

      {/* Event Toggles */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          User Alert Types
        </h3>
        
        <div className="space-y-3">
          <EventToggle
            label="Decision Changed"
            description="When BUY/SELL/AVOID changes"
            checked={user.decisionChanged}
            onChange={(v) => update('decisionChanged', v)}
          />
          <EventToggle
            label="High Confidence"
            description="BUY/SELL with confidence above threshold"
            checked={user.highConfidence}
            onChange={(v) => update('highConfidence', v)}
          />
          <EventToggle
            label="Risk Increased"
            description="When risk level escalates"
            checked={user.riskIncreased}
            onChange={(v) => update('riskIncreased', v)}
          />
        </div>
      </div>

      {/* Thresholds */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-500" />
          Thresholds
        </h3>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Confidence Threshold: <strong>{(user.confidenceThreshold * 100).toFixed(0)}%</strong>
            </label>
            <input
              type="range"
              min="0.5"
              max="0.9"
              step="0.05"
              value={user.confidenceThreshold}
              onChange={(e) => update('confidenceThreshold', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Cooldown: <strong>{Math.round(user.cooldownMs / 60000)} min</strong>
            </label>
            <input
              type="range"
              min="300000"
              max="3600000"
              step="300000"
              value={user.cooldownMs}
              onChange={(e) => update('cooldownMs', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminAlertsTab({ formData, setFormData, config, onTest, testing }) {
  const admin = formData.admin;
  const update = (key, value) => setFormData({
    ...formData,
    admin: { ...admin, [key]: value }
  });

  return (
    <div className="space-y-6">
      {/* Bot Config */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-gray-900">@a_fomo_bot (Admin Bot)</h3>
            {config?.admin?.botToken && (
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">Configured</span>
            )}
          </div>
          <Toggle checked={admin.enabled} onChange={(v) => update('enabled', v)} />
        </div>
        
        {admin.enabled && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Bot Token</label>
                <input
                  type="password"
                  placeholder={config?.admin?.botToken ? '***CONFIGURED***' : 'From @BotFather'}
                  value={admin.botToken}
                  onChange={(e) => update('botToken', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Chat ID</label>
                <input
                  type="text"
                  placeholder="Admin channel ID"
                  value={admin.chatId}
                  onChange={(e) => update('chatId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            
            <button
              onClick={onTest}
              disabled={testing || !config?.admin?.botToken}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 text-sm"
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
              Send Test Message
            </button>
          </div>
        )}
      </div>

      {/* Event Toggles */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Admin Alert Types
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <EventToggle label="ML Promoted" description="Model promotion events" checked={admin.mlPromoted} onChange={(v) => update('mlPromoted', v)} />
          <EventToggle label="ML Rollback" description="Auto-rollback triggered" checked={admin.mlRollback} onChange={(v) => update('mlRollback', v)} />
          <EventToggle label="Shadow Critical" description="Shadow model health" checked={admin.mlShadowCritical} onChange={(v) => update('mlShadowCritical', v)} />
          <EventToggle label="Provider Down" description="Exchange disconnections" checked={admin.providerDown} onChange={(v) => update('providerDown', v)} />
          <EventToggle label="WS Disconnect" description="WebSocket failures" checked={admin.wsDisconnect} onChange={(v) => update('wsDisconnect', v)} />
          <EventToggle label="Data Completeness" description="Below SLA threshold" checked={admin.dataCompleteness} onChange={(v) => update('dataCompleteness', v)} />
          <EventToggle label="Trust Warning" description="Divergence/accuracy issues" checked={admin.trustWarning} onChange={(v) => update('trustWarning', v)} />
        </div>
      </div>
    </div>
  );
}

function GlobalRulesTab({ formData, setFormData }) {
  const global = formData.global;
  const update = (key, value) => setFormData({
    ...formData,
    global: { ...global, [key]: value }
  });

  return (
    <div className="space-y-6">
      {/* Safety Guards */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-green-500" />
          Safety Guards
        </h3>
        
        <div className="space-y-3">
          <EventToggle
            label="Require LIVE Data"
            description="No alerts if dataMode is MIXED or MOCK"
            checked={global.requireLiveData}
            onChange={(v) => update('requireLiveData', v)}
          />
          <EventToggle
            label="Require ML Ready"
            description="No BUY/SELL alerts if ML not active"
            checked={global.requireMlReady}
            onChange={(v) => update('requireMlReady', v)}
          />
          <EventToggle
            label="No User Alerts on AVOID"
            description="Skip user alerts when decision is AVOID"
            checked={global.noUserAlertsOnAvoid}
            onChange={(v) => update('noUserAlertsOnAvoid', v)}
          />
        </div>
      </div>

      {/* Limits */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          Rate Limits
        </h3>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Max Alerts/Hour: <strong>{global.maxAlertsPerHour}</strong>
            </label>
            <input
              type="range"
              min="10"
              max="200"
              step="10"
              value={global.maxAlertsPerHour}
              onChange={(e) => update('maxAlertsPerHour', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Dedupe Window: <strong>{Math.round(global.dedupeWindowMs / 60000)} min</strong>
            </label>
            <input
              type="range"
              min="60000"
              max="3600000"
              step="60000"
              value={global.dedupeWindowMs}
              onChange={(e) => update('dedupeWindowMs', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function LogsTab({ logs, stats }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'SENT': return 'bg-green-100 text-green-700';
      case 'SKIPPED':
      case 'DEDUPED':
      case 'MUTED': return 'bg-gray-100 text-gray-600';
      case 'FAILED': return 'bg-red-100 text-red-700';
      case 'GUARD_BLOCKED': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats by Status */}
      {stats?.byStatus && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Alert Statistics</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <span key={status} className={`px-3 py-1 rounded-full text-sm ${getStatusColor(status)}`}>
                {status}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Log Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Recent Alerts</h3>
        </div>
        
        <div className="max-h-[500px] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No alerts yet</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs text-gray-500">Time</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-500">Event</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-500">Scope</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-500">Status</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-500">Reason</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={log.alertId || i} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-2 text-sm font-mono">{log.event}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        log.scope === 'USER' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {log.scope}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500 truncate max-w-[200px]">
                      {log.skipReason || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function EventToggle({ label, description, checked, onChange }) {
  return (
    <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
      <div>
        <span className="text-sm font-medium text-gray-900">{label}</span>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </label>
  );
}
