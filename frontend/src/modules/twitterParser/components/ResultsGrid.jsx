// B4.1 - Results Grid Component

import { TweetCard } from './TweetCard';
import { TweetRow } from './TweetRow';
import { Card, CardContent } from '../../../components/ui/card';
import { Loader2, AlertTriangle, Search } from 'lucide-react';

export function ResultsGrid({ tweets, loading, error, viewMode = 'grid' }) {
  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="py-12 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
          <p className="text-sm text-slate-400">Loading tweets...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="py-12 flex flex-col items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mb-3" />
          <p className="text-sm text-red-400 mb-1">Error loading tweets</p>
          <p className="text-xs text-slate-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!tweets || tweets.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="py-12 flex flex-col items-center justify-center">
          <Search className="w-8 h-8 text-slate-600 mb-3" />
          <p className="text-sm text-slate-400">No tweets yet</p>
          <p className="text-xs text-slate-500 mt-1">Run parser to see results</p>
        </CardContent>
      </Card>
    );
  }

  // List View
  if (viewMode === 'list') {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-0">
          <div className="divide-y divide-slate-800">
            {tweets.map((tweet) => (
              <TweetRow key={tweet.id} tweet={tweet} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid View (default)
  return (
    <div className="grid grid-cols-1 gap-3">
      {tweets.map((tweet) => (
        <TweetCard key={tweet.id} tweet={tweet} />
      ))}
    </div>
  );
}
