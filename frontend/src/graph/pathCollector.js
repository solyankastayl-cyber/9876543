/**
 * Path Collector - ETAP C
 * 
 * Collects connected nodes and edges from a starting point.
 * Used for active path highlighting.
 * 
 * ALGORITHM:
 * - DFS from start node
 * - Collect all connected nodes/edges
 * - Works with directed and undirected edges
 */

/**
 * Collect path from a starting node
 * 
 * @param {string} startNodeId - Node to start from
 * @param {object} graph - Graph data { nodes, edges }
 * @returns {{ nodes: Set<string>, edges: Set<string> }}
 */
export function collectPath(startNodeId, graph) {
  const visitedNodes = new Set();
  const visitedEdges = new Set();
  
  if (!graph?.edges || !startNodeId) {
    return { nodes: visitedNodes, edges: visitedEdges };
  }
  
  function dfs(nodeId) {
    if (visitedNodes.has(nodeId)) return;
    visitedNodes.add(nodeId);
    
    graph.edges.forEach(edge => {
      // Get source/target - handle both object and string references
      const sourceId = typeof edge.source === 'object' ? edge.source.id : (edge.source || edge.fromNodeId);
      const targetId = typeof edge.target === 'object' ? edge.target.id : (edge.target || edge.toNodeId);
      
      // Edge connects to current node
      if (sourceId === nodeId && !visitedEdges.has(edge.id)) {
        visitedEdges.add(edge.id);
        dfs(targetId);
      }
      
      if (targetId === nodeId && !visitedEdges.has(edge.id)) {
        visitedEdges.add(edge.id);
        dfs(sourceId);
      }
    });
  }
  
  dfs(startNodeId);
  
  return {
    nodes: visitedNodes,
    edges: visitedEdges,
  };
}

/**
 * Collect path from a starting edge
 * Includes both endpoints and their connected paths
 * 
 * @param {string} edgeId - Edge to start from
 * @param {object} graph - Graph data
 * @returns {{ nodes: Set<string>, edges: Set<string> }}
 */
export function collectPathFromEdge(edgeId, graph) {
  const edge = graph?.edges?.find(e => e.id === edgeId);
  if (!edge) {
    return { nodes: new Set(), edges: new Set() };
  }
  
  const sourceId = typeof edge.source === 'object' ? edge.source.id : (edge.source || edge.fromNodeId);
  const targetId = typeof edge.target === 'object' ? edge.target.id : (edge.target || edge.toNodeId);
  
  // Collect from both ends and merge
  const pathFromSource = collectPath(sourceId, graph);
  const pathFromTarget = collectPath(targetId, graph);
  
  return {
    nodes: new Set([...pathFromSource.nodes, ...pathFromTarget.nodes]),
    edges: new Set([...pathFromSource.edges, ...pathFromTarget.edges]),
  };
}

/**
 * Check if a path contains exit nodes
 */
export function pathHasExit(path, graph) {
  if (!path?.nodes || !graph?.nodes) return false;
  
  return graph.nodes.some(node => 
    path.nodes.has(node.id) && 
    (node.type === 'CROSS_CHAIN_EXIT' || node.id?.startsWith('exit:'))
  );
}
