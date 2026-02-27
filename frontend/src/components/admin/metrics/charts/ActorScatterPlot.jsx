/**
 * P2.A — Actor Scatter Plot
 * 
 * ActorCount vs Confidence visualization.
 */

import React from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ZAxis
} from 'recharts';

const STATUS_COLORS = {
  NEW: '#3b82f6',
  ACTIVE: '#22c55e',
  COOLDOWN: '#eab308',
  RESOLVED: '#71717a',
};

export function ActorScatterPlot({ data }) {
  if (!data || data.length === 0) {
    return <div className="text-zinc-500 text-sm">No data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.3} />
        <XAxis 
          dataKey="actorCount" 
          name="Actors" 
          type="number"
          tick={{ fill: '#a1a1aa', fontSize: 12 }}
          axisLine={{ stroke: '#3f3f46' }}
          label={{ value: 'Actor Count', position: 'insideBottom', offset: -5, fill: '#71717a', fontSize: 11 }}
        />
        <YAxis 
          dataKey="confidence" 
          name="Confidence" 
          type="number"
          domain={[0, 100]}
          tick={{ fill: '#a1a1aa', fontSize: 12 }}
          axisLine={{ stroke: '#3f3f46' }}
          label={{ value: 'Confidence', angle: -90, position: 'insideLeft', fill: '#71717a', fontSize: 11 }}
        />
        <ZAxis dataKey="diversityIndex" range={[50, 200]} />
        <Tooltip 
          cursor={{ strokeDasharray: '3 3' }}
          contentStyle={{ 
            backgroundColor: '#18181b', 
            border: '1px solid #3f3f46',
            borderRadius: '8px',
            color: '#e4e4e7'
          }}
          formatter={(value, name) => [value, name]}
          labelFormatter={(_, payload) => {
            if (payload && payload[0]) {
              return `Signal: ${payload[0].payload.signalId?.slice(0, 12) || 'N/A'}`;
            }
            return '';
          }}
        />
        <Scatter 
          data={data} 
          fill="#38bdf8"
          shape={(props) => {
            const { cx, cy, payload } = props;
            const color = STATUS_COLORS[payload.status] || '#38bdf8';
            return (
              <circle cx={cx} cy={cy} r={6} fill={color} fillOpacity={0.7} stroke={color} strokeWidth={1} />
            );
          }}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export default ActorScatterPlot;
