/**
 * AltScreenerFilters Component
 * =============================
 * Filters and presets for Alt Screener
 */

import React from 'react';

const PRESETS = {
  EARLY: { horizon: '24h', limit: 50, minScore: 0.62 },
  SMART: { horizon: '4h', limit: 30, minScore: 0.65 },
  MEDIA: { horizon: '1h', limit: 30, minScore: 0.70 },
  VC: { horizon: '24h', limit: 30, minScore: 0.60 },
};

export default function AltScreenerFilters({
  horizon, setHorizon,
  limit, setLimit,
  minScore, setMinScore,
  preset, setPreset,
}) {
  const applyPreset = (p) => {
    const conf = PRESETS[p];
    if (!conf) return;
    setHorizon(conf.horizon);
    setLimit(conf.limit);
    setMinScore(conf.minScore);
  };

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Presets */}
      <div className="flex gap-2 items-center">
        {Object.keys(PRESETS).map((k) => (
          <button
            key={k}
            onClick={() => { setPreset(k); applyPreset(k); }}
            className={`
              rounded-full px-3 py-1.5 text-xs font-medium border transition-colors
              ${preset === k 
                ? 'bg-blue-100 text-blue-700 border-blue-300' 
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }
            `}
          >
            {k}
          </button>
        ))}
      </div>

      {/* Horizon Select */}
      <Select 
        label="Horizon" 
        value={horizon} 
        onChange={setHorizon} 
        options={['1h', '4h', '24h']} 
      />

      {/* Limit Select */}
      <Select 
        label="Limit" 
        value={String(limit)} 
        onChange={(v) => setLimit(Number(v))} 
        options={['20', '30', '50', '100']} 
      />

      {/* Min Score Slider */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Min score</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={minScore}
          onChange={(e) => setMinScore(Number(e.target.value))}
          className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-xs font-mono text-gray-700 w-10 text-right tabular-nums">
          {(minScore * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-xs text-gray-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          bg-white border border-gray-200 rounded-lg 
          px-3 py-1.5 text-sm text-gray-700
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        "
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
