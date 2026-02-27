// Twitter Parser View Models (Frontend)

export type ParserMode = 'LIMITED' | 'STANDARD' | 'FULL';
export type ParserState = 'RUNNING' | 'PAUSED' | 'DEGRADED' | 'ERROR' | 'STOPPED';

// Health & Status
export interface ParserHealthVM {
  ok: boolean;
  status: 'ok' | 'degraded' | 'down';
  state: ParserState;
  mode: ParserMode;
  uptime: number;
  message?: string;
}

// Tweet
export interface TweetVM {
  id: string;
  author: {
    username: string;
    displayName: string;
    avatar?: string;
    verified: boolean;
  };
  text: string;
  media?: string[];
  metrics: {
    likes: number;
    reposts: number;
    replies: number;
    views?: number;
  };
  timestamp: number;
  url?: string;
}

// Account
export interface TwitterAccountVM {
  username: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  banner?: string;
  followers: number;
  following: number;
  tweets: number;
  verified: boolean;
  selected?: boolean;
}

// Search Result
export interface SearchResultVM {
  query: string;
  mode: ParserMode;
  count: number;
  tweets: TweetVM[];
  limits?: {
    requested: number;
    returned: number;
    max: number;
  };
}

// Errors
export interface ParserErrorVM {
  code: 'PARSER_ERROR' | 'PARSER_PAUSED' | 'MODE_LIMITED_BLOCK' | 'NETWORK_ERROR' | 'UNKNOWN';
  message: string;
  retryable: boolean;
  status?: ParserState;
}

// Filters (для Live Parsing)
export interface FilterOptionsVM {
  dateRange?: {
    from?: string;
    to?: string;
    preset?: 'last24h' | 'last3d' | 'last7d' | 'lastMonth' | 'last6m' | 'lastYear';
  };
  verified?: boolean;
  followersMin?: number;
  followersMax?: number;
  sort?: 'newest' | 'mostLiked' | 'mostRetweeted' | 'mostCommented';
}
