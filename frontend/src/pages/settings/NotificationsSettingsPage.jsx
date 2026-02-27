/**
 * NotificationsSettingsPage - Notification Settings
 * 
 * P1 IMPROVEMENT:
 * - Deep-link instead of manual chatId entry
 * - One-click connection via button
 * - Automatic status polling
 */

import { useState, useEffect, useCallback } from 'react';
import { Bell, ArrowLeft, MessageCircle, CheckCircle2, ExternalLink, X, RefreshCw, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function NotificationsSettingsPage() {
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [connectLink, setConnectLink] = useState('');
  const [checkingStatus, setCheckingStatus] = useState(false);
  
  const [events, setEvents] = useState({
    sessionOk: true,
    sessionStale: true,
    sessionInvalid: true,
    slotAdded: false,
    monthlySummary: false,
  });
  
  // Load Telegram settings on mount
  useEffect(() => {
    loadTelegramSettings();
  }, []);
  
  async function loadTelegramSettings() {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/v4/twitter/telegram/status`);
      const data = await res.json();
      
      if (data.ok && data.data) {
        setTelegramConnected(data.data.connected || false);
        setTelegramChatId(data.data.chatId || '');
      }
    } catch (err) {
      console.error('Failed to load Telegram settings:', err);
      toast.error('Failed to load Telegram settings');
    } finally {
      setLoading(false);
    }
  }
  
  // Generate deep-link for one-click connection
  const generateConnectLink = async () => {
    try {
      setActionLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/v4/twitter/telegram/connect-link`);
      const data = await res.json();
      
      if (data.ok && data.data?.link) {
        setConnectLink(data.data.link);
        // Open the link
        window.open(data.data.link, '_blank');
        toast.info('Telegram opened. Press "Start" in the bot to connect.');
        
        // Start polling for connection status
        startStatusPolling();
      } else {
        toast.error(data.error || 'Failed to generate link');
      }
    } catch (err) {
      toast.error('Failed to generate connection link');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Poll for connection status after user opens Telegram
  const startStatusPolling = useCallback(() => {
    setCheckingStatus(true);
    let attempts = 0;
    const maxAttempts = 30; // 30 * 2s = 60 seconds
    
    const pollInterval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`${BACKEND_URL}/api/v4/twitter/telegram/status`);
        const data = await res.json();
        
        if (data.ok && data.data?.connected) {
          clearInterval(pollInterval);
          setCheckingStatus(false);
          setTelegramConnected(true);
          setTelegramChatId(data.data.chatId || '');
          toast.success('Telegram connected successfully!');
        }
      } catch (err) {
        // Ignore polling errors
      }
      
      if (attempts >= maxAttempts) {
        clearInterval(pollInterval);
        setCheckingStatus(false);
      }
    }, 2000);
    
    // Cleanup on unmount
    return () => clearInterval(pollInterval);
  }, []);
  
  const handleSendTest = async () => {
    try {
      setActionLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/v4/twitter/telegram/test`, {
        method: 'POST',
      });
      const data = await res.json();
      
      if (data.ok && data.delivered) {
        toast.success('Test message sent! Check your Telegram.');
      } else {
        toast.error(data.message || 'Failed to send test message');
      }
    } catch (err) {
      toast.error('Failed to send test message');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleDisconnect = async () => {
    if (!confirm('Are you sure? You will stop receiving notifications in Telegram.')) {
      return;
    }
    
    try {
      setActionLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/v4/twitter/telegram/unlink`, {
        method: 'DELETE',
      });
      const data = await res.json();
      
      if (data.ok) {
        setTelegramConnected(false);
        setTelegramChatId('');
        setConnectLink('');
        toast.success('Telegram disconnected');
      } else {
        toast.error(data.error || 'Failed to disconnect');
      }
    } catch (err) {
      toast.error('Failed to disconnect Telegram');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleRefreshStatus = async () => {
    setCheckingStatus(true);
    await loadTelegramSettings();
    setCheckingStatus(false);
  };
  
  const handleSavePreferences = async () => {
    try {
      setActionLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/v4/twitter/telegram/events`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(events),
      });
      const data = await res.json();
      
      if (data.ok) {
        toast.success('Preferences saved');
      } else {
        toast.error(data.error || 'Failed to save');
      }
    } catch (err) {
      toast.error('Failed to save preferences');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleEventToggle = (key) => {
    setEvents(prev => ({ ...prev, [key]: !prev[key] }));
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50" data-testid="notifications-settings-page">
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/dashboard/twitter">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-600" />
            <h1 className="text-xl font-semibold text-gray-900">
              Notification Settings
            </h1>
          </div>
        </div>
        
        {/* Telegram Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Telegram</h2>
              <p className="text-sm text-gray-500">
                Receive alerts about your Twitter parsing sessions
              </p>
            </div>
            {telegramConnected && (
              <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" />
            )}
          </div>
          
          {!telegramConnected ? (
            <div className="space-y-4">
              {/* One-Click Connection */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5">
                <h3 className="font-medium text-blue-900 mb-3">One-Click Connection</h3>
                <p className="text-sm text-blue-700 mb-4">
                  Click the button below — Telegram will open. Press "Start" in the bot, and the connection will happen automatically.
                </p>
                
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={generateConnectLink} 
                    disabled={actionLoading || checkingStatus}
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                    data-testid="connect-telegram-btn"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ExternalLink className="w-4 h-4" />
                    )}
                    Connect Telegram
                  </Button>
                  
                  {checkingStatus && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Waiting for connection...</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Manual refresh */}
              <div className="flex items-center justify-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRefreshStatus}
                  disabled={checkingStatus}
                  className="text-gray-500"
                  data-testid="refresh-status-btn"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${checkingStatus ? 'animate-spin' : ''}`} />
                  Refresh Status
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Connected Status */}
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Telegram Connected</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleDisconnect}
                    disabled={actionLoading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
                    data-testid="disconnect-telegram-btn"
                  >
                    <X className="w-4 h-4" />
                    Disconnect
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  Chat ID: <span className="font-mono">{telegramChatId}</span>
                </p>
                <p className="text-sm text-green-600 mt-1">
                  You will receive notifications based on your preferences below.
                </p>
              </div>
              
              {/* Test Message */}
              <Button 
                variant="outline" 
                onClick={handleSendTest}
                disabled={actionLoading}
                className="w-full"
                data-testid="send-test-btn"
              >
                {actionLoading ? 'Sending...' : 'Send Test Message'}
              </Button>
            </div>
          )}
        </div>
        
        {/* Event Preferences */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Notification Types</h2>
          <p className="text-sm text-gray-500 mb-4">
            Choose which events trigger Telegram notifications.
          </p>
          
          <div className="space-y-3">
            <EventToggle
              label="Session Restored"
              description="When session is working again"
              emoji="🟢"
              checked={events.sessionOk}
              onChange={() => handleEventToggle('sessionOk')}
              dataTestId="event-session-ok"
            />
            <EventToggle
              label="Session Stale"
              description="When session is about to expire"
              emoji="🟠"
              checked={events.sessionStale}
              onChange={() => handleEventToggle('sessionStale')}
              dataTestId="event-session-stale"
            />
            <EventToggle
              label="Session Invalid"
              description="When session stopped working"
              emoji="🔴"
              checked={events.sessionInvalid}
              onChange={() => handleEventToggle('sessionInvalid')}
              dataTestId="event-session-invalid"
            />
            <EventToggle
              label="Parse Aborted"
              description="When parsing task failed"
              emoji="⚠️"
              checked={events.slotAdded}
              onChange={() => handleEventToggle('slotAdded')}
              dataTestId="event-parse-aborted"
            />
            <EventToggle
              label="Parse Completed"
              description="When parsing task finished successfully"
              emoji="✅"
              checked={events.monthlySummary}
              onChange={() => handleEventToggle('monthlySummary')}
              dataTestId="event-parse-completed"
            />
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <Button 
              onClick={handleSavePreferences}
              disabled={actionLoading || !telegramConnected}
              className="w-full"
              data-testid="save-preferences-btn"
            >
              {actionLoading ? 'Saving...' : 'Save Preferences'}
            </Button>
            {!telegramConnected && (
              <p className="text-sm text-gray-500 text-center mt-2">
                Connect Telegram to enable notifications
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// EventToggle component
function EventToggle({ label, description, emoji, checked, onChange, dataTestId }) {
  return (
    <div 
      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
      data-testid={dataTestId}
    >
      <div className="flex items-center gap-3 flex-1">
        <span className="text-2xl">{emoji}</span>
        <div>
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
