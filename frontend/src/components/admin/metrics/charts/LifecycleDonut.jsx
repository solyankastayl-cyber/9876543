/**
 * P2.A — Lifecycle Donut Chart
 * 
 * Signal lifecycle status distribution.
 */

import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const STATUS_COLORS = {
  NEW: '#3b82f6',      // Blue
  ACTIVE: '#22c55e',   // Green
  COOLDOWN: '#eab308', // Yellow
  RESOLVED: '#71717a', // Gray
};

export function LifecycleDonut({ data }) {
  if (!data || data.length === 0) {
    return <div className="text-zinc-500 text-sm">No data available</div>;
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={STATUS_COLORS[d.status] || '#888'} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#18181b', 
              border: '1px solid #3f3f46',
              borderRadius: '8px',
              color: '#e4e4e7'
            }}
            formatter={(value, name, props) => [
              `${value} (${((value / total) * 100).toFixed(1)}%)`,
              props.payload.status
            ]}
          />
          <Legend 
            verticalAlign="bottom"
            formatter={(value, entry) => (
              <span style={{ color: '#a1a1aa', fontSize: 12 }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{total}</div>
          <div className="text-xs text-zinc-400">Total</div>
        </div>
      </div>
    </div>
  );
}

export default LifecycleDonut;
