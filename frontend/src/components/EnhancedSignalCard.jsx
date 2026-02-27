/**
 * Enhanced Signal Card with Trust Integration
 * 
 * Reference implementation showing snapshot-first + trust approach
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bell, MoreVertical, Volume2, VolumeX, Repeat, Trash2,
  Zap, Activity, Clock, Shield
} from 'lucide-react';
import { signalsApi } from '../api';
import TrustBadge from './TrustBadge';
import TrustExplanation from './TrustExplanation';
import RegimeContext from './RegimeContext';

export const EnhancedSignalCard = ({ signal, onRemove, onOpenAlerts, onUserAction }) => {
  const [trustData, setTrustData] = useState(null);
  const [regime, setRegime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [isMuted, setIsMuted] = useState(signal.muted || false);

  // Fetch trust data on mount (snapshot-first)
  useEffect(() => {
    if (signal._id) {
      fetchEnhancedData();
    }
  }, [signal._id]);

  const fetchEnhancedData = async () => {
    setLoading(true);
    try {
      // Parallel fetch: trust + regime
      const [trustResponse, regimeResponse] = await Promise.all([
        signalsApi.getSignalTrust(signal._id),
        signal.assetAddress ? 
          fetch(`${process.env.REACT_APP_BACKEND_URL}/api/market-regimes/current/${signal.assetAddress}`)
            .then(r => r.json()) 
          : Promise.resolve({ ok: false })
      ]);

      if (trustResponse.ok) {
        setTrustData(trustResponse.data);
      }

      if (regimeResponse.ok) {
        setRegime(regimeResponse.data);
      }
    } catch (error) {
      console.error('Failed to fetch enhanced data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate lifecycle from timestamp
  const getLifecycle = () => {
    const ageHours = (Date.now() - new Date(signal.timestamp).getTime()) / (1000 * 60 * 60);
    if (ageHours < 6) return 'new';
    if (ageHours < 48) return 'active';
    if (ageHours < 168) return 'cooling';
    return 'archived';
  };

  const lifecycle = getLifecycle();

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'border-l-red-600 bg-red-50';
      case 'high': return 'border-l-orange-600 bg-orange-50';
      case 'medium': return 'border-l-yellow-600 bg-yellow-50';
      case 'low': return 'border-l-blue-600 bg-blue-50';
      default: return 'border-l-gray-600 bg-gray-50';
    }
  };

  return (
    <div
      className={`p-4 rounded-lg border-2 border-l-4 ${getSeverityColor(signal.severity)} hover:shadow-lg transition-all ${isMuted ? 'opacity-50' : ''}`}
      data-testid={`signal-card-${signal._id}`}
    >
      {/* Header: Label + Trust + Lifecycle */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Signal Type */}
          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
            signal.severity === 'critical' ? 'bg-red-600 text-white' :
            signal.severity === 'high' ? 'bg-orange-600 text-white' :
            'bg-gray-600 text-white'
          }`}>
            {signal.signalType || 'Signal'}
          </span>
          
          {/* Lifecycle Badge */}
          <span className={`px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 ${
            lifecycle === 'new' ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' :
            lifecycle === 'active' ? 'bg-blue-100 text-blue-700 border border-blue-300' :
            lifecycle === 'cooling' ? 'bg-gray-200 text-gray-600 border border-gray-400' :
            'bg-gray-100 text-gray-400 border border-gray-300'
          }`}>
            {lifecycle === 'new' && <Zap className="w-3 h-3" />}
            {lifecycle === 'active' && <Activity className="w-3 h-3" />}
            {lifecycle === 'cooling' && <Clock className="w-3 h-3" />}
            {lifecycle}
          </span>

          {/* Trust Badge (Phase 15) */}
          {trustData && (
            <div className="flex items-center gap-1">
              <TrustBadge score={trustData.trustScore} size="sm" />
              <TrustExplanation type="signal" targetId={signal._id} />
            </div>
          )}

          {/* Loading trust */}
          {loading && !trustData && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Shield className="w-3 h-3 animate-pulse" />
              <span>...</span>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1 relative">
          <button 
            onClick={() => onOpenAlerts(signal)} 
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
            title="Configure alerts"
          >
            <Bell className="w-4 h-4" />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowActionsMenu(!showActionsMenu)} 
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {showActionsMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={() => {
                    setIsMuted(!isMuted);
                    onUserAction?.({ action: 'mute', itemId: signal._id, value: !isMuted });
                    setShowActionsMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  {isMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  {isMuted ? 'Unmute Signal' : 'Mute Signal'}
                </button>
                <button
                  onClick={() => {
                    onUserAction?.({ action: 'track', itemId: signal._id });
                    setShowActionsMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  <Repeat className="w-3.5 h-3.5" />
                  Track Similar
                </button>
                <button
                  onClick={() => {
                    onRemove(signal._id);
                    setShowActionsMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-red-50 flex items-center gap-2 text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Signal Details */}
      <div className="space-y-2">
        {/* From Address */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">From:</span>
          <Link
            to={`/actors/${signal.fromAddress}`}
            className="text-sm font-mono text-blue-600 hover:text-blue-800 hover:underline"
          >
            {signal.fromAddress?.slice(0, 8)}...{signal.fromAddress?.slice(-6)}
          </Link>
        </div>

        {/* Asset + Amount */}
        {signal.assetAddress && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Asset:</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {signal.amount?.toLocaleString()} tokens
              </span>
              <span className="text-xs text-gray-400 font-mono">
                {signal.assetAddress?.slice(0, 6)}...
              </span>
            </div>
          </div>
        )}

        {/* Market Context (Phase 15) */}
        {regime && (
          <div className="pt-2 border-t border-gray-200">
            <RegimeContext 
              regime={regime.regime} 
              performanceInRegime={trustData?.context?.performance}
              className="w-full"
            />
          </div>
        )}

        {/* Trust Explanation Summary (if available) */}
        {trustData && trustData.explanation && (
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-600 italic">
              {trustData.explanation}
            </p>
          </div>
        )}

        {/* Timestamp */}
        <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
          <span>{new Date(signal.timestamp).toLocaleString()}</span>
          <span>{Math.round((Date.now() - new Date(signal.timestamp).getTime()) / (1000 * 60 * 60))}h ago</span>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSignalCard;
