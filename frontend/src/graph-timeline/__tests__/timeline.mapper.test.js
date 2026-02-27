/**
 * Timeline Mapper Tests (P1.9.A)
 * 
 * Unit tests for timeline mapper logic.
 * Tests pure data transformation without UI.
 */

import {
  mapGraphToTimeline,
  getStepByEdgeId,
  getStepByIndex,
  getTimelineDuration,
  groupTimelineByChain,
  getTimelineChains,
  getTimelineStats,
  formatTimestamp,
  formatDuration,
} from '../timeline.mapper';

describe('timeline.mapper', () => {
  // Test data - realistic ETH → ARB → CEX route
  const mockGraphSnapshot = {
    nodes: [
      { id: 'wallet_A', type: 'WALLET', displayName: 'Wallet A', address: '0x1234...' },
      { id: 'bridge_Stargate', type: 'BRIDGE', displayName: 'Stargate' },
      { id: 'wallet_B', type: 'WALLET', displayName: 'Wallet B', address: '0x5678...' },
      { id: 'binance_hot', type: 'CEX', displayName: 'Binance' },
    ],
    edges: [
      {
        id: 'e1',
        type: 'TRANSFER',
        chain: 'ETH',
        timestamp: 1717000000000,
        fromNodeId: 'wallet_A',
        toNodeId: 'bridge_Stargate',
        meta: { amount: 10, token: 'ETH' },
      },
      {
        id: 'e2',
        type: 'BRIDGE',
        chainFrom: 'ETH',
        chainTo: 'ARB',
        chain: 'ARB',
        timestamp: 1717000300000,
        fromNodeId: 'bridge_Stargate',
        toNodeId: 'wallet_B',
        meta: { protocol: 'Stargate', amount: 9.95, token: 'ETH' },
      },
      {
        id: 'e3',
        type: 'DEPOSIT',
        chain: 'ARB',
        timestamp: 1717000900000,
        fromNodeId: 'wallet_B',
        toNodeId: 'binance_hot',
        meta: { amount: 9.9, token: 'ETH', amountUsd: 35000 },
      },
    ],
    highlightedPath: [
      { edgeId: 'e1', reason: 'origin_of_route', riskContribution: 0.1, order: 0 },
      { edgeId: 'e2', reason: 'cross_chain_migration', riskContribution: 0.3, order: 1 },
      { edgeId: 'e3', reason: 'exit_to_cex', riskContribution: 0.5, order: 2 },
    ],
  };

  describe('mapGraphToTimeline', () => {
    test('should map graph snapshot to timeline steps', () => {
      const timeline = mapGraphToTimeline(mockGraphSnapshot);
      
      expect(timeline).toHaveLength(3);
      expect(timeline[0].index).toBe(1);
      expect(timeline[1].index).toBe(2);
      expect(timeline[2].index).toBe(3);
    });
    
    test('should map edge types correctly', () => {
      const timeline = mapGraphToTimeline(mockGraphSnapshot);
      
      expect(timeline[0].type).toBe('TRANSFER');
      expect(timeline[1].type).toBe('BRIDGE');
      expect(timeline[2].type).toBe('CEX_DEPOSIT');
    });
    
    test('should preserve timestamps and sort by them', () => {
      const timeline = mapGraphToTimeline(mockGraphSnapshot);
      
      expect(timeline[0].timestamp).toBe(1717000000000);
      expect(timeline[1].timestamp).toBe(1717000300000);
      expect(timeline[2].timestamp).toBe(1717000900000);
      
      // Verify sorted order
      for (let i = 1; i < timeline.length; i++) {
        expect(timeline[i].timestamp).toBeGreaterThanOrEqual(timeline[i-1].timestamp);
      }
    });
    
    test('should map from/to nodes correctly', () => {
      const timeline = mapGraphToTimeline(mockGraphSnapshot);
      
      // Step 1: wallet_A → bridge_Stargate
      expect(timeline[0].from.id).toBe('wallet_A');
      expect(timeline[0].from.type).toBe('WALLET');
      expect(timeline[0].to.id).toBe('bridge_Stargate');
      expect(timeline[0].to.type).toBe('BRIDGE');
      
      // Step 3: wallet_B → binance_hot (CEX)
      expect(timeline[2].to.id).toBe('binance_hot');
      expect(timeline[2].to.type).toBe('CEX');
    });
    
    test('should include chain info for bridges', () => {
      const timeline = mapGraphToTimeline(mockGraphSnapshot);
      
      const bridgeStep = timeline.find(s => s.type === 'BRIDGE');
      expect(bridgeStep.chainFrom).toBe('ETH');
      expect(bridgeStep.chainTo).toBe('ARB');
    });
    
    test('should include asset info', () => {
      const timeline = mapGraphToTimeline(mockGraphSnapshot);
      
      expect(timeline[0].asset.symbol).toBe('ETH');
      expect(timeline[0].asset.amount).toBe(10);
      expect(timeline[2].asset.amountUsd).toBe(35000);
    });
    
    test('should preserve edgeId for sync', () => {
      const timeline = mapGraphToTimeline(mockGraphSnapshot);
      
      expect(timeline[0].edgeId).toBe('e1');
      expect(timeline[1].edgeId).toBe('e2');
      expect(timeline[2].edgeId).toBe('e3');
    });
    
    test('should map risk tags from reasons', () => {
      const timeline = mapGraphToTimeline(mockGraphSnapshot);
      
      expect(timeline[0].riskTag).toBe('LOW');  // origin_of_route
      expect(timeline[1].riskTag).toBe('MEDIUM');  // cross_chain_migration
      expect(timeline[2].riskTag).toBe('HIGH');  // exit_to_cex
    });
    
    test('should include reason and riskContribution', () => {
      const timeline = mapGraphToTimeline(mockGraphSnapshot);
      
      expect(timeline[0].reason).toBe('origin_of_route');
      expect(timeline[0].riskContribution).toBe(0.1);
      expect(timeline[2].reason).toBe('exit_to_cex');
      expect(timeline[2].riskContribution).toBe(0.5);
    });
    
    test('should return empty array for null input', () => {
      expect(mapGraphToTimeline(null)).toEqual([]);
      expect(mapGraphToTimeline(undefined)).toEqual([]);
    });
    
    test('should return empty array for empty highlightedPath', () => {
      const emptyPath = { ...mockGraphSnapshot, highlightedPath: [] };
      expect(mapGraphToTimeline(emptyPath)).toEqual([]);
    });
    
    test('should return empty array for missing edges', () => {
      const noEdges = { ...mockGraphSnapshot, edges: [] };
      expect(mapGraphToTimeline(noEdges)).toEqual([]);
    });
    
    test('should handle out-of-order timestamps', () => {
      const outOfOrder = {
        ...mockGraphSnapshot,
        edges: [
          { id: 'e3', type: 'DEPOSIT', chain: 'ARB', timestamp: 1717000900000, fromNodeId: 'wallet_B', toNodeId: 'binance_hot' },
          { id: 'e1', type: 'TRANSFER', chain: 'ETH', timestamp: 1717000000000, fromNodeId: 'wallet_A', toNodeId: 'bridge_Stargate' },
          { id: 'e2', type: 'BRIDGE', chain: 'ARB', timestamp: 1717000300000, fromNodeId: 'bridge_Stargate', toNodeId: 'wallet_B' },
        ],
      };
      
      const timeline = mapGraphToTimeline(outOfOrder);
      
      // Should be sorted by timestamp
      expect(timeline[0].edgeId).toBe('e1');
      expect(timeline[1].edgeId).toBe('e2');
      expect(timeline[2].edgeId).toBe('e3');
    });
    
    test('should handle missing node (partial graph)', () => {
      const partialGraph = {
        nodes: [{ id: 'wallet_A', type: 'WALLET', displayName: 'Wallet A' }],
        edges: [{ id: 'e1', type: 'TRANSFER', chain: 'ETH', timestamp: 1717000000000, fromNodeId: 'wallet_A', toNodeId: 'unknown_node' }],
        highlightedPath: [{ edgeId: 'e1', reason: 'origin', riskContribution: 0.1 }],
      };
      
      const timeline = mapGraphToTimeline(partialGraph);
      
      expect(timeline).toHaveLength(1);
      expect(timeline[0].to.type).toBe('WALLET'); // fallback type
    });
    
    test('should skip edges not in highlightedPath', () => {
      const extraEdge = {
        ...mockGraphSnapshot,
        edges: [
          ...mockGraphSnapshot.edges,
          { id: 'e4', type: 'TRANSFER', chain: 'ETH', timestamp: 1717001000000, fromNodeId: 'wallet_A', toNodeId: 'wallet_B' },
        ],
      };
      
      const timeline = mapGraphToTimeline(extraEdge);
      
      expect(timeline).toHaveLength(3); // Only 3 from highlightedPath
      expect(timeline.find(s => s.edgeId === 'e4')).toBeUndefined();
    });
  });
  
  describe('getStepByEdgeId', () => {
    test('should find step by edge ID', () => {
      const timeline = mapGraphToTimeline(mockGraphSnapshot);
      const step = getStepByEdgeId(timeline, 'e2');
      
      expect(step).not.toBeNull();
      expect(step.edgeId).toBe('e2');
      expect(step.type).toBe('BRIDGE');
    });
    
    test('should return null for unknown edge', () => {
      const timeline = mapGraphToTimeline(mockGraphSnapshot);
      expect(getStepByEdgeId(timeline, 'unknown')).toBeNull();
    });
    
    test('should handle null input', () => {
      expect(getStepByEdgeId(null, 'e1')).toBeNull();
      expect(getStepByEdgeId([], 'e1')).toBeNull();
    });
  });
  
  describe('getStepByIndex', () => {
    test('should find step by index', () => {
      const timeline = mapGraphToTimeline(mockGraphSnapshot);
      const step = getStepByIndex(timeline, 2);
      
      expect(step).not.toBeNull();
      expect(step.index).toBe(2);
    });
    
    test('should return null for out of range index', () => {
      const timeline = mapGraphToTimeline(mockGraphSnapshot);
      expect(getStepByIndex(timeline, 0)).toBeNull();
      expect(getStepByIndex(timeline, 10)).toBeNull();
    });
  });
  
  describe('getTimelineDuration', () => {
    test('should calculate duration', () => {
      const timeline = mapGraphToTimeline(mockGraphSnapshot);
      const duration = getTimelineDuration(timeline);
      
      // 900000ms = 900 seconds = 15 minutes
      expect(duration).toBe(900000);
    });
    
    test('should return 0 for single step', () => {
      const singleStep = [{timestamp: 1000}];
      expect(getTimelineDuration(singleStep)).toBe(0);
    });
    
    test('should return 0 for empty timeline', () => {
      expect(getTimelineDuration([])).toBe(0);
      expect(getTimelineDuration(null)).toBe(0);
    });
  });
  
  describe('groupTimelineByChain', () => {
    test('should group steps by chain', () => {
      const timeline = mapGraphToTimeline(mockGraphSnapshot);
      const groups = groupTimelineByChain(timeline);
      
      expect(groups['ETH']).toHaveLength(1);
      expect(groups['ARB']).toHaveLength(2);
    });
  });
  
  describe('getTimelineChains', () => {
    test('should return unique chains', () => {
      const timeline = mapGraphToTimeline(mockGraphSnapshot);
      const chains = getTimelineChains(timeline);
      
      expect(chains).toContain('ETH');
      expect(chains).toContain('ARB');
      expect(chains.length).toBe(2);
    });
  });
  
  describe('getTimelineStats', () => {
    test('should calculate stats correctly', () => {
      const timeline = mapGraphToTimeline(mockGraphSnapshot);
      const stats = getTimelineStats(timeline);
      
      expect(stats.totalSteps).toBe(3);
      expect(stats.uniqueChains).toBe(2);
      expect(stats.hasBridge).toBe(true);
      expect(stats.hasCexExit).toBe(true);
      expect(stats.hasSwap).toBe(false);
      expect(stats.duration).toBe(900000);
    });
    
    test('should return zero stats for empty timeline', () => {
      const stats = getTimelineStats([]);
      
      expect(stats.totalSteps).toBe(0);
      expect(stats.hasBridge).toBe(false);
      expect(stats.hasCexExit).toBe(false);
    });
  });
  
  describe('formatTimestamp', () => {
    test('should format timestamp', () => {
      const result = formatTimestamp(1717000000000);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
    
    test('should handle invalid timestamp', () => {
      expect(formatTimestamp(0)).toBe('Unknown');
      expect(formatTimestamp(null)).toBe('Unknown');
    });
  });
  
  describe('formatDuration', () => {
    test('should format seconds', () => {
      expect(formatDuration(30000)).toBe('30s');
    });
    
    test('should format minutes', () => {
      expect(formatDuration(300000)).toBe('5m');
    });
    
    test('should format hours', () => {
      expect(formatDuration(3900000)).toBe('1h 5m');
    });
    
    test('should handle zero', () => {
      expect(formatDuration(0)).toBe('0s');
    });
  });
});
