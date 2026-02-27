// Twitter Parser API Client

const API_BASE = '/api/v4/twitter';

class TwitterParserAPI {
  // Health & Status
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Failed to fetch parser health');
    return res.json();
  }

  async getStatus() {
    const res = await fetch(`${API_BASE}/status`);
    if (!res.ok) throw new Error('Failed to fetch parser status');
    return res.json();
  }

  // Search
  async search(params: {
    query: string;
    from?: string;
    to?: string;
    verified?: boolean;
    followersMin?: number;
    sort?: string;
  }) {
    const queryParams = new URLSearchParams();
    queryParams.append('query', params.query);
    if (params.from) queryParams.append('from', params.from);
    if (params.to) queryParams.append('to', params.to);
    if (params.verified !== undefined) queryParams.append('verified', String(params.verified));
    if (params.followersMin) queryParams.append('followersMin', String(params.followersMin));
    if (params.sort) queryParams.append('sort', params.sort);

    const res = await fetch(`${API_BASE}/search?${queryParams.toString()}`);
    if (!res.ok) throw new Error('Failed to search tweets');
    return res.json();
  }

  // Account
  async getAccount(username: string) {
    const res = await fetch(`${API_BASE}/account/${username}`);
    if (!res.ok) throw new Error(`Failed to fetch account: ${username}`);
    return res.json();
  }

  async getAccountTweets(username: string) {
    const res = await fetch(`${API_BASE}/account/${username}/tweets`);
    if (!res.ok) throw new Error(`Failed to fetch tweets for: ${username}`);
    return res.json();
  }

  async getAccountFollowers(username: string) {
    const res = await fetch(`${API_BASE}/account/${username}/followers`);
    if (!res.ok) {
      const error = await res.json().catch(() => ({ ok: false, error: 'Unknown error' }));
      throw new Error(error.error || 'Failed to fetch followers');
    }
    return res.json();
  }

  // Admin
  async setMode(mode: string) {
    const res = await fetch(`${API_BASE}/admin/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
    if (!res.ok) throw new Error('Failed to set mode');
    return res.json();
  }

  async pause() {
    const res = await fetch(`${API_BASE}/admin/pause`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to pause parser');
    return res.json();
  }

  async resume() {
    const res = await fetch(`${API_BASE}/admin/resume`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to resume parser');
    return res.json();
  }
}

export const twitterParserAPI = new TwitterParserAPI();
