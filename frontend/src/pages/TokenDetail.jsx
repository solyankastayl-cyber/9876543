import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ChevronDown, ChevronLeft, ChevronRight, Filter, ArrowUpRight, Wallet, ExternalLink
} from 'lucide-react';
import { ResponsiveContainer, Area, AreaChart, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { InfoIcon } from '../components/Tooltip';

// Advanced Analysis Components
import HolderComposition from '../components/HolderComposition';
import SupplyFlowMap from '../components/SupplyFlowMap';
import DistributionRisk from '../components/DistributionRisk';
import DEXMicrostructure from '../components/DEXMicrostructure';
import OIVolumeCorrelations from '../components/OIVolumeCorrelations';
import ActivityBreakdown from '../components/ActivityBreakdown';
import DecisionEngine from '../components/DecisionEngine';

// B2: Wallet Token Correlation
import TokenActivityDrivers from '../components/TokenActivityDrivers';

// P1: Wallet Cohorts
import CohortFlows from '../components/CohortFlows';

const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

const GlassCard = ({ children, className = "", hover = false }) => (
  <div className={`glass-card ${hover ? 'glass-card-hover' : ''} ${className}`}>
    {children}
  </div>
);

const TokenDecisionHeader = ({ token }) => {
  // Calculate decision based on token data
  const calculateDecision = () => {
    // Mock logic - в реальности это будет из backend
    const smartMoneyFlow = Math.random() * 100 - 50; // -50 to +50
    const freshHoldersIncrease = Math.random() > 0.4;
    const cexDepositSpike = Math.random() < 0.3;
    
    let state = 'neutral';
    let confidence = 60;
    let reasons = [];

    if (smartMoneyFlow > 20 && freshHoldersIncrease && !cexDepositSpike) {
      state = 'bullish';
      confidence = 70 + Math.floor(Math.random() * 20);
      reasons = [
        { icon: ArrowUpRight, text: `Smart money net inflow +$${Math.abs(smartMoneyFlow).toFixed(1)}M`, detail: 'Strong institutional buying' },
        { icon: Wallet, text: 'Fresh holders increasing', detail: 'New addresses accumulating' },
        { icon: ExternalLink, text: 'No CEX deposit spike detected', detail: 'Low selling pressure' }
      ];
    } else if (smartMoneyFlow < -20 || cexDepositSpike) {
      state = 'risky';
      confidence = 65 + Math.floor(Math.random() * 20);
      reasons = [
        { icon: ArrowUpRight, text: `Smart money net outflow -$${Math.abs(smartMoneyFlow).toFixed(1)}M`, detail: 'Whales distributing' },
        { icon: ExternalLink, text: cexDepositSpike ? 'CEX deposit spike detected' : 'Holdings decreasing', detail: 'Selling pressure increasing' },
        { icon: Wallet, text: 'Fresh holders declining', detail: 'Loss of interest' }
      ];
    } else {
      state = 'neutral';
      confidence = 55 + Math.floor(Math.random() * 10);
      reasons = [
        { icon: ArrowUpRight, text: 'Mixed smart money signals', detail: 'Both buying and selling activity' },
        { icon: Wallet, text: 'Holders stable', detail: 'No significant changes' },
        { icon: ExternalLink, text: 'Monitor for clearer trend', detail: 'Wait for confirmation' }
      ];
    }

    return { state, confidence, reasons };
  };

  const decision = calculateDecision();

  return (
    <div className="px-4 py-3 mb-3">
      <div className="p-6 bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 rounded-2xl border-2 border-cyan-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <img src={token.logo} alt={token.symbol} className="w-16 h-16 rounded-full shadow-lg" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{token.symbol}</h1>
                <span className={`px-3 py-1 rounded-2xl text-sm font-bold ${
                  decision.state === 'bullish' ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300' :
                  decision.state === 'risky' ? 'bg-red-100 text-red-700 border-2 border-red-300' :
                  'bg-blue-100 text-blue-700 border-2 border-blue-300'
                }`}>
                  {decision.state === 'bullish' ? '📈 ACCUMULATING' : decision.state === 'risky' ? '📉 DISTRIBUTING' : '⚖️ NEUTRAL'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">Confidence:</span>
                  <span className="font-bold text-cyan-600">{decision.confidence}%</span>
                </div>
                <span className="text-gray-700">•</span>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">Timeframe:</span>
                  <span className="font-bold text-gray-900">7–14d</span>
                </div>
                <span className="text-gray-700">•</span>
                <div className="text-4xl font-bold text-gray-900">${typeof token.price === 'number' ? token.price.toLocaleString() : token.price}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Why - inline bullets */}
        <div className="flex items-start gap-2 mb-3">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Why:</span>
          <div className="flex-1 space-y-1">
            {decision.reasons.slice(0, 3).map((reason, i) => (
              <div key={i} className="text-sm text-gray-700">
                <span className="text-cyan-600 font-bold">• </span>
                {reason.text}
              </div>
            ))}
          </div>
        </div>

        {/* Action */}
        <button className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-2xl font-bold text-sm hover:shadow-lg transition-all">
          🔔 Set Price Alert for {token.symbol}
        </button>
      </div>
    </div>
  );
};

const TokenHeader = ({ token }) => (
  <div className="px-4 py-3">
    <GlassCard className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src={token.logo} alt={token.symbol} className="w-16 h-16 rounded-full" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold text-gray-900">{token.name}</h1>
              <span className="text-lg text-gray-500">({token.symbol})</span>
              <ExternalLink className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer" />
            </div>
            <div className="text-4xl font-bold text-gray-900">${typeof token.price === 'number' ? token.price.toLocaleString() : token.price}</div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-6">
          <div>
            <div className="text-xs text-gray-500 mb-1">24H VOLUME</div>
            <div className="text-base font-bold text-gray-900">${(token.volume_24h / 1e9).toFixed(2)}B</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">MARKET CAP</div>
            <div className="text-base font-bold text-gray-900">${(token.market_cap / 1e9).toFixed(2)}B</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">FDV</div>
            <div className="text-base font-bold text-gray-900">${(token.fdv / 1e9).toFixed(2)}B</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">24H CHANGE</div>
            <div className={`text-base font-bold ${token.change_24h >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {token.change_24h >= 0 ? '+' : ''}{token.change_24h}%
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  </div>
);

export default function TokenDetail() {
  const { tokenId } = useParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [viewType, setViewType] = useState('addresses');

  useEffect(() => {
    axios.get(`${API_BASE}/tokens/${tokenId}`)
      .then(res => setToken(res.data))
      .catch(err => console.error(err));
  }, [tokenId]);

  // Navigate to wallet profile
  const handleWalletClick = (walletAddress) => {
    navigate(`/wallets/${walletAddress}`);
  };

  if (!token) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      
      <TokenDecisionHeader token={token} />
      <TokenHeader token={token} />

      {/* Analytics Grid */}
      <div className="px-4 pb-8">
        {/* B2: Who is driving this activity? */}
        <div className="mb-4">
          <TokenActivityDrivers 
            tokenAddress={tokenId}
            chain="Ethereum"
            onWalletClick={handleWalletClick}
          />
        </div>
        
        {/* P1: Wallet Cohort Flows */}
        <div className="mb-4">
          <CohortFlows 
            tokenAddress={tokenId}
            tokenSymbol={token?.symbol || 'Token'}
          />
        </div>

        {/* Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-section-title flex items-center gap-2">
                Holder Composition
                <InfoIcon 
                  title="Holder Composition"
                  description="Distribution of token holders by type (CEX, Smart Money, Funds, Retail, etc.)"
                  data={[
                    { label: 'CEX Holdings', value: '35.2%', color: 'blue' },
                    { label: 'Smart Money', value: '18.7%', color: 'emerald' }
                  ]}
                  position="bottom"
                />
              </h3>
            </div>
            <HolderComposition tokenId={tokenId} />
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-section-title flex items-center gap-2">
                Supply Flow Map
                <InfoIcon 
                  title="Supply Flow Map"
                  description="Token supply movements: minting, burning, LP flows, and bridge activity"
                  position="bottom"
                />
              </h3>
            </div>
            <SupplyFlowMap tokenId={tokenId} />
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-section-title flex items-center gap-2">
                Activity Breakdown
                <InfoIcon 
                  title="Activity Breakdown"
                  description="Transaction activity by type: buys, sells, swaps, and transfers"
                  position="bottom"
                />
              </h3>
            </div>
            <ActivityBreakdown tokenSymbol={token?.symbol} />
          </GlassCard>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <DistributionRisk tokenId={tokenId} />
          <DEXMicrostructure tokenId={tokenId} />
        </div>

        {/* Row 3 - Full width */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-section-title flex items-center gap-2">
              Open Interest & Volume Correlations
              <InfoIcon 
                title="OI/Volume Correlations"
                description="Correlation between OI, Net Flow, and Price"
                position="bottom"
              />
            </h3>
          </div>
          <OIVolumeCorrelations tokenId={tokenId} />
        </GlassCard>
      </div>
    </div>
  );
}
