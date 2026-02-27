/**
 * FRACTAL RESEARCH TERMINAL — API Client
 * Typed fetchers for fractal and market data
 */

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

/**
 * Fetch fractal signal
 */
export async function fetchFractalSignal(symbol = "BTC") {
  try {
    const res = await fetch(`${API_URL}/api/fractal/v2.1/signal?symbol=${symbol}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("[FractalAPI] fetchFractalSignal error:", err);
    return null;
  }
}

/**
 * Fetch candles from market API
 */
export async function fetchCandles(symbol = "BTC", tf = "1D", limit = 1500) {
  try {
    // Try fractal candles first
    const res = await fetch(`${API_URL}/api/fractal/candles?symbol=${symbol}&limit=${limit}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return { candles: data };
      }
      if (data.candles) {
        return data;
      }
    }
    
    // Fallback to market candles
    const fallback = await fetch(`${API_URL}/api/market/candles?symbol=${symbol}&tf=${tf}&limit=${limit}`);
    if (!fallback.ok) return null;
    return await fallback.json();
  } catch (err) {
    console.error("[FractalAPI] fetchCandles error:", err);
    return null;
  }
}

/**
 * Fetch fractal matches for overlay
 */
export async function fetchFractalMatches(symbol = "BTC", horizon = "30d", top = 5) {
  try {
    const res = await fetch(
      `${API_URL}/api/fractal/v2.1/explain/detailed?symbol=${symbol}&horizon=${horizon}&topN=${top}`
    );
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("[FractalAPI] fetchFractalMatches error:", err);
    return null;
  }
}

/**
 * Fetch fractal admin dashboard
 */
export async function fetchFractalAdminDashboard(symbol = "BTC") {
  try {
    const res = await fetch(`${API_URL}/api/fractal/v2.1/admin/status?symbol=${symbol}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("[FractalAPI] fetchFractalAdminDashboard error:", err);
    return null;
  }
}
