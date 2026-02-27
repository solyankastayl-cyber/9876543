// Mock wallets data
export const topWallets = [
  { 
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 
    label: 'Vitalik Buterin', 
    type: 'Smart Money', 
    balance: '$45.2M', 
    pnl: '+27.4%', 
    riskScore: 12,
    whyFeatured: 'Accumulating L2 tokens during bullish regime'
  },
  { 
    address: '0x28C6c06298d514Db089934071355E5743bf21d60', 
    label: 'Binance Hot Wallet', 
    type: 'Exchange', 
    balance: '$2.8B', 
    pnl: '+31.8%', 
    riskScore: 5,
    whyFeatured: 'High volume institutional accumulation'
  },
  { 
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 
    label: 'Unknown Whale', 
    type: 'Whale', 
    balance: '$127.5M', 
    pnl: '-6.4%', 
    riskScore: 45,
    whyFeatured: 'Early buyer of AI narrative tokens'
  },
  { 
    address: '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503', 
    label: 'a16z Crypto', 
    type: 'Fund', 
    balance: '$890.2M', 
    pnl: '+26.3%', 
    riskScore: 8,
    whyFeatured: 'Strategic positions in infrastructure plays'
  },
  { 
    address: '0x1234567890abcdef1234567890abcdef12345678', 
    label: 'DeFi Farmer', 
    type: 'Smart Money', 
    balance: '$8.9M', 
    pnl: '+23.6%', 
    riskScore: 22,
    whyFeatured: 'Profitable yield farming strategies'
  },
];

// Wallet Intelligence data with Decision Score
export const walletIntelligenceData = {
  '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045': {
    classification: 'Smart Money',
    confidence: 87,
    currentMode: 'Accumulation',
    marketAlignment: 'Risk-On',
    tokenOverlap: ['ETH', 'AI', 'L2'],
    reliabilityScore: 82,
    riskScore: 12,
    pnlConsistency: 78,
    marketAlignmentScore: 100,
    decisionScore: 85,
    verdict: 'FOLLOW',
    walletState: 'Accumulation → Stable',
    walletStatePeriod: 'last 14d',
    walletStateExplanation: 'Based on net flows, hold duration, and realized PnL distribution',
    totalPnl: '+$549K',
    winRate: '66.8%',
    profitFactor: '3.34x',
    tradesAnalyzed: 468,
    avgDrawdown: '8.2%',
    avgEntryDelay: '2.4 hours',
    expectedSlippage: '0.3%',
    earlyEntryProfit: '71%',
    replicability: 'Medium'
  },
  '0x28C6c06298d514Db089934071355E5743bf21d60': {
    classification: 'Exchange',
    confidence: 95,
    currentMode: 'Distribution',
    marketAlignment: 'Mixed',
    tokenOverlap: ['BTC', 'ETH', 'Stables'],
    reliabilityScore: 45,
    riskScore: 5,
    pnlConsistency: 92,
    marketAlignmentScore: 60,
    decisionScore: 55,
    verdict: 'WATCH',
    walletState: 'High Activity',
    walletStatePeriod: 'ongoing',
    walletStateExplanation: 'Exchange hot wallet with continuous flow',
    totalPnl: 'N/A',
    winRate: 'N/A',
    profitFactor: 'N/A',
    tradesAnalyzed: 89234,
    avgDrawdown: 'N/A',
    avgEntryDelay: 'N/A',
    expectedSlippage: 'N/A',
    earlyEntryProfit: 'N/A',
    replicability: 'Low'
  }
};

// Default intelligence for wallets without specific data
export const defaultIntelligence = {
  classification: 'Unknown',
  confidence: 0,
  currentMode: 'Analyzing...',
  marketAlignment: 'Unknown',
  tokenOverlap: [],
  reliabilityScore: 0,
  riskScore: 50,
  pnlConsistency: 0,
  marketAlignmentScore: 0,
  decisionScore: 0,
  verdict: 'ANALYZE',
  walletState: 'Pending Analysis',
  walletStatePeriod: '-',
  walletStateExplanation: 'Select a wallet to view detailed analysis',
  totalPnl: '-',
  winRate: '-',
  profitFactor: '-',
  tradesAnalyzed: 0,
  avgDrawdown: '-',
  avgEntryDelay: '-',
  expectedSlippage: '-',
  earlyEntryProfit: '-',
  replicability: '-'
};

// Wallet Alerts configuration
export const walletAlertTypes = [
  {
    id: 'behavioral_shift',
    name: 'Behavioral Shift',
    description: 'Alert when wallet changes trading pattern',
    triggers: [
      'Switched from accumulation to distribution',
      'Changed from holder to active trader',
      'Shift in primary DEX usage'
    ],
  },
  {
    id: 'narrative_entry',
    name: 'Narrative Entry',
    description: 'Alert when wallet enters new narrative cluster',
    triggers: [
      'First purchase in new narrative (AI, Gaming, L2)',
      'Large allocation to emerging sector',
      'Following Smart Money into new category'
    ],
  },
  {
    id: 'risk_threshold',
    name: 'Risk Threshold',
    description: 'Alert on portfolio risk changes',
    triggers: [
      'Risk score increases >20 points',
      'Concentration in single token >40%',
      'Exposure to high-risk narrative >25%'
    ],
  },
];
