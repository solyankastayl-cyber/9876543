/**
 * Reality API with Mock fallback
 * F1.2 - Mock-first guarantee
 */

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// Mock data for Reality Leaderboard
const MOCK_REALITY_ENTRIES = [
  { actorId: 'cobie', username: 'cobie', name: 'Cobie', realityScore: 87, confirms: 24, contradicts: 3, noData: 2, level: 'ELITE', sample: 29, lastTs: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { actorId: 'hsaka', username: 'HsakaTrades', name: 'Hsaka', realityScore: 82, confirms: 18, contradicts: 4, noData: 3, level: 'STRONG', sample: 25, lastTs: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { actorId: 'punk6529', username: 'punk6529', name: 'punk6529', realityScore: 91, confirms: 32, contradicts: 2, noData: 1, level: 'ELITE', sample: 35, lastTs: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
  { actorId: 'thedefiedge', username: 'thedefiedge', name: 'The DeFi Edge', realityScore: 79, confirms: 15, contradicts: 5, noData: 4, level: 'STRONG', sample: 24, lastTs: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { actorId: 'pentosh1', username: 'Pentosh1', name: 'Pentoshi', realityScore: 85, confirms: 19, contradicts: 4, noData: 2, level: 'ELITE', sample: 25, lastTs: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },
  { actorId: 'inversebrah', username: 'inversebrah', name: 'inversebrah', realityScore: 58, confirms: 12, contradicts: 9, noData: 6, level: 'MIXED', sample: 27, lastTs: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  { actorId: 'DefiIgnas', username: 'DefiIgnas', name: 'Ignas | DeFi', realityScore: 76, confirms: 17, contradicts: 6, noData: 3, level: 'STRONG', sample: 26, lastTs: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
  { actorId: 'route2fi', username: 'Route2FI', name: 'Route 2 FI', realityScore: 73, confirms: 16, contradicts: 7, noData: 2, level: 'STRONG', sample: 25, lastTs: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { actorId: 'CryptoCapo_', username: 'CryptoCapo_', name: 'Il Capo Of Crypto', realityScore: 32, confirms: 8, contradicts: 18, noData: 5, level: 'RISKY', sample: 31, lastTs: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() },
  { actorId: 'farokh', username: 'faaborshi', name: 'Farokh', realityScore: 81, confirms: 22, contradicts: 5, noData: 1, level: 'STRONG', sample: 28, lastTs: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { actorId: 'taikimeda', username: 'TaikiMaeda2', name: 'Taiki Maeda', realityScore: 68, confirms: 12, contradicts: 6, noData: 4, level: 'MIXED', sample: 22, lastTs: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { actorId: 'TheCryptoDog', username: 'TheCryptoDog', name: 'The Crypto Dog', realityScore: 54, confirms: 14, contradicts: 12, noData: 8, level: 'MIXED', sample: 34, lastTs: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
];

const MOCK_GROUPS = [
  { key: 'INFLUENCE', title: 'Influence' },
  { key: 'SMART', title: 'Smart Money' },
  { key: 'MEDIA', title: 'Media' },
  { key: 'TRADING', title: 'Trading / Alpha' },
  { key: 'NFT', title: 'NFT' },
  { key: 'VC', title: 'VC' },
];

export async function fetchLeaderboard({ windowDays = 30, group, limit = 50, sort = 'score' } = {}) {
  try {
    const url = new URL(`${API_BASE}/api/connections/reality/leaderboard`);
    url.searchParams.set('window', String(windowDays));
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('sort', sort);
    if (group) url.searchParams.set('group', group);
    
    const res = await fetch(url.toString(), { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load leaderboard');
    return res.json();
  } catch (err) {
    // Mock fallback
    console.log('[Reality API] Using mock data');
    let data = [...MOCK_REALITY_ENTRIES];
    
    // Sort
    if (sort === 'score') data.sort((a, b) => b.realityScore - a.realityScore);
    else if (sort === 'confirms') data.sort((a, b) => b.confirms - a.confirms);
    else if (sort === 'contradicts') data.sort((a, b) => b.contradicts - a.contradicts);
    else if (sort === 'sample') data.sort((a, b) => (b.confirms + b.contradicts) - (a.confirms + a.contradicts));
    
    return { ok: true, data: data.slice(0, limit) };
  }
}

export async function fetchActorReality(actorId, windowDays = 30) {
  try {
    const url = new URL(`${API_BASE}/api/connections/reality/actor/${encodeURIComponent(actorId)}`);
    url.searchParams.set('window', String(windowDays));
    
    const res = await fetch(url.toString(), { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load actor reality');
    return res.json();
  } catch (err) {
    // Mock fallback
    const actor = MOCK_REALITY_ENTRIES.find(e => e.actorId === actorId);
    return { ok: true, data: actor || null };
  }
}

export async function fetchLeaderboardGroups() {
  try {
    const res = await fetch(`${API_BASE}/api/connections/reality/leaderboard/groups`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load groups');
    return res.json();
  } catch (err) {
    // Mock fallback
    return { ok: true, data: MOCK_GROUPS };
  }
}

export async function fetchLeaderboardExplain() {
  try {
    const res = await fetch(`${API_BASE}/api/connections/reality/leaderboard/explain`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load formula');
    return res.json();
  } catch (err) {
    // Mock fallback
    return { 
      ok: true, 
      data: {
        formula: 'realityScore = (confirms - contradicts) / total * 100',
        description: 'Measures alignment between public statements and on-chain behavior'
      }
    };
  }
}
