import { useState } from 'react';
import { 
  Bell, BellOff, Settings, Filter, X, Check, 
  TrendingUp, TrendingDown, AlertTriangle, Activity, 
  Link2, Zap, Eye, ExternalLink, ChevronDown
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Alert Categories with colors
const ALERT_CATEGORIES = {
  structural: { 
    label: 'Structural', 
    color: 'red', 
    icon: Activity,
    description: 'Behavior changes, coordination, role shifts'
  },
  impact: { 
    label: 'Impact', 
    color: 'amber', 
    icon: TrendingUp,
    description: 'Market impact, large flows, abnormal activity'
  },
  signal: { 
    label: 'Signal Lifecycle', 
    color: 'blue', 
    icon: Zap,
    description: 'Signal created, upgraded, invalidated'
  }
};

// Severity levels
const SEVERITY = {
  danger: { label: 'Danger', color: 'red' },
  warning: { label: 'Warning', color: 'amber' },
  info: { label: 'Info', color: 'blue' }
};

// Mock Alerts Data - NEW STRUCTURE with better titles
const mockAlerts = [
  {
    id: 1,
    category: 'structural',
    severity: 'danger',
    read: false,
    timestamp: Date.now() - 1000 * 60 * 2, // 2 min ago
    
    title: 'Behavior Shift Detected',
    subtitle: 'Accumulating → Distributing (Binance Hot Wallet)',
    source: {
      type: 'entity',
      name: 'Binance Hot Wallet',
      id: 'binance-hot'
    },
    
    whatHappened: 'Behavior switched from ACCUMULATING → DISTRIBUTING. Large outflows detected to 12+ CEX addresses.',
    whyMatters: 'Exchange distribution patterns historically precede 2-3% price drops within 48h.',
    whatToDo: [
      { action: 'Monitor BTC/ETH price for volatility spikes (24-48h)', link: '/tokens' },
      { action: 'Review ETH-related signals for confirmation patterns', link: '/signals' },
      { action: 'Check portfolio exposure and adjust hedges', link: '/portfolio' }
    ],
    
    links: [
      { label: 'View Entity', url: '/entity/binance-hot', type: 'entity' },
      { label: 'View Signals', url: '/signals', type: 'signals' }
    ]
  },
  {
    id: 2,
    category: 'impact',
    severity: 'warning',
    read: false,
    timestamp: Date.now() - 1000 * 60 * 15, // 15 min ago
    
    title: 'Large CEX Deposit',
    subtitle: 'ETH → Coinbase (Vitalik.eth)',
    source: {
      type: 'wallet',
      name: 'Vitalik.eth',
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
    },
    
    whatHappened: '500 ETH deposited to CEX (↑ 4.2x vs 7d avg). Total value: $1.67M.',
    whyMatters: 'Large holder moving to exchange. Historically correlates with short-term sell pressure within 6-12h.',
    whatToDo: [
      { action: 'Monitor ETH price action for immediate dips', link: '/tokens/eth' },
      { action: 'Review active ETH distribution signals', link: '/signals?token=eth' },
      { action: 'Set price alert at -2% threshold', link: '/alerts/settings' }
    ],
    
    links: [
      { label: 'View Wallet', url: '/wallet/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', type: 'wallet' },
      { label: 'View Token (ETH)', url: '/token/eth', type: 'token' }
    ]
  },
  {
    id: 3,
    category: 'structural',
    severity: 'warning',
    read: false,
    timestamp: Date.now() - 1000 * 60 * 32, // 32 min ago
    
    title: 'Bridge Coordination Detected',
    subtitle: '3 entities aligned (Jump Trading)',
    source: {
      type: 'entity',
      name: 'Jump Trading',
      id: 'jump-trading'
    },
    
    whatHappened: 'Coordinated distribution pattern detected. Aligned with Binance, Bybit within 6h window.',
    whyMatters: 'Multi-entity coordination suggests planned market movement. High confidence: 87%. Typically precedes 3-5% price swings.',
    whatToDo: [
      { action: 'Review bridge signals for coordination strength', link: '/signals?filter=bridge' },
      { action: 'Check all aligned entities for flow patterns', link: '/entities' },
      { action: 'Monitor cluster activity for next 12-24h', link: '/entities/jump-trading' }
    ],
    
    links: [
      { label: 'View Entity', url: '/entity/jump-trading', type: 'entity' },
      { label: 'View Bridge Signals', url: '/signals?filter=bridge', type: 'signals' }
    ]
  },
  {
    id: 4,
    category: 'signal',
    severity: 'info',
    read: false,
    timestamp: Date.now() - 1000 * 60 * 45, // 45 min ago
    
    title: 'Signal Strengthened',
    subtitle: 'Confidence ↑ 72 → 89 (ETH Accumulation)',
    source: {
      type: 'signal',
      name: 'Unknown Whale - ETH Accumulation',
      id: 'signal-123'
    },
    
    whatHappened: 'Signal confidence upgraded from 72 → 89. Additional confirmation: inflow acceleration detected.',
    whyMatters: 'High-confidence accumulation signal. Strengthening pattern indicates continued buying pressure over 48-72h.',
    whatToDo: [
      { action: 'View full signal breakdown and timeline', link: '/signal/signal-123' },
      { action: 'Track similar accumulation signals for correlation', link: '/signals?type=accumulation' },
      { action: 'Add wallet to watchlist for monitoring', link: '/watchlist' }
    ],
    
    links: [
      { label: 'View Signal', url: '/signal/signal-123', type: 'signal' },
      { label: 'View Wallet', url: '/wallet/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', type: 'wallet' }
    ]
  },
  {
    id: 5,
    category: 'impact',
    severity: 'info',
    read: true,
    timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2h ago
    
    title: 'Accumulation Spike',
    subtitle: 'ARB buy volume ↑ 3.8x (Wintermute)',
    source: {
      type: 'entity',
      name: 'Wintermute',
      id: 'wintermute'
    },
    
    whatHappened: 'Accumulated $4.2M worth of ARB in 1h. Volume spike: ↑ 3.8x vs baseline.',
    whyMatters: 'Market maker accumulation. Bullish signal for short-term price movement (6-24h window).',
    whatToDo: [
      { action: 'Consider ARB position within next 12h window', link: '/token/arb' },
      { action: 'Track Wintermute for follow-up moves', link: '/entity/wintermute' },
      { action: 'Set ARB price alert at +5% for profit taking', link: '/alerts/settings' }
    ],
    
    links: [
      { label: 'View Token (ARB)', url: '/token/arb', type: 'token' },
      { label: 'View Entity', url: '/entity/wintermute', type: 'entity' }
    ]
  },
  {
    id: 6,
    category: 'signal',
    severity: 'warning',
    read: true,
    timestamp: Date.now() - 1000 * 60 * 60 * 3, // 3h ago
    
    title: 'Signal Invalidated',
    subtitle: 'Confidence ↓ 68 → 23 (ETH Distribution)',
    source: {
      type: 'signal',
      name: 'Coinbase - ETH Distribution',
      id: 'signal-456'
    },
    
    whatHappened: 'Signal confidence dropped from 68 → 23. Pattern broken: accumulation resumed instead of distribution.',
    whyMatters: 'False alarm. Distribution expected but accumulation pattern emerged instead. Market sentiment shifted.',
    whatToDo: [
      { action: 'Review signal history for false positive patterns', link: '/signal/signal-456' },
      { action: 'Check current entity behavior for reversal', link: '/entity/coinbase' },
      { action: 'Update watchlist rules to reduce noise', link: '/watchlist' }
    ],
    
    links: [
      { label: 'View Signal', url: '/signal/signal-456', type: 'signal' },
      { label: 'View Entity', url: '/entity/coinbase', type: 'entity' }
    ]
  }
];

// Settings Modal Component
const SettingsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Alert Settings</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Global Settings */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3">Global Settings</h3>
            <div className="space-y-3 bg-gray-50 rounded-lg p-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-2 block">Minimum Severity</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option>Info</option>
                  <option>Warning</option>
                  <option>Danger</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-2 block">Cooldown (minutes)</label>
                <input type="number" defaultValue="15" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-2 block">Max Alerts Per Day</label>
                <input type="number" defaultValue="50" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                <p className="text-[10px] text-gray-500 mt-1">Limit total alerts to prevent overload</p>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="group-similar" defaultChecked className="rounded" />
                <label htmlFor="group-similar" className="text-xs text-gray-700">Group similar alerts</label>
              </div>
            </div>
          </div>

          {/* Per Source */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3">Alert Sources</h3>
            <div className="space-y-2">
              {['Tokens', 'Wallets', 'Signals', 'Entities'].map(source => (
                <div key={source} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id={source} defaultChecked />
                    <label htmlFor={source} className="text-sm font-semibold text-gray-900">{source}</label>
                  </div>
                  <select className="px-2 py-1 border border-gray-200 rounded text-xs">
                    <option>All</option>
                    <option>Warning+</option>
                    <option>Danger only</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Per Signal Type */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3">Signal Types</h3>
            <div className="space-y-2">
              {['Accumulation', 'Distribution', 'Bridge', 'Risk'].map(type => (
                <div key={type} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <input type="checkbox" id={type} defaultChecked />
                  <label htmlFor={type} className="text-sm text-gray-700">{type}</label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-white text-white rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

const AlertsPage = () => {
  const [alerts, setAlerts] = useState(mockAlerts);
  const [categoryFilter, setCategoryFilter] = useState('all'); // all, structural, impact, signal
  const [severityFilter, setSeverityFilter] = useState('all');
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [mutePopover, setMutePopover] = useState(null); // { alertId, position }

  // Stats
  const unreadCount = alerts.filter(a => !a.read).length;
  const dangerCount = alerts.filter(a => a.severity === 'danger' && !a.read).length;

  // Filtering
  const filteredAlerts = alerts.filter(alert => {
    const matchesCategory = categoryFilter === 'all' || alert.category === categoryFilter;
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesRead = !showOnlyUnread || !alert.read;
    return matchesCategory && matchesSeverity && matchesRead;
  });

  // Handlers
  const handleMarkRead = (id) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, read: true } : a));
  };

  const handleMarkAllRead = () => {
    setAlerts(alerts.map(a => ({ ...a, read: true })));
  };

  const handleRemove = (id) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  // Time ago helper
  const timeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
            <p className="text-sm text-gray-500 mt-1">
              {unreadCount} unread {dangerCount > 0 && `· ${dangerCount} high priority`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                <Check className="w-4 h-4" />
                Mark all read
              </button>
            )}
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-white rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-600 mr-2">Category:</span>
              {['all', 'structural', 'impact', 'signal'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    categoryFilter === cat
                      ? 'bg-white text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {cat === 'all' ? 'All' : ALERT_CATEGORIES[cat].label}
                </button>
              ))}
            </div>

            {/* Right side filters */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowOnlyUnread(!showOnlyUnread)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  showOnlyUnread ? 'bg-blue-100 text-blue-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BellOff className="w-3.5 h-3.5" />
                Unread only
              </button>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Bell className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No alerts</h3>
            <p className="text-gray-500 text-sm">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map(alert => {
              const category = ALERT_CATEGORIES[alert.category];
              const severity = SEVERITY[alert.severity];
              const Icon = category.icon;

              return (
                <div
                  key={alert.id}
                  className={`bg-white rounded-lg border p-4 hover:shadow-md transition-all ${
                    !alert.read ? 'border-l-4 border-l-blue-500' : 'border-gray-200'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${
                        category.color === 'red' ? 'bg-red-100' :
                        category.color === 'amber' ? 'bg-amber-100' :
                        'bg-blue-100'
                      }`}>
                        <Icon className={`w-4 h-4 ${
                          category.color === 'red' ? 'text-red-700' :
                          category.color === 'amber' ? 'text-amber-700' :
                          'text-blue-700'
                        }`} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold text-gray-900">{alert.title}</h3>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            severity.color === 'red' ? 'bg-red-100 text-red-700' :
                            severity.color === 'amber' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {severity.label}
                          </span>
                          {!alert.read && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-blue-500 text-white">
                              UNREAD
                            </span>
                          )}
                        </div>
                        
                        {/* Subtitle */}
                        <div className="text-xs text-gray-600 mb-1">
                          {alert.subtitle}
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          <span className="font-semibold">Source:</span> {alert.source.name} · {timeAgo(alert.timestamp)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {!alert.read && (
                        <button
                          onClick={() => handleMarkRead(alert.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleRemove(alert.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="ml-14 space-y-3">
                    {/* What happened */}
                    <div>
                      <div className="text-xs font-semibold text-gray-700 mb-1">What happened:</div>
                      <p className="text-sm text-gray-600">{alert.whatHappened}</p>
                    </div>

                    {/* Why it matters */}
                    <div>
                      <div className="text-xs font-semibold text-gray-700 mb-1">Why it matters:</div>
                      <p className="text-sm text-gray-600">{alert.whyMatters}</p>
                    </div>

                    {/* What to do */}
                    <div>
                      <div className="text-xs font-semibold text-gray-700 mb-1">What to do:</div>
                      <ul className="space-y-1">
                        {alert.whatToDo.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="text-blue-500">→</span>
                            <Link to={item.link} className="hover:text-blue-600 hover:underline">
                              {item.action}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Links */}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                      {alert.links.map((link, idx) => (
                        <Link
                          key={idx}
                          to={link.url}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                        >
                          {link.label}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ))}
                      
                      {/* Mute similar with popover */}
                      <div className="relative">
                        <button 
                          onClick={() => setMutePopover(mutePopover?.alertId === alert.id ? null : { alertId: alert.id })}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                        >
                          <BellOff className="w-3 h-3" />
                          Mute similar
                        </button>
                        
                        {/* Mute Popover */}
                        {mutePopover?.alertId === alert.id && (
                          <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[180px]">
                            <button
                              onClick={() => {
                                console.log('Mute this entity:', alert.source.name);
                                setMutePopover(null);
                              }}
                              className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 text-gray-700"
                            >
                              Mute this entity
                            </button>
                            <button
                              onClick={() => {
                                console.log('Mute alert type:', alert.category);
                                setMutePopover(null);
                              }}
                              className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 text-gray-700"
                            >
                              Mute this alert type
                            </button>
                            <button
                              onClick={() => {
                                console.log('Mute for 24h');
                                setMutePopover(null);
                              }}
                              className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 text-gray-700"
                            >
                              Mute for 24h
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
};

export default AlertsPage;
