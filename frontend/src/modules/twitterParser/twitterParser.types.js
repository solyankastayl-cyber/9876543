// B4 - Twitter Parser Types
// UI-only contracts (decoupled from runtime)

export type ParserQueryType = 'keyword' | 'account';
export type SortMode = 'latest' | 'engagement';
export type ViewMode = 'grid' | 'list';

export interface TwitterAuthorDTO {
  username: string;
  verified: boolean;
  displayName?: string;
}

export interface TwitterEngagementDTO {
  likes: number;
  reposts: number;
  replies: number;
  views?: number;
}

export interface TwitterTweetDTO {
  id: string;
  text: string;
  author: TwitterAuthorDTO;
  engagement: TwitterEngagementDTO;
  timestamp: number;
  url?: string;
}

export interface TwitterSearchResponseDTO {
  ok: boolean;
  data?: TwitterTweetDTO[];
  meta?: {
    accountId?: string;
    instanceId?: string;
    taskId?: string;
    duration?: number;
  };
  error?: string;
}

export type WorkerState = 'RUNNING' | 'STOPPED' | 'ERROR' | 'PAUSED';

export interface RuntimeInfoDTO {
  total: number;
  healthy: number;
  degraded: number;
  error: number;
  unknown: number;
}

export interface ExecutionDetailedStatusDTO {
  ok: boolean;
  data?: {
    worker: {
      running: boolean;
      processedCount: number;
      errorCount: number;
      lastProcessedAt?: number;
    };
    capacity: {
      totalAvailable: number;
      usedInWindow: number;
      percentUsed: number;
    };
    runtime: RuntimeInfoDTO;
    runtimeDetails?: Record<string, {
      sourceType: string;
      health: string;
      lastCheckedAt?: number;
      error?: string;
    }>;
    lastSync: number;
    accountsCount: number;
    instancesCount: number;
    tasks?: {
      pending: number;
      completed: number;
      failed: number;
    };
  };
  error?: string;
}

// Batch types
export type BatchJobStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'ERROR' | 'CANCELLED';

export interface BatchJob {
  id: string;
  label: string;
  queries: string[];
  createdAt: number;
  status: BatchJobStatus;
  progress: {
    total: number;
    completed: number;
  };
  results: TwitterTweetDTO[];
  error?: string;
}

// Preset types
export interface ParserPreset {
  id: string;
  label: string;
  payload: {
    type: ParserQueryType;
    keyword?: string;
    username?: string;
    limit: number;
    sort: SortMode;
  };
}

// Filter options
export interface AdvancedFilterOptions {
  minLikes?: number;
  verifiedOnly?: boolean;
  sinceHours?: number;
}
