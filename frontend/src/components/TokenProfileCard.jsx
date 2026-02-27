/**
 * Token Profile Card - Displays aggregated token data from the API
 */
import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, TrendingDown, Activity, Shield, Zap, Users, AlertCircle } from 'lucide-react';
import { resolverApi } from '../api';

export default function TokenProfileCard({ address, onClose }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!address) return;
    
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await resolverApi.getTokenProfile(address);
        
        if (response.ok && response.data) {
          setProfile(response.data);
        } else {
          setError(response.error || 'Failed to load profile');
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
        setError('Failed to load token profile');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [address]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="text-gray-400">Loading token profile...</span>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 text-amber-400">
          <AlertCircle className="w-6 h-6" />
          <div>
            <div className="font-semibold">No data available</div>
            <div className="text-sm text-gray-400 mt-1">
              {error || 'This token has no recorded activity in our database yet.'}
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-white/5 rounded-lg">
          <div className="text-xs text-gray-400 font-mono break-all">{address}</div>
        </div>
      </div>
    );
  }

  const { price, metrics, regime, signals, trust, topActors } = profile;

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl font-bold font-mono">{address.slice(0, 8)}...{address.slice(-6)}</span>
            {regime.current && (
              <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                regime.current === 'bullish' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                regime.current === 'bearish' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                'bg-gray-500/20 text-gray-400 border border-gray-500/30'
              }`}>
                {regime.current} ({regime.confidence ? `${Math.round(regime.confidence * 100)}%` : 'N/A'})
              </span>
            )}
          </div>
          
          {price.available && (
            <div className="flex items-center gap-4 text-sm text-gray-700">
              <span className="text-2xl font-bold text-white">
                ${price.current?.toLocaleString() || 'N/A'}
              </span>
              {price.change24h !== null && (
                <span className={`flex items-center gap-1 ${price.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {price.change24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {Math.abs(price.change24h).toFixed(2)}% (24h)
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <MetricCard
          icon={Activity}
          label="Volatility"
          value={metrics.volatility !== null ? `${(metrics.volatility * 100).toFixed(1)}%` : 'N/A'}
          available={metrics.available}
        />
        <MetricCard
          icon={TrendingUp}
          label="Trend"
          value={metrics.trend || 'N/A'}
          available={metrics.available}
        />
        <MetricCard
          icon={Zap}
          label="Signals (24h)"
          value={signals.last24h}
          available={signals.available}
        />
        <MetricCard
          icon={Shield}
          label="Trust Score"
          value={trust.avgScore !== null ? `${Math.round(trust.avgScore)}%` : 'N/A'}
          available={trust.available}
        />
      </div>

      {/* Signals by Type */}
      {signals.available && Object.keys(signals.byType).length > 0 && (
        <div className="mb-4 p-3 bg-white/5 rounded-xl">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Signal Distribution</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(signals.byType).map(([type, count]) => (
              <span key={type} className="px-2 py-1 bg-white/10 rounded text-xs">
                {type}: <span className="font-bold">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Top Actors */}
      {topActors.length > 0 && (
        <div className="p-3 bg-white/5 rounded-xl">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Users className="w-3 h-3" />
            Top Actors
          </div>
          <div className="space-y-2">
            {topActors.slice(0, 3).map((actor, i) => (
              <div key={actor.address} className="flex items-center justify-between text-sm">
                <span className="font-mono text-gray-700">
                  {actor.address.slice(0, 8)}...{actor.address.slice(-4)}
                </span>
                <span className="text-gray-400">{actor.signalCount} signals</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Data State */}
      {!price.available && !metrics.available && !signals.available && (
        <div className="p-4 bg-white/5 rounded-xl text-center">
          <div className="text-gray-400 text-sm">
            No historical data available for this token yet.
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Data will appear once signals are detected for this token.
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, available }) {
  return (
    <div className={`p-3 rounded-xl ${available ? 'bg-white/10' : 'bg-white/5 opacity-50'}`}>
      <div className="flex items-center gap-1.5 text-gray-400 mb-1">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs">{label}</span>
      </div>
      <div className="font-bold text-white">{value}</div>
    </div>
  );
}
