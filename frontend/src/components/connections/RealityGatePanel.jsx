/**
 * Reality Gate Panel Component
 * 
 * E2: Shows Reality Gate status and evaluation for an actor
 */

import React, { useState, useEffect } from 'react';
import { Shield, ShieldCheck, ShieldX, ShieldAlert, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

export default function RealityGatePanel({ actorId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actorId) return;
    
    const load = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/connections/reality-gate/actor/${actorId}`);
        if (res.data.ok) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load reality gate data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    load();
  }, [actorId]);

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-800/50 rounded-lg h-32" />
    );
  }

  if (!data || data.summary.total === 0) {
    return (
      <div className="bg-gray-800/80 rounded-lg border border-gray-700 p-4">
        <div className="flex items-center gap-2 text-gray-400">
          <Shield className="w-4 h-4" />
          <span className="text-sm">No Reality Gate data yet</span>
        </div>
      </div>
    );
  }

  const { summary, recent } = data;
  const confirmRate = Math.round(summary.confirmRate * 100);
  const contradictRate = Math.round(summary.contradictRate * 100);

  // Determine badge
  const getBadge = () => {
    if (contradictRate > 30) {
      return { label: 'Talking Book', color: '#EF4444', icon: ShieldX };
    }
    if (confirmRate > 70) {
      return { label: 'Talks & Acts', color: '#10B981', icon: ShieldCheck };
    }
    return { label: 'Mixed Record', color: '#F59E0B', icon: ShieldAlert };
  };

  const badge = getBadge();
  const BadgeIcon = badge.icon;

  return (
    <div className="bg-gray-800/80 rounded-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-white">Reality Gate</h3>
          </div>
          <span 
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full"
            style={{ 
              backgroundColor: `${badge.color}20`, 
              color: badge.color,
              border: `1px solid ${badge.color}40` 
            }}
          >
            <BadgeIcon className="w-3 h-3" />
            {badge.label}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-px bg-gray-700">
        <div className="bg-gray-800 p-3 text-center">
          <div className="text-2xl font-bold text-white">{summary.total}</div>
          <div className="text-xs text-gray-500">Events</div>
        </div>
        <div className="bg-gray-800 p-3 text-center">
          <div className="text-2xl font-bold text-emerald-400">{summary.confirmed}</div>
          <div className="text-xs text-gray-500">Confirmed</div>
        </div>
        <div className="bg-gray-800 p-3 text-center">
          <div className="text-2xl font-bold text-red-400">{summary.contradicted}</div>
          <div className="text-xs text-gray-500">Contradicted</div>
        </div>
        <div className="bg-gray-800 p-3 text-center">
          <div className="text-2xl font-bold text-amber-400">{summary.blocked}</div>
          <div className="text-xs text-gray-500">Blocked</div>
        </div>
      </div>

      {/* Rates bar */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
          <Activity className="w-3 h-3" />
          <span>Reality Score Distribution</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-emerald-500" 
            style={{ width: `${confirmRate}%` }}
            title={`${confirmRate}% Confirmed`}
          />
          <div 
            className="h-full bg-amber-500" 
            style={{ width: `${100 - confirmRate - contradictRate}%` }}
            title={`${100 - confirmRate - contradictRate}% No Data`}
          />
          <div 
            className="h-full bg-red-500" 
            style={{ width: `${contradictRate}%` }}
            title={`${contradictRate}% Contradicted`}
          />
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-gray-500">
          <span className="text-emerald-400">{confirmRate}% Confirmed</span>
          <span className="text-red-400">{contradictRate}% Contradicted</span>
        </div>
      </div>

      {/* Recent decisions */}
      {recent && recent.length > 0 && (
        <div className="border-t border-gray-700">
          <div className="p-3 text-xs text-gray-400">Recent Decisions</div>
          <div className="max-h-40 overflow-y-auto">
            {recent.map((entry, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between px-3 py-2 border-t border-gray-700/50 hover:bg-gray-700/30"
              >
                <div className="flex items-center gap-2">
                  {entry.onchain.verdict === 'CONFIRMED' && (
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                  )}
                  {entry.onchain.verdict === 'CONTRADICTED' && (
                    <TrendingDown className="w-3 h-3 text-red-400" />
                  )}
                  {entry.onchain.verdict === 'NO_DATA' && (
                    <Activity className="w-3 h-3 text-amber-400" />
                  )}
                  <span className="text-xs text-gray-300">{entry.eventId.slice(0, 20)}...</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    entry.decision === 'BLOCK' ? 'bg-red-500/20 text-red-400' :
                    entry.decision === 'SEND_HIGH' ? 'bg-emerald-500/20 text-emerald-400' :
                    entry.decision === 'SEND_LOW' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-gray-600/50 text-gray-300'
                  }`}>
                    {entry.decision}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {Math.round(entry.realityScore_0_1 * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
