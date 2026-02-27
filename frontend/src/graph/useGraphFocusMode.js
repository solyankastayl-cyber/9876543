/**
 * useGraphFocusMode Hook (P1.8)
 * 
 * Render-level filter for focus mode.
 * Does NOT modify source data.
 * Returns filtered arrays for rendering.
 */

import { useMemo } from 'react';

/**
 * Focus mode filter for graph data
 * 
 * @param {Array} nodes - All nodes
 * @param {Array} edges - All edges
 * @param {Array} highlightedPath - Highlighted path steps
 * @param {Object} options
 * @param {boolean} options.enabled - Whether focus mode is enabled
 * @param {boolean} options.includeNeighbours - Include 1-hop neighbours
 * @returns {Object} { nodes, edges, isFiltered }
 */
export function useGraphFocusMode(
  nodes,
  edges,
  highlightedPath,
  { enabled = false, includeNeighbours = false } = {}
) {
  return useMemo(() => {
    // If not enabled or no highlighted path, return all
    if (!enabled || !highlightedPath || highlightedPath.length === 0) {
      return {
        nodes,
        edges,
        isFiltered: false,
      };
    }
    
    // Build set of highlighted edge IDs
    const highlightedEdgeIds = new Set(highlightedPath.map(step => step.edgeId));
    
    // Build set of highlighted node IDs
    const highlightedNodeIds = new Set();
    for (const edge of edges) {
      if (highlightedEdgeIds.has(edge.id)) {
        highlightedNodeIds.add(edge.fromNodeId);
        highlightedNodeIds.add(edge.toNodeId);
      }
    }
    
    // If including neighbours, add 1-hop connections
    if (includeNeighbours) {
      const neighbourNodeIds = new Set();
      
      for (const edge of edges) {
        // If edge connects to a highlighted node, include the other node
        if (highlightedNodeIds.has(edge.fromNodeId)) {
          neighbourNodeIds.add(edge.toNodeId);
        }
        if (highlightedNodeIds.has(edge.toNodeId)) {
          neighbourNodeIds.add(edge.fromNodeId);
        }
      }
      
      // Merge neighbours into highlighted nodes
      for (const nodeId of neighbourNodeIds) {
        highlightedNodeIds.add(nodeId);
      }
    }
    
    // Filter nodes
    const filteredNodes = nodes.filter(node => highlightedNodeIds.has(node.id));
    
    // Filter edges - keep edges where BOTH nodes are in the filtered set
    const filteredEdges = edges.filter(edge => 
      highlightedNodeIds.has(edge.fromNodeId) && 
      highlightedNodeIds.has(edge.toNodeId)
    );
    
    return {
      nodes: filteredNodes,
      edges: filteredEdges,
      isFiltered: true,
      stats: {
        totalNodes: nodes.length,
        filteredNodes: filteredNodes.length,
        totalEdges: edges.length,
        filteredEdges: filteredEdges.length,
      }
    };
  }, [nodes, edges, highlightedPath, enabled, includeNeighbours]);
}

export default useGraphFocusMode;
