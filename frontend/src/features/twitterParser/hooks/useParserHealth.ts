// useParserHealth - мониторинг статуса парсера

import { useEffect, useState } from 'react';
import { twitterParserAPI } from '../api/client';
import { mapToHealthVM } from '../mappers';
import type { ParserHealthVM } from '../types';

export function useParserHealth(refreshInterval = 10000) {
  const [health, setHealth] = useState<ParserHealthVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      const response = await twitterParserAPI.getHealth();
      setHealth(mapToHealthVM(response));
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setHealth({
        ok: false,
        status: 'down',
        state: 'ERROR',
        mode: 'LIMITED',
        uptime: 0,
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { health, loading, error, refetch: fetchHealth };
}
