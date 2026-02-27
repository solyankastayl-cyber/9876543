/**
 * Graph ↔ Timeline Sync Controller (P1.9.C)
 * 
 * Single source of truth for synchronization between Graph and Timeline.
 * 
 * ARCHITECTURAL INVARIANTS:
 * 1. This is the ONLY place where sync decisions are made
 * 2. All sync events MUST include { source } 
 * 3. Same-source events are IGNORED (no feedback loops)
 * 4. Highlight ≠ Rebuild (no recompute selectors)
 * 5. Truncated graphs → sync only by highlightedPath
 */

// ============================================
// Sync Event Sources
// ============================================

export const SYNC_SOURCES = {
  TIMELINE: 'timeline',
  GRAPH: 'graph',
  EXTERNAL: 'external', // For programmatic triggers
};

// ============================================
// Sync Event Types
// ============================================

export const SYNC_EVENT_TYPES = {
  STEP_HOVER: 'step_hover',
  STEP_CLICK: 'step_click',
  NODE_CLICK: 'node_click',
  EDGE_CLICK: 'edge_click',
  CLEAR: 'clear',
};

// ============================================
// Sync Controller State
// ============================================

let lastEventSource = null;
let lastEventTimestamp = 0;
const DEBOUNCE_MS = 50; // Prevent rapid same-source events

// ============================================
// Core Sync Controller
// ============================================

/**
 * Create a sync controller instance
 * 
 * @param {Object} options
 * @param {Function} options.onHighlightNode - Callback to highlight node in graph
 * @param {Function} options.onHighlightEdge - Callback to highlight edge in graph  
 * @param {Function} options.onScrollToStep - Callback to scroll timeline to step
 * @param {Function} options.onClearHighlight - Callback to clear all highlights
 * @param {Function} options.getGraphState - Function to get current graph state
 */
export function createSyncController({
  onHighlightNode,
  onHighlightEdge,
  onScrollToStep,
  onClearHighlight,
  getGraphState,
}) {
  
  /**
   * Check if event should be processed
   * Implements source-aware guard
   */
  function shouldProcessEvent(source, eventType) {
    const now = Date.now();
    
    // Same source within debounce window → ignore
    if (source === lastEventSource && (now - lastEventTimestamp) < DEBOUNCE_MS) {
      return false;
    }
    
    lastEventSource = source;
    lastEventTimestamp = now;
    return true;
  }
  
  /**
   * Get graph state with guards
   */
  function getState() {
    const state = getGraphState?.() || {};
    return {
      focusMode: state.focusMode || 'ALL',
      truncated: state.truncated || false,
      highlightedPath: state.highlightedPath || [],
      edges: state.edges || [],
      nodes: state.nodes || [],
    };
  }
  
  /**
   * Check if node/edge is in highlighted path
   */
  function isInHighlightedPath(id, type = 'edge') {
    const state = getState();
    
    if (type === 'edge') {
      return state.highlightedPath.some(step => step.edgeId === id);
    }
    
    // For nodes, check if node is endpoint of any highlighted edge
    const highlightedEdgeIds = new Set(state.highlightedPath.map(s => s.edgeId));
    return state.edges.some(edge => 
      highlightedEdgeIds.has(edge.id) && 
      (edge.fromNodeId === id || edge.toNodeId === id)
    );
  }
  
  /**
   * Find step by edge ID
   */
  function findStepByEdgeId(edgeId) {
    const state = getState();
    return state.highlightedPath.find(step => step.edgeId === edgeId);
  }
  
  /**
   * Find edge by node ID (first matching highlighted edge)
   */
  function findEdgeByNodeId(nodeId) {
    const state = getState();
    const highlightedEdgeIds = new Set(state.highlightedPath.map(s => s.edgeId));
    
    return state.edges.find(edge => 
      highlightedEdgeIds.has(edge.id) && 
      (edge.fromNodeId === nodeId || edge.toNodeId === nodeId)
    );
  }
  
  // ============================================
  // Public Sync Methods
  // ============================================
  
  return {
    /**
     * Handle Timeline → Graph sync
     * Called when user interacts with timeline step
     */
    syncFromTimeline(event) {
      const { type, stepId, edgeId, source = SYNC_SOURCES.TIMELINE } = event;
      
      // Source guard
      if (!shouldProcessEvent(source, type)) {
        return { synced: false, reason: 'source_guard' };
      }
      
      const state = getState();
      
      // Truncated guard: only sync highlightedPath items
      if (state.truncated && edgeId && !isInHighlightedPath(edgeId, 'edge')) {
        return { synced: false, reason: 'truncated_guard' };
      }
      
      // PATH_ONLY guard: don't sync neighbours
      if (state.focusMode === 'PATH_ONLY') {
        if (edgeId && !isInHighlightedPath(edgeId, 'edge')) {
          return { synced: false, reason: 'focus_mode_guard' };
        }
      }
      
      // Process event
      switch (type) {
        case SYNC_EVENT_TYPES.STEP_CLICK:
        case SYNC_EVENT_TYPES.STEP_HOVER:
          if (edgeId) {
            onHighlightEdge?.(edgeId);
            return { synced: true, target: 'graph', edgeId };
          }
          break;
          
        case SYNC_EVENT_TYPES.CLEAR:
          onClearHighlight?.();
          return { synced: true, target: 'both' };
          
        default:
          return { synced: false, reason: 'unknown_event' };
      }
      
      return { synced: false, reason: 'no_action' };
    },
    
    /**
     * Handle Graph → Timeline sync
     * Called when user interacts with graph node/edge
     */
    syncFromGraph(event) {
      const { type, nodeId, edgeId, source = SYNC_SOURCES.GRAPH } = event;
      
      // Source guard
      if (!shouldProcessEvent(source, type)) {
        return { synced: false, reason: 'source_guard' };
      }
      
      const state = getState();
      
      // Process event
      switch (type) {
        case SYNC_EVENT_TYPES.NODE_CLICK: {
          if (!nodeId) return { synced: false, reason: 'no_node_id' };
          
          // Find edge connected to this node in highlighted path
          const edge = findEdgeByNodeId(nodeId);
          if (!edge) {
            // Silent ignore if node not in path
            return { synced: false, reason: 'node_not_in_path' };
          }
          
          const step = findStepByEdgeId(edge.id);
          if (step) {
            onScrollToStep?.(step.edgeId);
            return { synced: true, target: 'timeline', edgeId: edge.id };
          }
          return { synced: false, reason: 'step_not_found' };
        }
        
        case SYNC_EVENT_TYPES.EDGE_CLICK: {
          if (!edgeId) return { synced: false, reason: 'no_edge_id' };
          
          // Truncated guard
          if (state.truncated && !isInHighlightedPath(edgeId, 'edge')) {
            return { synced: false, reason: 'truncated_guard' };
          }
          
          const step = findStepByEdgeId(edgeId);
          if (step) {
            onScrollToStep?.(step.edgeId);
            return { synced: true, target: 'timeline', edgeId };
          }
          return { synced: false, reason: 'step_not_found' };
        }
        
        case SYNC_EVENT_TYPES.CLEAR:
          onClearHighlight?.();
          return { synced: true, target: 'both' };
          
        default:
          return { synced: false, reason: 'unknown_event' };
      }
    },
    
    /**
     * Get mapping utilities for components
     */
    utils: {
      findStepByEdgeId,
      findEdgeByNodeId,
      isInHighlightedPath,
      getState,
    },
    
    /**
     * Reset controller state (for testing)
     */
    reset() {
      lastEventSource = null;
      lastEventTimestamp = 0;
    },
  };
}

// ============================================
// Mapping Utilities (Pure Functions)
// ============================================

/**
 * Map edge ID to timeline step index
 * Returns -1 if not found
 */
export function mapEdgeToStepIndex(edgeId, highlightedPath) {
  if (!edgeId || !highlightedPath?.length) return -1;
  return highlightedPath.findIndex(step => step.edgeId === edgeId);
}

/**
 * Map node ID to first connected edge in highlighted path
 */
export function mapNodeToEdgeId(nodeId, edges, highlightedPath) {
  if (!nodeId || !edges?.length || !highlightedPath?.length) return null;
  
  const highlightedEdgeIds = new Set(highlightedPath.map(s => s.edgeId));
  
  const edge = edges.find(e => 
    highlightedEdgeIds.has(e.id) && 
    (e.fromNodeId === nodeId || e.toNodeId === nodeId)
  );
  
  return edge?.id || null;
}

/**
 * Map edge ID to connected node IDs
 */
export function mapEdgeToNodeIds(edgeId, edges) {
  if (!edgeId || !edges?.length) return { fromNodeId: null, toNodeId: null };
  
  const edge = edges.find(e => e.id === edgeId);
  if (!edge) return { fromNodeId: null, toNodeId: null };
  
  return {
    fromNodeId: edge.fromNodeId,
    toNodeId: edge.toNodeId,
  };
}

/**
 * Check if sync should be allowed based on focus mode
 */
export function canSyncInFocusMode(focusMode, edgeId, highlightedPath) {
  if (focusMode === 'ALL') return true;
  if (focusMode === 'PATH_ONLY') {
    return highlightedPath.some(step => step.edgeId === edgeId);
  }
  // PATH_PLUS_NEIGHBOURS - allow all (neighbours included)
  return true;
}

/**
 * Check if sync should be allowed for truncated graph
 */
export function canSyncInTruncatedGraph(truncated, edgeId, highlightedPath) {
  if (!truncated) return true;
  return highlightedPath.some(step => step.edgeId === edgeId);
}

export default {
  SYNC_SOURCES,
  SYNC_EVENT_TYPES,
  createSyncController,
  mapEdgeToStepIndex,
  mapNodeToEdgeId,
  mapEdgeToNodeIds,
  canSyncInFocusMode,
  canSyncInTruncatedGraph,
};
