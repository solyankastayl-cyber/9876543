/**
 * Edge Explain Adapter (P1.8.E)
 * 
 * Maps edge clicks to segment explanations.
 * Pure lookup function, no side effects.
 */

/**
 * Find segment explanation for an edge
 * 
 * @param {Object} edge - Edge object with id
 * @param {Array} segments - Array of mapped segments
 * @returns {Object|null} - Segment data or null if not found
 */
export function explainEdge(edge, segments) {
  if (!edge || !edge.id || !segments || segments.length === 0) {
    return null;
  }
  
  return segments.find(s => s.edgeId === edge.id) || null;
}

/**
 * Find segment by edge ID
 * 
 * @param {string} edgeId - Edge ID
 * @param {Array} segments - Array of mapped segments
 * @returns {Object|null} - Segment data or null
 */
export function findSegmentByEdgeId(edgeId, segments) {
  if (!edgeId || !segments || segments.length === 0) {
    return null;
  }
  
  return segments.find(s => s.edgeId === edgeId) || null;
}

/**
 * Check if edge is in highlighted path
 * 
 * @param {string} edgeId - Edge ID
 * @param {Array} segments - Array of mapped segments
 * @returns {boolean}
 */
export function isEdgeInPath(edgeId, segments) {
  return findSegmentByEdgeId(edgeId, segments) !== null;
}

/**
 * Get edge risk contribution
 * 
 * @param {string} edgeId - Edge ID
 * @param {Array} segments - Array of mapped segments
 * @returns {number} - Risk contribution (0-1) or 0 if not found
 */
export function getEdgeRiskContribution(edgeId, segments) {
  const segment = findSegmentByEdgeId(edgeId, segments);
  return segment?.riskContribution || 0;
}

/**
 * Get edge explanation text
 * 
 * @param {Object} edge - Edge object
 * @param {Object} segment - Segment data (optional)
 * @returns {Object} - { title, description, details }
 */
export function getEdgeExplanation(edge, segment) {
  if (!edge) {
    return {
      title: 'Unknown Edge',
      description: 'No data available',
      details: [],
    };
  }
  
  const typeDescriptions = {
    TRANSFER: 'Simple token transfer between addresses',
    SWAP: 'Token swap on decentralized exchange',
    BRIDGE: 'Cross-chain bridge operation',
    DEPOSIT: 'Deposit to centralized exchange',
    WITHDRAW: 'Withdrawal from centralized exchange',
    CONTRACT_CALL: 'Smart contract interaction',
  };
  
  const details = [];
  
  // Chain info
  if (edge.chainFrom && edge.chainTo) {
    details.push({ label: 'Bridge', value: `${edge.chainFrom} → ${edge.chainTo}` });
  } else if (edge.chain) {
    details.push({ label: 'Chain', value: edge.chain });
  }
  
  // Protocol
  if (edge.meta?.protocol) {
    details.push({ label: 'Protocol', value: edge.meta.protocol });
  }
  
  // Amount
  if (edge.meta?.amountUsd) {
    details.push({ label: 'Amount', value: `$${edge.meta.amountUsd.toLocaleString()}` });
  } else if (edge.meta?.amount) {
    details.push({ label: 'Amount', value: `${edge.meta.amount} ${edge.meta.token || ''}` });
  }
  
  // Segment-specific info
  if (segment) {
    details.push({ 
      label: 'Risk Contribution', 
      value: `${(segment.riskContribution * 100).toFixed(0)}%`,
      highlight: segment.riskContribution > 0.3,
    });
    
    details.push({
      label: 'Path Step',
      value: `#${segment.order + 1} - ${segment.shortLabel}`,
    });
  }
  
  return {
    title: edge.type,
    description: typeDescriptions[edge.type] || 'Edge operation',
    isHighlighted: !!segment,
    reason: segment?.reason,
    reasonLabel: segment?.shortLabel,
    details,
  };
}

/**
 * Get previous and next segments in path
 * 
 * @param {string} edgeId - Current edge ID
 * @param {Array} segments - Array of mapped segments
 * @returns {Object} - { prev, current, next }
 */
export function getSegmentContext(edgeId, segments) {
  if (!edgeId || !segments || segments.length === 0) {
    return { prev: null, current: null, next: null };
  }
  
  const currentIndex = segments.findIndex(s => s.edgeId === edgeId);
  
  if (currentIndex === -1) {
    return { prev: null, current: null, next: null };
  }
  
  return {
    prev: currentIndex > 0 ? segments[currentIndex - 1] : null,
    current: segments[currentIndex],
    next: currentIndex < segments.length - 1 ? segments[currentIndex + 1] : null,
  };
}

/**
 * Get tooltip position based on edge
 * 
 * @param {Object} edge - Edge with position data
 * @param {Object} bounds - Container bounds
 * @returns {Object} - { x, y, position }
 */
export function getTooltipPosition(edge, bounds) {
  // Default to top-left of container
  if (!edge || !bounds) {
    return { x: 16, y: 16, position: 'top-left' };
  }
  
  // Calculate based on edge midpoint if available
  const x = Math.min(bounds.width - 280, 16);
  const y = 16;
  
  return { x, y, position: 'top-left' };
}

export default {
  explainEdge,
  findSegmentByEdgeId,
  isEdgeInPath,
  getEdgeRiskContribution,
  getEdgeExplanation,
  getSegmentContext,
  getTooltipPosition,
};
