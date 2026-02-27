// B4.1 - Tweet Card Component

import { fmtCompact, fmtRelativeTime } from '../utils/tweetFilters';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Heart, Repeat, MessageCircle, Eye, CheckCircle } from 'lucide-react';

export function TweetCard({ tweet }) {
  const { author, text } = tweet;
  
  // Normalize data - handle both API format (flat) and expected format (nested)
  const engagement = tweet.engagement || {
    likes: tweet.likes,
    reposts: tweet.reposts,
    replies: tweet.replies,
    views: tweet.views,
  };
  const timestamp = tweet.timestamp || tweet.createdAt;

  return (
    <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
      <CardContent className="pt-4">
        {/* Author */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">@{author?.username || 'unknown'}</span>
            {author?.verified && (
              <CheckCircle className="w-4 h-4 text-blue-400" />
            )}
          </div>
          <span className="text-xs text-slate-500">{fmtRelativeTime(timestamp)}</span>
        </div>

        {/* Tweet Text */}
        <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed mb-4 line-clamp-4">
          {text || <span className="text-slate-500 italic">No text</span>}
        </p>

        {/* Engagement Stats */}
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5" />
            <span>{fmtCompact(engagement?.likes)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Repeat className="w-3.5 h-3.5" />
            <span>{fmtCompact(engagement?.reposts)}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{fmtCompact(engagement?.replies)}</span>
          </div>
          {engagement?.views != null && (
            <div className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span>{fmtCompact(engagement?.views)}</span>
            </div>
          )}
        </div>

        {/* Source Badge (if mock) */}
        {tweet.id?.startsWith('mock-') && (
          <Badge variant="outline" className="mt-3 text-[10px] text-amber-400 border-amber-400/30">
            MOCK DATA
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
