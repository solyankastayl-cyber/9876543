/**
 * P2.A — Confidence Drift Line Chart
 * 
 * Daily confidence trend over time.
 */

import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, ComposedChart, Bar
} from 'recharts';

export function ConfidenceDriftLine({ data }) {
  if (!data || data.length === 0) {
    return <div className="text-zinc-500 text-sm">No data available</div>;
  }

  // Take last 30 days max
  const chartData = data.slice(-30);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.3} />
        <XAxis 
          dataKey="day" 
          tick={{ fill: '#a1a1aa', fontSize: 10 }}
          axisLine={{ stroke: '#3f3f46' }}
          tickFormatter={(value) => value.slice(5)} // Show MM-DD
        />
        <YAxis 
          yAxisId="left"
          domain={[0, 100]}
          tick={{ fill: '#a1a1aa', fontSize: 12 }}
          axisLine={{ stroke: '#3f3f46' }}
        />
        <YAxis 
          yAxisId="right"
          orientation="right"
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
        <Bar 
          yAxisId="right"
          dataKey="count" 
          fill="#3f3f46" 
          opacity={0.5}
          radius={[4, 4, 0, 0]}
          name="Signal Count"
        />
        <Line 
          yAxisId="left"
          type="monotone" 
          dataKey="avgConfidence" 
          stroke="#a855f7" 
          strokeWidth={2} 
          dot={false}
          name="Avg Confidence"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export default ConfidenceDriftLine;
