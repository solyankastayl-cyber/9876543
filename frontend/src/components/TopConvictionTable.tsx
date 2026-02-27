/**
 * TopConvictionTable — Multi-Asset Ranking (Block B)
 * 
 * Displays ranked assets by conviction score with two lists:
 * - Strong BUYs (top 5)
 * - Strong SELLs (top 5)
 * 
 * Features:
 * - Click-to-switch: clicking a row updates the main chart
 * - Compact design without rainbow colors
 * - Real-time updates from rankings API
 */

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, AlertTriangle } from 'lucide-react';

// Type definitions matching backend rankings.service.ts
interface RankingItem {
  symbol: string;
  price: number;
  action: 'BUY' | 'SELL' | 'HOLD' | 'AVOID';
  horizon: '1D' | '7D' | '30D';
  adjustedConfidence: number;
  rawConfidence: number;
  expectedMovePct: number;
  convictionScore: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  health: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  drivers: {
    exchange: number;
    onchain: number;
    sentiment: number;
  };
  topSignals: Array<{ key: string; impact: number }>;
  updatedAt: string;
}

interface RankingsResponse {
  ok: boolean;
  generatedAt: string;
  horizon: string;
  universe: string;
  count: number;
  items: RankingItem[];
  buys: RankingItem[];
  sells: RankingItem[];
  computeMs: number;
}

interface TopConvictionTableProps {
  horizon?: '1D' | '7D' | '30D';
  onSelectSymbol?: (symbol: string) => void;
  selectedSymbol?: string;
  compact?: boolean;
}

// Risk badge colors
const RISK_COLORS: Record<string, string> = {
  LOW: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-orange-100 text-orange-700',
  EXTREME: 'bg-red-100 text-red-700',
};

// Action badge styles
const ACTION_STYLES: Record<string, { bg: string; text: string; icon: any }> = {
  BUY: { bg: 'bg-green-500', text: 'text-white', icon: TrendingUp },
  SELL: { bg: 'bg-red-500', text: 'text-white', icon: TrendingDown },
  HOLD: { bg: 'bg-gray-400', text: 'text-white', icon: null },
  AVOID: { bg: 'bg-red-700', text: 'text-white', icon: AlertTriangle },
};

export default function TopConvictionTable({ 
  horizon = '1D', 
  onSelectSymbol, 
  selectedSymbol,
  compact = false 
}: TopConvictionTableProps) {
  const [data, setData] = useState<RankingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch rankings data
  useEffect(() => {
    async function fetchRankings() {
      try {
        setLoading(true);
        const apiUrl = process.env.REACT_APP_BACKEND_URL || '';
        const response = await fetch(
          `${apiUrl}/api/market/rankings/top?horizon=${horizon}&limit=20`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err: any) {
        console.error('[TopConviction] Fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchRankings();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchRankings, 60000);
    return () => clearInterval(interval);
  }, [horizon]);

  // Handle row click
  const handleRowClick = (symbol: string) => {
    if (onSelectSymbol) {
      onSelectSymbol(symbol);
    }
  };

  // Loading state
  if (loading && !data) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4" data-testid="top-conviction-table">
        <div className="flex items-center gap-2 text-gray-500">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading rankings...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4" data-testid="top-conviction-table">
        <div className="text-sm text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4" data-testid="top-conviction-table">
        <div className="text-sm text-gray-400 text-center py-4">
          No ranking data available. Cache is warming up...
        </div>
      </div>
    );
  }

  // Split items into BUYs and SELLs (or use pre-split from API)
  const buys = data.buys.length > 0 
    ? data.buys 
    : data.items.filter(i => i.action === 'BUY').slice(0, 5);
  
  const sells = data.sells.length > 0 
    ? data.sells 
    : data.items.filter(i => i.action === 'SELL').slice(0, 5);

  // All items for full view
  const allItems = data.items.slice(0, 10);

  return (
    <div 
      className="bg-white rounded-xl border border-gray-200 overflow-hidden"
      data-testid="top-conviction-table"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Top Conviction Signals
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {data.count} assets • {horizon}
          </span>
          {loading && <RefreshCw className="w-3 h-3 animate-spin text-gray-400" />}
        </div>
      </div>

      {/* Two-column layout for BUYs and SELLs */}
      {compact ? (
        // Compact: single table
        <RankingTable 
          items={allItems} 
          selectedSymbol={selectedSymbol}
          onRowClick={handleRowClick}
          compact
        />
      ) : (
        // Full: two separate tables
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
          {/* Strong BUYs */}
          <div>
            <div className="px-4 py-2 bg-green-50 text-xs font-medium text-green-700">
              Strong BUYs
            </div>
            <RankingTable 
              items={buys} 
              selectedSymbol={selectedSymbol}
              onRowClick={handleRowClick}
              compact
            />
            {buys.length === 0 && (
              <div className="px-4 py-3 text-xs text-gray-400 text-center">
                No strong BUY signals
              </div>
            )}
          </div>

          {/* Strong SELLs */}
          <div>
            <div className="px-4 py-2 bg-red-50 text-xs font-medium text-red-700">
              Strong SELLs
            </div>
            <RankingTable 
              items={sells} 
              selectedSymbol={selectedSymbol}
              onRowClick={handleRowClick}
              compact
            />
            {sells.length === 0 && (
              <div className="px-4 py-3 text-xs text-gray-400 text-center">
                No strong SELL signals
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
        <div className="text-xs text-gray-400">
          Updated: {new Date(data.generatedAt).toLocaleTimeString()} • 
          Click to view chart
        </div>
      </div>
    </div>
  );
}

/**
 * Ranking table component (reusable for BUYs/SELLs/All)
 */
function RankingTable({ 
  items, 
  selectedSymbol, 
  onRowClick,
  compact 
}: {
  items: RankingItem[];
  selectedSymbol?: string;
  onRowClick: (symbol: string) => void;
  compact?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <table className="w-full text-sm">
      <thead className="text-xs text-gray-500 bg-gray-50">
        <tr>
          <th className="px-4 py-2 text-left font-medium">Symbol</th>
          <th className="px-2 py-2 text-right font-medium">Conf</th>
          <th className="px-2 py-2 text-right font-medium">Move</th>
          <th className="px-2 py-2 text-center font-medium">Risk</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, idx) => {
          const isSelected = selectedSymbol === item.symbol;
          const ActionIcon = ACTION_STYLES[item.action]?.icon;

          return (
            <tr
              key={item.symbol}
              onClick={() => onRowClick(item.symbol)}
              className={`
                cursor-pointer transition-colors border-t border-gray-50
                ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}
              `}
              data-testid={`ranking-row-${item.symbol}`}
            >
              {/* Symbol + Action */}
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">
                    {item.symbol}
                  </span>
                  <span className={`
                    px-1.5 py-0.5 rounded text-xs font-medium
                    ${ACTION_STYLES[item.action]?.bg} ${ACTION_STYLES[item.action]?.text}
                  `}>
                    {item.action}
                  </span>
                </div>
              </td>

              {/* Confidence */}
              <td className="px-2 py-2 text-right">
                <span className="font-medium text-gray-700">
                  {Math.round(item.adjustedConfidence * 100)}%
                </span>
              </td>

              {/* Expected Move */}
              <td className="px-2 py-2 text-right">
                <span className={`font-medium ${
                  item.expectedMovePct >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {item.expectedMovePct >= 0 ? '+' : ''}
                  {item.expectedMovePct.toFixed(1)}%
                </span>
              </td>

              {/* Risk */}
              <td className="px-2 py-2 text-center">
                <span className={`
                  px-2 py-0.5 rounded text-xs font-medium
                  ${RISK_COLORS[item.risk] || 'bg-gray-100 text-gray-600'}
                `}>
                  {item.risk}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export { TopConvictionTable };
