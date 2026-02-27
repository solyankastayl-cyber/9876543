/**
 * TimelineStep Component (P1.9.A + STABILIZATION)
 * 
 * Single step in the route timeline.
 * Pure presentational component.
 * 
 * STABILIZATION: Memoized to prevent unnecessary re-renders
 */

import { memo } from 'react';
import { 
  ArrowRight, RefreshCw, GitBranch, LogIn, LogOut, Code, 
  AlertTriangle, Clock 
} from 'lucide-react';
import { STEP_TYPE_CONFIG, RISK_TAG_CONFIG, MARKET_REGIME_CONFIG } from '../graph-timeline/timeline.types';
import { formatTimestamp } from '../graph-timeline/timeline.mapper';
import { getMarketTagLabel, getMarketTagColor } from '../graph-timeline/timelineMarket.overlay';

// Icon mapping
const STEP_ICONS = {
  TRANSFER: ArrowRight,
  SWAP: RefreshCw,
  BRIDGE: GitBranch,
  CEX_DEPOSIT: LogIn,
  CEX_WITHDRAW: LogOut,
  CONTRACT_CALL: Code,
};

const TimelineStep = memo(function TimelineStep({ 
  step, 
  isSelected = false,
  isFirst = false,
  isLast = false,
  onClick,
  showMarket = true,
  stepRef, // P1.9.C: ref for scroll targeting
}) {
  if (!step) return null;
  
  const config = STEP_TYPE_CONFIG[step.type] || STEP_TYPE_CONFIG.TRANSFER;
  const riskConfig = step.riskTag ? RISK_TAG_CONFIG[step.riskTag] : null;
  const Icon = STEP_ICONS[step.type] || ArrowRight;
  const hasMarket = showMarket && step.market && step.market.regime !== 'STABLE';
  
  return (
    <div 
      ref={stepRef}
      className={`relative group cursor-pointer transition-all ${
        isSelected ? 'scale-[1.02]' : 'hover:scale-[1.01]'
      }`}
      onClick={() => onClick?.(step)}
      data-testid={`timeline-step-${step.index}`}
    >
      {/* Connector line */}
      {!isFirst && (
        <div className="absolute left-5 -top-3 w-0.5 h-3 bg-gray-200" />
      )}
      
      {/* Step card */}
      <div className={`
        relative flex items-start gap-3 p-3 rounded-xl border transition-all
        ${isSelected 
          ? 'border-gray-900 bg-gray-50 shadow-md' 
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
        }
      `}>
        {/* Step number & icon */}
        <div 
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: config.bgColor }}
        >
          <Icon className="w-5 h-5" style={{ color: config.color }} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-gray-400">#{step.index}</span>
            <span className="font-semibold text-gray-900 text-sm">{config.label}</span>
            
            {/* Risk tag */}
            {riskConfig && (
              <span 
                className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                style={{ backgroundColor: riskConfig.bgColor, color: riskConfig.color }}
              >
                {step.riskTag}
              </span>
            )}
          </div>
          
          {/* Chain info */}
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
            <span className="px-1.5 py-0.5 bg-gray-100 rounded font-mono uppercase text-[10px]">
              {step.chain}
            </span>
            {step.chainFrom && step.chainTo && (
              <>
                <span className="text-gray-700">→</span>
                <span className="px-1.5 py-0.5 bg-gray-100 rounded font-mono uppercase text-[10px]">
                  {step.chainTo}
                </span>
              </>
            )}
          </div>
          
          {/* From → To */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-gray-600 truncate max-w-[100px]" title={step.from.label}>
              {step.from.label}
            </span>
            <ArrowRight className="w-3 h-3 text-gray-700 flex-shrink-0" />
            <span className="text-gray-600 truncate max-w-[100px]" title={step.to.label}>
              {step.to.label}
            </span>
          </div>
          
          {/* Asset (if available) */}
          {step.asset && step.asset.amount && (
            <div className="text-xs text-gray-500 mt-1">
              {step.asset.amount.toLocaleString()} {step.asset.symbol}
              {step.asset.amountUsd && (
                <span className="text-gray-400"> (${step.asset.amountUsd.toLocaleString()})</span>
              )}
            </div>
          )}
          
          {/* Protocol */}
          {step.protocol && (
            <div className="text-[10px] text-gray-400 mt-0.5">
              via {step.protocol}
            </div>
          )}
        </div>
        
        {/* Right side: timestamp & market */}
        <div className="flex-shrink-0 text-right">
          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            <Clock className="w-3 h-3" />
            {formatTimestamp(step.timestamp)}
          </div>
          
          {/* Market badge (P1.9.B) */}
          {hasMarket && (
            <div 
              className="mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1"
              style={{ 
                backgroundColor: MARKET_REGIME_CONFIG[step.market.regime]?.bgColor,
                color: MARKET_REGIME_CONFIG[step.market.regime]?.color,
              }}
            >
              <AlertTriangle className="w-2.5 h-2.5" />
              {step.market.regime}
            </div>
          )}
        </div>
      </div>
      
      {/* Market tags tooltip on hover (P1.9.B) */}
      {hasMarket && step.market.tags.length > 0 && (
        <div className="
          absolute left-full ml-2 top-0 z-10 
          opacity-0 group-hover:opacity-100 pointer-events-none
          transition-opacity
        ">
          <div className="bg-white text-white rounded-lg p-2 text-xs shadow-lg max-w-[160px]">
            <div className="font-semibold mb-1">Market Context</div>
            <div className="flex flex-wrap gap-1">
              {step.market.tags.slice(0, 3).map((tag, i) => (
                <span 
                  key={i}
                  className="px-1.5 py-0.5 rounded text-[9px]"
                  style={{ backgroundColor: getMarketTagColor(tag) }}
                >
                  {getMarketTagLabel(tag)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Connector to next */}
      {!isLast && (
        <div className="absolute left-5 -bottom-3 w-0.5 h-3 bg-gray-200" />
      )}
    </div>
  );
});

TimelineStep.displayName = 'TimelineStep';

export default TimelineStep;
