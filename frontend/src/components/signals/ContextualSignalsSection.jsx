/**
 * Contextual Signals Section (P3.4)
 * 
 * Displays aggregated signal contexts
 * 
 * Philosophy:
 * - One signal = noise
 * - Multiple synchronous signals = event
 * - Shows "what's happening together"
 * - NO Buy/Sell predictions
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Layers, TrendingUp, ArrowRightLeft, Users, Building,
  AlertTriangle, RefreshCw, Loader2, ChevronRight, Info,
  Filter, Clock, Zap
} from 'lucide-react';
import { api } from '../../api/client';

const WINDOW_OPTIONS = [
  { value: '', label: 'All Windows' },
  { value: '1h', label: '1 Hour' },
  { value: '6h', label: '6 Hours' },
  { value: '24h', label: '24 Hours' },
];

const PRIMARY_SIGNAL_CONFIG = {
  actor_flow_deviation: { 
    icon: TrendingUp, 
    label: 'Actor Flow Deviation',
    color: 'text-blue-600 bg-blue-50' 
  },
  corridor_volume_spike: { 
    icon: ArrowRightLeft, 
    label: 'Corridor Spike',
    color: 'text-purple-600 bg-purple-50' 
  },
  behavior_regime_shift: { 
    icon: Layers, 
    label: 'Regime Shift',
    color: 'text-rose-600 bg-rose-50' 
  },
  token_flow_deviation: { 
    icon: Zap, 
    label: 'Token Flow',
    color: 'text-amber-600 bg-amber-50' 
  },
  cluster_participation: { 
    icon: Users, 
    label: 'Cluster Change',
    color: 'text-emerald-600 bg-emerald-50' 
  },
  market_narrative: { 
    icon: Building, 
    label: 'Market Narrative',
    color: 'text-gray-600 bg-gray-50' 
  },
};

function OverlapBadge({ score }) {
  const getColor = () => {
    if (score >= 5) return 'bg-red-100 text-red-700 border-red-200';
    if (score >= 4) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };
  
  return (
    <span className={`px-2 py-0.5 text-xs font-bold rounded border ${getColor()}`}>
      {score} signals
    </span>
  );
}

export default function ContextualSignalsSection() {
  const [contexts, setContexts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [windowFilter, setWindowFilter] = useState('');

  const fetchContexts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (windowFilter) params.append('window', windowFilter);
      params.append('limit', '30');
      
      const [contextsRes, statsRes] = await Promise.all([
        api.get(`/api/signals/context?${params.toString()}`),
        api.get('/api/signals/context/stats'),
      ]);
      
      if (contextsRes.data.ok) {
        setContexts(contextsRes.data.data.contexts || []);
      }
      if (statsRes.data.ok) {
        setStats(statsRes.data.data);
      }
    } catch (err) {
      setError('Failed to load signal contexts');
      console.error('Context fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContexts();
  }, [windowFilter]);

  return (
    <div className="space-y-6" data-testid="contextual-signals-section">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-500" />
            Contextual Signals
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Multiple related signals detected together. Not predictions.
          </p>
        </div>
        
        <button
          onClick={fetchContexts}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          disabled={loading}
        >
          <RefreshCw className={`w-5 h-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100">
            <div className="text-2xl font-bold text-gray-900">{stats.totalActive}</div>
            <div className="text-xs text-gray-500">Active Contexts</div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-gray-100">
            <div className="text-2xl font-bold text-purple-600">{stats.avgOverlapScore}</div>
            <div className="text-xs text-gray-500">Avg Overlap Score</div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-gray-100">
            <div className="text-2xl font-bold text-blue-600">{stats.byWindow?.['24h'] || 0}</div>
            <div className="text-xs text-gray-500">24h Contexts</div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-gray-100">
            <div className="text-2xl font-bold text-gray-600">{stats.byWindow?.['6h'] || 0}</div>
            <div className="text-xs text-gray-500">6h Contexts</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={windowFilter}
            onChange={(e) => setWindowFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
          >
            {WINDOW_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Context List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-gray-500">{error}</p>
        </div>
      ) : contexts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Layers className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-gray-600 font-medium">No contextual signals</p>
          <p className="text-sm text-gray-400 mt-1">
            Contexts appear when multiple signals overlap
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {contexts.map((context) => {
            const primaryConfig = PRIMARY_SIGNAL_CONFIG[context.primarySignal?.type] || 
              PRIMARY_SIGNAL_CONFIG.actor_flow_deviation;
            const PrimaryIcon = primaryConfig.icon;
            
            return (
              <div
                key={context.id}
                className="bg-white p-5 rounded-xl border border-gray-100 hover:border-purple-200 hover:shadow-sm transition-all"
                data-testid={`context-${context.id}`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* Primary signal icon */}
                    <div className={`p-2.5 rounded-lg ${primaryConfig.color}`}>
                      <PrimaryIcon className="w-5 h-5" />
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">
                          {primaryConfig.label}
                        </span>
                        <OverlapBadge score={context.overlapScore} />
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {context.window}
                        </span>
                      </div>
                      
                      {/* Primary source */}
                      <Link 
                        to={`/actors/${context.primarySignal?.sourceId}`}
                        className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                      >
                        {context.primarySignal?.sourceId}
                      </Link>
                    </div>
                  </div>
                  
                  {/* Severity from primary */}
                  {context.primarySignal?.severity && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      context.primarySignal.severity === 'high' 
                        ? 'bg-red-100 text-red-700'
                        : context.primarySignal.severity === 'medium'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {context.primarySignal.severity}
                    </span>
                  )}
                </div>
                
                {/* Summary */}
                <p className="text-sm text-gray-600 mb-3">
                  {context.summary}
                </p>
                
                {/* Narrative hint if present */}
                {context.narrativeHint && (
                  <div className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg mb-3">
                    <Info className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-purple-700">{context.narrativeHint}</p>
                  </div>
                )}
                
                {/* Related chips */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {/* Involved actors */}
                  {context.involvedActors?.slice(0, 5).map((actor) => (
                    <Link
                      key={actor}
                      to={`/actors/${actor}`}
                      className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium hover:bg-blue-100 transition-colors flex items-center gap-1"
                    >
                      <Users className="w-3 h-3" />
                      {actor}
                    </Link>
                  ))}
                  
                  {/* Affected assets */}
                  {context.affectedAssets?.slice(0, 3).map((asset) => (
                    <span
                      key={asset}
                      className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs font-medium"
                    >
                      {asset}
                    </span>
                  ))}
                  
                  {/* Related signal counts */}
                  {context.relatedSignals?.actorCount > 0 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      +{context.relatedSignals.actorCount} actors
                    </span>
                  )}
                  {context.relatedSignals?.corridorCount > 0 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      +{context.relatedSignals.corridorCount} corridors
                    </span>
                  )}
                </div>
                
                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{new Date(context.detectedAt).toLocaleString()}</span>
                  <Link
                    to={`/actors/${context.primarySignal?.sourceId}`}
                    className="flex items-center gap-1 text-purple-600 hover:text-purple-800"
                  >
                    View actor <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Disclaimer */}
      <div className="text-center py-4">
        <p className="text-xs text-gray-400 italic">
          Contextual signals show related deviations. Not predictions or recommendations.
        </p>
      </div>
    </div>
  );
}
