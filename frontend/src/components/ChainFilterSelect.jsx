/**
 * ChainFilterSelect Component (P2.3.3 BLOCK 2)
 * 
 * Multi-select chain filter with compact UI
 */
import React, { useState } from 'react';
import { Filter, X, Check } from 'lucide-react';
import { getAllChains, getChainMeta } from '../utils/chainMeta';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";

function ChainFilterSelect({ selectedChains, toggleChain, clearFilter, isFilterActive }) {
  const [isOpen, setIsOpen] = useState(false);
  const allChains = getAllChains();
  
  const selectedCount = selectedChains.length;
  const isAllSelected = selectedCount === 0;
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button 
          className={`
            inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
            border transition-colors
            ${isFilterActive 
              ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' 
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }
          `}
          data-testid="chain-filter-btn"
        >
          <Filter className="w-4 h-4" />
          <span>Chains</span>
          {isFilterActive && (
            <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-xs font-semibold">
              {selectedCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-200">
            <span className="text-sm font-semibold text-gray-900">Filter by Chain</span>
            {isFilterActive && (
              <button
                onClick={() => {
                  clearFilter();
                  setIsOpen(false);
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                data-testid="clear-chain-filter-btn"
              >
                Clear
              </button>
            )}
          </div>
          
          {/* All Chains Option */}
          <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={() => {
                if (!isAllSelected) {
                  clearFilter();
                }
              }}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-900">All Chains</span>
            <span className="ml-auto text-xs text-gray-500">{allChains.length}</span>
          </label>
          
          <div className="border-t border-gray-200 pt-2" />
          
          {/* Individual Chains */}
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {allChains.map(chain => {
              const meta = getChainMeta(chain);
              const isSelected = isAllSelected || selectedChains.includes(chain);
              
              return (
                <label
                  key={chain}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer group"
                  data-testid={`chain-filter-${chain.toLowerCase()}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleChain(chain)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className={`
                    inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                    ${meta.color} ${meta.bgColor} border ${meta.borderColor}
                  `}>
                    {meta.shortName}
                  </span>
                  <span className="text-sm text-gray-600">{meta.name}</span>
                  {isSelected && !isAllSelected && (
                    <Check className="w-4 h-4 ml-auto text-blue-600" />
                  )}
                </label>
              );
            })}
          </div>
          
          {/* Summary */}
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              {isAllSelected 
                ? `Showing all ${allChains.length} chains`
                : `${selectedCount} chain${selectedCount !== 1 ? 's' : ''} selected`
              }
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default ChainFilterSelect;
