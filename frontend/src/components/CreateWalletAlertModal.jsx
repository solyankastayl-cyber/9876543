/**
 * CreateWalletAlertModal - Wallet Alert Creation
 * 
 * COPIED FROM CreateAlertModal - same flow:
 * 1. Creates WatchlistItem(type='wallet') if not exists
 * 2. Creates AlertRule for that watchlist item
 * 
 * Wallet-specific triggers:
 * - Large inflow/outflow
 * - Token interaction
 * - Smart money behavior
 */
import { useState, useEffect, useMemo } from 'react';
import { X, Bell, Loader2, Check, AlertCircle, ChevronDown, Settings2, Clock } from 'lucide-react';
import { alertsApi } from '../api';
import { addToWatchlist, getWatchlist } from '../api/watchlist.api';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

// Wallet signal types - IDs must match backend AlertTriggerType enum
// Valid backend types: accumulation, distribution, large_move, smart_money_entry, 
// smart_money_exit, net_flow_spike, activity_spike
const WALLET_TRIGGERS = [
  { 
    id: 'accumulation', 
    label: 'Large Inflow', 
    description: 'Wallet receives significant funds — may indicate preparation for activity',
    emoji: '📥',
    hasThreshold: true,
    hasWindow: true,
    defaultDirection: 'in',
  },
  { 
    id: 'distribution', 
    label: 'Large Outflow', 
    description: 'Wallet sends significant funds — may indicate profit-taking or distribution',
    emoji: '📤',
    hasThreshold: true,
    hasWindow: true,
    defaultDirection: 'out',
  },
  { 
    id: 'smart_money_entry', 
    label: 'Smart Money Entry', 
    description: 'Wallet shows behavior similar to profitable traders — early positioning signal',
    emoji: '🐋',
    hasThreshold: false,
    hasWindow: true,
  },
  { 
    id: 'activity_spike', 
    label: 'Activity Spike', 
    description: 'Unusual increase in wallet activity — may signal accumulation or distribution',
    emoji: '📊',
    hasThreshold: true,
    hasWindow: true,
  },
  { 
    id: 'large_move', 
    label: 'Large Movement', 
    description: 'Significant value transferred by this wallet — track major transactions',
    emoji: '💰',
    hasThreshold: true,
    hasWindow: false,
  },
];

// Time window options
const WINDOW_OPTIONS = [
  { value: '1h', label: '1 hour' },
  { value: '6h', label: '6 hours' },
  { value: '24h', label: '24 hours' },
];

// Format number with commas
function formatNumber(num) {
  if (!num) return '';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Parse formatted number
function parseFormattedNumber(str) {
  if (!str) return null;
  const num = parseFloat(str.replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

export default function CreateWalletAlertModal({ 
  isOpen, 
  onClose, 
  walletAddress, 
  walletLabel,
  chain = 'Ethereum',
  confidence,
  onSuccess,
}) {
  // Selected trigger type
  const [selectedTrigger, setSelectedTrigger] = useState('accumulation');
  
  // Advanced conditions
  const [threshold, setThreshold] = useState('');
  const [direction, setDirection] = useState('in');
  const [window, setWindow] = useState('6h');
  
  // Show advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Notification channels
  const [telegramEnabled, setTelegramEnabled] = useState(true);
  const [uiEnabled, setUiEnabled] = useState(true);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramLink, setTelegramLink] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [checkingTelegram, setCheckingTelegram] = useState(true);

  // Get current trigger config
  const currentTrigger = useMemo(() => 
    WALLET_TRIGGERS.find(t => t.id === selectedTrigger) || WALLET_TRIGGERS[0],
    [selectedTrigger]
  );

  // Update direction when trigger changes
  useEffect(() => {
    if (currentTrigger.defaultDirection) {
      setDirection(currentTrigger.defaultDirection);
    }
  }, [currentTrigger]);

  // Check Telegram connection on mount
  useEffect(() => {
    if (isOpen) {
      checkTelegramStatus();
      setSuccess(false);
      setError(null);
    }
  }, [isOpen]);

  const checkTelegramStatus = async () => {
    setCheckingTelegram(true);
    try {
      const response = await alertsApi.getTelegramConnection();
      setTelegramConnected(response?.connected || false);
    } catch (err) {
      console.error('Failed to check Telegram status:', err);
    } finally {
      setCheckingTelegram(false);
    }
  };
  
  const generateTelegramLink = async () => {
    try {
      const response = await alertsApi.connectTelegram();
      if (response?.ok && response?.link) {
        setTelegramLink(response.link);
      }
    } catch (err) {
      console.error('Failed to generate Telegram link:', err);
    }
  };

  // Build summary for preview
  const buildSummary = () => {
    const parts = [];
    parts.push(`Alert when ${currentTrigger.label.toLowerCase()}`);
    
    if (currentTrigger.hasThreshold && threshold) {
      parts.push(`≥ $${formatNumber(parseFormattedNumber(threshold))}`);
    }
    
    if (currentTrigger.hasWindow) {
      const windowLabel = WINDOW_OPTIONS.find(w => w.value === window)?.label || window;
      parts.push(`within ${windowLabel}`);
    }
    
    return parts.join(' ');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // STEP 1: Create or get WatchlistItem for this wallet
      let watchlistItemId = null;
      
      try {
        // Check if already in watchlist
        const watchlistResponse = await getWatchlist('wallet');
        if (watchlistResponse?.ok && watchlistResponse.data) {
          const existing = watchlistResponse.data.find(
            item => item.target?.address?.toLowerCase() === walletAddress.toLowerCase()
          );
          if (existing) {
            watchlistItemId = existing.id;
          }
        }
        
        // If not in watchlist, add it
        if (!watchlistItemId) {
          const addResponse = await addToWatchlist({
            type: 'wallet',
            target: {
              address: walletAddress,
              chain,
              label: walletLabel,
            },
          });
          
          if (addResponse?.ok && addResponse.data) {
            watchlistItemId = addResponse.data.id;
          }
        }
      } catch (e) {
        console.error('Failed to create watchlist item:', e);
        // Continue anyway - alert might still work
      }

      // STEP 2: Create AlertRule using correct API
      const triggerConfig = {
        type: selectedTrigger,
      };
      
      // Add threshold if provided
      const thresholdValue = parseFormattedNumber(threshold);
      if (thresholdValue && currentTrigger.hasThreshold) {
        triggerConfig.threshold = thresholdValue;
      }
      
      // Add direction
      if (currentTrigger.defaultDirection) {
        triggerConfig.direction = currentTrigger.defaultDirection;
      }
      
      // Add window
      if (currentTrigger.hasWindow) {
        triggerConfig.window = window;
      }

      const rulePayload = {
        scope: 'wallet',
        targetId: walletAddress,
        triggerTypes: [selectedTrigger],
        trigger: triggerConfig,
        channels: {
          inApp: uiEnabled,
          telegram: telegramEnabled && telegramConnected,
        },
        minSeverity: 50,
        minConfidence: 0.6,
        throttle: window || '6h',
        name: `${walletLabel || walletAddress?.slice(0, 10) || 'Wallet'} ${currentTrigger.label} Alert`,
        targetMeta: {
          label: walletLabel,
          address: walletAddress,
          chain: chain,
        },
        watchlistItemId,
      };

      const response = await alertsApi.createAlertRule(rulePayload);
      
      if (response?.ok) {
        setSuccess(true);
        onSuccess?.(response.data);
        
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 1500);
      } else {
        setError(response?.error || 'Failed to create alert');
      }
    } catch (err) {
      console.error('Failed to create alert:', err);
      setError('Failed to create alert. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Bell className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Create Wallet Alert</h3>
              <p className="text-xs text-gray-500 font-mono">{walletAddress?.slice(0, 10)}...{walletAddress?.slice(-6)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Success State */}
          {success && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-lg font-medium text-gray-900">Alert Created!</p>
              <p className="text-sm text-gray-500 mt-1">You'll be notified when conditions are met</p>
            </div>
          )}

          {!success && (
            <>
              {/* Trigger Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alert me when...
                </label>
                <div className="space-y-2">
                  {WALLET_TRIGGERS.map((trigger) => (
                    <button
                      key={trigger.id}
                      onClick={() => setSelectedTrigger(trigger.id)}
                      className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                        selectedTrigger === trigger.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{trigger.emoji}</span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{trigger.label}</div>
                          <div className="text-xs text-gray-500">{trigger.description}</div>
                        </div>
                        {selectedTrigger === trigger.id && (
                          <Check className="w-5 h-5 text-purple-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Options */}
              {(currentTrigger.hasThreshold || currentTrigger.hasWindow) && (
                <div>
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <Settings2 className="w-4 h-4" />
                    Advanced conditions
                    <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showAdvanced && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-xl space-y-3">
                      {/* Threshold */}
                      {currentTrigger.hasThreshold && (
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Minimum value (USD)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                            <input
                              type="text"
                              value={threshold}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/[^0-9]/g, '');
                                setThreshold(raw ? formatNumber(parseInt(raw)) : '');
                              }}
                              placeholder="10,000"
                              className="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Time Window */}
                      {currentTrigger.hasWindow && (
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Time window</label>
                          <div className="flex gap-2">
                            {WINDOW_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => setWindow(opt.value)}
                                className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                                  window === opt.value
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Notification Channels */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notify me via
                </label>
                <div className="space-y-2">
                  {/* Telegram */}
                  <div 
                    className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                      telegramEnabled ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📱</span>
                      <div>
                        <div className="font-medium text-gray-900">Telegram</div>
                        {checkingTelegram ? (
                          <div className="text-xs text-gray-500">Checking connection...</div>
                        ) : telegramConnected ? (
                          <div className="text-xs text-green-600">Connected</div>
                        ) : telegramLink ? (
                          <a 
                            href={telegramLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Click to connect
                          </a>
                        ) : (
                          <button
                            onClick={generateTelegramLink}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Connect Telegram →
                          </button>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setTelegramEnabled(!telegramEnabled)}
                      className={`w-10 h-6 rounded-full transition-colors ${
                        telegramEnabled ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                      data-testid="wallet-alert-telegram-toggle"
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        telegramEnabled ? 'translate-x-5' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  {/* In-App */}
                  <div 
                    className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                      uiEnabled ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🔔</span>
                      <div>
                        <div className="font-medium text-gray-900">In-App</div>
                        <div className="text-xs text-gray-500">Dashboard notifications</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setUiEnabled(!uiEnabled)}
                      className={`w-10 h-6 rounded-full transition-colors ${
                        uiEnabled ? 'bg-purple-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        uiEnabled ? 'translate-x-5' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Summary Preview */}
              <div className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{buildSummary()}</span>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="flex justify-end gap-2 p-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || (!telegramEnabled && !uiEnabled)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
              Create Alert
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
