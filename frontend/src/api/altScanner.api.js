/**
 * Alt Scanner API
 * ================
 * API endpoints for Alt Scanner (Blocks 1-28)
 */

import { api, apiCall } from './client';

const BASE = '/api/v10/alt-scanner';

// ═══════════════════════════════════════════════════════════════
// CORE ENDPOINTS
// ═══════════════════════════════════════════════════════════════

export const altScannerApi = {
  // Health & Status
  getHealth: () => apiCall(api.get(`${BASE}/health`)),
  
  // Main Radar
  getRadar: (refresh = false) => apiCall(api.get(`${BASE}/radar`, { params: { refresh } })),
  
  // Full Radar (unified response)
  getRadarFull: (capital = 10000) => apiCall(api.get(`${BASE}/radar-full`, { params: { capital } })),
  
  // Opportunities
  getOpportunities: () => apiCall(api.get(`${BASE}/opportunities`)),
  getOpportunity: (id) => apiCall(api.get(`${BASE}/opportunities/${id}`)),
  
  // Clusters
  getClusters: () => apiCall(api.get(`${BASE}/clusters`)),
  getCluster: (id) => apiCall(api.get(`${BASE}/clusters/${id}`)),
  
  // Asset details
  getAsset: (symbol) => apiCall(api.get(`${BASE}/asset/${symbol}`)),
  
  // Explain
  getExplain: (symbol) => apiCall(api.get(`${BASE}/explain/${symbol}`)),

  // ═══════════════════════════════════════════════════════════════
  // ADVANCED ENDPOINTS (Blocks 17-28)
  // ═══════════════════════════════════════════════════════════════
  
  // Block 20: AOE
  getAOE: (minScore = 50, maxRank = 20) => 
    apiCall(api.get(`${BASE}/aoe`, { params: { minScore, maxRank } })),
  
  // Block 21: Portfolio Slate
  getPortfolioSlate: (maxPicks = 10) => 
    apiCall(api.get(`${BASE}/portfolio-slate`, { params: { maxPicks } })),
  
  // Block 23: Pattern Memory
  getPatternMemory: (minTrades = 5) => 
    apiCall(api.get(`${BASE}/pattern-memory`, { params: { minTrades } })),
  getPatternDetail: (patternId) => 
    apiCall(api.get(`${BASE}/pattern-memory/${patternId}`)),
  
  // Block 24: Propagation
  getPropagation: () => apiCall(api.get(`${BASE}/propagation`)),
  
  // Block 25: Sector/Regime
  getSectorRegime: () => apiCall(api.get(`${BASE}/sector-regime`)),
  
  // Block 26: Portfolio Construction
  getPortfolioConstruct: (capital = 10000) => 
    apiCall(api.get(`${BASE}/portfolio-construct`, { params: { capital } })),
  
  // Block 27: Strategies
  getStrategies: () => apiCall(api.get(`${BASE}/strategies`)),
  
  // Block 17: Shadow Portfolio
  getShadowTrades: (limit = 50) => 
    apiCall(api.get(`${BASE}/shadow/trades`, { params: { limit } })),
  getShadowMetrics: (period = '30d') => 
    apiCall(api.get(`${BASE}/shadow/metrics`, { params: { period } })),
  
  // Block 18: Failures
  getFailures: (limit = 50) => 
    apiCall(api.get(`${BASE}/failures`, { params: { limit } })),
  getFailureHeatmap: () => apiCall(api.get(`${BASE}/failures/heatmap`)),
  
  // Block 19: Gating
  getGatingBlocks: () => apiCall(api.get(`${BASE}/gating/blocks`)),
  
  // Data Collection
  getCollectorStatus: () => apiCall(api.get(`${BASE}/collector/status`)),
  startCollector: () => apiCall(api.post(`${BASE.replace('v10', 'v10/admin')}/collector/start`)),
  stopCollector: () => apiCall(api.post(`${BASE.replace('v10', 'v10/admin')}/collector/stop`)),
};

export default altScannerApi;
