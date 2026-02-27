/**
 * Pattern Bridge Component
 * Groups entity addresses by behavioral patterns
 * P1 Feature: Behavioral pattern analysis
 */
import { useState } from 'react';
import { 
  Users, TrendingUp, TrendingDown, Activity, Wallet, 
  DollarSign, ChevronDown, ChevronUp, ExternalLink, Copy, Check
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

const patternConfig = {
  accumulator: {
    label: 'Accumulator',
    icon: TrendingUp,
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    iconColor: 'text-emerald-600',
    description: 'Net inflow pattern',
  },
  distributor: {
    label: 'Distributor', 
    icon: TrendingDown,
    color: 'bg-red-100 text-red-700 border-red-200',
    iconColor: 'text-red-600',
    description: 'Net outflow pattern',
  },
  whale: {
    label: 'Whale',
    icon: Wallet,
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    iconColor: 'text-purple-600',
    description: 'High-value transactions',
  },
  active_trader: {
    label: 'Active Trader',
    icon: Activity,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    iconColor: 'text-blue-600',
    description: 'High-frequency activity',
  },
  stablecoin_focused: {
    label: 'Stablecoin Focused',
    icon: DollarSign,
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    iconColor: 'text-amber-600',
    description: 'USDT/USDC dominant',
  },
  mixed: {
    label: 'Mixed',
    icon: Users,
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    iconColor: 'text-gray-600',
    description: 'Balanced patterns',
  },
};

function formatUSD(value) {
  if (!value) return '$0';
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function AddressRow({ address, onHighlight, isHighlighted }) {
  const [copied, setCopied] = useState(false);

  const copyAddress = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className={`flex items-center justify-between p-3 rounded-lg transition-all cursor-pointer ${
        isHighlighted 
          ? 'bg-gray-900 text-white' 
          : 'bg-gray-50 hover:bg-gray-100'
      }`}
      onClick={() => onHighlight(address.address)}
      data-testid={`pattern-address-${address.shortAddress}`}
    >
      <div className="flex items-center gap-3">
        <code className={`text-sm font-mono ${isHighlighted ? 'text-white' : 'text-gray-700'}`}>
          {address.shortAddress}
        </code>
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              onClick={copyAddress}
              className={`p-1 rounded transition-colors ${
                isHighlighted ? 'hover:bg-white/20' : 'hover:bg-gray-200'
              }`}
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className={`w-3.5 h-3.5 ${isHighlighted ? 'text-gray-300' : 'text-gray-400'}`} />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{copied ? 'Copied!' : 'Copy address'}</p>
          </TooltipContent>
        </Tooltip>
        <a 
          href={`https://etherscan.io/address/${address.address}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={`p-1 rounded transition-colors ${
            isHighlighted ? 'hover:bg-white/20' : 'hover:bg-gray-200'
          }`}
        >
          <ExternalLink className={`w-3.5 h-3.5 ${isHighlighted ? 'text-gray-300' : 'text-gray-400'}`} />
        </a>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className={`text-xs ${isHighlighted ? 'text-gray-300' : 'text-gray-500'}`}>Avg Value</div>
          <div className={`text-sm font-semibold ${isHighlighted ? 'text-white' : 'text-gray-900'}`}>
            {formatUSD(address.avgValue)}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-xs ${isHighlighted ? 'text-gray-300' : 'text-gray-500'}`}>Txs</div>
          <div className={`text-sm font-semibold ${isHighlighted ? 'text-white' : 'text-gray-900'}`}>
            {address.txCount}
          </div>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-semibold ${
          isHighlighted ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
        }`}>
          {address.patternScore}%
        </div>
      </div>
    </div>
  );
}

function PatternGroup({ pattern, onHighlight, highlightedAddresses }) {
  const [expanded, setExpanded] = useState(true);
  const config = patternConfig[pattern.pattern] || patternConfig.mixed;
  const Icon = config.icon;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden" data-testid={`pattern-group-${pattern.pattern}`}>
      <button 
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${config.color}`}>
            <Icon className={`w-5 h-5 ${config.iconColor}`} />
          </div>
          <div className="text-left">
            <div className="font-semibold text-gray-900">{config.label}</div>
            <div className="text-xs text-gray-500">{pattern.description}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-bold text-gray-900">{pattern.addresses.length}</div>
            <div className="text-xs text-gray-500">addresses</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-gray-900">{pattern.totalTxCount}</div>
            <div className="text-xs text-gray-500">total txs</div>
          </div>
          <div className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${config.color}`}>
            {pattern.avgPatternScore}% match
          </div>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>
      
      {expanded && (
        <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-2">
          {pattern.addresses.map((addr) => (
            <AddressRow 
              key={addr.address}
              address={addr}
              onHighlight={onHighlight}
              isHighlighted={highlightedAddresses.includes(addr.address)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PatternBridge({ patterns, totalAddresses, loading, entityName }) {
  const [highlightedAddresses, setHighlightedAddresses] = useState([]);

  const handleHighlight = (address) => {
    setHighlightedAddresses(prev => 
      prev.includes(address) 
        ? prev.filter(a => a !== address)
        : [...prev, address]
    );
  };

  const clearHighlights = () => setHighlightedAddresses([]);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-24 bg-gray-100 rounded"></div>
          <div className="h-24 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!patterns || patterns.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-gray-700" />
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Pattern Bridge</h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <div className="font-medium">No pattern data available</div>
          <div className="text-sm mt-1">Entity needs more transaction history for pattern analysis</div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="bg-white border border-gray-200 rounded-xl p-6" data-testid="pattern-bridge">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-700" />
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Pattern Bridge</h3>
            <span className="px-2 py-0.5 bg-indigo-100 rounded text-xs font-medium text-indigo-700">
              BEHAVIORAL
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {highlightedAddresses.length > 0 && (
              <button 
                onClick={clearHighlights}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Clear selection ({highlightedAddresses.length})
              </button>
            )}
            <div className="text-sm text-gray-500">
              {totalAddresses} addresses • {patterns.length} patterns
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-500 mb-4">
          Groups {entityName} addresses by observed behavioral patterns. Click to highlight addresses across the page.
        </div>

        <div className="space-y-3">
          {patterns.map((pattern) => (
            <PatternGroup 
              key={pattern.pattern}
              pattern={pattern}
              onHighlight={handleHighlight}
              highlightedAddresses={highlightedAddresses}
            />
          ))}
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600">
            Pattern Bridge groups addresses by <span className="font-semibold">observed behavior</span>, not intent. 
            Patterns are derived from transaction history analysis.
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
}
