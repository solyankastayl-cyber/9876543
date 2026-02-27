/**
 * Twitter AI (Phase S5) — Sentiment × Price Correlation
 * 
 * "Как настроение Twitter влияет на цену"
 * 
 * Features:
 * - Price charts overlay с sentiment
 * - Asset cards with click → show related tweets
 * - Correlation analysis
 * - Signal generation
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent } from '../components/ui/dialog';
import { ScrollArea } from '../components/ui/scroll-area';
import { Skeleton } from '../components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../components/ui/tooltip';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Activity,
  Zap,
  Target,
  RefreshCw,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  MessageCircle,
  AlertTriangle,
  Sparkles,
  Heart,
  Repeat2,
  Eye,
  ChevronRight,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Mock tweets for each asset
const MOCK_ASSET_TWEETS = {
  btc: [
    {
      id: 'btc1',
      username: 'whale_alert',
      handle: '@whale_alert',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=whale',
      content: '🚨 1,000 BTC ($67,234,500) transferred from unknown wallet to Coinbase. Bullish accumulation signal! #Bitcoin',
      timestamp: '25m ago',
      metrics: { likes: 2340, retweets: 890, views: '125K' },
      sentiment: { label: 'POSITIVE', score: 0.85, confidence: 0.82 },
    },
    {
      id: 'btc2',
      username: 'CryptoCapo_',
      handle: '@CryptoCapo_',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=capo',
      content: 'BTC breaking through resistance. Next target: $70K. The momentum is building. 🎯',
      timestamp: '1h ago',
      metrics: { likes: 5670, retweets: 1200, views: '234K' },
      sentiment: { label: 'POSITIVE', score: 0.78, confidence: 0.75 },
    },
    {
      id: 'btc3',
      username: 'BitcoinMagazine',
      handle: '@BitcoinMagazine',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=btcmag',
      content: 'JUST IN: BlackRock Bitcoin ETF sees record inflows of $500M in single day. Institutional adoption accelerating.',
      timestamp: '2h ago',
      metrics: { likes: 8900, retweets: 3400, views: '567K' },
      sentiment: { label: 'POSITIVE', score: 0.92, confidence: 0.88 },
    },
    {
      id: 'btc4',
      username: 'PeterSchiff',
      handle: '@PeterSchiff',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=schiff',
      content: 'Bitcoin rally is unsustainable. Classic pump before the dump. Smart money selling into retail FOMO.',
      timestamp: '3h ago',
      metrics: { likes: 1200, retweets: 890, views: '89K' },
      sentiment: { label: 'NEGATIVE', score: 0.25, confidence: 0.71 },
    },
  ],
  eth: [
    {
      id: 'eth1',
      username: 'VitalikButerin',
      handle: '@VitalikButerin',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=vitalik',
      content: 'Interesting developments in L2 scaling. The ecosystem is maturing nicely. More research needed on data availability.',
      timestamp: '45m ago',
      metrics: { likes: 12000, retweets: 4500, views: '890K' },
      sentiment: { label: 'NEUTRAL', score: 0.55, confidence: 0.62 },
    },
    {
      id: 'eth2',
      username: 'sassal0x',
      handle: '@sassal0x',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=sassal',
      content: 'ETH staking rewards looking solid. The merge was the best thing to happen to Ethereum. Long-term bullish. 🦇🔊',
      timestamp: '2h ago',
      metrics: { likes: 3400, retweets: 890, views: '156K' },
      sentiment: { label: 'POSITIVE', score: 0.72, confidence: 0.68 },
    },
    {
      id: 'eth3',
      username: 'CoinDesk',
      handle: '@CoinDesk',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=coindesk',
      content: 'Ethereum gas fees spike as new NFT collection launches. Network congestion causing delays for DeFi users.',
      timestamp: '4h ago',
      metrics: { likes: 890, retweets: 345, views: '67K' },
      sentiment: { label: 'NEGATIVE', score: 0.35, confidence: 0.65 },
    },
  ],
  sol: [
    {
      id: 'sol1',
      username: 'aaboronkov',
      handle: '@aaboronkov',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=anatoly',
      content: 'Solana TPS hitting new records. The network is handling load like never before. Firedancer coming soon! 🔥',
      timestamp: '30m ago',
      metrics: { likes: 6700, retweets: 2100, views: '345K' },
      sentiment: { label: 'POSITIVE', score: 0.88, confidence: 0.85 },
    },
    {
      id: 'sol2',
      username: 'SolanaFloor',
      handle: '@SolanaFloor',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=floor',
      content: 'SOL ecosystem TVL up 40% this month. DeFi summer 2.0 happening on Solana right now. 📈',
      timestamp: '1h ago',
      metrics: { likes: 4500, retweets: 1800, views: '234K' },
      sentiment: { label: 'POSITIVE', score: 0.82, confidence: 0.79 },
    },
    {
      id: 'sol3',
      username: 'heaboronkov',
      handle: '@heliuslabs',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=helius',
      content: 'Major protocols choosing Solana for speed and cost. The narrative is shifting. Builders are building.',
      timestamp: '2h ago',
      metrics: { likes: 3200, retweets: 1100, views: '189K' },
      sentiment: { label: 'POSITIVE', score: 0.79, confidence: 0.76 },
    },
    {
      id: 'sol4',
      username: 'CryptoHayes',
      handle: '@CryptoHayes',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=hayes',
      content: 'SOL showing strongest momentum in alt market. Breaking out while others consolidate. Target: $200.',
      timestamp: '3h ago',
      metrics: { likes: 8900, retweets: 3400, views: '456K' },
      sentiment: { label: 'POSITIVE', score: 0.86, confidence: 0.81 },
    },
  ],
};

// Mock data for price-sentiment correlation
const MOCK_CORRELATIONS = [
  {
    id: 'btc',
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 67234.50,
    priceChange24h: 2.34,
    sentiment: {
      current: 'POSITIVE',
      score: 0.72,
      change24h: 0.08,
    },
    correlation: {
      strength: 0.78,
      lag: '4h',
      confidence: 0.82,
    },
    signal: {
      type: 'BUY',
      strength: 'STRONG',
      reason: 'Positive sentiment surge precedes price movement',
    },
    tweets24h: 12450,
    influencerMentions: 89,
  },
  {
    id: 'eth',
    symbol: 'ETH',
    name: 'Ethereum',
    price: 3456.78,
    priceChange24h: -1.23,
    sentiment: {
      current: 'NEUTRAL',
      score: 0.52,
      change24h: -0.05,
    },
    correlation: {
      strength: 0.65,
      lag: '6h',
      confidence: 0.71,
    },
    signal: {
      type: 'HOLD',
      strength: 'WEAK',
      reason: 'Mixed sentiment, no clear direction',
    },
    tweets24h: 8920,
    influencerMentions: 56,
  },
  {
    id: 'sol',
    symbol: 'SOL',
    name: 'Solana',
    price: 142.30,
    priceChange24h: 5.67,
    sentiment: {
      current: 'POSITIVE',
      score: 0.81,
      change24h: 0.15,
    },
    correlation: {
      strength: 0.85,
      lag: '2h',
      confidence: 0.88,
    },
    signal: {
      type: 'BUY',
      strength: 'STRONG',
      reason: 'High correlation with rapid sentiment improvement',
    },
    tweets24h: 6780,
    influencerMentions: 123,
  },
];

// Sentiment badge component
const SentimentBadge = ({ label, score }) => {
  const colors = {
    POSITIVE: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    NEGATIVE: 'bg-red-100 text-red-700 border-red-300',
    NEUTRAL: 'bg-amber-100 text-amber-700 border-amber-300',
  };
  return (
    <Badge className={`${colors[label]} font-medium`}>
      {label} ({Math.round(score * 100)}%)
    </Badge>
  );
};

// Signal badge component
const SignalBadge = ({ type, strength }) => {
  const colors = {
    BUY: 'bg-emerald-500 text-white',
    SELL: 'bg-red-500 text-white',
    HOLD: 'bg-gray-500 text-white',
  };
  const icons = {
    BUY: <ArrowUpRight className="w-3 h-3" />,
    SELL: <ArrowDownRight className="w-3 h-3" />,
    HOLD: <Activity className="w-3 h-3" />,
  };
  return (
    <Badge className={`${colors[type]} flex items-center gap-1`}>
      {icons[type]}
      {type} ({strength})
    </Badge>
  );
};

// Price change component
const PriceChange = ({ value }) => {
  const isPositive = value >= 0;
  return (
    <span className={`flex items-center gap-0.5 font-medium ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
      {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
      {isPositive ? '+' : ''}{value.toFixed(2)}%
    </span>
  );
};

// Correlation strength meter
const CorrelationMeter = ({ strength, confidence }) => {
  const getColor = (val) => {
    if (val >= 0.8) return 'bg-emerald-500';
    if (val >= 0.6) return 'bg-amber-500';
    return 'bg-red-500';
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Correlation</span>
              <span>{Math.round(strength * 100)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getColor(strength)} transition-all`}
                style={{ width: `${strength * 100}%` }}
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Confidence: {Math.round(confidence * 100)}%</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Mini sparkline placeholder
const MiniChart = ({ trend }) => {
  const isUp = trend === 'up';
  return (
    <div className="w-16 h-8 flex items-end gap-0.5">
      {[40, 55, 45, 60, 50, 70, isUp ? 80 : 35].map((h, i) => (
        <div 
          key={i}
          className={`flex-1 rounded-sm ${isUp ? 'bg-emerald-400' : 'bg-red-400'}`}
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
};

// Tweet card for modal
const TweetCard = ({ tweet }) => {
  const sentimentColors = {
    POSITIVE: 'border-l-emerald-500 bg-emerald-50/30',
    NEGATIVE: 'border-l-red-500 bg-red-50/30',
    NEUTRAL: 'border-l-amber-500 bg-amber-50/30',
  };
  
  return (
    <div className={`p-4 border-l-4 rounded-r-lg ${sentimentColors[tweet.sentiment.label]} bg-white border border-gray-200`}>
      <div className="flex items-start gap-3">
        <img 
          src={tweet.avatar} 
          alt={tweet.username}
          className="w-10 h-10 rounded-full bg-gray-200"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{tweet.username}</span>
            <span className="text-gray-500 text-sm">{tweet.handle}</span>
            <span className="text-gray-400 text-sm">· {tweet.timestamp}</span>
          </div>
          <p className="text-gray-800 mt-1 leading-relaxed">{tweet.content}</p>
          
          {/* Metrics */}
          <div className="flex items-center gap-4 mt-3 text-gray-500 text-sm">
            <span className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              {tweet.metrics.likes.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Repeat2 className="w-4 h-4" />
              {tweet.metrics.retweets.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {tweet.metrics.views}
            </span>
          </div>
          
          {/* Sentiment */}
          <div className="flex items-center gap-2 mt-3">
            <SentimentBadge label={tweet.sentiment.label} score={tweet.sentiment.score} />
            <span className="text-xs text-gray-500">
              Confidence: {Math.round(tweet.sentiment.confidence * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Asset detail modal
const AssetDetailModal = ({ asset, open, onClose }) => {
  if (!asset) return null;
  
  const tweets = MOCK_ASSET_TWEETS[asset.id] || [];
  const positiveCount = tweets.filter(t => t.sentiment.label === 'POSITIVE').length;
  const negativeCount = tweets.filter(t => t.sentiment.label === 'NEGATIVE').length;
  const neutralCount = tweets.filter(t => t.sentiment.label === 'NEUTRAL').length;
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-white border-gray-200 p-0 max-h-[90vh]">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center font-bold text-gray-700 text-lg">
                {asset.symbol}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{asset.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-lg font-semibold">${asset.price.toLocaleString()}</span>
                  <PriceChange value={asset.priceChange24h} />
                </div>
              </div>
            </div>
            <SignalBadge type={asset.signal.type} strength={asset.signal.strength} />
          </div>
          
          {/* Summary */}
          <div className="flex items-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Sentiment:</span>
              <SentimentBadge label={asset.sentiment.current} score={asset.sentiment.score} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Posts:</span>
              <span className="font-medium">{tweets.length}</span>
              <span className="text-emerald-600">+{positiveCount}</span>
              <span className="text-gray-400">{neutralCount}</span>
              <span className="text-red-600">-{negativeCount}</span>
            </div>
          </div>
        </div>
        
        {/* Signal Reason */}
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 mt-0.5" />
            <p className="text-sm text-blue-700">{asset.signal.reason}</p>
          </div>
        </div>
        
        {/* Tweets List */}
        <ScrollArea className="max-h-[calc(90vh-220px)]">
          <div className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Related Posts ({tweets.length})
            </h3>
            {tweets.map(tweet => (
              <TweetCard key={tweet.id} tweet={tweet} />
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default function TwitterAIPage() {
  const [loading, setLoading] = useState(true);
  const [correlations, setCorrelations] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setCorrelations(MOCK_CORRELATIONS);
      setLoading(false);
    }, 1000);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  const handleAssetClick = (asset) => {
    setSelectedAsset(asset);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-500" />
                Twitter AI
              </h1>
              <p className="text-gray-500 mt-1">
                Sentiment × Price correlation analysis
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                <Zap className="w-3 h-3 mr-1" />
                AI-Powered
              </Badge>
              <Button variant="outline" onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dev Mode Banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-6 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-amber-700 text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span><strong>Dev Mode</strong> — Showing mock data. Click on any asset to see related tweets.</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Correlation Cards */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Sentiment-Price Correlations
              <span className="text-xs text-gray-500 font-normal ml-2">Click to see tweets</span>
            </h2>
            
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="bg-white">
                    <CardContent className="p-6">
                      <Skeleton className="h-32 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {correlations.map(item => (
                  <Card 
                    key={item.id} 
                    className="bg-white hover:shadow-lg hover:border-purple-200 transition-all cursor-pointer group"
                    onClick={() => handleAssetClick(item)}
                    data-testid={`correlation-card-${item.id}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        {/* Asset Info */}
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center font-bold text-gray-700 group-hover:from-purple-50 group-hover:to-purple-100 transition-colors">
                            {item.symbol}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 flex items-center gap-2">
                              {item.name}
                              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xl font-bold">${item.price.toLocaleString()}</span>
                              <PriceChange value={item.priceChange24h} />
                            </div>
                          </div>
                        </div>

                        {/* Signal */}
                        <SignalBadge type={item.signal.type} strength={item.signal.strength} />
                      </div>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-4 gap-4 mt-6">
                        {/* Sentiment */}
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Sentiment</div>
                          <SentimentBadge label={item.sentiment.current} score={item.sentiment.score} />
                          <div className={`text-xs mt-1 ${item.sentiment.change24h >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {item.sentiment.change24h >= 0 ? '+' : ''}{(item.sentiment.change24h * 100).toFixed(0)}% 24h
                          </div>
                        </div>

                        {/* Correlation */}
                        <div>
                          <CorrelationMeter 
                            strength={item.correlation.strength} 
                            confidence={item.correlation.confidence}
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            <Clock className="w-3 h-3 inline mr-1" />
                            Lag: {item.correlation.lag}
                          </div>
                        </div>

                        {/* Activity */}
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Twitter Activity</div>
                          <div className="font-semibold text-gray-900">{item.tweets24h.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">tweets/24h</div>
                        </div>

                        {/* Mini Chart */}
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Trend</div>
                          <MiniChart trend={item.priceChange24h >= 0 ? 'up' : 'down'} />
                        </div>
                      </div>

                      {/* Signal Reason */}
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 group-hover:bg-purple-50 transition-colors">
                        <Info className="w-4 h-4 inline mr-2 text-gray-400 group-hover:text-purple-400" />
                        {item.signal.reason}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Right: Stats & Quick Links */}
          <div className="space-y-4">
            {/* AI Model Stats */}
            <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  AI Model Stats
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-purple-200">Avg Correlation</div>
                    <div className="text-xl font-bold">76%</div>
                  </div>
                  <div>
                    <div className="text-purple-200">Prediction Accuracy</div>
                    <div className="text-xl font-bold">68%</div>
                  </div>
                  <div>
                    <div className="text-purple-200">Avg Lag Time</div>
                    <div className="text-xl font-bold">4.2h</div>
                  </div>
                  <div>
                    <div className="text-purple-200">Signals/Day</div>
                    <div className="text-xl font-bold">12</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Influencers */}
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-500" />
                  Top Influencers Today
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {['whale_alert', 'CryptoCapo_', 'BitcoinMagazine'].map((name, i) => (
                    <div key={name} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <img 
                          src={`https://api.dicebear.com/7.x/identicon/svg?seed=${name}`}
                          alt={name}
                          className="w-8 h-8 rounded-full"
                        />
                        <span className="text-sm font-medium">@{name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700">
                        {[15, 12, 8][i]} posts
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Link to Twitter Feed */}
            <Card className="bg-white border-dashed border-2 border-gray-300">
              <CardContent className="p-4 text-center">
                <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-3">
                  Want sentiment without price data?
                </p>
                <Link to="/sentiment/twitter">
                  <Button variant="outline" size="sm">
                    Go to Twitter Feed
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Asset Detail Modal */}
      <AssetDetailModal 
        asset={selectedAsset} 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
      />
    </div>
  );
}
