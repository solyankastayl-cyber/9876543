/**
 * Market Hub - Unified Market Analytics
 * 
 * FREEZE v2.3 - Consolidated Market Intelligence
 * 
 * Architecture:
 * - Discovery (Input): Raw patterns, deviations, unusual activity
 * - Signals (Output): Decision-ready signals from ML
 * - Attribution (Explainability): Why the system thinks this way
 * 
 * Light theme only.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, RefreshCw, Loader2, AlertCircle,
  Activity, ChevronRight, Users, Bell, Target, Building2,
  Wallet, Coins, Flame, Zap, ExternalLink, Network,
  Layers, Brain, Eye, BarChart3, Minus, Info, Search
} from 'lucide-react';
import { api, apiGet } from '../api/client';
import StatusBanner from '../components/StatusBanner';
import { NetworkBadge } from '../components/NetworkSelector';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../components/ui/tooltip';

// U1.2 - Signal Drivers Components
import { MarketSignalsPage } from '../modules/market';

// ============================================================================
// HELPERS
// ============================================================================

function formatNumber(n) {
  if (n === null || n === undefined) return '-';
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatPercent(n) {
  if (n === null || n === undefined) return '-';
  return `${(n * 100).toFixed(1)}%`;
}

function formatDelta(n) {
  if (n === null || n === undefined) return '-';
  const prefix = n > 0 ? '+' : '';
  return `${prefix}${(n * 100).toFixed(1)}%`;
}

function timeAgo(date) {
  if (!date) return '-';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ============================================================================
// SHARED COMPONENTS
// ============================================================================

function DecisionImpactBadge({ impact }) {
  if (!impact || impact === 'NONE') return null;
  const styles = {
    HIGH: 'bg-red-100 text-red-700 border-red-200',
    MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
    LOW: 'bg-blue-100 text-blue-700 border-blue-200',
  };
  const labels = { HIGH: 'Affects Decision', MEDIUM: 'May Affect', LOW: 'Watched' };
  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${styles[impact]}`}>
      {labels[impact]}
    </span>
  );
}

function SignalBadge({ signal }) {
  const styles = {
    STRONG_BUY: 'bg-green-100 text-green-700 border-green-200',
    BUY: 'bg-green-50 text-green-600 border-green-100',
    NEUTRAL: 'bg-slate-100 text-slate-600 border-slate-200',
    SELL: 'bg-red-50 text-red-600 border-red-100',
    STRONG_SELL: 'bg-red-100 text-red-700 border-red-200',
    ACCUMULATION: 'bg-green-100 text-green-700 border-green-200',
    DISTRIBUTION: 'bg-red-100 text-red-700 border-red-200',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${styles[signal] || styles.NEUTRAL}`}>
      {signal?.replace(/_/g, ' ') || 'N/A'}
    </span>
  );
}

function VerdictBadge({ verdict }) {
  const styles = {
    PASS: 'bg-green-100 text-green-700',
    FAIL: 'bg-red-100 text-red-700',
    INCONCLUSIVE: 'bg-amber-100 text-amber-700',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded font-medium ${styles[verdict] || 'bg-slate-100 text-slate-600'}`}>
      {verdict || 'N/A'}
    </span>
  );
}

// ============================================================================
// DISCOVERY TAB (Input - Raw patterns)
// ============================================================================

function DiscoveryTab({ network, onRefresh, loading }) {
  const navigate = useNavigate();
  const [data, setData] = useState({ unusual: [], narratives: [], deviations: [] });
  const [localLoading, setLocalLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLocalLoading(true);
    try {
      // Load data from available endpoints
      const [activityRes, narrativesRes, signalsRes] = await Promise.all([
        api.get(`/api/market/top-active-tokens?limit=10&window=24h`).catch(() => ({ data: null })),
        api.get(`/api/market/narratives?window=24h&limit=10`).catch(() => ({ data: null })),
        api.get(`/api/market/emerging-signals?limit=10`).catch(() => ({ data: null })),
      ]);
      
      setData({
        unusual: activityRes.data?.data?.items || activityRes.data?.items || [],
        narratives: narrativesRes.data?.data?.items || narrativesRes.data?.items || [],
        deviations: signalsRes.data?.data?.items || signalsRes.data?.items || [],
      });
    } catch (err) {
      console.error('Discovery load error:', err);
    } finally {
      setLocalLoading(false);
    }
  }, [network]);

  useEffect(() => { loadData(); }, [loadData]);

  if (localLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Unusual Activity */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <Activity className="w-4 h-4 text-orange-500" />
          <h3 className="font-semibold text-slate-900">Unusual Activity</h3>
          <Badge variant="outline" className="ml-auto">{data.unusual.length}</Badge>
        </div>
        <div className="divide-y divide-slate-100">
          {data.unusual.length === 0 ? (
            <div className="p-6 text-center text-slate-500">No unusual activity detected</div>
          ) : data.unusual.slice(0, 8).map((item, i) => (
            <div 
              key={i} 
              className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
              onClick={() => item.tokenAddress && navigate(`/token/${item.tokenAddress}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Flame className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">{item.symbol || item.token || 'Unknown'}</div>
                    <div className="text-sm text-slate-500">{item.reason || item.type}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DecisionImpactBadge impact={item.decisionImpact} />
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Narratives & Coordination */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-500" />
          <h3 className="font-semibold text-slate-900">Narratives & Coordination</h3>
          <Badge variant="outline" className="ml-auto">{data.narratives.length}</Badge>
        </div>
        <div className="divide-y divide-slate-100">
          {data.narratives.length === 0 ? (
            <div className="p-6 text-center text-slate-500">No active narratives</div>
          ) : data.narratives.slice(0, 6).map((item, i) => (
            <div key={i} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-900">{item.name || item.narrative}</div>
                  <div className="text-sm text-slate-500">{item.tokens?.length || 0} tokens • {item.actorCount || 0} actors</div>
                </div>
                <Badge className={item.strength === 'HIGH' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}>
                  {item.strength || 'MEDIUM'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Deviation Watchlist */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-500" />
          <h3 className="font-semibold text-slate-900">Deviation Watchlist</h3>
          <Badge variant="outline" className="ml-auto">{data.deviations.length}</Badge>
        </div>
        <div className="divide-y divide-slate-100">
          {data.deviations.length === 0 ? (
            <div className="p-6 text-center text-slate-500">No deviations detected</div>
          ) : data.deviations.slice(0, 8).map((item, i) => (
            <div 
              key={i} 
              className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
              onClick={() => item.tokenAddress && navigate(`/token/${item.tokenAddress}`)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-900">{item.symbol || item.token}</div>
                  <div className="text-sm text-slate-500">{item.deviation || item.type}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    {item.score ? `${(item.score * 100).toFixed(0)}%` : '-'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ============================================================================
// SIGNALS TAB (Output - Decision-ready)
// ============================================================================

function SignalsTab({ network, loading }) {
  const [data, setData] = useState({ pressure: null, zones: null, relations: null });
  const [localLoading, setLocalLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLocalLoading(true);
    try {
      const [pressureRes, zonesRes, relationsRes] = await Promise.all([
        api.get(`/api/market/exchange-pressure?network=${network}&window=24h`).catch(() => ({ data: null })),
        api.get(`/api/market/accumulation-zones?network=${network}`).catch(() => ({ data: null })),
        api.get(`/api/p1/relations/stats?network=${network}`).catch(() => ({ data: null })),
      ]);
      setData({
        pressure: pressureRes.data,
        zones: zonesRes.data,
        relations: relationsRes.data,
      });
    } catch (err) {
      console.error('Signals load error:', err);
    } finally {
      setLocalLoading(false);
    }
  }, [network]);

  useEffect(() => { loadData(); }, [loadData]);

  if (localLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  const pressure = data.pressure?.data;
  const zones = data.zones?.data;
  const relations = data.relations?.data;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Exchange Pressure */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-slate-900">Exchange Pressure</h3>
        </div>
        {pressure ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Signal</span>
              <SignalBadge signal={pressure.signal} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Strength</span>
              <span className="font-medium text-slate-900">{pressure.strength || 0}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Net Flow</span>
              <span className={`font-medium ${pressure.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatNumber(pressure.netFlow)}
              </span>
            </div>
            <div className="pt-3 border-t border-slate-100 text-sm text-slate-500">
              {pressure.interpretation || 'Analyzing market pressure...'}
            </div>
          </div>
        ) : (
          <div className="text-slate-500 text-center py-4">No data available</div>
        )}
      </div>

      {/* Accumulation/Distribution */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-slate-900">Accumulation Zones</h3>
        </div>
        {zones ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Dominant</span>
              <SignalBadge signal={zones.dominantZone} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Active Zones</span>
              <span className="font-medium text-slate-900">{zones.activeZones || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Confidence</span>
              <span className="font-medium text-slate-900">{zones.confidence || 0}%</span>
            </div>
            <div className="pt-3 border-t border-slate-100 text-sm text-slate-500">
              {zones.interpretation || 'Analyzing accumulation patterns...'}
            </div>
          </div>
        ) : (
          <div className="text-slate-500 text-center py-4">No data available</div>
        )}
      </div>

      {/* Relations Statistics */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Network className="w-5 h-5 text-green-500" />
          <h3 className="font-semibold text-slate-900">Relations Network</h3>
        </div>
        {relations ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Active Relations</span>
              <span className="font-medium text-slate-900">{formatNumber(relations.totalRelations)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">New Today</span>
              <span className="font-medium text-green-600">+{formatNumber(relations.newToday)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Clusters</span>
              <span className="font-medium text-slate-900">{relations.clusters || 0}</span>
            </div>
            <div className="pt-3 border-t border-slate-100 text-sm text-slate-500">
              Network activity indicates {relations.trend || 'normal'} behavior
            </div>
          </div>
        ) : (
          <div className="text-slate-500 text-center py-4">No data available</div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// ATTRIBUTION TAB (Explainability)
// ============================================================================

function AttributionTab({ network, loading }) {
  const [data, setData] = useState(null);
  const [localLoading, setLocalLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLocalLoading(true);
    try {
      const result = await apiGet('/api/advanced/signals-attribution');
      setData(result);
    } catch (err) {
      console.error('Attribution load error:', err);
      setData(null);
    } finally {
      setLocalLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (localLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-slate-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-700" />
        <p>Attribution data unavailable</p>
      </div>
    );
  }

  const { coverage, topImpactSignals, confidenceCalibration } = data;

  return (
    <div className="space-y-6">
      {/* Coverage */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Signal Coverage</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500 mb-1">Active Signals</div>
            <div className="text-2xl font-bold text-slate-900">{coverage?.activeSignals || 0}</div>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500 mb-1">Coverage</div>
            <div className="text-2xl font-bold text-slate-900">{coverage?.coveragePercent || 0}%</div>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500 mb-1">Conflict Rate</div>
            <div className="text-2xl font-bold text-slate-900">{coverage?.conflictRate || 0}%</div>
          </div>
        </div>
      </div>

      {/* Top Impact Signals */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
          <h3 className="font-semibold text-slate-900">Top Impact Signals</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {(topImpactSignals || []).slice(0, 5).map((signal, i) => (
            <div key={i} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${signal.direction === 'BULLISH' ? 'bg-green-500' : signal.direction === 'BEARISH' ? 'bg-red-500' : 'bg-slate-400'}`} />
                <div>
                  <div className="font-medium text-slate-900">{signal.type}</div>
                  <div className="text-sm text-slate-500">{signal.description}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-slate-900">{signal.impact}%</div>
                <div className="text-xs text-slate-500">impact</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confidence Calibration */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Confidence Calibration</h3>
        <div className={`p-4 rounded-lg ${confidenceCalibration?.status === 'OK' ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            {confidenceCalibration?.status === 'OK' ? (
              <div className="w-3 h-3 rounded-full bg-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600" />
            )}
            <span className={`font-medium ${confidenceCalibration?.status === 'OK' ? 'text-green-700' : 'text-amber-700'}`}>
              {confidenceCalibration?.status || 'UNKNOWN'}
            </span>
          </div>
          <p className="text-sm text-slate-600">{confidenceCalibration?.explanation || 'Calibration status unavailable'}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DRIVERS TAB (U1.2 - Signal Cards A-F)
// ============================================================================

function DriversTab() {
  // Use real networks, not mock tokens
  const [network, setNetwork] = useState('ethereum');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real networks from our indexer
  const networks = ['ethereum', 'bnb'];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Use network as "asset" - our Signal Drivers work per network
      const res = await api.get(`/api/v3/signals/market/${network}`);
      if (res.data?.ok) {
        setData(res.data.data);
        setError(null);
      } else {
        setError(res.data?.error || 'Failed to load');
      }
    } catch (err) {
      setError('Unable to fetch drivers');
    } finally {
      setLoading(false);
    }
  }, [network]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Import components dynamically to avoid circular deps
  const DecisionHeader = require('../modules/market/DecisionHeader').default;
  const SignalGrid = require('../modules/market/SignalGrid').default;

  return (
    <div className="space-y-6">
      {/* Network Selector - Real networks only */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-600">Network:</span>
        <div className="flex gap-1">
          {networks.map((n) => (
            <button
              key={n}
              onClick={() => setNetwork(n)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                n === network
                  ? 'bg-white text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="ml-auto flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <span className="text-amber-800">{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && !data && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
        </div>
      )}

      {/* Content */}
      {data && (
        <>
          <DecisionHeader
            decision={data.decision}
            quality={data.quality}
            asset={data.network?.toUpperCase() || network.toUpperCase()}
            timestamp={data.timestamp}
          />
          <SignalGrid drivers={data.drivers} />
        </>
      )}
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function MarketHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [network, setNetwork] = useState(searchParams.get('network') || 'ethereum');
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'discovery');
  const [loading, setLoading] = useState(false);

  const networks = ['ethereum', 'arbitrum', 'optimism', 'base', 'polygon', 'bsc'];

  const handleNetworkChange = (net) => {
    setNetwork(net);
    setSearchParams({ network: net, tab: activeTab });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ network, tab });
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 100);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50" data-testid="market-hub-page">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Market</h1>
                  <p className="text-sm text-slate-500">Unified Market Intelligence</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Select value={network} onValueChange={handleNetworkChange}>
                  <SelectTrigger className="w-36 bg-white border-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {networks.map(net => (
                      <SelectItem key={net} value={net}>
                        {net.charAt(0).toUpperCase() + net.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="bg-slate-100 p-1">
              <TabsTrigger value="discovery" className="data-[state=active]:bg-white">
                <Activity className="w-4 h-4 mr-2" />
                Discovery
              </TabsTrigger>
              <TabsTrigger value="signals" className="data-[state=active]:bg-white">
                <TrendingUp className="w-4 h-4 mr-2" />
                Signals
              </TabsTrigger>
              <TabsTrigger value="attribution" className="data-[state=active]:bg-white">
                <Brain className="w-4 h-4 mr-2" />
                Attribution
              </TabsTrigger>
              <TabsTrigger value="drivers" className="data-[state=active]:bg-white">
                <Layers className="w-4 h-4 mr-2" />
                Drivers
              </TabsTrigger>
            </TabsList>

            <TabsContent value="discovery">
              <DiscoveryTab network={network} onRefresh={handleRefresh} loading={loading} />
            </TabsContent>

            <TabsContent value="signals">
              <SignalsTab network={network} loading={loading} />
            </TabsContent>

            <TabsContent value="attribution">
              <AttributionTab network={network} loading={loading} />
            </TabsContent>

            <TabsContent value="drivers">
              <DriversTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  );
}
