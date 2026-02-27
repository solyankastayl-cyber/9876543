/**
 * BLOCK 50 — Snapshot Timeline
 * English: titles, metric names
 * Russian: only in tooltips
 */

import React from 'react';
import { Activity, Clock, CheckCircle, AlertCircle, History } from 'lucide-react';
import { InfoTooltip, FRACTAL_TOOLTIPS } from './InfoTooltip';

const healthColors = {
  HEALTHY: { bg: 'bg-green-500', light: 'bg-green-100' },
  WATCH: { bg: 'bg-amber-500', light: 'bg-amber-100' },
  ALERT: { bg: 'bg-orange-500', light: 'bg-orange-100' },
  CRITICAL: { bg: 'bg-red-500', light: 'bg-red-100' },
};

const actionColors = {
  APPLIED: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle },
  TRIGGERED: { bg: 'bg-amber-100', text: 'text-amber-700', icon: AlertCircle },
  DEFAULT: { bg: 'bg-gray-100', text: 'text-gray-600', icon: Activity },
};

export function SnapshotTimeline({ recent }) {
  if (!recent?.snapshots) return null;
  
  const { snapshots, audit } = recent;
  
  // Calculate average reliability
  const avgReliability = snapshots.length > 0 
    ? snapshots.reduce((sum, s) => sum + s.reliability, 0) / snapshots.length 
    : 0;
  
  // Calculate trend
  const getTrend = () => {
    if (snapshots.length < 2) return { text: 'N/A', color: 'text-gray-500', icon: '—' };
    const recent3 = snapshots.slice(0, 3).reduce((s, snap) => s + snap.reliability, 0) / 3;
    const older3 = snapshots.slice(-3).reduce((s, snap) => s + snap.reliability, 0) / 3;
    const diff = recent3 - older3;
    if (diff > 0.05) return { text: 'UP', color: 'text-green-600', icon: '↑' };
    if (diff < -0.05) return { text: 'DOWN', color: 'text-red-600', icon: '↓' };
    return { text: 'STABLE', color: 'text-gray-600', icon: '→' };
  };
  const trend = getTrend();
  
  return (
    <div 
      className="rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-lg"
      data-testid="snapshot-timeline"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">RECENT ACTIVITY</h3>
          <InfoTooltip {...FRACTAL_TOOLTIPS.recentActivity} placement="right" />
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100">
          <History className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-bold text-gray-600">{snapshots.length} days</span>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="p-3 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-500 uppercase mb-1">Avg Reliability</p>
          <p className={`text-2xl font-bold ${avgReliability >= 0.7 ? 'text-green-600' : avgReliability >= 0.5 ? 'text-amber-600' : 'text-red-600'}`}>
            {(avgReliability * 100).toFixed(0)}%
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-500 uppercase mb-1">Trend</p>
          <p className={`text-lg font-bold ${trend.color}`}>
            {trend.icon} {trend.text}
          </p>
        </div>
      </div>
      
      {/* Chart */}
      <div className="mb-6">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">RELIABILITY (7 DAYS)</p>
        <div className="relative">
          {/* Background grid */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            <div className="border-b border-gray-100"></div>
            <div className="border-b border-gray-100"></div>
            <div className="border-b border-gray-100"></div>
          </div>
          
          {/* Bars */}
          <div className="flex items-end gap-2 h-24 relative z-10">
            {snapshots.slice(0, 7).reverse().map((snap, i) => {
              const colors = healthColors[snap.health] || healthColors.HEALTHY;
              const height = Math.max(snap.reliability * 100, 5);
              
              return (
                <div key={i} className="flex-1 flex flex-col items-center group">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg transition-opacity z-20 whitespace-nowrap">
                    {snap.date}: {(snap.reliability * 100).toFixed(0)}%
                  </div>
                  
                  {/* Bar */}
                  <div 
                    className={`w-full rounded-t-lg ${colors.bg} transition-all duration-300 hover:opacity-80 cursor-pointer`}
                    style={{ height: `${height}%` }}
                  ></div>
                  
                  {/* Date */}
                  <span className="text-[10px] text-gray-400 mt-2 font-medium">
                    {snap.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Y-axis labels */}
        <div className="flex justify-between mt-2 text-[10px] text-gray-400">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
      
      {/* Audit Log */}
      {audit && audit.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">AUDIT LOG</p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {audit.slice(0, 5).map((entry, i) => {
              const actionConfig = actionColors[entry.action] || actionColors.DEFAULT;
              const ActionIcon = actionConfig.icon;
              
              return (
                <div 
                  key={i} 
                  className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2 text-gray-400 min-w-[70px]">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs font-mono">
                      {new Date(entry.ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${actionConfig.bg}`}>
                    <ActionIcon className={`w-3 h-3 ${actionConfig.text}`} />
                    <span className={`text-xs font-bold ${actionConfig.text}`}>{entry.action}</span>
                  </div>
                  
                  <span className="text-xs text-gray-600 truncate flex-1">{entry.note}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default SnapshotTimeline;
