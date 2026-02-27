/**
 * FlowAnomaliesChart - Real Data Version
 * 
 * Shows z-score deviations from backend API.
 * If no data - displays honest EmptyState.
 */
import { useState, useEffect, useCallback } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { marketApi } from '../api';

const METRICS_CONFIG = [
  { id: 'netFlow', label: 'NF', name: 'Net Flow', color: '#8B5CF6' },
  { id: 'price', label: 'PR', name: 'Price', color: '#10B981' },
  { id: 'volume', label: 'VOL', name: 'Volume', color: '#F59E0B' },
];

export default function FlowAnomaliesChart({ asset = '0x0000000000000000000000000000000000000000' }) {
  const [selectedMetrics, setSelectedMetrics] = useState(METRICS_CONFIG);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [indexingStatus, setIndexingStatus] = useState('loading');
  const [timeframe, setTimeframe] = useState('7d');

  const loadAnomalies = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await marketApi.getFlowAnomalies(asset, 'ethereum', timeframe);
      
      if (response?.ok && response.data) {
        const { dataPoints, hasData, indexingStatus: status } = response.data;
        
        setIndexingStatus(status);
        
        if (hasData && dataPoints?.length > 0) {
          // Transform data for chart
          const chartData = dataPoints.map(point => ({
            day: point.label,
            ...METRICS_CONFIG.reduce((acc, metric) => {
              acc[metric.id] = point[metric.id];
              return acc;
            }, {})
          }));
          setData(chartData);
        } else {
          setData([]);
        }
      } else {
        setError(response?.error || 'Failed to load anomaly data');
      }
    } catch (err) {
      console.error('Failed to load flow anomalies:', err);
      setError('Failed to connect to backend');
    } finally {
      setLoading(false);
    }
  }, [asset, timeframe]);

  useEffect(() => {
    loadAnomalies();
  }, [loadAnomalies]);

  const removeMetric = (metricId) => {
    if (selectedMetrics.length > 1) {
      setSelectedMetrics(selectedMetrics.filter(m => m.id !== metricId));
    }
  };

  const addMetric = (metric) => {
    if (!selectedMetrics.find(m => m.id === metric.id)) {
      setSelectedMetrics([...selectedMetrics, metric]);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-2xl border-2 border-gray-200 shadow-lg">
          <p className="text-xs font-semibold text-gray-700 mb-2">{label}</p>
          {payload.map((entry, index) => {
            const metric = selectedMetrics.find(m => m.id === entry.dataKey);
            const value = entry.value?.toFixed(2) || 'N/A';
            const isValid = entry.value !== null && entry.value !== undefined;
            return (
              <div key={index} className="flex items-center justify-between gap-3 mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-xs font-medium text-gray-700">{metric?.name}</span>
                </div>
                {isValid ? (
                  <span className={`text-xs font-bold ${parseFloat(value) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {parseFloat(value) >= 0 ? '+' : ''}{value}σ
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">No data</span>
                )}
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-4" data-testid="flow-anomalies-loading">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Flow Anomalies</h3>
        </div>
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-4" data-testid="flow-anomalies-error">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Flow Anomalies</h3>
        </div>
        <div className="h-64 flex flex-col items-center justify-center text-gray-500">
          <AlertCircle className="w-8 h-8 mb-2 text-red-400" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // No data state - Honest EmptyState
  if (data.length === 0 || indexingStatus === 'no_data') {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-4" data-testid="flow-anomalies-empty">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Flow Anomalies</h3>
          <span className="text-xs text-gray-400">Z-score deviations</span>
        </div>
        <div className="h-64 flex flex-col items-center justify-center text-center px-4">
          <div className="p-3 bg-gray-100 rounded-2xl mb-3">
            <AlertCircle className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">No anomalies detected yet</p>
          <p className="text-xs text-gray-500 max-w-xs">
            {indexingStatus === 'indexing' 
              ? 'System is indexing on-chain activity. Anomalies will appear once sufficient data is collected.'
              : 'Flow anomalies appear when market metrics deviate significantly from historical norms.'}
          </p>
        </div>
      </div>
    );
  }

  // Data available - Show real chart
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-3" data-testid="flow-anomalies-chart">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Flow Anomalies</h3>
        <div className="flex items-center gap-2">
          <select 
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
          >
            <option value="7d">7 days</option>
            <option value="14d">14 days</option>
            <option value="30d">30 days</option>
          </select>
          <span className="text-xs text-gray-500">Z-score deviations</span>
        </div>
      </div>

      {/* Metric selector pills */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {selectedMetrics.map(metric => (
          <div 
            key={metric.id}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: metric.color }} />
            <span className="text-xs font-medium text-gray-700">{metric.label} {metric.name}</span>
            {selectedMetrics.length > 1 && (
              <button
                onClick={() => removeMetric(metric.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        {/* Add metric buttons */}
        {METRICS_CONFIG.filter(m => !selectedMetrics.find(s => s.id === m.id)).map(metric => (
          <button
            key={metric.id}
            onClick={() => addMetric(metric)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
          >
            + {metric.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="day" 
              tick={{ fontSize: 11, fill: '#6B7280' }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#6B7280' }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
              tickFormatter={(value) => `${value.toFixed(1)}σ`}
              domain={[-3, 3]}
              ticks={[-3, -1.5, 0, 1.5, 3]}
            />
            <ReferenceLine y={0} stroke="#9CA3AF" strokeDasharray="3 3" />
            <ReferenceLine y={2} stroke="#EF4444" strokeDasharray="3 3" strokeOpacity={0.5} />
            <ReferenceLine y={-2} stroke="#EF4444" strokeDasharray="3 3" strokeOpacity={0.5} />
            <Tooltip content={<CustomTooltip />} />
            
            {selectedMetrics.map(metric => (
              <Line
                key={metric.id}
                type="monotone"
                dataKey={metric.id}
                stroke={metric.color}
                strokeWidth={2}
                dot={{ r: 4, fill: metric.color, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: metric.color }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          {selectedMetrics.map(metric => (
            <div key={metric.id} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: metric.color }} />
              <span className="text-xs font-medium text-gray-600">{metric.name}</span>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-400">
          |σ| &gt; 2 = anomaly
        </div>
      </div>
    </div>
  );
}
