/**
 * Shared Bot Farms View
 * 
 * Shows influencers connected by shared suspicious followers.
 */

import React, { useState, useEffect } from 'react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

function RiskBadge({ level }) {
  const colors = {
    CRITICAL: 'bg-red-800 text-red-200',
    HIGH: 'bg-orange-800 text-orange-200',
    MEDIUM: 'bg-yellow-800 text-yellow-200',
    LOW: 'bg-green-800 text-green-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[level] || 'bg-gray-700'}`}>
      {level}
    </span>
  );
}

function FarmCard({ farm }) {
  return (
    <div className={`p-4 rounded-lg border ${
      farm.riskLevel === 'CRITICAL' || farm.riskLevel === 'HIGH'
        ? 'bg-red-900/20 border-red-700'
        : 'bg-gray-800 border-gray-700'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="font-medium text-sm">{farm.farmId}</div>
          <div className="text-xs text-gray-400">{farm.sharedCount} shared followers</div>
        </div>
        <RiskBadge level={farm.riskLevel} />
      </div>

      <div className="space-y-2">
        {farm.influencers.map((inf, i) => (
          <div key={i} className="flex justify-between text-xs">
            <span className="text-gray-300">@{inf.handle || inf.actorId}</span>
            <span className="text-gray-400">{inf.percentOfTheirBots}% of their bots</span>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-2 border-t border-gray-700 text-xs text-gray-400">
        Risk Score: {farm.riskScore}/100
      </div>
    </div>
  );
}

export default function SharedFarmsView({ actorId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadFarms() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/connections/audience-quality/${actorId}/shared-farms`);
        const json = await res.json();
        if (json.ok) {
          setData(json.analysis);
        } else {
          setError(json.error || 'Failed to load');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadFarms();
  }, [actorId]);

  if (loading) {
    return <div className="text-gray-400 p-4">Analyzing shared farms...</div>;
  }

  if (error) {
    return <div className="text-red-400 p-4">Error: {error}</div>;
  }

  if (!data) {
    return <div className="text-gray-400 p-4">No data</div>;
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-gray-800 rounded p-3 text-center">
          <div className="text-2xl font-bold">{data.totalSharedBots}</div>
          <div className="text-xs text-gray-400">Shared Bots</div>
        </div>
        <div className="bg-gray-800 rounded p-3 text-center">
          <div className="text-2xl font-bold">{data.uniqueFarms}</div>
          <div className="text-xs text-gray-400">Farms</div>
        </div>
        <div className="bg-gray-800 rounded p-3 text-center">
          <div className={`text-2xl font-bold ${data.highRiskFarms > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {data.highRiskFarms}
          </div>
          <div className="text-xs text-gray-400">High Risk</div>
        </div>
        <div className="bg-gray-800 rounded p-3 text-center">
          <RiskBadge level={data.manipulationRisk} />
          <div className="text-xs text-gray-400 mt-1">Overall Risk</div>
        </div>
      </div>

      {/* Connected Influencers */}
      {data.connectedInfluencers.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-medium mb-3">
            Connected Influencers ({data.connectedInfluencers.length})
          </h3>
          <div className="space-y-2">
            {data.connectedInfluencers.slice(0, 5).map((inf, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-gray-300">@{inf.handle || inf.actorId}</span>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">{inf.sharedBots} shared bots</span>
                  <span className="text-xs text-gray-500">{inf.farmIds.length} farms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Farms List */}
      {data.farms.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3">Bot Farms ({data.farms.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.farms.slice(0, 4).map(farm => (
              <FarmCard key={farm.farmId} farm={farm} />
            ))}
          </div>
        </div>
      )}

      {data.farms.length === 0 && data.totalSharedBots === 0 && (
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 text-center">
          <div className="text-green-400 font-medium">No shared bot farms detected</div>
          <div className="text-xs text-gray-400 mt-1">
            This account doesn't share suspicious followers with other influencers
          </div>
        </div>
      )}
    </div>
  );
}
