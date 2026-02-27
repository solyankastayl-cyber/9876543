// useTwitterSearch - поиск по keyword

import { useState, useCallback } from 'react';
import { twitterParserAPI } from '../api/client';
import { mapToSearchResultVM } from '../mappers';
import type { SearchResultVM, FilterOptionsVM } from '../types';

export function useTwitterSearch() {
  const [result, setResult] = useState<SearchResultVM | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, filters?: FilterOptionsVM) => {
    if (!query.trim()) {
      setError('Query is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await twitterParserAPI.search({
        query,
        from: filters?.dateRange?.from,
        to: filters?.dateRange?.to,
        verified: filters?.verified,
        followersMin: filters?.followersMin,
        sort: filters?.sort,
      });

      if (response.ok && response.data) {
        setResult(mapToSearchResultVM(response.data));
      } else {
        throw new Error(response.error || 'Search failed');
      }
    } catch (err: any) {
      setError(err.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, search, clear };
}
