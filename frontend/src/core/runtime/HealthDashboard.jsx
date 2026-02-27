/**
 * HEALTH DASHBOARD — Monitoring endpoint aggregator
 * 
 * Monitors:
 * - /api/health
 * - /api/fractal/health
 * - /api/dxy-macro-core/health
 * - /api/engine/global (latency check)
 * - Database ping
 */

import React, { useState, useEffect, memo } from 'react';
import { theme } from '../theme';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

const ENDPOINTS = [
  { id: 'api', name: 'API Gateway', path: '/api/health' },
  { id: 'fractal', name: 'Fractal Core', path: '/api/fractal/health' },
  { id: 'macro', name: 'Macro Core', path: '/api/dxy-macro-core/health' },
  { id: 'engine', name: 'Engine Global', path: '/api/engine/global', latencyOnly: true },
];

/**
 * HealthDashboard Component
 */
export const HealthDashboard = memo(function HealthDashboard({ 
  className = '',
  refreshInterval = 30000,
  compact = false,
}) {
  const [statuses, setStatuses] = useState({});
  const [lastCheck, setLastCheck] = useState(null);
  const [checking, setChecking] = useState(false);
  
  const checkHealth = async () => {
    setChecking(true);
    const results = {};
    
    for (const endpoint of ENDPOINTS) {
      const start = Date.now();
      try {
        const res = await fetch(`${API_BASE}${endpoint.path}`, {
          signal: AbortSignal.timeout(10000),
        });
        const latency = Date.now() - start;
        
        if (res.ok) {
          const data = await res.json();
          results[endpoint.id] = {
            status: 'healthy',
            latency,
            data: endpoint.latencyOnly ? null : data,
          };
        } else {
          results[endpoint.id] = {
            status: 'error',
            latency,
            error: `HTTP ${res.status}`,
          };
        }
      } catch (err) {
        results[endpoint.id] = {
          status: 'error',
          latency: Date.now() - start,
          error: err.message,
        };
      }
    }
    
    setStatuses(results);
    setLastCheck(new Date());
    setChecking(false);
  };
  
  // Initial check + interval
  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);
  
  // Count healthy endpoints
  const healthyCount = Object.values(statuses).filter(s => s.status === 'healthy').length;
  const totalCount = ENDPOINTS.length;
  const allHealthy = healthyCount === totalCount;
  
  if (compact) {
    return (
      <div 
        className={`flex items-center gap-2 px-3 py-1.5 rounded ${className}`}
        style={{ 
          background: allHealthy ? theme.positiveLight : theme.negativeLight,
        }}
        data-testid="health-dashboard-compact"
      >
        <div 
          className="w-2 h-2 rounded-full"
          style={{ background: allHealthy ? theme.positive : theme.negative }}
        />
        <span className="text-xs font-medium" style={{ color: theme.textPrimary }}>
          {healthyCount}/{totalCount} Healthy
        </span>
        {checking && <span className="text-xs" style={{ color: theme.textMuted }}>...</span>}
      </div>
    );
  }
  
  return (
    <div 
      className={`rounded-xl p-6 ${className}`}
      style={{ 
        background: theme.card,
        border: `1px solid ${theme.border}`,
      }}
      data-testid="health-dashboard"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 
          className="text-sm font-semibold uppercase tracking-wide"
          style={{ color: theme.textSecondary }}
        >
          System Health
        </h3>
        
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: theme.textMuted }}>
            {lastCheck ? `Checked ${formatTimeAgo(lastCheck)}` : 'Checking...'}
          </span>
          <button
            onClick={checkHealth}
            disabled={checking}
            className="text-xs px-2 py-1 rounded"
            style={{ 
              background: theme.section,
              color: theme.textSecondary,
              opacity: checking ? 0.5 : 1,
            }}
          >
            {checking ? '...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      {/* Status Grid */}
      <div className="grid grid-cols-2 gap-3">
        {ENDPOINTS.map(endpoint => {
          const status = statuses[endpoint.id];
          const isHealthy = status?.status === 'healthy';
          
          return (
            <div 
              key={endpoint.id}
              className="p-3 rounded-lg"
              style={{ 
                background: isHealthy ? theme.positiveLight : theme.negativeLight,
                border: `1px solid ${isHealthy ? theme.positive : theme.negative}20`,
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium" style={{ color: theme.textPrimary }}>
                  {endpoint.name}
                </span>
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ background: isHealthy ? theme.positive : theme.negative }}
                />
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: theme.textMuted }}>
                  {status?.latency ? `${status.latency}ms` : '—'}
                </span>
                <span style={{ color: isHealthy ? theme.positive : theme.negative }}>
                  {status?.status || 'pending'}
                </span>
              </div>
              
              {status?.error && (
                <div className="mt-1 text-xs" style={{ color: theme.negative }}>
                  {status.error}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Overall Status */}
      <div 
        className="mt-4 pt-4 border-t flex items-center justify-between"
        style={{ borderColor: theme.border }}
      >
        <span className="text-sm" style={{ color: theme.textSecondary }}>
          Overall Status
        </span>
        <span 
          className="px-3 py-1 rounded-full text-sm font-bold"
          style={{ 
            background: allHealthy ? theme.positiveLight : theme.negativeLight,
            color: allHealthy ? theme.positive : theme.negative,
          }}
        >
          {allHealthy ? 'ALL SYSTEMS OPERATIONAL' : `${totalCount - healthyCount} ISSUES`}
        </span>
      </div>
    </div>
  );
});

/**
 * Format time ago
 */
function formatTimeAgo(date) {
  if (!date) return '';
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 120) return '1m ago';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export default HealthDashboard;
