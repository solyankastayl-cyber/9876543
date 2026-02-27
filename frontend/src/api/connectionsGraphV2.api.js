import axios from 'axios';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

export const GRAPH_LAYERS = [
  'BLENDED',
  'CO_INVESTMENT', 
  'CO_ENGAGEMENT',
  'FOLLOW',
  'ONCHAIN',
  'MEDIA'
];

export async function fetchGraphV2(params) {
  const res = await axios.get(`${API_BASE}/api/connections/graph/v2`, { params });
  return res.data;
}

export async function fetchHandshakeV2(body) {
  const res = await axios.post(`${API_BASE}/api/connections/handshake/v2`, body);
  return res.data;
}

export async function fetchNetworkV2Stats() {
  const res = await axios.get(`${API_BASE}/api/connections/networkv2/stats`);
  return res.data;
}

export async function fetchCoinvestEdges(params) {
  const res = await axios.get(`${API_BASE}/api/connections/networkv2/coinvest/edges`, { params });
  return res.data;
}

// Follow Graph v2 APIs (PHASE A1)
export async function fetchFollowEdges(params) {
  const res = await axios.get(`${API_BASE}/api/connections/follow/edges`, { params });
  return res.data;
}

export async function fetchFollowers(accountId) {
  const res = await axios.get(`${API_BASE}/api/connections/follow/followers/${accountId}`);
  return res.data;
}

export async function fetchFollowing(accountId) {
  const res = await axios.get(`${API_BASE}/api/connections/follow/following/${accountId}`);
  return res.data;
}

export async function fetchFollowStats() {
  const res = await axios.get(`${API_BASE}/api/connections/follow/stats`);
  return res.data;
}
