import { TrendingUp, TrendingDown, Activity, Globe } from 'lucide-react';

// Chain configs
export const chainConfig = {
  'ETH': { color: 'bg-blue-500', label: 'Ethereum' },
  'SOL': { color: 'bg-purple-500', label: 'Solana' },
  'BASE': { color: 'bg-blue-600', label: 'Base' },
  'ARB': { color: 'bg-sky-500', label: 'Arbitrum' },
};

// Action type colors
export const actionColors = {
  'BUY': { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: TrendingUp },
  'SELL': { bg: 'bg-red-100', text: 'text-red-700', icon: TrendingDown },
  'SWAP': { bg: 'bg-blue-100', text: 'text-blue-700', icon: Activity },
  'BRIDGE': { bg: 'bg-purple-100', text: 'text-purple-700', icon: Globe },
};

// Edge Score color helper
export const getEdgeScoreColor = (score) => {
  if (score >= 75) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-red-500 bg-red-50 border-red-200';
};

// Suggested action colors
export const actionSuggestionColors = {
  'Watch': 'bg-blue-100 text-blue-700 border-blue-200',
  'Entry': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Reduce': 'bg-amber-100 text-amber-700 border-amber-200',
  'Avoid': 'bg-red-100 text-red-700 border-red-200',
};

// Confidence colors
export const getConfidenceColor = (confidence) => {
  if (confidence >= 70) return { bg: 'bg-[#16C784]', text: 'text-[#16C784]', label: 'High' };
  if (confidence >= 40) return { bg: 'bg-[#F5A524]', text: 'text-[#F5A524]', label: 'Medium' };
  return { bg: 'bg-[#EF4444]', text: 'text-[#EF4444]', label: 'Low' };
};

// Mock actor detailed data with HYBRID identity + Correlation + INFLUENCE data (ETAP 4)
export const actorDetailedData = {
  'vitalik': {
    id: 'vitalik',
    real_name: 'Vitalik.eth',
    strategy_name: 'L2 Infrastructure Builder',
    identity_confidence: 0.95,
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    type: 'Whale',
    avatar: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
    strategy: 'Smart Money Trader',
    confidence: 87,
    primaryChain: 'ETH',
    latency: 'Early',
    edgeScore: 78,
    
    // ETAP 4: INFLUENCE METRICS
    influenceScore: 72,
    influenceRole: 'Leader',
    followers_count: 4,
    leads_count: 1,
    follows_count: 1,
    avgFollowerLag: 5.8,
    consistency: 0.78,
    
    exitConditions: [
      { trigger: 'Edge Score < 50', action: 'Reduce position by 50%', priority: 'high' },
      { trigger: 'Behavior shifts to Distribution', action: 'Exit all positions', priority: 'critical' },
      { trigger: 'Entry delay > 8h consistently', action: 'Stop following new entries', priority: 'medium' },
    ],
    
    // ETAP 4: ENHANCED CORRELATION & INFLUENCE DATA
    correlation: {
      movesWith: [
        { id: 'a16z', real_name: 'a16z Crypto', strategy_name: 'Institutional Infrastructure Play', similarity: 82, overlap: 'L2 accumulation', overlapType: 'timing' },
        { id: 'pantera', real_name: 'Pantera Capital', strategy_name: 'AI Narrative Accumulator', similarity: 71, overlap: 'ETH ecosystem', overlapType: 'token' },
        { id: 'alameda', real_name: 'Alameda Research', strategy_name: 'SOL Ecosystem Accumulator', similarity: 58, overlap: 'Macro positions', overlapType: 'size' },
      ],
      frontRunners: [
        { id: 'pantera', real_name: 'Pantera Capital', strategy_name: 'AI Narrative Accumulator', avgLeadTime: '+4.2h', frequency: '34%', tradesMatched: 18 },
      ],
      followedBy: [
        { id: 'dwf-labs', real_name: 'DWF Labs', strategy_name: 'Meme Momentum Rider', avgLagTime: '+6.8h', frequency: '28%', tradesMatched: 14 },
        { id: 'unknown-whale-1', real_name: 'Smart Whale #4721', strategy_name: 'High-Risk Flip Trader', avgLagTime: '+12.4h', frequency: '15%', tradesMatched: 7 },
      ],
      cluster: {
        name: 'L2/Infrastructure',
        phase: 'Accumulating',
        size: 12,
        dominantStrategy: 'Smart Money',
      },
      // ETAP 4: INFLUENCE SUMMARY
      influenceSummary: {
        role: 'Early Leader',
        ecosystem: 'ETH/L2',
        avgLag: '~4–6h',
        recommendation: 'Best used as a primary signal in early rotation phases. Strong in L2 narrative plays.',
        strength: 'high',
      },
    },
    
    // CLUSTER INFO - Source of Truth
    cluster: {
      size: 4,
      confidence: 91,
      wallets: [
        { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', role: 'Main', confidence: 100, lastActive: '2h ago' },
        { address: '0x1234...5678', role: 'Cold Storage', confidence: 94, lastActive: '14d ago' },
        { address: '0xabcd...ef01', role: 'Execution', confidence: 88, lastActive: '4h ago' },
        { address: '0x9876...5432', role: 'Bridge', confidence: 82, lastActive: '1d ago' },
      ],
      linkReason: 'Co-spend patterns, shared funding source, timing correlation',
    },
    
    // ACTIONABLE PLAYBOOK
    playbook: {
      currentAction: 'Accumulating',
      tokensToWatch: ['ARB', 'OP', 'ETH'],
      suggestedAction: 'Watch', // Watch / Entry / Reduce / Avoid
      latencyStatus: 'Early',
      confidenceLevel: 87,
      reasoning: 'Actor accumulating L2 tokens ahead of expected catalysts. Entry timing favorable.',
    },
    
    // TIMING EDGE
    timingEdge: {
      medianPrecedePrice: '4.2 hours',
      successRateWithin6h: '71%',
      lateEntryDropoff: '12 hours',
      bestPerformsIn: 'Risk-On',
    },
    
    // FOLLOWER REALITY CHECK - NEW
    followerReality: {
      avgEntryDelay: '5.2h',
      expectedSlippage: '0.8%',
      modeledROI30d: { actor: '+18%', follower: '+9%' },
      maxDDFollower: '11.4%',
      crowdingFactor: 'Low',
    },
    
    // EDGE DECAY - NEW
    edgeDecay: {
      status: 'stable', // stable / degrading / exhausted
      trend: 'Entry delay stable over 30d',
      successRateTrend: '+2% vs last month',
      crowdFollowing: '~120 followers',
      lastUpdated: '2h ago',
    },
    
    // DO NOT FOLLOW IF - NEW
    doNotFollowIf: [
      { condition: 'VIX > 30', reason: 'Actor underperforms in high volatility' },
      { condition: 'Token liquidity < $5M', reason: 'Slippage kills edge' },
      { condition: 'Entry delay > 6h', reason: 'Late entries show -40% ROI' },
    ],
    
    // COPY FEED - Recent Actions
    copyFeed: [
      { id: 1, type: 'BUY', token: 'ARB', size: '$45K', time: '2h ago', price: '$1.42', txHash: '0xabc...123', entryDelay: '1.2h', actorPnl: '+8.2%', followerPnl: '+5.1%' },
      { id: 2, type: 'SWAP', token: 'ETH→USDC', size: '$120K', time: '6h ago', price: '-', txHash: '0xdef...456', entryDelay: '-', actorPnl: '-', followerPnl: '-' },
      { id: 3, type: 'BUY', token: 'OP', size: '$89K', time: '1d ago', price: '$2.18', txHash: '0xghi...789', entryDelay: '2.4h', actorPnl: '+12.4%', followerPnl: '+6.8%' },
      { id: 4, type: 'BRIDGE', token: 'ETH→ARB', size: '$200K', time: '2d ago', price: '-', txHash: '0xjkl...012', entryDelay: '-', actorPnl: '-', followerPnl: '-' },
      { id: 5, type: 'SELL', token: 'PEPE', size: '$28K', time: '3d ago', price: '$0.0000089', txHash: '0xmno...345', entryDelay: '-', actorPnl: '+24%', followerPnl: '+18%' },
    ],
    
    // SIMULATED PORTFOLIO - NEW
    simulatedPortfolio: {
      startingCapital: 10000,
      periods: [
        { period: '7d', actorReturn: 4.2, followerReturn: 2.1, slippageLoss: 0.8, delayLoss: 1.3 },
        { period: '30d', actorReturn: 18.5, followerReturn: 9.2, slippageLoss: 2.4, delayLoss: 6.9 },
        { period: '90d', actorReturn: 42.8, followerReturn: 22.1, slippageLoss: 5.2, delayLoss: 15.5 },
      ],
      trades: {
        total: 47,
        profitable: 31,
        avgWin: '+12.4%',
        avgLoss: '-6.8%',
      },
      impactByDelay: [
        { delay: '1h', returnLoss: '-15%', recommendation: 'Optimal' },
        { delay: '2h', returnLoss: '-28%', recommendation: 'Acceptable' },
        { delay: '4h', returnLoss: '-45%', recommendation: 'Risky' },
        { delay: '6h+', returnLoss: '-62%', recommendation: 'Not recommended' },
      ],
    },
    
    // Why follow
    whyFollow: [
      { positive: true, text: 'Profitable over 6 months (+$549K realized)' },
      { positive: true, text: 'Low systemic risk (12/100)' },
      { positive: true, text: 'Aligned with current market regime (Risk-On)' },
      { positive: false, text: 'High frequency trader — latency risk (2.4h avg delay)' },
    ],
    
    // Performance
    performance: {
      realizedPnl: '+$549K',
      winRate: '66.8%',
      avgHoldTime: '4.2 days',
      avgDrawdown: '8.2%',
      entryDelay: '2.4 hours',
      tradesAnalyzed: 468,
    },
    
    // Strategy fingerprint
    strategyFingerprint: {
      dexUsage: 85,
      holdDuration: 35,
      riskTolerance: 25,
      narrativeFocus: 70,
      entryTiming: 80,
    },
    strategies: ['Smart Money', 'DEX Heavy', 'Alpha Hunter', 'Narrative Rider'],
    
    // TOP EXPOSURES (lite positions)
    topExposures: [
      { token: 'ETH', direction: 'Increasing', allocation: '45%', change: '+5%' },
      { token: 'ARB', direction: 'Increasing', allocation: '20%', change: '+12%' },
      { token: 'OP', direction: 'Stable', allocation: '15%', change: '0%' },
      { token: 'USDC', direction: 'Decreasing', allocation: '10%', change: '-8%' },
    ],
    
    // Asset Behavior Map
    assetBehavior: [
      { token: 'ETH', behavior: 'Accumulate', bias: 'Bullish', allocation: '45%' },
      { token: 'ARB', behavior: 'Trade', bias: 'Active', allocation: '20%' },
      { token: 'OP', behavior: 'Bullish bias', bias: 'Long', allocation: '15%' },
      { token: 'Meme', behavior: 'Quick flips', bias: 'Neutral', allocation: '10%' },
    ],
    
    // Risk & Flags
    riskFlags: {
      sanctions: false,
      mixers: false,
      riskyApprovals: 2,
      unverifiedContracts: 1,
      overallRisk: 12,
    },
    
    currentBehavior: 'Accumulating',
    behaviorTrend: 'Stable → Bullish',
    
    // Active alerts
    activeAlerts: [
      { type: 'Behavior change', status: 'active' },
      { type: 'Large position entry', status: 'active' },
    ],
  },
  'alameda': {
    id: 'alameda',
    real_name: 'Alameda Research',
    strategy_name: 'SOL Ecosystem Accumulator',
    identity_confidence: 0.92,
    address: '0x28C6c06298d514Db089934071355E5743bf21d60',
    type: 'Fund',
    avatar: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/270.png',
    strategy: 'Accumulator & Momentum',
    confidence: 91,
    primaryChain: 'SOL',
    latency: 'Early',
    edgeScore: 86,
    
    // ETAP 4: INFLUENCE METRICS
    influenceScore: 89,
    influenceRole: 'Leader',
    followers_count: 6,
    leads_count: 2,
    follows_count: 1,
    avgFollowerLag: 4.5,
    consistency: 0.85,
    
    exitConditions: [
      { trigger: 'SOL drops below $80', action: 'Exit SOL-related positions', priority: 'high' },
      { trigger: 'Actor starts large distribution', action: 'Follow exit within 24h', priority: 'critical' },
      { trigger: 'Win rate drops below 60%', action: 'Reduce exposure by 30%', priority: 'medium' },
    ],
    correlation: {
      movesWith: [
        { id: 'pantera', real_name: 'Pantera Capital', strategy_name: 'AI Narrative Accumulator', similarity: 76, overlap: 'Narrative timing', overlapType: 'timing' },
        { id: 'vitalik', real_name: 'Vitalik.eth', strategy_name: 'L2 Infrastructure Builder', similarity: 58, overlap: 'Macro positions', overlapType: 'size' },
      ],
      frontRunners: [
        { id: 'a16z', real_name: 'a16z Crypto', strategy_name: 'Institutional Infrastructure Play', avgLeadTime: '+8.2h', frequency: '22%', tradesMatched: 12 },
      ],
      followedBy: [
        { id: 'dwf-labs', real_name: 'DWF Labs', strategy_name: 'Meme Momentum Rider', avgLagTime: '+4.5h', frequency: '41%', tradesMatched: 24 },
      ],
      cluster: { name: 'SOL Ecosystem', phase: 'Rotating', size: 8, dominantStrategy: 'Momentum' },
      influenceSummary: {
        role: 'Market Leader',
        ecosystem: 'SOL',
        avgLag: '~4–6h',
        recommendation: 'Primary signal source for SOL ecosystem plays. High conviction moves are particularly reliable.',
        strength: 'very high',
      },
    },
    cluster: {
      size: 12,
      confidence: 94,
      wallets: [
        { address: '0x28C6c06298d514Db089934071355E5743bf21d60', role: 'Main', confidence: 100, lastActive: '45m ago' },
        { address: '0x2222...3333', role: 'Trading', confidence: 96, lastActive: '1h ago' },
        { address: '0x4444...5555', role: 'Cold Storage', confidence: 91, lastActive: '7d ago' },
      ],
      linkReason: 'Shared funding, coordinated trading, timing patterns',
    },
    playbook: {
      currentAction: 'Rotating',
      tokensToWatch: ['SOL', 'JUP', 'PYTH'],
      suggestedAction: 'Entry',
      latencyStatus: 'Early',
      confidenceLevel: 91,
      reasoning: 'Actor rotating into SOL ecosystem with high conviction. Strong entry opportunity.',
    },
    timingEdge: {
      medianPrecedePrice: '6.1 hours',
      successRateWithin6h: '78%',
      lateEntryDropoff: '18 hours',
      bestPerformsIn: 'Risk-On',
    },
    followerReality: {
      avgEntryDelay: '4.8h',
      expectedSlippage: '1.2%',
      modeledROI30d: { actor: '+24%', follower: '+14%' },
      maxDDFollower: '8.2%',
      crowdingFactor: 'Medium',
    },
    edgeDecay: {
      status: 'stable',
      trend: 'Consistent alpha generation',
      successRateTrend: '+5% vs last month',
      crowdFollowing: '~340 followers',
      lastUpdated: '45m ago',
    },
    doNotFollowIf: [
      { condition: 'SOL < $100', reason: 'Actor exits SOL positions in bear' },
      { condition: 'Position size > $500K', reason: 'Market impact too high to replicate' },
      { condition: 'After major narrative shift', reason: 'Actor needs 24-48h to reposition' },
    ],
    copyFeed: [
      { id: 1, type: 'SWAP', token: 'SOL→USDC', size: '$890K', time: '45m ago', price: '-', txHash: '0xabc...111', entryDelay: '-', actorPnl: '-', followerPnl: '-' },
      { id: 2, type: 'BUY', token: 'JUP', size: '$340K', time: '4h ago', price: '$0.89', txHash: '0xdef...222', entryDelay: '1.8h', actorPnl: '+15.2%', followerPnl: '+11.8%' },
    ],
    simulatedPortfolio: {
      startingCapital: 10000,
      periods: [
        { period: '7d', actorReturn: 8.4, followerReturn: 6.2, slippageLoss: 0.6, delayLoss: 1.6 },
        { period: '30d', actorReturn: 32.1, followerReturn: 24.5, slippageLoss: 1.8, delayLoss: 5.8 },
        { period: '90d', actorReturn: 78.5, followerReturn: 58.2, slippageLoss: 4.8, delayLoss: 15.5 },
      ],
      trades: { total: 89, profitable: 63, avgWin: '+18.2%', avgLoss: '-5.4%' },
      impactByDelay: [
        { delay: '1h', returnLoss: '-12%', recommendation: 'Optimal' },
        { delay: '2h', returnLoss: '-22%', recommendation: 'Acceptable' },
        { delay: '4h', returnLoss: '-38%', recommendation: 'Risky' },
        { delay: '6h+', returnLoss: '-55%', recommendation: 'Not recommended' },
      ],
    },
    whyFollow: [
      { positive: true, text: 'Exceptional track record (+$2.4M realized)' },
      { positive: true, text: 'Very low risk profile (8/100)' },
      { positive: true, text: 'Strong narrative timing' },
      { positive: false, text: 'Large position sizes — may move markets' },
    ],
    performance: {
      realizedPnl: '+$2.4M',
      winRate: '71.2%',
      avgHoldTime: '12.5 days',
      avgDrawdown: '5.1%',
      entryDelay: '4.8 hours',
      tradesAnalyzed: 892,
    },
    strategyFingerprint: {
      dexUsage: 65,
      holdDuration: 70,
      riskTolerance: 15,
      narrativeFocus: 85,
      entryTiming: 90,
    },
    strategies: ['Accumulator', 'Momentum', 'Narrative Rider', 'Long-term'],
    topExposures: [
      { token: 'SOL', direction: 'Increasing', allocation: '35%', change: '+15%' },
      { token: 'BTC', direction: 'Stable', allocation: '30%', change: '0%' },
      { token: 'JUP', direction: 'Increasing', allocation: '15%', change: '+22%' },
    ],
    assetBehavior: [
      { token: 'SOL', behavior: 'Accumulate', bias: 'Very Bullish', allocation: '35%' },
      { token: 'BTC', behavior: 'Hold', bias: 'Long', allocation: '30%' },
      { token: 'DeFi', behavior: 'Rotate', bias: 'Active', allocation: '20%' },
    ],
    riskFlags: {
      sanctions: false,
      mixers: false,
      riskyApprovals: 0,
      unverifiedContracts: 0,
      overallRisk: 8,
    },
    currentBehavior: 'Rotating',
    behaviorTrend: 'Active trading',
    activeAlerts: [{ type: 'Strategy shift', status: 'active' }],
  },
  'dwf-labs': {
    id: 'dwf-labs',
    real_name: 'DWF Labs',
    strategy_name: 'Meme Momentum Rider',
    identity_confidence: 0.88,
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    type: 'Fund',
    avatar: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/89.png',
    strategy: 'Market Maker & Early DEX',
    confidence: 72,
    primaryChain: 'ETH',
    latency: 'Medium',
    edgeScore: 52,
    
    influenceScore: 38,
    influenceRole: 'Follower',
    followers_count: 1,
    leads_count: 0,
    follows_count: 3,
    avgFollowerLag: 2.1,
    consistency: 0.52,
    
    exitConditions: [
      { trigger: 'Meme narrative cools off', action: 'Exit meme positions immediately', priority: 'high' },
      { trigger: 'Actor win rate < 50%', action: 'Stop following entirely', priority: 'critical' },
      { trigger: 'Market making spreads widen > 2%', action: 'Pause copy trading', priority: 'medium' },
    ],
    correlation: {
      movesWith: [
        { id: 'unknown-whale-1', real_name: 'Smart Whale #4721', strategy_name: 'High-Risk Flip Trader', similarity: 68, overlap: 'Meme momentum', overlapType: 'token' },
        { id: 'wintermute', real_name: 'Wintermute', strategy_name: 'DeFi Yield Optimizer', similarity: 52, overlap: 'MM operations', overlapType: 'timing' },
      ],
      frontRunners: [
        { id: 'alameda', real_name: 'Alameda Research', strategy_name: 'SOL Ecosystem Accumulator', avgLeadTime: '+4.5h', frequency: '41%', tradesMatched: 24 },
        { id: 'pantera', real_name: 'Pantera Capital', strategy_name: 'AI Narrative Accumulator', avgLeadTime: '+6.2h', frequency: '28%', tradesMatched: 16 },
      ],
      followedBy: [
        { id: 'unknown-whale-1', real_name: 'Smart Whale #4721', strategy_name: 'High-Risk Flip Trader', avgLagTime: '+2.1h', frequency: '52%', tradesMatched: 28 },
      ],
      cluster: { name: 'Meme/Momentum', phase: 'Active', size: 15, dominantStrategy: 'Momentum' },
      influenceSummary: {
        role: 'Trend Follower',
        ecosystem: 'Meme',
        avgLag: '~4–6h behind leaders',
        recommendation: 'Use for confirmation only. Do NOT use as primary signal. Best as a late-stage momentum indicator.',
        strength: 'low',
      },
    },
    cluster: {
      size: 8,
      confidence: 86,
      wallets: [
        { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', role: 'Main Trading', confidence: 100, lastActive: '4h ago' },
        { address: '0xdwf1...aa11', role: 'Market Making', confidence: 92, lastActive: '30m ago' },
        { address: '0xdwf2...bb22', role: 'CEX Deposit', confidence: 88, lastActive: '2h ago' },
        { address: '0xdwf3...cc33', role: 'Cold Storage', confidence: 85, lastActive: '5d ago' },
        { address: '0xdwf4...dd44', role: 'Bridge Operations', confidence: 78, lastActive: '1d ago' },
      ],
      linkReason: 'Coordinated market making, shared liquidity pools, timing patterns',
    },
    playbook: {
      currentAction: 'Adding',
      tokensToWatch: ['PEPE', 'WIF', 'BONK'],
      suggestedAction: 'Watch',
      latencyStatus: 'Medium',
      confidenceLevel: 72,
      reasoning: 'Active in meme token market making. High volume but inconsistent alpha. Watch for entry signals.',
    },
    timingEdge: {
      medianPrecedePrice: '2.1 hours',
      successRateWithin6h: '58%',
      lateEntryDropoff: '6 hours',
      bestPerformsIn: 'Risk-On',
    },
    followerReality: {
      avgEntryDelay: '2.8h',
      expectedSlippage: '2.4%',
      modeledROI30d: { actor: '+12%', follower: '+3%' },
      maxDDFollower: '22.5%',
      crowdingFactor: 'High',
    },
    edgeDecay: {
      status: 'degrading',
      trend: 'Success rate declining',
      successRateTrend: '-8% vs last month',
      crowdFollowing: '~890 followers',
      lastUpdated: '4h ago',
    },
    doNotFollowIf: [
      { condition: 'Meme token < $1M mcap', reason: 'Rug pull risk too high' },
      { condition: 'Actor in MM mode', reason: 'Not directional alpha' },
      { condition: 'Within 24h of listing', reason: 'Extreme volatility window' },
    ],
    copyFeed: [
      { id: 1, type: 'BUY', token: 'PEPE', size: '$120K', time: '4h ago', price: '$0.0000142', txHash: '0xdwf...001', entryDelay: '0.8h', actorPnl: '+22%', followerPnl: '+8%' },
      { id: 2, type: 'SELL', token: 'WIF', size: '$89K', time: '8h ago', price: '$2.34', txHash: '0xdwf...002', entryDelay: '-', actorPnl: '+45%', followerPnl: '+28%' },
      { id: 3, type: 'BUY', token: 'FLOKI', size: '$45K', time: '1d ago', price: '$0.000189', txHash: '0xdwf...003', entryDelay: '1.5h', actorPnl: '-12%', followerPnl: '-18%' },
      { id: 4, type: 'SWAP', token: 'ETH→USDT', size: '$500K', time: '1d ago', price: '-', txHash: '0xdwf...004', entryDelay: '-', actorPnl: '-', followerPnl: '-' },
      { id: 5, type: 'BUY', token: 'BONK', size: '$67K', time: '2d ago', price: '$0.0000234', txHash: '0xdwf...005', entryDelay: '2.1h', actorPnl: '+34%', followerPnl: '+12%' },
    ],
    simulatedPortfolio: {
      startingCapital: 10000,
      periods: [
        { period: '7d', actorReturn: 12.8, followerReturn: 4.2, slippageLoss: 2.4, delayLoss: 6.2 },
        { period: '30d', actorReturn: 28.4, followerReturn: 8.9, slippageLoss: 6.8, delayLoss: 12.7 },
        { period: '90d', actorReturn: 52.1, followerReturn: 14.2, slippageLoss: 12.4, delayLoss: 25.5 },
      ],
      trades: { total: 124, profitable: 72, avgWin: '+28.4%', avgLoss: '-14.2%' },
      impactByDelay: [
        { delay: '1h', returnLoss: '-35%', recommendation: 'Risky' },
        { delay: '2h', returnLoss: '-52%', recommendation: 'Not recommended' },
        { delay: '4h', returnLoss: '-68%', recommendation: 'Avoid' },
        { delay: '6h+', returnLoss: '-82%', recommendation: 'Avoid' },
      ],
    },
    whyFollow: [
      { positive: true, text: 'Strong market making presence (+$890K realized)' },
      { positive: true, text: 'Early access to new listings' },
      { positive: false, text: 'Medium risk profile (34/100) — some controversial tokens' },
      { positive: false, text: 'Market making may not translate to copy-worthy trades' },
    ],
    performance: {
      realizedPnl: '+$890K',
      winRate: '58.4%',
      avgHoldTime: '1.8 days',
      avgDrawdown: '14.2%',
      entryDelay: '2.1 hours',
      tradesAnalyzed: 1247,
    },
    strategyFingerprint: {
      dexUsage: 75,
      holdDuration: 20,
      riskTolerance: 65,
      narrativeFocus: 80,
      entryTiming: 55,
    },
    strategies: ['Market Maker', 'Early DEX', 'Momentum', 'Meme Trader'],
    topExposures: [
      { token: 'PEPE', direction: 'Increasing', allocation: '25%', change: '+18%' },
      { token: 'ETH', direction: 'Stable', allocation: '20%', change: '0%' },
      { token: 'WIF', direction: 'Decreasing', allocation: '15%', change: '-12%' },
      { token: 'USDT', direction: 'Increasing', allocation: '30%', change: '+8%' },
    ],
    assetBehavior: [
      { token: 'PEPE', behavior: 'Market Make', bias: 'Active', allocation: '25%' },
      { token: 'Meme', behavior: 'Quick flips', bias: 'Neutral', allocation: '35%' },
      { token: 'ETH', behavior: 'Reserve', bias: 'Stable', allocation: '20%' },
      { token: 'Stables', behavior: 'Liquidity', bias: 'Safe', allocation: '20%' },
    ],
    riskFlags: {
      sanctions: false,
      mixers: false,
      riskyApprovals: 5,
      unverifiedContracts: 3,
      overallRisk: 34,
    },
    currentBehavior: 'Adding',
    behaviorTrend: 'Bullish bias',
    activeAlerts: [
      { type: 'Large position entry', status: 'active' },
      { type: 'Risk increase', status: 'active' },
    ],
  },
};

// Default actor
export const defaultActor = {
  id: 'unknown',
  real_name: 'Unknown Actor',
  strategy_name: 'Unknown Strategy',
  identity_confidence: 0,
  type: 'Unknown',
  confidence: 0,
  edgeScore: 0,
  exitConditions: [],
  correlation: {
    movesWith: [],
    frontRunners: [],
    followedBy: [],
    cluster: { name: '-', phase: '-', size: 0 },
  },
  cluster: { size: 0, confidence: 0, wallets: [], linkReason: '-' },
  playbook: { currentAction: '-', tokensToWatch: [], suggestedAction: 'Avoid', latencyStatus: '-', confidenceLevel: 0, reasoning: '-' },
  timingEdge: { medianPrecedePrice: '-', successRateWithin6h: '-', lateEntryDropoff: '-', bestPerformsIn: '-' },
  copyFeed: [],
  simulatedPortfolio: {
    startingCapital: 10000,
    periods: [],
    trades: { total: 0, profitable: 0, avgWin: '-', avgLoss: '-' },
    impactByDelay: [],
  },
  whyFollow: [],
  performance: { realizedPnl: '-', winRate: '-', avgHoldTime: '-', avgDrawdown: '-', entryDelay: '-', tradesAnalyzed: 0 },
  strategyFingerprint: { dexUsage: 0, holdDuration: 0, riskTolerance: 0, narrativeFocus: 0, entryTiming: 0 },
  strategies: [],
  topExposures: [],
  assetBehavior: [],
  riskFlags: { sanctions: false, mixers: false, riskyApprovals: 0, unverifiedContracts: 0, overallRisk: 50 },
  currentBehavior: '-',
  behaviorTrend: '-',
  activeAlerts: [],
};

// Alert types
export const alertTypes = [
  { id: 'behavior_change', name: 'Behavior change', description: 'When trading pattern shifts' },
  { id: 'large_position', name: 'Large position entry', description: 'New significant position' },
  { id: 'distribution', name: 'Distribution start', description: 'Begins selling holdings' },
  { id: 'strategy_shift', name: 'Strategy shift', description: 'Changes dominant strategy' },
  { id: 'risk_increase', name: 'Risk increase', description: 'Risk score rises significantly' },
];
