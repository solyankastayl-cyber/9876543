/**
 * AssetPicker Component
 * 
 * Dynamic symbol search and selection component.
 * Replaces static asset buttons with searchable dropdown.
 * 
 * Features:
 * - Search across all supported symbols
 * - Shows asset logo, name, and ticker
 * - Displays currently selected asset
 * - Keyboard navigation support
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { fetchMarketSymbols, normalizeSymbol, extractBase } from '../../lib/api/market';

// Fallback symbols if API fails
const FALLBACK_SYMBOLS = [
  { symbol: 'BTCUSDT', base: 'BTC', quote: 'USDT', name: 'Bitcoin', logo: '/logos/btc.svg' },
  { symbol: 'ETHUSDT', base: 'ETH', quote: 'USDT', name: 'Ethereum', logo: '/logos/eth.svg' },
  { symbol: 'SOLUSDT', base: 'SOL', quote: 'USDT', name: 'Solana', logo: '/logos/sol.svg' },
  { symbol: 'BNBUSDT', base: 'BNB', quote: 'USDT', name: 'BNB', logo: '/logos/bnb.svg' },
];

export function AssetPicker({ value, onChange }) {
  const [symbols, setSymbols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Normalize the current value
  const normalizedValue = normalizeSymbol(value || 'BTC');

  // Load symbols on mount
  useEffect(() => {
    let alive = true;
    
    setLoading(true);
    fetchMarketSymbols()
      .then((list) => {
        if (alive) {
          setSymbols(list.length > 0 ? list : FALLBACK_SYMBOLS);
        }
      })
      .catch((err) => {
        console.error('[AssetPicker] Failed to load symbols:', err);
        if (alive) {
          setSymbols(FALLBACK_SYMBOLS);
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    
    return () => { alive = false; };
  }, []);

  // Find selected symbol
  const selected = useMemo(() => {
    return symbols.find(s => s.symbol === normalizedValue) || {
      symbol: normalizedValue,
      base: extractBase(normalizedValue),
      quote: 'USDT',
      name: extractBase(normalizedValue),
      logo: `/logos/${extractBase(normalizedValue).toLowerCase()}.svg`,
    };
  }, [symbols, normalizedValue]);

  // Filter symbols based on search
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return symbols.slice(0, 20);
    
    return symbols
      .filter(s =>
        s.base.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.symbol.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [symbols, query]);

  // Reset highlight when filtered list changes
  useEffect(() => {
    setHighlightIndex(0);
  }, [filtered.length]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setQuery('');
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex(prev => Math.min(prev + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[highlightIndex]) {
          selectSymbol(filtered[highlightIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setQuery('');
        break;
      default:
        break;
    }
  };

  // Select a symbol
  const selectSymbol = (sym) => {
    onChange(sym.symbol);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div 
      ref={containerRef}
      className="relative"
      data-testid="asset-picker"
    >
      {/* Selected Asset Display / Trigger */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
          }
        }}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition min-w-[180px]"
        data-testid="asset-picker-trigger"
      >
        {/* Logo */}
        <img
          src={selected.logo}
          alt={selected.base}
          className="w-6 h-6 rounded-full"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        
        {/* Name & Ticker */}
        <div className="flex flex-col items-start flex-1 min-w-0">
          <span className="font-semibold text-gray-900 text-sm">{selected.base}</span>
          <span className="text-xs text-gray-500 truncate">{selected.name}</span>
        </div>
        
        {/* Chevron */}
        <ChevronDown className={`w-4 h-4 text-gray-400 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div 
          className="absolute z-50 top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden"
          data-testid="asset-picker-dropdown"
        >
          {/* Search Input */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search assets..."
                className="w-full pl-3 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                data-testid="asset-picker-search"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Results List */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-500">
                Loading symbols...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No assets found
              </div>
            ) : (
              filtered.map((sym, idx) => (
                <button
                  key={sym.symbol}
                  type="button"
                  onClick={() => selectSymbol(sym)}
                  onMouseEnter={() => setHighlightIndex(idx)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition ${
                    idx === highlightIndex
                      ? 'bg-blue-50'
                      : sym.symbol === normalizedValue
                        ? 'bg-gray-50'
                        : 'hover:bg-gray-50'
                  }`}
                  data-testid={`asset-option-${sym.base.toLowerCase()}`}
                >
                  {/* Logo */}
                  <img
                    src={sym.logo}
                    alt={sym.base}
                    className="w-7 h-7 rounded-full"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm">{sym.base}</div>
                    <div className="text-xs text-gray-500 truncate">{sym.name}</div>
                  </div>
                  
                  {/* Selected Check */}
                  {sym.symbol === normalizedValue && (
                    <span className="text-blue-600 font-bold">✓</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AssetPicker;
