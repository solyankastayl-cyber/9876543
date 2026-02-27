/**
 * Timeline Mapper (P1.9.A)
 * 
 * CRITICAL: This is the core mapper for P1.9.A
 * 
 * Maps Graph Snapshot → TimelineStep[]
 * 
 * Rules:
 * - Timeline is READ-ONLY projection of graph
 * - Source of truth: Graph Snapshot (P1.7)
 * - Order is determined by highlightedPath
 * - NO business logic, NO risk calculation
 * - NO API calls
 */

import { EDGE_TO_STEP_TYPE, TIMELINE_STEP_TYPES, RISK_TAGS } from './timeline.types';

// ============================================
// Main Mapper Function
// ============================================

/**
 * Map graph snapshot to timeline steps
 * 
 * @param {Object} graphSnapshot - Graph intelligence snapshot
 * @param {Array} graphSnapshot.nodes - Graph nodes
 * @param {Array} graphSnapshot.edges - Graph edges
 * @param {Array} graphSnapshot.highlightedPath - Highlighted path steps
 * @param {Object} graphSnapshot.explain - Explain block
 * @returns {Array} TimelineStep[]
 */
export function mapGraphToTimeline(graphSnapshot) {
  if (!graphSnapshot) {
    return [];
  }
  
  const { nodes, edges, highlightedPath } = graphSnapshot;
  
  if (!highlightedPath || highlightedPath.length === 0) {
    return [];
  }
  
  if (!edges || edges.length === 0) {
    return [];
  }
  
  // Build lookup maps for O(1) access
  const edgeMap = new Map(edges.map(e => [e.id, e]));
  const nodeMap = new Map((nodes || []).map(n => [n.id, n]));
  
  // Map highlighted path to timeline steps
  const timelineSteps = [];
  
  for (let i = 0; i < highlightedPath.length; i++) {
    const pathStep = highlightedPath[i];
    const edge = edgeMap.get(pathStep.edgeId);
    
    if (!edge) {
      // Edge not found, skip but log
      console.warn(`[Timeline] Edge not found: ${pathStep.edgeId}`);
      continue;
    }
    
    const step = mapEdgeToTimelineStep(edge, pathStep, nodeMap, i);
    timelineSteps.push(step);
  }
  
  // Sort by timestamp ASC (deterministic order)
  timelineSteps.sort((a, b) => a.timestamp - b.timestamp);
  
  // Re-index after sort
  timelineSteps.forEach((step, index) => {
    step.index = index + 1;
  });
  
  return timelineSteps;
}

// ============================================
// Edge to TimelineStep Mapper
// ============================================

/**
 * Map single edge to timeline step
 * 
 * @param {Object} edge - Edge from graph
 * @param {Object} pathStep - Path step from highlightedPath
 * @param {Map} nodeMap - Node lookup map
 * @param {number} index - Step index
 * @returns {Object} TimelineStep
 */
function mapEdgeToTimelineStep(edge, pathStep, nodeMap, index) {
  const fromNode = nodeMap.get(edge.fromNodeId);
  const toNode = nodeMap.get(edge.toNodeId);
  
  // Determine step type from edge type
  const stepType = mapEdgeTypeToStepType(edge.type, toNode);
  
  // Determine risk tag based on reason and contribution
  const riskTag = determineRiskTag(pathStep);
  
  return {
    index: index + 1,
    type: stepType,
    timestamp: edge.timestamp || Date.now(),
    chain: edge.chain || 'unknown',
    chainFrom: edge.chainFrom,
    chainTo: edge.chainTo,
    
    from: {
      id: edge.fromNodeId,
      type: fromNode?.type || 'WALLET',
      label: fromNode?.displayName || shortenAddress(edge.fromNodeId),
      address: fromNode?.address,
    },
    
    to: {
      id: edge.toNodeId,
      type: toNode?.type || 'WALLET',
      label: toNode?.displayName || shortenAddress(edge.toNodeId),
      address: toNode?.address,
    },
    
    asset: edge.meta ? {
      symbol: edge.meta.token || 'ETH',
      amount: edge.meta.amount,
      amountUsd: edge.meta.amountUsd,
    } : undefined,
    
    edgeId: edge.id,
    riskTag,
    reason: pathStep.reason,
    riskContribution: pathStep.riskContribution,
    
    // Protocol info
    protocol: edge.meta?.protocol,
    txHash: edge.txHash,
  };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Map edge type to timeline step type
 */
function mapEdgeTypeToStepType(edgeType, toNode) {
  // Special case: DEPOSIT to CEX node
  if (edgeType === 'DEPOSIT' || (edgeType === 'TRANSFER' && toNode?.type === 'CEX')) {
    return TIMELINE_STEP_TYPES.CEX_DEPOSIT;
  }
  
  // Special case: WITHDRAW from CEX node
  if (edgeType === 'WITHDRAW') {
    return TIMELINE_STEP_TYPES.CEX_WITHDRAW;
  }
  
  return EDGE_TO_STEP_TYPE[edgeType] || TIMELINE_STEP_TYPES.TRANSFER;
}

/**
 * Determine risk tag from path step
 */
function determineRiskTag(pathStep) {
  if (!pathStep) return undefined;
  
  // High risk reasons
  const highRiskReasons = ['exit_to_cex', 'mixing_pattern', 'known_risk_address'];
  if (highRiskReasons.includes(pathStep.reason)) {
    return RISK_TAGS.HIGH;
  }
  
  // Medium risk reasons
  const mediumRiskReasons = ['cross_chain_migration', 'pre_exit_swap', 'suspicious_timing'];
  if (mediumRiskReasons.includes(pathStep.reason)) {
    return RISK_TAGS.MEDIUM;
  }
  
  // High contribution = higher risk
  if (pathStep.riskContribution > 0.3) {
    return RISK_TAGS.HIGH;
  }
  if (pathStep.riskContribution > 0.15) {
    return RISK_TAGS.MEDIUM;
  }
  
  return RISK_TAGS.LOW;
}

/**
 * Shorten address for display
 */
function shortenAddress(address) {
  if (!address || typeof address !== 'string') return 'Unknown';
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// ============================================
// Timeline Utilities
// ============================================

/**
 * Get step by edge ID
 */
export function getStepByEdgeId(timeline, edgeId) {
  if (!timeline || !edgeId) return null;
  return timeline.find(step => step.edgeId === edgeId) || null;
}

/**
 * Get step by index
 */
export function getStepByIndex(timeline, index) {
  if (!timeline || index < 1 || index > timeline.length) return null;
  return timeline.find(step => step.index === index) || null;
}

/**
 * Get timeline duration (first to last timestamp)
 */
export function getTimelineDuration(timeline) {
  if (!timeline || timeline.length < 2) return 0;
  
  const timestamps = timeline.map(s => s.timestamp).filter(t => t > 0);
  if (timestamps.length < 2) return 0;
  
  return Math.max(...timestamps) - Math.min(...timestamps);
}

/**
 * Group timeline by chain
 */
export function groupTimelineByChain(timeline) {
  if (!timeline || timeline.length === 0) return {};
  
  const groups = {};
  for (const step of timeline) {
    const chain = step.chain || 'unknown';
    if (!groups[chain]) {
      groups[chain] = [];
    }
    groups[chain].push(step);
  }
  return groups;
}

/**
 * Get unique chains in timeline
 */
export function getTimelineChains(timeline) {
  if (!timeline || timeline.length === 0) return [];
  
  const chains = new Set();
  for (const step of timeline) {
    if (step.chain) chains.add(step.chain);
    if (step.chainFrom) chains.add(step.chainFrom);
    if (step.chainTo) chains.add(step.chainTo);
  }
  return Array.from(chains);
}

/**
 * Get timeline summary stats
 */
export function getTimelineStats(timeline) {
  if (!timeline || timeline.length === 0) {
    return {
      totalSteps: 0,
      uniqueChains: 0,
      hasBridge: false,
      hasCexExit: false,
      hasSwap: false,
      duration: 0,
    };
  }
  
  return {
    totalSteps: timeline.length,
    uniqueChains: getTimelineChains(timeline).length,
    hasBridge: timeline.some(s => s.type === TIMELINE_STEP_TYPES.BRIDGE),
    hasCexExit: timeline.some(s => s.type === TIMELINE_STEP_TYPES.CEX_DEPOSIT),
    hasSwap: timeline.some(s => s.type === TIMELINE_STEP_TYPES.SWAP),
    duration: getTimelineDuration(timeline),
  };
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp) {
  if (!timestamp || timestamp <= 0) return 'Unknown';
  
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format duration
 */
export function formatDuration(durationMs) {
  if (!durationMs || durationMs <= 0) return '0s';
  
  const seconds = Math.floor(durationMs / 1000);
  if (seconds < 60) return `${seconds}s`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

export default {
  mapGraphToTimeline,
  getStepByEdgeId,
  getStepByIndex,
  getTimelineDuration,
  groupTimelineByChain,
  getTimelineChains,
  getTimelineStats,
  formatTimestamp,
  formatDuration,
};
