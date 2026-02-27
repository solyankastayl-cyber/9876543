// Mock tokens data
export const topTokens = [
  { id: 'btc', symbol: 'BTC', price: 94250, change24h: 2.4 },
  { id: 'eth', symbol: 'ETH', price: 3342, change24h: 3.8 },
  { id: 'sol', symbol: 'SOL', price: 178.43, change24h: -1.2 },
  { id: 'bnb', symbol: 'BNB', price: 612.80, change24h: 1.5 },
  { id: 'xrp', symbol: 'XRP', price: 2.34, change24h: 5.2 },
  { id: 'ada', symbol: 'ADA', price: 0.98, change24h: -0.8 },
];

// Chart data
export const chartData = [
  { day: '7d', price: 3180, netflow: -120 },
  { day: '6d', price: 3210, netflow: -80 },
  { day: '5d', price: 3195, netflow: 45 },
  { day: '4d', price: 3240, netflow: 120 },
  { day: '3d', price: 3285, netflow: 180 },
  { day: '2d', price: 3310, netflow: 220 },
  { day: '1d', price: 3325, netflow: 260 },
  { day: 'Now', price: 3342, netflow: 280 },
];

// Token data
export const tokenData = {
  eth: {
    symbol: 'ETH',
    price: 3342,
    change: 3.8,
    marketSignal: { type: 'Bullish', confidence: 57 },
    intelligence: {
      structureStatus: 'SUPPORTIVE',
      marketAlignment: 'CONFIRMED',
      trend: 'improving',
      confirmedDays: 6,
      duration: '1–3 weeks',
      confidence: 'Medium–High',
      primaryDrivers: ['Smart money accumulation', 'Whale & institutional buying'],
      primaryRisk: 'Short-term retail selling',
    },
    recentChanges: [
      { 
        type: 'up', 
        metric: 'Smart money exposure', 
        value: '+5.8%', 
        time: '2d ago',
        what: 'Smart money wallets increased ETH holdings by 5.8% over the past 48 hours.',
        why: 'This suggests institutional confidence in current price levels and potential accumulation before expected price movement.'
      },
      { 
        type: 'down', 
        metric: 'CEX balances', 
        value: '−2.3%', 
        time: '3d ago',
        what: 'Centralized exchange balances decreased by 2.3%, indicating outflows to private wallets.',
        why: 'Lower CEX balances typically reduce immediate sell pressure and suggest holders are moving to long-term storage.'
      },
      { 
        type: 'up', 
        metric: 'LP inflow', 
        value: '+$6.3M', 
        time: '4d ago',
        what: 'Liquidity providers added $6.3M to DEX pools.',
        why: 'Increased LP activity indicates growing confidence in trading volume and fee generation potential.'
      },
      { 
        type: 'up', 
        metric: 'Bridge volume', 
        value: '+$3.6M', 
        time: '5d ago',
        what: 'Cross-chain bridge activity increased with $3.6M flowing into Ethereum.',
        why: 'Capital flowing into the network from other chains suggests relative strength and demand.'
      },
    ],
    holders: {
      strongHands: 53.5,
      trend: 'Increasing',
      composition: [
        { type: 'CEX', pct: 35.2, change: -2.3 },
        { type: 'Smart Money', pct: 18.7, change: 5.8 },
        { type: 'Funds', pct: 12.4, change: 1.2 },
        { type: 'Retail', pct: 22.1, change: -3.1 },
      ],
      interpretation: 'Smart money & funds increased exposure while CEX balances declined.',
    },
    supplyFlow: {
      mintBurn: -3847,
      lpFlow: 6300000,
      bridgeFlow: 3600000,
      netEffect: 'Supply pressure decreasing due to LP & bridge inflows.',
    },
    pressure: {
      buyPct: 50.8,
      netFlow: 280,
      interpretation: 'Buy pressure driven by Pro, Institutional and Whale segments.',
    },
    tradeSize: [
      { 
        size: 'Retail', range: '<$1K', action: 'Sell', link: '/wallets?filter=retail',
        entities: 'Multiple retail wallets',
        netFlow: '-$2.1M',
        avgHold: '3d'
      },
      { 
        size: 'Active', range: '$1K-10K', action: 'Neutral', link: '/wallets?filter=active',
        entities: '~1,200 active traders',
        netFlow: '+$0.8M',
        avgHold: '7d'
      },
      { 
        size: 'Pro', range: '$10K-100K', action: 'Buy', link: '/entities?filter=desks',
        entities: '45 trading desks',
        netFlow: '+$12M',
        avgHold: '12d'
      },
      { 
        size: 'Inst.', range: '$100K-1M', action: 'Buy', link: '/entities?filter=funds',
        entities: '8 funds accumulating',
        netFlow: '+$34M',
        avgHold: '21d'
      },
      { 
        size: 'Whale', range: '>$1M', action: 'Buy', link: '/entities?filter=whales',
        entities: '3 entities accumulating',
        netFlow: '+$48M',
        avgHold: '14d'
      },
    ],
    suggestedStrategies: {
      reasons: ['Smart money accumulation', 'Mid-term structure', 'Whale support'],
      strategies: [
        { name: 'Smart Money Follow', why: 'Aligned with institutional accumulation pattern' },
        { name: 'Narrative Rider', why: 'Best suited for mid-term structure confirmation' },
      ],
    }
  }
};

// Alert types configuration
export const alertTypes = [
  {
    id: 'structure_break',
    name: 'Structure Break',
    description: 'Alert when token structure fundamentals change',
    triggers: [
      'Smart money holdings decrease >5%',
      'Net flow turns negative for 3+ days',
      'Pressure flips from Buy to Sell dominance'
    ],
  },
  {
    id: 'divergence',
    name: 'Divergence',
    description: 'Alert when flow and price move in opposite directions',
    triggers: [
      'Net Flow ↑ but Price ↓ (Absorption)',
      'Net Flow ↓ but Price ↑ (Distribution risk)',
      'Divergence persists for 24+ hours'
    ],
  },
  {
    id: 'market_misalignment',
    name: 'Market Misalignment',
    description: 'Alert when token no longer matches Market regime',
    triggers: [
      'Token structure becomes Bearish while Market is Risk-On',
      'Major cohort behavior contradicts Market signal',
      'Confidence drops below Medium'
    ],
  }
];

// Strategy logic data
export const strategyLogic = {
  'Smart Money Follow': {
    description: 'Follow institutional and smart money accumulation patterns',
    entryConditions: [
      'Smart money holdings increasing >3% over 7 days',
      'Institutional & Whale cohorts actively buying',
      'Structure confirmed for 5+ days',
      'Market regime aligned (Risk-On preferred)'
    ],
    invalidation: [
      'Smart money holdings decrease >2%',
      'Whale cohort flips to Sell',
      'Structure breaks (becomes Bearish)',
      'Market regime shifts to Risk-Off'
    ],
    typicalDuration: '1–3 weeks (mid-term)',
    riskLevel: 'Medium',
    bestFor: 'Following institutional trends with 2–4 week horizon'
  },
  'Narrative Rider': {
    description: 'Ride narrative-driven moves with structural confirmation',
    entryConditions: [
      'Token part of confirmed narrative (Early/Confirmed stage)',
      'Structure supports narrative (Supportive/Bullish)',
      'Bridge flow or LP activity increasing',
      'Retail interest growing but not dominant'
    ],
    invalidation: [
      'Narrative shifts to Crowded stage',
      'Structure turns Bearish',
      'Retail dominance >40%',
      'Price significantly above structure support'
    ],
    typicalDuration: '1–2 weeks (narrative lifecycle dependent)',
    riskLevel: 'Medium-High',
    bestFor: 'Narrative-based trades with structural validation'
  }
};
