/**
 * PHASE 1.4 — Backfill Panel Component
 * ======================================
 * 
 * Panel for triggering and monitoring backfill jobs.
 * Shows:
 * - Start backfill button
 * - Progress indicator
 * - Recent runs list
 * - Truth statistics
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Database,
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  BarChart3,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import api from '../../lib/api';

export default function BackfillPanel({ symbol, className = '' }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [startingBackfill, setStartingBackfill] = useState(false);
  const [runs, setRuns] = useState([]);
  const [activeRun, setActiveRun] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  
  // Fetch runs and stats
  const fetchData = useCallback(async () => {
    if (!symbol) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [runsRes, statsRes] = await Promise.all([
        api.get(`/v10/market/backfill/runs?symbol=${symbol}&limit=5`),
        api.get(`/v10/market/truth/stats/${symbol}`),
      ]);
      
      setRuns(runsRes.data.runs || []);
      setStats(statsRes.data.stats || null);
      
      // Check for active run
      const active = runsRes.data.runs?.find(r => 
        r.status === 'PENDING' || r.status === 'RUNNING'
      );
      setActiveRun(active || null);
    } catch (err) {
      setError(err.message || 'Failed to load backfill data');
    } finally {
      setLoading(false);
    }
  }, [symbol]);
  
  useEffect(() => {
    if (expanded) {
      fetchData();
    }
  }, [expanded, fetchData]);
  
  // Poll active run status
  useEffect(() => {
    if (!activeRun) return;
    
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/v10/market/backfill/status/${activeRun.runId}`);
        const run = res.data.run;
        
        if (run.status === 'COMPLETED' || run.status === 'FAILED') {
          setActiveRun(null);
          fetchData();
        } else {
          setActiveRun(run);
        }
      } catch (err) {
        console.error('Failed to poll backfill status:', err);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [activeRun, fetchData]);
  
  // Start backfill
  const startBackfill = async () => {
    if (!symbol || startingBackfill) return;
    
    setStartingBackfill(true);
    setError(null);
    
    try {
      const res = await api.post('/v10/market/backfill/start', {
        symbol,
        tf: '1h',
        days: 7,
      });
      
      if (res.data.ok) {
        setActiveRun({
          runId: res.data.runId,
          symbol: res.data.symbol,
          tf: res.data.tf,
          status: res.data.status,
          progress: { barsSaved: 0, truthRecordsSaved: 0 },
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to start backfill');
    } finally {
      setStartingBackfill(false);
    }
  };
  
  const statusConfig = {
    PENDING: { color: 'text-amber-400', bg: 'bg-amber-500/10', icon: Clock },
    RUNNING: { color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Loader2 },
    COMPLETED: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
    FAILED: { color: 'text-red-400', bg: 'bg-red-500/10', icon: XCircle },
  };
  
  return (
    <div className={`bg-slate-800/30 border border-slate-700 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
        data-testid="backfill-panel-toggle"
      >
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-purple-400" />
          <div className="text-left">
            <h3 className="font-semibold text-slate-200">Historical Truth Layer</h3>
            <p className="text-xs text-slate-500">
              {stats ? `${stats.total} records • ${(stats.confirmRate * 100).toFixed(0)}% accuracy` : 'Backfill historical data'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeRun && (
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Running
            </Badge>
          )}
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>
      
      {/* Content */}
      {expanded && (
        <div className="p-4 pt-0 border-t border-slate-700 space-y-4">
          {/* Active Run Progress */}
          {activeRun && (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-400 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Backfill in progress...
                </span>
                <Badge variant="outline" className="text-xs">
                  {activeRun.tf} • {activeRun.days || 7}d
                </Badge>
              </div>
              <Progress 
                value={activeRun.progress?.barsSaved ? Math.min((activeRun.progress.barsSaved / 168) * 100, 100) : 0}
                className="h-2 bg-slate-700"
              />
              <div className="flex justify-between mt-2 text-xs text-slate-400">
                <span>{activeRun.progress?.barsSaved || 0} bars saved</span>
                <span>{activeRun.progress?.truthRecordsSaved || 0} truth records</span>
              </div>
            </div>
          )}
          
          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}
          
          {/* Stats */}
          {stats && stats.total > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-900/50 text-center">
                <p className="text-2xl font-bold text-slate-100">{stats.total}</p>
                <p className="text-xs text-slate-500">Total Records</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/10 text-center">
                <p className="text-2xl font-bold text-emerald-400">{(stats.confirmRate * 100).toFixed(0)}%</p>
                <p className="text-xs text-slate-500">Confirmed</p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10 text-center">
                <p className="text-2xl font-bold text-red-400">{(stats.divergeRate * 100).toFixed(0)}%</p>
                <p className="text-xs text-slate-500">Diverged</p>
              </div>
            </div>
          )}
          
          {/* By Verdict Breakdown */}
          {stats && stats.byVerdict && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <BarChart3 className="w-3 h-3" />
                Accuracy by Verdict
              </p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {['BULLISH', 'BEARISH', 'NEUTRAL'].map(verdict => {
                  const v = stats.byVerdict[verdict];
                  const accuracy = v.total > 0 ? (v.confirmed / v.total) * 100 : 0;
                  const color = verdict === 'BULLISH' ? 'emerald' : verdict === 'BEARISH' ? 'red' : 'slate';
                  return (
                    <div key={verdict} className={`p-2 rounded bg-${color}-500/10`}>
                      <p className={`font-semibold text-${color}-400`}>{verdict}</p>
                      <p className="text-slate-300">{accuracy.toFixed(0)}% ({v.confirmed}/{v.total})</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Recent Runs */}
          {runs.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400">Recent Backfills</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {runs.slice(0, 3).map(run => {
                  const config = statusConfig[run.status] || statusConfig.PENDING;
                  const StatusIcon = config.icon;
                  return (
                    <div 
                      key={run.runId}
                      className="flex items-center justify-between p-2 rounded bg-slate-900/50 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`w-3 h-3 ${config.color} ${run.status === 'RUNNING' ? 'animate-spin' : ''}`} />
                        <span className="text-slate-300">{run.tf} • {run.days}d</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500">
                          {run.progress?.barsSaved || 0} bars
                        </span>
                        <span className={config.color}>{run.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              onClick={startBackfill}
              disabled={startingBackfill || !!activeRun}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              data-testid="start-backfill-btn"
            >
              {startingBackfill ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {activeRun ? 'Backfill Running...' : 'Start Backfill (7 days)'}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchData}
              disabled={loading}
              className="bg-slate-800 border-slate-600"
              data-testid="refresh-backfill-btn"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
