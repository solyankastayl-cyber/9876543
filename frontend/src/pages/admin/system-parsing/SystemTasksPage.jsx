// Admin System Parsing - Tasks Management
import React, { useState, useEffect } from 'react';
import { PlayCircle, RefreshCw, StopCircle, CheckCircle, XCircle, Clock, Search, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function SystemTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRunDialog, setShowRunDialog] = useState(false);
  const [runForm, setRunForm] = useState({ sessionId: '', target: '', type: 'SEARCH' });
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [preflight, setPreflight] = useState(null);
  const [checkingPreflight, setCheckingPreflight] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v4/admin/system/tasks?limit=50`);
      const data = await res.json();
      if (data.ok) {
        setTasks(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v4/admin/system/sessions`);
      const data = await res.json();
      if (data.ok) {
        setSessions(data.data.filter(s => s.status === 'OK'));
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  };

  const checkPreflight = async (sessionId) => {
    if (!sessionId) {
      setPreflight(null);
      return;
    }
    
    setCheckingPreflight(true);
    try {
      const res = await fetch(`${API_URL}/api/v4/admin/system/sessions/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (data.ok) {
        setPreflight(data.data);
      }
    } catch (err) {
      console.error('Preflight check failed:', err);
    } finally {
      setCheckingPreflight(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchSessions();
    const interval = setInterval(fetchTasks, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  // Check preflight when session changes
  useEffect(() => {
    if (runForm.sessionId) {
      checkPreflight(runForm.sessionId);
    } else {
      setPreflight(null);
    }
  }, [runForm.sessionId]);

  const handleRun = async () => {
    if (!runForm.sessionId || !runForm.target) return;
    
    setRunning(true);
    try {
      const res = await fetch(`${API_URL}/api/v4/admin/system/tasks/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: runForm.sessionId,
          target: runForm.target,
          type: runForm.type,
          limit: 10,
        }),
      });
      const data = await res.json();
      
      if (data.blocked) {
        // Preflight failed - show blockers
        const blockersText = data.blockers?.map(b => `• ${b.message}`).join('\n') || 'Unknown error';
        alert(`Parse BLOCKED by preflight:\n\n${blockersText}`);
      } else if (data.ok) {
        setShowRunDialog(false);
        setRunForm({ sessionId: '', target: '', type: 'SEARCH' });
        setPreflight(null);
        fetchTasks();
        alert(`Parse completed!\nTweets fetched: ${data.data?.data?.length || 0}`);
      } else {
        alert('Parse failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Parse failed: ' + err.message);
    } finally {
      setRunning(false);
    }
  };

  const handleAbort = async (taskId) => {
    try {
      const res = await fetch(`${API_URL}/api/v4/admin/system/tasks/${taskId}/abort`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.ok) {
        fetchTasks();
      }
    } catch (err) {
      alert('Failed to abort: ' + err.message);
    }
  };

  const StatusBadge = ({ status }) => {
    const config = {
      PENDING: { icon: Clock, color: 'bg-zinc-500/20 text-zinc-400' },
      RUNNING: { icon: RefreshCw, color: 'bg-blue-500/20 text-blue-400', animate: true },
      DONE: { icon: CheckCircle, color: 'bg-emerald-500/20 text-emerald-400' },
      FAILED: { icon: XCircle, color: 'bg-red-500/20 text-red-400' },
    };
    const { icon: Icon, color, animate } = config[status] || config.PENDING;
    
    return (
      <span className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${color}`}>
        <Icon className={`w-3 h-3 ${animate ? 'animate-spin' : ''}`} />
        {status}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString();
  };

  const canRun = preflight?.canRun && runForm.sessionId && runForm.target;

  return (
    <div className="space-y-6" data-testid="system-tasks-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <PlayCircle className="w-5 h-5 text-emerald-500" />
          System Tasks
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchTasks} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowRunDialog(true)} data-testid="run-parse-btn">
            <PlayCircle className="w-4 h-4 mr-2" />
            Run Parse
          </Button>
        </div>
      </div>

      {/* Tasks List */}
      {loading && tasks.length === 0 ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      ) : tasks.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-12 text-center">
            <PlayCircle className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">No tasks yet</p>
            <p className="text-sm text-zinc-500 mt-1">Run your first system parse to get started</p>
            <Button className="mt-4" onClick={() => setShowRunDialog(true)}>
              <PlayCircle className="w-4 h-4 mr-2" />
              Run Parse
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-zinc-500 border-b border-zinc-800">
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Target</th>
                <th className="pb-3 font-medium">Tweets</th>
                <th className="pb-3 font-medium">Started</th>
                <th className="pb-3 font-medium">Duration</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {tasks.map((task) => (
                <tr key={task._id} className="text-sm" data-testid={`task-${task._id}`}>
                  <td className="py-3">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="py-3 text-zinc-400">{task.type}</td>
                  <td className="py-3">
                    <span className="font-mono text-emerald-400">
                      {task.payload?.target || task.payload?.keyword || '-'}
                    </span>
                  </td>
                  <td className="py-3 text-zinc-300">
                    {task.result?.tweetsFetched ?? '-'}
                  </td>
                  <td className="py-3 text-zinc-500 text-xs">
                    {formatDate(task.startedAt)}
                  </td>
                  <td className="py-3 text-zinc-500 text-xs">
                    {task.completedAt && task.startedAt 
                      ? `${Math.round((new Date(task.completedAt) - new Date(task.startedAt)) / 1000)}s`
                      : '-'}
                  </td>
                  <td className="py-3">
                    {task.status === 'RUNNING' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAbort(task._id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <StopCircle className="w-4 h-4" />
                      </Button>
                    )}
                    {task.status === 'FAILED' && task.lastError && (
                      <span className="text-xs text-red-400" title={task.lastError}>
                        Error
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Run Parse Dialog */}
      <Dialog open={showRunDialog} onOpenChange={setShowRunDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-emerald-500" />
              Run System Parse
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1.5 block">Session *</label>
              <select
                value={runForm.sessionId}
                onChange={(e) => setRunForm({ ...runForm, sessionId: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm"
                data-testid="select-session"
              >
                <option value="">Select a session...</option>
                {sessions.map((s) => (
                  <option key={s.sessionId} value={s.sessionId}>
                    {s.accountId?.label || s.accountId?.username || s.sessionId} ({s.cookiesMeta?.count || 0} cookies)
                  </option>
                ))}
              </select>
              {sessions.length === 0 && (
                <p className="text-xs text-yellow-500 mt-1">No OK sessions available</p>
              )}
            </div>
            
            {/* Preflight Status */}
            {runForm.sessionId && (
              <div className={`p-3 rounded-lg border ${
                checkingPreflight ? 'bg-zinc-800/50 border-zinc-700' :
                preflight?.canRun ? 'bg-emerald-500/10 border-emerald-500/30' : 
                'bg-red-500/10 border-red-500/30'
              }`}>
                {checkingPreflight ? (
                  <div className="flex items-center gap-2 text-zinc-400">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Checking preflight...
                  </div>
                ) : preflight?.canRun ? (
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                    Preflight OK - {preflight.cookiesCount} cookies ready
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 text-red-400 mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      Preflight FAILED - Cannot run parse
                    </div>
                    {preflight?.error && (
                      <p className="text-xs text-red-300">• {preflight.error}</p>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <div>
              <label className="text-sm text-zinc-400 mb-1.5 block">Type</label>
              <div className="flex gap-2">
                <Button
                  variant={runForm.type === 'SEARCH' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRunForm({ ...runForm, type: 'SEARCH' })}
                >
                  <Search className="w-4 h-4 mr-1" />
                  Search
                </Button>
                <Button
                  variant={runForm.type === 'ACCOUNT_TWEETS' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRunForm({ ...runForm, type: 'ACCOUNT_TWEETS' })}
                >
                  @User Tweets
                </Button>
              </div>
            </div>
            
            <div>
              <label className="text-sm text-zinc-400 mb-1.5 block">
                {runForm.type === 'SEARCH' ? 'Keyword *' : 'Username *'}
              </label>
              <Input
                placeholder={runForm.type === 'SEARCH' ? 'bitcoin' : '@elonmusk'}
                value={runForm.target}
                onChange={(e) => setRunForm({ ...runForm, target: e.target.value })}
                className="bg-zinc-800 border-zinc-700"
                data-testid="input-target"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRunDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRun} 
              disabled={running || !canRun}
              data-testid="submit-run"
              title={!canRun ? 'Preflight check must pass before running' : ''}
            >
              {running ? 'Running...' : 'Run Parse'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
