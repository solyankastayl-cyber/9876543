/**
 * EPIC D1 — Telegram Connect Component
 * 
 * ETAP 5.1: UI for linking Telegram to receive signal alerts
 * 
 * Features:
 * - Generate linking code
 * - Show instructions
 * - Send test alert
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  Send, Copy, Check, AlertTriangle, RefreshCw, 
  MessageCircle, ExternalLink, Bell, BellOff, Loader2
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// ==================== API ====================

async function getTelegramStatus() {
  const res = await fetch(`${API_BASE}/api/d1-signals/telegram/status`, {
    headers: { 'x-user-id': getUserId() }
  });
  return res.json();
}

async function generateLinkCode() {
  const res = await fetch(`${API_BASE}/api/d1-signals/telegram/link`, {
    method: 'POST',
    headers: { 'x-user-id': getUserId() }
  });
  return res.json();
}

async function sendTestAlert() {
  const res = await fetch(`${API_BASE}/api/d1-signals/telegram/test-signal`, {
    method: 'POST',
    headers: { 'x-user-id': getUserId() }
  });
  return res.json();
}

async function unlinkTelegram() {
  const res = await fetch(`${API_BASE}/api/d1-signals/telegram/unlink`, {
    method: 'POST',
    headers: { 'x-user-id': getUserId() }
  });
  return res.json();
}

// Simple user ID (in real app this would come from auth)
function getUserId() {
  let userId = localStorage.getItem('fomo_user_id');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem('fomo_user_id', userId);
  }
  return userId;
}

// ==================== MAIN COMPONENT ====================

export default function TelegramConnect() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [linkCode, setLinkCode] = useState(null);
  const [copied, setCopied] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState(null);
  
  // Load status on mount
  useEffect(() => {
    loadStatus();
  }, []);
  
  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await getTelegramStatus();
      if (res.ok) {
        setStatus(res.data);
      }
    } catch (err) {
      console.error('Failed to load telegram status:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleGenerateCode = async () => {
    try {
      const res = await generateLinkCode();
      if (res.ok) {
        setLinkCode(res.data);
      }
    } catch (err) {
      console.error('Failed to generate code:', err);
    }
  };
  
  const handleCopyCode = () => {
    if (linkCode) {
      navigator.clipboard.writeText(`/link ${linkCode.linkCode}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const handleSendTest = async () => {
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await sendTestAlert();
      setTestResult(res);
    } catch (err) {
      setTestResult({ ok: false, error: 'Network error' });
    } finally {
      setTestSending(false);
    }
  };
  
  const handleUnlink = async () => {
    if (window.confirm('Disconnect Telegram? You will no longer receive signal alerts.')) {
      await unlinkTelegram();
      setStatus({ linked: false });
      setLinkCode(null);
    }
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden" data-testid="telegram-connect">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Telegram Alerts</h3>
            <p className="text-sm text-blue-100">
              Receive high-severity structural signals
            </p>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {/* Connected State */}
        {status?.linked ? (
          <div className="space-y-4">
            {/* Status Badge */}
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg">
              <Check className="w-5 h-5" />
              <span className="font-medium">Telegram Connected</span>
            </div>
            
            {/* Info */}
            <p className="text-sm text-slate-600">
              You will receive notifications for high-severity signals directly in Telegram.
              No spam. No trading advice.
            </p>
            
            {/* Test Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSendTest}
                disabled={testSending}
                className="flex items-center gap-2 px-4 py-2 bg-white text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                data-testid="send-test-alert-btn"
              >
                {testSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send test alert
                  </>
                )}
              </button>
              
              <button
                onClick={handleUnlink}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
              >
                <BellOff className="w-4 h-4" />
                Disconnect
              </button>
            </div>
            
            {/* Test Result */}
            {testResult && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                testResult.ok 
                  ? 'bg-green-50 text-green-700' 
                  : 'bg-red-50 text-red-700'
              }`}>
                {testResult.ok ? (
                  <>
                    <Check className="w-4 h-4" />
                    Test alert sent! Check your Telegram.
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    {testResult.error || 'Failed to send test'}
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Not Connected State */
          <div className="space-y-4">
            {/* Description */}
            <p className="text-sm text-slate-600">
              Connect your Telegram to receive high-severity structural signals.
              <br />
              <span className="text-slate-500">No spam. No trading signals.</span>
            </p>
            
            {/* Generate Code Button */}
            {!linkCode ? (
              <button
                onClick={handleGenerateCode}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                data-testid="connect-telegram-btn"
              >
                <Bell className="w-4 h-4" />
                Connect Telegram
              </button>
            ) : (
              /* Show Code */
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-600 mb-2">Your linking code:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white border border-slate-200 rounded px-3 py-2 text-lg font-mono font-bold text-slate-900">
                      {linkCode.linkCode}
                    </code>
                    <button
                      onClick={handleCopyCode}
                      className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                    >
                      {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                {/* Instructions */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    Send this to @FOMO_a_bot:
                  </p>
                  <code className="block bg-white border border-blue-200 rounded px-3 py-2 text-sm font-mono text-blue-800">
                    /link {linkCode.linkCode}
                  </code>
                  
                  <a
                    href={`https://t.me/FOMO_a_bot`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open @FOMO_a_bot in Telegram
                  </a>
                </div>
                
                {/* Refresh Button */}
                <button
                  onClick={loadStatus}
                  className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh status
                </button>
                
                {/* Expiry Notice */}
                <p className="text-xs text-slate-400">
                  Code expires in 5 minutes
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Disclaimer */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-400">
            Only high-severity structural signals are sent. 
            This is NOT trading advice.
          </p>
        </div>
      </div>
    </div>
  );
}
