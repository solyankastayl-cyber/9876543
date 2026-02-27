/**
 * GlobalIndexingStatus (P2.3.B + Option B enhancements)
 * 
 * Header component showing global system status.
 * Uses /api/system/health for full status with fallback to indexing-status.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Activity, CheckCircle, AlertTriangle, Loader2, XCircle } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";

const API_URL = process.env.REACT_APP_BACKEND_URL || '';
const POLL_INTERVAL = 10000; // 10s fallback

/**
 * Format relative time (e.g., "2s ago", "5m ago")
 */
function formatRelativeTime(isoString) {
  if (!isoString) return 'Never';
  
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  
  if (seconds < 5) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

const initialStatus = {
  systemStatus: 'healthy',
  activeTasks: 0,
  queuedTasks: 0,
  failedTasks: 0,
  state: 'idle',
  lastUpdated: null,
  notes: [],
};

export default function GlobalIndexingStatus() {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);

  // Fetch status from API (try health first, fallback to indexing-status)
  const fetchStatus = useCallback(async () => {
    try {
      // Try full health endpoint first
      const healthRes = await fetch(`${API_URL}/api/system/health`);
      if (healthRes.ok) {
        const health = await healthRes.json();
        const bootstrap = health.metrics?.bootstrap || {};
        setStatus({
          systemStatus: health.status,
          activeTasks: bootstrap.active || 0,
          queuedTasks: bootstrap.queued || 0,
          failedTasks: bootstrap.failed || 0,
          state: bootstrap.queued > 0 || bootstrap.active > 0 ? 'indexing' : 
                 bootstrap.failed > 0 ? 'error' : 'idle',
          lastUpdated: health.ts,
          notes: health.notes || [],
        });
        return;
      }
      
      // Fallback to simple indexing status
      const res = await fetch(`${API_URL}/api/system/indexing-status`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.data) {
          setStatus({
            ...initialStatus,
            ...data.data,
            systemStatus: 'healthy',
          });
        }
      }
    } catch (err) {
      console.error('[GlobalStatus] Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // WebSocket event handler
  const handleWsEvent = useCallback((event) => {
    if (event.type === 'bootstrap.stats.updated') {
      setStatus({
        activeTasks: event.activeTasks ?? 0,
        queuedTasks: event.queuedTasks ?? 0,
        failedTasks: event.failedTasks ?? 0,
        state: event.state ?? 'idle',
        lastUpdated: event.lastUpdated,
      });
    }
  }, []);

  const { isConnected } = useWebSocket({
    subscriptions: ['bootstrap'],
    onEvent: handleWsEvent,
    enabled: true,
  });

  // Polling fallback when WS disconnected
  useEffect(() => {
    if (!isConnected) {
      // Start polling
      pollRef.current = setInterval(fetchStatus, POLL_INTERVAL);
      return () => {
        if (pollRef.current) {
          clearInterval(pollRef.current);
        }
      };
    } else {
      // Stop polling when WS connected
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
  }, [isConnected, fetchStatus]);

  // Render
  const totalTasks = status.activeTasks + status.queuedTasks;
  const isUnhealthy = status.systemStatus === 'unhealthy';
  const isDegraded = status.systemStatus === 'degraded';

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-100 text-gray-500 text-xs">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  // Unhealthy state (system issues)
  if (isUnhealthy) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-50 text-red-600 text-xs cursor-help"
            data-testid="global-status-unhealthy"
          >
            <XCircle className="w-3 h-3" />
            <span>Issues</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs max-w-[200px]">
          <div className="space-y-1.5">
            <p className="font-medium text-red-600">System Issues</p>
            {status.notes?.length > 0 && (
              <ul className="text-gray-600 space-y-0.5">
                {status.notes.slice(0, 3).map((note, i) => (
                  <li key={i}>• {note}</li>
                ))}
              </ul>
            )}
            <p className="text-gray-400 pt-1 border-t border-gray-100">
              {formatRelativeTime(status.lastUpdated)}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Error state (failed tasks but system ok)
  if (status.state === 'error' && status.failedTasks > 0 && !totalTasks) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-50 text-red-600 text-xs cursor-help"
            data-testid="global-status-error"
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Error ({status.failedTasks})</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <div className="space-y-1.5 min-w-[140px]">
            <p className="font-medium text-red-600">Indexing Issues</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-gray-600">
              <span>Failed:</span><span className="font-medium text-red-600">{status.failedTasks}</span>
              <span>Active:</span><span className="font-medium">{status.activeTasks}</span>
              <span>Queued:</span><span className="font-medium">{status.queuedTasks}</span>
            </div>
            <p className="text-gray-400 pt-1 border-t border-gray-100">
              Updated: {formatRelativeTime(status.lastUpdated)}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Indexing state (with optional degraded indicator)
  if (status.state === 'indexing' || totalTasks > 0) {
    const bgColor = isDegraded ? 'bg-amber-100' : 'bg-amber-50';
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${bgColor} text-amber-600 text-xs cursor-help`}
            data-testid="global-status-indexing"
          >
            <Activity className="w-3 h-3 animate-pulse" />
            <span>Indexing ({totalTasks})</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <div className="space-y-1.5 min-w-[140px]">
            <p className="font-medium text-amber-600">
              {isDegraded ? 'System Under Load' : 'Indexing in Progress'}
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-gray-600">
              <span>Active:</span><span className="font-medium">{status.activeTasks}</span>
              <span>Queued:</span><span className="font-medium">{status.queuedTasks}</span>
              {status.failedTasks > 0 && (
                <>
                  <span>Failed:</span><span className="font-medium text-red-500">{status.failedTasks}</span>
                </>
              )}
            </div>
            {isDegraded && status.notes?.length > 0 && (
              <div className="pt-1 border-t border-gray-100 text-gray-500">
                {status.notes[0]}
              </div>
            )}
            <p className="text-gray-400 pt-1 border-t border-gray-100">
              Updated: {formatRelativeTime(status.lastUpdated)}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Idle state (healthy)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div 
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-xs cursor-help"
          data-testid="global-status-idle"
        >
          <CheckCircle className="w-3 h-3" />
          <span>Idle</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        <div className="space-y-1 min-w-[120px]">
          <p className="font-medium text-emerald-600">System Healthy</p>
          <p className="text-gray-500">No active indexing tasks</p>
          <p className="text-gray-400 pt-1 border-t border-gray-100">
            Updated: {formatRelativeTime(status.lastUpdated)}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
