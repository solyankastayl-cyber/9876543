/**
 * WalletExplorerPage - P0 MULTICHAIN
 * 
 * Multi-network wallet explorer with:
 * - Network summary cards
 * - Transfer history table
 * - Bridge activity
 * - Top counterparties
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Activity,
  Network,
  RefreshCw,
  Search,
  ExternalLink,
  Clock,
  Users
} from 'lucide-react';
import { NetworkBadge } from '../components/NetworkSelector';
import { getWalletSummaryV2, getWalletTimelineV2, getWalletCounterpartiesV2 } from '../api/v2.api';

// Network colors
const NETWORK_COLORS = {
  ethereum: '#627EEA',
  arbitrum: '#28A0F0',
  optimism: '#FF0420',
  base: '#0052FF',
  polygon: '#8247E5',
  bnb: '#F3BA2F',
  zksync: '#8C8DFC',
  scroll: '#FFEEDA',
};

// Format address
function formatAddress(addr) {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// Format number
function formatNumber(n) {
  if (n === null || n === undefined) return '-';
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toFixed(2);
}

// Network Summary Card
function NetworkCard({ summary }) {
  const color = NETWORK_COLORS[summary.network] || '#888';
  const isPositive = summary.netFlow >= 0;
  
  return (
    <div 
      className="bg-white rounded-xl p-4 border border-gray-200 hover:border-gray-200 transition-all"
      style={{ borderLeftColor: color, borderLeftWidth: 3 }}
    >
      <div className="flex items-center justify-between mb-3">
        <NetworkBadge network={summary.network} size="sm" />
        <span className="text-xs text-gray-500">
          {summary.lastActivity ? new Date(summary.lastActivity).toLocaleDateString() : 'No activity'}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <ArrowDownLeft className="w-3 h-3 text-green-400" />
            IN
          </div>
          <div className="text-lg font-bold text-green-400">{summary.transfersIn}</div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <ArrowUpRight className="w-3 h-3 text-red-400" />
            OUT
          </div>
          <div className="text-lg font-bold text-red-400">{summary.transfersOut}</div>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
        <span className="text-xs text-gray-500">Net Flow</span>
        <span className={`font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? '+' : ''}{summary.netFlow}
        </span>
      </div>
      
      <div className="mt-2 flex justify-between items-center">
        <span className="text-xs text-gray-500">Counterparties</span>
        <span className="text-sm text-gray-700">{summary.uniqueCounterparties}</span>
      </div>
    </div>
  );
}

// Timeline Item
function TimelineItem({ item, address }) {
  const isOut = item.direction === 'OUT';
  
  return (
    <div className="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-200">
      <div className={`p-2 rounded-lg ${isOut ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
        {isOut ? (
          <ArrowUpRight className="w-4 h-4 text-red-400" />
        ) : (
          <ArrowDownLeft className="w-4 h-4 text-green-400" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
            item.type === 'BRIDGE' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
          }`}>
            {item.type}
          </span>
          {item.type === 'BRIDGE' && (
            <span className="text-xs text-gray-500">
              {item.fromNetwork} → {item.toNetwork}
            </span>
          )}
        </div>
        
        <div className="text-sm text-gray-700 truncate">
          {isOut ? 'To: ' : 'From: '}
          <span className="font-mono">{formatAddress(item.counterparty)}</span>
        </div>
      </div>
      
      <div className="text-right">
        <div className="text-xs text-gray-500">
          {new Date(item.timestamp).toLocaleString()}
        </div>
        {item.amount && (
          <div className="text-sm font-mono text-gray-700">
            {formatNumber(parseFloat(item.amount))}
          </div>
        )}
      </div>
      
      <a 
        href={`https://etherscan.io/tx/${item.txHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-500 hover:text-blue-400"
      >
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
}

// Counterparty Item
function CounterpartyItem({ cp, rank }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-400">
        {rank}
      </div>
      
      <div className="flex-1">
        <div className="font-mono text-sm text-gray-700">{formatAddress(cp.address)}</div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{cp.txCount} txs</span>
          <span className={`px-1.5 py-0.5 rounded ${
            cp.direction === 'OUT' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
          }`}>
            {cp.direction}
          </span>
        </div>
      </div>
      
      <div className="text-right text-xs text-gray-500">
        <div>First: {new Date(cp.firstSeen).toLocaleDateString()}</div>
        <div>Last: {new Date(cp.lastSeen).toLocaleDateString()}</div>
      </div>
    </div>
  );
}

// Main Component
export default function WalletExplorerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [address, setAddress] = useState(searchParams.get('address') || '');
  const [searchInput, setSearchInput] = useState(address);
  const [window, setWindow] = useState('7d');
  const [selectedNetwork, setSelectedNetwork] = useState('ethereum');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [summary, setSummary] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [counterparties, setCounterparties] = useState([]);
  
  // Load data
  const loadData = useCallback(async () => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Load summary (all networks)
      const summaryRes = await getWalletSummaryV2({ address, window });
      if (summaryRes.ok) {
        setSummary(summaryRes.data);
      }
      
      // Load timeline for selected network
      const timelineRes = await getWalletTimelineV2({ 
        network: selectedNetwork, 
        address, 
        window,
        limit: 20 
      });
      if (timelineRes.ok) {
        setTimeline(timelineRes.data.timeline || []);
      }
      
      // Load counterparties for selected network
      const cpRes = await getWalletCounterpartiesV2({ 
        network: selectedNetwork, 
        address, 
        window: '30d',
        limit: 10 
      });
      if (cpRes.ok) {
        setCounterparties(cpRes.data.counterparties || []);
      }
    } catch (err) {
      console.error('Failed to load wallet data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [address, window, selectedNetwork]);
  
  // Search handler
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput && /^0x[a-fA-F0-9]{40}$/.test(searchInput)) {
      setAddress(searchInput.toLowerCase());
      setSearchParams({ address: searchInput.toLowerCase() });
    }
  };
  
  // Load on address/window/network change
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-3 mb-2">
          <Wallet className="w-7 h-7 text-blue-400" />
          Wallet Explorer
          <span className="text-xs font-normal px-2 py-1 bg-blue-500/20 text-blue-400 rounded">P0 MULTICHAIN</span>
        </h1>
        <p className="text-gray-500">Multi-network wallet analysis and activity tracking</p>
      </div>
      
      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter wallet address (0x...)"
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-slate-900 placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <select
            value={window}
            onChange={(e) => setWindow(e.target.value)}
            className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-slate-900 cursor-pointer"
          >
            <option value="1h">1 Hour</option>
            <option value="24h">24 Hours</option>
            <option value="7d">7 Days</option>
            <option value="30d">30 Days</option>
            <option value="90d">90 Days</option>
          </select>
          
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-colors"
          >
            Search
          </button>
          
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="px-4 py-3 bg-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </form>
      
      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
          {error}
        </div>
      )}
      
      {/* No Address */}
      {!address && (
        <div className="text-center py-20">
          <Wallet className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h2 className="text-xl text-gray-500 mb-2">Enter a wallet address to explore</h2>
          <p className="text-gray-600">View multi-network activity, transfers, bridges, and counterparties</p>
        </div>
      )}
      
      {/* Main Content */}
      {address && summary && (
        <>
          {/* Address Header */}
          <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">Wallet Address</div>
                <div className="font-mono text-lg">{address}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 mb-1">Active Networks</div>
                <div className="flex gap-2">
                  {summary.activeNetworks?.map(net => (
                    <NetworkBadge key={net} network={net} size="sm" />
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Totals */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Total IN</div>
              <div className="text-2xl font-bold text-green-400">{summary.totals?.transfersIn || 0}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Total OUT</div>
              <div className="text-2xl font-bold text-red-400">{summary.totals?.transfersOut || 0}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Net Flow</div>
              <div className={`text-2xl font-bold ${
                (summary.totals?.netFlow || 0) >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {(summary.totals?.netFlow || 0) >= 0 ? '+' : ''}{summary.totals?.netFlow || 0}
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Bridges IN</div>
              <div className="text-2xl font-bold text-purple-400">{summary.totals?.bridgesIn || 0}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Bridges OUT</div>
              <div className="text-2xl font-bold text-orange-400">{summary.totals?.bridgesOut || 0}</div>
            </div>
          </div>
          
          {/* Network Cards */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Network className="w-5 h-5 text-blue-400" />
              Activity by Network
            </h2>
            <div className="grid grid-cols-4 gap-4">
              {summary.networks?.map(net => (
                <div 
                  key={net.network}
                  onClick={() => setSelectedNetwork(net.network)}
                  className={`cursor-pointer transition-all ${
                    selectedNetwork === net.network ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <NetworkCard summary={net} />
                </div>
              ))}
            </div>
          </div>
          
          {/* Selected Network Details */}
          <div className="grid grid-cols-2 gap-6">
            {/* Timeline */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                Recent Activity
                <NetworkBadge network={selectedNetwork} size="xs" />
              </h2>
              
              {timeline.length === 0 ? (
                <div className="text-center py-10 text-gray-500 bg-white rounded-xl border border-gray-200">
                  No activity found for this network
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {timeline.map((item, idx) => (
                    <TimelineItem key={item.id || idx} item={item} address={address} />
                  ))}
                </div>
              )}
            </div>
            
            {/* Counterparties */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Top Counterparties
                <NetworkBadge network={selectedNetwork} size="xs" />
              </h2>
              
              {counterparties.length === 0 ? (
                <div className="text-center py-10 text-gray-500 bg-white rounded-xl border border-gray-200">
                  No counterparties found
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {counterparties.map((cp, idx) => (
                    <CounterpartyItem key={cp.address} cp={cp} rank={idx + 1} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
      
      {/* Loading */}
      {loading && (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl flex items-center gap-4">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
            <span>Loading wallet data...</span>
          </div>
        </div>
      )}
    </div>
  );
}
