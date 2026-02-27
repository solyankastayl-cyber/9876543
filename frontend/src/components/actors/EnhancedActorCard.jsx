/**
 * Enhanced Actor Card with Trust & Reputation (Phase 15)
 * 
 * Shows actor with trust score, reliability tier, and reputation metrics
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Bell, ArrowUpRight, Activity, Users, Crown, Shield } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";
import TrustBadge, { ReliabilityBadge } from '../TrustBadge';
import TrustExplanation from '../TrustExplanation';
import { AddressCountBadge } from '../KnownAddresses';
import { actorsApi } from '../../api';
import {
  chainConfig,
  getEdgeScoreColor,
  getInfluenceRole,
  influenceRoleConfig,
  latencyColors,
  typeBadgeColors,
  actionColors,
} from './actorUtils';

export const EnhancedActorCard = ({ actor, isFollowed, onToggleFollow, showRealNames }) => {
  const [reputation, setReputation] = useState(null);
  const [loading, setLoading] = useState(false);

  const chain = chainConfig[actor.primaryChain] || { color: 'bg-gray-500', label: actor.primaryChain };
  const edgeColor = getEdgeScoreColor(actor.edgeScore);
  
  const displayName = showRealNames ? actor.real_name : actor.strategy_name;
  const secondaryName = showRealNames ? actor.strategy_name : (actor.identity_confidence >= 0.8 ? actor.real_name : null);
  
  const influenceRole = getInfluenceRole(actor);
  const roleConfig = influenceRoleConfig[influenceRole];

  // Fetch actor reputation
  useEffect(() => {
    if (actor.address) {
      fetchReputation();
    }
  }, [actor.address]);

  const fetchReputation = async () => {
    setLoading(true);
    try {
      const response = await actorsApi.getActorReputation(actor.address);
      if (response.ok && response.data) {
        setReputation(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch actor reputation:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div 
      className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:border-teal-400 hover:shadow-lg transition-all group h-full flex flex-col"
      data-testid={`actor-card-${actor.id}`}
    >
      {/* Top bar with edge score gradient */}
      <div className={`h-1.5 ${actor.edgeScore >= 75 ? 'bg-emerald-500' : actor.edgeScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
      
      <div className="p-4 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden relative">
              {actor.avatar ? (
                <img src={actor.avatar} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <Users className="w-5 h-5 text-gray-400" />
              )}
              {influenceRole === 'Leader' && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                  <Crown className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <Link 
                to={`/actors/${actor.address || actor.id}`}
                className="font-bold text-gray-900 text-sm hover:text-teal-600 transition-colors block truncate"
              >
                {displayName}
              </Link>
              {secondaryName && (
                <div className="text-xs text-gray-400 truncate">{secondaryName}</div>
              )}
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${typeBadgeColors[actor.type]}`}>
                  {actor.type}
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">{actor.clusterSize} wallets</span>
              </div>
            </div>
          </div>
          
          {/* Edge Score */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`px-2 py-1 rounded-lg border text-sm font-bold ${edgeColor} flex-shrink-0`}>
                {actor.edgeScore}
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-900 text-white max-w-xs">
              <p className="text-xs font-semibold mb-1">Edge Score: {actor.edgeScore}/100</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Trust & Reputation Section (Phase 15) */}
        {loading && (
          <div className="mb-3 flex items-center gap-2 text-xs text-gray-400">
            <Shield className="w-3 h-3 animate-pulse" />
            <span>Loading trust data...</span>
          </div>
        )}

        {!loading && reputation && (
          <div className="mb-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs font-medium text-gray-700">Reputation</span>
              </div>
              <TrustExplanation type="actor" targetId={actor.address} />
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <TrustBadge score={reputation.trustScore} size="sm" />
              <ReliabilityBadge tier={reputation.reliabilityTier} />
            </div>
            
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Accuracy:</span>
                <span className="ml-1 font-semibold text-gray-900">
                  {Math.round(reputation.historicalAccuracy)}%
                </span>
              </div>
              <div>
                <span className="text-gray-500">Signals:</span>
                <span className="ml-1 font-semibold text-gray-900">
                  {reputation.totalSignals}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Attribution Badge */}
        <div className="mb-2">
          <AddressCountBadge subjectType="actor" subjectId={actor.id} />
        </div>

        {/* Strategies */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {actor.strategies.slice(0, 3).map((strategy, idx) => (
              <span key={idx} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-lg font-medium">
                {strategy}
              </span>
            ))}
            {actor.strategies.length > 3 && (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg">
                +{actor.strategies.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2 text-xs mb-3">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-gray-500">Win Rate</div>
            <div className="font-bold text-gray-900">{actor.winRate}%</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-gray-500">PnL</div>
            <div className={`font-bold ${actor.pnl.startsWith('+') ? 'text-emerald-600' : 'text-red-600'}`}>
              {actor.pnl}
            </div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-gray-500">Latency</div>
            <div className={`font-bold text-xs px-1.5 py-0.5 rounded inline-block ${latencyColors[actor.latency]}`}>
              {actor.latency}
            </div>
          </div>
        </div>

        {/* Tokens */}
        <div className="mb-3">
          <div className="text-xs text-gray-500 mb-1">Active Tokens</div>
          <div className="flex flex-wrap gap-1">
            {actor.tokens.slice(0, 4).map((token, idx) => (
              <span key={idx} className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded font-mono">
                {token}
              </span>
            ))}
            {actor.tokens.length > 4 && (
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                +{actor.tokens.length - 4}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                onToggleFollow(actor.id);
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                isFollowed
                  ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
              title={isFollowed ? 'Unfollow' : 'Follow'}
            >
              <Star className={`w-4 h-4 ${isFollowed ? 'fill-current' : ''}`} />
            </button>
            
            <button
              className="p-1.5 rounded-lg bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors"
              title="Set alert"
            >
              <Bell className="w-4 h-4" />
            </button>
          </div>

          <Link
            to={`/actors/${actor.address || actor.id}`}
            className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700"
          >
            View Profile
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EnhancedActorCard;
