/**
 * Phase 8.4 — Twitter Sync Block (Unified UX)
 * 
 * Same UX as Chrome Extension v1.1:
 * - Status badge (Connected / Action required / Error)
 * - Preflight check before sync
 * - Human-readable errors with actions
 * - No auto-sync, no background retry
 * 
 * CONTRACT: EXTENSION_SYNC_CONTRACT.md v1.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  ExternalLink,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  Twitter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Sync status types (same as Chrome Extension)
const SYNC_STATUS = {
  IDLE: 'IDLE',
  CHECKING: 'CHECKING',
  READY: 'READY',
  SYNCING: 'SYNCING',
  SUCCESS: 'SUCCESS',
  PARTIAL: 'PARTIAL',
  FAILED: 'FAILED',
};

// Error texts (same as Chrome Extension)
const ERROR_TEXTS = {
  NO_COOKIES: {
    title: 'Not logged into Twitter',
    text: 'You are not logged into Twitter.',
    action: 'Open Twitter and log in, then try again.',
    showTwitterBtn: true,
  },
  SESSION_EXPIRED: {
    title: 'Session expired',
    text: 'Your Twitter session has expired.',
    action: 'Log in to Twitter and sync again.',
    showTwitterBtn: true,
  },
  API_KEY_INVALID: {
    title: 'Invalid API key',
    text: 'This API key is invalid or revoked.',
    action: 'Update your API key.',
    showKeyFix: true,
  },
  NETWORK_ERROR: {
    title: 'Connection error',
    text: "We couldn't reach the API.",
    action: 'Check your connection and try again.',
  },
  SERVICE_UNAVAILABLE: {
    title: 'Service unavailable',
    text: 'The service is temporarily unavailable.',
    action: 'Please try again in a moment.',
  },
  PARTIAL: {
    title: 'Partial sync',
    text: 'Some session data could not be synced.',
    action: 'You may need to sync again later.',
  },
  INTERNAL_ERROR: {
    title: 'Something went wrong',
    text: 'An unexpected error occurred.',
    action: 'Please try again.',
  },
};

// Status badge component
function StatusBadge({ status }) {
  const configs = {
    connected: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500', label: 'Connected' },
    'action-required': { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500', label: 'Action required' },
    error: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', label: 'Error' },
    checking: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Checking...' },
  };
  
  const config = configs[status] || configs['action-required'];
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      {config.label}
    </div>
  );
}

// Error card component
function ErrorCard({ errorState, onRetry, onOpenTwitter }) {
  const config = ERROR_TEXTS[errorState] || ERROR_TEXTS.INTERNAL_ERROR;
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-red-900">{config.title}</h4>
          <p className="text-sm text-red-700 mt-1">{config.text}</p>
          <p className="text-sm text-red-600 mt-2">
            <strong>What to do:</strong> {config.action}
          </p>
          <div className="flex gap-2 mt-3">
            {config.showTwitterBtn && (
              <Button
                size="sm"
                variant="outline"
                onClick={onOpenTwitter}
                className="text-xs"
              >
                <Twitter className="w-3 h-3 mr-1" />
                Open Twitter
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Success card component
function SuccessCard({ partial = false }) {
  return (
    <div className={`${partial ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'} border rounded-xl p-4`}>
      <div className="flex items-start gap-3">
        {partial ? (
          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
        )}
        <div>
          <h4 className={`font-semibold ${partial ? 'text-yellow-900' : 'text-green-900'}`}>
            {partial ? 'Session synced (limited)' : 'Session synced successfully'}
          </h4>
          <p className={`text-sm mt-1 ${partial ? 'text-yellow-700' : 'text-green-700'}`}>
            {partial 
              ? 'Your session is connected but may expire soon.'
              : 'Your Twitter account is now connected to FOMO.'
            }
          </p>
        </div>
      </div>
    </div>
  );
}

export default function TwitterSyncBlock({ 
  account,
  apiKey,
  apiUrl,
  onSyncComplete,
  showApiKeyInput = false,
}) {
  // State (same as Chrome Extension)
  const [syncStatus, setSyncStatus] = useState(SYNC_STATUS.IDLE);
  const [errorState, setErrorState] = useState(null);
  const [keyVisible, setKeyVisible] = useState(false);
  const [localApiKey, setLocalApiKey] = useState(apiKey || '');
  
  // Determine badge status
  const getBadgeStatus = () => {
    if (syncStatus === SYNC_STATUS.CHECKING || syncStatus === SYNC_STATUS.SYNCING) {
      return 'checking';
    }
    if (syncStatus === SYNC_STATUS.SUCCESS) {
      return 'connected';
    }
    if (syncStatus === SYNC_STATUS.PARTIAL) {
      return 'action-required';
    }
    if (syncStatus === SYNC_STATUS.FAILED || errorState) {
      return 'error';
    }
    if (account?.sessionStatus === 'OK') {
      return 'connected';
    }
    return 'action-required';
  };
  
  // Preflight check (same logic as Chrome Extension)
  const runPreflightCheck = async () => {
    setSyncStatus(SYNC_STATUS.CHECKING);
    setErrorState(null);
    
    const key = localApiKey || apiKey;
    const url = apiUrl || process.env.REACT_APP_BACKEND_URL;
    
    if (!key) {
      setSyncStatus(SYNC_STATUS.FAILED);
      setErrorState('API_KEY_INVALID');
      return { ok: false };
    }
    
    try {
      const response = await fetch(`${url}/api/v4/twitter/preflight-check/extension`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          cookies: [], // Web UI doesn't have direct cookie access
          accountId: account?.id,
        }),
      });
      
      if (response.status === 401) {
        setSyncStatus(SYNC_STATUS.FAILED);
        setErrorState('API_KEY_INVALID');
        return { ok: false };
      }
      
      const data = await response.json();
      
      // Web flow: we can't check cookies, so we rely on extension
      // For web, if user has extension installed, preflight should pass
      // Otherwise, we guide them to install extension
      
      if (data.ok) {
        setSyncStatus(SYNC_STATUS.READY);
        return data;
      } else {
        setSyncStatus(SYNC_STATUS.FAILED);
        setErrorState(data.state || 'INTERNAL_ERROR');
        return data;
      }
      
    } catch (err) {
      setSyncStatus(SYNC_STATUS.FAILED);
      setErrorState('NETWORK_ERROR');
      return { ok: false };
    }
  };
  
  // Handle sync button click
  const handleSync = async () => {
    if (!account) {
      toast.error('No account selected');
      return;
    }
    
    // For web UI, we instruct user to use extension
    // or show extension install prompt
    toast.info('Please use the Chrome Extension to sync your Twitter session', {
      description: 'The extension securely reads your Twitter cookies.',
      action: {
        label: 'Install Extension',
        onClick: () => window.open('https://chrome.google.com/webstore', '_blank'),
      },
    });
  };
  
  // Handle retry
  const handleRetry = () => {
    setErrorState(null);
    setSyncStatus(SYNC_STATUS.IDLE);
  };
  
  // Handle open Twitter
  const handleOpenTwitter = () => {
    window.open('https://twitter.com', '_blank');
  };
  
  // Copy API key
  const handleCopyKey = () => {
    const key = localApiKey || apiKey;
    if (key) {
      navigator.clipboard.writeText(key);
      toast.success('API key copied');
    }
  };
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6" data-testid="twitter-sync-block">
      {/* Header with status badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Twitter className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Twitter Connection</h3>
            {account && (
              <p className="text-sm text-gray-500">@{account.username}</p>
            )}
          </div>
        </div>
        <StatusBadge status={getBadgeStatus()} />
      </div>
      
      {/* Status message */}
      {syncStatus === SYNC_STATUS.SUCCESS && <SuccessCard />}
      {syncStatus === SYNC_STATUS.PARTIAL && <SuccessCard partial />}
      {errorState && (
        <ErrorCard 
          errorState={errorState} 
          onRetry={handleRetry}
          onOpenTwitter={handleOpenTwitter}
        />
      )}
      
      {/* API Key input (if enabled) */}
      {showApiKeyInput && (
        <div className="mt-4 space-y-2">
          <label className="text-sm font-medium text-gray-700">API Key</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={keyVisible ? 'text' : 'password'}
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="pr-20"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <button
                  onClick={() => setKeyVisible(!keyVisible)}
                  className="p-1.5 hover:bg-gray-100 rounded"
                >
                  {keyVisible ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                </button>
                <button
                  onClick={handleCopyKey}
                  className="p-1.5 hover:bg-gray-100 rounded"
                >
                  <Copy className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Find your API key in Settings → API Keys
          </p>
        </div>
      )}
      
      {/* Action button */}
      <div className="mt-4 flex gap-2">
        <Button
          onClick={handleSync}
          disabled={syncStatus === SYNC_STATUS.SYNCING || syncStatus === SYNC_STATUS.CHECKING}
          className="flex-1"
          data-testid="sync-btn"
        >
          {syncStatus === SYNC_STATUS.SYNCING || syncStatus === SYNC_STATUS.CHECKING ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {syncStatus === SYNC_STATUS.CHECKING ? 'Checking...' : 'Syncing...'}
            </>
          ) : syncStatus === SYNC_STATUS.SUCCESS ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Synced
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync Twitter Session
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => window.open('https://twitter.com', '_blank')}
          title="Open Twitter"
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Privacy note */}
      <p className="mt-4 text-xs text-gray-500 text-center">
        🔒 We never store your password or private messages.
      </p>
    </div>
  );
}
