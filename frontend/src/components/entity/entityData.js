// Mock entity data
export const mockEntity = {
  id: 'binance-hot-wallet-1',
  label: 'Binance Hot Wallet',
  type: 'exchange',
  address: '0x28C6c06298d514Db089934071355E5743bf21d60',
  balance: '$2.8B',
  txCount: '89,234',
  verified: true,
  riskScore: 45,
  behavior: {
    current: 'distributing',
    confidence: 87,
    change: {
      from: 'accumulating',
      time: '6h ago'
    },
    alignedWith: [
      { id: 'bybit-1', label: 'Bybit', correlation: 0.89 },
      { id: 'okx-1', label: 'OKX', correlation: 0.76 }
    ]
  },
  contextSignals: {
    bridge: {
      active: true,
      direction: 'out',
      destination: 'Solana',
      volume: '$45M',
      participants: 3,
      cluster: 'A',
      entities: '3 entities'
    },
    narrative: {
      current: 'AI',
      stage: 'Confirmed',
      entryTime: '2w ago'
    },
    market: {
      regime: 'Risk-On',
      alignment: 'Aligned'
    },
    marketTrend: 'bullish',
    peers: [
      { name: 'Bybit', behavior: 'Accumulating' },
      { name: 'OKX', behavior: 'Distributing' }
    ]
  },
  holdings: [
    { symbol: 'ETH', value: '$1.2B', percentage: 42.8, change24h: 2.4, avgCost: '$3,180', pnl: '+5.1%', holdDays: 45, acquired: '6w ago', risk: 'low' },
    { symbol: 'BTC', value: '$890M', percentage: 31.8, change24h: 1.2, avgCost: '$91,200', pnl: '+3.3%', holdDays: 62, acquired: '9w ago', risk: 'low' },
    { symbol: 'USDT', value: '$420M', percentage: 15.0, change24h: 0.0, avgCost: '$1.00', pnl: '0%', holdDays: 180, acquired: '6m ago', risk: 'low' },
    { symbol: 'SOL', value: '$180M', percentage: 6.4, change24h: -1.8, avgCost: '$165', pnl: '+8.1%', holdDays: 21, acquired: '3w ago', risk: 'medium' },
    { symbol: 'BNB', value: '$110M', percentage: 3.9, change24h: 0.8, avgCost: '$598', pnl: '+2.5%', holdDays: 90, acquired: '3m ago', risk: 'low' }
  ],
  recentActivity: {
    transactions: [
      { type: 'transfer', direction: 'out', token: 'ETH', amount: '$45M', valueUsd: '$45,000,000', destination: 'CEX', time: '2h ago', hash: '0x1234...abcd', pattern: 'large_transfer' },
      { type: 'swap', direction: 'in', token: 'USDT', amount: '$12M', valueUsd: '$12,000,000', destination: 'DEX', time: '4h ago', hash: '0x5678...efgh' },
      { type: 'bridge', direction: 'out', token: 'SOL', amount: '$8M', valueUsd: '$8,000,000', destination: 'Solana', time: '6h ago', hash: '0x9abc...ijkl', pattern: 'cross_chain' },
      { type: 'transfer', direction: 'out', token: 'ETH', amount: '$23M', valueUsd: '$23,000,000', destination: 'CEX', time: '8h ago', hash: '0xdef0...mnop' },
      { type: 'swap', direction: 'in', token: 'BTC', amount: '$5M', valueUsd: '$5,000,000', destination: 'DEX', time: '12h ago', hash: '0x1234...qrst' }
    ],
    patterns: [
      { type: 'distribution', confidence: 85, description: 'Systematic outflows to exchanges' },
      { type: 'bridge_activity', confidence: 72, description: 'Cross-chain movement to Solana' }
    ]
  },
  timeline: {
    events: [
      { date: 'Today', type: 'behavior', title: 'Behavior shifted to Distribution', description: 'Net outflow detected', severity: 'high' },
      { date: '2d ago', type: 'bridge', title: 'Bridge activity started', description: 'Cross-chain to Solana', severity: 'medium' },
      { date: '5d ago', type: 'coordination', title: 'Coordinated with Bybit', description: 'Similar outflow pattern', severity: 'high' },
      { date: '1w ago', type: 'accumulation', title: 'Accumulation phase ended', description: 'Peak holdings reached', severity: 'low' }
    ]
  },
  flowData: [
    { date: '7d', inflow: 120, outflow: 45, net: 75 },
    { date: '6d', inflow: 89, outflow: 67, net: 22 },
    { date: '5d', inflow: 45, outflow: 78, net: -33 },
    { date: '4d', inflow: 34, outflow: 89, net: -55 },
    { date: '3d', inflow: 23, outflow: 95, net: -72 },
    { date: '2d', inflow: 15, outflow: 110, net: -95 },
    { date: '1d', inflow: 12, outflow: 125, net: -113 },
    { date: 'Now', inflow: 8, outflow: 145, net: -137 }
  ],
  rotation: [
    { from: 'ETH', to: 'SOL', value: '$45M', time: '2d ago' },
    { from: 'BTC', to: 'USDT', value: '$12M', time: '3d ago' }
  ]
};
