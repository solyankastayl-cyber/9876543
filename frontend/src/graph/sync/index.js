/**
 * Graph Sync Module (P1.9.C)
 * 
 * Exports for graph ↔ timeline synchronization
 */

export { 
  createSyncController,
  SYNC_SOURCES,
  SYNC_EVENT_TYPES,
  mapEdgeToStepIndex,
  mapNodeToEdgeId,
  mapEdgeToNodeIds,
  canSyncInFocusMode,
  canSyncInTruncatedGraph,
} from './graphTimelineSync.controller';

export { 
  useGraphTimelineSync,
} from './useGraphTimelineSync';
