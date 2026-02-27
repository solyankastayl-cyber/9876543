/**
 * ExchangePressureCard - P1.3 Market Analytics
 * 
 * Displays CEX inflow/outflow pressure with BUY/SELL signals.
 */

import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Building2 } from 'lucide-react';
import { api } from '../api/client';

// Signal styling
const SIGNAL_STYLES = {
  STRONG_BUY: { color: 'text-green-600', bg: 'bg-green-50', icon: TrendingUp, label: 'Strong Buy' },
  BUY: { color: 'text-green-600', bg: 'bg-green-50', icon: TrendingUp, label: 'Buy' },
  NEUTRAL: { color: 'text-gray-600', bg: 'bg-gray-500/10', icon: Minus, label: 'Neutral' },
  SELL: { color: 'text-red-600', bg: 'bg-red-50', icon: TrendingDown, label: 'Sell' },
  STRONG_SELL: { color: 'text-red-600', bg: 'bg-red-50', icon: TrendingDown, label: 'Strong Sell' },
};

// Format number
function formatNumber(n) {
  if (n === null || n === undefined) return '-';
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toString();
}

// Exchange row component
function ExchangeRow({ exchange }) {
  const style = SIGNAL_STYLES[exchange.signal] || SIGNAL_STYLES.NEUTRAL;
  const Icon = style.icon;
  const total = exchange.inflow + exchange.outflow;
  
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">{exchange.exchange}</span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-green-600">↓{formatNumber(exchange.inflow)}</span>
            <span className="text-gray-600">/</span>
            <span className="text-red-600">↑{formatNumber(exchange.outflow)}</span>
          </div>
        </div>
        
        <div className={`flex items-center gap-1 px-2 py-1 rounded ${style.bg}`}>
          <Icon className={`w-3 h-3 ${style.color}`} />
          <span className={`text-xs font-semibold ${style.color}`}>
            {exchange.pressure > 0 ? '+' : ''}{(exchange.pressure * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ExchangePressureCard({ network = 'ethereum', window = '24h' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/market/exchange-pressure?network=${network}&window=${window}`);
      if (response.data?.ok) {
        setData(response.data.data);
        setError(null);
      } else {
        setError(response.data?.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [network, window]);
  
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchData]);
  
  if (loading && !data) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-100 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            <div className="h-10 bg-gray-100 rounded" />
            <div className="h-10 bg-gray-100 rounded" />
            <div className="h-10 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white rounded-xl p-6 border border-red-200">
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }
  
  const aggStyle = data?.aggregate ? (SIGNAL_STYLES[data.aggregate.signal] || SIGNAL_STYLES.NEUTRAL) : SIGNAL_STYLES.NEUTRAL;
  const AggIcon = aggStyle.icon;
  
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Exchange Pressure</h3>
          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded">P1.3</span>
        </div>
        
        <button 
          onClick={fetchData}
          disabled={loading}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {/* Aggregate Signal */}
      {data?.aggregate && (
        <div className={`p-4 rounded-lg mb-4 ${aggStyle.bg}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 mb-1">Overall Signal ({window})</div>
              <div className={`text-2xl font-bold flex items-center gap-2 ${aggStyle.color}`}>
                <AggIcon className="w-6 h-6" />
                {aggStyle.label}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1">Pressure Index</div>
              <div className={`text-2xl font-mono font-bold ${aggStyle.color}`}>
                {data.aggregate.pressure > 0 ? '+' : ''}{(data.aggregate.pressure * 100).toFixed(0)}%
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-500">CEX Deposits</div>
              <div className="text-green-600 font-semibold">{formatNumber(data.aggregate.totalInflow)}</div>
            </div>
            <div>
              <div className="text-gray-500">CEX Withdrawals</div>
              <div className="text-red-600 font-semibold">{formatNumber(data.aggregate.totalOutflow)}</div>
            </div>
            <div>
              <div className="text-gray-500">Net Flow</div>
              <div className={`font-semibold ${data.aggregate.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.aggregate.netFlow >= 0 ? '+' : ''}{formatNumber(data.aggregate.netFlow)}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Exchanges List */}
      <div className="space-y-0">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">By Exchange</div>
        {data?.exchanges?.filter(ex => ex.inflow + ex.outflow > 0).map(ex => (
          <ExchangeRow key={ex.exchange} exchange={ex} />
        ))}
      </div>
      
      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-600">
        <span>Network: {data?.network?.toUpperCase()}</span>
        <span className="mx-2">•</span>
        <span>Window: {window}</span>
        <span className="mx-2">•</span>
        <span>Positive = Sell pressure, Negative = Buy pressure</span>
      </div>
    </div>
  );
}
