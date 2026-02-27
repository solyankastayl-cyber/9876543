/**
 * Universal Search Component (Phase 15.5.2 - Maturity Update)
 * Resolves any input with context: confidence, reason, suggestions
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, X, Loader2, User, Coins, Building, FileText, 
  HelpCircle, ArrowRight, AlertCircle, Clock, ExternalLink,
  Scan, Eye, Timer
} from 'lucide-react';
import { resolverApi } from '../api';

const TYPE_CONFIG = {
  actor: {
    icon: User,
    label: 'Actor',
    color: 'text-blue-600 bg-blue-50',
    route: (id) => `/actors/${id}`,
  },
  token: {
    icon: Coins,
    label: 'Token',
    color: 'text-emerald-600 bg-emerald-50',
    route: (id) => `/tokens/${id}`,
  },
  entity: {
    icon: Building,
    label: 'Entity',
    color: 'text-purple-600 bg-purple-50',
    route: (id) => `/entity/${id}`,
  },
  tx: {
    icon: FileText,
    label: 'Transaction',
    color: 'text-amber-600 bg-amber-50',
    route: (id) => `/tx/${id}`,
  },
  ens: {
    icon: User,
    label: 'ENS Name',
    color: 'text-indigo-600 bg-indigo-50',
    route: () => null, // ENS needs resolution first
  },
  unknown: {
    icon: HelpCircle,
    label: 'Unknown',
    color: 'text-gray-500 bg-gray-50',
    route: () => null,
  },
};

const STATUS_CONFIG = {
  resolved: { label: 'Resolved', color: 'text-emerald-600 bg-emerald-50', icon: null },
  pending: { label: 'Pending', color: 'text-amber-600 bg-amber-50', icon: Clock },
  indexing: { label: 'Indexing', color: 'text-blue-600 bg-blue-50', icon: Loader2 },
  insufficient_data: { label: 'No Data', color: 'text-gray-500 bg-gray-50', icon: AlertCircle },
};

const SUGGESTION_ICONS = {
  scan_address: Scan,
  view_as_raw_wallet: Eye,
  wait_for_indexing: Timer,
  connect_ens_provider: User,
  check_token_contract: Coins,
  view_on_etherscan: ExternalLink,
};

const SUGGESTION_LABELS = {
  scan_address: 'Scan Address',
  view_as_raw_wallet: 'View as Wallet',
  wait_for_indexing: 'Wait for Indexing',
  connect_ens_provider: 'Connect ENS',
  check_token_contract: 'Check Contract',
  view_on_etherscan: 'View on Etherscan',
};

export default function UniversalSearch({ 
  onClose, 
  className = '',
  placeholder = 'Search address, ENS, symbol, tx...',
  autoFocus = true,
}) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim() || query.trim().length < 2) {
      setResult(null);
      setError(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await resolverApi.resolve(query.trim());
        
        if (response.ok) {
          setResult(response.data);
        } else {
          setError(response.error || 'Failed to resolve');
        }
      } catch (err) {
        setError('Search failed');
        console.error('Resolver error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const handleNavigate = () => {
    if (!result) return;
    
    const config = TYPE_CONFIG[result.type] || TYPE_CONFIG.unknown;
    const route = config.route(result.normalizedId);
    
    if (route) {
      navigate(route);
      onClose?.();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    if (suggestion === 'view_on_etherscan' && result?.normalizedId) {
      // Open Etherscan in new tab
      const url = result.type === 'tx' 
        ? `https://etherscan.io/tx/${result.normalizedId}`
        : `https://etherscan.io/address/${result.normalizedId}`;
      window.open(url, '_blank');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && result && result.status === 'resolved') {
      handleNavigate();
    } else if (e.key === 'Escape') {
      onClose?.();
    }
  };

  const config = result ? (TYPE_CONFIG[result.type] || TYPE_CONFIG.unknown) : null;
  const statusConfig = result?.status ? STATUS_CONFIG[result.status] : null;
  const Icon = config?.icon;
  const StatusIcon = statusConfig?.icon;
  const canNavigate = result && result.status === 'resolved' && config?.route(result.normalizedId);

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 rounded-full">
        {loading ? (
          <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
        ) : (
          <Search className="w-4 h-4 text-gray-500" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-52 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400"
          data-testid="universal-search-input"
        />
        {(query || onClose) && (
          <button 
            onClick={() => {
              setQuery('');
              setResult(null);
              onClose?.();
            }}
            className="p-0.5 hover:bg-gray-200 rounded"
          >
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {(result || error) && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 min-w-[320px]">
          {error ? (
            <div className="p-4 text-sm text-red-600">{error}</div>
          ) : result ? (
            <>
              {/* Main result */}
              <button
                onClick={canNavigate ? handleNavigate : undefined}
                disabled={!canNavigate}
                className={`w-full p-4 flex items-center gap-3 text-left transition-colors ${
                  canNavigate ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'
                }`}
                data-testid="search-result-item"
              >
                {Icon && (
                  <div className={`p-2 rounded-lg ${config.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">
                      {result.label || result.normalizedId?.slice(0, 12) + '...'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
                      {config.label}
                    </span>
                    {result.subtype && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        {result.subtype}
                      </span>
                    )}
                    {statusConfig && (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${statusConfig.color}`}>
                        {StatusIcon && <StatusIcon className="w-3 h-3" />}
                        {statusConfig.label}
                      </span>
                    )}
                  </div>
                  {result.normalizedId && result.normalizedId !== result.label && (
                    <div className="text-xs text-gray-500 truncate mt-0.5 font-mono">
                      {result.normalizedId}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className={`font-medium ${
                    result.confidence >= 0.8 ? 'text-emerald-600' :
                    result.confidence >= 0.5 ? 'text-amber-600' :
                    'text-gray-400'
                  }`}>
                    {Math.round(result.confidence * 100)}%
                  </span>
                  {canNavigate && (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </div>
              </button>
              
              {/* Reason */}
              {result.reason && (
                <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                  <div className="text-xs text-gray-600">{result.reason}</div>
                </div>
              )}
              
              {/* Suggestions */}
              {result.suggestions && result.suggestions.length > 0 && (
                <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                  <div className="text-xs text-gray-500 mb-2">Suggested actions:</div>
                  <div className="flex flex-wrap gap-2">
                    {result.suggestions.map((suggestion) => {
                      const SuggIcon = SUGGESTION_ICONS[suggestion] || HelpCircle;
                      return (
                        <button
                          key={suggestion}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="flex items-center gap-1.5 px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                        >
                          <SuggIcon className="w-3 h-3" />
                          {SUGGESTION_LABELS[suggestion] || suggestion}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Available data indicators */}
              {result.available && (
                <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500">Data:</span>
                  {Object.entries(result.available).map(([key, available]) => (
                    <span
                      key={key}
                      className={`px-2 py-0.5 rounded text-xs ${
                        available ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {key}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Bootstrap indicator */}
              {result.bootstrapQueued && (
                <div className="px-4 py-2 border-t border-gray-100 bg-blue-50 flex items-center gap-2">
                  <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />
                  <span className="text-xs text-blue-700">
                    Indexing queued. Data will be available soon.
                  </span>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
