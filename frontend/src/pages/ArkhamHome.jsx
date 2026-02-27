/**
 * ArkhamHome - Market Discovery Layer
 * 
 * CONTRACT:
 * Market = "Где прямо сейчас происходит что-то нетипичное и потенциально важное"
 * 
 * ❌ Market НЕ ДОЛЖЕН:
 *    - повторять Watchlist
 *    - показывать "то, что ты уже отслеживаешь"
 * 
 * ✅ Market ДОЛЖЕН:
 *    - показывать новое / возникающее
 *    - отвечать на вопрос: "Где сейчас стоит обратить внимание?"
 *    - быть входной точкой в Tokens / Wallets / Alerts
 * 
 * CTA только: View token, View wallet, Create alert
 * ❌ Никаких "Track", "Add to watchlist"
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, RefreshCw, Loader2, AlertCircle,
  Activity, ChevronRight, Users, Bell,
  Wallet, Coins, Flame, Zap, ExternalLink
} from 'lucide-react';
import StatusBanner from '../components/StatusBanner';
import { MarketNarrativesCard } from '../components/MarketNarratives';
import { NarrativesBySectorCard } from '../components/NarrativesBySector';
import { marketApi } from '../api';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

// ============================================================================
// Top Active Tokens - "Where is the action right now?"
// ============================================================================
function TopActiveTokensCard() {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadTopTokens() {
      setLoading(true);
      try {
        const response = await marketApi.getTopActiveTokens(8, '24h');
        if (response?.ok && response?.data?.tokens) {
          setTokens(response.data.tokens);
        }
      } catch (err) {
        console.error('Failed to load top tokens:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTopTokens();
  }, []);
  
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };
  
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <h3 className="text-base font-semibold text-gray-900">Highest On-Chain Activity</h3>
        </div>
        <p className="text-xs text-gray-500 mb-4">Loading market data...</p>
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  
  if (!tokens || tokens.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Flame className="w-5 h-5 text-gray-400" />
          <h3 className="text-base font-semibold text-gray-900">Highest On-Chain Activity</h3>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          These tokens have the most transfer activity in the last 24 hours.
        </p>
        <div className="text-center py-6 bg-gray-50 rounded-xl">
          <p className="text-sm text-gray-600">Indexing in progress...</p>
          <p className="text-xs text-gray-400 mt-1">Data will appear shortly</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <h3 className="text-base font-semibold text-gray-900">Highest On-Chain Activity</h3>
        </div>
        <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded font-medium">
          Live 24h
        </span>
      </div>
      
      {/* Why this matters */}
      <p className="text-xs text-gray-500 mb-4">
        These tokens have the most transfer activity in the last 24 hours.
      </p>
      
      <div className="space-y-2">
        {tokens.slice(0, 6).map((token, i) => (
          <div 
            key={token.address}
            onClick={() => navigate(`/tokens/${token.address}`)}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors group"
            data-testid={`top-token-${i}`}
          >
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs font-bold text-gray-500 shadow-sm">
                {i + 1}
              </span>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {token.symbol || token.address.slice(0, 8) + '...'}
                </div>
                {token.name && (
                  <div className="text-xs text-gray-500">{token.name}</div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">
                  {formatNumber(token.transferCount)}
                </div>
                <div className="text-xs text-gray-500">
                  {formatNumber(token.activeWallets)} wallets
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
      </div>
      
      {/* CTA: View token */}
      <button
        onClick={() => navigate('/tokens')}
        className="w-full mt-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        View all tokens
        <ExternalLink className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ============================================================================
// Unusual On-Chain Behavior Detected (formerly "Emerging Signals")
// ============================================================================
function UnusualBehaviorCard() {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [interpretation, setInterpretation] = useState(null);
  
  useEffect(() => {
    async function loadSignals() {
      setLoading(true);
      try {
        const response = await marketApi.getEmergingSignals(6);
        if (response?.ok && response?.data) {
          setTokens(response.data.tokens || []);
          setInterpretation(response.data.interpretation);
        }
      } catch (err) {
        console.error('Failed to load emerging signals:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSignals();
  }, []);
  
  const getSeverityColor = (severity) => {
    if (severity >= 80) return 'bg-red-100 text-red-700';
    if (severity >= 60) return 'bg-orange-100 text-orange-700';
    return 'bg-yellow-100 text-yellow-700';
  };
  
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-purple-500" />
          <h3 className="text-base font-semibold text-gray-900">Unusual On-Chain Behavior Detected</h3>
        </div>
        <p className="text-xs text-gray-500 mb-4">Scanning for deviations...</p>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  
  if (!tokens || tokens.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-gray-400" />
            <h3 className="text-base font-semibold text-gray-900">Unusual On-Chain Behavior Detected</h3>
          </div>
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Checked</span>
        </div>
        
        {/* Why this matters */}
        <p className="text-xs text-gray-500 mb-4">
          These tokens are showing activity patterns that significantly deviate from their recent behavior.
        </p>
        
        <div className="text-center py-6 bg-gray-50 rounded-xl">
          <div className="p-3 bg-white rounded-xl inline-block mb-3 shadow-sm">
            <Zap className="w-6 h-6 text-gray-700" />
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">All tokens within normal range</p>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            {interpretation?.description || 'No significant deviations from baseline activity detected in the last 24 hours.'}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-500" />
          <h3 className="text-base font-semibold text-gray-900">Unusual On-Chain Behavior Detected</h3>
        </div>
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">
          {tokens.length} active
        </span>
      </div>
      
      {/* Why this matters */}
      <p className="text-xs text-gray-500 mb-4">
        These tokens are showing activity patterns that significantly deviate from their recent behavior.
      </p>
      
      <div className="space-y-2">
        {tokens.slice(0, 5).map((token, i) => (
          <div 
            key={token.address}
            onClick={() => navigate(`/tokens/${token.address}`)}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors group"
            data-testid={`unusual-token-${i}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Coins className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{token.symbol}</div>
                <div className="text-xs text-gray-500">{token.signals.length} deviation{token.signals.length > 1 ? 's' : ''}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {token.topSignal && (
                <span className={`text-xs px-2 py-1 rounded font-medium ${getSeverityColor(token.topSignal.severity)}`}>
                  {token.topSignal.type.replace('_', ' ')}
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
      </div>
      
      {/* CTA: View token or Create alert */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => navigate('/signals')}
          className="flex-1 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          View all signals
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// New Wallets Showing Abnormal Activity (formerly "New Actors")
// ============================================================================
function NewWalletsCard() {
  const navigate = useNavigate();
  const [actors, setActors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [interpretation, setInterpretation] = useState(null);
  
  useEffect(() => {
    async function loadActors() {
      setLoading(true);
      try {
        const response = await marketApi.getNewActors(6);
        if (response?.ok && response?.data) {
          setActors(response.data.actors || []);
          setInterpretation(response.data.interpretation);
        }
      } catch (err) {
        console.error('Failed to load new actors:', err);
      } finally {
        setLoading(false);
      }
    }
    loadActors();
  }, []);
  
  const formatAddress = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-5 h-5 text-emerald-500" />
          <h3 className="text-base font-semibold text-gray-900">New Wallets Showing Abnormal Activity</h3>
        </div>
        <p className="text-xs text-gray-500 mb-4">Scanning for new actors...</p>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  
  if (!actors || actors.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-400" />
            <h3 className="text-base font-semibold text-gray-900">New Wallets Showing Abnormal Activity</h3>
          </div>
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Checked</span>
        </div>
        
        {/* Why this matters */}
        <p className="text-xs text-gray-500 mb-4">
          These wallets became active recently and are interacting with high-volume or trending tokens.
        </p>
        
        <div className="text-center py-6 bg-gray-50 rounded-xl">
          <div className="p-3 bg-white rounded-xl inline-block mb-3 shadow-sm">
            <Users className="w-6 h-6 text-gray-700" />
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">No new actors detected</p>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            {interpretation?.description || 'No wallets with significant new activity patterns in the last 24 hours.'}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-500" />
          <h3 className="text-base font-semibold text-gray-900">New Wallets Showing Abnormal Activity</h3>
        </div>
        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-medium">
          {actors.length} detected
        </span>
      </div>
      
      {/* Why this matters */}
      <p className="text-xs text-gray-500 mb-4">
        These wallets became active recently and are interacting with high-volume or trending tokens.
      </p>
      
      <div className="space-y-2">
        {actors.slice(0, 5).map((actor, i) => (
          <div 
            key={actor.address}
            onClick={() => navigate(`/wallets/${actor.address}`)}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors group"
            data-testid={`new-wallet-${i}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Wallet className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <div className="text-sm font-mono font-medium text-gray-900">{formatAddress(actor.address)}</div>
                <div className="text-xs text-gray-500">{actor.txCount} transfers • {actor.tokenCount} tokens</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {actor.topToken && (
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                  {actor.topToken}
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
      </div>
      
      {/* CTA: View wallet */}
      <button
        onClick={() => navigate('/wallets')}
        className="w-full mt-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        Explore wallets
        <ExternalLink className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ============================================================================
// Recent Market Deviations Card (Recent Alerts - но только с deviations)
// ============================================================================
function RecentDeviationsCard() {
  const navigate = useNavigate();
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-semibold text-gray-900">Recent Market Deviations</h3>
        </div>
      </div>
      
      {/* Why this matters */}
      <p className="text-xs text-gray-500 mb-4">
        Significant on-chain events that triggered monitoring alerts across the network.
      </p>
      
      <div className="text-center py-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl">
        <div className="p-3 bg-white rounded-xl inline-block mb-3 shadow-sm">
          <Bell className="w-6 h-6 text-amber-400" />
        </div>
        <p className="text-sm font-medium text-gray-700 mb-2">Set up monitoring</p>
        <p className="text-xs text-gray-500 max-w-xs mx-auto mb-4">
          Create alerts to get notified when tokens or wallets show unusual behavior.
        </p>
        
        {/* CTA: Create alert */}
        <button
          onClick={() => navigate('/alerts')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
        >
          <Bell className="w-4 h-4" />
          Create Alert
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Market Page
// ============================================================================
export default function ArkhamHome() {
  const [loading, setLoading] = useState(false);

  const handleRefresh = () => {
    // Force re-render by toggling loading state
    setLoading(true);
    setTimeout(() => setLoading(false), 100);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50" data-testid="market-discovery-page">
        
        <div className="max-w-[1400px] mx-auto px-4 py-6">
          {/* Page Header - Discovery focused */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Market Discovery</h1>
              <p className="text-sm text-gray-500">
                Where to look next — unusual activity and emerging patterns
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBanner compact />
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2 hover:bg-white rounded-lg transition-colors border border-gray-200"
                title="Refresh"
                data-testid="refresh-btn"
              >
                <RefreshCw className={`w-5 h-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Discovery Grid - NO Watchlist, NO Tracked Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
            {/* Row 1: Activity + Narratives */}
            <TopActiveTokensCard />
            <MarketNarrativesCard />
            
            {/* Row 2: Sector Narratives + Signals */}
            <NarrativesBySectorCard />
            <UnusualBehaviorCard />
            
            {/* Row 3: New Wallets + Deviations */}
            <NewWalletsCard />
            <RecentDeviationsCard />
          </div>
          
          {/* Footer hint */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
              Market shows deviations and emerging patterns. To track specific assets, use{' '}
              <a href="/tokens" className="text-blue-500 hover:underline">Tokens</a> or{' '}
              <a href="/wallets" className="text-blue-500 hover:underline">Wallets</a>.
            </p>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
