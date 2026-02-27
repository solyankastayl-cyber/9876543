import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  ChevronLeft, Search, TrendingUp, TrendingDown, ExternalLink, Wallet, Shield, Check, AlertTriangle, Copy, CheckCircle, Users
} from 'lucide-react';
import { ResponsiveContainer, Area, AreaChart, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { InfoIcon } from '../components/Tooltip';

// Advanced Analysis Components
import PnLEngine from '../components/PnLEngine'; // UNIFIED: replaces CostBasisPnL + SwapsPnL
import BehaviorFingerprint from '../components/BehaviorFingerprint';
import CounterpartyGraph from '../components/CounterpartyGraph';
import AdvancedRiskFlags from '../components/AdvancedRiskFlags';
import { WhyButton } from '../components/Explainability';

const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

const GlassCard = ({ children, className = "", hover = false }) => (
  <div className={`glass-card ${hover ? 'glass-card-hover' : ''} ${className}`}>
    {children}
  </div>
);

// Wallet Classification Component (Vision v2)
const WalletClassification = ({ address }) => {
  // Calculate classification based on wallet behavior
  const calculateClassification = () => {
    // Mock logic - в реальности из backend
    const winRate = 0.68 + Math.random() * 0.1;
    const consistency = Math.random();
    const riskScore = Math.floor(Math.random() * 40) + 10;
    
    let walletClass = 'Smart Money Trader';
    let edge = 'Alpha Hunter';
    let consistencyLevel = 'High';
    
    if (winRate > 0.7 && consistency > 0.7) {
      walletClass = 'Smart Money Trader';
      edge = 'Alpha Hunter';
      consistencyLevel = 'High';
    } else if (winRate > 0.6) {
      walletClass = 'Skilled Trader';
      edge = 'Trend Follower';
      consistencyLevel = 'Medium';
    } else {
      walletClass = 'Regular Trader';
      edge = 'Opportunistic';
      consistencyLevel = 'Low';
    }
    
    return { walletClass, edge, consistencyLevel, riskScore };
  };

  const { walletClass, edge, consistencyLevel, riskScore } = calculateClassification();

  const getClassColor = () => {
    if (walletClass === 'Smart Money Trader') return 'from-emerald-500 to-green-600';
    if (walletClass === 'Skilled Trader') return 'from-blue-500 to-cyan-600';
    return 'from-gray-500 to-gray-600';
  };

  const getRiskColor = () => {
    if (riskScore < 30) return 'text-emerald-600';
    if (riskScore < 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="px-4 py-3 mb-3">
      <div className={`p-6 bg-gradient-to-br ${getClassColor()} rounded-2xl shadow-xl`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <div className="text-white/80 text-sm font-semibold uppercase tracking-wide mb-2">Wallet Classification</div>
            <div className="text-4xl font-bold text-white mb-3">{walletClass}</div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-white/70 text-xs uppercase tracking-wide mb-1">Edge</div>
                <div className="text-white text-lg font-bold">{edge}</div>
              </div>
              <div>
                <div className="text-white/70 text-xs uppercase tracking-wide mb-1">Consistency</div>
                <div className="text-white text-lg font-bold">{consistencyLevel}</div>
              </div>
              <div>
                <div className="text-white/70 text-xs uppercase tracking-wide mb-1">Risk Score</div>
                <div className={`text-lg font-bold ${riskScore < 30 ? 'text-emerald-200' : riskScore < 50 ? 'text-yellow-200' : 'text-red-200'}`}>
                  {riskScore}/100
                </div>
              </div>
            </div>
          </div>

          <div className="w-32 h-32 rounded-2xl bg-white/10 backdrop-blur-sm border-2 border-white/20 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl font-bold text-white mb-1">
                {walletClass === 'Smart Money Trader' ? '⭐' : 
                 walletClass === 'Skilled Trader' ? '💎' : '🎯'}
              </div>
              <div className="text-white/80 text-xs font-semibold">
                {walletClass === 'Smart Money Trader' ? 'Elite' : 
                 walletClass === 'Skilled Trader' ? 'Advanced' : 'Active'}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="flex items-center gap-3 pt-4 border-t border-white/20">
          <div className="flex items-center gap-2 text-white/90 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>Follow this wallet for alpha signals</span>
          </div>
          <button className="ml-auto px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-2xl font-bold text-sm transition-all">
            🔔 Set Alert
          </button>
        </div>
      </div>
    </div>
  );
};

const ProfileHeader = ({ address }) => {
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="px-4 py-3">
      <GlassCard className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">Wallet Profile</h1>
                <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold">
                  <Shield className="w-3 h-3" />
                  Verified
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold">
                  <Users className="w-3 h-3" />
                  Smart Money
                </span>
                <WhyButton 
                  entityType="Smart Money" 
                  entityName={address}
                />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <code className="text-sm text-gray-600 font-mono">{address}</code>
                <button onClick={copyAddress} className="p-1 hover:bg-gray-100 rounded">
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                </button>
                <ExternalLink className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer" />
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Rating:</span>
                  <span className="ml-2 font-bold text-yellow-600">94/100</span>
                </div>
                <div>
                  <span className="text-gray-500">Connections:</span>
                  <span className="ml-2 font-bold text-gray-900">1,247</span>
                </div>
                <div>
                  <span className="text-gray-500">Red Flags:</span>
                  <span className="ml-2 font-bold text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    3
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-xs text-gray-500 mb-1">Total Balance</div>
              <div className="text-2xl font-bold text-gray-900">$1,247,893</div>
              <div className="text-xs text-emerald-500 font-semibold">+12.4%</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Total Profit</div>
              <div className="text-2xl font-bold text-emerald-600">+$347,193</div>
              <div className="text-xs text-gray-500">38.6% ROI</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Transactions</div>
              <div className="text-2xl font-bold text-gray-900">8,456</div>
              <div className="text-xs text-gray-500">Last 30 days: 234</div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

const PortfolioTabs = () => {
  const [activeTab, setActiveTab] = useState('portfolio');
  const [activeNetwork, setActiveNetwork] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [compareAddress1, setCompareAddress1] = useState('');
  const [compareAddress2, setCompareAddress2] = useState('');
  const [comparisonResult, setComparisonResult] = useState(null);

  const portfolioData = [
    { asset: "BTC", name: "Bitcoin", amount: "2.45", value: "$231,023", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png", network: "Bitcoin", change: 5.4 },
    { asset: "ETH", name: "Ethereum", amount: "45.8", value: "$153,164", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png", network: "Ethereum", change: 3.2 },
    { asset: "SOL", name: "Solana", amount: "1,250", value: "$223,038", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png", network: "Solana", change: 8.7 },
    { asset: "USDT", name: "Tether", amount: "125,000", value: "$125,000", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/825.png", network: "Multiple", change: 0.01 },
    { asset: "BNB", name: "BNB", amount: "450", value: "$275,535", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png", network: "BSC", change: 2.1 },
    { asset: "MATIC", name: "Polygon", amount: "89,500", value: "$77,865", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png", network: "Polygon", change: -1.3 },
  ];

  const topCounterparties = [
    { entity: "Binance", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png", transactions: 1247, volume: "$5.2M" },
    { entity: "Uniswap", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/7083.png", transactions: 892, volume: "$3.8M" },
    { entity: "OKX", logo: "https://s2.coinmarketcap.com/static/img/exchanges/64x64/294.png", transactions: 634, volume: "$2.1M" },
    { entity: "Bybit", logo: "https://s2.coinmarketcap.com/static/img/exchanges/64x64/521.png", transactions: 521, volume: "$1.7M" },
    { entity: "Kraken", logo: "https://s2.coinmarketcap.com/static/img/exchanges/64x64/24.png", transactions: 389, volume: "$1.2M" },
  ];

  const handleCompare = () => {
    if (!compareAddress1 || !compareAddress2) return;
    
    // Mock comparison data
    const mockComparison = {
      address1: {
        address: compareAddress1,
        label: "Whale Wallet #1",
        rating: 87,
        balance: "$45.2M",
        transactions: 1247,
        volume: "$342M",
        redFlags: 2,
        topTokens: ["ETH", "USDC", "UNI"],
        riskScore: 15
      },
      address2: {
        address: compareAddress2,
        label: "Influencer Wallet",
        rating: 94,
        balance: "$12.8M",
        transactions: 892,
        volume: "$156M",
        redFlags: 0,
        topTokens: ["ETH", "AAVE", "LINK"],
        riskScore: 8
      }
    };
    setComparisonResult(mockComparison);
  };

  return (
    <div className="px-4 pb-4">
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('portfolio')} className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === 'portfolio' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
              Portfolio
            </button>
            <button onClick={() => setActiveTab('counterparty')} className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === 'counterparty' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
              Top Counterparty
            </button>
            <button onClick={() => setActiveTab('comparison')} className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === 'comparison' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
              Comparison
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <select 
              value={activeNetwork}
              onChange={(e) => setActiveNetwork(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Networks</option>
              <option value="ethereum">Ethereum</option>
              <option value="bsc">BSC</option>
              <option value="polygon">Polygon</option>
              <option value="solana">Solana</option>
            </select>
          </div>
        </div>

        {activeTab === 'portfolio' && (
          <div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase">Asset</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase">Network</th>
                  <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase">Value</th>
                  <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase">24H Change</th>
                </tr>
              </thead>
              <tbody>
                {portfolioData.map((item, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img src={item.logo} alt={item.asset} className="w-8 h-8 rounded-full" />
                        <div>
                          <div className="font-semibold text-gray-900">{item.asset}</div>
                          <div className="text-xs text-gray-500">{item.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">{item.network}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">{item.amount}</td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">{item.value}</td>
                    <td className="py-3 px-4 text-right">
                      <div className={`flex items-center justify-end gap-1 font-semibold ${item.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {item.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {item.change >= 0 ? '+' : ''}{item.change}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'counterparty' && (
          <div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase">Entity</th>
                  <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase">Transactions</th>
                  <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase">Volume (USD)</th>
                </tr>
              </thead>
              <tbody>
                {topCounterparties.map((item, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img src={item.logo} alt={item.entity} className="w-8 h-8 rounded-full" />
                        <span className="font-semibold text-gray-900">{item.entity}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">{item.transactions.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">{item.volume}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'comparison' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Address #1</label>
                <input 
                  type="text" 
                  value={compareAddress1}
                  onChange={(e) => setCompareAddress1(e.target.value)}
                  placeholder="0x..." 
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Address #2</label>
                <input 
                  type="text" 
                  value={compareAddress2}
                  onChange={(e) => setCompareAddress2(e.target.value)}
                  placeholder="0x..." 
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>
            <button 
              onClick={handleCompare}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
            >
              Compare Addresses
            </button>
            
            {comparisonResult && (
              <div className="mt-6 grid grid-cols-2 gap-4">
                {/* Address 1 */}
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-bold text-gray-900 mb-2">{comparisonResult.address1.label}</h4>
                    <code className="text-xs text-gray-600 block mb-3">{comparisonResult.address1.address}</code>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-gray-500">Rating</div>
                        <div className="font-bold text-gray-900 flex items-center gap-1">
                          <span className="text-yellow-600">{comparisonResult.address1.rating}/100</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Balance</div>
                        <div className="font-bold text-gray-900">{comparisonResult.address1.balance}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Transactions</div>
                        <div className="font-bold text-gray-900">{comparisonResult.address1.transactions.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Volume</div>
                        <div className="font-bold text-gray-900">{comparisonResult.address1.volume}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Red Flags</div>
                        <div className="font-bold text-red-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {comparisonResult.address1.redFlags}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Risk Score</div>
                        <div className="font-bold text-gray-900">{comparisonResult.address1.riskScore}/100</div>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="text-xs text-gray-500 mb-1">Top Tokens</div>
                      <div className="flex gap-1">
                        {comparisonResult.address1.topTokens.map(token => (
                          <span key={token} className="px-2 py-1 bg-white rounded text-xs font-semibold text-gray-700">{token}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Address 2 */}
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-bold text-gray-900 mb-2">{comparisonResult.address2.label}</h4>
                    <code className="text-xs text-gray-600 block mb-3">{comparisonResult.address2.address}</code>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-gray-500">Rating</div>
                        <div className="font-bold text-gray-900 flex items-center gap-1">
                          <span className="text-yellow-600">{comparisonResult.address2.rating}/100</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Balance</div>
                        <div className="font-bold text-gray-900">{comparisonResult.address2.balance}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Transactions</div>
                        <div className="font-bold text-gray-900">{comparisonResult.address2.transactions.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Volume</div>
                        <div className="font-bold text-gray-900">{comparisonResult.address2.volume}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Red Flags</div>
                        <div className="font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          {comparisonResult.address2.redFlags}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Risk Score</div>
                        <div className="font-bold text-gray-900">{comparisonResult.address2.riskScore}/100</div>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="text-xs text-gray-500 mb-1">Top Tokens</div>
                      <div className="flex gap-1">
                        {comparisonResult.address2.topTokens.map(token => (
                          <span key={token} className="px-2 py-1 bg-white rounded text-xs font-semibold text-gray-700">{token}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Comparison Summary */}
                <div className="col-span-2 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <h4 className="font-bold text-gray-900 mb-3">Comparison Summary</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500 mb-1">Better Rating</div>
                      <div className="font-bold text-gray-900">
                        {comparisonResult.address1.rating > comparisonResult.address2.rating ? 'Address #1' : 'Address #2'}
                        <span className="text-xs ml-1">
                          ({Math.abs(comparisonResult.address1.rating - comparisonResult.address2.rating)} pts difference)
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">Higher Balance</div>
                      <div className="font-bold text-gray-900">Address #1</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">Lower Risk</div>
                      <div className="font-bold text-gray-900">
                        {comparisonResult.address1.riskScore < comparisonResult.address2.riskScore ? 'Address #1' : 'Address #2'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
};

const BalanceHistory = () => {
  const [activeTab, setActiveTab] = useState('balance');
  const [period, setPeriod] = useState('1Y');
  
  const balanceData = [
    { date: 'Jan', value: 850000 },
    { date: 'Feb', value: 920000 },
    { date: 'Mar', value: 890000 },
    { date: 'Apr', value: 1050000 },
    { date: 'May', value: 1120000 },
    { date: 'Jun', value: 1080000 },
    { date: 'Jul', value: 1180000 },
    { date: 'Aug', value: 1150000 },
    { date: 'Sep', value: 1220000 },
    { date: 'Oct', value: 1190000 },
    { date: 'Nov', value: 1230000 },
    { date: 'Dec', value: 1247893 },
  ];

  const profitData = [
    { date: 'Jan', profit: -12000, loss: 0 },
    { date: 'Feb', profit: 45000, loss: -8000 },
    { date: 'Mar', profit: 32000, loss: -15000 },
    { date: 'Apr', profit: 78000, loss: -5000 },
    { date: 'May', profit: 56000, loss: -12000 },
    { date: 'Jun', profit: 41000, loss: -18000 },
    { date: 'Jul', profit: 89000, loss: -7000 },
    { date: 'Aug', profit: 52000, loss: -9000 },
    { date: 'Sep', profit: 67000, loss: -6000 },
    { date: 'Oct', profit: 38000, loss: -11000 },
    { date: 'Nov', profit: 74000, loss: -8000 },
    { date: 'Dec', profit: 92000, loss: -4000 },
  ];

  return (
    <div className="px-4 pb-4">
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('balance')} className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === 'balance' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
              Balance History
            </button>
            <button onClick={() => setActiveTab('profit')} className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === 'profit' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
              Profit & Loss
            </button>
          </div>
          <div className="flex gap-2">
            {['1W', '1M', '3M', '6M', '1Y', 'ALL'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 text-xs font-bold rounded-lg ${period === p ? 'bg-white text-white' : 'bg-gray-100 text-gray-600'}`}>{p}</button>
            ))}
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === 'balance' ? (
              <AreaChart data={balanceData}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '11px' }} />
                <YAxis stroke="#9CA3AF" style={{ fontSize: '11px' }} tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                <Tooltip 
                  contentStyle={{ fontSize: '11px', borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Balance']}
                />
                <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorBalance)" />
              </AreaChart>
            ) : (
              <BarChart data={profitData}>
                <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '11px' }} />
                <YAxis stroke="#9CA3AF" style={{ fontSize: '11px' }} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                <Tooltip 
                  contentStyle={{ fontSize: '11px', borderRadius: '8px', border: 'none' }}
                  formatter={(value) => [`$${value.toLocaleString()}`, value >= 0 ? 'Profit' : 'Loss']}
                />
                <Bar dataKey="profit" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="loss" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
};

const TransactionsFlow = () => {
  const inflowData = { total: "$842,193", count: 4234, avgSize: "$199" };
  const outflowData = { total: "$495,000", count: 3122, avgSize: "$159" };

  return (
    <div className="px-4 pb-4 grid grid-cols-2 gap-4">
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-700 uppercase">Total Inflow</h3>
          <TrendingUp className="w-5 h-5 text-emerald-500" />
        </div>
        <div className="text-3xl font-bold text-emerald-600 mb-2">{inflowData.total}</div>
        <div className="space-y-1 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Transactions:</span>
            <span className="font-semibold">{inflowData.count.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Avg Size:</span>
            <span className="font-semibold">{inflowData.avgSize}</span>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-700 uppercase">Total Outflow</h3>
          <TrendingDown className="w-5 h-5 text-red-500" />
        </div>
        <div className="text-3xl font-bold text-red-600 mb-2">{outflowData.total}</div>
        <div className="space-y-1 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Transactions:</span>
            <span className="font-semibold">{outflowData.count.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Avg Size:</span>
            <span className="font-semibold">{outflowData.avgSize}</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default function Portfolio() {
  const { address } = useParams();
  const walletAddress = address || "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      
      <WalletClassification address={walletAddress} />
      <ProfileHeader address={walletAddress} />
      <PortfolioTabs />
      <BalanceHistory />
      <TransactionsFlow />
      
      {/* Advanced Analysis Section */}
      <div className="px-4 pb-4">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Advanced Wallet Analysis</h2>
          <p className="text-sm text-gray-500">Deep behavioral metrics, PnL analysis, and risk indicators</p>
        </div>
        
        {/* Row 1: PnL Engine (UNIFIED) + Behavior Fingerprint */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="h-[480px]"><PnLEngine /></div>
          <div className="h-[480px]"><BehaviorFingerprint /></div>
        </div>
        
        {/* Row 2: Counterparty Graph + Advanced Risk Flags */}
        <div className="grid grid-cols-2 gap-4">
          <div className="h-[480px]"><CounterpartyGraph /></div>
          <div className="h-[480px]"><AdvancedRiskFlags /></div>
        </div>
      </div>
      
      <div className="h-8" />
    </div>
  );
}
