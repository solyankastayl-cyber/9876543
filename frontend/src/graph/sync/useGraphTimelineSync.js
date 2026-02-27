/**
 * useGraphTimelineSync Hook (P1.9.C)
 * 
 * React hook for graph ↔ timeline synchronization.
 * Wraps the sync controller for use in components.
 */

import { useCallback, useRef, useMemo } from 'react';
import { 
  createSyncController, 
  SYNC_SOURCES, 
  SYNC_EVENT_TYPES 
} from './graphTimelineSync.controller';

/**
 * Hook for bidirectional sync between graph and timeline
 * 
 * @param {Object} options
 * @param {Object} options.graph - Current graph data
 * @param {string} options.focusMode - Current focus mode
 * @param {Function} options.onSelectEdge - Callback when edge should be selected in graph
 * @param {Function} options.onScrollTimeline - Callback when timeline should scroll
 */
export function useGraphTimelineSync({
  graph,
  focusMode = 'ALL',
  onSelectEdge,
  onScrollTimeline,
}) {
  // Ref to track timeline step elements for scrolling
  const stepRefsMap = useRef(new Map());
  
  // Create stable state getter
  const getGraphState = useCallback(() => ({
    focusMode,
    truncated: graph?.truncated || false,
    highlightedPath: graph?.highlightedPath || [],
    edges: graph?.edges || [],
    nodes: graph?.nodes || [],
  }), [graph, focusMode]);
  
  // Create sync controller
  const controller = useMemo(() => {
    return createSyncController({
      onHighlightNode: (nodeId) => {
        // For now, highlighting node = selecting connected edge
        // This could be extended later
      },
      onHighlightEdge: (edgeId) => {
        onSelectEdge?.(edgeId);
      },
      onScrollToStep: (edgeId) => {
        const stepElement = stepRefsMap.current.get(edgeId);
        if (stepElement) {
          stepElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
        onScrollTimeline?.(edgeId);
      },
      onClearHighlight: () => {
        onSelectEdge?.(null);
      },
      getGraphState,
    });
  }, [getGraphState, onSelectEdge, onScrollTimeline]);
  
  // ============================================
  // Timeline → Graph handlers
  // ============================================
  
  /**
   * Handle timeline step click
   * Triggers: highlight edge in graph
   */
  const handleTimelineStepClick = useCallback((step) => {
    if (!step?.edgeId) return;
    
    controller.syncFromTimeline({
      type: SYNC_EVENT_TYPES.STEP_CLICK,
      edgeId: step.edgeId,
      stepId: step.index,
      source: SYNC_SOURCES.TIMELINE,
    });
  }, [controller]);
  
  /**
   * Handle timeline step hover (optional, for preview)
   */
  const handleTimelineStepHover = useCallback((step) => {
    if (!step?.edgeId) return;
    
    controller.syncFromTimeline({
      type: SYNC_EVENT_TYPES.STEP_HOVER,
      edgeId: step.edgeId,
      stepId: step.index,
      source: SYNC_SOURCES.TIMELINE,
    });
  }, [controller]);
  
  // ============================================
  // Graph → Timeline handlers
  // ============================================
  
  /**
   * Handle graph node click
   * Triggers: scroll timeline to connected step
   */
  const handleGraphNodeClick = useCallback((nodeId) => {
    if (!nodeId) return;
    
    controller.syncFromGraph({
      type: SYNC_EVENT_TYPES.NODE_CLICK,
      nodeId,
      source: SYNC_SOURCES.GRAPH,
    });
  }, [controller]);
  
  /**
   * Handle graph edge click
   * Triggers: scroll timeline to step
   */
  const handleGraphEdgeClick = useCallback((edgeId) => {
    if (!edgeId) return;
    
    controller.syncFromGraph({
      type: SYNC_EVENT_TYPES.EDGE_CLICK,
      edgeId,
      source: SYNC_SOURCES.GRAPH,
    });
  }, [controller]);
  
  // ============================================
  // Clear handlers
  // ============================================
  
  const handleClearSync = useCallback(() => {
    controller.syncFromTimeline({
      type: SYNC_EVENT_TYPES.CLEAR,
      source: SYNC_SOURCES.EXTERNAL,
    });
  }, [controller]);
  
  // ============================================
  // Ref registration for timeline steps
  // ============================================
  
  /**
   * Register a timeline step element for scroll targeting
   */
  const registerStepRef = useCallback((edgeId, element) => {
    if (element) {
      stepRefsMap.current.set(edgeId, element);
    } else {
      stepRefsMap.current.delete(edgeId);
    }
  }, []);
  
  /**
   * Create ref callback for a specific step
   */
  const getStepRefCallback = useCallback((edgeId) => {
    return (element) => registerStepRef(edgeId, element);
  }, [registerStepRef]);
  
  return {
    // Timeline → Graph
    handleTimelineStepClick,
    handleTimelineStepHover,
    
    // Graph → Timeline
    handleGraphNodeClick,
    handleGraphEdgeClick,
    
    // Clear
    handleClearSync,
    
    // Ref management
    registerStepRef,
    getStepRefCallback,
    
    // Controller utils (for advanced usage)
    utils: controller.utils,
  };
}

export default useGraphTimelineSync;
