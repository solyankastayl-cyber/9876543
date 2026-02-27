/**
 * MACRO LAYER PANEL — V2 Unified Engine
 * 
 * Single API call to /api/macro-engine/DXY/pack
 * Displays: Regime State, Engine Info, Macro Impact, Drivers
 */

import React, { useState, useEffect } from 'react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

const MacroLayerPanel = ({ focus, focusPack }) => {
  const [pack, setPack] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchPack = async () => {
      try {
        setLoading(true);
        // Call V2 directly for macro diagnostics (V2 is challenger engine)
        const res = await fetch(`${API_BASE}/api/macro-engine/v2/DXY/pack?horizon=${focus || '30D'}`);
        if (res.ok) {
          const data = await res.json();
          setPack(data);
        }
      } catch (err) {
        console.log('[MacroLayerPanel] Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPack();
  }, [focus]);

  if (loading || !pack) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4" data-testid="macro-layer-panel">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white rounded-lg border border-slate-200 p-4 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-24 mb-3" />
            <div className="h-6 bg-slate-200 rounded w-20 mb-2" />
            <div className="space-y-2">
              <div className="h-3 bg-slate-100 rounded w-full" />
              <div className="h-3 bg-slate-100 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const { regime, drivers, guard, overlay, meta } = pack;
  const engineVersion = pack.engineVersion || 'v1';
  const stateInfo = meta?.stateInfo || {};
  const isV2 = engineVersion === 'v2';
  
  // Regime info
  const regimeName = (regime?.dominant || 'NEUTRAL').replace(/_/g, ' ');
  const regimeConfidence = regime?.confidence || 0;
  const persistence = regime?.persistence;
  const transitionHint = regime?.transitionHint;
  
  // Horizon overlay for current focus
  const focusHorizon = focus || '30D';
  const currentOverlay = overlay?.horizons?.find(h => h.horizon === focusHorizon);
  const hybridReturn = currentOverlay?.hybridEndReturn || 0;
  const delta = currentOverlay?.delta || 0;
  const macroReturn = currentOverlay?.macroEndReturn || 0;
  
  // Impact strength
  const impactStrength = Math.abs(delta) > 0.01 ? 'Strong' 
    : Math.abs(delta) > 0.005 ? 'Moderate' 
    : Math.abs(delta) > 0 ? 'Weak' 
    : 'None';
  
  const formatReturn = (r) => {
    if (!r && r !== 0) return '--';
    const pct = r * 100;
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(2)}%`;
  };

  // Top drivers
  const topDrivers = (drivers?.components || []).slice(0, 5);
  
  return (
    <div data-testid="macro-layer-panel">
      {/* Engine version badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Macro Layer
        </span>
        <span 
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            isV2 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
          }`}
          data-testid="engine-version-badge"
        >
          {engineVersion.toUpperCase()}
        </span>
        {stateInfo.weightsSource === 'calibrated' && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600"
            data-testid="calibrated-badge"
          >
            CALIBRATED
          </span>
        )}
        {stateInfo.volScale && stateInfo.volScale !== 1 && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-600"
            data-testid="volscale-badge"
          >
            Vol x{stateInfo.volScale}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* A. Regime State */}
        <div className="bg-white rounded-lg border border-slate-200 p-4" data-testid="regime-state-card">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-3">
            Regime State
          </div>
          
          <div className="mb-3">
            <span className={`inline-block px-2 py-1 rounded text-sm font-semibold ${
              regimeName.includes('EASING') ? 'bg-green-100 text-green-700' :
              regimeName.includes('TIGHTENING') || regimeName.includes('STRESS') ? 'bg-red-100 text-red-700' :
              regimeName.includes('RISK OFF') ? 'bg-red-100 text-red-700' :
              'bg-amber-100 text-amber-700'
            }`} data-testid="regime-badge">
              {regimeName}
            </span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Confidence</span>
              <span className="font-medium">{(regimeConfidence * 100).toFixed(0)}%</span>
            </div>
            {isV2 && persistence !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-500">Persistence</span>
                <span className="font-medium">{(persistence * 100).toFixed(0)}%</span>
              </div>
            )}
            {isV2 && stateInfo.entropy !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-500">Entropy</span>
                <span className="font-medium text-slate-600">{stateInfo.entropy.toFixed(2)}</span>
              </div>
            )}
            {transitionHint && (
              <div className="text-xs text-slate-400 mt-1">
                Next: {transitionHint}
              </div>
            )}
          </div>
        </div>
        
        {/* B. Guard Level */}
        <div className="bg-white rounded-lg border border-slate-200 p-4" data-testid="guard-card">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-3">
            Guard Level
          </div>
          
          <div className="mb-3">
            <span className={`inline-block px-2 py-1 rounded text-sm font-semibold ${
              guard?.level === 'HARD' ? 'bg-red-100 text-red-700' :
              guard?.level === 'SOFT' ? 'bg-amber-100 text-amber-700' :
              'bg-green-100 text-green-700'
            }`} data-testid="guard-badge">
              {guard?.level || 'NONE'}
            </span>
          </div>
          
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Score</span>
              <span className={`font-medium ${
                (drivers?.scoreSigned || 0) > 0 ? 'text-green-600' : 
                (drivers?.scoreSigned || 0) < 0 ? 'text-red-600' : 
                'text-slate-500'
              }`}>
                {((drivers?.scoreSigned || 0) * 100).toFixed(2)}%
              </span>
            </div>
            {(guard?.reasonCodes || []).map((code, i) => (
              <div key={i} className="text-[10px] text-slate-400 font-mono">
                {code}
              </div>
            ))}
          </div>
        </div>
        
        {/* C. Macro Impact */}
        <div className="bg-white rounded-lg border border-slate-200 p-4" data-testid="macro-impact-card">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-3">
            Macro Impact ({focusHorizon})
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Hybrid Base</span>
              <span className={`font-medium ${hybridReturn < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatReturn(hybridReturn)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-slate-500">Macro Delta</span>
              <span className={`font-medium ${
                delta < 0 ? 'text-amber-600' : 
                delta > 0 ? 'text-blue-600' : 
                'text-slate-400'
              }`}>
                {formatReturn(delta)}
              </span>
            </div>
            
            <div className="border-t border-slate-100 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Adjusted</span>
                <span className={`font-semibold text-base ${macroReturn < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatReturn(macroReturn)}
                </span>
              </div>
            </div>
            
            <div className="flex justify-between pt-1">
              <span className="text-slate-500">Strength</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                impactStrength === 'Strong' ? 'bg-blue-100 text-blue-700' :
                impactStrength === 'Moderate' ? 'bg-amber-100 text-amber-700' :
                'bg-slate-100 text-slate-500'
              }`}>
                {impactStrength}
              </span>
            </div>
          </div>
        </div>
        
        {/* D. Top Drivers */}
        <div className="bg-white rounded-lg border border-slate-200 p-4" data-testid="drivers-card">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-3">
            Top Drivers
          </div>
          
          <div className="space-y-1.5">
            {topDrivers.map((d, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-slate-500 truncate max-w-[100px]" title={d.displayName}>
                  {d.key}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-mono ${
                    (d.contribution || 0) < 0 ? 'text-red-500' :
                    (d.contribution || 0) > 0 ? 'text-green-500' :
                    'text-slate-400'
                  }`}>
                    {d.contribution > 0 ? '+' : ''}{((d.contribution || 0) * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-400 w-10 text-right">
                    w:{(d.weight * 100).toFixed(0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {topDrivers.length === 0 && (
            <div className="text-slate-400 text-sm">No driver data</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MacroLayerPanel;
