/**
 * Actor Details Modal
 * 
 * Shows detailed information about an actor when clicked in Farm Network Graph
 */

import React from 'react';
import { X, AlertTriangle, Shield, Users, Bot, Activity, ExternalLink, Skull, TrendingDown, Link2 } from 'lucide-react';

const riskColors = {
  LOW: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', border: 'border-green-500' },
  MEDIUM: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-500' },
  HIGH: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-500' },
  CRITICAL: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-500' }
};

export default function ActorDetailsModal({ isOpen, onClose, actor, loading, onActorClick }) {
  if (!isOpen) return null;

  const riskStyle = actor ? riskColors[actor.riskLevel] || riskColors.LOW : riskColors.LOW;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" data-testid="actor-details-modal">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        data-testid="modal-backdrop"
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-5 border-b border-gray-200 dark:border-gray-700 ${riskStyle.bg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${riskStyle.bg} border-2 ${riskStyle.border}`}>
                <Skull className={`w-6 h-6 ${riskStyle.text}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white" data-testid="actor-name">
                    @{actor?.actorId || 'Loading...'}
                  </h2>
                  {actor && (
                    <a
                      href={`https://twitter.com/${actor.actorId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-full transition-colors"
                      data-testid="twitter-profile-link"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Twitter
                    </a>
                  )}
                </div>
                {actor && (
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${riskStyle.bg} ${riskStyle.text}`} data-testid="risk-level">
                    {actor.riskLevel} RISK
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
              data-testid="close-modal-btn"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[calc(85vh-80px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
            </div>
          ) : actor ? (
            <div className="space-y-5">
              {/* Summary */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <p className="text-gray-700 dark:text-gray-300" data-testid="actor-summary">
                  {actor.summary}
                </p>
              </div>

              {/* Audience Quality */}
              {actor.audienceQuality && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Audience Quality</h3>
                    <span className={`ml-auto px-2 py-0.5 rounded text-sm font-medium ${
                      actor.audienceQuality.level === 'ELITE' ? 'bg-green-100 text-green-700' :
                      actor.audienceQuality.level === 'GOOD' ? 'bg-blue-100 text-blue-700' :
                      actor.audienceQuality.level === 'AVERAGE' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      AQI: {actor.audienceQuality.aqi}/100
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <MetricCard 
                      icon={<Activity className="w-4 h-4 text-green-500" />}
                      label="Human"
                      value={`${actor.audienceQuality.pctHuman}%`}
                      color="green"
                    />
                    <MetricCard 
                      icon={<Bot className="w-4 h-4 text-red-500" />}
                      label="Bots"
                      value={`${actor.audienceQuality.pctBot}%`}
                      color="red"
                    />
                    <MetricCard 
                      icon={<AlertTriangle className="w-4 h-4 text-orange-500" />}
                      label="Suspicious"
                      value={`${actor.audienceQuality.pctSuspicious}%`}
                      color="orange"
                    />
                    <MetricCard 
                      icon={<TrendingDown className="w-4 h-4 text-gray-500" />}
                      label="Dormant"
                      value={`${actor.audienceQuality.pctDormant}%`}
                      color="gray"
                    />
                  </div>

                  <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                    Total Followers: {actor.audienceQuality.totalFollowers?.toLocaleString() || 'N/A'}
                  </div>

                  {actor.audienceQuality.reasons?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Analysis Notes:</div>
                      <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                        {actor.audienceQuality.reasons.map((reason, i) => (
                          <li key={i}>• {reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Authenticity Score */}
              {actor.authenticity && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-purple-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Authenticity Score</h3>
                    <span className={`ml-auto px-2 py-0.5 rounded text-sm font-medium ${
                      actor.authenticity.label === 'ORGANIC' ? 'bg-green-100 text-green-700' :
                      actor.authenticity.label === 'MIXED' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {actor.authenticity.score}/100 ({actor.authenticity.label})
                    </span>
                  </div>

                  {actor.authenticity.breakdown && (
                    <div className="space-y-2">
                      <ProgressBar 
                        label="Real Follower Ratio" 
                        value={actor.authenticity.breakdown.realFollowerRatio} 
                      />
                      <ProgressBar 
                        label="Audience Quality" 
                        value={actor.authenticity.breakdown.audienceQuality} 
                      />
                      <ProgressBar 
                        label="Network Integrity" 
                        value={actor.authenticity.breakdown.networkIntegrity} 
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Farm Connections */}
              {actor.farmConnections?.length > 0 && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Link2 className="w-5 h-5 text-orange-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Shared Farm Connections</h3>
                    <span className="ml-auto text-sm text-gray-500">{actor.farmConnections.length} connections</span>
                  </div>

                  <div className="space-y-2">
                    {actor.farmConnections.map((conn, i) => (
                      <div 
                        key={i} 
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        data-testid={`connection-${conn.connectedActor}`}
                      >
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onActorClick && onActorClick(conn.connectedActor)}
                            className="font-medium text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 hover:underline transition-colors"
                          >
                            @{conn.connectedActor}
                          </button>
                          <a
                            href={`https://twitter.com/${conn.connectedActor}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                            onClick={(e) => e.stopPropagation()}
                            title={`View @${conn.connectedActor} on Twitter`}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-500">{conn.sharedSuspects} shared</span>
                          <span className={`px-2 py-0.5 rounded font-medium ${
                            conn.overlapScore >= 0.7 ? 'bg-red-100 text-red-700' :
                            conn.overlapScore >= 0.5 ? 'bg-orange-100 text-orange-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {(conn.overlapScore * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bot Farms */}
              {actor.botFarms?.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Skull className="w-5 h-5 text-red-500" />
                    <h3 className="font-semibold text-red-700 dark:text-red-400">Detected Bot Farms</h3>
                  </div>

                  <div className="space-y-3">
                    {actor.botFarms.map((farm, i) => (
                      <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono text-gray-500">{farm.farmId}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            farm.confidence > 0.8 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {(farm.confidence * 100).toFixed(0)}% confidence
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          <span className="text-red-600 dark:text-red-400 font-medium">{(farm.botRatio * 100).toFixed(0)}%</span> bot ratio
                          <span className="mx-2">•</span>
                          <span>{farm.sharedFollowers} shared followers</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {farm.actorIds.map((id, j) => (
                            <div key={j} className="inline-flex items-center gap-1">
                              <span 
                                className={`text-xs px-2 py-0.5 rounded cursor-pointer transition-colors ${
                                  id === actor.actorId 
                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' 
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (id !== actor.actorId && onActorClick) {
                                    onActorClick(id);
                                  }
                                }}
                              >
                                @{id}
                              </span>
                              <a
                                href={`https://twitter.com/${id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-600"
                                onClick={(e) => e.stopPropagation()}
                                title={`View @${id} on Twitter`}
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No data state */}
              {!actor.audienceQuality && !actor.authenticity && actor.farmConnections?.length === 0 && actor.botFarms?.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
                  <p>No detailed data available for this actor yet.</p>
                  <p className="text-sm mt-1">Data will appear after analysis is complete.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No actor data available
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              data-testid="close-btn"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, color }) {
  const colorClasses = {
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
    gray: 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
  };

  return (
    <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center gap-1 mb-1">
        {icon}
        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      <div className="text-lg font-semibold text-gray-900 dark:text-white">{value}</div>
    </div>
  );
}

function ProgressBar({ label, value }) {
  const getColor = (v) => {
    if (v >= 70) return 'bg-green-500';
    if (v >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-medium text-gray-900 dark:text-white">{value}%</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor(value)} transition-all duration-300`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
