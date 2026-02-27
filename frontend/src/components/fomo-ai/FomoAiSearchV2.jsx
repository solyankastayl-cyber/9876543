/**
 * FOMO AI Search V2 - Command Palette Style
 * 
 * Premium search with all available assets from exchanges
 * Accessible via Cmd+K
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, X, TrendingUp, TrendingDown, Minus, Star, Clock, Loader2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Popular symbols as fallback
const POPULAR_SYMBOLS = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', category: 'Major' },
  { symbol: 'ETHUSDT', name: 'Ethereum', category: 'Major' },
  { symbol: 'SOLUSDT', name: 'Solana', category: 'L1' },
  { symbol: 'BNBUSDT', name: 'BNB', category: 'Exchange' },
  { symbol: 'XRPUSDT', name: 'XRP', category: 'Major' },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', category: 'Meme' },
  { symbol: 'ADAUSDT', name: 'Cardano', category: 'L1' },
  { symbol: 'AVAXUSDT', name: 'Avalanche', category: 'L1' },
  { symbol: 'MATICUSDT', name: 'Polygon', category: 'L2' },
  { symbol: 'LINKUSDT', name: 'Chainlink', category: 'DeFi' },
  { symbol: 'ARBUSDT', name: 'Arbitrum', category: 'L2' },
  { symbol: 'OPUSDT', name: 'Optimism', category: 'L2' },
];

export function FomoAiSearchV2({ current, onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [symbols, setSymbols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Fetch all available symbols from universe
  useEffect(() => {
    const fetchSymbols = async () => {
      try {
        // Fetch from snapshots API which has all available symbols
        const res = await fetch(`${API_URL}/api/market/snapshots/latest?venue=hyperliquid&limit=200`);
        const data = await res.json();
        if (data.ok && data.snapshots) {
          const mapped = data.snapshots.map(s => ({
            symbol: `${s.base}USDT`,
            name: s.base,
            category: 'Perpetual',
            venue: s.venue,
            price: s.price,
            change: s.priceChg24h,
          }));
          // Sort by base name
          mapped.sort((a, b) => a.name.localeCompare(b.name));
          setSymbols(mapped);
        } else {
          setSymbols(POPULAR_SYMBOLS);
        }
      } catch (err) {
        console.error('Failed to fetch symbols:', err);
        setSymbols(POPULAR_SYMBOLS);
      }
      setLoading(false);
    };
    fetchSymbols();
  }, []);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Filter symbols based on query
  const filteredSymbols = query
    ? symbols.filter(s => 
        s.symbol.toLowerCase().includes(query.toLowerCase()) ||
        s.name?.toLowerCase().includes(query.toLowerCase())
      )
    : symbols;

  // Limit displayed results
  const displayedSymbols = filteredSymbols.slice(0, 12);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, displayedSymbols.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && displayedSymbols[selectedIndex]) {
        e.preventDefault();
        onSelect(displayedSymbols[selectedIndex].symbol);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, displayedSymbols, onSelect]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedEl = listRef.current?.children[selectedIndex];
    selectedEl?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />
      
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ type: "spring", duration: 0.3 }}
        className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50"
        data-testid="search-modal"
      >
        <div className="bg-[#121217] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
            <Search className="w-5 h-5 text-gray-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search assets..."
              className="flex-1 bg-transparent text-white text-lg placeholder-gray-500 outline-none"
              data-testid="search-input"
            />
            {query && (
              <button onClick={() => setQuery('')} className="p-1 hover:bg-white/5 rounded">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
            <kbd className="hidden sm:block px-2 py-1 text-xs text-gray-500 bg-white/5 rounded border border-white/10">
              ESC
            </kbd>
          </div>

          {/* Current Symbol */}
          <div className="px-4 py-2 bg-white/5 border-b border-white/5">
            <span className="text-xs text-gray-500">Current:</span>
            <span className="ml-2 text-sm font-medium text-white">{current}</span>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[400px] overflow-y-auto py-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            ) : displayedSymbols.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No assets found for "{query}"
              </div>
            ) : (
              displayedSymbols.map((item, index) => (
                <motion.button
                  key={item.symbol}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => onSelect(item.symbol)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
                    index === selectedIndex
                      ? 'bg-blue-500/10 border-l-2 border-blue-500'
                      : 'hover:bg-white/5 border-l-2 border-transparent'
                  }`}
                  data-testid={`search-result-${item.symbol}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm font-bold text-white">
                      {item.name?.slice(0, 2) || item.symbol.slice(0, 2)}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-white">{item.symbol}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {item.name && <span>{item.name}</span>}
                        {item.price && (
                          <span className="text-gray-400">${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {item.change !== undefined && item.change !== null && (
                      <span className={`text-xs font-medium ${item.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {item.change >= 0 ? '+' : ''}{item.change.toFixed(1)}%
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                      {item.category || item.venue || 'Perp'}
                    </span>
                    {item.symbol === current && (
                      <span className="text-xs text-blue-400">Current</span>
                    )}
                  </div>
                </motion.button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/5 rounded">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/5 rounded">Enter</kbd>
                Select
              </span>
            </div>
            <span>{filteredSymbols.length} assets available</span>
          </div>
        </div>
      </motion.div>
    </>
  );
}
