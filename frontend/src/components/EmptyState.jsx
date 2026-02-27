/**
 * Empty State Component (Phase 15.5.2 - Step 3)
 * Honest, informative empty states instead of mocks
 */
import { AlertCircle, Clock, Search, Loader2, ExternalLink } from 'lucide-react';

const EMPTY_STATE_TYPES = {
  pending: {
    icon: Clock,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
  },
  indexing: {
    icon: Loader2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    animate: true,
  },
  no_data: {
    icon: AlertCircle,
    color: 'text-gray-400',
    bgColor: 'bg-gray-50',
  },
  search: {
    icon: Search,
    color: 'text-gray-400',
    bgColor: 'bg-gray-50',
  },
};

export default function EmptyState({
  type = 'no_data',
  title,
  description,
  suggestions = [],
  action,
  className = '',
}) {
  const config = EMPTY_STATE_TYPES[type] || EMPTY_STATE_TYPES.no_data;
  const Icon = config.icon;

  // Default titles and descriptions based on type
  const defaultContent = {
    pending: {
      title: 'Address detected',
      description: 'System has started analysis. Data will be available shortly.',
    },
    indexing: {
      title: 'Indexing in progress',
      description: 'New data is being processed. Check back in a few minutes.',
    },
    no_data: {
      title: 'No data available',
      description: 'This item has no recorded activity in our database yet.',
    },
    search: {
      title: 'Search to explore',
      description: 'Enter an address, ENS name, or token symbol to get started.',
    },
  };

  const displayTitle = title || defaultContent[type]?.title || 'No data';
  const displayDescription = description || defaultContent[type]?.description || '';

  return (
    <div className={`flex flex-col items-center justify-center p-8 rounded-xl ${config.bgColor} ${className}`}>
      <div className={`p-4 rounded-full ${config.bgColor} mb-4`}>
        <Icon className={`w-8 h-8 ${config.color} ${config.animate ? 'animate-spin' : ''}`} />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
        {displayTitle}
      </h3>
      
      <p className="text-sm text-gray-600 text-center max-w-md mb-4">
        {displayDescription}
      </p>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {suggestions.map((suggestion, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-600"
            >
              {suggestion}
            </span>
          ))}
        </div>
      )}

      {/* Action button */}
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-2 px-4 py-2 bg-white text-white rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          {action.icon && <action.icon className="w-4 h-4" />}
          {action.label}
        </button>
      )}
    </div>
  );
}

/**
 * Inline empty state for smaller areas
 */
export function EmptyStateInline({
  type = 'no_data',
  message,
  className = '',
}) {
  const config = EMPTY_STATE_TYPES[type] || EMPTY_STATE_TYPES.no_data;
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg ${config.bgColor} ${className}`}>
      <Icon className={`w-4 h-4 ${config.color} ${config.animate ? 'animate-spin' : ''}`} />
      <span className="text-sm text-gray-600">{message || 'No data available'}</span>
    </div>
  );
}

/**
 * Progress indicator for async operations
 */
export function DataProgress({
  status = 'pending', // 'pending' | 'indexing' | 'ready' | 'error'
  message,
  eta,
  className = '',
}) {
  const statusConfig = {
    pending: { color: 'bg-amber-500', label: 'Pending' },
    indexing: { color: 'bg-blue-500', label: 'Indexing' },
    ready: { color: 'bg-emerald-500', label: 'Ready' },
    error: { color: 'bg-red-500', label: 'Error' },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <div className={`flex items-center gap-3 p-3 bg-gray-50 rounded-lg ${className}`}>
      <div className={`w-2 h-2 rounded-full ${config.color} ${status === 'indexing' ? 'animate-pulse' : ''}`} />
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-900">{config.label}</div>
        {message && <div className="text-xs text-gray-500">{message}</div>}
      </div>
      {eta && <div className="text-xs text-gray-400">~{eta}</div>}
    </div>
  );
}
