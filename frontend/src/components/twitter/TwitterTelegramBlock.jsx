/**
 * B.2 - Twitter Telegram Settings Block (Complete)
 * 
 * User-scoped Telegram configuration for Twitter parsing alerts:
 * - Connection status with disconnect
 * - Send test message
 * - Event preferences (checkboxes)
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  MessageCircle, Send, Check, AlertTriangle, 
  RefreshCw, ExternalLink, Loader2, Bell, BellOff, Copy,
  Settings, X, Power
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// Event types with labels and descriptions
const EVENT_CONFIGS = [
  { key: 'sessionOk', label: 'Session OK', desc: 'When session becomes healthy', emoji: '🟢' },
  { key: 'sessionStale', label: 'Session Stale', desc: 'When cookies need refresh', emoji: '🟠' },
  { key: 'sessionInvalid', label: 'Session Invalid', desc: 'When session is broken', emoji: '🔴' },
  { key: 'parseAborted', label: 'Parse Aborted', desc: 'When parsing is stopped', emoji: '⛔' },
  { key: 'highRisk', label: 'High Risk', desc: 'Risk detection alerts', emoji: '⚠️' },
  { key: 'cooldown', label: 'Cooldown', desc: 'Account cooling down', emoji: '❄️' },
  { key: 'parseCompleted', label: 'Parse Completed', desc: 'When parsing finishes', emoji: '✅' },
];

// API functions
async function getTelegramStatus() {
  const res = await fetch(`${API_BASE}/api/v4/twitter/telegram/status`);
  return res.json();
}

async function sendTestMessage() {
  const res = await fetch(`${API_BASE}/api/v4/twitter/telegram/test`, {
    method: 'POST',
  });
  return res.json();
}

async function disconnectTelegram() {
  const res = await fetch(`${API_BASE}/api/v4/twitter/telegram/disconnect`, {
    method: 'POST',
  });
  return res.json();
}

async function getEventPreferences() {
  const res = await fetch(`${API_BASE}/api/v4/twitter/telegram/events`);
  return res.json();
}

async function updateEventPreferences(prefs) {
  const res = await fetch(`${API_BASE}/api/v4/twitter/telegram/events`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prefs),
  });
  return res.json();
}

async function generateLinkCode() {
  const res = await fetch(`${API_BASE}/api/telegram/connect`, {
    method: 'POST',
  });
  return res.json();
}

async function getTelegramConnection() {
  const res = await fetch(`${API_BASE}/api/telegram/connection`);
  return res.json();
}

// Main component
export function TwitterTelegramBlock() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testSending, setTestSending] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [linkCode, setLinkCode] = useState(null);
  const [copied, setCopied] = useState(false);
  const [eventPrefs, setEventPrefs] = useState(null);
  const [savingPrefs, setSavingPrefs] = useState({});
  const [showSettings, setShowSettings] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      const [twitterRes, telegramRes] = await Promise.all([
        getTelegramStatus(),
        getTelegramConnection(),
      ]);
      
      const connected = twitterRes.data?.connected || telegramRes.data?.connected || false;
      
      setStatus({
        connected,
        username: telegramRes.data?.username || twitterRes.data?.username,
        chatId: twitterRes.data?.chatId,
        lastMessageAt: twitterRes.data?.lastMessageAt,
      });
      
      // Load event preferences if connected
      if (connected && twitterRes.data?.eventPreferences) {
        setEventPrefs(twitterRes.data.eventPreferences);
      } else if (connected) {
        // Fallback: load from separate endpoint
        try {
          const eventsRes = await getEventPreferences();
          if (eventsRes.ok) {
            setEventPrefs(eventsRes.data);
          }
        } catch (e) {
          console.error('Failed to load event prefs:', e);
        }
      }
    } catch (err) {
      console.error('Failed to load telegram status:', err);
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleSendTest = async () => {
    setTestSending(true);
    setTestResult(null);
    
    try {
      const res = await sendTestMessage();
      setTestResult(res);
      
      if (res.ok && res.delivered) {
        toast.success('Test message sent! Check your Telegram.');
      } else {
        toast.error(res.message || 'Failed to send message');
      }
    } catch (err) {
      setTestResult({ ok: false, error: 'Network error' });
      toast.error('Network error');
    } finally {
      setTestSending(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect Telegram notifications? You will stop receiving alerts.')) {
      return;
    }
    
    setDisconnecting(true);
    try {
      const res = await disconnectTelegram();
      if (res.ok) {
        toast.success('Telegram disconnected');
        setStatus({ connected: false });
        setEventPrefs(null);
        setShowSettings(false);
      } else {
        toast.error(res.message || 'Failed to disconnect');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleToggleEvent = async (key, newValue) => {
    setSavingPrefs(prev => ({ ...prev, [key]: true }));
    
    try {
      const res = await updateEventPreferences({ [key]: newValue });
      if (res.ok) {
        setEventPrefs(prev => ({ ...prev, [key]: newValue }));
        toast.success('Preferences saved');
      } else {
        toast.error('Failed to save');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setSavingPrefs(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleGenerateCode = async () => {
    try {
      const res = await generateLinkCode();
      if (res.ok) {
        setLinkCode(res.data);
      } else {
        toast.error('Failed to generate code');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const handleCopyCode = () => {
    if (linkCode?.code) {
      navigator.clipboard.writeText(linkCode.link || `https://t.me/FOMO_a_bot?start=${linkCode.code}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Link copied!');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center" data-testid="telegram-loading">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="twitter-telegram-block">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Telegram Notifications</h3>
            <p className="text-sm text-gray-500">
              Receive alerts about sessions and parsing
            </p>
          </div>
        </div>
        
        {status?.connected && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="text-gray-500"
            data-testid="telegram-settings-toggle"
          >
            <Settings className="w-4 h-4" />
          </Button>
        )}
      </div>

      {status?.connected ? (
        /* Connected State */
        <div className="space-y-4">
          {/* Status Badge */}
          <div className="flex items-center justify-between bg-green-50 px-4 py-3 rounded-lg">
            <div className="flex items-center gap-2 text-green-600">
              <Check className="w-5 h-5" />
              <div>
                <span className="font-medium">Telegram connected</span>
                {status.username && (
                  <span className="text-sm text-green-700 ml-2">@{status.username}</span>
                )}
              </div>
            </div>
          </div>

          {/* Event Preferences Section */}
          {showSettings && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-4" data-testid="telegram-event-settings">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Notification Settings
                </h4>
              </div>
              
              <div className="space-y-3">
                {EVENT_CONFIGS.map(({ key, label, desc, emoji }) => (
                  <div 
                    key={key} 
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    data-testid={`event-toggle-${key}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{emoji}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-800">{label}</div>
                        <div className="text-xs text-gray-500">{desc}</div>
                      </div>
                    </div>
                    <Switch
                      checked={eventPrefs?.[key] ?? true}
                      onCheckedChange={(v) => handleToggleEvent(key, v)}
                      disabled={savingPrefs[key]}
                      data-testid={`switch-${key}`}
                    />
                  </div>
                ))}
              </div>
              
              {/* Disconnect Button */}
              <div className="pt-3 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="text-red-600 border-red-200 hover:bg-red-50 w-full"
                  data-testid="telegram-disconnect-btn"
                >
                  {disconnecting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Power className="w-4 h-4 mr-2" />
                  )}
                  Disconnect Telegram
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleSendTest}
              disabled={testSending}
              data-testid="send-test-message-btn"
            >
              {testSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Test Message
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={loadStatus}
              className="text-gray-500"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
              testResult.ok && testResult.delivered
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`} data-testid="test-result">
              {testResult.ok && testResult.delivered ? (
                <>
                  <Check className="w-4 h-4" />
                  Message sent! Check your Telegram.
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  {testResult.message || testResult.error || 'Failed to send'}
                </>
              )}
            </div>
          )}

          {/* Last Message Info */}
          {status.lastMessageAt && (
            <div className="text-xs text-gray-400">
              Last notification: {new Date(status.lastMessageAt).toLocaleString()}
            </div>
          )}
        </div>
      ) : (
        /* Not Connected State */
        <div className="space-y-4">
          {/* Description */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm text-amber-800 font-medium">Telegram not connected</p>
                <p className="text-sm text-amber-700 mt-1">
                  Connect Telegram to receive notifications about your Twitter sessions.
                </p>
              </div>
            </div>
          </div>

          {/* Generate Code Button */}
          {!linkCode ? (
            <Button
              onClick={handleGenerateCode}
              className="gap-2"
              data-testid="connect-telegram-btn"
            >
              <Bell className="w-4 h-4" />
              Connect Telegram
            </Button>
          ) : (
            /* Show Link */
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900 mb-3">
                  Click the link to connect:
                </p>
                
                <div className="flex items-center gap-2">
                  <a
                    href={linkCode.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg py-3 px-4 font-medium hover:bg-blue-700 transition-colors"
                    data-testid="telegram-link"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in Telegram
                  </a>
                  <button
                    onClick={handleCopyCode}
                    className="p-3 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Copy link"
                    data-testid="copy-link-btn"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                
                <p className="text-xs text-blue-600 mt-3">
                  Link valid for {Math.round(linkCode.expiresIn / 60)} minutes
                </p>
              </div>

              {/* Refresh Button */}
              <Button
                variant="ghost"
                onClick={loadStatus}
                className="text-gray-500"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Check connection status
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Notifications are sent only to you. You can disable them at any time.
        </p>
      </div>
    </div>
  );
}
