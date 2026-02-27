/**
 * KnownAddresses Component (Phase 15.5)
 * Shows attributed addresses for an Actor/Entity
 */
import { useState, useEffect } from 'react';
import { 
  Copy, Check, ExternalLink, Info, ChevronDown, ChevronUp,
  Shield, Eye, FileText, Link2, Loader2, AlertTriangle
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";
import { attributionApi } from '../api';

// Status badge colors
const STATUS_CONFIG = {
  confirmed: { 
    label: 'Confirmed', 
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: Shield 
  },
  suspected: { 
    label: 'Suspected', 
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: Eye 
  },
  reference: { 
    label: 'Reference', 
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: FileText 
  },
  rejected: { 
    label: 'Rejected', 
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: AlertTriangle 
  },
};

// Source icons
const SOURCE_ICONS = {
  manual: '✋',
  import: '📥',
  heuristic: '🤖',
  external: '🔗',
};

// Chain config with icons
const CHAIN_CONFIG = {
  ethereum: { label: 'ETH', color: 'bg-blue-500', icon: '⟠' },
  arbitrum: { label: 'ARB', color: 'bg-blue-600', icon: '🔷' },
  base: { label: 'BASE', color: 'bg-blue-400', icon: '🔵' },
  bsc: { label: 'BNB', color: 'bg-yellow-500', icon: '🟡' },
  solana: { label: 'SOL', color: 'bg-purple-500', icon: '◎' },
  polygon: { label: 'MATIC', color: 'bg-purple-600', icon: '🟣' },
  avalanche: { label: 'AVAX', color: 'bg-red-500', icon: '🔺' },
  optimism: { label: 'OP', color: 'bg-red-400', icon: '🔴' },
};

// Format address for display
function formatAddress(address) {
  if (!address) return '—';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Evidence Popover Content
function EvidencePopover({ claim }) {
  const evidence = claim.evidence || [];
  
  return (
    <div className="p-3 max-w-xs">
      <h4 className="font-semibold text-sm mb-2">Why linked?</h4>
      
      {/* Reason */}
      <p className="text-xs text-gray-600 mb-3">{claim.reason}</p>
      
      {/* Evidence list */}
      {evidence.length > 0 && (
        <div className="space-y-2 mb-3">
          <div className="text-xs font-medium text-gray-500 uppercase">Evidence</div>
          {evidence.map((ev, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="flex-shrink-0">
                {ev.type === 'url' ? '🔗' : 
                 ev.type === 'tx' ? '📝' : 
                 ev.type === 'cluster' ? '🔀' :
                 ev.type === 'pattern' ? '📊' : '📋'}
              </span>
              <span className="text-gray-700 break-all">
                {ev.type === 'url' ? (
                  <a 
                    href={ev.value} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {ev.value.length > 40 ? ev.value.slice(0, 40) + '...' : ev.value}
                  </a>
                ) : ev.value}
              </span>
            </div>
          ))}
        </div>
      )}
      
      {/* Meta */}
      <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
        Source: {claim.source} • Confidence: {Math.round(claim.confidence * 100)}%
      </div>
    </div>
  );
}

// Single Address Row
function AddressRow({ claim, onCopy, copiedAddress }) {
  const config = STATUS_CONFIG[claim.status] || STATUS_CONFIG.reference;
  const StatusIcon = config.icon;
  const chainConfig = CHAIN_CONFIG[claim.chain] || { label: claim.chain?.toUpperCase(), color: 'bg-gray-500', icon: '🔗' };
  
  // Build explorer URL based on chain
  const getExplorerUrl = () => {
    switch(claim.chain) {
      case 'ethereum': return `https://etherscan.io/address/${claim.address}`;
      case 'bsc': return `https://bscscan.com/address/${claim.address}`;
      case 'polygon': return `https://polygonscan.com/address/${claim.address}`;
      case 'arbitrum': return `https://arbiscan.io/address/${claim.address}`;
      case 'optimism': return `https://optimistic.etherscan.io/address/${claim.address}`;
      case 'base': return `https://basescan.org/address/${claim.address}`;
      case 'avalanche': return `https://snowtrace.io/address/${claim.address}`;
      case 'solana': return `https://solscan.io/account/${claim.address}`;
      default: return `https://etherscan.io/address/${claim.address}`;
    }
  };

  // Status indicator emoji
  const statusEmoji = claim.status === 'confirmed' ? '🟢' : 
                      claim.status === 'suspected' ? '🟡' : '⚪';

  return (
    <div className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-colors ${
      claim.status === 'confirmed' ? 'hover:bg-emerald-50 bg-emerald-50/30' :
      claim.status === 'suspected' ? 'hover:bg-amber-50 bg-amber-50/30' :
      'hover:bg-gray-50'
    }`}>
      {/* Chain with Icon */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`w-10 h-6 ${chainConfig.color} rounded text-white text-xs font-bold flex items-center justify-center gap-0.5`}>
            <span>{chainConfig.icon}</span>
            <span>{chainConfig.label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs capitalize">{claim.chain}</p>
        </TooltipContent>
      </Tooltip>

      {/* Address */}
      <div className="flex-1 flex items-center gap-2">
        <code className="text-sm font-mono text-gray-700">
          {formatAddress(claim.address)}
        </code>
        <button 
          onClick={() => onCopy(claim.address)}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
        >
          {copiedAddress === claim.address ? (
            <Check className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-gray-400" />
          )}
        </button>
        <a 
          href={getExplorerUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 hover:bg-gray-200 rounded transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
        </a>
      </div>

      {/* Status Badge with Emoji */}
      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${config.color} flex items-center gap-1`}>
        <span>{statusEmoji}</span>
        {config.label}
      </span>

      {/* Confidence */}
      <div className="w-12 text-right">
        <span className={`text-xs font-medium ${
          claim.confidence >= 0.8 ? 'text-emerald-600' :
          claim.confidence >= 0.6 ? 'text-amber-600' :
          'text-gray-500'
        }`}>
          {Math.round(claim.confidence * 100)}%
        </span>
      </div>

      {/* Source */}
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-sm cursor-help">
            {SOURCE_ICONS[claim.source] || '❓'}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs capitalize">Source: {claim.source}</p>
        </TooltipContent>
      </Tooltip>

      {/* Why Linked Popover */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="p-1 hover:bg-blue-100 text-blue-600 rounded transition-colors">
            <Info className="w-4 h-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="bg-white border border-gray-200 shadow-lg p-0">
          <EvidencePopover claim={claim} />
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export default function KnownAddresses({ 
  subjectType, 
  subjectId,
  className = '',
  maxVisible = 5,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(null);

  // Fetch addresses
  useEffect(() => {
    async function fetchAddresses() {
      if (!subjectType || !subjectId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await attributionApi.getSubjectAddresses(subjectType, subjectId);
        if (response?.ok) {
          setData(response.data);
        } else {
          setError(response?.error || 'Failed to load addresses');
        }
      } catch (err) {
        console.error('Failed to fetch addresses:', err);
        setError('Failed to load addresses');
      } finally {
        setLoading(false);
      }
    }

    fetchAddresses();
  }, [subjectType, subjectId]);

  const handleCopy = (address) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  // Loading state
  if (loading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-white border border-gray-200 rounded-xl p-4 ${className}`}>
        <div className="text-sm text-red-600 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      </div>
    );
  }

  // No data
  if (!data || data.addresses.length === 0) {
    return (
      <div className={`bg-white border border-gray-200 rounded-xl p-4 ${className}`}>
        <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-gray-400" />
          Known Addresses
        </h3>
        <p className="text-sm text-gray-500">No attributed addresses found.</p>
      </div>
    );
  }

  const addresses = data.addresses;
  const visibleAddresses = expanded ? addresses : addresses.slice(0, maxVisible);
  const hasMore = addresses.length > maxVisible;

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-gray-400" />
          Known Addresses
        </h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-emerald-600 font-medium">
            {data.confirmedCount} confirmed
          </span>
          {data.suspectedCount > 0 && (
            <span className="text-amber-600 font-medium">
              {data.suspectedCount} suspected
            </span>
          )}
          <span className="text-gray-400">
            {data.totalCount} total
          </span>
        </div>
      </div>

      {/* Address List */}
      <div className="space-y-1">
        {visibleAddresses.map((claim, i) => (
          <AddressRow 
            key={`${claim.chain}-${claim.address}`}
            claim={claim}
            onCopy={handleCopy}
            copiedAddress={copiedAddress}
          />
        ))}
      </div>

      {/* Expand/Collapse */}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center gap-1"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show all {addresses.length} addresses
            </>
          )}
        </button>
      )}
    </div>
  );
}

/**
 * Compact version for cards (only confirmed count on card, suspected in popover)
 */
export function AddressCountBadge({ subjectType, subjectId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCount() {
      if (!subjectType || !subjectId) return;
      try {
        const response = await attributionApi.getSubjectAddresses(subjectType, subjectId);
        if (response?.ok) {
          setData(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch address count:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCount();
  }, [subjectType, subjectId]);

  if (loading || !data) return null;
  
  // Only show if there are confirmed addresses
  if (data.confirmedCount === 0) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 cursor-help">
          <span className="px-2 py-0.5 rounded text-xs font-medium border bg-emerald-100 text-emerald-700 border-emerald-200">
            🟢 Confirmed
          </span>
          <span className="text-xs text-gray-600 font-medium">
            {data.confirmedCount} addr
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent className="bg-white border border-gray-200 shadow-lg p-2">
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600">🟢</span>
            <span className="font-medium">{data.confirmedCount} confirmed</span>
          </div>
          {data.suspectedCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-amber-500">🟡</span>
              <span className="text-gray-600">{data.suspectedCount} suspected</span>
            </div>
          )}
          {data.totalCount > data.confirmedCount + data.suspectedCount && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400">⚪</span>
              <span className="text-gray-500">{data.totalCount - data.confirmedCount - data.suspectedCount} reference</span>
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
