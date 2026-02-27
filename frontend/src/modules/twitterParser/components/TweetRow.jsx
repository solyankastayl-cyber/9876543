// B4.2 - Tweet Row (Compact List View)

import { fmtCompact, fmtRelativeTime } from '../utils/tweetFilters';
import { Heart, Repeat, CheckCircle } from 'lucide-react';

export function TweetRow({ tweet }) {
  const { author, text } = tweet;
  
  // Normalize data - handle both API format (flat) and expected format (nested)
  const engagement = tweet.engagement || {
    likes: tweet.likes,
    reposts: tweet.reposts,
  };
  const timestamp = tweet.timestamp || tweet.createdAt;

  return (
    <div className="flex items-center justify-between py-3 px-4 border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
      {/* Left: Author + Text */}
      <div className="flex-1 min-w-0 mr-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm text-slate-200">@{author?.username}</span>
          {author?.verified && <CheckCircle className="w-3 h-3 text-blue-400" />}
          <span className="text-xs text-slate-500">{fmtRelativeTime(timestamp)}</span>
        </div>
        <p className="text-sm text-slate-400 truncate">{text}</p>
      </div>

      {/* Right: Stats */}
      <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0">
        <div className="flex items-center gap-1">
          <Heart className="w-3 h-3" />
          <span>{fmtCompact(engagement?.likes)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Repeat className="w-3 h-3" />
          <span>{fmtCompact(engagement?.reposts)}</span>
        </div>
      </div>
    </div>
  );
}
