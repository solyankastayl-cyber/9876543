import { useState } from 'react';
import { Flame, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';

const GlassCard = ({ children, className = "", hover = false }) => (
  <div className={`glass-card ${hover ? 'hover:shadow-[0_6px_24px_rgba(0,0,0,0.1)] transition-all duration-300' : ''} ${className}`}>
    {children}
  </div>
);

export default function FlowHeatmap() {
  // Anomalies detection (z-score > 2) - TOP 5 ONLY
  const anomalies = [
    { entity: 'a16z', token: 'ETH', value: 92, type: 'high_inflow', zscore: 2.8 },
    { entity: 'Binance', token: 'USDT', value: 89, type: 'high_inflow', zscore: 2.5 },
    { entity: 'Jump', token: 'SOL', value: 78, type: 'high_inflow', zscore: 2.3 },
    { entity: 'Wintermute', token: 'USDT', value: -34, type: 'high_outflow', zscore: -2.1 },
    { entity: 'Galaxy', token: 'BTC', value: 67, type: 'high_inflow', zscore: 2.0 },
  ];

  return (
    <div className="px-6 mb-6">
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Anomalies (last 24h)</h2>
              <p className="text-xs text-gray-500">Z-score &gt; 2.0 detected</p>
            </div>
          </div>
          
          <button className="px-3 py-1.5 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors flex items-center gap-1">
            Open Flow Explorer
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Bullet List - Simplified */}
        <div className="space-y-2">
          {anomalies.slice(0, 5).map((anomaly, i) => (
            <div 
              key={i} 
              className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {anomaly.type === 'high_inflow' ? (
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm font-semibold text-gray-900">
                  {anomaly.entity} → {anomaly.token}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold ${anomaly.type === 'high_inflow' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {anomaly.value > 0 ? '+' : ''}{anomaly.value}
                </span>
                <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                  {anomaly.zscore > 0 ? '+' : ''}{anomaly.zscore}σ
                </span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
