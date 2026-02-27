/**
 * FOMO AI Search Component (Light Theme)
 * 
 * Symbol search with autocomplete - connected to real API
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Loader2, TrendingUp } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export function FomoAiSearch({ current, onSelect }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [topSymbols, setTopSymbols] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  // Fetch top symbols on mount
  useEffect(() => {
    const fetchTopSymbols = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v10/market/top?limit=15`);
        const data = await res.json();
        if (data.ok && data.items) {
          setTopSymbols(data.items);
        }
      } catch (err) {
        console.error('Failed to fetch top symbols:', err);
      }
    };
    fetchTopSymbols();
  }, []);

  // Search API with debounce
  const searchAssets = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      // Show top symbols when no query
      setResults(topSymbols.filter(item => item.symbol !== current));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v10/market/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.ok && data.items) {
        setResults(data.items.filter(item => item.symbol !== current));
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  }, [current, topSymbols]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      searchAssets(query);
    }, 200);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, searchAssets]);

  // Initialize results with top symbols
  useEffect(() => {
    if (!query && topSymbols.length > 0) {
      setResults(topSymbols.filter(item => item.symbol !== current));
    }
  }, [topSymbols, current, query]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (symbol) => {
    onSelect(symbol);
    setQuery('');
    setIsOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSelect(query.toUpperCase().trim());
      setQuery('');
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative" data-testid="fomo-ai-search">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder={`Search assets...`}
            className="w-full pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            data-testid="search-input"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
          )}
        </div>
      </form>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden max-h-80 overflow-y-auto" style={{ zIndex: 9999, minWidth: '320px' }} data-testid="search-dropdown">
          {results.length === 0 && !loading && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No assets found
            </div>
          )}
          
          {!query && results.length > 0 && (
            <div className="px-3 py-2 text-xs text-gray-500 uppercase tracking-wider bg-gray-50 border-b">
              Top Assets
            </div>
          )}
          
          <div className="py-1">
            {results.map((item) => (
              <button
                key={item.symbol}
                onClick={() => handleSelect(item.symbol)}
                className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center justify-between group"
                data-testid={`search-result-${item.symbol}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                    {item.base?.slice(0, 2) || item.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{item.symbol}</div>
                    <div className="text-xs text-gray-500">{item.base}/{item.quote}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.score && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <TrendingUp className="w-3 h-3" />
                      <span>{item.score}</span>
                    </div>
                  )}
                  <div className="text-xs text-gray-400 group-hover:text-blue-500">
                    {item.exchanges?.length || 0} venues
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
