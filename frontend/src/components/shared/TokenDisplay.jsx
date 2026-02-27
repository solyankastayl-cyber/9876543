/**
 * Token Display Component (P2.5)
 * 
 * Displays token symbol with tooltip showing full details
 * 
 * Props:
 * - address: token contract address
 * - symbol: resolved symbol (optional, will fetch if not provided)
 * - name: token name
 * - verified: verification status
 * - showAddress: show truncated address
 */
import { useState, useEffect } from 'react';
import { HelpCircle, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { api } from '../../api/client';

export default function TokenDisplay({ 
  address, 
  symbol: initialSymbol,
  name: initialName,
  verified: initialVerified,
  showAddress = false,
  className = '',
}) {
  const [tokenInfo, setTokenInfo] = useState({
    symbol: initialSymbol || null,
    name: initialName || null,
    verified: initialVerified ?? null,
    decimals: null,
    chain: 'ethereum',
  });
  const [loading, setLoading] = useState(!initialSymbol);

  useEffect(() => {
    // Only fetch if we don't have the symbol
    if (initialSymbol || !address) return;

    async function fetchToken() {
      setLoading(true);
      try {
        const response = await api.get(`/api/tokens/resolve/${address}`);
        if (response.data.ok) {
          setTokenInfo(response.data.data);
        }
      } catch (err) {
        console.error('Token fetch error:', err);
        setTokenInfo({
          symbol: 'UNKNOWN',
          name: 'Unknown Token',
          verified: false,
          decimals: 18,
          chain: 'ethereum',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchToken();
  }, [address, initialSymbol]);

  const symbol = tokenInfo.symbol || initialSymbol;
  const name = tokenInfo.name || initialName;
  const verified = tokenInfo.verified ?? initialVerified;
  const isUnknown = symbol === 'UNKNOWN';

  // Format address for display
  const truncatedAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  if (loading) {
    return (
      <span className={`inline-flex items-center gap-1 ${className}`}>
        <span className="animate-pulse bg-gray-200 rounded w-12 h-4"></span>
      </span>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span 
            className={`inline-flex items-center gap-1 cursor-help ${className} ${
              isUnknown ? 'text-gray-400' : ''
            }`}
            data-testid={`token-display-${address?.slice(0, 8)}`}
          >
            {/* Symbol */}
            <span className={`font-medium ${isUnknown ? 'font-mono text-xs' : ''}`}>
              {isUnknown ? truncatedAddress : symbol}
            </span>
            
            {/* Verification badge */}
            {verified === true && (
              <CheckCircle className="w-3 h-3 text-emerald-500" />
            )}
            {verified === false && !isUnknown && (
              <AlertCircle className="w-3 h-3 text-amber-500" />
            )}
            {isUnknown && (
              <HelpCircle className="w-3 h-3 text-gray-400" />
            )}
          </span>
        </TooltipTrigger>
        
        <TooltipContent className="max-w-xs p-3">
          <div className="space-y-2">
            {/* Token name */}
            <div className="font-semibold text-gray-900">
              {name || 'Unknown Token'}
            </div>
            
            {/* Symbol (if known) */}
            {!isUnknown && (
              <div className="text-sm text-gray-600">
                Symbol: <span className="font-medium">{symbol}</span>
              </div>
            )}
            
            {/* Contract address */}
            <div className="text-xs text-gray-500 font-mono">
              {address}
            </div>
            
            {/* Chain */}
            <div className="text-xs text-gray-500">
              Chain: {tokenInfo.chain || 'Ethereum'}
            </div>
            
            {/* Verification status */}
            <div className="flex items-center gap-1.5 text-xs">
              {verified ? (
                <>
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-600">Verified token</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 text-amber-500" />
                  <span className="text-amber-600">Unverified token</span>
                </>
              )}
            </div>
            
            {/* Etherscan link */}
            {address && (
              <a
                href={`https://etherscan.io/token/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3 h-3" />
                View on Etherscan
              </a>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Simple inline token symbol (no tooltip)
 */
export function TokenSymbol({ symbol, verified, className = '' }) {
  const isUnknown = symbol === 'UNKNOWN';
  
  return (
    <span className={`inline-flex items-center gap-1 ${className} ${isUnknown ? 'text-gray-400' : ''}`}>
      <span className={`font-medium ${isUnknown ? 'font-mono text-xs' : ''}`}>
        {symbol}
      </span>
      {verified === true && (
        <CheckCircle className="w-3 h-3 text-emerald-500" />
      )}
    </span>
  );
}
