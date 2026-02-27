/**
 * Twitter Feed (Phase S3.9) — Sentiment без цены
 * 
 * "Что сейчас пишут в Twitter и какое там настроение"
 * 
 * Features:
 * - Twitter посты с sentiment bars
 * - Community sentiment aggregation
 * - Account sentiment + sparklines
 * - Filters (Positive/Neutral/Negative, Strong/Weak signal)
 * - Trending keywords
 * 
 * ❌ БЕЗ: price charts, price deltas, market blocks
 * 
 * UI based on Figma designs - Twitter.png & Sentiments Twitter Clicked Post.png
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
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
  Search, 
  RefreshCw, 
  ChevronRight, 
  MessageCircle, 
  Repeat2, 
  Heart, 
  Eye, 
  Bookmark,
  AlertCircle,
  Info,
  TrendingUp,
  TrendingDown,
  Inbox,
  MessageSquare,
  Filter,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';


const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// S3.6.3: Mock data for Twitter accounts with sentiment aggregation
const MOCK_ACCOUNTS = [
  {
    id: '1',
    username: 'TradingView',
    handle: '@tradingview',
    avatar: 'https://pbs.twimg.com/profile_images/1709908032769138688/P7Hvgg5D_400x400.jpg',
    followers: '2.1M',
    following: '156',
    description: 'Look first. Then leap.',
    accountSentiment: {
      current: { label: 'POSITIVE', confidence: 0.81, score: 0.78 },
      delta: { '24h': 0.06, '7d': -0.03 },
      postsAnalyzed: 24,
      avgPostConfidence: 0.78,
      history: [
        { ts: '2024-03-01T06:00:00Z', score: 0.68 },
        { ts: '2024-03-01T10:00:00Z', score: 0.72 },
        { ts: '2024-03-01T14:00:00Z', score: 0.75 },
        { ts: '2024-03-01T18:00:00Z', score: 0.81 },
        { ts: '2024-03-01T22:00:00Z', score: 0.78 },
        { ts: '2024-03-02T02:00:00Z', score: 0.82 },
        { ts: '2024-03-02T06:00:00Z', score: 0.78 },
      ]
    }
  },
  {
    id: '2',
    username: 'Bhuvanesh Sharma',
    handle: '@BhuvaneshSh',
    avatar: 'https://pbs.twimg.com/profile_images/1649820382557552640/SQKLVXdi_400x400.jpg',
    followers: '45.2K',
    following: '892',
    description: 'Crypto analyst & trader',
    accountSentiment: {
      current: { label: 'POSITIVE', confidence: 0.72, score: 0.69 },
      delta: { '24h': 0.12, '7d': 0.08 },
      postsAnalyzed: 18,
      avgPostConfidence: 0.71,
      history: [
        { ts: '2024-03-01T06:00:00Z', score: 0.55 },
        { ts: '2024-03-01T10:00:00Z', score: 0.58 },
        { ts: '2024-03-01T14:00:00Z', score: 0.62 },
        { ts: '2024-03-01T18:00:00Z', score: 0.68 },
        { ts: '2024-03-01T22:00:00Z', score: 0.65 },
        { ts: '2024-03-02T02:00:00Z', score: 0.71 },
        { ts: '2024-03-02T06:00:00Z', score: 0.69 },
      ]
    }
  },
  {
    id: '3',
    username: 'CoinDesk',
    handle: '@CoinDesk',
    avatar: 'https://pbs.twimg.com/profile_images/1710336336462389248/BZ0E9wYz_400x400.jpg',
    followers: '3.4M',
    following: '2,341',
    description: 'The leader in news and information on cryptocurrency',
    accountSentiment: {
      current: { label: 'NEUTRAL', confidence: 0.52, score: 0.48 },
      delta: { '24h': -0.08, '7d': -0.15 },
      postsAnalyzed: 42,
      avgPostConfidence: 0.68,
      history: [
        { ts: '2024-03-01T06:00:00Z', score: 0.65 },
        { ts: '2024-03-01T10:00:00Z', score: 0.58 },
        { ts: '2024-03-01T14:00:00Z', score: 0.52 },
        { ts: '2024-03-01T18:00:00Z', score: 0.45 },
        { ts: '2024-03-01T22:00:00Z', score: 0.48 },
        { ts: '2024-03-02T02:00:00Z', score: 0.42 },
        { ts: '2024-03-02T06:00:00Z', score: 0.48 },
      ]
    }
  },
];

// S3.6.1: Enhanced mock tweets with explanation data
// S3.6.2: Added commentsAggregate for community sentiment
const MOCK_TWEETS = [
  {
    id: 't1',
    accountId: '1',
    username: 'TradingView',
    handle: '@tradingview',
    avatar: 'https://pbs.twimg.com/profile_images/1709908032769138688/P7Hvgg5D_400x400.jpg',
    content: '📱 TradingView is now in Telegram! Track market movements, analyze charts, and stay informed, all without leaving your messages. Start charting smarter today 👉',
    image: 'https://pbs.twimg.com/media/GdT1u2yWcAAZJK4?format=jpg&name=medium',
    link: 't.me/BotFather/tradingview',
    timestamp: '2h ago',
    metrics: { comments: 234, retweets: 1200, likes: 5600, views: '125K', bookmarks: 890 },
    sentiment: { 
      score: 0.82, 
      label: 'POSITIVE', 
      confidence: 0.78,
      modelScore: 0.65,
      rulesBoost: 0.17,
      rulesApplied: ['bullish_keywords', 'positive_verbs'],
      reasons: [
        'Detected bullish keywords',
        'Positive announcement language',
        'Keywords found: track, smarter'
      ]
    },
    // S3.6.2: Community sentiment aggregate
    commentsAggregate: {
      total: 234,
      distribution: { positive: 156, neutral: 52, negative: 26 },
      percentages: { positive: 67, neutral: 22, negative: 11 },
      dominant: 'POSITIVE',
      confidenceAvg: 0.79
    },
    comments: [
      {
        id: 'c1',
        username: 'CryptoTrader_X',
        handle: '@CryptoTraderX',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=trader1',
        content: 'Finally! Been waiting for this integration. Great work team! 🚀',
        timestamp: '1h ago',
        metrics: { comments: 5, retweets: 12, likes: 89, views: '2.1K', bookmarks: 8 },
        sentiment: { 
          score: 0.88, 
          label: 'POSITIVE', 
          confidence: 0.85,
          modelScore: 0.72,
          rulesBoost: 0.16,
          rulesApplied: ['bullish_keywords', 'emoji_boost'],
          reasons: ['Strong positive language', 'Rocket emoji detected']
        },
      },
      {
        id: 'c2',
        username: 'DeFi_Analyst',
        handle: '@DeFiAnalyst',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=analyst1',
        content: 'This is exactly what the community needed. Seamless charts on mobile!',
        timestamp: '1h ago',
        metrics: { comments: 2, retweets: 8, likes: 45, views: '1.2K', bookmarks: 3 },
        sentiment: { 
          score: 0.82, 
          label: 'POSITIVE', 
          confidence: 0.76,
          modelScore: 0.68,
          rulesBoost: 0.14,
          rulesApplied: ['positive_verbs'],
          reasons: ['Positive community sentiment', 'Product praise detected']
        },
      },
      {
        id: 'c3',
        username: 'MarketWatch_Pro',
        handle: '@MarketWatchPro',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=market1',
        content: 'Interesting move into Telegram ecosystem. Let\'s see how it performs.',
        timestamp: '45m ago',
        metrics: { comments: 1, retweets: 3, likes: 21, views: '890', bookmarks: 2 },
        sentiment: { 
          score: 0.52, 
          label: 'NEUTRAL', 
          confidence: 0.45,
          modelScore: 0.52,
          rulesBoost: 0,
          rulesApplied: [],
          reasons: ['No strong sentiment indicators', 'Balanced language detected']
        },
      },
    ],
  },
  {
    id: 't2',
    accountId: '2',
    username: 'Bhuvanesh Sharma',
    handle: '@BhuvaneshSh',
    avatar: 'https://pbs.twimg.com/profile_images/1649820382557552640/SQKLVXdi_400x400.jpg',
    content: 'BTC showing strong support at $42K level. RSI indicates oversold conditions on 4H chart. Expecting a bounce to $44K in the next 48 hours. Not financial advice, DYOR.',
    image: null,
    timestamp: '4h ago',
    metrics: { comments: 89, retweets: 234, likes: 1200, views: '45K', bookmarks: 156 },
    sentiment: { 
      score: 0.72, 
      label: 'POSITIVE', 
      confidence: 0.68,
      modelScore: 0.58,
      rulesBoost: 0.14,
      rulesApplied: ['bullish_keywords', 'price_surge'],
      reasons: [
        'Detected bullish keywords',
        'Positive price prediction',
        'Keywords found: support, bounce'
      ]
    },
    commentsAggregate: {
      total: 89,
      distribution: { positive: 52, neutral: 24, negative: 13 },
      percentages: { positive: 58, neutral: 27, negative: 15 },
      dominant: 'POSITIVE',
      confidenceAvg: 0.71
    },
    comments: [],
  },
  {
    id: 't3',
    accountId: '3',
    username: 'CoinDesk',
    handle: '@CoinDesk',
    avatar: 'https://pbs.twimg.com/profile_images/1710336336462389248/BZ0E9wYz_400x400.jpg',
    content: 'BREAKING: SEC delays decision on spot Bitcoin ETF applications again. Market reacts with 2% dip across major cryptocurrencies.',
    image: null,
    timestamp: '6h ago',
    metrics: { comments: 456, retweets: 890, likes: 2300, views: '234K', bookmarks: 567 },
    sentiment: { 
      score: 0.28, 
      label: 'NEGATIVE', 
      confidence: 0.72,
      modelScore: 0.35,
      rulesBoost: -0.07,
      rulesApplied: ['bearish_keywords', 'negative_verbs'],
      reasons: [
        'Detected bearish keywords',
        'Negative market event',
        'Keywords found: delays, dip'
      ]
    },
    commentsAggregate: {
      total: 456,
      distribution: { positive: 82, neutral: 137, negative: 237 },
      percentages: { positive: 18, neutral: 30, negative: 52 },
      dominant: 'NEGATIVE',
      confidenceAvg: 0.74
    },
    comments: [],
  },
  {
    id: 't4',
    accountId: '1',
    username: 'TradingView',
    handle: '@tradingview',
    avatar: 'https://pbs.twimg.com/profile_images/1709908032769138688/P7Hvgg5D_400x400.jpg',
    content: 'New feature alert! Pine Script v5.1 is here with improved array functions and better error handling. Update your scripts today.',
    image: null,
    timestamp: '8h ago',
    metrics: { comments: 123, retweets: 567, likes: 2100, views: '89K', bookmarks: 234 },
    commentsAggregate: {
      total: 123,
      distribution: { positive: 78, neutral: 34, negative: 11 },
      percentages: { positive: 63, neutral: 28, negative: 9 },
      dominant: 'POSITIVE',
      confidenceAvg: 0.68
    },
    sentiment: { 
      score: 0.75, 
      label: 'POSITIVE', 
      confidence: 0.65,
      modelScore: 0.62,
      rulesBoost: 0.13,
      rulesApplied: ['positive_verbs'],
      reasons: [
        'Product announcement',
        'Positive feature description',
        'Keywords found: improved, better'
      ]
    },
    comments: [],
  },
];

const TRENDING_KEYWORDS = [
  { keyword: 'Bitcoin ETF', count: 2345 },
  { keyword: 'Solana', count: 1890 },
  { keyword: 'DeFi Summer', count: 1234 },
  { keyword: 'Layer 2', count: 987 },
  { keyword: 'Airdrop', count: 876 },
];

// ============================================
// S3.6.4: UX Components (Empty, Loading, Error)
// ============================================

// Empty State Component
const EmptyState = ({ 
  icon: Icon = Inbox, 
  title, 
  description, 
  action,
  onAction 
}) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-gray-400" />
    </div>
    <h3 className="text-gray-900 font-medium mb-1">{title}</h3>
    <p className="text-gray-500 text-sm max-w-xs mb-4">{description}</p>
    {action && onAction && (
      <Button variant="outline" size="sm" onClick={onAction}>
        {action}
      </Button>
    )}
  </div>
);

// Error State Component
const ErrorState = ({ 
  title = "Something went wrong",
  description = "We couldn't load the sentiment data",
  onRetry 
}) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-4">
      <AlertTriangle className="w-6 h-6 text-amber-500" />
    </div>
    <h3 className="text-gray-900 font-medium mb-1">{title}</h3>
    <p className="text-gray-500 text-sm max-w-xs mb-4">{description}</p>
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RotateCcw className="w-4 h-4 mr-2" />
        Try again
      </Button>
    )}
  </div>
);

// Tweet Card Skeleton
const TweetCardSkeleton = () => (
  <Card className="bg-white border-gray-200">
    <CardContent className="p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
      <div className="flex items-center gap-6 mt-4 pl-13">
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-4 w-8" />
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100">
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
    </CardContent>
  </Card>
);

// Account Card Skeleton
const AccountCardSkeleton = () => (
  <div className="p-3 rounded-lg border border-transparent">
    <div className="flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
    <div className="flex items-center gap-4 mt-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-3 w-16" />
    </div>
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-5 w-16 rounded" />
        <Skeleton className="h-3 w-12" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  </div>
);

// Feed Loading Skeleton
const FeedLoadingSkeleton = () => (
  <div className="space-y-4">
    <TweetCardSkeleton />
    <TweetCardSkeleton />
    <TweetCardSkeleton />
  </div>
);

// Sidebar Loading Skeleton
const SidebarLoadingSkeleton = () => (
  <div className="space-y-2">
    <AccountCardSkeleton />
    <AccountCardSkeleton />
    <AccountCardSkeleton />
  </div>
);

// ============================================

// S3.6.1: Confidence explanation tooltip content
const ConfidenceTooltipContent = ({ sentiment }) => {
  const modelPct = Math.round(sentiment.modelScore * 100);
  const boostPct = Math.round(sentiment.rulesBoost * 100);
  const boostSign = boostPct >= 0 ? '+' : '';
  
  return (
    <div className="space-y-3 p-1">
      <div className="font-medium text-sm border-b pb-2">Why this result?</div>
      
      {/* Score breakdown */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Model score:</span>
          <span className="font-mono">{modelPct}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Rules boost:</span>
          <span className={`font-mono ${boostPct > 0 ? 'text-emerald-400' : boostPct < 0 ? 'text-red-400' : 'text-gray-400'}`}>
            {boostSign}{boostPct}%
          </span>
        </div>
      </div>
      
      {/* Reasons */}
      {sentiment.reasons && sentiment.reasons.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Signals</div>
          <ul className="text-sm space-y-0.5">
            {sentiment.reasons.map((reason, i) => (
              <li key={i} className="text-gray-700 flex items-start gap-1.5">
                <span className="text-emerald-400 mt-0.5">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Rules applied */}
      {sentiment.rulesApplied && sentiment.rulesApplied.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Rules applied</div>
          <div className="flex flex-wrap gap-1">
            {sentiment.rulesApplied.map((rule, i) => (
              <span key={i} className="px-1.5 py-0.5 bg-gray-700 rounded text-xs text-gray-700">
                {rule}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// S3.6.1: Updated Sentiment bar with Confidence + tooltip
const SentimentBar = ({ sentiment, size = 'default' }) => {
  const score = sentiment.score;
  const confidence = sentiment.confidence;
  const percentage = Math.round(score * 100);
  const confidencePct = Math.round(confidence * 100);
  const barHeight = size === 'small' ? 'h-1.5' : 'h-2';
  const isAdjusted = sentiment.rulesBoost !== 0 || (sentiment.rulesApplied && sentiment.rulesApplied.length > 0);
  
  const getLabelColor = (score) => {
    if (score >= 0.6) return 'text-emerald-500';
    if (score <= 0.4) return 'text-red-500';
    return 'text-amber-500';
  };

  const getLabel = (score) => {
    if (score >= 0.6) return 'Positive';
    if (score <= 0.4) return 'Negative';
    return 'Neutral';
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">Confidence</span>
          {/* S3.6.1: Info icon with tooltip */}
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-gray-400 hover:text-gray-700 focus:outline-none">
                  <Info className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent 
                side="top" 
                className="bg-gray-800 border-gray-200 text-white max-w-xs"
              >
                <ConfidenceTooltipContent sentiment={sentiment} />
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {/* S3.6.1: Adjusted badge */}
          {isAdjusted && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded text-[10px] font-medium">
              Adjusted
            </span>
          )}
        </div>
        <span className={`font-medium ${getLabelColor(score)}`}>{getLabel(score)}</span>
      </div>
      <div className={`w-full ${barHeight} rounded-full overflow-hidden relative`}
        style={{ background: 'linear-gradient(to right, #ef4444, #f59e0b, #22c55e)' }}>
        <div 
          className="absolute top-0 h-full w-1 bg-white shadow-md rounded"
          style={{ left: `calc(${percentage}% - 2px)` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>{confidencePct}%</span>
      </div>
    </div>
  );
};

// Tweet card component with improved hover states
const TweetCard = ({ tweet, onClick }) => {
  return (
    <Card 
      className="bg-white hover:bg-gray-50 hover:shadow-md cursor-pointer transition-all duration-200 border-gray-200 group"
      onClick={() => onClick(tweet)}
      data-testid={`tweet-card-${tweet.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <img 
            src={tweet.avatar} 
            alt={tweet.username}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-gray-200 transition-all"
            onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${tweet.username}`; }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 truncate">{tweet.username}</span>
              <span className="text-gray-500 text-sm">{tweet.handle}</span>
              <span className="text-gray-400 text-sm">· {tweet.timestamp}</span>
            </div>
            <p className="text-gray-700 mt-1 text-sm leading-relaxed">{tweet.content}</p>
            
            {tweet.image && (
              <img 
                src={tweet.image} 
                alt="Tweet media"
                className="mt-3 rounded-xl w-full max-h-64 object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            
            {tweet.link && (
              <a 
                href={`https://${tweet.link}`} 
                className="text-blue-500 text-sm mt-2 block hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {tweet.link}
              </a>
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
        </div>

        <div className="flex items-center gap-6 mt-4 text-gray-500 text-sm pl-13">
          <div className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            <span>{tweet.metrics.comments}</span>
          </div>
          <div className="flex items-center gap-1">
            <Repeat2 className="w-4 h-4" />
            <span>{tweet.metrics.retweets}</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="w-4 h-4" />
            <span>{tweet.metrics.likes}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{tweet.metrics.views}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bookmark className="w-4 h-4" />
            <span>{tweet.metrics.bookmarks}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <SentimentBar sentiment={tweet.sentiment} />
        </div>
      </CardContent>
    </Card>
  );
};

// Comment component for detail modal (light theme)
const CommentItem = ({ comment }) => (
  <div className="py-4 border-b border-gray-100 last:border-0">
    <div className="flex items-start gap-3">
      <img 
        src={comment.avatar} 
        alt={comment.username}
        className="w-8 h-8 rounded-full object-cover"
        onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${comment.username}`; }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 text-sm">{comment.username}</span>
          <span className="text-gray-500 text-xs">{comment.handle}</span>
          <span className="text-gray-400 text-xs">· {comment.timestamp}</span>
        </div>
        <p className="text-gray-700 mt-1 text-sm">{comment.content}</p>
        
        <div className="flex items-center gap-4 mt-2 text-gray-500 text-xs">
          <div className="flex items-center gap-1">
            <MessageCircle className="w-3 h-3" />
            <span>{comment.metrics.comments}</span>
          </div>
          <div className="flex items-center gap-1">
            <Repeat2 className="w-3 h-3" />
            <span>{comment.metrics.retweets}</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="w-3 h-3" />
            <span>{comment.metrics.likes}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>{comment.metrics.views}</span>
          </div>
        </div>

        {/* S3.6.1: Comment sentiment with tooltip */}
        <div className="mt-3">
          <SentimentBar sentiment={comment.sentiment} size="small" />
        </div>
      </div>
    </div>
  </div>
);

// S3.6.2: Community Sentiment Aggregate Block
const CommunitySentiment = ({ aggregate }) => {
  if (!aggregate || aggregate.total === 0) return null;
  
  const { distribution, percentages, dominant, total, confidenceAvg } = aggregate;
  
  // Colors for the distribution bar
  const getDominantColor = (label) => {
    if (label === 'POSITIVE') return 'text-emerald-600';
    if (label === 'NEGATIVE') return 'text-red-600';
    return 'text-amber-600';
  };
  
  const getDominantBg = (label) => {
    if (label === 'POSITIVE') return 'bg-emerald-50 border-emerald-200';
    if (label === 'NEGATIVE') return 'bg-red-50 border-red-200';
    return 'bg-amber-50 border-amber-200';
  };

  return (
    <div className={`rounded-lg p-4 border ${getDominantBg(dominant)}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900">Community Sentiment</h4>
        <span className={`text-sm font-medium ${getDominantColor(dominant)}`}>
          {dominant === 'POSITIVE' ? '👍 Positive' : dominant === 'NEGATIVE' ? '👎 Negative' : '😐 Neutral'}
        </span>
      </div>
      
      {/* Distribution bar */}
      <div className="h-3 rounded-full overflow-hidden flex mb-2">
        {percentages.negative > 0 && (
          <div 
            className="bg-red-500 transition-all" 
            style={{ width: `${percentages.negative}%` }}
            title={`Negative: ${percentages.negative}%`}
          />
        )}
        {percentages.neutral > 0 && (
          <div 
            className="bg-amber-400 transition-all" 
            style={{ width: `${percentages.neutral}%` }}
            title={`Neutral: ${percentages.neutral}%`}
          />
        )}
        {percentages.positive > 0 && (
          <div 
            className="bg-emerald-500 transition-all" 
            style={{ width: `${percentages.positive}%` }}
            title={`Positive: ${percentages.positive}%`}
          />
        )}
      </div>
      
      {/* Percentages text */}
      <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          {percentages.positive}% Positive
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          {percentages.neutral}% Neutral
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          {percentages.negative}% Negative
        </span>
      </div>
      
      {/* Meta info */}
      <div className="text-xs text-gray-500">
        {total} comments analyzed · Avg confidence: {Math.round(confidenceAvg * 100)}%
      </div>
    </div>
  );
};

// Tweet detail modal (light theme)
const TweetDetailModal = ({ tweet, open, onClose }) => {
  if (!tweet) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white border-gray-200 p-0 max-h-[90vh] [&>button]:text-gray-500 [&>button]:hover:text-gray-900 [&>button]:hover:bg-gray-100 [&>button]:top-5 [&>button]:right-5">
        <div className="flex items-center gap-3 p-4 border-b border-gray-200">
          <img 
            src={tweet.avatar} 
            alt={tweet.username}
            className="w-10 h-10 rounded-full"
            onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${tweet.username}`; }}
          />
          <div>
            <div className="font-semibold text-gray-900">{tweet.username}</div>
            <div className="text-gray-500 text-sm">{tweet.handle}</div>
          </div>
        </div>

        <ScrollArea className="max-h-[calc(90vh-80px)]">
          <div className="p-4">
            <p className="text-gray-800 leading-relaxed">{tweet.content}</p>
            
            {tweet.image && (
              <img 
                src={tweet.image} 
                alt="Tweet media"
                className="mt-4 rounded-xl w-full"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            
            {tweet.link && (
              <a 
                href={`https://${tweet.link}`} 
                className="text-blue-500 text-sm mt-3 block hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {tweet.link}
              </a>
            )}

            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100 text-gray-500">
              <div className="flex items-center gap-1.5">
                <MessageCircle className="w-5 h-5" />
                <span>{tweet.metrics.comments}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Repeat2 className="w-5 h-5" />
                <span>{tweet.metrics.retweets}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Heart className="w-5 h-5" />
                <span>{tweet.metrics.likes}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="w-5 h-5" />
                <span>{tweet.metrics.views}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Bookmark className="w-5 h-5" />
                <span>{tweet.metrics.bookmarks}</span>
              </div>
            </div>

            {/* S3.6.1: Main tweet sentiment with explanation */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Post Sentiment</h4>
              <SentimentBar sentiment={tweet.sentiment} />
            </div>

            {/* S3.6.2: Community Sentiment Aggregate */}
            {tweet.commentsAggregate && tweet.commentsAggregate.total > 0 && (
              <div className="mt-4">
                <CommunitySentiment aggregate={tweet.commentsAggregate} />
              </div>
            )}

            {/* Comments section */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Comments</h3>
              {tweet.comments && tweet.comments.length > 0 ? (
                <>
                  <div className="space-y-0">
                    {tweet.comments.map(comment => (
                      <CommentItem key={comment.id} comment={comment} />
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Load More
                  </Button>
                </>
              ) : (
                <div className="py-8 text-center">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">No comments yet</p>
                  <p className="text-gray-400 text-xs mt-1">This post has no comments to analyze</p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

// S3.6.3: Minimal Sparkline component (SVG-based, no dependencies)
const Sparkline = ({ data, width = 80, height = 24, color = '#10b981' }) => {
  if (!data || data.length < 2) return null;
  
  const scores = data.map(d => d.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;
  
  // Generate SVG path
  const points = scores.map((score, i) => {
    const x = (i / (scores.length - 1)) * width;
    const y = height - ((score - min) / range) * height;
    return `${x},${y}`;
  });
  
  const pathD = `M ${points.join(' L ')}`;
  
  // Trend color based on first vs last
  const trendUp = scores[scores.length - 1] > scores[0];
  const lineColor = trendUp ? '#10b981' : '#ef4444';
  
  return (
    <svg width={width} height={height} className="overflow-visible">
      <path
        d={pathD}
        fill="none"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={width}
        cy={height - ((scores[scores.length - 1] - min) / range) * height}
        r="2"
        fill={lineColor}
      />
    </svg>
  );
};

// S3.6.3: Account Sentiment Summary component
const AccountSentimentSummary = ({ sentiment }) => {
  if (!sentiment) return null;
  
  const { current, delta, postsAnalyzed, avgPostConfidence, history } = sentiment;
  const confidencePct = Math.round(current.confidence * 100);
  const delta24h = delta['24h'];
  const delta7d = delta['7d'];
  
  const getLabelColor = (label) => {
    if (label === 'POSITIVE') return 'text-emerald-600';
    if (label === 'NEGATIVE') return 'text-red-600';
    return 'text-amber-600';
  };
  
  const getLabelBg = (label) => {
    if (label === 'POSITIVE') return 'bg-emerald-100';
    if (label === 'NEGATIVE') return 'bg-red-100';
    return 'bg-amber-100';
  };
  
  const formatDelta = (value) => {
    const pct = Math.round(value * 100);
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct}%`;
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      {/* Label + Confidence */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${getLabelBg(current.label)} ${getLabelColor(current.label)}`}>
          {current.label}
        </span>
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-gray-500 flex items-center gap-1 cursor-help">
                {confidencePct}% conf
                <Info className="w-3 h-3" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-gray-800 border-gray-200 text-white max-w-xs">
              <div className="space-y-2 p-1">
                <div className="font-medium text-sm border-b border-gray-600 pb-1">Account Aggregation</div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Posts analyzed:</span>
                    <span>{postsAnalyzed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg post confidence:</span>
                    <span>{Math.round(avgPostConfidence * 100)}%</span>
                  </div>
                  <div className="text-gray-400 text-[10px] mt-1">
                    Based on rules-adjusted sentiment analysis
                  </div>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Delta + Sparkline - SENTIMENT CHANGE, not price */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-between cursor-help">
              <div className="flex items-center gap-2 text-xs">
                <span className={`flex items-center gap-0.5 ${delta24h >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {delta24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {formatDelta(delta24h)}
                  <span className="text-gray-400 ml-0.5">24h</span>
                </span>
                <span className={`flex items-center gap-0.5 ${delta7d >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {delta7d >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {formatDelta(delta7d)}
                  <span className="text-gray-400 ml-0.5">7d</span>
                </span>
              </div>
              <Sparkline data={history} width={60} height={20} />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-white text-white text-xs">
            <p className="font-medium mb-1">Sentiment Change</p>
            <p className="text-gray-700">24h / 7d change in sentiment score</p>
            <p className="text-gray-700">Sparkline shows sentiment history</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

// Account card for sidebar (S3.6.3: with sentiment summary)
const AccountCard = ({ account, selected, onClick }) => (
  <div 
    className={`p-3 rounded-lg cursor-pointer transition-colors ${
      selected ? 'bg-teal-50 border border-teal-200' : 'hover:bg-gray-50 border border-transparent'
    }`}
    onClick={() => onClick(account)}
    data-testid={`account-card-${account.id}`}
  >
    <div className="flex items-center gap-3">
      <img 
        src={account.avatar} 
        alt={account.username}
        className="w-10 h-10 rounded-full object-cover"
        onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${account.username}`; }}
      />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 truncate">{account.username}</div>
        <div className="text-gray-500 text-sm truncate">{account.handle}</div>
      </div>
    </div>
    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
      <span>{account.followers} followers</span>
      <span>{account.following} following</span>
    </div>
    {/* S3.6.3: Account sentiment summary */}
    <AccountSentimentSummary sentiment={account.accountSentiment} />
  </div>
);

// Filter button component with improved focus/hover states
const FilterButton = ({ active, onClick, children }) => (
  <Button
    variant={active ? 'default' : 'outline'}
    size="sm"
    onClick={onClick}
    className={`transition-all duration-150 focus:ring-2 focus:ring-offset-1 ${active 
      ? 'bg-teal-500 hover:bg-teal-600 text-white focus:ring-teal-400' 
      : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 focus:ring-gray-300'
    }`}
  >
    {children}
  </Button>
);

// Main component
export default function TwitterSentimentPage() {
  const [accounts] = useState(MOCK_ACCOUNTS);
  const [tweets, setTweets] = useState(MOCK_TWEETS);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedTweet, setSelectedTweet] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [capabilities, setCapabilities] = useState(null);

  useEffect(() => {
    fetchCapabilities();
  }, []);

  const fetchCapabilities = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v4/sentiment/capabilities`);
      const data = await res.json();
      if (data.ok) {
        setCapabilities(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch capabilities:', err);
    }
  };

  const filteredTweets = tweets.filter(tweet => {
    if (selectedAccount && tweet.accountId !== selectedAccount.id) {
      return false;
    }
    // Basic sentiment filters
    if (filter === 'positive' && tweet.sentiment.label !== 'POSITIVE') return false;
    if (filter === 'neutral' && tweet.sentiment.label !== 'NEUTRAL') return false;
    if (filter === 'negative' && tweet.sentiment.label !== 'NEGATIVE') return false;
    // S3.6.3: Advanced filters
    if (filter === 'strong' && tweet.sentiment.confidence < 0.8) return false;
    if (filter === 'weak' && tweet.sentiment.confidence >= 0.55) return false;
    if (filter === 'mixed') {
      // Mixed = neutral-ish score (0.4-0.6) or low confidence
      const isMixedScore = tweet.sentiment.score >= 0.4 && tweet.sentiment.score <= 0.6;
      const isLowConfidence = tweet.sentiment.confidence < 0.6;
      if (!isMixedScore && !isLowConfidence) return false;
    }
    return true;
  });

  const handleTweetClick = (tweet) => {
    setSelectedTweet(tweet);
    setModalOpen(true);
  };

  const handleRefresh = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  const isMockMode = capabilities?.features?.mock;

  return (
    <div className="min-h-screen bg-gray-50" data-testid="twitter-sentiment-page">
      {isMockMode && (
        <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 flex items-center justify-center gap-2 text-amber-700 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>Dev Mode (Mock) — Sentiment analysis using mock data</span>
        </div>
      )}

      <div className="flex">
        <aside className="w-80 bg-white border-r border-gray-200 min-h-screen p-4">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-lg font-semibold text-gray-900">Select an account</h2>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Filter tweets by specific account to analyze their sentiment patterns</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="account-search-input"
              />
            </div>
          </div>

          <div className="space-y-2">
            {accounts.map(account => (
              <AccountCard 
                key={account.id}
                account={account}
                selected={selectedAccount?.id === account.id}
                onClick={setSelectedAccount}
              />
            ))}
          </div>

          {selectedAccount && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full mt-4 text-gray-500"
              onClick={() => setSelectedAccount(null)}
            >
              Clear selection
            </Button>
          )}

          <div className="mt-8">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-medium text-gray-500">Trending Keywords/Phrases</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Most frequently mentioned terms across recent tweets. Click to filter by keyword</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex flex-wrap gap-2">
              {TRENDING_KEYWORDS.map(item => (
                <Badge 
                  key={item.keyword} 
                  variant="secondary"
                  className="bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
                >
                  {item.keyword}
                </Badge>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Twitter Feed</h1>
                <p className="text-gray-500 mt-1">
                  What's happening on Twitter and how people feel about it
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={loading}
                data-testid="refresh-button"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <FilterButton 
                active={filter === 'all'} 
                onClick={() => setFilter('all')}
              >
                All
              </FilterButton>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <FilterButton 
                        active={filter === 'positive'} 
                        onClick={() => setFilter('positive')}
                      >
                        Positive
                      </FilterButton>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Posts with sentiment score above 60%</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <FilterButton 
                        active={filter === 'neutral'} 
                        onClick={() => setFilter('neutral')}
                      >
                        Neutral
                      </FilterButton>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Posts with balanced sentiment (40-60%)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <FilterButton 
                        active={filter === 'negative'} 
                        onClick={() => setFilter('negative')}
                      >
                        Negative
                      </FilterButton>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Posts with sentiment score below 40%</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {/* S3.6.3: Advanced filters */}
              <span className="text-gray-700 mx-1">|</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <FilterButton 
                        active={filter === 'strong'} 
                        onClick={() => setFilter('strong')}
                      >
                        Strong Signal
                      </FilterButton>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">High confidence posts (≥80%). More reliable sentiment signals</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <FilterButton 
                        active={filter === 'weak'} 
                        onClick={() => setFilter('weak')}
                      >
                        Weak Signal
                      </FilterButton>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Low confidence posts (&lt;55%). Sentiment may be unclear</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <FilterButton 
                        active={filter === 'mixed'} 
                        onClick={() => setFilter('mixed')}
                      >
                        Mixed
                      </FilterButton>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Posts with conflicting signals or low confidence — market uncertainty</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Tweet Feed */}
          <div className="space-y-4">
            {loading ? (
              <FeedLoadingSkeleton />
            ) : filteredTweets.length === 0 ? (
              <Card className="border-gray-200">
                <EmptyState 
                  icon={Filter}
                  title="No tweets match your filters"
                  description="Try adjusting sentiment or confidence filters to see more results"
                  action="Clear filters"
                  onAction={() => setFilter('all')}
                />
              </Card>
            ) : (
              filteredTweets.map(tweet => (
                <TweetCard 
                  key={tweet.id} 
                  tweet={tweet} 
                  onClick={handleTweetClick}
                />
              ))
            )}

            {!loading && filteredTweets.length > 0 && (
              <Button 
                variant="outline" 
                className="w-full hover:bg-gray-50 transition-colors"
                data-testid="load-more-button"
              >
                Load More
              </Button>
            )}
          </div>
        </main>
      </div>

      <TweetDetailModal 
        tweet={selectedTweet}
        open={modalOpen}
        onClose={setModalOpen}
      />
    </div>
  );
}
