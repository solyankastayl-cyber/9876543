/**
 * SystemStatusBanner (Option B - B4)
 * 
 * Global system status indicator with degradation awareness.
 * Shows honest status: healthy / degraded / unhealthy.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  CheckCircle, AlertTriangle, XCircle, Activity, 
  RefreshCw, ChevronDown, Wifi, WifiOff 
} from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

const API_URL = process.env.REACT_APP_BACKEND_URL || '';
const POLL_INTERVAL = 15000; // 15s fallback

/**
 * Format relative time
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

const initialHealth = {
  status: 'healthy',
  services: {},
  metrics: { bootstrap: {} },
  notes: [],
  ts: null,
};

export default function SystemStatusBanner({ 
  compact = false,
  showDetails = true,
}) {
  const [health, setHealth] = useState(initialHealth);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const pollRef = useRef(null);

  // Fetch health from API
  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/system/health`);
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch (err) {
      console.error('[SystemStatus] Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  // WebSocket for real-time updates
  const handleWsEvent = useCallback((event) => {
    if (event.type === 'system.health.updated') {
      setHealth(event.health);
    }
  }, []);

  const { isConnected } = useWebSocket({
    subscriptions: ['system'],
    onEvent: handleWsEvent,
    enabled: true,
  });

  // Polling fallback
  useEffect(() => {
    if (!isConnected) {
      pollRef.current = setInterval(fetchHealth, POLL_INTERVAL);
      return () => clearInterval(pollRef.current);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
  }, [isConnected, fetchHealth]);

  if (loading) {
    return null; // Don't show loading state
  }

  const { status, notes, metrics, services, ts } = health;
  const bootstrap = metrics?.bootstrap || {};

  // Compact mode (just icon + label)
  if (compact) {
    if (status === 'healthy') {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-xs cursor-help">
              <CheckCircle className="w-3 h-3" />
              <span>Healthy</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            <p>All systems operational</p>
            <p className="text-gray-400">Updated: {formatRelativeTime(ts)}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    if (status === 'degraded') {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50 text-amber-600 text-xs cursor-help">
              <AlertTriangle className="w-3 h-3" />
              <span>Degraded</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs max-w-[250px]">
            <p className="font-medium mb-1">System under load</p>
            {notes.length > 0 && (
              <ul className="text-gray-500 space-y-0.5">
                {notes.slice(0, 3).map((note, i) => (
                  <li key={i}>• {note}</li>
                ))}
              </ul>
            )}
            <p className="text-gray-400 mt-1">Updated: {formatRelativeTime(ts)}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-50 text-red-600 text-xs cursor-help">
            <XCircle className="w-3 h-3" />
            <span>Issues</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs max-w-[250px]">
          <p className="font-medium mb-1 text-red-600">System issues detected</p>
          {notes.length > 0 && (
            <ul className="text-gray-500 space-y-0.5">
              {notes.map((note, i) => (
                <li key={i}>• {note}</li>
              ))}
            </ul>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  // Full banner mode
  if (status === 'healthy') {
    return null; // Don't show banner when healthy
  }

  const bgColor = status === 'degraded' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';
  const textColor = status === 'degraded' ? 'text-amber-800' : 'text-red-800';
  const iconColor = status === 'degraded' ? 'text-amber-500' : 'text-red-500';
  const Icon = status === 'degraded' ? AlertTriangle : XCircle;

  return (
    <div className={`${bgColor} border rounded-lg p-3 ${textColor}`} data-testid="system-status-banner">
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${iconColor}`} />
            <span className="text-sm font-medium">
              {status === 'degraded' ? 'System under load' : 'System issues detected'}
            </span>
            <span className="text-xs opacity-70">
              — {notes[0] || 'Some data may be delayed'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-50">
              {formatRelativeTime(ts)}
            </span>
            {showDetails && (
              <CollapsibleTrigger asChild>
                <button className="p-1 hover:bg-black/5 rounded">
                  <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>
              </CollapsibleTrigger>
            )}
          </div>
        </div>

        <CollapsibleContent>
          <div className="mt-3 pt-3 border-t border-current/10 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            {/* Bootstrap metrics */}
            <div>
              <p className="font-medium mb-1">Indexing Queue</p>
              <p>Active: {bootstrap.active || 0}</p>
              <p>Queued: {bootstrap.queued || 0}</p>
              {bootstrap.failed > 0 && (
                <p className="text-red-600">Failed: {bootstrap.failed}</p>
              )}
            </div>

            {/* Services */}
            <div>
              <p className="font-medium mb-1">Services</p>
              {Object.entries(services || {}).map(([name, svc]) => (
                <p key={name} className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${
                    svc.status === 'ok' ? 'bg-emerald-500' : 
                    svc.status === 'degraded' ? 'bg-amber-500' : 'bg-red-500'
                  }`} />
                  {name}
                </p>
              ))}
            </div>

            {/* Notes */}
            {notes.length > 0 && (
              <div className="col-span-2">
                <p className="font-medium mb-1">Details</p>
                <ul className="space-y-0.5">
                  {notes.map((note, i) => (
                    <li key={i}>• {note}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
