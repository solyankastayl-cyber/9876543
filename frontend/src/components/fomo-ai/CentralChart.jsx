/**
 * Central Chart — Price vs Prediction
 * 
 * ECharts-based chart showing:
 * - Real price line
 * - Prediction line (combined or by layer)
 * - Event markers (BUY/SELL/AVOID)
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import { format } from 'date-fns';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const LAYER_COLORS = {
  price: '#3B82F6',      // Blue
  combined: '#10B981',   // Green
  exchange: '#F59E0B',   // Amber
  onchain: '#8B5CF6',    // Purple
  sentiment: '#EC4899',  // Pink
};

const EVENT_COLORS = {
  BUY: '#10B981',
  SELL: '#EF4444',
  AVOID: '#6B7280',
};

export function CentralChart({ 
  symbol = 'BTCUSDT',
  range = '7d',
  tf = '1h',
  visibleLayers = ['price', 'combined'],
  onDataLoad,
}) {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const chartRef = useRef(null);
  const isMounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      // Dispose chart instance safely
      if (chartRef.current) {
        const instance = chartRef.current.getEchartsInstance?.();
        if (instance && !instance.isDisposed?.()) {
          try {
            instance.dispose();
          } catch (e) {
            // Ignore dispose errors
          }
        }
      }
    };
  }, []);

  // Store callback ref to avoid dependency issues
  const onDataLoadRef = useRef(onDataLoad);
  onDataLoadRef.current = onDataLoad;

  const fetchChartData = useCallback(async () => {
    if (!isMounted.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('[CentralChart] Fetching data from new endpoint...');
      const asset = symbol.replace('USDT', '');
      const res = await fetch(
        `${API_URL}/api/market/chart/price-vs-expectation?asset=${asset}&range=${range}&tf=${tf}`
      );
      const json = await res.json();
      console.log('[CentralChart] Response:', json.ok, 'price points:', json.price?.length, 'predictions:', json.layers?.exchange?.predictions?.length);
      
      if (!isMounted.current) return;
      
      if (json.ok) {
        // Transform new API format to existing chart format
        const lastPrice = json.price[json.price.length - 1]?.c || 0;
        const firstPrice = json.price[0]?.c || 0;
        const priceChange = lastPrice - firstPrice;
        const priceChangePercent = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0;
        
        const transformedData = {
          price: {
            points: json.price.map(p => ({
              ts: p.t,
              price: p.c,
              volume: p.v,
            })),
            meta: {
              lastPrice,
              priceChange,
              priceChangePercent,
            }
          },
          prediction: {
            points: json.layers?.exchange?.predictions?.map(p => ({
              ts: p.t,
              combined: p.confidence,
              exchange: p.confidence,
              onchain: 0.5,
              sentiment: 0.5,
              direction: p.direction === 'UP' ? 'BULLISH' : p.direction === 'DOWN' ? 'BEARISH' : 'NEUTRAL',
              combinedConfidence: p.confidence,
            })) || [],
          },
          events: {
            points: [],
            meta: {
              buyCount: json.signalChanges?.buy || 0,
              sellCount: json.signalChanges?.sell || 0,
              avoidCount: json.signalChanges?.avoid || 0,
            }
          },
          accuracy: {
            directionAccuracy: json.metrics?.directionMatch || 0,
            hitRate: json.metrics?.hitRate || 0,
            avgDeviation: json.metrics?.avgDeviationPct || 0,
            sampleCount: json.metrics?.sampleCount || 0,
          },
          topDrivers: json.topDrivers || { exchange: 0, onchain: 0, sentiment: 0 },
          meta: {
            dataSource: json.flags?.dataSource || 'unknown',
            onchainEnabled: json.flags?.onchainEnabled || false,
            sentimentEnabled: json.flags?.sentimentEnabled || false,
          },
        };
        
        setChartData(transformedData);
        onDataLoadRef.current?.(transformedData);
      } else {
        setError(json.message || 'Failed to load chart data');
      }
    } catch (err) {
      console.error('[CentralChart] Error:', err);
      if (isMounted.current) {
        setError(err.message);
      }
    } finally {
      if (isMounted.current) {
        console.log('[CentralChart] Setting loading=false');
        setLoading(false);
      }
    }
  }, [symbol, range, tf]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-xl" data-testid="chart-loading">
        <div className="text-gray-500">Loading chart...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-red-50 rounded-xl" data-testid="chart-error">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-xl" data-testid="chart-no-data">
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  // Prepare data
  const pricePoints = chartData.price?.points || [];
  const predPoints = chartData.prediction?.points || [];
  const events = chartData.events?.events || [];
  
  // Check if we have valid data
  if (pricePoints.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-xl" data-testid="chart-empty">
        <div className="text-gray-500">No price data available</div>
      </div>
    );
  }
  
  // Timestamps
  const timestamps = pricePoints.map(p => p.ts);
  
  // Price data
  const priceData = pricePoints.map(p => p.price);
  
  // Get base price for prediction scaling
  const basePrice = priceData[0] || 1;
  
  // Prediction data (scaled to price-like)
  const combinedData = predPoints.map((p, idx) => {
    const refPrice = priceData[idx] || basePrice;
    // Score 0.5 = neutral, deviation based on score
    const deviation = (p.combined - 0.5) * 2 * 0.03; // 3% max
    return refPrice * (1 + deviation);
  });
  
  const exchangeData = predPoints.map((p, idx) => {
    const refPrice = priceData[idx] || basePrice;
    const deviation = (p.exchange - 0.5) * 2 * 0.03;
    return refPrice * (1 + deviation);
  });
  
  const onchainData = predPoints.map((p, idx) => {
    const refPrice = priceData[idx] || basePrice;
    const deviation = (p.onchain - 0.5) * 2 * 0.03;
    return refPrice * (1 + deviation);
  });
  
  const sentimentData = predPoints.map((p, idx) => {
    const refPrice = priceData[idx] || basePrice;
    const deviation = (p.sentiment - 0.5) * 2 * 0.03;
    return refPrice * (1 + deviation);
  });

  // Event markers
  const markPoints = events.map(e => ({
    xAxis: e.ts,
    yAxis: priceData[timestamps.indexOf(e.ts)] || basePrice,
    symbol: e.type === 'BUY' ? 'triangle' : e.type === 'SELL' ? 'triangle' : 'circle',
    symbolRotate: e.type === 'SELL' ? 180 : 0,
    symbolSize: 12,
    itemStyle: {
      color: EVENT_COLORS[e.type],
    },
    label: {
      show: false,
    },
  }));

  // ECharts options
  const options = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#E5E7EB',
      borderWidth: 1,
      textStyle: {
        color: '#1F2937',
      },
      formatter: (params) => {
        if (!params.length) return '';
        const ts = Number(params[0].axisValue);
        if (isNaN(ts) || ts <= 0) return '';
        const date = format(new Date(ts), 'MMM dd, HH:mm');
        
        let html = `<div class="font-medium">${date}</div>`;
        params.forEach(p => {
          const value = typeof p.value === 'number' ? p.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : p.value;
          html += `<div class="flex justify-between gap-4">
            <span style="color:${p.color}">${p.seriesName}</span>
            <span class="font-medium">${value}</span>
          </div>`;
        });
        return html;
      },
    },
    legend: {
      show: true,
      top: 10,
      right: 10,
      textStyle: {
        color: '#6B7280',
      },
    },
    grid: {
      top: 60,
      left: 60,
      right: 40,
      bottom: 80,
    },
    xAxis: {
      type: 'category',
      data: timestamps,
      axisLabel: {
        formatter: (val) => {
          const ts = Number(val);
          if (isNaN(ts) || ts <= 0) return '';
          try {
            return format(new Date(ts), 'MMM dd');
          } catch {
            return '';
          }
        },
        color: '#9CA3AF',
      },
      axisLine: {
        lineStyle: { color: '#E5E7EB' },
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (val) => val.toLocaleString(undefined, { maximumFractionDigits: 0 }),
        color: '#9CA3AF',
      },
      splitLine: {
        lineStyle: { color: '#F3F4F6' },
      },
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100,
      },
      {
        type: 'slider',
        start: 0,
        end: 100,
        bottom: 20,
        height: 30,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
        fillerColor: 'rgba(59, 130, 246, 0.1)',
        handleStyle: {
          color: '#3B82F6',
        },
      },
    ],
    series: [
      // Real Price
      visibleLayers.includes('price') && {
        name: 'Real Price',
        type: 'line',
        data: priceData,
        symbol: 'none',
        lineStyle: {
          color: LAYER_COLORS.price,
          width: 2,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.2)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0)' },
            ],
          },
        },
        markPoint: {
          data: markPoints,
        },
      },
      // Combined Prediction
      visibleLayers.includes('combined') && {
        name: 'Prediction',
        type: 'line',
        data: combinedData,
        symbol: 'none',
        lineStyle: {
          color: LAYER_COLORS.combined,
          width: 2,
          type: 'dashed',
        },
      },
      // Exchange Layer
      visibleLayers.includes('exchange') && {
        name: 'Exchange',
        type: 'line',
        data: exchangeData,
        symbol: 'none',
        lineStyle: {
          color: LAYER_COLORS.exchange,
          width: 1.5,
          type: 'dotted',
        },
      },
      // Onchain Layer
      visibleLayers.includes('onchain') && {
        name: 'Onchain',
        type: 'line',
        data: onchainData,
        symbol: 'none',
        lineStyle: {
          color: LAYER_COLORS.onchain,
          width: 1.5,
          type: 'dotted',
        },
      },
      // Sentiment Layer
      visibleLayers.includes('sentiment') && {
        name: 'Sentiment',
        type: 'line',
        data: sentimentData,
        symbol: 'none',
        lineStyle: {
          color: LAYER_COLORS.sentiment,
          width: 1.5,
          type: 'dotted',
        },
      },
    ].filter(Boolean),
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" data-testid="central-chart">
      <ReactECharts
        ref={chartRef}
        option={options}
        style={{ height: '400px', width: '100%' }}
        opts={{ renderer: 'svg' }}
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  );
}

export default CentralChart;
