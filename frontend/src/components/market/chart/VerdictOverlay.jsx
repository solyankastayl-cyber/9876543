/**
 * PHASE 1.3 — Verdict Overlay Component
 * =======================================
 * 
 * Overlays verdict history on the price chart.
 * Shows BULLISH (green) / BEARISH (red) / NEUTRAL (gray) zones.
 */

import { useMemo } from 'react';

export default function VerdictOverlay({ 
  verdicts, 
  priceRange,
  width = 800, 
  height = 300,
}) {
  const zones = useMemo(() => {
    if (!verdicts || verdicts.length === 0 || !priceRange) return [];
    
    const { from, to, min, max } = priceRange;
    const pad = { top: 20, right: 60, bottom: 30, left: 10 };
    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;
    
    const timeRange = to - from || 1;
    const xScale = (ts) => pad.left + ((ts - from) / timeRange) * chartW;
    
    const zoneData = [];
    
    // Sort verdicts by time
    const sorted = [...verdicts].sort((a, b) => a.ts - b.ts);
    
    for (let i = 0; i < sorted.length; i++) {
      const v = sorted[i];
      const nextTs = i < sorted.length - 1 ? sorted[i + 1].ts : to;
      
      const x1 = xScale(v.ts);
      const x2 = xScale(nextTs);
      const zoneWidth = Math.max(2, x2 - x1);
      
      let color = 'rgba(100, 116, 139, 0.1)'; // neutral
      if (v.verdict === 'BULLISH') {
        color = `rgba(34, 197, 94, ${0.1 + v.confidence * 0.15})`;
      } else if (v.verdict === 'BEARISH') {
        color = `rgba(239, 68, 68, ${0.1 + v.confidence * 0.15})`;
      }
      
      zoneData.push({
        x: x1,
        y: pad.top,
        width: zoneWidth,
        height: chartH,
        color,
        verdict: v.verdict,
        confidence: v.confidence,
        ts: v.ts,
      });
    }
    
    return zoneData;
  }, [verdicts, priceRange, width, height]);
  
  if (zones.length === 0) return null;
  
  return (
    <svg 
      width={width} 
      height={height}
      className="absolute top-0 left-0 pointer-events-none"
      style={{ overflow: 'visible' }}
    >
      {zones.map((zone, i) => (
        <rect
          key={i}
          x={zone.x}
          y={zone.y}
          width={zone.width}
          height={zone.height}
          fill={zone.color}
        />
      ))}
    </svg>
  );
}
