/**
 * Graph Intelligence Store (P1.8)
 * 
 * Simple store for graph intelligence state.
 * NOT a React component - no rendering dependencies.
 * Can be used with any state management.
 */

import { create } from 'zustand';
import { FOCUS_MODES } from '../graph/graphFocus.selector';

// ============================================
// Store Definition
// ============================================

const useGraphIntelligenceStore = create((set, get) => ({
  // ============================================
  // State
  // ============================================
  
  // Current graph data
  graph: null,
  
  // Loading state
  loading: false,
  error: null,
  
  // UI state (P1.8.C - updated focusMode)
  focusMode: FOCUS_MODES.ALL,  // 'ALL' | 'PATH_ONLY' | 'PATH_PLUS_NEIGHBOURS'
  highlightEnabled: true,
  selectedEdgeId: null,
  selectedSegment: null,  // P1.8.E - edge click explain
  
  // ============================================
  // Actions
  // ============================================
  
  /**
   * Set graph data from API response
   */
  setGraph: (graphData) => set({
    graph: graphData,
    error: null,
  }),
  
  /**
   * Clear graph data
   */
  clearGraph: () => set({
    graph: null,
    error: null,
    selectedEdgeId: null,
  }),
  
  /**
   * Set loading state
   */
  setLoading: (loading) => set({ loading }),
  
  /**
   * Set error state
   */
  setError: (error) => set({ 
    error, 
    loading: false 
  }),
  
  /**
   * Toggle focus mode (cycle through modes)
   */
  toggleFocusMode: () => set((state) => {
    const modes = [FOCUS_MODES.ALL, FOCUS_MODES.PATH_ONLY, FOCUS_MODES.PATH_PLUS_NEIGHBOURS];
    const currentIndex = modes.indexOf(state.focusMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    return { focusMode: modes[nextIndex] };
  }),
  
  /**
   * Set focus mode
   */
  setFocusMode: (focusMode) => set({ focusMode }),
  
  /**
   * Toggle highlight enabled
   */
  toggleHighlight: () => set((state) => ({
    highlightEnabled: !state.highlightEnabled,
  })),
  
  /**
   * Set highlight enabled
   */
  setHighlightEnabled: (highlightEnabled) => set({ highlightEnabled }),
  
  /**
   * Select an edge (for tooltip/details)
   */
  selectEdge: (edgeId) => set({ selectedEdgeId: edgeId }),
  
  /**
   * Set selected segment (P1.8.E)
   */
  setSelectedSegment: (segment) => set({ selectedSegment: segment }),
  
  /**
   * Clear edge selection
   */
  clearEdgeSelection: () => set({ selectedEdgeId: null, selectedSegment: null }),
  
  // ============================================
  // Derived Selectors
  // ============================================
  
  /**
   * Get highlighted edges
   */
  getHighlightedEdges: () => {
    const { graph } = get();
    if (!graph || !graph.highlightedPath) return [];
    
    const edgeIds = new Set(graph.highlightedPath.map(step => step.edgeId));
    return graph.edges.filter(edge => edgeIds.has(edge.id));
  },
  
  /**
   * Get highlighted node IDs
   */
  getHighlightedNodeIds: () => {
    const { graph } = get();
    if (!graph || !graph.highlightedPath || !graph.edges) return new Set();
    
    const edgeIds = new Set(graph.highlightedPath.map(step => step.edgeId));
    const nodeIds = new Set();
    
    for (const edge of graph.edges) {
      if (edgeIds.has(edge.id)) {
        nodeIds.add(edge.fromNodeId);
        nodeIds.add(edge.toNodeId);
      }
    }
    
    return nodeIds;
  },
  
  /**
   * Get risk summary
   */
  getRiskSummary: () => {
    const { graph } = get();
    return graph?.riskSummary || null;
  },
  
  /**
   * Get explain block
   */
  getExplain: () => {
    const { graph } = get();
    return graph?.explain || null;
  },
  
  /**
   * Get highlighted path steps
   */
  getHighlightedPath: () => {
    const { graph } = get();
    return graph?.highlightedPath || [];
  },
  
  /**
   * Get selected edge details
   */
  getSelectedEdge: () => {
    const { graph, selectedEdgeId } = get();
    if (!graph || !selectedEdgeId) return null;
    
    const edge = graph.edges.find(e => e.id === selectedEdgeId);
    if (!edge) return null;
    
    const step = graph.highlightedPath?.find(s => s.edgeId === selectedEdgeId);
    
    return {
      edge,
      step,
      isHighlighted: !!step,
    };
  },
  
  /**
   * Check if graph has data
   */
  hasGraph: () => {
    const { graph } = get();
    return graph !== null && graph.nodes?.length > 0;
  },
  
  /**
   * Get snapshot metadata
   */
  getMetadata: () => {
    const { graph } = get();
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
    };
  },
}));

export default useGraphIntelligenceStore;
