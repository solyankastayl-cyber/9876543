/**
 * WalletActivitySnapshot - КЛЮЧЕВОЙ УТЕРЯННЫЙ БЛОК (Section 2)
 * 
 * CONTRACT:
 * - ВСЕГДА рендерится когда status === 'completed'
 * - Показывает ЧТО было проверено системой
 * - Даже если всё = 0, это ВАЛИДНЫЙ результат
 * - Никаких spinner'ов после completed
 * 
 * Метрики:
 * - Total Inflow (24h)
 * - Total Outflow (24h)
 * - Net Flow
 * - Transfers Count
 * - Active Tokens
 * - Analyzed Time Window
 */
import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Coins,
  ArrowLeftRight,
  Clock,
  Activity
} from 'lucide-react';

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
const NetFlowCard = ({ netFlow, inflow, outflow }) => {
  const isPositive = netFlow >= 0;
  const hasData = netFlow !== null && netFlow !== undefined;
  
  return (
    <div className="p-3 bg-gray-50 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        {isPositive ? (
          <ArrowUpRight className="w-4 h-4 text-emerald-500" />
        ) : (
          <ArrowDownRight className="w-4 h-4 text-red-500" />
        )}
        <span className="text-xs font-medium text-gray-600">Net Flow</span>
      </div>
      <div className={`text-xl font-bold ${
        !hasData ? 'text-gray-900' :
        isPositive ? 'text-emerald-600' : 'text-red-600'
      }`}>
        {hasData ? (
          <>
            {isPositive ? '+' : ''}{formatUSD(netFlow)}
          </>
        ) : '0'}
      </div>
      <div className="text-xs text-gray-500 mt-0.5">24h change</div>
    </div>
  );
};

/**
 * Inflow Card
 */
const InflowCard = ({ inflow, timeWindow = '24h' }) => (
  <div className="p-3 bg-gray-50 rounded-xl">
    <div className="flex items-center gap-2 mb-2">
      <ArrowUpRight className="w-4 h-4 text-emerald-500" />
      <span className="text-xs font-medium text-gray-600">Total Inflow</span>
    </div>
    <div className="text-xl font-bold text-emerald-600">
      {formatUSD(inflow ?? 0)}
    </div>
    <div className="text-xs text-gray-500 mt-0.5">{timeWindow} received</div>
  </div>
);

/**
 * Outflow Card
 */
const OutflowCard = ({ outflow, timeWindow = '24h' }) => (
  <div className="p-3 bg-gray-50 rounded-xl">
    <div className="flex items-center gap-2 mb-2">
      <ArrowDownRight className="w-4 h-4 text-red-500" />
      <span className="text-xs font-medium text-gray-600">Total Outflow</span>
    </div>
    <div className="text-xl font-bold text-red-600">
      {formatUSD(outflow ?? 0)}
    </div>
    <div className="text-xs text-gray-500 mt-0.5">{timeWindow} sent</div>
  </div>
);

/**
 * WalletActivitySnapshot Component
 * 
 * ALWAYS renders when status === 'completed'
 * Shows what the system checked, even if results are empty
 * 
 * NEW: Fetches from /api/wallets/:address/activity-snapshot API
 */
export default function WalletActivitySnapshot({ 
  walletAddress,
  walletData, 
  walletProfile,
  timeWindow = '24h',
  className = '' 
}) {
  const [apiData, setApiData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  
  // Fetch from new API
  React.useEffect(() => {
    async function fetchSnapshot() {
      if (!walletAddress) return;
      
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/wallets/${walletAddress}/activity-snapshot?window=${timeWindow}`
        );
        const data = await response.json();
        if (data?.ok && data?.data) {
          setApiData(data.data);
        }
      } catch (err) {
        console.error('Failed to load wallet activity:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchSnapshot();
  }, [walletAddress, timeWindow]);
  
  // Use API data if available, otherwise fall back to props
  const activity = apiData?.activity || {};
  const interpretation = apiData?.interpretation || {};
  const analysisStatus = apiData?.analysisStatus;
  
  // Extract metrics - prioritize API data
  const inflow = activity.inflowUsd ?? walletData?.stats?.inflow ?? 0;
  const outflow = activity.outflowUsd ?? walletData?.stats?.outflow ?? 0;
  const netFlow = activity.netFlowUsd ?? (inflow - outflow);
  const transfers = activity.transfers ?? walletData?.stats?.transfers ?? 0;
  const activeTokens = activity.activeTokens ?? walletData?.stats?.activeTokens ?? 0;
  
  // Determine if we have ANY activity
  const hasAnyActivity = inflow > 0 || outflow > 0 || transfers > 0;
  
  return (
    <div 
      className={`bg-white border border-gray-200 rounded-xl p-4 ${className}`}
      data-testid="wallet-activity-snapshot"
    >
      {/* Header with Checked badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm font-semibold text-gray-900">Wallet Activity Snapshot</h3>
        </div>
        <div className="flex items-center gap-2">
          {analysisStatus === 'completed' && (
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Checked</span>
          )}
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            {timeWindow} window
          </span>
        </div>
      </div>
      
      {/* Interpretation Banner */}
      {interpretation.headline && (
        <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
          <p className="text-sm font-medium text-blue-800">{interpretation.headline}</p>
          {interpretation.description && (
            <p className="text-xs text-blue-600 mt-1">{interpretation.description}</p>
          )}
        </div>
      )}
      
      {/* Metrics Grid - ALWAYS shown */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        {/* Inflow */}
        <InflowCard inflow={inflow} timeWindow={timeWindow} />
        
        {/* Outflow */}
        <OutflowCard outflow={outflow} timeWindow={timeWindow} />
        
        {/* Net Flow */}
        <NetFlowCard 
          netFlow={netFlow}
          inflow={inflow}
          outflow={outflow}
        />
        
        {/* Transfers */}
        <MetricCard
          icon={ArrowLeftRight}
          label="Transfers"
          value={formatNumber(transfers)}
          subValue={`${timeWindow} transactions`}
        />
        
        {/* Active Tokens */}
        <MetricCard
          icon={Coins}
          label="Active Tokens"
          value={formatNumber(activeTokens)}
          subValue="tokens interacted"
        />
        
        {/* Analyzed Window */}
        <MetricCard
          icon={Clock}
          label="Analyzed Window"
          value={timeWindow === '24h' ? 'Last 24 hours' : timeWindow === '7d' ? 'Last 7 days' : 'Last 30 days'}
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
            We analyzed on-chain transfers for this wallet and detected activity in the selected time window.
            {transfers > 0 && ` ${formatNumber(transfers)} transactions recorded.`}
          </p>
        ) : (
          <p className="text-xs text-gray-600">
            <span className="font-medium">Analysis complete.</span>{' '}
            We analyzed recent on-chain transfers for this wallet but found no activity in the selected time window.
            This is a valid result — the wallet may be dormant or newly created.
          </p>
        )}
      </div>
    </div>
  );
}
