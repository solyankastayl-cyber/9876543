/**
 * TokenDetail - REFACTORED (L1 + L2 Architecture)
 * 
 * 🎯 Same architecture as TokensPageRefactored
 * 
 * REMOVED:
 * - TokenDecisionHeader with ACCUMULATING/DISTRIBUTING labels
 * - All BUY/SELL/Confidence UI elements
 * - "Why" sections with interpretations
 * 
 * ADDED:
 * - Clean L1 header with raw price/volume data
 * - L2 components with baselines
 * - Separate ML layer (optional)
 */
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ChevronLeft, ExternalLink, ArrowUpRight, ArrowDownRight, 
  Wallet, Info, Activity, TrendingUp, TrendingDown
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

// Import only L1/L2 compatible components
import HolderComposition from '../components/HolderComposition';
import SupplyFlowMap from '../components/SupplyFlowMap';
import DistributionRisk from '../components/DistributionRisk';
import DEXMicrostructure from '../components/DEXMicrostructure';
import OIVolumeCorrelations from '../components/OIVolumeCorrelations';
import ActivityBreakdown from '../components/ActivityBreakdown';
import TokenActivityDrivers from '../components/TokenActivityDrivers';
import CohortFlows from '../components/CohortFlows';

const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-white border border-gray-200 rounded-xl ${className}`}>
    {children}
  </div>
);

// ============================================================================
// L1: CLEAN TOKEN HEADER - NO OPINIONS
// Just facts: price, volume, market cap, change
// ============================================================================
const TokenHeaderL1 = ({ token }) => {
  const price = token.price || 0;
  const change24h = token.change_24h || 0;
  const volume24h = token.volume_24h || 0;
  const marketCap = token.market_cap || 0;
  const fdv = token.fdv || 0;

  return (
    <div className="px-4 py-3">
      <GlassCard className="p-6">
        {/* Token Info */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {token.logo && (
              <img src={token.logo} alt={token.symbol} className="w-16 h-16 rounded-full" />
            )}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{token.name || token.symbol}</h1>
                <span className="text-xl text-gray-500">({token.symbol})</span>
                <a 
                  href={`https://etherscan.io/token/${token.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <div className="flex items-center gap-4">
                {/* Price */}
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold text-gray-900">
                    ${typeof price === 'number' ? price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6}) : price}
                  </span>
                  {/* 24h Change */}
                  {change24h !== 0 && (
                    <div className={`flex items-center gap-1 ${change24h >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {change24h >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      <span className="text-lg font-semibold">
                        {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
                      </span>
                      <span className="text-sm text-gray-500">(24h)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* L1 Metrics Grid */}
        <div className="grid grid-cols-4 gap-6">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">24H Volume</div>
            <div className="text-lg font-bold text-gray-900">
              ${(volume24h / 1e9).toFixed(2)}B
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Market Cap</div>
            <div className="text-lg font-bold text-gray-900">
              ${(marketCap / 1e9).toFixed(2)}B
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">FDV</div>
            <div className="text-lg font-bold text-gray-900">
              ${(fdv / 1e9).toFixed(2)}B
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Contract</div>
            <div className="text-xs font-mono text-gray-700">
              {token.address?.slice(0, 6)}...{token.address?.slice(-4)}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              <strong>L1 Data:</strong> Raw market metrics. No opinions or predictions.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function TokenDetailRefactored() {
  const { tokenId } = useParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const res = await axios.get(`${API_BASE}/tokens/${tokenId}`);
        setToken(res.data);
      } catch (err) {
        console.error('Load token error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadToken();
  }, [tokenId]);

  const handleWalletClick = (walletAddress) => {
    navigate(`/wallets/${walletAddress}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <Activity className="w-8 h-8 text-blue-600 animate-pulse mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading token data...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <p className="text-gray-600">Token not found</p>
          <Link to="/tokens" className="text-blue-600 hover:underline mt-2 inline-block">
            ← Back to Tokens
          </Link>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        {/* Navigation */}
        <div className="px-4 py-3">
          <Link 
            to="/tokens" 
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Tokens
          </Link>
        </div>

        {/* L1 Header - NO DECISIONS */}
        <TokenHeaderL1 token={token} />

        {/* Analytics Grid */}
        <div className="px-4 pb-8">
          {/* L1→L2: Who is driving this activity? */}
          <div className="mb-4">
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Activity Drivers</h3>
                  <p className="text-xs text-gray-500 mt-0.5">L1→L2: Who is moving tokens</p>
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Describes structure, not intent.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <TokenActivityDrivers 
                tokenAddress={tokenId}
                chain="Ethereum"
                onWalletClick={handleWalletClick}
              />
            </GlassCard>
          </div>
          
          {/* L2: Wallet Cohort Flows */}
          <div className="mb-4">
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Cohort Flows</h3>
                  <p className="text-xs text-gray-500 mt-0.5">L2: Flow patterns by cohort</p>
                </div>
              </div>
              <CohortFlows 
                tokenAddress={tokenId}
                tokenSymbol={token?.symbol || 'Token'}
              />
            </GlassCard>
          </div>

          {/* Row 1: Composition & Supply */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Holder Composition</h3>
                  <p className="text-xs text-gray-500 mt-0.5">L1: Distribution structure</p>
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">Token holder types and distribution. Shows structure, not opinion.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <HolderComposition tokenId={tokenId} />
            </GlassCard>

            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Supply Flow Map</h3>
                  <p className="text-xs text-gray-500 mt-0.5">L1: Token movements</p>
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">Minting, burning, LP flows, bridge activity</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <SupplyFlowMap tokenId={tokenId} />
            </GlassCard>
          </div>

          {/* Row 2: Activity & Risk */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Activity Breakdown</h3>
                  <p className="text-xs text-gray-500 mt-0.5">L1: Transaction types</p>
                </div>
              </div>
              <ActivityBreakdown tokenSymbol={token?.symbol} />
            </GlassCard>

            <DistributionRisk tokenId={tokenId} />
          </div>

          {/* Row 3: DEX Microstructure */}
          <div className="mb-4">
            <DEXMicrostructure tokenId={tokenId} />
          </div>

          {/* Row 4: OI/Volume Correlations */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">OI & Volume Correlations</h3>
                <p className="text-xs text-gray-500 mt-0.5">L2: Correlation patterns</p>
              </div>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Shows correlation, not causation</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <OIVolumeCorrelations tokenId={tokenId} />
          </GlassCard>
        </div>

        {/* Footer Checklist */}
        <div className="px-4 pb-8">
          <div className="p-4 bg-white border border-gray-200 rounded-xl">
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              L1 + L2 Architecture:
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                <span className="text-gray-700">No BUY/SELL labels</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                <span className="text-gray-700">All data is L1 or L2</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                <span className="text-gray-700">No confidence in headers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                <span className="text-gray-700">Works without ML</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
