/**
 * Timeline Market Overlay Tests (P1.9.B)
 * 
 * Unit tests for market overlay logic.
 * Tests pure data transformation without UI.
 */

import {
  applyMarketOverlay,
  getRegimeConfig,
  getMarketTagLabel,
  getMarketTagColor,
  isSignificantMarketContext,
  getCombinedSeverity,
  getMarketOverlaySummary,
} from '../timelineMarket.overlay';
import { MARKET_REGIMES, RISK_TAGS } from '../timeline.types';

describe('timelineMarket.overlay', () => {
  // Test data
  const mockTimelineSteps = [
    { index: 1, type: 'TRANSFER', chain: 'ETH', edgeId: 'e1' },
    { index: 2, type: 'BRIDGE', chain: 'ARB', edgeId: 'e2' },
    { index: 3, type: 'CEX_DEPOSIT', chain: 'ARB', edgeId: 'e3' },
  ];
  
  const mockMarketContextStable = {
    regime: MARKET_REGIMES.STABLE,
    volumeSpike: false,
    liquidityDrop: false,
    confidenceImpact: 0,
    marketAmplifier: 1.0,
    contextTags: [],
  };
  
  const mockMarketContextVolatile = {
    regime: MARKET_REGIMES.VOLATILE,
    volumeSpike: true,
    liquidityDrop: false,
    confidenceImpact: -0.05,
    marketAmplifier: 1.15,
    contextTags: ['EXIT_PATTERN'],
  };
  
  const mockMarketContextStressed = {
    regime: MARKET_REGIMES.STRESSED,
    volumeSpike: true,
    liquidityDrop: true,
    confidenceImpact: -0.2,
    marketAmplifier: 1.35,
    contextTags: ['MARKET_STRESS', 'THIN_LIQUIDITY'],
  };
  
  describe('applyMarketOverlay', () => {
    test('should apply market context to all steps', () => {
      const result = applyMarketOverlay(mockTimelineSteps, mockMarketContextVolatile);
      
      expect(result).toHaveLength(3);
      
      // All steps should have same market context
      for (const step of result) {
        expect(step.market).toBeDefined();
        expect(step.market.regime).toBe(MARKET_REGIMES.VOLATILE);
      }
    });
    
    test('should set correct severity based on regime', () => {
      const stableResult = applyMarketOverlay(mockTimelineSteps, mockMarketContextStable);
      const volatileResult = applyMarketOverlay(mockTimelineSteps, mockMarketContextVolatile);
      const stressedResult = applyMarketOverlay(mockTimelineSteps, mockMarketContextStressed);
      
      expect(stableResult[0].market.severity).toBe(RISK_TAGS.LOW);
      expect(volatileResult[0].market.severity).toBe(RISK_TAGS.MEDIUM);
      expect(stressedResult[0].market.severity).toBe(RISK_TAGS.HIGH);
    });
    
    test('should build market tags correctly', () => {
      const result = applyMarketOverlay(mockTimelineSteps, mockMarketContextStressed);
      
      const tags = result[0].market.tags;
      expect(tags).toContain('VOLUME_SPIKE');
      expect(tags).toContain('LIQUIDITY_DROP');
      expect(tags).toContain('CONFIDENCE_DOWN');
      expect(tags).toContain('AMPLIFIED_RISK');
      expect(tags).toContain('MARKET_STRESS');
      expect(tags).toContain('THIN_LIQUIDITY');
    });
    
    test('should include additional market fields', () => {
      const result = applyMarketOverlay(mockTimelineSteps, mockMarketContextVolatile);
      
      expect(result[0].market.volumeSpike).toBe(true);
      expect(result[0].market.liquidityDrop).toBe(false);
      expect(result[0].market.confidenceImpact).toBe(-0.05);
      expect(result[0].market.marketAmplifier).toBe(1.15);
    });
    
    test('should return steps without market for null context', () => {
      const result = applyMarketOverlay(mockTimelineSteps, null);
      
      expect(result).toHaveLength(3);
      for (const step of result) {
        expect(step.market).toBeUndefined();
      }
    });
    
    test('should return empty array for null steps', () => {
      expect(applyMarketOverlay(null, mockMarketContextVolatile)).toEqual([]);
      expect(applyMarketOverlay([], mockMarketContextVolatile)).toEqual([]);
    });
    
    test('should not mutate input steps', () => {
      const originalSteps = JSON.parse(JSON.stringify(mockTimelineSteps));
      applyMarketOverlay(mockTimelineSteps, mockMarketContextVolatile);
      
      expect(mockTimelineSteps).toEqual(originalSteps);
    });
    
    test('should handle marketRegime alias', () => {
      const contextWithAlias = {
        marketRegime: MARKET_REGIMES.STRESSED,
        volumeSpike: true,
      };
      
      const result = applyMarketOverlay(mockTimelineSteps, contextWithAlias);
      expect(result[0].market.regime).toBe(MARKET_REGIMES.STRESSED);
    });
  });
  
  describe('getRegimeConfig', () => {
    test('should return config for each regime', () => {
      const stable = getRegimeConfig(MARKET_REGIMES.STABLE);
      const volatile = getRegimeConfig(MARKET_REGIMES.VOLATILE);
      const stressed = getRegimeConfig(MARKET_REGIMES.STRESSED);
      
      expect(stable.label).toBe('Stable Market');
      expect(volatile.label).toBe('Volatile Market');
      expect(stressed.label).toBe('Stressed Market');
      
      expect(stable.severity).toBe(RISK_TAGS.LOW);
      expect(volatile.severity).toBe(RISK_TAGS.MEDIUM);
      expect(stressed.severity).toBe(RISK_TAGS.HIGH);
    });
    
    test('should return stable config for unknown regime', () => {
      const config = getRegimeConfig('UNKNOWN');
      expect(config.label).toBe('Stable Market');
    });
  });
  
  describe('getMarketTagLabel', () => {
    test('should return human-readable labels', () => {
      expect(getMarketTagLabel('VOLUME_SPIKE')).toBe('Volume Spike');
      expect(getMarketTagLabel('LIQUIDITY_DROP')).toBe('Liquidity Drop');
      expect(getMarketTagLabel('CONFIDENCE_DOWN')).toBe('Confidence Impact');
    });
    
    test('should handle unknown tags', () => {
      expect(getMarketTagLabel('CUSTOM_TAG')).toBe('CUSTOM TAG');
    });
  });
  
  describe('getMarketTagColor', () => {
    test('should return colors for known tags', () => {
      expect(getMarketTagColor('VOLUME_SPIKE')).toBe('#F59E0B');
      expect(getMarketTagColor('LIQUIDITY_DROP')).toBe('#EF4444');
    });
    
    test('should return gray for unknown tags', () => {
      expect(getMarketTagColor('UNKNOWN')).toBe('#6B7280');
    });
  });
  
  describe('isSignificantMarketContext', () => {
    test('should return true for stressed regime', () => {
      expect(isSignificantMarketContext({ regime: MARKET_REGIMES.STRESSED })).toBe(true);
    });
    
    test('should return true for volume spike', () => {
      expect(isSignificantMarketContext({ regime: MARKET_REGIMES.STABLE, volumeSpike: true })).toBe(true);
    });
    
    test('should return true for liquidity drop', () => {
      expect(isSignificantMarketContext({ regime: MARKET_REGIMES.STABLE, liquidityDrop: true })).toBe(true);
    });
    
    test('should return true for high amplifier', () => {
      expect(isSignificantMarketContext({ regime: MARKET_REGIMES.STABLE, marketAmplifier: 1.2 })).toBe(true);
    });
    
    test('should return false for stable with no flags', () => {
      expect(isSignificantMarketContext(mockMarketContextStable)).toBe(false);
    });
    
    test('should return false for null', () => {
      expect(isSignificantMarketContext(null)).toBe(false);
    });
  });
  
  describe('getCombinedSeverity', () => {
    test('should return higher severity', () => {
      expect(getCombinedSeverity('LOW', 'HIGH')).toBe('HIGH');
      expect(getCombinedSeverity('HIGH', 'LOW')).toBe('HIGH');
      expect(getCombinedSeverity('MEDIUM', 'HIGH')).toBe('HIGH');
    });
    
    test('should return same if equal', () => {
      expect(getCombinedSeverity('MEDIUM', 'MEDIUM')).toBe('MEDIUM');
    });
  });
  
  describe('getMarketOverlaySummary', () => {
    test('should summarize stable market', () => {
      const summary = getMarketOverlaySummary(mockMarketContextStable);
      
      expect(summary.regime).toBe(MARKET_REGIMES.STABLE);
      expect(summary.severity).toBe(RISK_TAGS.LOW);
      expect(summary.tags).toEqual([]);
    });
    
    test('should summarize volatile market', () => {
      const summary = getMarketOverlaySummary(mockMarketContextVolatile);
      
      expect(summary.regime).toBe(MARKET_REGIMES.VOLATILE);
      expect(summary.description).toContain('volume spike');
      expect(summary.tags.length).toBeGreaterThan(0);
    });
    
    test('should summarize stressed market', () => {
      const summary = getMarketOverlaySummary(mockMarketContextStressed);
      
      expect(summary.regime).toBe(MARKET_REGIMES.STRESSED);
      expect(summary.severity).toBe(RISK_TAGS.HIGH);
      expect(summary.description).toContain('liquidity');
    });
    
    test('should handle null context', () => {
      const summary = getMarketOverlaySummary(null);
      
      expect(summary.regime).toBe('STABLE');
      expect(summary.description).toBe('Normal market conditions');
    });
  });
});
