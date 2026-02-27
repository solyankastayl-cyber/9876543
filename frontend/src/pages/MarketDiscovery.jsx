/**
 * Market Discovery - Вход в Decision System
 * 
 * АРХИТЕКТУРА:
 * - Базовый слой: существующая логика (activity, narratives, signals)
 * - ML-слой: decisionImpact, engineStatus, affectedTokens (добавляется поверх)
 * 
 * 3 БЛОКА:
 * 1. Unusual Activity (Raw) — что происходит физически в сети
 * 2. Narratives & Coordination — скоординированные паттерны
 * 3. Deviation Watchlist — что может перейти в решение
 * 
 * Каждый элемент → клик ведёт на Token Page
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, RefreshCw, Loader2, AlertCircle,
  Activity, ChevronRight, Users, Bell,
  Wallet, Coins, Flame, Zap, ExternalLink,
  Layers, Target, Brain, Eye, EyeOff
} from 'lucide-react';
import StatusBanner from '../components/StatusBanner';
import { marketApi } from '../api';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

// ============================================================================
// ML Integration Badges (новый слой поверх базового)
// ============================================================================

/**
 * Badge showing decision impact level
 */
function DecisionImpactBadge({ impact }) {
  if (!impact || impact === 'NONE') return null;
  
  const styles = {
    HIGH: 'bg-red-100 text-red-700 border-red-200',
    MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
    LOW: 'bg-blue-100 text-blue-700 border-blue-200',
  };
  
  const labels = {
    HIGH: 'Affects Decision',
    MEDIUM: 'May Affect',
    LOW: 'Watched',
  };
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`text-xs px-2 py-0.5 rounded border font-medium ${styles[impact]}`}>
          {labels[impact]}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">Impact on ML decision engine: {impact}</p>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Badge showing engine status
 */
function EngineStatusBadge({ status }) {
  if (!status) return null;
  
  const styles = {
    USED_IN_DECISION: 'bg-emerald-100 text-emerald-700',
    WEIGHTED_DOWN: 'bg-gray-100 text-gray-600',
    IGNORED: 'bg-gray-50 text-gray-400',
  };
  
  const icons = {
    USED_IN_DECISION: <Brain className="w-3 h-3" />,
    WEIGHTED_DOWN: <Eye className="w-3 h-3" />,
    IGNORED: <EyeOff className="w-3 h-3" />,
  };
  
  const labels = {
    USED_IN_DECISION: 'Used by Engine',
    WEIGHTED_DOWN: 'Weighted Down',
    IGNORED: 'Ignored',
  };
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${styles[status]}`}>
          {icons[status]}
          <span className="hidden sm:inline">{labels[status]}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">Engine status: {status.replace(/_/g, ' ')}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// ============================================================================
// BLOCK 1: Unusual Activity (Raw)
// Базовый слой: TopActiveTokens + UnusualBehavior + NewWallets
// ML-слой: decisionImpact, engineStatus badges
// ============================================================================

function UnusualActivityBlock() {
  const navigate = useNavigate();
  const [data, setData] = useState({ tokens: [], signals: [], actors: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('activity'); // activity | signals | wallets
  
  // Timeout wrapper for API calls
  const withTimeout = (promise, ms = 10000) => {
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), ms)
    );
    return Promise.race([promise, timeout]);
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Use timeout to avoid hanging
        const [tokensRes, signalsRes, actorsRes] = await Promise.allSettled([
          withTimeout(marketApi.getTopActiveTokens(6, '24h'), 15000),
          withTimeout(marketApi.getEmergingSignals(6), 15000),
          withTimeout(marketApi.getNewActors(6), 15000),
        ]);
        
        setData({
          tokens: tokensRes.status === 'fulfilled' ? (tokensRes.value?.data?.tokens || []) : [],
          signals: signalsRes.status === 'fulfilled' ? (signalsRes.value?.data?.tokens || []) : [],
          actors: actorsRes.status === 'fulfilled' ? (actorsRes.value?.data?.actors || []) : [],
        });
      } catch (err) {
        console.error('Failed to load unusual activity:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);
  
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };
  
  const formatAddress = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  
  // Calculate ML fields for display (базовый слой + ML)
  const getDecisionImpact = (item) => {
    if (item.topSignal?.severity >= 80) return 'HIGH';
    if (item.topSignal?.severity >= 50 || item.transferCount > 500) return 'MEDIUM';
    if (item.topSignal?.severity >= 20) return 'LOW';
    return 'NONE';
  };
  
  const getEngineStatus = (item) => {
    if (item.topSignal?.severity >= 60 && item.transferCount >= 100) return 'USED_IN_DECISION';
    if (item.topSignal?.severity >= 30 || item.transferCount >= 50) return 'WEIGHTED_DOWN';
    return 'IGNORED';
  };
  
  const tabs = [
    { id: 'activity', label: 'On-Chain Activity', icon: Flame, count: data.tokens.length },
    { id: 'signals', label: 'Behavior Deviations', icon: Zap, count: data.signals.length },
    { id: 'wallets', label: 'New Wallets', icon: Users, count: data.actors.length },
  ];
  
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-orange-500 animate-pulse" />
          <h3 className="text-base font-semibold text-gray-900">Unusual Activity (Raw)</h3>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-orange-500" />
          <h3 className="text-base font-semibold text-gray-900">Unusual Activity (Raw)</h3>
        </div>
        <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded font-medium">
          Live 24h
        </span>
      </div>
      
      {/* Why this matters */}
      <p className="text-xs text-gray-500 mb-4">
        What's happening physically on-chain — activity, deviations, new actors
      </p>
      
      {/* Tabs (базовый слой - разные типы данных) */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
              activeTab === tab.id 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.count > 0 && (
              <span className={`text-xs px-1.5 rounded ${
                activeTab === tab.id ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
      
      {/* Content based on active tab - flex-grow to fill space */}
      <div className="space-y-2 flex-grow">
        {activeTab === 'activity' && data.tokens.slice(0, 6).map((token, i) => (
          <div 
            key={token.address}
            onClick={() => navigate(`/tokens/${token.address}`)}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors group"
            data-testid={`activity-token-${i}`}
          >
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs font-bold text-gray-500 shadow-sm">
                {i + 1}
              </span>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {token.symbol || token.address.slice(0, 8) + '...'}
                </div>
                <div className="text-xs text-gray-500">
                  {formatNumber(token.transferCount)} transfers • {formatNumber(token.activeWallets)} wallets
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* ML Layer badges */}
              <DecisionImpactBadge impact={getDecisionImpact(token)} />
              <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
        
        {activeTab === 'signals' && data.signals.length === 0 && (
          <div className="text-center py-6 bg-gray-50 rounded-xl">
            <Zap className="w-6 h-6 text-gray-700 mx-auto mb-2" />
            <p className="text-sm text-gray-600">All tokens within normal range</p>
            <p className="text-xs text-gray-400">No significant deviations detected</p>
          </div>
        )}
        
        {activeTab === 'signals' && data.signals.slice(0, 6).map((token, i) => (
          <div 
            key={token.address}
            onClick={() => navigate(`/tokens/${token.address}`)}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors group"
            data-testid={`signal-token-${i}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Coins className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{token.symbol}</div>
                <div className="text-xs text-gray-500">
                  {token.signals?.length || 0} deviation{token.signals?.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {token.topSignal && (
                <span className={`text-xs px-2 py-1 rounded font-medium ${
                  token.topSignal.severity >= 80 ? 'bg-red-100 text-red-700' :
                  token.topSignal.severity >= 60 ? 'bg-orange-100 text-orange-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {token.topSignal.type.replace('_', ' ')}
                </span>
              )}
              <EngineStatusBadge status={getEngineStatus(token)} />
              <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
        
        {activeTab === 'wallets' && data.actors.length === 0 && (
          <div className="text-center py-6 bg-gray-50 rounded-xl">
            <Users className="w-6 h-6 text-gray-700 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No new significant actors</p>
            <p className="text-xs text-gray-400">Monitoring for new wallet activity</p>
          </div>
        )}
        
        {activeTab === 'wallets' && data.actors.slice(0, 6).map((actor, i) => (
          <div 
            key={actor.address}
            onClick={() => navigate(`/wallets/${actor.address}`)}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors group"
            data-testid={`new-wallet-${i}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <div className="text-sm font-mono font-medium text-gray-900">{formatAddress(actor.address)}</div>
                <div className="text-xs text-gray-500">
                  {actor.txCount} transfers • {actor.tokenCount} tokens
                </div>
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
      
      {/* CTA - pushed to bottom */}
      <button
        onClick={() => navigate('/tokens')}
        className="w-full mt-auto pt-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        View all tokens
        <ExternalLink className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ============================================================================
// BLOCK 2: Narratives & Coordination
// Базовый слой: MarketNarratives + NarrativesBySector
// ML-слой: decisionImpact (BUY bias / SELL bias / Neutral), tokensAffected
// ============================================================================

function NarrativesBlock() {
  const navigate = useNavigate();
  const [narratives, setNarratives] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('market'); // market | sector
  const [expanded, setExpanded] = useState(null);
  
  // Timeout wrapper for API calls
  const withTimeout = (promise, ms = 10000) => {
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), ms)
    );
    return Promise.race([promise, timeout]);
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [narrativesRes, sectorsRes] = await Promise.allSettled([
          withTimeout(marketApi.getNarratives('24h', 5), 15000),
          withTimeout(marketApi.getNarrativesBySector('24h'), 15000),
        ]);
        
        setNarratives(narrativesRes.status === 'fulfilled' ? (narrativesRes.value?.data?.narratives || []) : []);
        setSectors(sectorsRes.status === 'fulfilled' ? (sectorsRes.value?.data?.sectors || []) : []);
      } catch (err) {
        console.error('Failed to load narratives:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);
  
  // ML Layer: calculate decision bias based on pattern
  const getDecisionBias = (narrative) => {
    const pattern = narrative.pattern?.toLowerCase() || '';
    if (pattern.includes('accumulation') || pattern.includes('inflow')) return 'BUY bias';
    if (pattern.includes('distribution') || pattern.includes('outflow')) return 'SELL bias';
    return 'Neutral';
  };
  
  const getBiasStyle = (bias) => {
    if (bias === 'BUY bias') return 'text-emerald-600 bg-emerald-50';
    if (bias === 'SELL bias') return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };
  
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-purple-500 animate-pulse" />
          <h3 className="text-base font-semibold text-gray-900">Narratives & Coordination</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-500" />
          <h3 className="text-base font-semibold text-gray-900">Narratives & Coordination</h3>
        </div>
        <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded font-medium">
          24h Window
        </span>
      </div>
      
      {/* Why this matters (ML context) */}
      <p className="text-xs text-gray-500 mb-4">
        Coordinated patterns across tokens — these are features for ML, not just news
      </p>
      
      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('market')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'market' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Market
          {narratives.length > 0 && (
            <span className={`text-xs px-1.5 rounded ${
              activeTab === 'market' ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-600'
            }`}>
              {narratives.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('sector')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'sector' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          By Sector
          {sectors.length > 0 && (
            <span className={`text-xs px-1.5 rounded ${
              activeTab === 'sector' ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-600'
            }`}>
              {sectors.length}
            </span>
          )}
        </button>
      </div>
      
      {/* Market Narratives - flex-grow to fill space */}
      {activeTab === 'market' && (
        <div className="space-y-3 flex-grow">
          {narratives.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-xl">
              <TrendingUp className="w-6 h-6 text-gray-700 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No coordinated patterns detected</p>
              <p className="text-xs text-gray-400">Activity appears dispersed</p>
            </div>
          ) : (
            narratives.map((narrative) => {
              const bias = getDecisionBias(narrative);
              const isExpanded = expanded === narrative.id;
              
              return (
                <div 
                  key={narrative.id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:border-purple-300 transition-colors"
                >
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpanded(isExpanded ? null : narrative.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        {/* Badges: category + ML bias */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-medium capitalize">
                            {narrative.category}
                          </span>
                          {/* ML Layer: Decision Bias */}
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${getBiasStyle(bias)}`}>
                            {bias}
                          </span>
                          {narrative.scope && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              {narrative.scope}
                            </span>
                          )}
                        </div>
                        
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">
                          {narrative.theme}
                        </h4>
                        <p className="text-xs text-gray-600">{narrative.whyItMatters}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          {/* ML Layer: Tokens affected */}
                          <div className="text-xs font-semibold text-purple-600">
                            {narrative.supportScore?.tokens || 0} tokens
                          </div>
                          <div className="text-xs text-gray-500">
                            {narrative.supportScore?.signals || 0} signals
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${
                          isExpanded ? 'rotate-90' : ''
                        }`} />
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded: affected tokens → links to Token Page */}
                  {isExpanded && narrative.evidence?.length > 0 && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                      <div className="text-xs font-medium text-gray-700 mb-2">
                        Affected Tokens (click to view):
                      </div>
                      <div className="space-y-2">
                        {narrative.evidence.slice(0, 4).map((e, i) => (
                          <div
                            key={i}
                            onClick={(ev) => {
                              ev.stopPropagation();
                              navigate(`/tokens/${e.token}`);
                            }}
                            className="flex items-center justify-between p-2 bg-white rounded hover:bg-purple-50 cursor-pointer transition-colors group"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-bold text-purple-600">
                                {e.symbol?.slice(0, 2) || '??'}
                              </span>
                              <span className="text-xs font-medium text-gray-900">{e.symbol}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                {e.deviation?.toFixed(1)}x deviation
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
      
      {/* Sector Narratives - flex-grow to fill space */}
      {activeTab === 'sector' && (
        <div className="space-y-2 flex-grow">
          {sectors.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-xl">
              <Layers className="w-6 h-6 text-gray-700 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No sector patterns detected</p>
              <p className="text-xs text-gray-400">Activity is distributed across sectors</p>
            </div>
          ) : (
            sectors.map((sector) => (
              <div
                key={sector.sectorId}
                className="border border-gray-200 rounded-lg p-3 hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-lg border font-medium text-sm bg-indigo-50 text-indigo-700 border-indigo-200">
                      {sector.sectorLabel}
                    </span>
                    <span className="text-xs text-gray-500">
                      {sector.narrativeCount} narrative{sector.narrativeCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                
                {sector.narratives?.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {sector.narratives.slice(0, 2).map((n) => (
                      <div key={n.id} className="text-xs text-gray-600 pl-3 border-l-2 border-indigo-200">
                        {n.theme}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
      
      {/* CTA to Advanced Signals - pushed to bottom */}
      <button
        onClick={() => navigate('/advanced/signals')}
        className="w-full mt-auto pt-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        View Signal Attribution
        <ExternalLink className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ============================================================================
// BLOCK 3: Deviation Watchlist
// Базовый слой: Recent deviations + Abnormal behavior
// ML-слой: engineStatus (Watched by Engine / Ignored / Contributing to decision)
// ============================================================================

function DeviationWatchlistBlock() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Timeout wrapper for API calls
  const withTimeout = (promise, ms = 10000) => {
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), ms)
    );
    return Promise.race([promise, timeout]);
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const response = await withTimeout(marketApi.getEmergingSignals(10), 15000);
        setItems(response?.data?.tokens || []);
      } catch (err) {
        console.error('Failed to load deviation watchlist:', err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);
  
  // ML Layer: determine status
  const getWatchStatus = (item) => {
    if (!item.topSignal) return { status: 'IGNORED', label: 'Ignored', style: 'text-gray-400 bg-gray-50' };
    if (item.topSignal.severity >= 60) return { status: 'USED', label: 'Contributing', style: 'text-emerald-700 bg-emerald-100' };
    if (item.topSignal.severity >= 30) return { status: 'WATCHED', label: 'Watched', style: 'text-amber-700 bg-amber-100' };
    return { status: 'IGNORED', label: 'Noise', style: 'text-gray-500 bg-gray-100' };
  };
  
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-amber-500 animate-pulse" />
          <h3 className="text-base font-semibold text-gray-900">Deviation Watchlist</h3>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-semibold text-gray-900">Deviation Watchlist</h3>
        </div>
        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-medium">
          {items.length} active
        </span>
      </div>
      
      {/* Why this matters (ML context) */}
      <p className="text-xs text-gray-500 mb-4">
        Items that may transition to decision — watched by the ML engine
      </p>
      
      {/* Empty state - flex-grow to fill */}
      {items.length === 0 ? (
        <div className="text-center py-8 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl flex-grow flex flex-col justify-center">
          <div className="p-3 bg-white rounded-xl inline-block mb-3 shadow-sm">
            <Target className="w-6 h-6 text-amber-400" />
          </div>
          <p className="text-sm font-medium text-gray-700 mb-2">No deviations detected</p>
          <p className="text-xs text-gray-500 max-w-xs mx-auto mb-4">
            All monitored tokens are within normal behavioral ranges.
          </p>
          <button
            onClick={() => navigate('/alerts')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
          >
            <Bell className="w-4 h-4" />
            Set Up Alerts
          </button>
        </div>
      ) : (
        <div className="flex-grow flex flex-col">
          {/* Items list */}
          <div className="space-y-2 flex-grow">
            {items.slice(0, 7).map((item, i) => {
              const watchStatus = getWatchStatus(item);
              
              return (
                <div 
                  key={item.address}
                  onClick={() => navigate(`/tokens/${item.address}`)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors group"
                  data-testid={`deviation-item-${i}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.symbol}</div>
                      <div className="text-xs text-gray-500">
                        {item.signals?.length || 0} signal{item.signals?.length !== 1 ? 's' : ''} • 
                        {item.topSignal?.type?.replace('_', ' ') || 'Unknown'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Severity badge */}
                    {item.topSignal && (
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        item.topSignal.severity >= 80 ? 'bg-red-100 text-red-700' :
                        item.topSignal.severity >= 60 ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {item.topSignal.severity}%
                      </span>
                    )}
                    
                    {/* ML Layer: Engine status */}
                    <span className={`text-xs px-2 py-0.5 rounded ${watchStatus.style}`}>
                      {watchStatus.label}
                    </span>
                    
                    <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* CTA - pushed to bottom */}
          <button
            onClick={() => navigate('/advanced/signals')}
            className="w-full mt-auto pt-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            View all in Signals Attribution
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Market Discovery Page
// ============================================================================

export default function MarketDiscovery() {
  const [loading, setLoading] = useState(false);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 100);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50" data-testid="market-discovery-page">
        
        <div className="max-w-[1400px] mx-auto px-4 py-6">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Market Discovery</h1>
              <p className="text-sm text-gray-500">
                Entry point to the Decision System — raw signals, patterns, and deviations
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

          {/* 3 Blocks Grid - aligned height */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
            {/* Block 1: Unusual Activity (Raw) */}
            <div className="xl:col-span-1 min-h-[580px]">
              <UnusualActivityBlock />
            </div>
            
            {/* Block 2: Narratives & Coordination */}
            <div className="xl:col-span-1 min-h-[580px]">
              <NarrativesBlock />
            </div>
            
            {/* Block 3: Deviation Watchlist */}
            <div className="xl:col-span-1 min-h-[580px]">
              <DeviationWatchlistBlock />
            </div>
          </div>
          
          {/* Footer hint */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
              Market Discovery shows pre-filter signals for the ML engine. 
              Click any item to view <span className="text-blue-500">Token Page</span> with full decision context.
            </p>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
