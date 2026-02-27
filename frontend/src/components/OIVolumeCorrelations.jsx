import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Search, X } from 'lucide-react';
import { chartColors } from '../styles/chartTheme';

const GlassCard = ({ children, className = "", hover = false }) => (
  <div className={`glass-card ${hover ? 'glass-card-hover' : ''} ${className}`}>
    {children}
  </div>
);

// Metric icons/avatars for comparison
const metricIcons = {
  'Open Interest': { color: '#3B82F6', abbr: 'OI', bg: 'bg-blue-100' },
  'Net Flow': { color: '#8B5CF6', abbr: 'NF', bg: 'bg-purple-100' },
  'Price': { color: '#00C9A7', abbr: 'PR', bg: 'bg-emerald-100' },
};

// Custom Tooltip - detailed like in the reference
const DetailedTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  
  const data = payload[0]?.payload;
  
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 min-w-[240px]">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <span className="text-sm font-bold text-gray-900">{data?.metric || 'Metric'}</span>
          <span className="text-gray-400 mx-1">→</span>
          <span className="text-sm font-semibold text-gray-700">{label}</span>
        </div>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Date:</span>
          <span className="font-semibold text-gray-900">{label}</span>
        </div>
        
        {payload.map((entry, index) => {
          const isPositive = entry.value >= 50;
          return (
            <div key={index} className="flex justify-between items-center">
              <span className="text-gray-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
                {entry.name}:
              </span>
              <span className={`font-bold ${isPositive ? 'text-emerald-500' : 'text-red-400'}`}>
                {entry.value}%
                <span className="text-xs ml-1">
                  ({isPositive ? '+' : ''}{((entry.value - 50) / 10).toFixed(1)}x)
                </span>
              </span>
            </div>
          );
        })}
        
        <div className="pt-2 mt-2 border-t border-gray-100">
          <div className="flex justify-between">
            <span className="text-gray-500">Correlation:</span>
            <span className="font-bold text-emerald-500">Strong (0.87)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Signal:</span>
            <span className="font-bold text-blue-500">Bullish</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function OIVolumeCorrelations({ tokenSymbol = 'ETH' }) {
  const [timeframe, setTimeframe] = useState('7D');
  const [selectedMetrics, setSelectedMetrics] = useState(['Open Interest', 'Net Flow', 'Price']);

  // More dynamic data with visible curves
  const correlationData = {
    '24H': [
      { time: '00:00', oi: 72, netflow: 68, price: 75, metric: 'Hourly' },
      { time: '04:00', oi: 78, netflow: 72, price: 70, metric: 'Hourly' },
      { time: '08:00', oi: 65, netflow: 80, price: 68, metric: 'Hourly' },
      { time: '12:00', oi: 85, netflow: 75, price: 82, metric: 'Hourly' },
      { time: '16:00', oi: 80, netflow: 88, price: 78, metric: 'Hourly' },
      { time: '20:00', oi: 92, netflow: 82, price: 88, metric: 'Hourly' },
    ],
    '7D': [
      { time: 'Mon', oi: 68, netflow: 72, price: 65, metric: 'Daily' },
      { time: 'Tue', oi: 82, netflow: 65, price: 78, metric: 'Daily' },
      { time: 'Wed', oi: 75, netflow: 85, price: 72, metric: 'Daily' },
      { time: 'Thu', oi: 90, netflow: 78, price: 85, metric: 'Daily' },
      { time: 'Fri', oi: 72, netflow: 92, price: 70, metric: 'Daily' },
      { time: 'Sat', oi: 88, netflow: 70, price: 92, metric: 'Daily' },
      { time: 'Sun', oi: 95, netflow: 88, price: 85, metric: 'Daily' },
    ],
    '30D': [
      { time: '01 Jan', oi: 55, netflow: 62, price: 50, metric: 'Weekly' },
      { time: '08 Jan', oi: 72, netflow: 58, price: 68, metric: 'Weekly' },
      { time: '15 Jan', oi: 65, netflow: 78, price: 72, metric: 'Weekly' },
      { time: '22 Jan', oi: 88, netflow: 70, price: 85, metric: 'Weekly' },
      { time: '29 Jan', oi: 78, netflow: 92, price: 75, metric: 'Weekly' },
      { time: '05 Feb', oi: 95, netflow: 85, price: 92, metric: 'Weekly' },
    ],
  };

  const currentData = correlationData[timeframe] || correlationData['7D'];

  const correlations = [
    { pair: 'OI', fullName: 'Open Interest', value: 0.87, strength: 'Strong', color: '#3B82F6' },
    { pair: 'NF', fullName: 'Net Flow', value: 0.64, strength: 'Moderate', color: '#8B5CF6' },
    { pair: 'PR', fullName: 'Price', value: 0.72, strength: 'Strong', color: '#00C9A7' },
  ];

  const removeMetric = (metric) => {
    if (selectedMetrics.length > 1) {
      setSelectedMetrics(selectedMetrics.filter(m => m !== metric));
    }
  };

  const timeframes = ['24H', '7D', '30D', '90D', 'ALL'];

  return (
    <div className="flex justify-center px-4">
      <GlassCard className="p-5 w-full max-w-3xl">
        {/* Header with Compare and Time Selector */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-600">Compare</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder="Search metric"
                className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-2xl w-36 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
          
          <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
            {timeframes.map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  timeframe === tf
                    ? 'bg-white text-emerald-500 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Metrics as Tags */}
        <div className="flex gap-3 mb-5">
          {selectedMetrics.map((metric) => {
            const metricInfo = metricIcons[metric];
            return (
              <div key={metric} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200">
                <div className={`w-7 h-7 rounded-full ${metricInfo.bg} flex items-center justify-center`}>
                  <span className="text-xs font-bold" style={{ color: metricInfo.color }}>{metricInfo.abbr}</span>
                </div>
                <span className="text-sm font-medium text-gray-700">{metric}</span>
                {selectedMetrics.length > 1 && (
                  <button 
                    onClick={() => removeMetric(metric)}
                    className="w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                  >
                    <X className="w-3 h-3 text-gray-500" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Chart with Y-axis showing multipliers */}
        <div className="h-72 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={currentData} margin={{ left: 10, right: 10, top: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="0" stroke="rgba(0,0,0,0.04)" vertical={false} />
              
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 500 }} 
                stroke="transparent"
                tickLine={false}
                axisLine={false}
              />
              
              <YAxis 
                tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 500 }} 
                stroke="transparent"
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={(value) => {
                  const multiplier = ((value - 50) / 10).toFixed(1);
                  const isPositive = value >= 50;
                  return `${isPositive ? '▲' : '▼'} ${Math.abs(multiplier)}x`;
                }}
                width={55}
              />
              
              <Tooltip content={<DetailedTooltip />} />
              
              {selectedMetrics.includes('Open Interest') && (
                <Line 
                  type="monotone" 
                  dataKey="oi" 
                  name="Open Interest"
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: '#fff', stroke: '#3B82F6', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }}
                />
              )}
              
              {selectedMetrics.includes('Net Flow') && (
                <Line 
                  type="monotone" 
                  dataKey="netflow" 
                  name="Net Flow"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: '#fff', stroke: '#8B5CF6', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#8B5CF6', stroke: '#fff', strokeWidth: 2 }}
                />
              )}
              
              {selectedMetrics.includes('Price') && (
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  name="Price"
                  stroke="#00C9A7"
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: '#fff', stroke: '#00C9A7', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#00C9A7', stroke: '#fff', strokeWidth: 2 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mb-5">
          {correlations.map((corr) => (
            selectedMetrics.includes(corr.fullName) && (
              <div key={corr.pair} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: corr.color }} />
                <span className="text-sm font-medium text-gray-600">{corr.fullName}</span>
              </div>
            )
          ))}
        </div>

        {/* Correlation Scores - Bottom Section */}
        <div className="border-t border-gray-100 pt-4">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Correlation Scores</div>
          <div className="grid grid-cols-3 gap-4">
            {correlations.map((corr) => (
              <div key={corr.pair} className="p-3 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: `${corr.color}20` }}>
                    <TrendingUp className="w-3 h-3" style={{ color: corr.color }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-500">{corr.fullName}</span>
                </div>
                <div className="text-xl font-bold" style={{ color: corr.color }}>
                  {corr.value.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">{corr.strength}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Signals */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Recent Signals</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <div>
                  <div className="text-sm font-bold text-emerald-600">BULLISH</div>
                  <div className="text-xs text-emerald-700/70">OI rising while price consolidates</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">2h ago</div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm font-bold text-gray-600">NEUTRAL</div>
                  <div className="text-xs text-gray-500">All metrics aligned</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">12h ago</div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
