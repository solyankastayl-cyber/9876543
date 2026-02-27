/**
 * Macro Impact Line
 * 
 * Compact display of macro regime impact for Decision Bar
 */

import { useState, useEffect } from 'react';
import { AlertTriangle, Lock, Activity, TrendingUp, TrendingDown } from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

export function MacroImpactLine() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v10/macro-intel/regime`);
        const json = await res.json();
        if (json.ok) {
          setData(json.data);
        }
      } catch (err) {
        console.error('Macro regime fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) {
    return null;
  }

  const isPanic = data.flags?.MACRO_PANIC || data.flags?.CAPITAL_EXIT;
  const isRiskOff = data.flags?.RISK_OFF;
  const confidencePct = ((1 - data.confidenceMultiplier) * 100).toFixed(0);

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-sm ${
      isPanic 
        ? 'bg-red-50 border-red-200' 
        : isRiskOff 
          ? 'bg-orange-50 border-orange-200'
          : 'bg-blue-50 border-blue-200'
    }`}>
      {/* Regime indicator */}
      <div className="flex items-center gap-1.5">
        <Activity className={`w-4 h-4 ${
          isPanic ? 'text-red-500' : isRiskOff ? 'text-orange-500' : 'text-blue-500'
        }`} />
        <span className={`font-medium ${
          isPanic ? 'text-red-700' : isRiskOff ? 'text-orange-700' : 'text-blue-700'
        }`}>
          {data.regimeLabel}
        </span>
      </div>

      {/* Divider */}
      <span className="text-gray-300">|</span>

      {/* Trends summary */}
      <div className="flex items-center gap-2 text-gray-600">
        <span className="text-xs">BTC.D</span>
        {data.trends?.btcDominance === 'UP' ? (
          <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
        ) : data.trends?.btcDominance === 'DOWN' ? (
          <TrendingDown className="w-3.5 h-3.5 text-blue-500" />
        ) : (
          <span className="text-gray-400">—</span>
        )}
        <span className="text-xs ml-1">BTC</span>
        {data.trends?.btcPrice === 'UP' ? (
          <TrendingUp className="w-3.5 h-3.5 text-green-500" />
        ) : data.trends?.btcPrice === 'DOWN' ? (
          <TrendingDown className="w-3.5 h-3.5 text-red-500" />
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </div>

      {/* Confidence impact */}
      {data.confidenceMultiplier < 1.0 && (
        <>
          <span className="text-gray-300">|</span>
          <span className={`text-xs font-medium ${
            data.confidenceMultiplier < 0.7 ? 'text-red-600' : 'text-orange-600'
          }`}>
            -{confidencePct}% conf
          </span>
        </>
      )}

      {/* Block indicator */}
      {data.blocks?.strongActions && (
        <>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-1 text-red-600">
            <Lock className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">STRONG blocked</span>
          </div>
        </>
      )}
    </div>
  );
}
