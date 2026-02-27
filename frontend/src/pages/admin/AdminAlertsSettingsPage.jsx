/**
 * Admin Alerts Settings Page
 * 
 * Configure Telegram/Discord alerts for FOMO AI
 */

import { useState, useEffect } from 'react';
import { 
  Bell, Send, MessageSquare, Settings, Shield, Zap,
  CheckCircle, XCircle, Loader2, RefreshCw, TestTube
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function AdminAlertsSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    enabled: true,
    telegram: { enabled: false, botToken: '', chatId: '' },
    discord: { enabled: false, webhookUrl: '' },
    decisionConfidenceThreshold: 0.65,
    cooldownPerAssetMs: 30 * 60 * 1000,
    channels: { decisions: true, riskWarnings: true, systemAlerts: true },
    watchlist: [],
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v10/alerts/settings`);
      const data = await res.json();
      if (data.ok) {
        setSettings(data.settings);
        setFormData({
          ...formData,
          enabled: data.settings.enabled,
          telegram: {
            enabled: data.settings.telegram?.enabled || false,
            botToken: '',  // Don't show masked token
            chatId: data.settings.telegram?.chatId || '',
          },
          discord: {
            enabled: data.settings.discord?.enabled || false,
            webhookUrl: '',  // Don't show masked URL
          },
          decisionConfidenceThreshold: data.settings.decisionConfidenceThreshold || 0.65,
          cooldownPerAssetMs: data.settings.cooldownPerAssetMs || 30 * 60 * 1000,
          channels: data.settings.channels || { decisions: true, riskWarnings: true, systemAlerts: true },
          watchlist: data.settings.watchlist || [],
        });
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Build update payload (only include non-empty values)
      const update = {
        enabled: formData.enabled,
        decisionConfidenceThreshold: formData.decisionConfidenceThreshold,
        cooldownPerAssetMs: formData.cooldownPerAssetMs,
        channels: formData.channels,
        watchlist: formData.watchlist,
      };
      
      // Only update Telegram if values provided
      if (formData.telegram.enabled) {
        update.telegram = {
          enabled: true,
          ...(formData.telegram.botToken && { botToken: formData.telegram.botToken }),
          ...(formData.telegram.chatId && { chatId: formData.telegram.chatId }),
        };
      } else {
        update.telegram = { enabled: false };
      }
      
      // Only update Discord if values provided
      if (formData.discord.enabled && formData.discord.webhookUrl) {
        update.discord = {
          enabled: true,
          webhookUrl: formData.discord.webhookUrl,
        };
      } else {
        update.discord = { enabled: false };
      }

      const res = await fetch(`${API_URL}/api/v10/alerts/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      });
      const data = await res.json();
      
      if (data.ok) {
        await fetchSettings();  // Refresh
      }
    } catch (err) {
      console.error('Save failed:', err);
    }
    setSaving(false);
  };

  const handleTest = async (channel) => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`${API_URL}/api/v10/alerts/test/${channel}`, {
        method: 'POST',
      });
      const data = await res.json();
      setTestResult({ channel, ok: data.ok, message: data.message, error: data.error });
    } catch (err) {
      setTestResult({ channel, ok: false, error: err.message });
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-purple-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Alert Settings</h1>
              <p className="text-sm text-gray-500">Configure Telegram & Discord notifications</p>
            </div>
          </div>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Save Changes
          </button>
        </div>

        {/* Global Enable */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Alerts System</h3>
              <p className="text-sm text-gray-500">Enable or disable all alerts globally</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>

        {/* Telegram Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Send className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900">Telegram</h3>
            {settings?.telegram?.botToken && (
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">Configured</span>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={formData.telegram.enabled}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  telegram: { ...formData.telegram, enabled: e.target.checked }
                })}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label className="text-sm text-gray-700">Enable Telegram notifications</label>
            </div>
            
            {formData.telegram.enabled && (
              <>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Bot Token</label>
                  <input
                    type="password"
                    placeholder={settings?.telegram?.botToken ? '***CONFIGURED***' : 'Enter bot token from @BotFather'}
                    value={formData.telegram.botToken}
                    onChange={(e) => setFormData({
                      ...formData,
                      telegram: { ...formData.telegram, botToken: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Chat ID</label>
                  <input
                    type="text"
                    placeholder="Enter chat or channel ID"
                    value={formData.telegram.chatId}
                    onChange={(e) => setFormData({
                      ...formData,
                      telegram: { ...formData.telegram, chatId: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <button
                  onClick={() => handleTest('telegram')}
                  disabled={testing || !settings?.telegram?.botToken}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 text-sm"
                >
                  {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                  Send Test Message
                </button>
              </>
            )}
          </div>
        </div>

        {/* Alert Channels */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold text-gray-900">Alert Types</h3>
          </div>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input 
                type="checkbox" 
                checked={formData.channels.decisions}
                onChange={(e) => setFormData({
                  ...formData,
                  channels: { ...formData.channels, decisions: e.target.checked }
                })}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <div>
                <span className="text-sm text-gray-900">Decision Signals</span>
                <span className="text-xs text-gray-500 ml-2">BUY/SELL alerts with high confidence</span>
              </div>
            </label>
            
            <label className="flex items-center gap-3">
              <input 
                type="checkbox" 
                checked={formData.channels.riskWarnings}
                onChange={(e) => setFormData({
                  ...formData,
                  channels: { ...formData.channels, riskWarnings: e.target.checked }
                })}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <div>
                <span className="text-sm text-gray-900">Risk Warnings</span>
                <span className="text-xs text-gray-500 ml-2">Whale risk, market stress, contradictions</span>
              </div>
            </label>
            
            <label className="flex items-center gap-3">
              <input 
                type="checkbox" 
                checked={formData.channels.systemAlerts}
                onChange={(e) => setFormData({
                  ...formData,
                  channels: { ...formData.channels, systemAlerts: e.target.checked }
                })}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <div>
                <span className="text-sm text-gray-900">System Alerts</span>
                <span className="text-xs text-gray-500 ml-2">ML rollback, provider failures, degradation</span>
              </div>
            </label>
          </div>
        </div>

        {/* Thresholds */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900">Thresholds</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Confidence Threshold: <strong>{(formData.decisionConfidenceThreshold * 100).toFixed(0)}%</strong>
              </label>
              <input
                type="range"
                min="0.5"
                max="0.9"
                step="0.05"
                value={formData.decisionConfidenceThreshold}
                onChange={(e) => setFormData({
                  ...formData,
                  decisionConfidenceThreshold: parseFloat(e.target.value)
                })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-1">Only send decision alerts above this confidence</p>
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Cooldown: <strong>{Math.round(formData.cooldownPerAssetMs / 60000)} min</strong>
              </label>
              <input
                type="range"
                min="300000"
                max="3600000"
                step="300000"
                value={formData.cooldownPerAssetMs}
                onChange={(e) => setFormData({
                  ...formData,
                  cooldownPerAssetMs: parseInt(e.target.value)
                })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum time between alerts for same asset</p>
            </div>
          </div>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`p-4 rounded-lg mb-6 ${testResult.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-2">
              {testResult.ok ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={testResult.ok ? 'text-green-700' : 'text-red-700'}>
                {testResult.message || testResult.error}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
