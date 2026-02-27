/**
 * Timeline Selectors Tests (P1.9.A)
 * 
 * Unit tests for timeline selector logic.
 */

import {
  selectTimeline,
  selectCurrentStep,
  selectStepContext,
  selectTimelineStats,
  selectHighRiskSteps,
  selectCexExitSteps,
  selectBridgeSteps,
  isStepSelected,
  getEdgeIdForStep,
  getStepIndexForEdge,
} from '../timeline.selectors';

describe('timeline.selectors', () => {
  // Mock timeline data
  const mockTimeline = [
    { index: 1, type: 'TRANSFER', edgeId: 'e1', riskTag: 'LOW' },
    { index: 2, type: 'BRIDGE', edgeId: 'e2', riskTag: 'MEDIUM' },
    { index: 3, type: 'CEX_DEPOSIT', edgeId: 'e3', riskTag: 'HIGH' },
  ];
  
  const mockGraphSnapshot = {
    nodes: [{ id: 'n1' }],
    edges: [{ id: 'e1', type: 'TRANSFER', timestamp: 1000, fromNodeId: 'n1', toNodeId: 'n2' }],
    highlightedPath: [{ edgeId: 'e1', reason: 'test', riskContribution: 0.1 }],
  };
  
  describe('selectTimeline', () => {
    test('should return timeline from graph snapshot', () => {
      const result = selectTimeline(mockGraphSnapshot);
      expect(result).toHaveLength(1);
    });
    
    test('should return empty array for null', () => {
      expect(selectTimeline(null)).toEqual([]);
    });
  });
  
  describe('selectCurrentStep', () => {
    test('should find current step by edge ID', () => {
      const step = selectCurrentStep(mockTimeline, 'e2');
      expect(step).not.toBeNull();
      expect(step.index).toBe(2);
    });
    
    test('should return null for unknown edge', () => {
      expect(selectCurrentStep(mockTimeline, 'unknown')).toBeNull();
    });
    
    test('should return null for null timeline', () => {
      expect(selectCurrentStep(null, 'e1')).toBeNull();
    });
  });
  
  describe('selectStepContext', () => {
    test('should return prev, current, next for middle step', () => {
      const context = selectStepContext(mockTimeline, 'e2');
      
      expect(context.prev).not.toBeNull();
      expect(context.prev.edgeId).toBe('e1');
      expect(context.current.edgeId).toBe('e2');
      expect(context.next.edgeId).toBe('e3');
    });
    
    test('should return null prev for first step', () => {
      const context = selectStepContext(mockTimeline, 'e1');
      
      expect(context.prev).toBeNull();
      expect(context.current.edgeId).toBe('e1');
      expect(context.next).not.toBeNull();
    });
    
    test('should return null next for last step', () => {
      const context = selectStepContext(mockTimeline, 'e3');
      
      expect(context.prev).not.toBeNull();
      expect(context.current.edgeId).toBe('e3');
      expect(context.next).toBeNull();
    });
    
    test('should return all nulls for unknown edge', () => {
      const context = selectStepContext(mockTimeline, 'unknown');
      
      expect(context.prev).toBeNull();
      expect(context.current).toBeNull();
      expect(context.next).toBeNull();
    });
  });
  
  describe('selectTimelineStats', () => {
    test('should return stats', () => {
      const stats = selectTimelineStats(mockTimeline);
      expect(stats.totalSteps).toBe(3);
    });
  });
  
  describe('selectHighRiskSteps', () => {
    test('should filter high risk steps', () => {
      const highRisk = selectHighRiskSteps(mockTimeline);
      expect(highRisk).toHaveLength(1);
      expect(highRisk[0].riskTag).toBe('HIGH');
    });
    
    test('should return empty for no high risk', () => {
      const lowRiskTimeline = [{ riskTag: 'LOW' }, { riskTag: 'MEDIUM' }];
      expect(selectHighRiskSteps(lowRiskTimeline)).toEqual([]);
    });
  });
  
  describe('selectCexExitSteps', () => {
    test('should filter CEX deposit steps', () => {
      const cexSteps = selectCexExitSteps(mockTimeline);
      expect(cexSteps).toHaveLength(1);
      expect(cexSteps[0].type).toBe('CEX_DEPOSIT');
    });
  });
  
  describe('selectBridgeSteps', () => {
    test('should filter bridge steps', () => {
      const bridgeSteps = selectBridgeSteps(mockTimeline);
      expect(bridgeSteps).toHaveLength(1);
      expect(bridgeSteps[0].type).toBe('BRIDGE');
    });
  });
  
  describe('isStepSelected', () => {
    test('should return true if step matches edge ID', () => {
      expect(isStepSelected({ edgeId: 'e1' }, 'e1')).toBe(true);
    });
    
    test('should return false if step does not match', () => {
      expect(isStepSelected({ edgeId: 'e1' }, 'e2')).toBe(false);
    });
    
    test('should return false for null', () => {
      expect(isStepSelected(null, 'e1')).toBe(false);
    });
  });
  
  describe('getEdgeIdForStep', () => {
    test('should return edge ID from step', () => {
      expect(getEdgeIdForStep({ edgeId: 'e1' })).toBe('e1');
    });
    
    test('should return null for null step', () => {
      expect(getEdgeIdForStep(null)).toBeNull();
    });
  });
  
  describe('getStepIndexForEdge', () => {
    test('should return step index for edge', () => {
      expect(getStepIndexForEdge(mockTimeline, 'e2')).toBe(2);
    });
    
    test('should return -1 for unknown edge', () => {
      expect(getStepIndexForEdge(mockTimeline, 'unknown')).toBe(-1);
    });
    
    test('should return -1 for null timeline', () => {
      expect(getStepIndexForEdge(null, 'e1')).toBe(-1);
    });
  });
});
