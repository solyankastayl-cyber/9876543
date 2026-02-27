/**
 * Graph Timeline Sync Controller Tests (P1.9.C)
 * 
 * Tests for sync logic - mapping, guards, no feedback loops
 * Pure logic tests, no DOM/scroll mocking
 */

import {
  createSyncController,
  SYNC_SOURCES,
  SYNC_EVENT_TYPES,
  mapEdgeToStepIndex,
  mapNodeToEdgeId,
  mapEdgeToNodeIds,
  canSyncInFocusMode,
  canSyncInTruncatedGraph,
} from '../graphTimelineSync.controller';

// ============================================
// Test Data
// ============================================

const createMockGraphState = (overrides = {}) => ({
  focusMode: 'ALL',
  truncated: false,
  highlightedPath: [
    { edgeId: 'e1', order: 1, reason: 'origin' },
    { edgeId: 'e2', order: 2, reason: 'bridge' },
    { edgeId: 'e3', order: 3, reason: 'exit' },
  ],
  edges: [
    { id: 'e1', fromNodeId: 'n1', toNodeId: 'n2' },
    { id: 'e2', fromNodeId: 'n2', toNodeId: 'n3' },
    { id: 'e3', fromNodeId: 'n3', toNodeId: 'n4' },
    { id: 'e4', fromNodeId: 'n4', toNodeId: 'n5' }, // Not in highlighted path
  ],
  nodes: [
    { id: 'n1' }, { id: 'n2' }, { id: 'n3' }, { id: 'n4' }, { id: 'n5' }
  ],
  ...overrides,
});

// ============================================
// Mapping Utilities Tests
// ============================================

describe('mapEdgeToStepIndex', () => {
  const highlightedPath = [
    { edgeId: 'e1', order: 1 },
    { edgeId: 'e2', order: 2 },
    { edgeId: 'e3', order: 3 },
  ];
  
  it('should return correct index for existing edge', () => {
    expect(mapEdgeToStepIndex('e1', highlightedPath)).toBe(0);
    expect(mapEdgeToStepIndex('e2', highlightedPath)).toBe(1);
    expect(mapEdgeToStepIndex('e3', highlightedPath)).toBe(2);
  });
  
  it('should return -1 for non-existent edge', () => {
    expect(mapEdgeToStepIndex('e999', highlightedPath)).toBe(-1);
  });
  
  it('should return -1 for null/undefined inputs', () => {
    expect(mapEdgeToStepIndex(null, highlightedPath)).toBe(-1);
    expect(mapEdgeToStepIndex('e1', null)).toBe(-1);
    expect(mapEdgeToStepIndex('e1', [])).toBe(-1);
  });
});

describe('mapNodeToEdgeId', () => {
  const edges = [
    { id: 'e1', fromNodeId: 'n1', toNodeId: 'n2' },
    { id: 'e2', fromNodeId: 'n2', toNodeId: 'n3' },
    { id: 'e3', fromNodeId: 'n3', toNodeId: 'n4' },
  ];
  const highlightedPath = [
    { edgeId: 'e1' },
    { edgeId: 'e2' },
  ];
  
  it('should find edge by fromNodeId', () => {
    expect(mapNodeToEdgeId('n1', edges, highlightedPath)).toBe('e1');
    expect(mapNodeToEdgeId('n2', edges, highlightedPath)).toBe('e1'); // First match
  });
  
  it('should find edge by toNodeId', () => {
    expect(mapNodeToEdgeId('n3', edges, highlightedPath)).toBe('e2');
  });
  
  it('should return null for node not in highlighted path', () => {
    expect(mapNodeToEdgeId('n4', edges, highlightedPath)).toBe(null);
  });
  
  it('should return null for non-existent node', () => {
    expect(mapNodeToEdgeId('n999', edges, highlightedPath)).toBe(null);
  });
  
  it('should handle empty inputs', () => {
    expect(mapNodeToEdgeId(null, edges, highlightedPath)).toBe(null);
    expect(mapNodeToEdgeId('n1', [], highlightedPath)).toBe(null);
    expect(mapNodeToEdgeId('n1', edges, [])).toBe(null);
  });
});

describe('mapEdgeToNodeIds', () => {
  const edges = [
    { id: 'e1', fromNodeId: 'n1', toNodeId: 'n2' },
    { id: 'e2', fromNodeId: 'n2', toNodeId: 'n3' },
  ];
  
  it('should return correct node IDs for edge', () => {
    const result = mapEdgeToNodeIds('e1', edges);
    expect(result.fromNodeId).toBe('n1');
    expect(result.toNodeId).toBe('n2');
  });
  
  it('should return nulls for non-existent edge', () => {
    const result = mapEdgeToNodeIds('e999', edges);
    expect(result.fromNodeId).toBe(null);
    expect(result.toNodeId).toBe(null);
  });
  
  it('should handle empty inputs', () => {
    const result = mapEdgeToNodeIds(null, edges);
    expect(result.fromNodeId).toBe(null);
    expect(result.toNodeId).toBe(null);
  });
});

// ============================================
// Focus Mode Guards Tests
// ============================================

describe('canSyncInFocusMode', () => {
  const highlightedPath = [
    { edgeId: 'e1' },
    { edgeId: 'e2' },
  ];
  
  it('should allow all syncs in ALL mode', () => {
    expect(canSyncInFocusMode('ALL', 'e1', highlightedPath)).toBe(true);
    expect(canSyncInFocusMode('ALL', 'e999', highlightedPath)).toBe(true);
  });
  
  it('should only allow highlighted path in PATH_ONLY mode', () => {
    expect(canSyncInFocusMode('PATH_ONLY', 'e1', highlightedPath)).toBe(true);
    expect(canSyncInFocusMode('PATH_ONLY', 'e2', highlightedPath)).toBe(true);
    expect(canSyncInFocusMode('PATH_ONLY', 'e999', highlightedPath)).toBe(false);
  });
  
  it('should allow all in PATH_PLUS_NEIGHBOURS mode', () => {
    expect(canSyncInFocusMode('PATH_PLUS_NEIGHBOURS', 'e1', highlightedPath)).toBe(true);
    expect(canSyncInFocusMode('PATH_PLUS_NEIGHBOURS', 'e999', highlightedPath)).toBe(true);
  });
});

// ============================================
// Truncated Graph Guards Tests
// ============================================

describe('canSyncInTruncatedGraph', () => {
  const highlightedPath = [
    { edgeId: 'e1' },
    { edgeId: 'e2' },
  ];
  
  it('should allow all syncs when not truncated', () => {
    expect(canSyncInTruncatedGraph(false, 'e1', highlightedPath)).toBe(true);
    expect(canSyncInTruncatedGraph(false, 'e999', highlightedPath)).toBe(true);
  });
  
  it('should only allow highlighted path when truncated', () => {
    expect(canSyncInTruncatedGraph(true, 'e1', highlightedPath)).toBe(true);
    expect(canSyncInTruncatedGraph(true, 'e2', highlightedPath)).toBe(true);
    expect(canSyncInTruncatedGraph(true, 'e999', highlightedPath)).toBe(false);
  });
});

// ============================================
// Sync Controller Tests
// ============================================

describe('createSyncController', () => {
  let callbacks;
  let controller;
  
  beforeEach(() => {
    callbacks = {
      onHighlightNode: jest.fn(),
      onHighlightEdge: jest.fn(),
      onScrollToStep: jest.fn(),
      onClearHighlight: jest.fn(),
      getGraphState: () => createMockGraphState(),
    };
    controller = createSyncController(callbacks);
    controller.reset(); // Reset state between tests
  });
  
  describe('syncFromTimeline', () => {
    it('should highlight edge on step click', () => {
      const result = controller.syncFromTimeline({
        type: SYNC_EVENT_TYPES.STEP_CLICK,
        edgeId: 'e1',
        source: SYNC_SOURCES.TIMELINE,
      });
      
      expect(result.synced).toBe(true);
      expect(callbacks.onHighlightEdge).toHaveBeenCalledWith('e1');
    });
    
    it('should block sync for non-highlighted edge in truncated graph', () => {
      callbacks.getGraphState = () => createMockGraphState({ truncated: true });
      controller = createSyncController(callbacks);
      controller.reset();
      
      const result = controller.syncFromTimeline({
        type: SYNC_EVENT_TYPES.STEP_CLICK,
        edgeId: 'e4', // Not in highlighted path
        source: SYNC_SOURCES.TIMELINE,
      });
      
      expect(result.synced).toBe(false);
      expect(result.reason).toBe('truncated_guard');
    });
    
    it('should block sync for non-highlighted edge in PATH_ONLY mode', () => {
      callbacks.getGraphState = () => createMockGraphState({ focusMode: 'PATH_ONLY' });
      controller = createSyncController(callbacks);
      controller.reset();
      
      const result = controller.syncFromTimeline({
        type: SYNC_EVENT_TYPES.STEP_CLICK,
        edgeId: 'e4',
        source: SYNC_SOURCES.TIMELINE,
      });
      
      expect(result.synced).toBe(false);
      expect(result.reason).toBe('focus_mode_guard');
    });
  });
  
  describe('syncFromGraph', () => {
    it('should scroll timeline on node click', () => {
      const result = controller.syncFromGraph({
        type: SYNC_EVENT_TYPES.NODE_CLICK,
        nodeId: 'n2', // Connected to e1 and e2
        source: SYNC_SOURCES.GRAPH,
      });
      
      expect(result.synced).toBe(true);
      expect(callbacks.onScrollToStep).toHaveBeenCalled();
    });
    
    it('should scroll timeline on edge click', () => {
      const result = controller.syncFromGraph({
        type: SYNC_EVENT_TYPES.EDGE_CLICK,
        edgeId: 'e2',
        source: SYNC_SOURCES.GRAPH,
      });
      
      expect(result.synced).toBe(true);
      expect(callbacks.onScrollToStep).toHaveBeenCalledWith('e2');
    });
    
    it('should silent ignore node not in highlighted path', () => {
      const result = controller.syncFromGraph({
        type: SYNC_EVENT_TYPES.NODE_CLICK,
        nodeId: 'n5', // Only connected to e4 which is not highlighted
        source: SYNC_SOURCES.GRAPH,
      });
      
      expect(result.synced).toBe(false);
      expect(result.reason).toBe('node_not_in_path');
    });
    
    it('should block sync for non-highlighted edge in truncated graph', () => {
      callbacks.getGraphState = () => createMockGraphState({ truncated: true });
      controller = createSyncController(callbacks);
      controller.reset();
      
      const result = controller.syncFromGraph({
        type: SYNC_EVENT_TYPES.EDGE_CLICK,
        edgeId: 'e4',
        source: SYNC_SOURCES.GRAPH,
      });
      
      expect(result.synced).toBe(false);
      expect(result.reason).toBe('truncated_guard');
    });
  });
  
  describe('source-aware guards (no feedback loops)', () => {
    it('should block rapid same-source events', async () => {
      // First event succeeds
      const result1 = controller.syncFromTimeline({
        type: SYNC_EVENT_TYPES.STEP_CLICK,
        edgeId: 'e1',
        source: SYNC_SOURCES.TIMELINE,
      });
      expect(result1.synced).toBe(true);
      
      // Immediate same-source event blocked
      const result2 = controller.syncFromTimeline({
        type: SYNC_EVENT_TYPES.STEP_CLICK,
        edgeId: 'e2',
        source: SYNC_SOURCES.TIMELINE,
      });
      expect(result2.synced).toBe(false);
      expect(result2.reason).toBe('source_guard');
    });
    
    it('should allow different-source events', () => {
      // Timeline event
      const result1 = controller.syncFromTimeline({
        type: SYNC_EVENT_TYPES.STEP_CLICK,
        edgeId: 'e1',
        source: SYNC_SOURCES.TIMELINE,
      });
      expect(result1.synced).toBe(true);
      
      // Graph event immediately after (different source)
      const result2 = controller.syncFromGraph({
        type: SYNC_EVENT_TYPES.EDGE_CLICK,
        edgeId: 'e2',
        source: SYNC_SOURCES.GRAPH,
      });
      expect(result2.synced).toBe(true);
    });
  });
  
  describe('clear sync', () => {
    it('should call onClearHighlight on clear event', () => {
      const result = controller.syncFromTimeline({
        type: SYNC_EVENT_TYPES.CLEAR,
        source: SYNC_SOURCES.EXTERNAL,
      });
      
      expect(result.synced).toBe(true);
      expect(callbacks.onClearHighlight).toHaveBeenCalled();
    });
  });
});
