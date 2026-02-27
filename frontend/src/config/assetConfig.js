/**
 * ASSET CONFIGURATION REGISTRY
 * 
 * Central source of truth for all tradeable assets.
 * Frontend does NOT know asset-specific logic.
 * It only knows configuration.
 */

export const ASSET_IDS = ['btc', 'spx', 'dxy'];

// TEST ASSET for scalability verification (REMOVE IN PRODUCTION)
const TEST_ASSET = {
  id: 'test',
  displayName: 'Test Asset',
  shortName: 'TEST',
  color: '#8B5CF6',
  colorSecondary: '#A78BFA',
  coreEndpoint: '/api/fractal/dxy/terminal', // Use DXY endpoint for testing
  adjustedEndpoint: '/api/research/dxy/terminal',
  evidenceEndpoint: '/api/dxy-macro-core/score/evidence',
  chartEndpoint: '/api/fractal/dxy/chart',
  formatPrice: (val) => `${val?.toFixed(2) || '—'}`,
  formatChange: (val) => `${val >= 0 ? '+' : ''}${(val * 100).toFixed(2)}%`,
  defaultHorizon: '30d',
  volatilityScale: 'moderate',
  parent: null,
};

export const assetConfigs = {
  // SCALABILITY TEST: test asset can be enabled by uncommenting below
  // test: TEST_ASSET,
  btc: {
    id: 'btc',
    displayName: 'Bitcoin',
    shortName: 'BTC',
    color: '#F7931A',
    colorSecondary: '#FFB84D',
    coreEndpoint: '/api/fractal/v2.1/terminal',
    adjustedEndpoint: '/api/fractal/btc/cascade',
    evidenceEndpoint: '/api/fractal/btc/cascade/evidence',
    chartEndpoint: '/api/fractal/v2.1/chart',
    formatPrice: (val) => `$${val?.toLocaleString('en-US', { maximumFractionDigits: 0 }) || '—'}`,
    formatChange: (val) => `${val >= 0 ? '+' : ''}${(val * 100).toFixed(1)}%`,
    defaultHorizon: '30d',
    volatilityScale: 'high',
    parent: 'spx', // BTC cascade depends on SPX
  },
  spx: {
    id: 'spx',
    displayName: 'S&P 500',
    shortName: 'SPX',
    color: '#2563EB',
    colorSecondary: '#60A5FA',
    coreEndpoint: '/api/fractal/spx/terminal',
    adjustedEndpoint: '/api/fractal/spx/cascade',
    evidenceEndpoint: '/api/fractal/spx/cascade/evidence',
    chartEndpoint: '/api/fractal/spx/chart',
    formatPrice: (val) => `${val?.toLocaleString('en-US', { maximumFractionDigits: 1 }) || '—'} pts`,
    formatChange: (val) => `${val >= 0 ? '+' : ''}${(val * 100).toFixed(2)}%`,
    defaultHorizon: '30d',
    volatilityScale: 'moderate',
    parent: 'dxy', // SPX cascade depends on DXY
  },
  dxy: {
    id: 'dxy',
    displayName: 'US Dollar Index',
    shortName: 'DXY',
    color: '#16A34A',
    colorSecondary: '#4ADE80',
    coreEndpoint: '/api/fractal/dxy/terminal',
    adjustedEndpoint: '/api/research/dxy/terminal',
    evidenceEndpoint: '/api/dxy-macro-core/score/evidence',
    chartEndpoint: '/api/fractal/dxy/chart',
    formatPrice: (val) => `${val?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '—'}`,
    formatChange: (val) => `${val >= 0 ? '+' : ''}${(val * 100).toFixed(2)}%`,
    defaultHorizon: '30d',
    volatilityScale: 'low',
    parent: null, // DXY is root (uses macro only)
    // DXY-specific features
    features: {
      crossAsset: false,       // NO SPX/BTC references
      engineBlocks: false,     // NO AE Brain blocks
      macroTab: true,          // Macro tab enabled (Hybrid vs Macro)
      marketPhaseEngine: false, // NOT trained for DXY
      strategyBlocks: false,   // Strategy not implemented for DXY
    },
  },
};

/**
 * Get asset configuration by ID
 * @param {string} assetId - 'btc' | 'spx' | 'dxy'
 * @returns {Object} Asset configuration
 */
export function getAssetConfig(assetId) {
  const id = assetId?.toLowerCase() || 'btc';
  return assetConfigs[id] || assetConfigs.btc;
}

/**
 * Asset inheritance model for cascade chain
 * BTC → SPX → DXY
 */
export const assetMatrix = {
  btc: { parent: 'spx', children: [] },
  spx: { parent: 'dxy', children: ['btc'] },
  dxy: { parent: null, children: ['spx'] },
};

/**
 * Get cascade chain for an asset
 * @param {string} assetId 
 * @returns {string[]} Chain from root to asset
 */
export function getCascadeChain(assetId) {
  const chain = [];
  let current = assetId?.toLowerCase();
  
  while (current) {
    chain.unshift(current);
    current = assetMatrix[current]?.parent;
  }
  
  return chain;
}

export default assetConfigs;
