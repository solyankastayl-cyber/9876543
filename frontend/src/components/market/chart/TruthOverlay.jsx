/**
 * PHASE 1.4 — Truth Overlay Component
 * =====================================
 * 
 * Overlays truth evaluation markers on the price chart.
 * Shows CONFIRMED (green) and DIVERGED (red) markers where
 * the system's verdict was evaluated against actual price movement.
 */

import { useMemo } from 'react';

export default function TruthOverlay({ 
  truthRecords, 
  priceRange,
  prices,
  width = 800, 
  height = 300,
}) {
  const markers = useMemo(() => {
    if (!truthRecords || truthRecords.length === 0 || !priceRange || !prices?.length) {
      return [];
    }
    
    const { from, to, min, max } = priceRange;
    const pad = { top: 20, right: 60, bottom: 30, left: 10 };
    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;
    
    const timeRange = to - from || 1;
    const priceRangeVal = max - min || 1;
    
    const xScale = (ts) => pad.left + ((ts - from) / timeRange) * chartW;
    const yScale = (price) => pad.top + (1 - (price - min) / priceRangeVal) * chartH;
    
    // Index prices by timestamp for quick lookup
    const priceByTs = new Map(prices.map(p => [p.ts, p]));
    
    return truthRecords
      .filter(record => record.verdictTs >= from && record.verdictTs <= to)
      .filter(record => record.outcome === 'CONFIRMED' || record.outcome === 'DIVERGED')
      .map(record => {
        // Find closest price for Y positioning
        let closestPrice = null;
        let closestDist = Infinity;
        
        for (const p of prices) {
          const dist = Math.abs(p.ts - record.verdictTs);
          if (dist < closestDist) {
            closestDist = dist;
            closestPrice = p;
          }
        }
        
        const price = closestPrice?.c || record.priceAtT0;
        const x = xScale(record.verdictTs);
        const y = yScale(price);
        
        return {
          x,
          y,
          outcome: record.outcome,
          verdict: record.verdict,
          confidence: record.confidence,
          priceChange: record.priceChangePct,
          direction: record.priceDirection,
          ts: record.verdictTs,
          reason: record.reason,
        };
      });
  }, [truthRecords, priceRange, prices, width, height]);
  
  if (markers.length === 0) return null;
  
  return (
    <svg 
      width={width} 
      height={height}
      className="absolute top-0 left-0 pointer-events-none"
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Glow filters */}
        <filter id="truth-glow-confirmed" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="truth-glow-diverged" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {markers.map((marker, i) => {
        const isConfirmed = marker.outcome === 'CONFIRMED';
        
        if (isConfirmed) {
          // Confirmed: small green checkmark dot
          return (
            <g key={i} filter="url(#truth-glow-confirmed)">
              <circle
                cx={marker.x}
                cy={marker.y}
                r={4}
                fill="rgba(34, 197, 94, 0.8)"
                stroke="rgba(34, 197, 94, 1)"
                strokeWidth={1}
              />
              {/* Small check mark */}
              <path
                d={`M ${marker.x - 2} ${marker.y} L ${marker.x - 0.5} ${marker.y + 2} L ${marker.x + 2.5} ${marker.y - 2}`}
                fill="none"
                stroke="white"
                strokeWidth={1.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          );
        } else {
          // Diverged: red X marker with more prominence
          return (
            <g key={i} filter="url(#truth-glow-diverged)">
              {/* Outer ring */}
              <circle
                cx={marker.x}
                cy={marker.y}
                r={7}
                fill="rgba(239, 68, 68, 0.3)"
                stroke="rgba(239, 68, 68, 0.8)"
                strokeWidth={2}
              />
              {/* Inner circle */}
              <circle
                cx={marker.x}
                cy={marker.y}
                r={4}
                fill="rgba(239, 68, 68, 0.9)"
              />
              {/* X mark */}
              <path
                d={`M ${marker.x - 2} ${marker.y - 2} L ${marker.x + 2} ${marker.y + 2} M ${marker.x + 2} ${marker.y - 2} L ${marker.x - 2} ${marker.y + 2}`}
                fill="none"
                stroke="white"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            </g>
          );
        }
      })}
    </svg>
  );
}
