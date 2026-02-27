/**
 * PHASE 1.2 — Market Search Bar Component
 * =========================================
 * 
 * Global search bar for market assets with autocomplete.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, Loader2, X, ArrowRight } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import api from '../../lib/api';

export default function MarketSearchBar({ 
  onSelect,
  placeholder = 'Search asset (ETH, BTC, SOL...)',
  className = '',
}) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  
  // Debounced search
  const doSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setItems([]);
      return;
    }
    
    setLoading(true);
    try {
      const res = await api.get(`/v10/market/search?q=${encodeURIComponent(q)}`);
      setItems(res.data?.items || []);
    } catch (err) {
      console.error('Search error:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      doSearch(query);
    }, 200);
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, doSearch]);
  
  const handleSelect = (item) => {
    if (onSelect) {
      onSelect(item);
    } else {
      navigate(`/market/${item.symbol}`);
    }
    setQuery('');
    setItems([]);
    setFocused(false);
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && items[selectedIndex]) {
        handleSelect(items[selectedIndex]);
      } else if (items.length > 0) {
        handleSelect(items[0]);
      }
    } else if (e.key === 'Escape') {
      setFocused(false);
      setItems([]);
    }
  };
  
  const showDropdown = focused && (items.length > 0 || loading);
  
  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-10 bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500"
          data-testid="market-search-input"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 animate-spin" />
        )}
        {!loading && query && (
          <button
            onClick={() => {
              setQuery('');
              setItems([]);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Dropdown */}
      {showDropdown && (
        <div 
          className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden"
          data-testid="market-search-dropdown"
        >
          {loading ? (
            <div className="p-4 text-center text-slate-400">
              <Loader2 className="w-5 h-5 mx-auto animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-sm">
              No results found
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {items.map((item, idx) => (
                <button
                  key={item.symbol}
                  onClick={() => handleSelect(item)}
                  className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                    idx === selectedIndex 
                      ? 'bg-blue-500/20' 
                      : 'hover:bg-slate-700/50'
                  }`}
                  data-testid={`search-result-${item.symbol}`}
                >
                  <div className="p-2 bg-slate-700/50 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100">{item.symbol}</span>
                      {!item.inUniverse && (
                        <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/20">
                          Not tracked
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {item.exchanges?.length > 0 
                        ? item.exchanges.slice(0, 2).join(', ')
                        : 'No exchange data'}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
