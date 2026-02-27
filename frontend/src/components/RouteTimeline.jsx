/**
 * RouteTimeline Component (P1.9.A + P1.9.B + P1.9.C + STABILIZATION)
 * 
 * Main timeline component showing route steps.
 * Syncs with graph selection (P1.8).
 * 
 * P1.9.C: Bidirectional sync with graph
 * - Click step → highlight edge in graph
 * - Graph click → scroll timeline to step
 * 
 * STABILIZATION:
 * - Memoized child components
 * - Stable callback references
 */

import { useMemo, useCallback, memo, useRef } from 'react';
import { 
  Clock, GitBranch, LogIn, RefreshCw, AlertTriangle, 
  ChevronDown, ChevronUp, Filter
} from 'lucide-react';
import { mapGraphToTimeline, getTimelineStats, formatDuration } from '../graph-timeline';
import { applyMarketOverlay, getMarketOverlaySummary, isSignificantMarketContext } from '../graph-timeline/timelineMarket.overlay';
import { STEP_TYPE_CONFIG, MARKET_REGIME_CONFIG } from '../graph-timeline/timeline.types';
import TimelineStep from './TimelineStep';

// ============================================
// Timeline Header (STABILIZATION: Memoized)
// ============================================

const TimelineHeader = memo(function TimelineHeader({ stats, marketSummary, onToggleCollapse, isCollapsed }) {
  return (
    <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 rounded-t-xl">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
          <Clock className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-sm">Route Timeline</h3>
          <p className="text-[10px] text-gray-500">
            {stats.totalSteps} steps • {stats.uniqueChains} chains • {formatDuration(stats.duration)}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Market regime badge */}
        {marketSummary && marketSummary.regime !== 'STABLE' && (
          <span 
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold"
            style={{
              backgroundColor: MARKET_REGIME_CONFIG[marketSummary.regime]?.bgColor,
              color: MARKET_REGIME_CONFIG[marketSummary.regime]?.color,
            }}
          >
            <AlertTriangle className="w-3 h-3" />
            {marketSummary.regime}
          </span>
        )}
        
        {/* Collapse button */}
        <button 
          onClick={onToggleCollapse}
          className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
        >
          {isCollapsed ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          )}
        </button>
      </div>
    </div>
  );
});

TimelineHeader.displayName = 'TimelineHeader';

// ============================================
// Timeline Stats Bar (STABILIZATION: Memoized)
// ============================================

const TimelineStatsBar = memo(function TimelineStatsBar({ stats }) {
  return (
    <div className="flex items-center gap-4 p-2 bg-white border-b border-gray-100 text-[10px]">
      {stats.hasBridge && (
        <span className="flex items-center gap-1 text-amber-600">
          <GitBranch className="w-3 h-3" />
          Cross-chain
        </span>
      )}
      {stats.hasCexExit && (
        <span className="flex items-center gap-1 text-red-600">
          <LogIn className="w-3 h-3" />
          CEX Exit
        </span>
      )}
      {stats.hasSwap && (
        <span className="flex items-center gap-1 text-green-600">
          <RefreshCw className="w-3 h-3" />
          DEX Swap
        </span>
      )}
    </div>
  );
});

TimelineStatsBar.displayName = 'TimelineStatsBar';

// ============================================
// Empty State (STABILIZATION: Memoized)
// ============================================

const TimelineEmpty = memo(function TimelineEmpty() {
  return (
    <div className="p-8 text-center">
      <Clock className="w-8 h-8 text-gray-700 mx-auto mb-3" />
      <p className="text-sm text-gray-500">No timeline data</p>
      <p className="text-xs text-gray-400 mt-1">Select a route to view timeline</p>
    </div>
  );
});

TimelineEmpty.displayName = 'TimelineEmpty';

// ============================================
// Main Component (P1.9.C: with sync support)
// ============================================

const RouteTimeline = memo(function RouteTimeline({
  graphSnapshot,
  marketContext,
  selectedEdgeId,
  onStepClick,
  showMarket = true,
  className = '',
  stepRefsCallback, // P1.9.C: callback to register step refs for scroll targeting
}) {
  // P1.9.C: Map to store step refs for scrollIntoView
  const stepRefsMap = useRef(new Map());
  
  // Derive timeline from graph snapshot
  const timeline = useMemo(() => {
    const rawTimeline = mapGraphToTimeline(graphSnapshot);
    
    // Apply market overlay if available (P1.9.B)
    if (showMarket && marketContext) {
      return applyMarketOverlay(rawTimeline, marketContext);
    }
    
    return rawTimeline;
  }, [graphSnapshot, marketContext, showMarket]);
  
  // Get stats
  const stats = useMemo(() => {
    return getTimelineStats(timeline);
  }, [timeline]);
  
  // Get market summary
  const marketSummary = useMemo(() => {
    if (!showMarket || !marketContext) return null;
    return getMarketOverlaySummary(marketContext);
  }, [marketContext, showMarket]);
  
  // Handle step click -> sync with graph (P1.9.C)
  const handleStepClick = useCallback((step) => {
    if (onStepClick) {
      onStepClick(step.edgeId, step);
    }
  }, [onStepClick]);
  
  // P1.9.C: Create ref callback for each step
  const getStepRef = useCallback((edgeId) => {
    return (element) => {
      if (element) {
        stepRefsMap.current.set(edgeId, element);
        stepRefsCallback?.(edgeId, element);
      } else {
        stepRefsMap.current.delete(edgeId);
        stepRefsCallback?.(edgeId, null);
      }
    };
  }, [stepRefsCallback]);
  
  // P1.9.C: Scroll to step by edgeId (called from parent via ref)
  const scrollToStep = useCallback((edgeId) => {
    const element = stepRefsMap.current.get(edgeId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return true;
    }
    return false;
  }, []);
  
  // No data
  if (!timeline || timeline.length === 0) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 ${className}`}>
        <TimelineHeader 
          stats={{ totalSteps: 0, uniqueChains: 0, duration: 0 }} 
          marketSummary={null}
          onToggleCollapse={() => {}}
          isCollapsed={false}
        />
        <TimelineEmpty />
      </div>
    );
  }
  
  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`} data-testid="route-timeline">
      {/* Header */}
      <TimelineHeader 
        stats={stats} 
        marketSummary={marketSummary}
        onToggleCollapse={() => {}}
        isCollapsed={false}
      />
      
      {/* Stats bar */}
      <TimelineStatsBar stats={stats} />
      
      {/* Steps */}
      <div className="p-3 space-y-3 max-h-[500px] overflow-y-auto" data-testid="timeline-steps-container">
        {timeline.map((step, index) => (
          <TimelineStep
            key={step.edgeId}
            step={step}
            isSelected={step.edgeId === selectedEdgeId}
            isFirst={index === 0}
            isLast={index === timeline.length - 1}
            onClick={handleStepClick}
            showMarket={showMarket}
            stepRef={getStepRef(step.edgeId)}
          />
        ))}
      </div>
      
      {/* Footer with market summary (P1.9.B) */}
      {showMarket && marketSummary && isSignificantMarketContext(marketContext) && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-gray-700">Market Context</div>
              <div className="text-[10px] text-gray-500">{marketSummary.description}</div>
              {marketSummary.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {marketSummary.tags.slice(0, 4).map((tag, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded text-[9px]">
                      {tag.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

RouteTimeline.displayName = 'RouteTimeline';

export default RouteTimeline;
