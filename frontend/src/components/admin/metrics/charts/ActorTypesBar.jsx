/**
 * P2.A — Actor Types Bar Chart
 * 
 * Distribution of signal types.
 */

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const TYPE_COLORS = [
  '#22c55e', '#3b82f6', '#a855f7', '#f97316', '#eab308',
  '#06b6d4', '#ec4899', '#14b8a6', '#f43f5e', '#8b5cf6'
];

export function ActorTypesBar({ data }) {
  if (!data || data.length === 0) {
    return <div className="text-zinc-500 text-sm">No data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <XAxis 
          type="number"
          tick={{ fill: '#a1a1aa', fontSize: 12 }}
          axisLine={{ stroke: '#3f3f46' }}
        />
        <YAxis 
          dataKey="actorType" 
          type="category" 
          width={120}
          tick={{ fill: '#a1a1aa', fontSize: 11 }}
          axisLine={{ stroke: '#3f3f46' }}
          tickFormatter={(value) => value?.replace(/_/g, ' ') || value}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#18181b', 
            border: '1px solid #3f3f46',
            borderRadius: '8px',
            color: '#e4e4e7'
          }}
        />
        <Bar dataKey="count" radius={[0, 6, 6, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default ActorTypesBar;
