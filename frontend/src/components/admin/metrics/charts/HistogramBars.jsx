/**
 * P2.A — Histogram Bars Chart
 * 
 * Confidence score distribution visualization.
 */

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';

const BUCKET_COLORS = {
  '0-40': '#ef4444',    // Red - Low
  '41-60': '#f97316',   // Orange - Medium-Low
  '61-79': '#eab308',   // Yellow - Medium
  '80-90': '#22c55e',   // Green - High
  '91-100': '#06b6d4',  // Cyan - Very High
};

export function HistogramBars({ data }) {
  if (!data || data.length === 0) {
    return <div className="text-zinc-500 text-sm">No data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.3} />
        <XAxis 
          dataKey="bucket" 
          tick={{ fill: '#a1a1aa', fontSize: 12 }}
          axisLine={{ stroke: '#3f3f46' }}
        />
        <YAxis 
          tick={{ fill: '#a1a1aa', fontSize: 12 }}
          axisLine={{ stroke: '#3f3f46' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#18181b', 
            border: '1px solid #3f3f46',
            borderRadius: '8px',
            color: '#e4e4e7'
          }}
          labelStyle={{ color: '#a1a1aa' }}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={BUCKET_COLORS[entry.bucket] || '#22c55e'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default HistogramBars;
