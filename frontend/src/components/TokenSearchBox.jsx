/**
 * Token Search Box - Input field for searching tokens
 * Uses Universal Resolver to find tokens by address or symbol
 */
import { useState, useRef, useEffect } from 'react';
import { Search, Loader2, Coins, X, ArrowRight } from 'lucide-react';
import { resolverApi } from '../api';

export default function TokenSearchBox({ onTokenSelect, className = '' }) {
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim() || query.trim().length < 2) {
      setResult(null);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      
      try {
        const response = await resolverApi.resolve(query.trim());
        
        if (response.ok && response.data) {
          setResult(response.data);
          setShowDropdown(true);
        } else {
          setResult(null);
        }
      } catch (err) {
        console.error('Resolver error:', err);
        setResult(null);
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

  const handleSelect = () => {
    if (result && result.type === 'token') {
      onTokenSelect?.(result.normalizedId, result);
      setQuery('');
      setResult(null);
      setShowDropdown(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-gray-900 focus-within:border-gray-900 transition-all">
        {loading ? (
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
        ) : (
          <Search className="w-5 h-5 text-gray-400" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => result && setShowDropdown(true)}
          placeholder="Search token by address or symbol (e.g., 0xa0b8... or USDC)"
          className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-400"
          data-testid="token-search-input"
        />
        {query && (
          <button 
            onClick={() => {
              setQuery('');
              setResult(null);
              setShowDropdown(false);
            }}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {showDropdown && result && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
          <button
            onClick={handleSelect}
            disabled={result.type !== 'token'}
            className={`w-full p-4 flex items-center gap-3 text-left transition-colors ${
              result.type === 'token' ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-not-allowed opacity-60'
            }`}
            data-testid="token-search-result"
          >
            <div className={`p-2 rounded-lg ${result.type === 'token' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
              <Coins className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 text-sm">
                  {result.label || result.normalizedId.slice(0, 10) + '...'}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  result.type === 'token' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {result.type === 'token' ? 'Token' : result.type}
                </span>
              </div>
              <div className="text-xs text-gray-500 truncate mt-0.5 font-mono">
                {result.normalizedId}
              </div>
              {result.error && (
                <div className="text-xs text-amber-600 mt-1">{result.error}</div>
              )}
            </div>
            {result.type === 'token' && (
              <div className="flex items-center gap-1 text-gray-400">
                <span className="text-xs">View Profile</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </button>
          
          {result.type !== 'token' && (
            <div className="px-4 py-2 bg-amber-50 border-t border-amber-100 text-xs text-amber-700">
              This doesn't appear to be a token address. Try entering a valid token contract address.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
