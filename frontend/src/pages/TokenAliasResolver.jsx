/**
 * TokenAliasResolver - Handles /token/:symbol alias route
 * 
 * PURPOSE:
 * - Resolves symbol (e.g., "UNI") to canonical URL (/token/1/0x1f98...)
 * - Shows network selection UI for multi-chain tokens (e.g., USDT)
 * - Shows "Token not found" error for unsupported tokens (e.g., BTC)
 * 
 * ARCHITECTURE:
 * - Alias URL: /token/:symbol → calls POST /api/tokens/resolve
 * - Canonical URL: /token/:chainId/:address → direct render
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Loader2, AlertCircle, Globe, ArrowRight, 
  Check, ExternalLink, Search 
} from 'lucide-react';

// Chain metadata for UI
const CHAIN_INFO = {
  1: { name: 'Ethereum', color: 'bg-blue-500', icon: '⟠' },
  42161: { name: 'Arbitrum', color: 'bg-blue-600', icon: '🔵' },
  137: { name: 'Polygon', color: 'bg-purple-500', icon: '🟣' },
  10: { name: 'Optimism', color: 'bg-red-500', icon: '🔴' },
  8453: { name: 'Base', color: 'bg-blue-400', icon: '🔷' },
  56: { name: 'BSC', color: 'bg-yellow-500', icon: '🟡' },
  43114: { name: 'Avalanche', color: 'bg-red-600', icon: '🔺' },
};

export default function TokenAliasResolver() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState('loading'); // loading | not_found | multiple | error
  const [tokens, setTokens] = useState([]);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    if (!symbol) return;
    resolveSymbol(symbol);
  }, [symbol]);

  async function resolveSymbol(input) {
    setStatus('loading');
    setError(null);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/tokens/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      
      const data = await response.json();
      
      if (!data.ok) {
        setStatus('error');
        setError(data.message || 'Failed to resolve token');
        return;
      }
      
      switch (data.status) {
        case 'found':
          // Single token found - redirect to canonical URL
          navigate(data.canonicalUrl, { replace: true });
          break;
          
        case 'multiple':
          // Multiple chains - show selection UI
          setTokens(data.tokens);
          setStatus('multiple');
          break;
          
        case 'not_found':
          setStatus('not_found');
          setError(data.message);
          break;
          
        default:
          setStatus('error');
          setError('Unexpected response from server');
      }
    } catch (err) {
      console.error('Token resolve error:', err);
      setStatus('error');
      setError(err.message || 'Network error');
    }
  }

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/token/${searchInput.trim()}`);
    }
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">Resolving "{symbol}"...</p>
          <p className="text-sm text-gray-500 mt-1">Looking up token in registry</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (status === 'not_found') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 p-8">
        <div className="max-w-xl mx-auto">
          <div className="bg-white border-2 border-red-200 rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Token Not Found</h1>
              <p className="text-gray-600">{error}</p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">What does this mean?</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Only ERC20 tokens on supported networks are available</li>
                <li>• BTC, SOL, and other non-EVM tokens are not supported</li>
                <li>• The token symbol may be misspelled</li>
                <li>• The token may not be in our registry yet</li>
              </ul>
            </div>
            
            {/* Search form */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Try another symbol or address..."
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </form>
            
            <div className="flex gap-3">
              <Link
                to="/tokens"
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-center transition-colors"
              >
                Back to Tokens
              </Link>
              <a
                href={`https://etherscan.io/search?q=${symbol}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-gray-100 text-white rounded-xl font-semibold transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Etherscan
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Multiple chains selection UI
  if (status === 'multiple') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border-2 border-blue-200 rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Select Network</h1>
              <p className="text-gray-600">
                "{symbol.toUpperCase()}" exists on multiple networks. Please choose one:
              </p>
            </div>
            
            <div className="space-y-3">
              {tokens.map((token) => {
                const chainInfo = CHAIN_INFO[token.chainId] || { 
                  name: token.chain, 
                  color: 'bg-gray-500', 
                  icon: '🔗' 
                };
                
                return (
                  <button
                    key={`${token.chainId}-${token.address}`}
                    onClick={() => navigate(token.canonicalUrl)}
                    className="w-full flex items-center gap-4 p-4 bg-gray-50 hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-400 rounded-xl transition-all group"
                    data-testid={`network-option-${token.chainId}`}
                  >
                    {/* Chain Icon */}
                    <div className={`w-12 h-12 ${chainInfo.color} rounded-full flex items-center justify-center text-2xl`}>
                      {chainInfo.icon}
                    </div>
                    
                    {/* Token Info */}
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-900">{token.symbol}</span>
                        {token.verified && (
                          <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{token.name}</div>
                      <div className="text-xs text-gray-400 font-mono mt-1">
                        {token.address.slice(0, 10)}...{token.address.slice(-8)}
                      </div>
                    </div>
                    
                    {/* Chain Badge */}
                    <div className="text-right">
                      <div className={`px-3 py-1 ${chainInfo.color} text-white rounded-lg text-sm font-semibold`}>
                        {chainInfo.name}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Chain ID: {token.chainId}</div>
                    </div>
                    
                    {/* Arrow */}
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </button>
                );
              })}
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <Link
                to="/tokens"
                className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
              >
                ← Back to Token Search
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 p-8">
      <div className="max-w-xl mx-auto">
        <div className="bg-white border-2 border-red-200 rounded-2xl p-8 shadow-lg text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error || 'Something went wrong'}</p>
          <Link
            to="/tokens"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
          >
            Back to Tokens
          </Link>
        </div>
      </div>
    </div>
  );
}
