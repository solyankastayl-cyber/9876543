/**
 * CrossChainFlow Component (P2.3.3 BLOCK 3)
 * 
 * Text-based cross-chain migration flow visualization
 */
import React from 'react';
import { ArrowRight, TrendingUp } from 'lucide-react';
import ChainBadge from './ChainBadge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

/**
 * Simple chain path display: ETH → ARB → OP
 */
export function ChainPath({ chains, confidence }) {
  if (!chains || chains.length === 0) return null;
  
  return (
    <div className="inline-flex items-center gap-2 flex-wrap">
      {chains.map((chain, idx) => (
        <React.Fragment key={idx}>
          <ChainBadge chain={chain} size="xs" showTooltip={false} />
          {idx < chains.length - 1 && (
            <ArrowRight className="w-3 h-3 text-gray-400" />
          )}
        </React.Fragment>
      ))}
      
      {confidence !== undefined && confidence > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={`
                px-1.5 py-0.5 rounded text-[10px] font-medium
                ${confidence >= 0.8 
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                  : confidence >= 0.6
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
                }
              `}>
                {Math.round(confidence * 100)}%
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                Bridge confidence: {Math.round(confidence * 100)}%
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

/**
 * Cross-chain journey section for actor profile
 */
export function CrossChainJourney({ routes, chains }) {
  if (!routes || routes.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-blue-600" />
        <h4 className="text-sm font-semibold text-gray-900">Cross-Chain Journey</h4>
      </div>
      
      {/* Active chains summary */}
      {chains && chains.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-600 mb-2">Active on {chains.length} chains:</div>
          <div className="flex flex-wrap gap-1.5">
            {chains.map(chain => (
              <ChainBadge key={chain} chain={chain} size="xs" />
            ))}
          </div>
        </div>
      )}
      
      {/* Top migration routes */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-600 mb-2">
          Top Migration Routes:
        </div>
        {routes.slice(0, 5).map((route, idx) => (
          <div 
            key={idx}
            className="flex items-center justify-between bg-white/70 rounded-lg p-2"
          >
            <ChainPath 
              chains={[route.from, route.to]} 
              confidence={route.confidence}
            />
            
            <div className="text-xs text-gray-500">
              {route.count || 0}x
            </div>
          </div>
        ))}
      </div>
      
      {routes.length > 5 && (
        <div className="text-xs text-gray-500 text-center mt-2">
          +{routes.length - 5} more routes
        </div>
      )}
    </div>
  );
}

/**
 * Migration timeline (chronological flow)
 */
export function MigrationTimeline({ migrations }) {
  if (!migrations || migrations.length === 0) return null;
  
  // Sort by timestamp
  const sortedMigrations = [...migrations].sort((a, b) => 
    (a.timestamp || 0) - (b.timestamp || 0)
  );
  
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-gray-600 mb-3">
        Migration Timeline:
      </div>
      
      {sortedMigrations.map((migration, idx) => (
        <div 
          key={idx}
          className="flex items-start gap-3 pl-2 border-l-2 border-blue-200 pb-3 last:pb-0"
        >
          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-400 -ml-[5px] mt-1.5" />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <ChainPath 
                chains={[migration.from?.chain, migration.to?.chain].filter(Boolean)} 
                confidence={migration.confidence}
              />
            </div>
            
            {migration.amount && (
              <div className="text-xs text-gray-600">
                {migration.amount} {migration.token || 'tokens'}
              </div>
            )}
            
            {migration.timestamp && (
              <div className="text-xs text-gray-400 mt-0.5">
                {new Date(migration.timestamp * 1000).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ChainPath;
