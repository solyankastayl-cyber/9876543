/**
 * Graph Highlight Adapter (P1.8)
 * 
 * CRITICAL: This is the heart of P1.8
 * 
 * Applies highlighting to existing graph nodes/edges.
 * Does NOT create new nodes.
 * Does NOT change layout.
 * Only adds visual properties.
 */

// ============================================
// Constants
// ============================================

// Colors by edge type (for highlighted edges)
const EDGE_TYPE_COLORS = {
  TRANSFER: '#6B7280',    // gray
  SWAP: '#10B981',        // green
  BRIDGE: '#F59E0B',      // amber
  DEPOSIT: '#EF4444',     // red (exit to CEX)
  WITHDRAW: '#3B82F6',    // blue
  CONTRACT_CALL: '#8B5CF6', // purple
};

// Opacity for non-highlighted elements
const DIM_OPACITY = 0.15;

// Opacity for highlighted elements
const HIGHLIGHT_OPACITY = 1.0;

// Stroke width multiplier for highlighted edges
const HIGHLIGHT_WIDTH_MULTIPLIER = 2.0;

// ============================================
// Main Adapter Function
// ============================================

/**
 * Apply highlighting to nodes and edges based on highlightedPath
 * 
 * @param {Object} params
 * @param {Array} params.nodes - Original nodes array
 * @param {Array} params.edges - Original edges array
 * @param {Array} params.highlightedPath - Array of { edgeId, reason, riskContribution, order }
 * @param {boolean} params.enabled - Whether highlighting is enabled
 * @returns {Object} { nodes, edges } with highlight properties applied
 */
export function applyHighlighting({ nodes, edges, highlightedPath, enabled = true }) {
  if (!enabled || !highlightedPath || highlightedPath.length === 0) {
    // No highlighting - return original with default properties
    return {
      nodes: nodes.map(node => ({
        ...node,
        _highlight: {
          isHighlighted: false,
          opacity: 1.0,
        }
      })),
      edges: edges.map(edge => ({
        ...edge,
        _highlight: {
          isHighlighted: false,
          opacity: 1.0,
          strokeWidth: getBaseStrokeWidth(edge),
          color: getEdgeColor(edge.type),
        }
      }))
    };
  }
  
  // Build sets for O(1) lookup
  const highlightedEdgeIds = new Set(highlightedPath.map(step => step.edgeId));
  const highlightedNodeIds = new Set();
  
  // Collect node IDs from highlighted edges
  for (const edge of edges) {
    if (highlightedEdgeIds.has(edge.id)) {
      highlightedNodeIds.add(edge.fromNodeId);
      highlightedNodeIds.add(edge.toNodeId);
    }
  }
  
  // Build step lookup for edge metadata
  const stepByEdgeId = new Map();
  for (const step of highlightedPath) {
    stepByEdgeId.set(step.edgeId, step);
  }
  
  // Apply highlighting to edges
  const highlightedEdges = edges.map(edge => {
    const isHighlighted = highlightedEdgeIds.has(edge.id);
    const step = stepByEdgeId.get(edge.id);
    
    return {
      ...edge,
      _highlight: {
        isHighlighted,
        opacity: isHighlighted ? HIGHLIGHT_OPACITY : DIM_OPACITY,
        strokeWidth: isHighlighted 
          ? getBaseStrokeWidth(edge) * HIGHLIGHT_WIDTH_MULTIPLIER 
          : getBaseStrokeWidth(edge),
        color: getEdgeColor(edge.type),
        // Additional metadata for highlighted edges
        reason: step?.reason,
        riskContribution: step?.riskContribution,
        order: step?.order,
      }
    };
  });
  
  // Apply highlighting to nodes
  const highlightedNodes = nodes.map(node => {
    const isHighlighted = highlightedNodeIds.has(node.id);
    
    return {
      ...node,
      _highlight: {
        isHighlighted,
        opacity: isHighlighted ? HIGHLIGHT_OPACITY : DIM_OPACITY,
      }
    };
  });
  
  return {
    nodes: highlightedNodes,
    edges: highlightedEdges,
  };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get base stroke width for edge
 */
function getBaseStrokeWidth(edge) {
  // Can be based on amount, confidence, or type
  if (edge.type === 'DEPOSIT' || edge.type === 'WITHDRAW') {
    return 2.5;
  }
  if (edge.type === 'BRIDGE') {
    return 2.0;
  }
  return 1.5;
}

/**
 * Get color for edge type
 */
function getEdgeColor(type) {
  return EDGE_TYPE_COLORS[type] || EDGE_TYPE_COLORS.TRANSFER;
}

/**
 * Get step reason label for display
 */
export function getReasonLabel(reason) {
  const labels = {
    'origin_of_route': 'Origin',
    'cross_chain_migration': 'Bridge',
    'pre_exit_swap': 'Pre-Exit Swap',
    'exit_to_cex': 'CEX Exit',
    'mixing_pattern': 'Mixing',
    'high_value_transfer': 'High Value',
    'suspicious_timing': 'Suspicious Timing',
    'known_risk_address': 'Known Risk',
  };
  return labels[reason] || reason;
}

/**
 * Get color for reason (for badges/tooltips)
 */
export function getReasonColor(reason) {
  const colors = {
    'origin_of_route': '#6B7280',     // gray
    'cross_chain_migration': '#F59E0B', // amber
    'pre_exit_swap': '#10B981',        // green
    'exit_to_cex': '#EF4444',          // red
    'mixing_pattern': '#EF4444',       // red
    'high_value_transfer': '#8B5CF6',  // purple
    'suspicious_timing': '#F59E0B',    // amber
    'known_risk_address': '#EF4444',   // red
  };
  return colors[reason] || '#6B7280';
}

/**
 * Get severity color
 */
export function getSeverityColor(severity) {
  const colors = {
    'CRITICAL': '#DC2626',
    'HIGH': '#EF4444',
    'MEDIUM': '#F59E0B',
    'LOW': '#6B7280',
  };
  return colors[severity] || '#6B7280';
}

/**
 * Get severity badge class
 */
export function getSeverityBadgeClass(severity) {
  const classes = {
    'CRITICAL': 'bg-red-600 text-white',
    'HIGH': 'bg-red-100 text-red-700',
    'MEDIUM': 'bg-amber-100 text-amber-700',
    'LOW': 'bg-gray-100 text-gray-600',
  };
  return classes[severity] || 'bg-gray-100 text-gray-600';
}

/**
 * Check if edge is in highlighted path
 */
export function isEdgeHighlighted(edgeId, highlightedPath) {
  if (!highlightedPath || highlightedPath.length === 0) return false;
  return highlightedPath.some(step => step.edgeId === edgeId);
}

/**
 * Get edge step from highlighted path
 */
export function getEdgeStep(edgeId, highlightedPath) {
  if (!highlightedPath || highlightedPath.length === 0) return null;
  return highlightedPath.find(step => step.edgeId === edgeId) || null;
}

export default {
  applyHighlighting,
  getReasonLabel,
  getReasonColor,
  getSeverityColor,
  getSeverityBadgeClass,
  isEdgeHighlighted,
  getEdgeStep,
  EDGE_TYPE_COLORS,
  DIM_OPACITY,
  HIGHLIGHT_OPACITY,
};
