import axios from 'axios';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

export const UNIFIED_FACETS = [
  'SMART',
  'INFLUENCE', 
  'EARLY',
  'VC',
  'MEDIA',
  'NFT',
  'TRENDING',
  'MOST_SEARCHED',
  'POPULAR'
];

export async function fetchUnifiedAccounts(params) {
  const res = await axios.get(`${API_BASE}/api/connections/unified`, { params });
  return res.data;
}

export async function fetchUnifiedFacets() {
  const res = await axios.get(`${API_BASE}/api/connections/unified/facets`);
  return res.data;
}
