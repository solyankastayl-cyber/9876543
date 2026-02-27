/**
 * Actor Signals Section (Sprint 3 - Signals Layer v2)
 * 
 * Market-level view of actor behavior deviations
 * 
 * Philosophy:
 * - Signals = observed deviations, NOT predictions
 * - severity = degree of deviation
 * - NO buy/sell/bullish/bearish language
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, ArrowRightLeft, Layers, 
  AlertTriangle, Filter, RefreshCw, Loader2, ChevronRight,
  Building, Users, BarChart3
} from 'lucide-react';
import { api } from '../../api/client';

const SIGNAL_TYPE_CONFIG = {
  flow_deviation: {
    icon: TrendingUp,
    label: 'Flow Deviation',
    color: 'text-blue-600 bg-blue-50',
  },
  corridor_volume_spike: {
    icon: ArrowRightLeft,
    label: 'Corridor Spike',
    color: 'text-purple-600 bg-purple-50',
  },
  cluster_participation: {
    icon: Layers,
    label: 'Cluster Change',
    color: 'text-amber-600 bg-amber-50',
  },
  behavior_regime_shift: {
    icon: TrendingDown,
    label: 'Regime Shift',
    color: 'text-rose-600 bg-rose-50',
  },
};

const SEVERITY_CONFIG = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
  medium: { label: 'Medium', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  high: { label: 'High', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
};

const ACTOR_TYPE_CONFIG = {
  exchange: { label: 'Exchange', icon: Building, color: 'text-blue-600' },
  fund: { label: 'Fund', icon: BarChart3, color: 'text-purple-600' },
  whale: { label: 'Whale', icon: Users, color: 'text-emerald-600' },
  market_maker: { label: 'MM', icon: ArrowRightLeft, color: 'text-amber-600' },
  trader: { label: 'Trader', icon: TrendingUp, color: 'text-gray-600' },
  unknown: { label: 'Unknown', icon: Users, color: 'text-gray-400' },
};

export default function ActorSignalsSection() {
  const [signals, setSignals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [actorTypeFilter, setActorTypeFilter] = useState('all');
  const [signalTypeFilter, setSignalTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const fetchSignals = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (actorTypeFilter !== 'all') params.append('type', actorTypeFilter);
      if (signalTypeFilter !== 'all') params.append('signalType', signalTypeFilter);
      if (severityFilter !== 'all') params.append('severity', severityFilter);
      
      const response = await api.get(`/api/signals/actors?${params.toString()}`);
      
      if (response.data.ok) {
        setSignals(response.data.data.signals || []);
        setSummary(response.data.data.summary);
      } else {
        setError('Failed to load signals');
      }
    } catch (err) {
      setError('Failed to fetch actor signals');
      console.error('Actor signals fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
  }, [actorTypeFilter, signalTypeFilter, severityFilter]);

  return (
    <div className="space-y-6" data-testid="actor-signals-section">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Actor Behavior Deviations
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Observed deviations from baseline behavior. Not predictions.
          </p>
        </div>
        
        <button
          onClick={fetchSignals}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          disabled={loading}
        >
          <RefreshCw className={`w-5 h-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100">
            <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
            <div className="text-xs text-gray-500">Active Signals</div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-gray-100">
            <div className="text-2xl font-bold text-red-600">{summary.bySeverity?.high || 0}</div>
            <div className="text-xs text-gray-500">High Severity</div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-gray-100">
            <div className="text-2xl font-bold text-amber-600">{summary.bySeverity?.medium || 0}</div>
            <div className="text-xs text-gray-500">Medium Severity</div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-gray-100">
            <div className="text-2xl font-bold text-gray-600">{summary.bySeverity?.low || 0}</div>
            <div className="text-xs text-gray-500">Low Severity</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Actor Type Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={actorTypeFilter}
            onChange={(e) => setActorTypeFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
          >
            <option value="all">All Actors</option>
            <option value="exchange">Exchanges</option>
            <option value="fund">Funds</option>
            <option value="whale">Whales</option>
            <option value="market_maker">Market Makers</option>
          </select>
        </div>
        
        {/* Signal Type Filter */}
        <select
          value={signalTypeFilter}
          onChange={(e) => setSignalTypeFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
        >
          <option value="all">All Types</option>
          <option value="flow_deviation">Flow Deviation</option>
          <option value="corridor_volume_spike">Corridor Spike</option>
          <option value="cluster_participation">Cluster Change</option>
          <option value="behavior_regime_shift">Regime Shift</option>
        </select>
        
        {/* Severity Filter */}
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
        >
          <option value="all">All Severity</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Signals List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-gray-500">{error}</p>
        </div>
      ) : signals.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">No deviations detected</p>
          <p className="text-sm text-gray-400 mt-1">All actors within baseline range</p>
        </div>
      ) : (
        <div className="space-y-3">
          {signals.map((signal) => {
            const typeConfig = SIGNAL_TYPE_CONFIG[signal.signalType] || SIGNAL_TYPE_CONFIG.flow_deviation;
            const severityConfig = SEVERITY_CONFIG[signal.severity] || SEVERITY_CONFIG.low;
            const actorConfig = ACTOR_TYPE_CONFIG[signal.actorType] || ACTOR_TYPE_CONFIG.unknown;
            const Icon = typeConfig.icon;
            const ActorIcon = actorConfig.icon;
            
            return (
              <Link
                key={signal.id}
                to={`/actors/${signal.actorSlug}`}
                className="block bg-white p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
                data-testid={`actor-signal-${signal.id}`}
              >
                <div className="flex items-start gap-4">
                  {/* Severity indicator */}
                  <div className={`w-2 h-2 rounded-full mt-2 ${severityConfig.dot}`} />
                  
                  {/* Signal type icon */}
                  <div className={`p-2 rounded-lg ${typeConfig.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Actor name */}
                      <span className="font-semibold text-gray-900">
                        {signal.actorSlug}
                      </span>
                      
                      {/* Actor type */}
                      <span className={`flex items-center gap-1 text-xs ${actorConfig.color}`}>
                        <ActorIcon className="w-3 h-3" />
                        {actorConfig.label}
                      </span>
                      
                      {/* Signal type */}
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeConfig.color}`}>
                        {typeConfig.label}
                      </span>
                      
                      {/* Deviation */}
                      {signal.deviation > 1 && (
                        <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                          {signal.deviation}×
                        </span>
                      )}
                      
                      {/* Severity */}
                      <span className={`px-2 py-0.5 rounded-full text-xs ${severityConfig.color}`}>
                        {severityConfig.label}
                      </span>
                    </div>
                    
                    {/* Interpretation */}
                    <p className="text-sm text-gray-600 mt-1">
                      {signal.interpretation}
                    </p>
                    
                    {/* Time */}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(signal.detectedAt).toLocaleString()}
                    </p>
                  </div>
                  
                  {/* Arrow */}
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Disclaimer */}
      <div className="text-center py-4">
        <p className="text-xs text-gray-400 italic">
          Signals reflect observed behavior deviations. Not trading advice or predictions.
        </p>
      </div>
    </div>
  );
}
