// Mappers: Backend DTO -> Frontend VM

import type { TweetVM, TwitterAccountVM, SearchResultVM, ParserHealthVM } from '../types';

// Map backend DTO to TweetVM
export function mapToTweetVM(dto: any): TweetVM {
  return {
    id: dto.id,
    author: {
      username: dto.author?.username || 'unknown',
      displayName: dto.author?.displayName || dto.author?.username || 'Unknown',
      avatar: dto.author?.avatar,
      verified: dto.author?.verified || false,
    },
    text: dto.text || '',
    media: dto.media || [],
    metrics: {
      likes: dto.engagement?.likes || 0,
      reposts: dto.engagement?.reposts || 0,
      replies: dto.engagement?.replies || 0,
      views: dto.engagement?.views,
    },
    timestamp: dto.timestamp || Date.now(),
    url: dto.url,
  };
}

// Map backend DTO to TwitterAccountVM
export function mapToAccountVM(dto: any): TwitterAccountVM {
  return {
    username: dto.username || '',
    displayName: dto.displayName || dto.username || 'Unknown',
    bio: dto.bio,
    avatar: dto.avatar,
    banner: dto.banner,
    followers: dto.followers || 0,
    following: dto.following || 0,
    tweets: dto.tweets || 0,
    verified: dto.verified || false,
  };
}

// Map backend search response to SearchResultVM
export function mapToSearchResultVM(dto: any): SearchResultVM {
  return {
    query: dto.query || '',
    mode: dto.mode || 'LIMITED',
    count: dto.count || 0,
    tweets: (dto.tweets || []).map(mapToTweetVM),
    limits: dto.limits,
  };
}

// Map backend health response to ParserHealthVM
export function mapToHealthVM(dto: any): ParserHealthVM {
  const data = dto.data || dto;
  return {
    ok: dto.ok !== false,
    status: data.status || 'down',
    state: data.state || 'ERROR',
    mode: data.mode || 'LIMITED',
    uptime: data.uptime || 0,
    message: dto.error,
  };
}
