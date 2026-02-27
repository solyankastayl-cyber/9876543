/**
 * ChainBadge Component (P2.3.3 BLOCK 1)
 * 
 * Universal chain badge for all UI components
 */
import React from 'react';
import { getChainMeta } from '../utils/chainMeta';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

function ChainBadge({ chain, size = 'sm', showTooltip = true }) {
  if (!chain) return null;
  
  const meta = getChainMeta(chain);
  
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };
  
  const badge = (
    <span 
      className={`
        inline-flex items-center rounded-md font-medium border
        ${meta.color} ${meta.bgColor} ${meta.borderColor}
        ${sizeClasses[size]}
      `}
    >
      {meta.shortName}
    </span>
  );
  
  if (!showTooltip) {
    return badge;
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            Activity on {meta.name}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Bridge Flow Badge (two chains with arrow)
 */
export function BridgeFlowBadge({ fromChain, toChain }) {
  if (!fromChain || !toChain) return null;
  
  return (
    <div className="inline-flex items-center gap-1">
      <ChainBadge chain={fromChain} size="xs" showTooltip={false} />
      <span className="text-gray-400 text-xs">→</span>
      <ChainBadge chain={toChain} size="xs" showTooltip={false} />
    </div>
  );
}

export default ChainBadge;
