/**
 * Graph Explain Mapper Tests (P1.8.D)
 * 
 * Unit tests for explain data mapping.
 * Tests pure data transformation without UI.
 */

import { 
  mapExplainData, 
  getRiskLevel, 
  getRiskLevelColor,
  formatPercent,
  formatMultiplier,
  sortReasonsBySeverity,
  getSegmentTypeColor
} from '../graph/graphExplain.mapper';

describe('graphExplain.mapper', () => {
  // Test data
  const mockGraphData = {
    nodes: [
      { id: 'node-1', type: 'WALLET' },
      { id: 'node-2', type: 'CEX' },
    ],
    edges: [
      { id: 'edge-1', type: 'TRANSFER', chain: 'ethereum', fromNodeId: 'node-1', toNodeId: 'node-2' },
      { id: 'edge-2', type: 'BRIDGE', chainFrom: 'ethereum', chainTo: 'arbitrum', fromNodeId: 'node-1', toNodeId: 'node-2', meta: { protocol: 'Stargate' } },
    ],
    highlightedPath: [
      { edgeId: 'edge-1', reason: 'origin_of_route', riskContribution: 0.1, order: 0 },
      { edgeId: 'edge-2', reason: 'cross_chain_migration', riskContribution: 0.3, order: 1 },
    ],
    riskSummary: {
      exitProbability: 0.75,
      dumpRiskScore: 60,
      pathEntropy: 0.4,
      contextualRiskScore: 65,
      marketAmplifier: 1.15,
      confidenceImpact: 0.05,
      contextTags: ['VOLUME_SPIKE', 'EXIT_PATTERN'],
      marketRegime: 'VOLATILE',
    },
    explain: {
      reasons: [
        { code: 'EXIT_TO_CEX', title: 'Exit to CEX', description: 'Funds deposited to exchange', severity: 'HIGH' },
        { code: 'CROSS_CHAIN', title: 'Cross-chain', description: 'Bridge operation', severity: 'MEDIUM' },
      ],
      amplifiers: [
        { tag: 'VOLUME_SPIKE', multiplier: 1.15, source: 'MARKET' },
      ],
      suppressors: [],
    },
  };
  
  describe('mapExplainData', () => {
    test('should map risk summary correctly', () => {
      const result = mapExplainData(mockGraphData);
      
      expect(result.riskScore).toBe(65);
      expect(result.exitProbability).toBe(0.75);
      expect(result.entropy).toBe(0.4);
      expect(result.marketAmplifier).toBe(1.15);
      expect(result.marketRegime).toBe('VOLATILE');
    });
    
    test('should map segments from highlighted path', () => {
      const result = mapExplainData(mockGraphData);
      
      expect(result.segments.length).toBe(2);
      expect(result.segments[0].edgeId).toBe('edge-1');
      expect(result.segments[0].reason).toBe('origin_of_route');
      expect(result.segments[0].shortLabel).toBe('Origin');
      expect(result.segments[1].shortLabel).toBe('Bridge');
    });
    
    test('should include edge metadata in segments', () => {
      const result = mapExplainData(mockGraphData);
      
      // First segment - simple transfer
      expect(result.segments[0].type).toBe('TRANSFER');
      expect(result.segments[0].chain).toBe('ethereum');
      
      // Second segment - bridge
      expect(result.segments[1].type).toBe('BRIDGE');
      expect(result.segments[1].chainFrom).toBe('ethereum');
      expect(result.segments[1].chainTo).toBe('arbitrum');
      expect(result.segments[1].protocol).toBe('Stargate');
    });
    
    test('should map reasons from explain block', () => {
      const result = mapExplainData(mockGraphData);
      
      expect(result.reasons.length).toBe(2);
      expect(result.reasons[0].code).toBe('EXIT_TO_CEX');
      expect(result.reasons[0].severity).toBe('HIGH');
    });
    
    test('should map amplifiers and suppressors', () => {
      const result = mapExplainData(mockGraphData);
      
      expect(result.amplifiers.length).toBe(1);
      expect(result.amplifiers[0].tag).toBe('VOLUME_SPIKE');
      expect(result.amplifiers[0].multiplier).toBe(1.15);
      expect(result.suppressors.length).toBe(0);
    });
    
    test('should map context tags', () => {
      const result = mapExplainData(mockGraphData);
      
      expect(result.contextTags).toContain('VOLUME_SPIKE');
      expect(result.contextTags).toContain('EXIT_PATTERN');
    });
    
    test('should handle null input', () => {
      const result = mapExplainData(null);
      
      expect(result.riskScore).toBe(0);
      expect(result.exitProbability).toBe(0);
      expect(result.segments).toEqual([]);
      expect(result.reasons).toEqual([]);
    });
    
    test('should handle partial data', () => {
      const partialData = {
        nodes: [],
        edges: [],
        riskSummary: { dumpRiskScore: 50 },
      };
      
      const result = mapExplainData(partialData);
      
      expect(result.riskScore).toBe(50);
      expect(result.segments).toEqual([]);
    });
  });
  
  describe('getRiskLevel', () => {
    test('should return CRITICAL for score >= 80', () => {
      expect(getRiskLevel(80)).toBe('CRITICAL');
      expect(getRiskLevel(100)).toBe('CRITICAL');
    });
    
    test('should return HIGH for score >= 60', () => {
      expect(getRiskLevel(60)).toBe('HIGH');
      expect(getRiskLevel(79)).toBe('HIGH');
    });
    
    test('should return MEDIUM for score >= 40', () => {
      expect(getRiskLevel(40)).toBe('MEDIUM');
      expect(getRiskLevel(59)).toBe('MEDIUM');
    });
    
    test('should return LOW for score < 40', () => {
      expect(getRiskLevel(39)).toBe('LOW');
      expect(getRiskLevel(0)).toBe('LOW');
    });
  });
  
  describe('getRiskLevelColor', () => {
    test('should return correct colors for each level', () => {
      expect(getRiskLevelColor('CRITICAL')).toBe('#DC2626');
      expect(getRiskLevelColor('HIGH')).toBe('#EF4444');
      expect(getRiskLevelColor('MEDIUM')).toBe('#F59E0B');
      expect(getRiskLevelColor('LOW')).toBe('#22C55E');
    });
    
    test('should return gray for unknown level', () => {
      expect(getRiskLevelColor('UNKNOWN')).toBe('#6B7280');
    });
  });
  
  describe('formatPercent', () => {
    test('should format decimal to percentage', () => {
      expect(formatPercent(0.75)).toBe('75%');
      expect(formatPercent(0.5)).toBe('50%');
      expect(formatPercent(1)).toBe('100%');
    });
    
    test('should support decimal places', () => {
      expect(formatPercent(0.7543, 1)).toBe('75.4%');
      expect(formatPercent(0.7543, 2)).toBe('75.43%');
    });
  });
  
  describe('formatMultiplier', () => {
    test('should format multiplier with 2 decimal places', () => {
      expect(formatMultiplier(1.15)).toBe('1.15x');
      expect(formatMultiplier(1)).toBe('1.00x');
      expect(formatMultiplier(0.85)).toBe('0.85x');
    });
  });
  
  describe('sortReasonsBySeverity', () => {
    test('should sort reasons by severity (CRITICAL first)', () => {
      const reasons = [
        { code: 'A', severity: 'LOW' },
        { code: 'B', severity: 'CRITICAL' },
        { code: 'C', severity: 'MEDIUM' },
        { code: 'D', severity: 'HIGH' },
      ];
      
      const sorted = sortReasonsBySeverity(reasons);
      
      expect(sorted[0].severity).toBe('CRITICAL');
      expect(sorted[1].severity).toBe('HIGH');
      expect(sorted[2].severity).toBe('MEDIUM');
      expect(sorted[3].severity).toBe('LOW');
    });
    
    test('should not mutate original array', () => {
      const reasons = [
        { code: 'A', severity: 'LOW' },
        { code: 'B', severity: 'HIGH' },
      ];
      
      const sorted = sortReasonsBySeverity(reasons);
      
      expect(reasons[0].severity).toBe('LOW');
      expect(sorted[0].severity).toBe('HIGH');
    });
  });
  
  describe('getSegmentTypeColor', () => {
    test('should return correct colors for edge types', () => {
      expect(getSegmentTypeColor('TRANSFER')).toBe('#6B7280');
      expect(getSegmentTypeColor('SWAP')).toBe('#10B981');
      expect(getSegmentTypeColor('BRIDGE')).toBe('#F59E0B');
      expect(getSegmentTypeColor('DEPOSIT')).toBe('#EF4444');
    });
    
    test('should return gray for unknown type', () => {
      expect(getSegmentTypeColor('UNKNOWN')).toBe('#6B7280');
    });
  });
});
