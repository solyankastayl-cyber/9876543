/**
 * Timeline Selectors (P1.9.A)
 * 
 * Derived state selectors for timeline.
 * Works with Zustand store or standalone.
 */

import { useMemo } from 'react';
import { mapGraphToTimeline, getTimelineStats, getStepByEdgeId } from './timeline.mapper';

// ============================================
// Selector Functions (pure)
// ============================================

/**
 * Select timeline from graph snapshot
 */
export function selectTimeline(graphSnapshot) {
  if (!graphSnapshot) return [];
  return mapGraphToTimeline(graphSnapshot);
}

/**
 * Select current step based on selected edge
 */
export function selectCurrentStep(timeline, selectedEdgeId) {
  if (!timeline || !selectedEdgeId) return null;
  return getStepByEdgeId(timeline, selectedEdgeId);
}

/**
 * Select step context (prev, current, next)
 */
export function selectStepContext(timeline, selectedEdgeId) {
  if (!timeline || timeline.length === 0 || !selectedEdgeId) {
    return { prev: null, current: null, next: null };
  }
  
  const currentIndex = timeline.findIndex(s => s.edgeId === selectedEdgeId);
  
  if (currentIndex === -1) {
    return { prev: null, current: null, next: null };
  }
  
  return {
    prev: currentIndex > 0 ? timeline[currentIndex - 1] : null,
    current: timeline[currentIndex],
    next: currentIndex < timeline.length - 1 ? timeline[currentIndex + 1] : null,
  };
}

/**
 * Select timeline stats
 */
export function selectTimelineStats(timeline) {
  return getTimelineStats(timeline);
}

/**
 * Select high risk steps
 */
export function selectHighRiskSteps(timeline) {
  if (!timeline) return [];
  return timeline.filter(s => s.riskTag === 'HIGH');
}

/**
 * Select CEX exit steps
 */
export function selectCexExitSteps(timeline) {
  if (!timeline) return [];
  return timeline.filter(s => s.type === 'CEX_DEPOSIT');
}

/**
 * Select bridge steps
 */
export function selectBridgeSteps(timeline) {
  if (!timeline) return [];
  return timeline.filter(s => s.type === 'BRIDGE');
}

// ============================================
// React Hooks (for component usage)
// ============================================

/**
 * Hook: Use timeline from graph snapshot
 */
export function useTimeline(graphSnapshot) {
  return useMemo(() => {
    return selectTimeline(graphSnapshot);
  }, [graphSnapshot]);
}

/**
 * Hook: Use timeline stats
 */
export function useTimelineStats(timeline) {
  return useMemo(() => {
    return selectTimelineStats(timeline);
  }, [timeline]);
}

/**
 * Hook: Use current step
 */
export function useCurrentStep(timeline, selectedEdgeId) {
  return useMemo(() => {
    return selectCurrentStep(timeline, selectedEdgeId);
  }, [timeline, selectedEdgeId]);
}

/**
 * Hook: Use step context
 */
export function useStepContext(timeline, selectedEdgeId) {
  return useMemo(() => {
    return selectStepContext(timeline, selectedEdgeId);
  }, [timeline, selectedEdgeId]);
}

/**
 * Hook: Use filtered steps by type
 */
export function useFilteredSteps(timeline, filterType) {
  return useMemo(() => {
    if (!timeline || !filterType) return timeline || [];
    return timeline.filter(s => s.type === filterType);
  }, [timeline, filterType]);
}

/**
 * Hook: Use highlighted step (synced with graph selection)
 */
export function useHighlightedStep(timeline, selectedEdgeId) {
  return useMemo(() => {
    if (!timeline || !selectedEdgeId) return null;
    return timeline.find(s => s.edgeId === selectedEdgeId) || null;
  }, [timeline, selectedEdgeId]);
}

// ============================================
// Sync Selectors (for P1.9.C)
// ============================================

/**
 * Check if step is synced with graph selection
 */
export function isStepSelected(step, selectedEdgeId) {
  if (!step || !selectedEdgeId) return false;
  return step.edgeId === selectedEdgeId;
}

/**
 * Get edge ID for scroll-to in graph
 */
export function getEdgeIdForStep(step) {
  return step?.edgeId || null;
}

/**
 * Get step index for scroll-to in timeline
 */
export function getStepIndexForEdge(timeline, edgeId) {
  if (!timeline || !edgeId) return -1;
  const step = timeline.find(s => s.edgeId === edgeId);
  return step?.index ?? -1;
}

export default {
  // Pure selectors
  selectTimeline,
  selectCurrentStep,
  selectStepContext,
  selectTimelineStats,
  selectHighRiskSteps,
  selectCexExitSteps,
  selectBridgeSteps,
  
  // React hooks
  useTimeline,
  useTimelineStats,
  useCurrentStep,
  useStepContext,
  useFilteredSteps,
  useHighlightedStep,
  
  // Sync helpers
  isStepSelected,
  getEdgeIdForStep,
  getStepIndexForEdge,
};
