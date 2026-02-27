/**
 * FORECAST SERIES API CLIENT
 * ==========================
 * 
 * BLOCK F2: Multi-Series Overlay Engine
 * 
 * Fetches historical forecast data from the backend.
 * Supports multiple models and horizons.
 */

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// ═══════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch forecast series data for a specific model and horizon
 */
export async function fetchForecastSeries(params) {
  const { 
    symbol, 
    model, 
    horizon, 
    from, 
    to, 
    limit = 400,
    format = 'candles' 
  } = params;

  const queryParams = new URLSearchParams({
    symbol,
    model,
    horizon,
    limit: String(limit),
    format,
  });

  if (from) queryParams.set('from', from);
  if (to) queryParams.set('to', to);

  const res = await fetch(`${API_URL}/api/market/forecast-series?${queryParams}`);
  
  if (!res.ok) {
    throw new Error(`forecast_series_failed: ${res.status}`);
  }
  
  const json = await res.json();
  
  if (!json.ok) {
    throw new Error(json.error || 'forecast_series_failed');
  }
  
  return json;
}

/**
 * Fetch forecast series for multiple models at once
 * Returns a map of model -> data
 */
export async function fetchMultiModelForecast(params) {
  const { symbol, horizon, models, format = 'candles' } = params;
  
  const results = new Map();
  
  // Fetch all models in parallel
  const promises = models.map(async (model) => {
    try {
      const data = await fetchForecastSeries({ symbol, model, horizon, format });
      return { model, data };
    } catch (err) {
      console.warn(`[ForecastSeries] Failed to fetch ${model}:`, err);
      return { model, data: null };
    }
  });
  
  const settled = await Promise.all(promises);
  
  for (const { model, data } of settled) {
    if (data) {
      results.set(model, data);
    }
  }
  
  return results;
}

/**
 * Model display configuration
 */
export const MODEL_CONFIG = {
  combined: {
    label: 'Combined',
    color: '#2563eb', // Blue
    description: 'ML combined prediction',
  },
  exchange: {
    label: 'Exchange',
    color: '#f97316', // Orange
    description: 'Exchange data layer',
  },
};

/**
 * Get color for a specific model
 */
export function getModelColor(model) {
  return MODEL_CONFIG[model]?.color || '#94a3b8';
}

/**
 * Get all available models
 */
export function getAvailableModels() {
  return ['combined', 'exchange'];
}

console.log('[ForecastSeriesAPI] Module loaded (Block F2)');
