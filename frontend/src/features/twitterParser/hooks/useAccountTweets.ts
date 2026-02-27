// useAccountTweets - твиты конкретного аккаунта

import { useState, useCallback } from 'react';
import { twitterParserAPI } from '../api/client';
import { mapToTweetVM, mapToAccountVM } from '../mappers';
import type { TweetVM, TwitterAccountVM } from '../types';

export function useAccountTweets() {
  const [account, setAccount] = useState<TwitterAccountVM | null>(null);
  const [tweets, setTweets] = useState<TweetVM[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (username: string) => {
    if (!username) {
      setError('Username is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await twitterParserAPI.getAccountTweets(username);

      if (response.ok && response.data) {
        setAccount(response.data.user ? mapToAccountVM(response.data.user) : null);
        setTweets((response.data.tweets || []).map(mapToTweetVM));
      } else {
        throw new Error(response.error || 'Failed to fetch tweets');
      }
    } catch (err: any) {
      setError(err.message);
      setTweets([]);
      setAccount(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setAccount(null);
    setTweets([]);
    setError(null);
  }, []);

  return { account, tweets, loading, error, fetch, clear };
}
