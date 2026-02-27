import { Link } from 'react-router-dom';
import { Star, Bell, ArrowUpRight, Activity, Users, Crown } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  chainConfig,
  getEdgeScoreColor,
  getInfluenceRole,
  influenceRoleConfig,
  latencyColors,
  typeBadgeColors,
  actionColors,
} from './actorUtils';

export const ActorCard = ({ actor, isFollowed, onToggleFollow, showRealNames }) => {
  const chain = chainConfig[actor.primaryChain] || { color: 'bg-gray-500', label: actor.primaryChain };
  const edgeColor = getEdgeScoreColor(actor.edgeScore);
  
  const displayName = showRealNames ? actor.real_name : actor.strategy_name;
  const secondaryName = showRealNames ? actor.strategy_name : (actor.identity_confidence >= 0.8 ? actor.real_name : null);
  
  const influenceRole = getInfluenceRole(actor);
  const roleConfig = influenceRoleConfig[influenceRole];
  
  return (
    <div 
      className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-400 transition-all group h-full flex flex-col"
      data-testid={`actor-card-${actor.id}`}
    >
      <div className={`h-1 ${actor.edgeScore >= 75 ? 'bg-emerald-500' : actor.edgeScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
      
      <div className="p-4 flex flex-col flex-1">
        {/* Header with Edge Score badge + Influence Role */}
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
            <div>
              <div className="font-bold text-gray-900 text-sm">{displayName}</div>
              {secondaryName && (
                <div className="text-xs text-gray-400 truncate max-w-[140px]">{secondaryName}</div>
              )}
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${typeBadgeColors[actor.type]}`}>
                  {actor.type}
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">{actor.clusterSize} wallets</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`px-2 py-1 rounded-lg border text-sm font-bold ${edgeColor}`}>
                  {actor.edgeScore}
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 text-white max-w-xs">
                <p className="text-xs font-semibold mb-1">Edge Score: {actor.edgeScore}/100</p>
                <p className="text-xs text-gray-300">Timing (30%) + ROI Adjusted (25%) + Stability (20%) + Risk (15%) + Signals (10%)</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`px-1.5 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${roleConfig.bg} ${roleConfig.text}`}>
                  <span>{roleConfig.icon}</span>
                  <span>{influenceRole}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 text-white max-w-xs">
                <p className="text-xs font-semibold mb-1">Influence Role: {influenceRole}</p>
                <p className="text-xs text-gray-300">
                  {influenceRole === 'Leader' && 'This actor sets trends. Others follow their moves.'}
                  {influenceRole === 'Follower' && 'This actor reacts to others. Better for confirmation.'}
                  {influenceRole === 'Neutral' && 'Independent actor. No strong influence pattern.'}
                </p>
                {actor.influenceScore && (
                  <p className="text-xs text-gray-400 mt-1">Influence Score: {actor.influenceScore}</p>
                )}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Latency + Chain row */}
        <div className="flex items-center justify-between mb-3">
          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${latencyColors[actor.latency]}`}>
            {actor.latency}
          </span>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${chain.color}`} />
            <span className="text-xs text-gray-500">{chain.label}</span>
          </div>
        </div>

        {/* Last Action */}
        <div className="mb-3 p-2 bg-gray-50 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-gray-400" />
            <span className={`text-xs font-semibold ${actionColors[actor.lastAction.type]}`}>
              {actor.lastAction.type}
            </span>
            <span className="text-xs text-gray-900 font-medium">{actor.lastAction.token}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{actor.lastAction.size}</span>
            <span className="text-xs text-gray-400">{actor.lastAction.time}</span>
          </div>
        </div>

        {/* Core Metrics */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-0.5">PnL</div>
            <div className={`text-sm font-bold ${actor.pnl.startsWith('+') ? 'text-[#16C784]' : 'text-[#EF4444]'}`}>
              {actor.pnl}
            </div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-0.5">Win</div>
            <div className="text-sm font-bold text-gray-900">{actor.winRate}%</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-0.5">Risk</div>
            <div className={`text-sm font-bold ${
              actor.riskScore < 30 ? 'text-[#16C784]' : 
              actor.riskScore < 60 ? 'text-[#F5A524]' : 'text-[#EF4444]'
            }`}>
              {actor.riskScore}
            </div>
          </div>
        </div>

        {/* Strategy fingerprint */}
        <div className="flex flex-wrap gap-1 mb-3">
          {actor.strategies.slice(0, 3).map((strategy, i) => (
            <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">
              {strategy}
            </span>
          ))}
          {actor.strategies.length > 3 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded text-xs">
                  +{actor.strategies.length - 3}
                </span>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 text-white">
                <p className="text-xs">{actor.strategies.slice(3).join(', ')}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Behavior state */}
        <div className="flex items-center justify-between mb-3 text-xs">
          <div>
            <span className="text-gray-500">Current: </span>
            <span className="font-semibold text-gray-900">{actor.currentBehavior}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${chain.color}`} />
            <span className="text-gray-500">{chain.label}</span>
          </div>
        </div>

        {/* Signals indicator */}
        {actor.hasActiveSignals && (
          <div className="mb-3 flex items-center gap-2 text-xs">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-emerald-600 font-medium">{actor.signalsCount} active signals</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100 mt-auto">
          <Link 
            to={`/actors/${actor.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors"
            data-testid={`actor-view-link-${actor.id}`}
          >
            View Actor
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() => onToggleFollow(actor.id)}
            className={`p-2 rounded-xl transition-colors ${
              isFollowed 
                ? 'bg-amber-100 text-amber-600' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
            data-testid={`actor-follow-btn-${actor.id}`}
          >
            <Star className={`w-4 h-4 ${isFollowed ? 'fill-current' : ''}`} />
          </button>
          <Link
            to="/alerts"
            className="p-2 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <Bell className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ActorCard;
