/**
 * Market API Client
 * 
 * Provides API calls for market data endpoints.
 * Used by AssetPicker and other market components.
 */

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// ═══════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch all supported trading symbols
 * @returns {Promise<Array<{symbol: string, base: string, quote: string, name: string, logo: string}>>}
 */
export async function fetchMarketSymbols() {
  const res = await fetch(`${API_URL}/api/market/symbols`);
  
  if (!res.ok) {
    throw new Error(`symbols_failed: ${res.status}`);
  }
  
  const json = await res.json();
  
  if (!json.ok) {
    throw new Error('symbols_failed');
  }
  
  return json.symbols || [];
}

/**
 * Normalize symbol to canonical format
 * Ensures consistent format across the app: BTCUSDT
 * @param {string} input
 * @returns {string}
 */
export function normalizeSymbol(input) {
  if (!input) return 'BTCUSDT';
  
  let s = input.toUpperCase().trim();
  
  // Remove separators
  s = s.replace(/[-/]/g, '');
  
  // Add USDT suffix if missing
  if (!s.endsWith('USDT')) {
    s = `${s}USDT`;
  }
  
  return s;
}

/**
 * Extract base from symbol
 * @param {string} symbol
 * @returns {string}
 */
export function extractBase(symbol) {
  if (!symbol) return '';
  const s = symbol.toUpperCase();
  
  const quotes = ['USDT', 'USDC', 'USD', 'BUSD', 'BTC', 'ETH'];
  for (const quote of quotes) {
    if (s.endsWith(quote)) {
      return s.slice(0, s.length - quote.length);
    }
  }
  
  return s;
}
