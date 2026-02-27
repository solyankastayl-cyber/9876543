/**
 * Edge Explain Adapter Tests (P1.8.E)
 * 
 * Unit tests for edge explanation lookup.
 * Tests pure lookup functions without UI.
 */

import { 
  explainEdge, 
  findSegmentByEdgeId,
  isEdgeInPath,
  getEdgeRiskContribution,
  getEdgeExplanation,
  getSegmentContext
} from '../graph/edgeExplain.adapter';

describe('edgeExplain.adapter', () => {
  // Test data
  const mockSegments = [
    { 
      edgeId: 'edge-1', 
      reason: 'origin_of_route', 
      riskContribution: 0.1, 
      order: 0,
      shortLabel: 'Origin',
      type: 'TRANSFER',
      chain: 'ethereum'
    },
    { 
      edgeId: 'edge-2', 
      reason: 'cross_chain_migration', 
      riskContribution: 0.3, 
      order: 1,
      shortLabel: 'Bridge',
      type: 'BRIDGE',
      chainFrom: 'ethereum',
      chainTo: 'arbitrum'
    },
    { 
      edgeId: 'edge-3', 
      reason: 'exit_to_cex', 
      riskContribution: 0.5, 
      order: 2,
      shortLabel: 'CEX Exit',
      type: 'DEPOSIT',
      chain: 'arbitrum'
    },
  ];
  
  const mockEdge = {
    id: 'edge-1',
    type: 'TRANSFER',
    chain: 'ethereum',
    fromNodeId: 'node-1',
    toNodeId: 'node-2',
    meta: { amount: 100, token: 'ETH' }
  };
  
  const mockBridgeEdge = {
    id: 'edge-2',
    type: 'BRIDGE',
    chainFrom: 'ethereum',
    chainTo: 'arbitrum',
    fromNodeId: 'node-1',
    toNodeId: 'node-3',
    meta: { protocol: 'Stargate', amountUsd: 50000 }
  };
  
  describe('explainEdge', () => {
    test('should find segment for edge', () => {
      const result = explainEdge(mockEdge, mockSegments);
      
      expect(result).not.toBeNull();
      expect(result.edgeId).toBe('edge-1');
      expect(result.reason).toBe('origin_of_route');
    });
    
    test('should return null for unknown edge', () => {
      const unknownEdge = { id: 'edge-999' };
      const result = explainEdge(unknownEdge, mockSegments);
      
      expect(result).toBeNull();
    });
    
    test('should return null for null edge', () => {
      expect(explainEdge(null, mockSegments)).toBeNull();
    });
    
    test('should return null for empty segments', () => {
      expect(explainEdge(mockEdge, [])).toBeNull();
      expect(explainEdge(mockEdge, null)).toBeNull();
    });
  });
  
  describe('findSegmentByEdgeId', () => {
    test('should find segment by edge ID', () => {
      const result = findSegmentByEdgeId('edge-2', mockSegments);
      
      expect(result).not.toBeNull();
      expect(result.reason).toBe('cross_chain_migration');
    });
    
    test('should return null for unknown ID', () => {
      expect(findSegmentByEdgeId('edge-999', mockSegments)).toBeNull();
    });
  });
  
  describe('isEdgeInPath', () => {
    test('should return true for edge in path', () => {
      expect(isEdgeInPath('edge-1', mockSegments)).toBe(true);
      expect(isEdgeInPath('edge-2', mockSegments)).toBe(true);
      expect(isEdgeInPath('edge-3', mockSegments)).toBe(true);
    });
    
    test('should return false for edge not in path', () => {
      expect(isEdgeInPath('edge-999', mockSegments)).toBe(false);
    });
  });
  
  describe('getEdgeRiskContribution', () => {
    test('should return risk contribution for edge', () => {
      expect(getEdgeRiskContribution('edge-1', mockSegments)).toBe(0.1);
      expect(getEdgeRiskContribution('edge-3', mockSegments)).toBe(0.5);
    });
    
    test('should return 0 for unknown edge', () => {
      expect(getEdgeRiskContribution('edge-999', mockSegments)).toBe(0);
    });
  });
  
  describe('getEdgeExplanation', () => {
    test('should explain transfer edge', () => {
      const result = getEdgeExplanation(mockEdge, mockSegments[0]);
      
      expect(result.title).toBe('TRANSFER');
      expect(result.description).toBe('Simple token transfer between addresses');
      expect(result.isHighlighted).toBe(true);
      expect(result.reason).toBe('origin_of_route');
    });
    
    test('should explain bridge edge', () => {
      const result = getEdgeExplanation(mockBridgeEdge, mockSegments[1]);
      
      expect(result.title).toBe('BRIDGE');
      expect(result.description).toBe('Cross-chain bridge operation');
      expect(result.details.some(d => d.label === 'Bridge')).toBe(true);
      expect(result.details.some(d => d.label === 'Protocol')).toBe(true);
      expect(result.details.some(d => d.label === 'Amount')).toBe(true);
    });
    
    test('should include risk contribution in details', () => {
      const result = getEdgeExplanation(mockEdge, mockSegments[0]);
      
      const riskDetail = result.details.find(d => d.label === 'Risk Contribution');
      expect(riskDetail).toBeDefined();
      expect(riskDetail.value).toBe('10%');
    });
    
    test('should handle edge without segment', () => {
      const result = getEdgeExplanation(mockEdge, null);
      
      expect(result.isHighlighted).toBe(false);
      expect(result.reason).toBeUndefined();
    });
    
    test('should handle null edge', () => {
      const result = getEdgeExplanation(null, null);
      
      expect(result.title).toBe('Unknown Edge');
      expect(result.description).toBe('No data available');
    });
  });
  
  describe('getSegmentContext', () => {
    test('should return prev, current, next for middle segment', () => {
      const result = getSegmentContext('edge-2', mockSegments);
      
      expect(result.prev).not.toBeNull();
      expect(result.prev.edgeId).toBe('edge-1');
      
      expect(result.current).not.toBeNull();
      expect(result.current.edgeId).toBe('edge-2');
      
      expect(result.next).not.toBeNull();
      expect(result.next.edgeId).toBe('edge-3');
    });
    
    test('should return null prev for first segment', () => {
      const result = getSegmentContext('edge-1', mockSegments);
      
      expect(result.prev).toBeNull();
      expect(result.current).not.toBeNull();
      expect(result.next).not.toBeNull();
    });
    
    test('should return null next for last segment', () => {
      const result = getSegmentContext('edge-3', mockSegments);
      
      expect(result.prev).not.toBeNull();
      expect(result.current).not.toBeNull();
      expect(result.next).toBeNull();
    });
    
    test('should return all nulls for unknown edge', () => {
      const result = getSegmentContext('edge-999', mockSegments);
      
      expect(result.prev).toBeNull();
      expect(result.current).toBeNull();
      expect(result.next).toBeNull();
    });
  });
});
