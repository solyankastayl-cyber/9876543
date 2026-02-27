/**
 * ActivitySnapshot - КРИТИЧЕСКИ ВАЖНЫЙ БЛОК (Section 2)
 * 
 * CONTRACT:
 * - ВСЕГДА рендерится когда status === 'completed'
 * - Показывает ЧТО было проверено системой
 * - Даже если всё = 0, это ВАЛИДНЫЙ результат
 * - Никаких spinner'ов после completed
 * - Загружает РЕАЛЬНЫЕ данные из indexed transfers
 * 
 * Метрики:
 * - Net Flow (24h)
 * - Inflow / Outflow
 * - Active Wallets (24h)
 * - Transfers Count
 * - Largest Transfer
 * - Time Range analyzed
 */
import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  ArrowLeftRight,
  Clock,
  TrendingUp,
  Activity,
  Loader2
} from 'lucide-react';
import { getTokenActivity } from '../api/market.api';

/**
 * Format large numbers for display
 */
const formatNumber = (num, decimals = 0) => {
  if (num === null || num === undefined) return '—';
  if (num === 0) return '0';
  
  if (Math.abs(num) >= 1e9) {
    return (num / 1e9).toFixed(1) + 'B';
  }
  if (Math.abs(num) >= 1e6) {
    return (num / 1e6).toFixed(1) + 'M';
  }
  if (Math.abs(num) >= 1e3) {
    return (num / 1e3).toFixed(1) + 'K';
  }
  return num.toLocaleString(undefined, { maximumFractionDigits: decimals });
};

/**
 * Format USD value
 */
const formatUSD = (value) => {
  if (value === null || value === undefined) return '—';
  if (value === 0) return '$0';
  
  if (Math.abs(value) >= 1e9) {
    return '$' + (value / 1e9).toFixed(2) + 'B';
  }
  if (Math.abs(value) >= 1e6) {
    return '$' + (value / 1e6).toFixed(2) + 'M';
  }
  if (Math.abs(value) >= 1e3) {
    return '$' + (value / 1e3).toFixed(1) + 'K';
  }
  return '$' + value.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

/**
 * Single Metric Card
 */
const MetricCard = ({ icon: Icon, label, value, subValue, iconColor = 'text-gray-500' }) => (
  <div className="p-3 bg-gray-50 rounded-xl">
    <div className="flex items-center gap-2 mb-2">
      <Icon className={`w-4 h-4 ${iconColor}`} />
      <span className="text-xs font-medium text-gray-600">{label}</span>
    </div>
    <div className="text-xl font-bold text-gray-900">
      {value}
    </div>
    {subValue && (
      <div className="text-xs text-gray-500 mt-0.5">
        {subValue}
      </div>
    )}
  </div>
);

/**
 * Net Flow Card with directional indicator
 */
const NetFlowCard = ({ netFlow, totalVolume, inflowUsd, outflowUsd, direction }) => {
  const isPositive = direction === 'inflow' || (direction === 'neutral' && netFlow >= 0);
  const hasData = netFlow !== null && netFlow !== undefined;
  
  // Direction label
  const directionLabel = direction === 'inflow' ? 'Net Accumulation' :
                         direction === 'outflow' ? 'Net Distribution' :
                         'Balanced';
  
  return (
    <div className="p-3 bg-gray-50 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        {isPositive ? (
          <ArrowUpRight className="w-4 h-4 text-emerald-500" />
        ) : (
          <ArrowDownRight className="w-4 h-4 text-red-500" />
        )}
        <span className="text-xs font-medium text-gray-600">Net Flow (24h)</span>
      </div>
      <div className={`text-xl font-bold ${
        !hasData ? 'text-gray-900' :
        direction === 'inflow' ? 'text-emerald-600' : 
        direction === 'outflow' ? 'text-red-600' : 'text-gray-900'
      }`}>
        {hasData ? (
          <>
            {netFlow >= 0 ? '+' : ''}{formatUSD(netFlow)}
          </>
        ) : '—'}
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
        <span>{directionLabel}</span>
      </div>
      {/* Inflow / Outflow breakdown */}
      {(inflowUsd > 0 || outflowUsd > 0) && (
        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1 pt-1 border-t border-gray-200">
          <span className="text-emerald-600">↑ {formatUSD(inflowUsd)}</span>
          <span>/</span>
          <span className="text-red-500">↓ {formatUSD(outflowUsd)}</span>
        </div>
      )}
    </div>
  );
};

/**
 * ActivitySnapshot Component
 * 
 * ALWAYS renders when status === 'completed'
 * Shows what the system checked, even if results are empty
 * LOADS REAL DATA from indexed transfers
 */
export default function ActivitySnapshot({ 
  tokenAddress,
  marketContext, 
  resolvedData,
  timeWindow = '24h',
  className = '' 
}) {
  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState(null);
  const [error, setError] = useState(null);

  // Load real activity data from backend
  useEffect(() => {
    async function loadActivity() {
      if (!tokenAddress && !resolvedData?.normalizedId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const address = tokenAddress || resolvedData?.normalizedId;
        const response = await getTokenActivity(address, timeWindow);
        
        // DEBUG: Log API response for contract verification
        console.log('[TokenActivity API] Response for', address, ':', response);
        
        // API returns { ok: true, data: {...} }
        // market.api.js returns response.data, so we get { ok: true, data: {...} }
        if (response?.ok && response?.data) {
          setActivityData(response.data);
          console.log('[TokenActivity API] Loaded activity:', response.data);
        } else {
          console.warn('[TokenActivity API] Failed:', response);
          setError('Failed to load activity');
        }
      } catch (err) {
        console.error('[TokenActivity API] Exception:', err);
        setError('Failed to load');
      } finally {
        setLoading(false);
      }
    }
    
    loadActivity();
  }, [tokenAddress, resolvedData?.normalizedId, timeWindow]);
  
  // CONTRACT: Use ONLY API data. No fallback to marketContext (causes stale data bugs)
  // If activityData is null, show loading or error state - don't mask with stale data
  const activity = activityData?.activity || {};
  const flows = activityData?.flows || {};
  const interpretation = activityData?.interpretation || {};
  
  const transfers24h = activity.transfers24h ?? 0;
  const activeWallets = activity.activeWallets ?? 0;
  const largestTransfer = activity.largestTransfer ?? null;
  const largestTransferTx = activity.largestTransferTx ?? null;
  const netFlow = flows.netFlow ?? 0;
  const totalVolume = flows.totalVolume ?? 0;
  const inflowUsd = flows.inflowUsd ?? 0;
  const outflowUsd = flows.outflowUsd ?? 0;
  const flowDirection = flows.direction ?? 'neutral';
  
  // DEBUG: Log what we're rendering
  console.log('[ActivitySnapshot] Rendering:', { 
    transfers24h, 
    activeWallets, 
    largestTransfer, 
    netFlow,
    flowDirection,
    dataSource: activityData?.dataSource 
  });
  
  // Determine if we have ANY activity
  const hasAnyActivity = transfers24h > 0 || activeWallets > 0 || netFlow !== 0;
  
  // Loading state
  if (loading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm font-semibold text-gray-900">Activity Snapshot</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Loading activity data...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={`bg-white border border-gray-200 rounded-xl p-4 ${className}`}
      data-testid="activity-snapshot"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm font-semibold text-gray-900">Activity Snapshot</h3>
        </div>
        <div className="flex items-center gap-2">
          {activityData?.dataSource === 'indexed_transfers' && (
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              Live Data
            </span>
          )}
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            {timeWindow} window
          </span>
        </div>
      </div>
      
      {/* Metrics Grid - ALWAYS shown */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        {/* Net Flow */}
        <NetFlowCard 
          netFlow={netFlow}
          totalVolume={totalVolume}
          inflowUsd={inflowUsd}
          outflowUsd={outflowUsd}
          direction={flowDirection}
        />
        
        {/* Active Wallets */}
        <MetricCard
          icon={Wallet}
          label="Active Wallets"
          value={formatNumber(activeWallets)}
          subValue="unique addresses"
        />
        
        {/* Transfers */}
        <MetricCard
          icon={ArrowLeftRight}
          label="Transfers"
          value={formatNumber(transfers24h)}
          subValue="total transactions"
        />
        
        {/* Largest Transfer - Don't mask null with 0! */}
        <MetricCard
          icon={TrendingUp}
          label="Largest Transfer"
          value={largestTransfer !== null ? formatUSD(largestTransfer) : '—'}
          subValue={largestTransferTx ? `tx: ${largestTransferTx.slice(0, 10)}...` : 'no data'}
        />
        
        {/* Analyzed Window */}
        <MetricCard
          icon={Clock}
          label="Analyzed Window"
          value={timeWindow === '24h' ? 'Last 24h' : timeWindow}
          subValue="time range"
        />
      </div>
      
      {/* Interpretation Footer - CRITICAL for user understanding */}
      <div className={`p-3 rounded-lg ${
        hasAnyActivity 
          ? 'bg-blue-50 border border-blue-100' 
          : 'bg-gray-50 border border-gray-100'
      }`}>
        {hasAnyActivity ? (
          <p className="text-xs text-blue-700">
            <span className="font-medium">Analysis complete.</span>{' '}
            We analyzed on-chain transfers for this token and detected activity in the selected time window.
            {activeWallets > 0 && ` ${formatNumber(activeWallets)} unique wallets participated.`}
            {transfers24h > 0 && ` ${formatNumber(transfers24h)} transfers recorded.`}
          </p>
        ) : (
          <p className="text-xs text-gray-600">
            <span className="font-medium">Analysis complete.</span>{' '}
            We analyzed recent on-chain transfers for this token but detected no activity in the selected time window.
            This is a valid result — the token may have low trading volume or be newly listed.
          </p>
        )}
      </div>
    </div>
  );
}
