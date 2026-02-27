/**
 * Drivers Mini Panel — Top prediction drivers
 */

import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react';

const LAYER_META = {
  exchange: { label: 'Exchange', color: '#F59E0B' },
  onchain: { label: 'Onchain', color: '#8B5CF6' },
  sentiment: { label: 'Sentiment', color: '#EC4899' },
};

export function DriversMiniPanel({ prediction, topDrivers }) {
  // Use topDrivers directly if provided, otherwise try to extract from prediction
  const drivers = topDrivers || prediction?.topDrivers;
  
  if (!drivers) {
    // Fallback: calculate from last prediction point
    const lastPoint = prediction?.points?.[prediction.points.length - 1];
    if (!lastPoint) return null;
    
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4" data-testid="drivers-panel">
        <h3 className="text-sm font-medium text-gray-500 mb-3">TOP DRIVERS</h3>
        
        <div className="space-y-3">
          {['exchange', 'onchain', 'sentiment'].map(key => {
            const meta = LAYER_META[key];
            const score = lastPoint?.[key] || 0.5;
            const isBullish = score > 0.5;
            const strength = Math.abs(score - 0.5) * 2;
            
            return (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span className="text-sm text-gray-700">{meta.label}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${
                    isBullish ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isBullish ? '+' : '-'}{Math.round(strength * 100)}%
                  </span>
                  {isBullish ? (
                    <TrendingUpIcon className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDownIcon className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Avg Confidence</span>
            <span className="font-medium">
              {Math.round((lastPoint?.combinedConfidence || 0.5) * 100)}%
            </span>
          </div>
        </div>
      </div>
    );
  }
  
  // Use topDrivers from API
  const driverList = [
    { key: 'exchange', value: drivers.exchange || 0 },
    { key: 'onchain', value: drivers.onchain || 0 },
    { key: 'sentiment', value: drivers.sentiment || 0 },
  ].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4" data-testid="drivers-panel">
      <h3 className="text-sm font-medium text-gray-500 mb-3">TOP DRIVERS</h3>
      
      <div className="space-y-3">
        {driverList.map(driver => {
          const meta = LAYER_META[driver.key];
          const isBullish = driver.value > 0;
          
          return (
            <div key={driver.key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: meta.color }}
                />
                <span className="text-sm text-gray-700">{meta.label}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${
                  isBullish ? 'text-green-600' : driver.value < 0 ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {isBullish ? '+' : ''}{driver.value}%
                </span>
                {isBullish ? (
                  <TrendingUpIcon className="w-4 h-4 text-green-500" />
                ) : driver.value < 0 ? (
                  <TrendingDownIcon className="w-4 h-4 text-red-500" />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Avg Confidence</span>
          <span className="font-medium">
            {/* Sum of absolute driver impacts */}
            {Math.round(Math.abs(drivers.exchange || 0) + 50)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default DriversMiniPanel;
