/**
 * PHASE 1.3 — Divergence Markers Component
 * ==========================================
 * 
 * Shows markers where system verdict diverged from actual price movement.
 */

import { useMemo, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function DivergenceMarkers({ 
  divergences, 
  priceRange,
  prices,
  width = 800, 
  height = 300,
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  
  const markers = useMemo(() => {
    if (!divergences || divergences.length === 0 || !priceRange) return [];
    
    const { from, to } = priceRange;
    const pad = { top: 20, right: 60, bottom: 30, left: 10 };
    const chartW = width - pad.left - pad.right;
    
    const timeRange = to - from || 1;
    const xScale = (ts) => pad.left + ((ts - from) / timeRange) * chartW;
    
    return divergences.map((d, i) => {
      const x = xScale(d.ts);
      const y = pad.top + 15; // Near top of chart
      
      return {
        ...d,
        x,
        y,
        idx: i,
      };
    });
  }, [divergences, priceRange, width, height]);
  
  if (markers.length === 0) return null;
  
  return (
    <>
      <svg 
        width={width} 
        height={height}
        className="absolute top-0 left-0"
        style={{ overflow: 'visible' }}
      >
        {markers.map((m, i) => (
          <g key={i}>
            {/* Vertical line */}
            <line
              x1={m.x}
              y1={20}
              x2={m.x}
              y2={height - 30}
              stroke="rgba(239, 68, 68, 0.3)"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
            
            {/* Marker circle */}
            <circle
              cx={m.x}
              cy={m.y}
              r={hoveredIdx === i ? 10 : 7}
              fill={hoveredIdx === i ? 'rgb(239, 68, 68)' : 'rgba(239, 68, 68, 0.8)'}
              stroke="white"
              strokeWidth="2"
              style={{ cursor: 'pointer', transition: 'r 0.15s' }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
            
            {/* X mark */}
            <text
              x={m.x}
              y={m.y + 4}
              fontSize="10"
              fontWeight="bold"
              fill="white"
              textAnchor="middle"
              style={{ pointerEvents: 'none' }}
            >
              ✕
            </text>
          </g>
        ))}
      </svg>
      
      {/* Tooltip */}
      {hoveredIdx !== null && markers[hoveredIdx] && (
        <div 
          className="absolute z-50 p-3 bg-slate-800 border border-red-500/30 rounded-lg shadow-xl"
          style={{
            left: Math.min(markers[hoveredIdx].x + 15, width - 250),
            top: markers[hoveredIdx].y + 15,
            maxWidth: '240px',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="font-semibold text-red-400">DIVERGENCE</span>
          </div>
          <div className="text-sm text-slate-300 space-y-1">
            <p>
              <span className="text-slate-500">Verdict:</span>{' '}
              <span className={markers[hoveredIdx].verdict === 'BULLISH' ? 'text-emerald-400' : 'text-red-400'}>
                {markers[hoveredIdx].verdict}
              </span>
            </p>
            <p>
              <span className="text-slate-500">Price moved:</span>{' '}
              <span className={markers[hoveredIdx].actualMove === 'UP' ? 'text-emerald-400' : 'text-red-400'}>
                {markers[hoveredIdx].actualMove} ({(markers[hoveredIdx].magnitude * 100).toFixed(2)}%)
              </span>
            </p>
            <p>
              <span className="text-slate-500">Horizon:</span>{' '}
              {markers[hoveredIdx].horizonBars} bars
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {new Date(markers[hoveredIdx].ts).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
