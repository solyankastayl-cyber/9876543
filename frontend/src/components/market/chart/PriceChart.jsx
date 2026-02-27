/**
 * PHASE 1.3 — Price Chart Component
 * ===================================
 * 
 * SVG-based candlestick/line chart for price history.
 */

import { useMemo } from 'react';

export default function PriceChart({ 
  bars, 
  width = 800, 
  height = 300,
  showCandles = false,
}) {
  const chartData = useMemo(() => {
    if (!bars || bars.length === 0) return null;
    
    const prices = bars.map(b => b.c);
    const min = Math.min(...prices) * 0.998;
    const max = Math.max(...prices) * 1.002;
    const range = max - min || 1;
    
    const pad = { top: 20, right: 60, bottom: 30, left: 10 };
    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;
    
    const xScale = (i) => pad.left + (i / (bars.length - 1)) * chartW;
    const yScale = (price) => pad.top + (1 - (price - min) / range) * chartH;
    
    // Create line path
    const linePath = bars.map((b, i) => {
      const x = xScale(i);
      const y = yScale(b.c);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    
    // Create area path
    const areaPath = linePath + 
      ` L ${xScale(bars.length - 1).toFixed(1)},${(height - pad.bottom).toFixed(1)}` +
      ` L ${xScale(0).toFixed(1)},${(height - pad.bottom).toFixed(1)} Z`;
    
    // Y-axis labels
    const yLabels = [];
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const price = min + (range * i / steps);
      yLabels.push({
        y: yScale(price),
        label: price.toFixed(price >= 100 ? 0 : 2),
      });
    }
    
    // X-axis labels (timestamps)
    const xLabels = [];
    const xSteps = Math.min(6, bars.length - 1);
    for (let i = 0; i <= xSteps; i++) {
      const idx = Math.floor((bars.length - 1) * i / xSteps);
      const bar = bars[idx];
      if (bar) {
        xLabels.push({
          x: xScale(idx),
          label: new Date(bar.ts).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
          }),
        });
      }
    }
    
    return { 
      bars, 
      linePath, 
      areaPath, 
      yLabels, 
      xLabels, 
      min, 
      max, 
      xScale, 
      yScale,
      pad,
      chartW,
      chartH,
    };
  }, [bars, width, height]);
  
  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-800/30 rounded-lg border border-slate-700 border-dashed">
        <p className="text-slate-500">No price data available</p>
      </div>
    );
  }
  
  const { linePath, areaPath, yLabels, xLabels, pad } = chartData;
  
  return (
    <svg 
      width={width} 
      height={height} 
      className="bg-slate-900/50 rounded-lg"
      style={{ overflow: 'visible' }}
    >
      {/* Grid lines */}
      {yLabels.map((label, i) => (
        <g key={i}>
          <line
            x1={pad.left}
            y1={label.y}
            x2={width - pad.right}
            y2={label.y}
            stroke="rgba(100, 116, 139, 0.2)"
            strokeDasharray="4,4"
          />
          <text
            x={width - pad.right + 5}
            y={label.y + 4}
            fontSize="10"
            fill="rgba(148, 163, 184, 0.8)"
          >
            {label.label}
          </text>
        </g>
      ))}
      
      {/* Area fill */}
      <defs>
        <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(59, 130, 246, 0.3)" />
          <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
        </linearGradient>
      </defs>
      <path
        d={areaPath}
        fill="url(#priceGradient)"
      />
      
      {/* Price line */}
      <path
        d={linePath}
        fill="none"
        stroke="rgb(59, 130, 246)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      
      {/* X-axis labels */}
      {xLabels.map((label, i) => (
        <text
          key={i}
          x={label.x}
          y={height - 8}
          fontSize="9"
          fill="rgba(148, 163, 184, 0.6)"
          textAnchor="middle"
        >
          {label.label}
        </text>
      ))}
    </svg>
  );
}
