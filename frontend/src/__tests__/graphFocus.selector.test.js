/**
 * Graph Focus Selector Tests (P1.8.C)
 * 
 * Unit tests for focus mode selector logic.
 * Tests dimmed state application without UI rendering.
 */

import { 
  applyFocusMode, 
  deriveHighlightedSets, 
  FOCUS_MODES,
  getDimmedOpacity 
} from '../graph/graphFocus.selector';

describe('graphFocus.selector', () => {
  // Test data
  const mockNodes = [
    { id: 'node-1', type: 'WALLET', displayName: 'Wallet 1' },
    { id: 'node-2', type: 'CEX', displayName: 'Binance' },
    { id: 'node-3', type: 'DEX', displayName: 'Uniswap' },
    { id: 'node-4', type: 'BRIDGE', displayName: 'Stargate' },
  ];
  
  const mockEdges = [
    { id: 'edge-1', fromNodeId: 'node-1', toNodeId: 'node-2', type: 'TRANSFER' },
    { id: 'edge-2', fromNodeId: 'node-2', toNodeId: 'node-3', type: 'SWAP' },
    { id: 'edge-3', fromNodeId: 'node-3', toNodeId: 'node-4', type: 'BRIDGE' },
    { id: 'edge-4', fromNodeId: 'node-4', toNodeId: 'node-2', type: 'DEPOSIT' },
  ];
  
  const mockGraph = { nodes: mockNodes, edges: mockEdges };
  
  const mockHighlightedSteps = [
    { edgeId: 'edge-1', reason: 'origin_of_route', riskContribution: 0.1 },
    { edgeId: 'edge-4', reason: 'exit_to_cex', riskContribution: 0.5 },
  ];
  
  describe('deriveHighlightedSets', () => {
    test('should derive node and edge IDs from highlighted steps', () => {
      const result = deriveHighlightedSets(mockHighlightedSteps, mockEdges);
      
      expect(result.edgeIds.size).toBe(2);
      expect(result.edgeIds.has('edge-1')).toBe(true);
      expect(result.edgeIds.has('edge-4')).toBe(true);
      
      expect(result.nodeIds.size).toBe(3); // node-1, node-2, node-4
      expect(result.nodeIds.has('node-1')).toBe(true);
      expect(result.nodeIds.has('node-2')).toBe(true);
      expect(result.nodeIds.has('node-4')).toBe(true);
      expect(result.nodeIds.has('node-3')).toBe(false);
    });
    
    test('should return empty sets for empty input', () => {
      const result = deriveHighlightedSets([], mockEdges);
      expect(result.edgeIds.size).toBe(0);
      expect(result.nodeIds.size).toBe(0);
    });
    
    test('should handle null input', () => {
      const result = deriveHighlightedSets(null, mockEdges);
      expect(result.edgeIds.size).toBe(0);
      expect(result.nodeIds.size).toBe(0);
    });
  });
  
  describe('applyFocusMode - ALL mode', () => {
    test('should not dim any nodes or edges', () => {
      const highlightedSets = deriveHighlightedSets(mockHighlightedSteps, mockEdges);
      const result = applyFocusMode(mockGraph, FOCUS_MODES.ALL, highlightedSets);
      
      expect(result.nodes.every(n => n.dimmed === false)).toBe(true);
      expect(result.edges.every(e => e.dimmed === false)).toBe(true);
    });
    
    test('should preserve original node/edge data', () => {
      const highlightedSets = deriveHighlightedSets(mockHighlightedSteps, mockEdges);
      const result = applyFocusMode(mockGraph, FOCUS_MODES.ALL, highlightedSets);
      
      expect(result.nodes.length).toBe(mockNodes.length);
      expect(result.edges.length).toBe(mockEdges.length);
      expect(result.nodes[0].id).toBe('node-1');
    });
  });
  
  describe('applyFocusMode - PATH_ONLY mode', () => {
    test('should dim non-path nodes', () => {
      const highlightedSets = deriveHighlightedSets(mockHighlightedSteps, mockEdges);
      const result = applyFocusMode(mockGraph, FOCUS_MODES.PATH_ONLY, highlightedSets);
      
      // node-3 is not in path
      const node3 = result.nodes.find(n => n.id === 'node-3');
      expect(node3.dimmed).toBe(true);
      
      // node-1, node-2, node-4 are in path
      const node1 = result.nodes.find(n => n.id === 'node-1');
      const node2 = result.nodes.find(n => n.id === 'node-2');
      const node4 = result.nodes.find(n => n.id === 'node-4');
      expect(node1.dimmed).toBe(false);
      expect(node2.dimmed).toBe(false);
      expect(node4.dimmed).toBe(false);
    });
    
    test('should dim non-path edges', () => {
      const highlightedSets = deriveHighlightedSets(mockHighlightedSteps, mockEdges);
      const result = applyFocusMode(mockGraph, FOCUS_MODES.PATH_ONLY, highlightedSets);
      
      // edge-2, edge-3 are not in path
      const edge2 = result.edges.find(e => e.id === 'edge-2');
      const edge3 = result.edges.find(e => e.id === 'edge-3');
      expect(edge2.dimmed).toBe(true);
      expect(edge3.dimmed).toBe(true);
      
      // edge-1, edge-4 are in path
      const edge1 = result.edges.find(e => e.id === 'edge-1');
      const edge4 = result.edges.find(e => e.id === 'edge-4');
      expect(edge1.dimmed).toBe(false);
      expect(edge4.dimmed).toBe(false);
    });
  });
  
  describe('applyFocusMode - PATH_PLUS_NEIGHBOURS mode', () => {
    test('should include 1-hop neighbours', () => {
      const highlightedSets = deriveHighlightedSets(mockHighlightedSteps, mockEdges);
      const result = applyFocusMode(mockGraph, FOCUS_MODES.PATH_PLUS_NEIGHBOURS, highlightedSets);
      
      // node-3 is 1-hop neighbour of node-2 and node-4
      const node3 = result.nodes.find(n => n.id === 'node-3');
      expect(node3.dimmed).toBe(false);
    });
  });
  
  describe('applyFocusMode - edge cases', () => {
    test('should handle empty graph', () => {
      const result = applyFocusMode({ nodes: [], edges: [] }, FOCUS_MODES.PATH_ONLY, null);
      expect(result.nodes).toEqual([]);
      expect(result.edges).toEqual([]);
    });
    
    test('should handle null graph', () => {
      const result = applyFocusMode(null, FOCUS_MODES.PATH_ONLY, null);
      expect(result.nodes).toEqual([]);
      expect(result.edges).toEqual([]);
    });
    
    test('should fallback to ALL mode for empty path', () => {
      const result = applyFocusMode(mockGraph, FOCUS_MODES.PATH_ONLY, { nodeIds: new Set(), edgeIds: new Set() });
      // With empty path, everything should be dimmed in PATH_ONLY
      expect(result.nodes.every(n => n.dimmed === true)).toBe(true);
    });
  });
  
  describe('getDimmedOpacity', () => {
    test('should return 1.0 for non-dimmed', () => {
      expect(getDimmedOpacity(false, 'node')).toBe(1.0);
      expect(getDimmedOpacity(false, 'edge')).toBe(1.0);
    });
    
    test('should return low opacity for dimmed node', () => {
      expect(getDimmedOpacity(true, 'node')).toBe(0.15);
    });
    
    test('should return very low opacity for dimmed edge', () => {
      expect(getDimmedOpacity(true, 'edge')).toBe(0.1);
    });
  });
});
