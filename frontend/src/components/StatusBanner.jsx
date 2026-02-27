/**
 * Status Banner Component (Phase 15.5.2 - Step 3)
 * Unified status indicator for system state
 */
import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { resolverApi } from '../api';

const STATUS_CONFIG = {
  active: {
    icon: CheckCircle2,
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    label: 'System Active',
    description: 'All services running normally',
  },
  indexing: {
    icon: Loader2,
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    label: 'Indexing',
    description: 'Processing new data',
    animate: true,
  },
  idle: {
    icon: Wifi,
    color: 'bg-gray-50 border-gray-200 text-gray-600',
    label: 'Idle',
    description: 'Waiting for activity',
  },
  error: {
    icon: WifiOff,
    color: 'bg-red-50 border-red-200 text-red-700',
    label: 'Connection Issue',
    description: 'Unable to reach backend',
  },
};

export default function StatusBanner({ className = '', compact = false }) {
  const [status, setStatus] = useState('idle');
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await resolverApi.getIndexerStatus?.() || 
          await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/resolve/indexer-status`).then(r => r.json());
        
        if (response?.ok) {
          setStatus(response.data.status || 'idle');
          setDetails(response.data);
          setError(false);
        } else {
          setError(true);
          setStatus('error');
        }
      } catch (err) {
        console.error('Status fetch failed:', err);
        setError(true);
        setStatus('error');
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Every 30s
    
    return () => clearInterval(interval);
  }, []);

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.idle;
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${config.color} ${className}`}>
        <Icon className={`w-3 h-3 ${config.animate ? 'animate-spin' : ''}`} />
        <span>{config.label}</span>
        {details?.pendingJobs > 0 && (
          <span className="px-1.5 py-0.5 bg-white/50 rounded-full text-xs">
            {details.pendingJobs}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between px-4 py-2 rounded-lg border ${config.color} ${className}`}>
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${config.animate ? 'animate-spin' : ''}`} />
        <div>
          <div className="font-medium text-sm">{config.label}</div>
          <div className="text-xs opacity-75">{config.description}</div>
        </div>
      </div>
      {details && (
        <div className="text-right text-xs">
          {details.pendingJobs > 0 && (
            <div>Pending: {details.pendingJobs}</div>
          )}
          {details.lastActivity && (
            <div className="opacity-75">
              Last: {new Date(details.lastActivity).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
