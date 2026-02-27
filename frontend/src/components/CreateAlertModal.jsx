/**
 * CreateAlertModal - Insight-First Alert Creation (A1 Contract)
 * 
 * CONTRACT:
 * - Alert = Answer to 3 questions: What/Why/When
 * - No technical thresholds (netFlow, txCount)
 * - Only product language (Sensitivity: Low/Medium/High)
 * - Notification Preview before submit
 * 
 * Structure:
 * 1. [Insight] - What behavior am I watching?
 * 2. [Why it matters] - Why should I care?
 * 3. [Sensitivity] - When should I be notified?
 * 4. [Notification Preview] - What will I receive?
 */
import { useState, useEffect, useMemo } from 'react';
import { X, Bell, Loader2, Check, AlertCircle, ChevronDown, Clock, Eye, MessageSquare } from 'lucide-react';
import { alertsApi } from '../api';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

// Token signal types with PRODUCT LANGUAGE (not technical)
const ALERT_INSIGHTS = [
  { 
    id: 'accumulation', 
    label: 'Consistent Buying Detected', 
    whyMatters: 'Large wallets are accumulating this token over time — this often precedes price expansion.',
    emoji: '📥',
    previewTitle: 'Consistent Buying Observed',
    previewBody: 'Large wallets accumulated funds over the last few hours. This behavior often signals long-term positioning.',
  },
  { 
    id: 'distribution', 
    label: 'Increasing Selling Detected', 
    whyMatters: 'Holders are distributing tokens to the market — can indicate profit-taking or risk reduction.',
    emoji: '📤',
    previewTitle: 'Increasing Selling Observed',
    previewBody: 'Holders distributed tokens over the last few hours. This pattern may indicate profit-taking.',
  },
  { 
    id: 'large_move', 
    label: 'Unusual Large Transfer', 
    whyMatters: 'Significant token movement detected — may signal whale activity or exchange flows.',
    emoji: '💰',
    previewTitle: 'Unusual Large Transfer Detected',
    previewBody: 'A significant transfer was detected. This may indicate whale movement or institutional activity.',
  },
  { 
    id: 'smart_money_entry', 
    label: 'Smart Money Entry', 
    whyMatters: 'Historically profitable wallets are entering — early positioning signal.',
    emoji: '🐋',
    previewTitle: 'Smart Money Entry Detected',
    previewBody: 'Historically profitable wallets started accumulating. This is often an early positioning signal.',
  },
  { 
    id: 'smart_money_exit', 
    label: 'Smart Money Exit', 
    whyMatters: 'Historically profitable wallets are exiting — potential profit-taking or risk reduction.',
    emoji: '🏃',
    previewTitle: 'Smart Money Exit Detected',
    previewBody: 'Historically profitable wallets are reducing positions. This may indicate profit-taking.',
  },
  { 
    id: 'activity_spike', 
    label: 'Activity Spike', 
    whyMatters: 'Sudden surge in activity — could signal news, listings, or coordinated action.',
    emoji: '⚡',
    previewTitle: 'Activity Spike Detected',
    previewBody: 'Unusual surge in activity detected. This often precedes significant price movement.',
  },
];

// Sensitivity levels - PRODUCT LANGUAGE (user chooses importance, not math)
// A5.4: Sensitivity = frequency expectation, NOT strength
const SENSITIVITY_LEVELS = [
  { 
    id: 'high', 
    label: 'High',
    description: 'Get notified about any unusual activity',
    frequency: 'May trigger multiple times per day',
    window: '1h',
    color: 'purple',
  },
  { 
    id: 'medium', 
    label: 'Medium',
    description: 'Get notified about notable activity only',
    frequency: 'A few times per week',
    window: '6h',
    color: 'blue',
  },
  { 
    id: 'low', 
    label: 'Low',
    description: 'Get notified about major movements only',
    frequency: 'Rarely, only significant events',
    window: '24h',
    color: 'green',
  },
];

// Time window options for advanced parameters
const TIME_WINDOWS = [
  { id: '1h', label: '1 hour' },
  { id: '6h', label: '6 hours' },
  { id: '24h', label: '24 hours' },
  { id: '7d', label: '7 days' },
];

// Direction filters
const DIRECTION_FILTERS = [
  { id: 'both', label: 'Any direction', description: 'Both inflow and outflow' },
  { id: 'inflow', label: 'Inflow only', description: 'Only accumulation/buying' },
  { id: 'outflow', label: 'Outflow only', description: 'Only distribution/selling' },
];

/**
 * AdvancedAlertParameters - Granular control for power users
 * 
 * CONTRACT:
 * - Hidden by default (collapsed)
 * - Only for users who want fine-grained control
 * - Sensitivity selector remains the PRIMARY control
 * - These are OVERRIDES, not replacements
 */
function AdvancedAlertParameters({ sensitivity, onSensitivityChange }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [customWindow, setCustomWindow] = useState('6h');
  const [directionFilter, setDirectionFilter] = useState('both');
  const [minTransferUsd, setMinTransferUsd] = useState('');
  const [cooldownPeriod, setCooldownPeriod] = useState('1h');
  
  // Initialize customWindow based on sensitivity
  const sensitivityConfig = SENSITIVITY_LEVELS.find(s => s.id === sensitivity);
  const defaultWindow = sensitivityConfig?.window || '6h';
  
  // Only update if different (avoids infinite loop)
  if (customWindow !== defaultWindow && !isExpanded) {
    setCustomWindow(defaultWindow);
  }
  
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        data-testid="toggle-advanced-params"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">Advanced Parameters</span>
          <span className="text-xs text-gray-400">(optional)</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-4 border-t border-gray-200 bg-white">
          {/* Time Window */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">
              Analysis Window
            </label>
            <div className="flex flex-wrap gap-2">
              {TIME_WINDOWS.map((tw) => (
                <button
                  key={tw.id}
                  onClick={() => setCustomWindow(tw.id)}
                  data-testid={`window-${tw.id}`}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                    customWindow === tw.id
                      ? 'border-purple-500 bg-purple-50 text-purple-700 font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {tw.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Period for baseline comparison
            </p>
          </div>
          
          {/* Direction Filter */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">
              Flow Direction
            </label>
            <div className="space-y-1.5">
              {DIRECTION_FILTERS.map((df) => (
                <button
                  key={df.id}
                  onClick={() => setDirectionFilter(df.id)}
                  data-testid={`direction-${df.id}`}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all text-left ${
                    directionFilter === df.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div>
                    <div className={`text-sm font-medium ${
                      directionFilter === df.id ? 'text-purple-700' : 'text-gray-700'
                    }`}>
                      {df.label}
                    </div>
                    <div className="text-xs text-gray-500">{df.description}</div>
                  </div>
                  {directionFilter === df.id && (
                    <Check className="w-4 h-4 text-purple-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* Minimum Transfer Size */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">
              Minimum Transfer Size (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                value={minTransferUsd}
                onChange={(e) => setMinTransferUsd(e.target.value)}
                placeholder="No minimum"
                data-testid="min-transfer-input"
                className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Ignore transfers below this amount
            </p>
          </div>
          
          {/* Cooldown Period */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">
              Notification Cooldown
            </label>
            <select
              value={cooldownPeriod}
              onChange={(e) => setCooldownPeriod(e.target.value)}
              data-testid="cooldown-select"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="15m">15 minutes</option>
              <option value="1h">1 hour</option>
              <option value="6h">6 hours</option>
              <option value="24h">24 hours</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Minimum time between alerts of same type
            </p>
          </div>
          
          {/* Info note */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                <strong>Note:</strong> These settings override the Sensitivity preset above. 
                For most users, the preset is sufficient.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateAlertModal({ 
  isOpen, 
  onClose, 
  tokenAddress, 
  tokenSymbol,
  tokenName,
  chain = 'Ethereum',
  onSuccess,
  editMode = false,
  existingRule = null,
}) {
  // Selected insight (what behavior)
  const [selectedInsight, setSelectedInsight] = useState(
    editMode && existingRule?.triggerTypes?.[0] 
      ? existingRule.triggerTypes[0] 
      : 'accumulation'
  );
  
  // Sensitivity level (when to notify)
  const [sensitivity, setSensitivity] = useState(
    editMode && existingRule?.trigger?.sensitivity
      ? existingRule.trigger.sensitivity
      : 'medium'
  );
  
  // Notification channels
  const [telegramEnabled, setTelegramEnabled] = useState(
    editMode ? existingRule?.channels?.telegram ?? true : true
  );
  const [uiEnabled, setUiEnabled] = useState(
    editMode ? existingRule?.channels?.inApp ?? true : true
  );
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramLink, setTelegramLink] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [checkingTelegram, setCheckingTelegram] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  // Get current insight config
  const currentInsight = useMemo(() => 
    ALERT_INSIGHTS.find(i => i.id === selectedInsight) || ALERT_INSIGHTS[0],
    [selectedInsight]
  );

  // Get current sensitivity config
  const currentSensitivity = useMemo(() => 
    SENSITIVITY_LEVELS.find(s => s.id === sensitivity) || SENSITIVITY_LEVELS[1],
    [sensitivity]
  );

  // Check Telegram connection on mount
  useEffect(() => {
    if (isOpen) {
      checkTelegramStatus();
      if (!editMode) {
        setSuccess(false);
        setError(null);
      }
    }
  }, [isOpen, editMode]);

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

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // A5.4: Map sensitivity to backend parameters
      const sensitivityConfig = SENSITIVITY_LEVELS.find(s => s.id === sensitivity);
      
      // Map sensitivity to minSeverity threshold
      const minSeverityMap = { high: 30, medium: 50, low: 70 };
      const throttleMap = { high: '1h', medium: '6h', low: '24h' };
      
      const payload = {
        scope: 'token',
        targetId: tokenAddress,
        triggerTypes: [selectedInsight],
        trigger: {
          type: selectedInsight,
          sensitivity: sensitivity,
          window: sensitivityConfig?.window || '6h',
        },
        channels: {
          inApp: uiEnabled,
          telegram: telegramEnabled && telegramConnected,
        },
        minSeverity: minSeverityMap[sensitivity] || 50,
        minConfidence: 0.6,
        throttle: throttleMap[sensitivity] || '6h',
        sensitivity: sensitivity,  // A5.4: Store sensitivity level
        name: `${tokenSymbol || tokenName || 'Token'} ${currentInsight.label}`,
        targetMeta: {
          symbol: tokenSymbol,
          name: tokenName,
          chain: chain,
        },
      };

      let response;
      if (editMode && existingRule?._id) {
        response = await alertsApi.updateAlertRule(existingRule._id, payload);
      } else {
        response = await alertsApi.createAlertRule(payload);
      }

      if (response?.ok) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1500);
      } else {
        setError(response?.error || `Failed to ${editMode ? 'update' : 'create'} alert`);
      }
    } catch (err) {
      console.error(`Failed to ${editMode ? 'update' : 'create'} alert:`, err);
      setError(`Failed to ${editMode ? 'update' : 'create'} alert`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <TooltipProvider>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-white/80 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-xl">
                  <Bell className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {editMode ? 'Edit Monitoring' : 'Monitor Behavior'}
                  </h2>
                  <p className="text-xs text-gray-500">Get notified when specific activity occurs</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                data-testid="close-modal-btn"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Target Token */}
            <div className="bg-white border border-gray-200 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-lg font-bold text-gray-900">
                    {tokenSymbol || tokenName || 'Token'}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">{chain}</span>
                </div>
                {editMode && (
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded">
                    Target locked
                  </span>
                )}
              </div>
              <div className="text-xs font-mono text-gray-400 mt-1">
                {tokenAddress?.slice(0, 12)}...{tokenAddress?.slice(-8)}
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="p-4 space-y-5 overflow-y-auto flex-1">
            {/* Success State */}
            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Monitoring Active
                </h3>
                <p className="text-sm text-gray-500">
                  You will be notified when this behavior is observed
                </p>
              </div>
            ) : (
              <>
                {/* SECTION 1: What behavior am I watching? */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <label className="text-sm font-semibold text-gray-700">
                      What behavior do you want to monitor?
                    </label>
                  </div>
                  <div className="space-y-2">
                    {ALERT_INSIGHTS.map((insight) => (
                      <button
                        key={insight.id}
                        onClick={() => setSelectedInsight(insight.id)}
                        data-testid={`insight-${insight.id}`}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          selectedInsight === insight.id
                            ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{insight.emoji}</span>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-gray-900 mb-1">
                              {insight.label}
                            </div>
                            <div className="text-xs text-gray-500 leading-relaxed">
                              {insight.whyMatters}
                            </div>
                          </div>
                          {selectedInsight === insight.id && (
                            <Check className="w-5 h-5 text-purple-600 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* SECTION 2: Sensitivity (When should I be notified?) */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <label className="text-sm font-semibold text-gray-700">
                      How sensitive should alerts be?
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {SENSITIVITY_LEVELS.map((level) => (
                      <button
                        key={level.id}
                        onClick={() => setSensitivity(level.id)}
                        data-testid={`sensitivity-${level.id}`}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          sensitivity === level.id
                            ? `border-${level.color}-500 bg-${level.color}-50 ring-1 ring-${level.color}-500`
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className={`text-sm font-semibold mb-0.5 ${
                          sensitivity === level.id ? `text-${level.color}-700` : 'text-gray-900'
                        }`}>
                          {level.label}
                        </div>
                        <div className="text-xs text-gray-500 leading-relaxed">{level.description}</div>
                      </button>
                    ))}
                  </div>
                  
                  {/* A5.4: Expected frequency indicator */}
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-600">
                      <strong>Expected frequency:</strong> {currentSensitivity.frequency}
                    </span>
                  </div>
                </div>

                {/* SECTION 3: Notification Channels */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <label className="text-sm font-semibold text-gray-700">
                      How do you want to be notified?
                    </label>
                  </div>
                  <div className="space-y-2">
                    {/* In-App */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-gray-600" />
                        <div>
                          <div className="text-sm font-medium text-gray-700">In-App</div>
                          <div className="text-xs text-gray-500">Notifications in this dashboard</div>
                        </div>
                      </div>
                      <button
                        onClick={() => setUiEnabled(!uiEnabled)}
                        className={`w-11 h-6 rounded-full transition-colors ${
                          uiEnabled ? 'bg-purple-600' : 'bg-gray-300'
                        }`}
                        data-testid="toggle-inapp-btn"
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          uiEnabled ? 'translate-x-5' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>

                    {/* Telegram */}
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-[#0088cc]" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                          </svg>
                          <div>
                            <div className="text-sm font-medium text-gray-700">Telegram</div>
                            <div className="text-xs text-gray-500">Instant mobile alerts</div>
                          </div>
                        </div>
                        {checkingTelegram ? (
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        ) : telegramConnected ? (
                          <button
                            onClick={() => setTelegramEnabled(!telegramEnabled)}
                            className={`w-11 h-6 rounded-full transition-colors ${
                              telegramEnabled ? 'bg-[#0088cc]' : 'bg-gray-300'
                            }`}
                            data-testid="toggle-telegram-btn"
                          >
                            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                              telegramEnabled ? 'translate-x-5' : 'translate-x-0.5'
                            }`} />
                          </button>
                        ) : (
                          <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded">
                            Not connected
                          </span>
                        )}
                      </div>
                      
                      {/* Connect Telegram CTA */}
                      {!checkingTelegram && !telegramConnected && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          {telegramLink ? (
                            <div className="text-xs">
                              <p className="text-gray-500 mb-1">Click to connect:</p>
                              <a
                                href={telegramLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#0088cc] hover:underline break-all"
                              >
                                {telegramLink}
                              </a>
                            </div>
                          ) : (
                            <button
                              onClick={generateTelegramLink}
                              className="text-sm text-[#0088cc] hover:underline font-medium"
                              data-testid="connect-telegram-btn"
                            >
                              Connect Telegram →
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* SECTION 4: Notification Preview - CRITICAL FOR TRUST */}
                <div>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
                    data-testid="toggle-preview-btn"
                  >
                    <Eye className="w-4 h-4" />
                    {showPreview ? 'Hide' : 'Preview'} notification example
                    <ChevronDown className={`w-4 h-4 transition-transform ${showPreview ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showPreview && (
                    <div className="mt-3 p-4 bg-white rounded-xl text-white">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-purple-500 rounded-lg flex-shrink-0">
                          <Bell className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold mb-1">
                            🔔 {currentInsight.previewTitle} — {tokenSymbol || 'TOKEN'}
                          </div>
                          <p className="text-xs text-gray-700 leading-relaxed mb-3">
                            {currentInsight.previewBody}
                          </p>
                          <div className="text-xs text-gray-400 mb-3">
                            Last observed: 2 minutes ago
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-blue-400 cursor-pointer hover:underline">
                              👉 View details
                            </span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-400 cursor-pointer hover:text-gray-700">
                              👉 Pause monitoring
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION 5: Advanced Parameters (Collapsible) */}
                <AdvancedAlertParameters 
                  sensitivity={sensitivity}
                  onSensitivityChange={setSensitivity}
                />

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {!success && (
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <button
                onClick={handleSubmit}
                disabled={loading || (!uiEnabled && !(telegramEnabled && telegramConnected))}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                data-testid="submit-alert-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {editMode ? 'Saving...' : 'Starting...'}
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    {editMode ? 'Save Changes' : 'Start Monitoring'}
                  </>
                )}
              </button>
              
              {!uiEnabled && !(telegramEnabled && telegramConnected) && (
                <p className="text-xs text-center text-red-500 mt-2">
                  Enable at least one notification channel
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
