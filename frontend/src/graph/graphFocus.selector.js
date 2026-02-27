/**
 * Graph Focus Selector (P1.8.C)
 * 
 * Applies focus mode to graph data.
 * Does NOT remove nodes - only marks them as dimmed.
 * No layout recalculation, pure view-state transformation.
 */

// Focus modes
export const FOCUS_MODES = {
  ALL: 'ALL',           // Show everything
  PATH_ONLY: 'PATH_ONLY', // Dim non-highlighted elements
  PATH_PLUS_NEIGHBOURS: 'PATH_PLUS_NEIGHBOURS', // Path + 1-hop
};

/**
 * Apply focus mode to graph
 * 
 * @param {Object} graph - { nodes, edges }
 * @param {string} mode - Focus mode
 * @param {Object} highlightedPath - { nodeIds: Set, edgeIds: Set }
 * @returns {Object} - { nodes, edges } with dimmed flags
 */
export function applyFocusMode(graph, mode, highlightedPath) {
  if (!graph || !graph.nodes || !graph.edges) {
    return { nodes: [], edges: [] };
  }
  
  // ALL mode - no dimming
  if (mode === FOCUS_MODES.ALL || !highlightedPath) {
    return {
      nodes: graph.nodes.map(n => ({ ...n, dimmed: false })),
      edges: graph.edges.map(e => ({ ...e, dimmed: false })),
    };
  }
  
  const { nodeIds, edgeIds } = highlightedPath;
  
  // PATH_ONLY mode - dim everything not in path
  if (mode === FOCUS_MODES.PATH_ONLY) {
    return {
      nodes: graph.nodes.map(n => ({
        ...n,
        dimmed: !nodeIds.has(n.id),
      })),
      edges: graph.edges.map(e => ({
        ...e,
        dimmed: !edgeIds.has(e.id),
      })),
    };
  }
  
  // PATH_PLUS_NEIGHBOURS - path + 1-hop connections
  if (mode === FOCUS_MODES.PATH_PLUS_NEIGHBOURS) {
    // Find 1-hop neighbours
    const neighbourNodeIds = new Set(nodeIds);
    
    for (const edge of graph.edges) {
      if (nodeIds.has(edge.fromNodeId)) {
        neighbourNodeIds.add(edge.toNodeId);
      }
      if (nodeIds.has(edge.toNodeId)) {
        neighbourNodeIds.add(edge.fromNodeId);
      }
    }
    
    // Find edges connecting to neighbours
    const visibleEdgeIds = new Set(edgeIds);
    for (const edge of graph.edges) {
      if (neighbourNodeIds.has(edge.fromNodeId) && neighbourNodeIds.has(edge.toNodeId)) {
        visibleEdgeIds.add(edge.id);
      }
    }
    
    return {
      nodes: graph.nodes.map(n => ({
        ...n,
        dimmed: !neighbourNodeIds.has(n.id),
      })),
      edges: graph.edges.map(e => ({
        ...e,
        dimmed: !visibleEdgeIds.has(e.id),
      })),
    };
  }
  
  // Default fallback
  return {
    nodes: graph.nodes.map(n => ({ ...n, dimmed: false })),
    edges: graph.edges.map(e => ({ ...e, dimmed: false })),
  };
}

/**
 * Derive highlighted path sets from steps
 * 
 * @param {Array} highlightedSteps - Array of { edgeId, ... }
 * @param {Array} edges - Array of edges
 * @returns {Object} - { nodeIds: Set, edgeIds: Set }
 */
export function deriveHighlightedSets(highlightedSteps, edges) {
  if (!highlightedSteps || highlightedSteps.length === 0) {
    return { nodeIds: new Set(), edgeIds: new Set() };
  }
  
  const edgeIds = new Set(highlightedSteps.map(s => s.edgeId));
  const nodeIds = new Set();
  
  for (const edge of edges) {
    if (edgeIds.has(edge.id)) {
      nodeIds.add(edge.fromNodeId);
      nodeIds.add(edge.toNodeId);
    }
  }
  
  return { nodeIds, edgeIds };
}

/**
 * Get focus mode label for UI
 */
export function getFocusModeLabel(mode) {
  const labels = {
    [FOCUS_MODES.ALL]: 'Full Graph',
    [FOCUS_MODES.PATH_ONLY]: 'Path Only',
    [FOCUS_MODES.PATH_PLUS_NEIGHBOURS]: 'Path + Neighbours',
  };
  return labels[mode] || mode;
}

/**
 * Get opacity value for dimmed state
 */
export function getDimmedOpacity(dimmed, type = 'node') {
  if (!dimmed) return 1.0;
  return type === 'node' ? 0.15 : 0.1;
}

export default {
  FOCUS_MODES,
  applyFocusMode,
  deriveHighlightedSets,
  getFocusModeLabel,
  getDimmedOpacity,
};
