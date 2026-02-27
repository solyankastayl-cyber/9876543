// B4 - Tweet Filters Utility
// Client-side filtering for advanced options

/**
 * Apply client-side filters to tweets
 */
export function applyTweetFilters(tweets, opts = {}) {
  const { minLikes, verifiedOnly, sinceHours } = opts;
  
  let filtered = [...tweets];

  if (minLikes && minLikes > 0) {
    filtered = filtered.filter(t => {
      const likes = t.engagement?.likes ?? t.likes ?? 0;
      return likes >= minLikes;
    });
  }

  if (verifiedOnly) {
    filtered = filtered.filter(t => t.author?.verified === true);
  }

  if (sinceHours && sinceHours > 0) {
    const cutoff = Date.now() - (sinceHours * 60 * 60 * 1000);
    filtered = filtered.filter(t => {
      const ts = toMs(t.timestamp || t.createdAt);
      return ts >= cutoff;
    });
  }

  return filtered;
}

/**
 * Sort tweets by engagement or time
 */
export function sortTweets(tweets, sortMode = 'latest') {
  const sorted = [...tweets];
  
  if (sortMode === 'engagement') {
    sorted.sort((a, b) => {
      const likesA = a.engagement?.likes ?? a.likes ?? 0;
      const repostsA = a.engagement?.reposts ?? a.reposts ?? 0;
      const likesB = b.engagement?.likes ?? b.likes ?? 0;
      const repostsB = b.engagement?.reposts ?? b.reposts ?? 0;
      const scoreA = likesA + repostsA * 2;
      const scoreB = likesB + repostsB * 2;
      return scoreB - scoreA;
    });
  } else {
    // latest
    sorted.sort((a, b) => toMs(b.timestamp || b.createdAt) - toMs(a.timestamp || a.createdAt));
  }

  return sorted;
}

/**
 * Convert timestamp to ms (handles both sec and ms)
 */
export function toMs(ts) {
  if (!ts) return 0;
  return ts < 2_000_000_000 ? ts * 1000 : ts;
}

/**
 * Format number compactly (1.2k, 3.4m)
 */
export function fmtCompact(n) {
  if (n == null) return '—';
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}k`;
  return `${(n / 1_000_000).toFixed(1)}m`;
}

/**
 * Format timestamp to readable date
 */
export function fmtTime(ts) {
  const date = new Date(toMs(ts));
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

/**
 * Get relative time string
 */
export function fmtRelativeTime(ts) {
  const ms = toMs(ts);
  const diff = Date.now() - ms;
  
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  
  return fmtTime(ts);
}
