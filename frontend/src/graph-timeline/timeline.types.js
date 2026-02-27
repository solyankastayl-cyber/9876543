/**
 * Timeline Types (P1.9.A)
 * 
 * Type definitions for timeline view.
 * Timeline is a READ-ONLY projection of Graph Snapshot.
 */

// ============================================
// Timeline Step Types
// ============================================

/**
 * Step types matching edge types
 */
export const TIMELINE_STEP_TYPES = {
  TRANSFER: 'TRANSFER',
  SWAP: 'SWAP',
  BRIDGE: 'BRIDGE',
  CEX_DEPOSIT: 'CEX_DEPOSIT',
  CEX_WITHDRAW: 'CEX_WITHDRAW',
  CONTRACT_CALL: 'CONTRACT_CALL',
};

/**
 * Node types for from/to references
 */
export const TIMELINE_NODE_TYPES = {
  WALLET: 'WALLET',
  TOKEN: 'TOKEN',
  BRIDGE: 'BRIDGE',
  DEX: 'DEX',
  CEX: 'CEX',
  CONTRACT: 'CONTRACT',
};

/**
 * Risk tags for steps
 */
export const RISK_TAGS = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
};

/**
 * Market regime types (for P1.9.B overlay)
 */
export const MARKET_REGIMES = {
  STABLE: 'STABLE',
  VOLATILE: 'VOLATILE',
  STRESSED: 'STRESSED',
};

// ============================================
// TypeScript-like JSDoc definitions
// ============================================

/**
 * @typedef {Object} TimelineNodeRef
 * @property {string} id - Node ID
 * @property {string} type - Node type (WALLET, CEX, DEX, BRIDGE, etc.)
 * @property {string} [label] - Display label
 * @property {string} [address] - Address if available
 */

/**
 * @typedef {Object} TimelineAsset
 * @property {string} symbol - Token symbol
 * @property {number} [amount] - Amount if available
 * @property {number} [amountUsd] - USD value if available
 */

/**
 * @typedef {Object} TimelineMarketContext
 * @property {string} regime - STABLE | VOLATILE | STRESSED
 * @property {string[]} tags - Market condition tags
 * @property {string} severity - LOW | MEDIUM | HIGH
 */

/**
 * @typedef {Object} TimelineStep
 * @property {number} index - Step index (1-based)
 * @property {string} type - Step type (TRANSFER, SWAP, BRIDGE, etc.)
 * @property {number} timestamp - Unix timestamp
 * @property {string} chain - Chain ID
 * @property {string} [chainFrom] - Source chain for bridges
 * @property {string} [chainTo] - Target chain for bridges
 * @property {TimelineNodeRef} from - Source node
 * @property {TimelineNodeRef} to - Target node
 * @property {TimelineAsset} [asset] - Asset info if available
 * @property {string} edgeId - Original edge ID
 * @property {string} [riskTag] - Risk tag (HIGH, MEDIUM, LOW)
 * @property {string} [reason] - Highlight reason from P1.8
 * @property {number} [riskContribution] - Risk contribution from P1.8
 * @property {TimelineMarketContext} [market] - Market context (P1.9.B)
 */

// ============================================
// Edge Type to Step Type Mapping
// ============================================

export const EDGE_TO_STEP_TYPE = {
  TRANSFER: TIMELINE_STEP_TYPES.TRANSFER,
  SWAP: TIMELINE_STEP_TYPES.SWAP,
  BRIDGE: TIMELINE_STEP_TYPES.BRIDGE,
  DEPOSIT: TIMELINE_STEP_TYPES.CEX_DEPOSIT,
  WITHDRAW: TIMELINE_STEP_TYPES.CEX_WITHDRAW,
  CONTRACT_CALL: TIMELINE_STEP_TYPES.CONTRACT_CALL,
};

// ============================================
// Step Type Display Config
// ============================================

export const STEP_TYPE_CONFIG = {
  [TIMELINE_STEP_TYPES.TRANSFER]: {
    label: 'Transfer',
    icon: 'ArrowRight',
    color: '#6B7280',
    bgColor: '#F3F4F6',
  },
  [TIMELINE_STEP_TYPES.SWAP]: {
    label: 'Swap',
    icon: 'RefreshCw',
    color: '#10B981',
    bgColor: '#D1FAE5',
  },
  [TIMELINE_STEP_TYPES.BRIDGE]: {
    label: 'Bridge',
    icon: 'GitBranch',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
  },
  [TIMELINE_STEP_TYPES.CEX_DEPOSIT]: {
    label: 'CEX Deposit',
    icon: 'LogIn',
    color: '#EF4444',
    bgColor: '#FEE2E2',
  },
  [TIMELINE_STEP_TYPES.CEX_WITHDRAW]: {
    label: 'CEX Withdraw',
    icon: 'LogOut',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
  },
  [TIMELINE_STEP_TYPES.CONTRACT_CALL]: {
    label: 'Contract',
    icon: 'Code',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
  },
};

// ============================================
// Risk Tag Config
// ============================================

export const RISK_TAG_CONFIG = {
  [RISK_TAGS.HIGH]: {
    label: 'High Risk',
    color: '#EF4444',
    bgColor: '#FEE2E2',
  },
  [RISK_TAGS.MEDIUM]: {
    label: 'Medium Risk',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
  },
  [RISK_TAGS.LOW]: {
    label: 'Low Risk',
    color: '#22C55E',
    bgColor: '#DCFCE7',
  },
};

// ============================================
// Market Regime Config (P1.9.B)
// ============================================

export const MARKET_REGIME_CONFIG = {
  [MARKET_REGIMES.STABLE]: {
    label: 'Stable Market',
    color: '#22C55E',
    bgColor: '#DCFCE7',
    severity: RISK_TAGS.LOW,
  },
  [MARKET_REGIMES.VOLATILE]: {
    label: 'Volatile Market',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    severity: RISK_TAGS.MEDIUM,
  },
  [MARKET_REGIMES.STRESSED]: {
    label: 'Stressed Market',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    severity: RISK_TAGS.HIGH,
  },
};

export default {
  TIMELINE_STEP_TYPES,
  TIMELINE_NODE_TYPES,
  RISK_TAGS,
  MARKET_REGIMES,
  EDGE_TO_STEP_TYPE,
  STEP_TYPE_CONFIG,
  RISK_TAG_CONFIG,
  MARKET_REGIME_CONFIG,
};
