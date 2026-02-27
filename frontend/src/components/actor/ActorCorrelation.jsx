import React from 'react';
import { Link } from 'react-router-dom';
import { GitBranch, Link2, Zap, Users, TrendingUp, Activity, ArrowUpRight, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";

const ActorCorrelation = ({ correlation, influenceScore, showRealNames }) => {
  if (!correlation) return null;

  return (
    <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-violet-600" />
          <h2 className="text-lg font-bold text-gray-900">Correlation & Influence</h2>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="p-1 hover:bg-violet-100 rounded"><Info className="w-4 h-4 text-violet-400" /></button>
          </TooltipTrigger>
          <TooltipContent className="bg-gray-900 text-white max-w-xs">
            <p className="text-xs">Behavioral patterns and timing relationships with other actors. Use to find earlier signals or avoid crowded trades.</p>
            <p className="text-xs text-gray-400 mt-1">Note: Behavioral correlation, not causal truth.</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Influence Summary */}
      {correlation.influenceSummary && (
        <div className={`mb-4 p-4 rounded-xl border-2 ${
          correlation.influenceSummary.strength === 'very high' ? 'bg-emerald-50 border-emerald-300' :
          correlation.influenceSummary.strength === 'high' ? 'bg-green-50 border-green-200' :
          correlation.influenceSummary.strength === 'medium' ? 'bg-amber-50 border-amber-200' :
          'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${
              correlation.influenceSummary.strength === 'very high' ? 'bg-emerald-100' :
              correlation.influenceSummary.strength === 'high' ? 'bg-green-100' :
              correlation.influenceSummary.strength === 'medium' ? 'bg-amber-100' :
              'bg-red-100'
            }`}>
              {correlation.influenceSummary.role.includes('Leader') ? (
                <TrendingUp className={`w-5 h-5 ${
                  correlation.influenceSummary.strength === 'very high' ? 'text-emerald-600' :
                  correlation.influenceSummary.strength === 'high' ? 'text-green-600' : 'text-amber-600'
                }`} />
              ) : correlation.influenceSummary.role.includes('Follower') ? (
                <Users className="w-5 h-5 text-blue-600" />
              ) : (
                <Activity className="w-5 h-5 text-gray-600" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-sm font-bold ${
                  correlation.influenceSummary.strength === 'very high' ? 'text-emerald-700' :
                  correlation.influenceSummary.strength === 'high' ? 'text-green-700' :
                  correlation.influenceSummary.strength === 'medium' ? 'text-amber-700' :
                  'text-red-700'
                }`}>
                  {correlation.influenceSummary.role}
                </span>
                <span className="text-xs text-gray-500">in {correlation.influenceSummary.ecosystem}</span>
              </div>
              <p className="text-sm text-gray-700 mb-2">{correlation.influenceSummary.recommendation}</p>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>Avg follower lag: <span className="font-medium text-gray-700">{correlation.influenceSummary.avgLag}</span></span>
                {influenceScore && (
                  <span className="px-2 py-0.5 bg-white rounded-full border">
                    Influence Score: <span className="font-bold text-violet-600">{influenceScore}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Strategy Cluster */}
      {correlation.cluster && (
        <div className="mb-4 p-3 bg-violet-100 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-violet-600 font-medium">Strategy Cluster</span>
              <div className="font-bold text-gray-900">{correlation.cluster.name}</div>
              {correlation.cluster.dominantStrategy && (
                <div className="text-xs text-gray-500 mt-0.5">Dominant: {correlation.cluster.dominantStrategy}</div>
              )}
            </div>
            <div className="text-right">
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                correlation.cluster.phase === 'Accumulating' ? 'bg-emerald-100 text-emerald-700' :
                correlation.cluster.phase === 'Distributing' ? 'bg-red-100 text-red-700' :
                correlation.cluster.phase === 'Rotating' ? 'bg-amber-100 text-amber-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {correlation.cluster.phase}
              </span>
              <div className="text-xs text-gray-500 mt-1">{correlation.cluster.size} actors in cluster</div>
            </div>
          </div>
        </div>
      )}

      {/* Moves With */}
      {correlation.movesWith && correlation.movesWith.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <Link2 className="w-3.5 h-3.5" />
            Moves With (Similar Behavior)
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3 h-3 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 text-white max-w-xs">
                <p className="text-xs">Behavioral similarity, not copying. These actors show correlated patterns without clear leader/follower relationship.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="space-y-2">
            {correlation.movesWith.map((related, i) => (
              <Link 
                key={i} 
                to={`/actors/${related.id}`}
                className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-violet-100 hover:border-violet-300 transition-colors"
              >
                <div>
                  <div className="font-medium text-gray-900 text-sm">{showRealNames ? related.real_name || related.strategy_name : related.strategy_name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">{related.overlap}</span>
                    {related.overlapType && (
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        related.overlapType === 'timing' ? 'bg-blue-100 text-blue-600' :
                        related.overlapType === 'token' ? 'bg-purple-100 text-purple-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {related.overlapType}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-sm font-bold text-violet-600">{related.similarity}%</div>
                    <div className="text-xs text-gray-400">similarity</div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Front-Runners */}
      {correlation.frontRunners && correlation.frontRunners.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Often Front-Runs This Actor
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3 h-3 text-amber-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 text-white max-w-xs">
                <p className="text-xs font-medium text-amber-300 mb-1">⚠️ This actor often front-runs you</p>
                <p className="text-xs">These actors typically move BEFORE this one enters. Consider following them for earlier signals.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="space-y-2">
            {correlation.frontRunners.map((runner, i) => (
              <Link 
                key={i} 
                to={`/actors/${runner.id}`}
                className="flex items-center justify-between p-2.5 bg-amber-50 rounded-xl border border-amber-200 hover:border-amber-400 transition-colors"
              >
                <div>
                  <div className="font-medium text-gray-900 text-sm">{showRealNames ? runner.real_name || runner.strategy_name : runner.strategy_name}</div>
                  <div className="text-xs text-amber-700">Leads by {runner.avgLeadTime}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-medium text-amber-600">{runner.frequency} of trades</div>
                    {runner.tradesMatched && (
                      <div className="text-xs text-gray-400">{runner.tradesMatched} matches</div>
                    )}
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-amber-500" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Followed By */}
      {correlation.followedBy && correlation.followedBy.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-blue-500" />
            This Actor is Often Followed By
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3 h-3 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 text-white max-w-xs">
                <p className="text-xs">These actors typically follow this actor's moves. Indicates influence in the market.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="space-y-2">
            {correlation.followedBy.map((follower, i) => (
              <Link 
                key={i} 
                to={`/actors/${follower.id}`}
                className="flex items-center justify-between p-2.5 bg-blue-50 rounded-xl border border-blue-100 hover:border-blue-300 transition-colors"
              >
                <div>
                  <div className="font-medium text-gray-900 text-sm">{showRealNames ? follower.real_name || follower.strategy_name : follower.strategy_name}</div>
                  <div className="text-xs text-blue-600">Lags by {follower.avgLagTime}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-medium text-blue-600">{follower.frequency} of trades</div>
                    {follower.tradesMatched && (
                      <div className="text-xs text-gray-400">{follower.tradesMatched} matches</div>
                    )}
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-blue-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* No correlation data */}
      {(!correlation.movesWith || correlation.movesWith.length === 0) && 
       (!correlation.frontRunners || correlation.frontRunners.length === 0) && 
       (!correlation.followedBy || correlation.followedBy.length === 0) && (
        <div className="text-center py-4 text-sm text-gray-500">
          No significant correlations detected
        </div>
      )}
    </div>
  );
};

export default ActorCorrelation;
