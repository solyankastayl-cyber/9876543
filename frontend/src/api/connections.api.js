/**
 * Connections API hooks
 * 
 * Fetches real Twitter data from backend
 */
import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

/**
 * Fetch unified accounts from API
 */
export function useUnifiedAccounts(facet = 'REAL_TWITTER', options = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  
  const { limit = 50, search } = options;
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (facet) params.set('facet', facet);
      if (limit) params.set('limit', String(limit));
      if (search) params.set('q', search);
      
      const response = await fetch(`${API_URL}/api/connections/unified?${params}`);
      const result = await response.json();
      
      if (result.ok) {
        setData(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [facet, limit, search]);
  
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/connections/unified/stats`);
      const result = await response.json();
      if (result.ok) {
        setStats(result.stats);
      }
    } catch (err) {
      console.warn('Failed to fetch stats:', err);
    }
  }, []);
  
  useEffect(() => {
    fetchData();
    fetchStats();
  }, [fetchData, fetchStats]);
  
  return { data, loading, error, stats, refetch: fetchData };
}

/**
 * Search Twitter via parser and import results
 */
export function useTwitterSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  
  const search = useCallback(async (query, limit = 20) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${API_URL}/api/v4/twitter/search?query=${encodeURIComponent(query)}&limit=${limit}`
      );
      const result = await response.json();
      
      if (result.ok) {
        setResults(result.data);
        return result.data;
      } else {
        setError(result.error || 'Search failed');
        return null;
      }
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { search, loading, error, results };
}

/**
 * Get available facets
 */
export async function getFacets() {
  try {
    const response = await fetch(`${API_URL}/api/connections/unified/facets`);
    const result = await response.json();
    return result.ok ? result.facets : [];
  } catch {
    return [];
  }
}

/**
 * Trigger manual import from parsed tweets
 */
export async function triggerImport() {
  try {
    const response = await fetch(`${API_URL}/api/connections/unified/import-twitter`, {
      method: 'POST'
    });
    return await response.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
