import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Activity, Filter, 
  Zap, Target, AlertTriangle, ChevronRight, Eye, ChevronDown
} from 'lucide-react';
import { WhyButton } from './Explainability';
import DecisionEngine from './DecisionEngine';

const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

const GlassCard = ({ children, className = "", hover = false }) => (
  <div className={`glass-card ${hover ? 'hover:shadow-[0_6px_24px_rgba(0,0,0,0.1)] transition-all duration-300' : ''} ${className}`}>
    {children}
  </div>
);

export default function SmartMoneyRadar() {
  const [timeframe, setTimeframe] = useState('24h');
  const [flowType, setFlowType] = useState('all');

  const smartMoneyData = {
    '1h': [
      { entity: "Wintermute", type: "Market Maker", netflow: 12500000, change: 340, status: "accumulating", token: "ETH", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png", activity: "new_position" },
      { entity: "Jump Trading", type: "HFT", netflow: 8700000, change: 210, status: "adding", token: "SOL", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png", activity: "adds" },
      { entity: "Three Arrows Capital", type: "Fund", netflow: -5200000, change: -180, status: "distributing", token: "AVAX", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png", activity: "distribution" },
    ],
    '24h': [
      { entity: "Alameda Research", type: "Trading Firm", netflow: 45800000, change: 1250, status: "accumulating", token: "BTC", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png", activity: "new_position" },
      { entity: "DWF Labs", type: "Market Maker", netflow: 28400000, change: 890, status: "adding", token: "MATIC", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png", activity: "adds" },
      { entity: "Pantera Capital", type: "VC Fund", netflow: 19200000, change: 670, status: "rotating", token: "UNI", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/7083.png", activity: "rotation" },
      { entity: "Galaxy Digital", type: "Investment", netflow: -12500000, change: -420, status: "distributing", token: "LINK", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1975.png", activity: "distribution" },
      { entity: "Cumberland", type: "OTC Desk", netflow: 16700000, change: 540, status: "accumulating", token: "AAVE", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/7278.png", activity: "adds" },
    ],
    '7d': [
      { entity: "Grayscale", type: "Asset Manager", netflow: 234000000, change: 4200, status: "accumulating", token: "BTC", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png", activity: "new_position" },
      { entity: "a16z crypto", type: "VC Fund", netflow: 89500000, change: 2100, status: "adding", token: "ETH", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png", activity: "adds" },
      { entity: "Paradigm", type: "VC Fund", netflow: 67200000, change: 1800, status: "rotating", token: "ARB", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png", activity: "rotation" },
      { entity: "Framework Ventures", type: "VC Fund", netflow: -34500000, change: -1200, status: "distributing", token: "FTM", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/3513.png", activity: "distribution" },
    ],
  };

  const currentData = smartMoneyData[timeframe] || smartMoneyData['24h'];
  
  const filteredData = flowType === 'all' ? currentData : currentData.filter(item => {
    if (flowType === 'new_positions') return item.activity === 'new_position';
    if (flowType === 'adds') return item.activity === 'adds';
    if (flowType === 'distribution') return item.activity === 'distribution';
    if (flowType === 'rotation') return item.activity === 'rotation';
    return true;
  });

  // DECISION ENGINE LOGIC (aggregates Market Pressure + contradictions)
  // DECISION SCORE v1 FORMULA:
  // Confidence = Smart Money (40%) + Regime (25%) + Flow Anomalies (20%) − Distribution Risk (15%)
  
  const calculateMarketDecision = () => {
    const accumulating = currentData.filter(d => d.status === 'accumulating' || d.status === 'adding').length;
    const distributing = currentData.filter(d => d.status === 'distributing').length;
    const totalNetflow = currentData.reduce((sum, d) => sum + d.netflow, 0);
    const newPositions = currentData.filter(d => d.activity === 'new_position').length;
    
    // Market Pressure data (mock - в реальности из backend)
    const marketPressure = {
      cexSellPressure: 68, // % sell pressure from CEX deposits
      dexBuyPressure: 72,  // % buy pressure from DEX
      retailSentiment: -15 // negative = selling
    };
    
    // === DECISION SCORE v1 CALCULATION ===
    // Smart Money Score (40% weight): based on accumulation vs distribution ratio
    const smRatio = accumulating / Math.max(accumulating + distributing, 1);
    const smartMoneyScore = smRatio * 100; // 0-100
    
    // Regime Score (25% weight): based on netflow direction and magnitude
    const netflowNormalized = Math.min(Math.max(totalNetflow / 100000000, -1), 1); // -1 to 1
    const regimeScore = (netflowNormalized + 1) * 50; // 0-100
    
    // Flow Anomalies Score (20% weight): new positions = fresh capital = bullish signal
    const anomalyScore = Math.min(newPositions * 25, 100); // max 100
    
    // Distribution Risk (15% weight): high distribution = risk
    const distributionRisk = (distributing / Math.max(currentData.length, 1)) * 100;
    
    // FINAL SCORE
    const decisionScore = Math.round(
      (smartMoneyScore * 0.40) + 
      (regimeScore * 0.25) + 
      (anomalyScore * 0.20) - 
      (distributionRisk * 0.15)
    );
    
    let state = 'neutral';
    let confidence = Math.max(20, Math.min(95, decisionScore)); // clamp 20-95
    let reasons = [];
    let contradictions = [];

    if (accumulating > distributing * 1.5 && totalNetflow > 50000000) {
      state = 'bullish';
      reasons = [
        { icon: TrendingUp, text: `${accumulating} smart money entities actively accumulating`, detail: `vs ${distributing} distributing` },
        { icon: Target, text: `Net inflow: +$${(totalNetflow / 1e6).toFixed(1)}M`, detail: `Strong buy pressure across multiple entities` },
        { icon: Zap, text: `${newPositions} new positions opened`, detail: `Fresh capital entering the market` }
      ];
      
      // CONTRADICTION DETECTION → MARKET DISLOCATION
      if (marketPressure.cexSellPressure > 60) {
        contradictions.push({
          type: 'elevated_cex_pressure',
          message: `Despite elevated CEX sell pressure (${marketPressure.cexSellPressure}%), smart money accumulation dominates`,
          historical: 'Historically bullish (67% accuracy)',
          severity: 'warning'
        });
      }
      if (marketPressure.retailSentiment < -10) {
        contradictions.push({
          type: 'retail_selling',
          message: `Retail selling while smart money accumulates`,
          historical: 'Classic accumulation phase signal',
          severity: 'info'
        });
      }
    } else if (distributing > accumulating * 1.5 || totalNetflow < -20000000) {
      state = 'risky';
      reasons = [
        { icon: TrendingDown, text: `${distributing} entities distributing positions`, detail: `Smart money taking profits` },
        { icon: AlertTriangle, text: `Net outflow: $${Math.abs(totalNetflow / 1e6).toFixed(1)}M`, detail: `Capital leaving the market` },
        { icon: Activity, text: `Accumulation/Distribution ratio: ${(accumulating / Math.max(distributing, 1)).toFixed(2)}`, detail: `Bearish sentiment among whales` }
      ];
      
      // MARKET DISLOCATION
      if (marketPressure.dexBuyPressure > 65) {
        contradictions.push({
          type: 'retail_buying',
          message: `Retail still buying on DEX while smart money exits`,
          historical: 'Distribution into strength - bearish (72% accuracy)',
          severity: 'danger'
        });
      }
    } else {
      state = 'neutral';
      reasons = [
        { icon: Activity, text: 'Mixed signals across entities', detail: `${accumulating} accumulating, ${distributing} distributing` },
        { icon: Target, text: `Net flow: $${(totalNetflow / 1e6).toFixed(1)}M`, detail: `Balanced buy/sell activity` },
        { icon: Eye, text: 'Wait for clearer trend confirmation', detail: `Monitor for decisive movement` }
      ];
    }

    // Add score breakdown to reasons
    const scoreBreakdown = {
      smartMoney: Math.round(smartMoneyScore),
      regime: Math.round(regimeScore),
      anomalies: Math.round(anomalyScore),
      risk: Math.round(distributionRisk)
    };

    return { state, confidence, reasons, contradictions, marketPressure, scoreBreakdown };
  };

  const decision = calculateMarketDecision();

  const getStatusColor = (status) => {
    switch(status) {
      case 'accumulating': return 'text-emerald-600 bg-emerald-100';
      case 'adding': return 'text-blue-600 bg-blue-100';
      case 'distributing': return 'text-red-600 bg-red-100';
      case 'rotating': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getActivityBadge = (activity) => {
    const badges = {
      new_position: { label: 'New Position', color: 'bg-purple-100 text-purple-700' },
      adds: { label: 'Adding', color: 'bg-emerald-100 text-emerald-700' },
      distribution: { label: 'Distributing', color: 'bg-red-100 text-red-700' },
      rotation: { label: 'Rotating', color: 'bg-orange-100 text-orange-700' },
    };
    return badges[activity] || badges.adds;
  };

  return (
    <div className="px-6 mb-6">
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Smart Money Radar</h2>
              <p className="text-sm text-gray-500">Track top funds and whales in real-time</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              {['1h', '24h', '7d'].map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1.5 text-sm font-bold rounded-lg transition-colors ${
                    timeframe === tf
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tf.toUpperCase()}
                </button>
              ))}
            </div>
            
            <div className="flex gap-1.5">
              {[
                { value: 'all', label: 'All' },
                { value: 'new_positions', label: 'New Positions' },
                { value: 'adds', label: 'Adds' },
                { value: 'distribution', label: 'Distribution' },
                { value: 'rotation', label: 'Rotations' },
              ].map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setFlowType(filter.value)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    flowType === filter.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* DECISION ENGINE - Market Signal (with contradictions) */}
        <div className="mb-6">
          <DecisionEngine 
            state={decision.state}
            confidence={decision.confidence}
            reasons={decision.reasons}
            entity="Smart Money Activity"
            scoreBreakdown={decision.scoreBreakdown}
          />
          
          {/* MARKET DISLOCATION DETECTED - Edge/Opportunity Signal */}
          {decision.contradictions && decision.contradictions.length > 0 && (
            <div className="mt-4 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border-2 border-purple-300 shadow-lg shadow-purple-100/50">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-bold text-purple-900 uppercase tracking-wide">
                  💎 Market Dislocation Detected
                </span>
                <span className="ml-auto px-2 py-0.5 bg-purple-200 text-purple-800 text-xs font-bold rounded-lg">
                  EDGE
                </span>
              </div>
              <p className="text-xs text-purple-700 mb-3">
                Divergence between smart money flow and market structure creates potential opportunity
              </p>
              {decision.contradictions.map((contra, i) => (
                <div key={i} className="mb-3 last:mb-0 p-3 bg-white/60 rounded-2xl">
                  <div className="text-sm text-gray-800 font-semibold mb-1">💡 {contra.message}</div>
                  <div className="text-xs text-purple-600 font-medium">→ {contra.historical}</div>
                </div>
              ))}
              <button className="mt-3 w-full py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-2xl font-bold text-sm transition-all shadow-md">
                🎯 Explore This Edge
              </button>
            </div>
          )}
        </div>

        {/* SMART MONEY RADAR - As Proof (свернуто на 30%) */}
        <details open className="mb-4">
          <summary className="cursor-pointer text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            <ChevronDown className="w-4 h-4" />
            Top Contributors (Proof)
          </summary>

        {/* Smart Money Feed - Card-Based (Vision v2) - LIMITED TO 3 */}
        <div className="space-y-3">
          {filteredData.slice(0, 3).map((item, i) => {
            const confidence = 65 + Math.floor(Math.random() * 25);
            
            return (
              <div 
                key={i}
                className="group p-5 bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-gray-200 hover:border-cyan-300 hover:shadow-xl transition-all"
              >
                {/* Header Row: Entity + State + Confidence */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {item.entity.substring(0, 2)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{item.entity}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`px-3 py-1 rounded-2xl text-xs font-bold border-2 ${getStatusColor(item.status)}`}>
                          {item.status === 'accumulating' && '📈'} 
                          {item.status === 'distributing' && '📉'}
                          {item.status === 'rotation' && '🔄'}
                          {item.status === 'adding' && '➕'}
                          {' '}{item.status.toUpperCase()}
                        </span>
                        {item.activity === 'rotation' && item.tokens && (
                          <span className="text-xs font-semibold text-gray-600">→ {item.tokens[0]}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xs text-gray-500 mb-0.5">Confidence</div>
                    <div className="text-3xl font-bold text-cyan-600">{confidence}%</div>
                  </div>
                </div>

                {/* Why Section */}
                <div className="mb-3 p-3 bg-gray-50 rounded-2xl">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Why?</div>
                  <ul className="space-y-1">
                    <li className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-cyan-600 font-bold">•</span>
                      <span>Net flow: <span className={`font-bold ${item.netflow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {item.netflow >= 0 ? '+' : ''}${(Math.abs(item.netflow) / 1e6).toFixed(1)}M (24h)
                      </span></span>
                    </li>
                    <li className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-cyan-600 font-bold">•</span>
                      <span>
                        {item.activity === 'rotation' ? 'Sector rotation pattern detected' : 
                         item.activity === 'new_position' ? 'New position opened in last 24h' :
                         `Active in ${item.tokens?.length || 1} tokens`}
                      </span>
                    </li>
                    <li className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-cyan-600 font-bold">•</span>
                      <span>
                        {item.status === 'accumulating' ? 'Consistent buying over 3+ days' :
                         item.status === 'distributing' ? 'Systematic selling detected' :
                         item.status === 'rotation' ? 'Portfolio rebalancing active' :
                         'Adding to existing positions'}
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Action Buttons - Only Alert + Track */}
                <div className="flex items-center gap-2">
                  <button className="flex-1 py-2 px-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-2xl font-bold text-sm hover:shadow-lg transition-all">
                    🔔 Alert
                  </button>
                  <button className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-all">
                    📍 Track
                  </button>
                  <Link 
                    to={`/address/${item.address}`}
                    className="py-2 px-3 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl font-bold text-sm hover:border-cyan-400 transition-all flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No data available for selected filters
          </div>
        )}
        </details>
      </GlassCard>
    </div>
  );
}
