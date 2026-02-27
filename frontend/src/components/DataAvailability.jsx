/**
 * DataAvailability Component (Phase 16 - Unified Contract)
 * Unified data availability indicator across all pages
 * 
 * P1.1 FIX: Confidence thresholds removed from lifecycle decisions
 * Confidence is now METADATA only, not lifecycle state
 */
import { Info, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";

/**
 * P1.1 FIX: HARD DEPRECATED - DO NOT USE
 * 
 * @deprecated
 * ⛔ CRITICAL: DO NOT USE FOR UI STATE OR LIFECYCLE DECISIONS
 * 
 * These thresholds violated FRONTEND_CONTRACT and caused infinite "Analyzing"
 * Confidence is METADATA ONLY (badges, tooltips), NOT lifecycle
 * 
 * Use resolution.status instead:
 * - 'pending' | 'analyzing' → show analyzing
 * - 'completed' | 'failed' → show result (even if empty)
 */
export const CONFIDENCE_THRESHOLDS = {
  // ⛔ DO NOT USE - kept only for backwards compat
  UI_DISPLAY: 0.4,
  ACTIONS_ENABLED: 0.6,
};

/**
 * ⛔ DELETED - DO NOT USE
 * This function violated FRONTEND_CONTRACT
 * 
 * @deprecated Use resolution.status directly
 * @throws {Error} Always throws - prevents accidental usage
 */
export function getStatusFromConfidence(confidence) {
  throw new Error(
    '⛔ CONFIDENCE_THRESHOLDS MUST NOT be used for lifecycle or UI gating. ' +
    'Use resolution.status instead. See /app/FRONTEND_CONTRACT.md'
  );
}

/**
 * Data keys for availability tracking
 */
const DATA_KEYS = [
  { key: 'profile', label: 'Profile', description: 'Basic information and metadata' },
  { key: 'market', label: 'Market', description: 'Price, volume, and market metrics' },
  { key: 'signals', label: 'Signals', description: 'Trading signals and alerts' },
  { key: 'trust', label: 'Trust', description: 'Trust and reputation scores' },
  { key: 'transfers', label: 'Transfers', description: 'On-chain transfer history' },
];

/**
 * Get status display config
 */
export function getStatusConfig(status, confidence) {
  // FIXED: Low confidence is NOT indexing - it means "not enough activity"
  // Only use the actual status from backend
  const effectiveStatus = status || 'unknown';
  
  const configs = {
    resolved: {
      label: 'Resolved',
      color: 'bg-emerald-100 text-emerald-700',
      icon: CheckCircle,
      message: 'Data fully available',
    },
    pending: {
      label: 'Pending',
      color: 'bg-amber-100 text-amber-700',
      icon: AlertCircle,
      message: 'Partial data, more coming soon',
    },
    indexing: {
      label: 'Indexing',
      color: 'bg-blue-100 text-blue-700',
      icon: Loader2,
      animate: true,
      message: 'System is collecting data',
    },
    insufficient_data: {
      label: 'Limited Data',
      color: 'bg-gray-100 text-gray-500',
      icon: AlertCircle,
      message: 'Not enough on-chain activity',
    },
    unknown: {
      label: 'Unknown',
      color: 'bg-gray-100 text-gray-400',
      icon: AlertCircle,
      message: 'Status unknown',
    },
  };

  return configs[effectiveStatus] || configs.unknown;
}

/**
 * Data Availability Grid Component
 */
export default function DataAvailability({ 
  available, 
  confidence,
  className = '',
  compact = false,
  showTitle = true,
}) {
  if (!available) return null;

  // Calculate how much data is available
  const availableCount = DATA_KEYS.filter(({ key }) => available[key]).length;
  const totalCount = DATA_KEYS.length;
  const availabilityPct = Math.round((availableCount / totalCount) * 100);

  // FIXED: Low confidence shows a different message, not "Indexing"
  // Low confidence = "not enough activity yet", not "indexing in progress"
  const isLowConfidence = confidence !== null && confidence !== undefined && confidence < 0.4;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-xs text-gray-500">Data:</span>
        <div className="flex gap-1">
          {DATA_KEYS.map(({ key, label }) => (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    available[key] 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {label.charAt(0)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{label}: {available[key] ? 'Available' : 'Not available'}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        {isLowConfidence && (
          <span className="flex items-center gap-1 text-xs text-amber-600">
            Limited activity
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-4 ${className}`}>
      {showTitle && (
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-gray-400" />
          Data Availability
          <span className="ml-auto text-xs font-normal text-gray-500">
            {availableCount}/{totalCount} ({availabilityPct}%)
          </span>
        </h3>
      )}
      
      <div className="flex flex-wrap gap-2">
        {DATA_KEYS.map(({ key, label, description }) => (
          <Tooltip key={key}>
            <TooltipTrigger asChild>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium cursor-help transition-colors ${
                  available[key] 
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                {label}
              </span>
            </TooltipTrigger>
            <TooltipContent className="bg-white text-white max-w-xs">
              <p className="text-xs font-medium mb-1">{label}</p>
              <p className="text-xs text-gray-700">{description}</p>
              <p className="text-xs mt-1">
                Status: {available[key] ? '✓ Available' : '✗ Not available'}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Low confidence notice - NOT "indexing" but "limited activity" */}
      {isLowConfidence && (
        <div className="mt-3 flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span className="text-xs text-amber-700">
            Limited on-chain activity. Analysis may be incomplete.
          </span>
        </div>
      )}

      {/* All data unavailable message */}
      {availableCount === 0 && !isLowConfidence && (
        <p className="mt-3 text-xs text-gray-500">
          This item is new to our system. Data will be indexed shortly.
        </p>
      )}
    </div>
  );
}

/**
 * Inline status badge with confidence-aware display
 */
export function StatusBadge({ status, confidence, className = '' }) {
  const config = getStatusConfig(status, confidence);
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.color} ${className}`}>
      <Icon className={`w-3 h-3 ${config.animate ? 'animate-spin' : ''}`} />
      {config.label}
    </span>
  );
}

/**
 * Resolution Info Panel
 */
export function ResolutionInfo({ 
  type, 
  status, 
  confidence, 
  chain, 
  reason,
  suggestions = [],
  className = '',
}) {
  const config = getStatusConfig(status, confidence);
  // FIXED: Low confidence is NOT indexing - show actual status
  const isLowConfidence = confidence !== null && confidence !== undefined && confidence < 0.4;

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Resolution Details</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Type</span>
          <span className="font-medium text-gray-900 capitalize">{type || 'Unknown'}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-500">Status</span>
          <StatusBadge status={status} confidence={confidence} />
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-500">Confidence</span>
          <span className={`font-medium ${
            confidence >= 0.7 ? 'text-emerald-600' :
            confidence >= 0.4 ? 'text-amber-600' :
            'text-gray-600'
          }`}>
            {confidence !== null && confidence !== undefined 
              ? `${Math.round(confidence * 100)}%` 
              : '—'}
          </span>
        </div>
        
        {chain && (
          <div className="flex justify-between">
            <span className="text-gray-500">Chain</span>
            <span className="font-medium text-gray-900 capitalize">{chain}</span>
          </div>
        )}
      </div>

      {reason && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-1">Reason</div>
          <div className="text-sm text-gray-700">{reason}</div>
        </div>
      )}

      {/* Low confidence auto-message */}
      {isLowConfidence && (
        <div className="mt-3 p-2 bg-blue-50 rounded-lg flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
          <span className="text-xs text-blue-700">
            Low confidence detected. System is actively indexing more data.
          </span>
        </div>
      )}

      {suggestions && suggestions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-2">Suggested Actions</div>
          <div className="space-y-1">
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs text-gray-700 transition-colors"
              >
                {typeof suggestion === 'string' ? suggestion.replace(/_/g, ' ') : suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
