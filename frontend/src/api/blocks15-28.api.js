/**
 * Blocks 15-28 API Client
 * 
 * API integration for advanced analytics features:
 * - Bot Farms, AQI, Fake Growth, Authenticity, Behavior Profiles, Strategy Simulation
 */

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// ===========================================
// BLOCK 15 - Bot Farms
// ===========================================
export async function fetchBotFarms(limit = 100, minConfidence = 0.3) {
  try {
    const response = await fetch(`${API_BASE}/api/connections/bot-farms?limit=${limit}&minConfidence=${minConfidence}`);
    if (!response.ok) return { ok: false, farms: [] };
    return response.json();
  } catch (error) {
    console.error('[API] fetchBotFarms error:', error);
    return { ok: false, farms: [] };
  }
}

export async function fetchActorBotFarms(actorId) {
  try {
    const response = await fetch(`${API_BASE}/api/connections/influencers/${actorId}/bot-farms`);
    if (!response.ok) return { ok: false, farms: [] };
    return response.json();
  } catch (error) {
    console.error('[API] fetchActorBotFarms error:', error);
    return { ok: false, farms: [] };
  }
}

// ===========================================
// BLOCK 16 - Audience Quality Index (AQI)
// ===========================================
export async function fetchAudienceQualityNew(actorId) {
  try {
    const response = await fetch(`${API_BASE}/api/connections/influencers/${actorId}/audience-quality`);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('[API] fetchAudienceQuality error:', error);
    return null;
  }
}

// ===========================================
// BLOCK 17 - Fake Growth Detector
// ===========================================
export async function fetchFakeGrowth(actorId) {
  try {
    const response = await fetch(`${API_BASE}/api/connections/influencers/${actorId}/fake-growth`);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('[API] fetchFakeGrowth error:', error);
    return null;
  }
}

// ===========================================
// BLOCK 18 - Follower Clusters
// ===========================================
export async function fetchFollowerClusters(actorId) {
  try {
    const response = await fetch(`${API_BASE}/api/connections/influencers/${actorId}/follower-clusters`);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('[API] fetchFollowerClusters error:', error);
    return null;
  }
}

// ===========================================
// BLOCK 19 - Farm Overlap Graph
// ===========================================
export async function fetchFarmGraph(minScore = 0.35, limit = 200) {
  try {
    const response = await fetch(`${API_BASE}/api/connections/network/farm-graph?minScore=${minScore}&limit=${limit}`);
    if (!response.ok) return { nodes: [], edges: [] };
    return response.json();
  } catch (error) {
    console.error('[API] fetchFarmGraph error:', error);
    return { nodes: [], edges: [] };
  }
}

// Fetch detailed actor information for modal popup
export async function fetchActorDetails(actorId) {
  try {
    const response = await fetch(`${API_BASE}/api/connections/network/actor/${encodeURIComponent(actorId)}`);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('[API] fetchActorDetails error:', error);
    return null;
  }
}

// ===========================================
// BLOCK 20 - Real Top Followers
// ===========================================
export async function fetchTopFollowers(actorId, limit = 10) {
  try {
    const response = await fetch(`${API_BASE}/api/connections/influencers/${actorId}/top-followers?limit=${limit}`);
    if (!response.ok) return { ok: false, followers: [] };
    return response.json();
  } catch (error) {
    console.error('[API] fetchTopFollowers error:', error);
    return { ok: false, followers: [] };
  }
}

// ===========================================
// BLOCK 21 - Influencer Authenticity Score
// ===========================================
export async function fetchAuthenticity(actorId) {
  try {
    const response = await fetch(`${API_BASE}/api/connections/influencers/${actorId}/authenticity`);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('[API] fetchAuthenticity error:', error);
    return null;
  }
}

// ===========================================
// BLOCK 22 - Authority Adjustment
// ===========================================
export async function fetchAuthorityAdjustment(actorId) {
  try {
    const response = await fetch(`${API_BASE}/api/connections/influencers/${actorId}/authority`);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('[API] fetchAuthorityAdjustment error:', error);
    return null;
  }
}

// ===========================================
// BLOCK 23 - Bot Market Signals
// ===========================================
export async function fetchBotSignals(actorId, window = '24h') {
  try {
    const response = await fetch(`${API_BASE}/api/connections/influencers/${actorId}/bot-signals?window=${window}`);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('[API] fetchBotSignals error:', error);
    return null;
  }
}

// ===========================================
// BLOCK 27 - Actor Behavior Profiles
// ===========================================
export async function fetchBehaviorProfile(actorId) {
  try {
    const response = await fetch(`${API_BASE}/api/connections/influencers/${actorId}/behavior-profile`);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('[API] fetchBehaviorProfile error:', error);
    return null;
  }
}

export async function fetchActorsByProfile(profileType, limit = 50) {
  try {
    const response = await fetch(`${API_BASE}/api/connections/actors/by-profile/${profileType}?limit=${limit}`);
    if (!response.ok) return { ok: false, actors: [] };
    return response.json();
  } catch (error) {
    console.error('[API] fetchActorsByProfile error:', error);
    return { ok: false, actors: [] };
  }
}

// ===========================================
// BLOCK 28 - Strategy Simulation
// ===========================================
export async function fetchStrategies() {
  try {
    const response = await fetch(`${API_BASE}/api/connections/simulation/strategies`);
    if (!response.ok) return { ok: false, strategies: [] };
    return response.json();
  } catch (error) {
    console.error('[API] fetchStrategies error:', error);
    return { ok: false, strategies: [] };
  }
}

export async function runStrategySimulation(strategyName, windowDays = 30, limit = 100) {
  try {
    const response = await fetch(`${API_BASE}/api/connections/simulation/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strategyName, windowDays, limit })
    });
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('[API] runStrategySimulation error:', error);
    return null;
  }
}

export async function fetchStrategyReport(strategyName) {
  try {
    const response = await fetch(`${API_BASE}/api/connections/simulation/${strategyName}`);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('[API] fetchStrategyReport error:', error);
    return null;
  }
}

export async function compareStrategies(strategyA, strategyB) {
  try {
    const response = await fetch(`${API_BASE}/api/connections/simulation/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strategyA, strategyB })
    });
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('[API] compareStrategies error:', error);
    return null;
  }
}
