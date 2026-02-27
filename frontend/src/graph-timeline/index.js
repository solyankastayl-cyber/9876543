/**
 * Graph Timeline Index (P1.9.A + P1.9.B)
 * 
 * Exports all timeline functionality.
 */

// Types
export * from './timeline.types';

// Mapper (P1.9.A)
export {
  mapGraphToTimeline,
  getStepByEdgeId,
  getStepByIndex,
  getTimelineDuration,
  groupTimelineByChain,
  getTimelineChains,
  getTimelineStats,
  formatTimestamp,
  formatDuration,
} from './timeline.mapper';

// Selectors (P1.9.A)
export {
  selectTimeline,
  selectCurrentStep,
  selectStepContext,
  selectTimelineStats,
  selectHighRiskSteps,
  selectCexExitSteps,
  selectBridgeSteps,
  useTimeline,
  useTimelineStats,
  useCurrentStep,
  useStepContext,
  useFilteredSteps,
  useHighlightedStep,
  isStepSelected,
  getEdgeIdForStep,
  getStepIndexForEdge,
} from './timeline.selectors';

// Market Overlay (P1.9.B)
export {
  applyMarketOverlay,
  getRegimeConfig,
  getMarketTagLabel,
  getMarketTagColor,
  isSignificantMarketContext,
  getCombinedSeverity,
  getMarketOverlaySummary,
} from './timelineMarket.overlay';
