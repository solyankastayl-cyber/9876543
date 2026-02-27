/**
 * Fear & Greed History Chart
 * 
 * Displays historical Fear & Greed index as a line chart
 */

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  RefreshCw,
  Calendar,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

// Fear & Greed color mapping
const FG_COLORS = {
  EXTREME_FEAR: '#ef4444',  // red-500
  FEAR: '#f97316',          // orange-500
  NEUTRAL: '#6b7280',       // gray-500
  GREED: '#22c55e',         // green-500
  EXTREME_GREED: '#10b981', // emerald-500
};

function getColorForValue(value) {
  if (value <= 20) return FG_COLORS.EXTREME_FEAR;
  if (value <= 35) return FG_COLORS.FEAR;
  if (value <= 55) return FG_COLORS.NEUTRAL;
  if (value <= 75) return FG_COLORS.GREED;
  return FG_COLORS.EXTREME_GREED;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export function FearGreedHistoryChart({ days = 7, compact = false }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(!compact);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/v10/macro/fear-greed/history?days=${days}`);
      const json = await res.json();
      if (json.ok) {
        // Reverse to show oldest first (left to right)
        setData(json.data.history.reverse());
        setError(null);
      } else {
        setError(json.error || 'Failed to load history');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [days]);

  if (loading && data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error && data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-4">
        <span className="text-sm text-red-600">History unavailable</span>
      </div>
    );
  }

  // Calculate chart dimensions
  const chartHeight = compact ? 80 : 120;
  const chartWidth = 100; // percentage
  const padding = { top: 10, bottom: 25, left: 5, right: 5 };
  
  // Calculate points for SVG path
  const minVal = 0;
  const maxVal = 100;
  const yScale = (val) => {
    return chartHeight - padding.bottom - 
      ((val - minVal) / (maxVal - minVal)) * (chartHeight - padding.top - padding.bottom);
  };

  // Calculate trend
  const currentValue = data[data.length - 1]?.value || 50;
  const previousValue = data[data.length - 2]?.value || currentValue;
  const weekAgoValue = data[0]?.value || currentValue;
  const weekChange = currentValue - weekAgoValue;
  const dayChange = currentValue - previousValue;

  if (compact && !expanded) {
    return (
      <div 
        className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(true)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">F&G History</span>
          </div>
          <div className="flex items-center gap-2">
            <span 
              className="text-sm font-bold"
              style={{ color: getColorForValue(currentValue) }}
            >
              {currentValue}
            </span>
            {weekChange > 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : weekChange < 0 ? (
              <TrendingDown className="w-4 h-4 text-red-500" />
            ) : (
              <Minus className="w-4 h-4 text-gray-400" />
            )}
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Fear & Greed History</h3>
          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
            {days} days
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchHistory}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {compact && (
            <button 
              onClick={() => setExpanded(false)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronUp className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Today:</span>
          <span 
            className="text-sm font-bold"
            style={{ color: getColorForValue(currentValue) }}
          >
            {currentValue}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">24h:</span>
          <span className={`text-sm font-medium ${dayChange > 0 ? 'text-green-600' : dayChange < 0 ? 'text-red-600' : 'text-gray-600'}`}>
            {dayChange > 0 ? '+' : ''}{dayChange}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{days}d:</span>
          <span className={`text-sm font-medium ${weekChange > 0 ? 'text-green-600' : weekChange < 0 ? 'text-red-600' : 'text-gray-600'}`}>
            {weekChange > 0 ? '+' : ''}{weekChange}
          </span>
          {weekChange > 0 ? (
            <TrendingUp className="w-3.5 h-3.5 text-green-500" />
          ) : weekChange < 0 ? (
            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
          ) : (
            <Minus className="w-3.5 h-3.5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="p-4">
        <svg 
          viewBox={`0 0 ${data.length * 40 + padding.left + padding.right} ${chartHeight}`}
          className="w-full"
          style={{ height: chartHeight }}
        >
          {/* Grid lines */}
          <line 
            x1={padding.left} y1={yScale(75)} 
            x2={data.length * 40 + padding.left} y2={yScale(75)}
            stroke="#dcfce7" strokeWidth="1" strokeDasharray="4,4"
          />
          <line 
            x1={padding.left} y1={yScale(50)} 
            x2={data.length * 40 + padding.left} y2={yScale(50)}
            stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4,4"
          />
          <line 
            x1={padding.left} y1={yScale(25)} 
            x2={data.length * 40 + padding.left} y2={yScale(25)}
            stroke="#fee2e2" strokeWidth="1" strokeDasharray="4,4"
          />

          {/* Area fill with gradient */}
          <defs>
            <linearGradient id="fgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={getColorForValue(currentValue)} stopOpacity="0.3" />
              <stop offset="100%" stopColor={getColorForValue(currentValue)} stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Area path */}
          {data.length > 1 && (
            <path
              d={`
                M ${padding.left + 20} ${yScale(data[0].value)}
                ${data.map((d, i) => `L ${padding.left + 20 + i * 40} ${yScale(d.value)}`).join(' ')}
                L ${padding.left + 20 + (data.length - 1) * 40} ${chartHeight - padding.bottom}
                L ${padding.left + 20} ${chartHeight - padding.bottom}
                Z
              `}
              fill="url(#fgGradient)"
            />
          )}

          {/* Line */}
          {data.length > 1 && (
            <path
              d={`
                M ${padding.left + 20} ${yScale(data[0].value)}
                ${data.map((d, i) => `L ${padding.left + 20 + i * 40} ${yScale(d.value)}`).join(' ')}
              `}
              fill="none"
              stroke={getColorForValue(currentValue)}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Points */}
          {data.map((d, i) => (
            <g key={i}>
              <circle
                cx={padding.left + 20 + i * 40}
                cy={yScale(d.value)}
                r="4"
                fill={getColorForValue(d.value)}
                stroke="white"
                strokeWidth="2"
              />
              {/* Value label */}
              <text
                x={padding.left + 20 + i * 40}
                y={yScale(d.value) - 8}
                textAnchor="middle"
                fontSize="10"
                fill={getColorForValue(d.value)}
                fontWeight="600"
              >
                {d.value}
              </text>
              {/* Date label */}
              <text
                x={padding.left + 20 + i * 40}
                y={chartHeight - 5}
                textAnchor="middle"
                fontSize="9"
                fill="#9ca3af"
              >
                {formatDate(d.date)}
              </text>
            </g>
          ))}
        </svg>

        {/* Legend */}
        <div className="mt-3 flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: FG_COLORS.EXTREME_FEAR }}></span>
            <span className="text-gray-500">Extreme Fear</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: FG_COLORS.FEAR }}></span>
            <span className="text-gray-500">Fear</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: FG_COLORS.NEUTRAL }}></span>
            <span className="text-gray-500">Neutral</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: FG_COLORS.GREED }}></span>
            <span className="text-gray-500">Greed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
