// Admin System Parsing - Sessions Management
import React, { useState, useEffect } from 'react';
import { Key, RefreshCw, XCircle, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function SystemSessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v4/admin/system/sessions`);
      const data = await res.json();
      if (data.ok) {
        setSessions(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleTest = async (sessionId) => {
    setTesting(sessionId);
    try {
      const res = await fetch(`${API_URL}/api/v4/admin/system/sessions/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (data.ok) {
        alert(`Test Result:\n• Can Run: ${data.data.canRun ? 'Yes' : 'No'}\n• Cookies: ${data.data.cookiesCount}\n• Status: ${data.data.status}${data.data.error ? '\n• Error: ' + data.data.error : ''}`);
      }
    } catch (err) {
      alert('Test failed: ' + err.message);
    } finally {
      setTesting(null);
    }
  };

  const handleInvalidate = async (sessionId) => {
    if (!confirm('Are you sure you want to invalidate this session?')) return;
    
    try {
      const res = await fetch(`${API_URL}/api/v4/admin/system/sessions/invalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (data.ok) {
        fetchSessions();
      }
    } catch (err) {
      alert('Failed to invalidate: ' + err.message);
    }
  };

  const StatusBadge = ({ status }) => {
    const config = {
      OK: { icon: CheckCircle, color: 'bg-emerald-500/20 text-emerald-400' },
      STALE: { icon: AlertTriangle, color: 'bg-yellow-500/20 text-yellow-400' },
      INVALID: { icon: XCircle, color: 'bg-red-500/20 text-red-400' },
      EXPIRED: { icon: XCircle, color: 'bg-zinc-500/20 text-zinc-400' },
    };
    const { icon: Icon, color } = config[status] || config.EXPIRED;
    
    return (
      <span className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${color}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  return (
    <div className="space-y-6" data-testid="system-sessions-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Key className="w-5 h-5 text-emerald-500" />
          System Sessions
        </h2>
        <Button variant="outline" size="sm" onClick={fetchSessions} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Sessions List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      ) : sessions.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-12 text-center">
            <Key className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">No system sessions</p>
            <p className="text-sm text-zinc-500 mt-1">Sessions will appear here when cookies are synced for system accounts</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <Card key={session._id} className="bg-zinc-900 border-zinc-800" data-testid={`session-${session.sessionId}`}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <StatusBadge status={session.status} />
                      <span className="text-sm font-mono text-zinc-400">{session.sessionId}</span>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-zinc-500">Account:</span>
                        <span className="ml-2 text-white">
                          {session.accountId?.label || session.accountId?.username || 'Unknown'}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Cookies:</span>
                        <span className="ml-2 text-white">{session.cookiesMeta?.count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span className="text-zinc-500">Last Sync:</span>
                        <span className="ml-1 text-zinc-400">{formatDate(session.lastSyncedAt)}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Risk:</span>
                        <span className={`ml-2 ${
                          session.riskScore < 30 ? 'text-emerald-400' : 
                          session.riskScore < 60 ? 'text-yellow-400' : 'text-red-400'
                        }`}>{session.riskScore}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(session.sessionId)}
                      disabled={testing === session.sessionId}
                    >
                      {testing === session.sessionId ? 'Testing...' : 'Test'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleInvalidate(session.sessionId)}
                      className="text-red-400 hover:text-red-300"
                      disabled={session.status === 'INVALID'}
                    >
                      Invalidate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
