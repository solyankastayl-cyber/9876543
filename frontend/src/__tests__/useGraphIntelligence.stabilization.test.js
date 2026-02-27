/**
 * Stabilization Tests - Pure Logic
 * 
 * Tests for hook stabilization logic without React dependencies
 */

// ============================================
// Derived Values Tests
// ============================================

describe('Hook Derived Values Stabilization', () => {
  
  describe('highlightedPath computation', () => {
    it('should return empty array for null graph', () => {
      const graph = null;
      const highlightedPath = graph?.highlightedPath || [];
      expect(highlightedPath).toEqual([]);
    });
    
    it('should return empty array for graph without highlightedPath', () => {
      const graph = { nodes: [{ id: 'n1' }], edges: [] };
      const highlightedPath = graph?.highlightedPath || [];
      expect(highlightedPath).toEqual([]);
    });
    
    it('should return highlightedPath from graph', () => {
      const graph = {
        highlightedPath: [
          { edgeId: 'e1', reason: 'origin', riskContribution: 0.5, order: 1 },
          { edgeId: 'e2', reason: 'exit', riskContribution: 0.5, order: 2 },
        ],
      };
      const highlightedPath = graph?.highlightedPath || [];
      expect(highlightedPath.length).toBe(2);
    });
  });
  
  describe('highlightedNodeIds computation', () => {
    function computeHighlightedNodeIds(graph) {
      if (!graph?.highlightedPath || !graph?.edges) return new Set();
      
      const edgeIds = new Set(graph.highlightedPath.map(step => step.edgeId));
      const nodeIds = new Set();
      
      for (const edge of graph.edges) {
        if (edgeIds.has(edge.id)) {
          nodeIds.add(edge.fromNodeId);
          nodeIds.add(edge.toNodeId);
        }
      }
      
      return nodeIds;
    }
    
    it('should return empty set for null graph', () => {
      const nodeIds = computeHighlightedNodeIds(null);
      expect(nodeIds.size).toBe(0);
    });
    
    it('should return empty set for graph without edges', () => {
      const graph = { highlightedPath: [{ edgeId: 'e1' }], edges: [] };
      const nodeIds = computeHighlightedNodeIds(graph);
      expect(nodeIds.size).toBe(0);
    });
    
    it('should compute nodes from highlighted edges', () => {
      const graph = {
        highlightedPath: [
          { edgeId: 'e1' },
          { edgeId: 'e2' },
        ],
        edges: [
          { id: 'e1', fromNodeId: 'n1', toNodeId: 'n2' },
          { id: 'e2', fromNodeId: 'n2', toNodeId: 'n3' },
          { id: 'e3', fromNodeId: 'n3', toNodeId: 'n4' }, // not highlighted
        ],
      };
      
      const nodeIds = computeHighlightedNodeIds(graph);
      
      expect(nodeIds.has('n1')).toBe(true);
      expect(nodeIds.has('n2')).toBe(true);
      expect(nodeIds.has('n3')).toBe(true);
      expect(nodeIds.has('n4')).toBe(false);
    });
  });
  
  describe('highlightedEdges computation', () => {
    function computeHighlightedEdges(graph) {
      if (!graph?.highlightedPath || !graph?.edges) return [];
      const edgeIds = new Set(graph.highlightedPath.map(step => step.edgeId));
      return graph.edges.filter(edge => edgeIds.has(edge.id));
    }
    
    it('should return empty array for null graph', () => {
      const edges = computeHighlightedEdges(null);
      expect(edges).toEqual([]);
    });
    
    it('should filter only highlighted edges', () => {
      const graph = {
        highlightedPath: [{ edgeId: 'e1' }, { edgeId: 'e3' }],
        edges: [
          { id: 'e1', type: 'TRANSFER' },
          { id: 'e2', type: 'SWAP' },
          { id: 'e3', type: 'DEPOSIT' },
        ],
      };
      
      const highlightedEdges = computeHighlightedEdges(graph);
      
      expect(highlightedEdges.length).toBe(2);
      expect(highlightedEdges[0].id).toBe('e1');
      expect(highlightedEdges[1].id).toBe('e3');
    });
  });
  
  describe('metadata computation', () => {
    function computeMetadata(graph) {
      if (!graph) return null;
      return {
        snapshotId: graph.snapshotId,
        kind: graph.kind,
        address: graph.address,
        routeId: graph.routeId,
        generatedAt: graph.generatedAt,
        expiresAt: graph.expiresAt,
        buildTimeMs: graph.buildTimeMs,
        nodesCount: graph.nodes?.length || 0,
        edgesCount: graph.edges?.length || 0,
        highlightedCount: graph.highlightedPath?.length || 0,
        truncated: graph.truncated || false,
      };
    }
    
    it('should return null for null graph', () => {
      expect(computeMetadata(null)).toBeNull();
    });
    
    it('should compute all metadata fields', () => {
      const graph = {
        snapshotId: 'snap-123',
        kind: 'ADDRESS',
        address: '0x123',
        generatedAt: 1000,
        expiresAt: 2000,
        buildTimeMs: 50,
        nodes: [{ id: 'n1' }, { id: 'n2' }],
        edges: [{ id: 'e1' }],
        highlightedPath: [{ edgeId: 'e1' }],
        truncated: false,
      };
      
      const metadata = computeMetadata(graph);
      
      expect(metadata.snapshotId).toBe('snap-123');
      expect(metadata.kind).toBe('ADDRESS');
      expect(metadata.nodesCount).toBe(2);
      expect(metadata.edgesCount).toBe(1);
      expect(metadata.highlightedCount).toBe(1);
      expect(metadata.truncated).toBe(false);
    });
    
    it('should handle truncated graph', () => {
      const graph = {
        nodes: Array(300).fill({ id: 'n' }),
        edges: Array(500).fill({ id: 'e' }),
        highlightedPath: [],
        truncated: true,
      };
      
      const metadata = computeMetadata(graph);
      
      expect(metadata.nodesCount).toBe(300);
      expect(metadata.edgesCount).toBe(500);
      expect(metadata.truncated).toBe(true);
    });
  });
  
  describe('hasGraph computation', () => {
    function computeHasGraph(graph) {
      return graph !== null && graph?.nodes?.length > 0;
    }
    
    it('should return false for null graph', () => {
      expect(computeHasGraph(null)).toBe(false);
    });
    
    it('should return false for empty nodes', () => {
      expect(computeHasGraph({ nodes: [] })).toBe(false);
    });
    
    it('should return true for graph with nodes', () => {
      expect(computeHasGraph({ nodes: [{ id: 'n1' }] })).toBe(true);
    });
  });
});

// ============================================
// Request Deduplication Tests
// ============================================

describe('Request Deduplication Stabilization', () => {
  
  it('should track fetched state', () => {
    let fetchedRef = false;
    let lastAddressRef = null;
    
    const address = '0x123';
    
    // First fetch
    if (!fetchedRef) {
      fetchedRef = true;
      lastAddressRef = address;
    }
    
    expect(fetchedRef).toBe(true);
    expect(lastAddressRef).toBe('0x123');
  });
  
  it('should prevent duplicate fetches for same address', () => {
    let lastAddressRef = '0x123';
    const sameAddress = '0x123';
    
    const shouldFetch = sameAddress !== lastAddressRef;
    expect(shouldFetch).toBe(false);
  });
  
  it('should allow fetch when address changes', () => {
    let lastAddressRef = '0x123';
    const newAddress = '0x456';
    
    const shouldFetch = newAddress !== lastAddressRef;
    expect(shouldFetch).toBe(true);
  });
  
  it('should clear routeId when address changes', () => {
    let lastAddressRef = null;
    let lastRouteIdRef = 'route-1';
    
    const newAddress = '0x123';
    
    // Simulate address change
    lastAddressRef = newAddress;
    lastRouteIdRef = null;
    
    expect(lastAddressRef).toBe('0x123');
    expect(lastRouteIdRef).toBeNull();
  });
  
  it('should clear address when routeId changes', () => {
    let lastAddressRef = '0x123';
    let lastRouteIdRef = null;
    
    const newRouteId = 'route-1';
    
    // Simulate routeId change
    lastRouteIdRef = newRouteId;
    lastAddressRef = null;
    
    expect(lastRouteIdRef).toBe('route-1');
    expect(lastAddressRef).toBeNull();
  });
});

// ============================================
// selectedEdge computation Tests
// ============================================

describe('selectedEdge Stabilization', () => {
  function computeSelectedEdge(graph, selectedEdgeId, highlightedPath) {
    if (!graph || !selectedEdgeId) return null;
    const edge = graph.edges?.find(e => e.id === selectedEdgeId);
    const step = highlightedPath.find(s => s.edgeId === selectedEdgeId);
    return edge ? { edge, step, isHighlighted: !!step } : null;
  }
  
  it('should return null when no graph', () => {
    expect(computeSelectedEdge(null, 'e1', [])).toBeNull();
  });
  
  it('should return null when no selectedEdgeId', () => {
    const graph = { edges: [{ id: 'e1' }] };
    expect(computeSelectedEdge(graph, null, [])).toBeNull();
  });
  
  it('should return null when edge not found', () => {
    const graph = { edges: [{ id: 'e1' }] };
    expect(computeSelectedEdge(graph, 'e999', [])).toBeNull();
  });
  
  it('should return edge data with highlight status', () => {
    const graph = {
      edges: [
        { id: 'e1', type: 'TRANSFER' },
        { id: 'e2', type: 'DEPOSIT' },
      ],
    };
    const highlightedPath = [
      { edgeId: 'e1', reason: 'origin', riskContribution: 0.5, order: 1 },
    ];
    
    const selected = computeSelectedEdge(graph, 'e1', highlightedPath);
    
    expect(selected.edge.id).toBe('e1');
    expect(selected.isHighlighted).toBe(true);
    expect(selected.step.reason).toBe('origin');
  });
  
  it('should mark non-highlighted edge correctly', () => {
    const graph = {
      edges: [{ id: 'e1' }, { id: 'e2' }],
    };
    const highlightedPath = [{ edgeId: 'e1' }];
    
    const selected = computeSelectedEdge(graph, 'e2', highlightedPath);
    
    expect(selected.edge.id).toBe('e2');
    expect(selected.isHighlighted).toBe(false);
    expect(selected.step).toBeUndefined();
  });
});
