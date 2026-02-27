/**
 * Twitter Parser Sessions Admin Page
 * Manage cookie sessions for the MULTI architecture
 * LIGHT THEME VERSION + P1 Risk Engine
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  getSessions,
  getWebhookInfo,
  testSession,
  setSessionStatus,
  deleteSession,
  getTwitterAccounts,
} from '../../api/twitterParserAdmin.api';
import { api } from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import {
  ArrowLeft,
  RefreshCw,
  Trash2,
  Cookie,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Key,
  Copy,
  ExternalLink,
  PlayCircle,
  Bell,
  HeartPulse,
  ShieldCheck,
  Timer,
  Activity,
  Download,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  OK: { label: 'Valid', icon: CheckCircle, color: 'bg-green-50 text-green-700 border-green-200' },
  STALE: { label: 'Stale', icon: Clock, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  INVALID: { label: 'Invalid', icon: XCircle, color: 'bg-red-50 text-red-700 border-red-200' },
  EXPIRED: { label: 'Expired', icon: XCircle, color: 'bg-red-50 text-red-700 border-red-200' },
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.INVALID;
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={`${config.color} font-medium`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}

function RiskBadge({ score }) {
  if (score === undefined || score === null) return null;
  
  let color, label;
  if (score < 35) {
    color = 'bg-green-50 text-green-700 border-green-200';
    label = 'Healthy';
  } else if (score < 70) {
    color = 'bg-amber-50 text-amber-700 border-amber-200';
    label = 'Warning';
  } else {
    color = 'bg-red-50 text-red-700 border-red-200';
    label = 'Critical';
  }
  
  return (
    <Badge variant="outline" className={`${color} font-medium`}>
      <ShieldCheck className="w-3 h-3 mr-1" />
      Risk: {score}%
    </Badge>
  );
}

export default function TwitterParserSessionsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAdminAuth();

  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({ total: 0, ok: 0, stale: 0, invalid: 0 });
  const [riskReport, setRiskReport] = useState(null);
  const [workerStatus, setWorkerStatus] = useState(null);
  const [webhookInfo, setWebhookInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showWebhookDialog, setShowWebhookDialog] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [testingSession, setTestingSession] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  const platformUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSessions();
      if (res.ok) {
        setSessions(res.data || []);
        setStats(res.stats || { total: 0, ok: 0, stale: 0, invalid: 0 });
      } else {
        setError(res.error || 'Failed to load sessions');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRiskReport = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/twitter-parser/risk/report');
      if (res.data.ok) {
        setRiskReport(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch risk report:', err);
    }
  }, []);

  const fetchWorkerStatus = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/twitter-parser/worker/status');
      if (res.data.ok) {
        setWorkerStatus(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch worker status:', err);
    }
  }, []);

  const fetchWebhookInfo = useCallback(async () => {
    try {
      const res = await getWebhookInfo();
      if (res.ok) {
        setWebhookInfo(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch webhook info:', err);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchSessions();
      fetchWebhookInfo();
      fetchRiskReport();
      fetchWorkerStatus();
    }
  }, [authLoading, isAuthenticated, fetchSessions, fetchWebhookInfo, fetchRiskReport, fetchWorkerStatus]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleTest = async (session) => {
    setTestingSession(session.sessionId);
    try {
      const res = await testSession(session.sessionId);
      if (res.ok) {
        if (res.valid) {
          toast.success(`Session ${session.sessionId} is valid (${res.cookieCount} cookies)`);
        } else {
          toast.error(`Session invalid: ${res.reason}`);
        }
        fetchSessions();
      } else {
        toast.error(res.error || 'Test failed');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTestingSession(null);
    }
  };

  const handleDelete = async (sessionId) => {
    const res = await deleteSession(sessionId);
    if (res.ok) {
      toast.success('Session deleted');
      setConfirmDelete(null);
      fetchSessions();
    } else {
      toast.error(res.error || 'Failed to delete');
    }
  };

  const handleHealthCheck = async () => {
    try {
      const res = await api.post('/api/admin/twitter-parser/sessions/health-check');
      if (res.data.ok) {
        toast.success(`Health check: ${res.data.checked} checked, ${res.data.changed} changed`);
        fetchSessions();
        fetchRiskReport();
      } else {
        toast.error(res.data.error || 'Health check failed');
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRiskRecalculate = async () => {
    try {
      const res = await api.post('/api/admin/twitter-parser/risk/recalculate');
      if (res.data.ok) {
        toast.success(`Risk recalculated: ${res.data.checked} sessions, ${res.data.changed} status changes`);
        fetchSessions();
        fetchRiskReport();
      } else {
        toast.error(res.data.error || 'Risk recalculation failed');
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleTestNotification = async () => {
    try {
      const res = await api.post('/api/admin/twitter-parser/sessions/test-notification');
      if (res.data.ok) {
        toast.success('Test notification sent to Telegram!');
      } else {
        toast.error(res.data.error || 'Failed to send notification');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleRegenerateKey = async () => {
    try {
      setRegenerating(true);
      const res = await api.post('/api/admin/twitter-parser/sessions/webhook/regenerate-key');
      if (res.data.ok) {
        toast.success('API Key regenerated');
        fetchWebhookInfo();
      } else {
        toast.error(res.data.error || 'Failed to regenerate key');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRegenerating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50" data-testid="admin-sessions-page">
        {/* Page Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Sessions</h1>
              <p className="text-sm text-gray-500">Cookie sessions for MULTI architecture</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleHealthCheck} title="Run health check on all sessions">
                <HeartPulse className="w-4 h-4 mr-2" />
                Health Check
              </Button>
              <Button variant="outline" onClick={handleTestNotification} title="Test Telegram notification">
                <Bell className="w-4 h-4 mr-2" />
                Test Alert
              </Button>
              <Button variant="outline" onClick={fetchSessions} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={() => setShowWebhookDialog(true)} className="bg-teal-500 hover:bg-teal-600 text-white">
                <Key className="w-4 h-4 mr-2" />
                Webhook Info
              </Button>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex gap-6">
              <Link to="/admin/twitter-parser/accounts" className="py-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 text-sm font-medium">
                Accounts
              </Link>
              <Link to="/admin/twitter-parser/sessions" className="py-3 border-b-2 border-teal-500 text-teal-600 text-sm font-medium">
                Sessions
              </Link>
              <Link to="/admin/twitter-parser/slots" className="py-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 text-sm font-medium">
                Slots
              </Link>
              <Link to="/admin/twitter-parser/monitor" className="py-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 text-sm font-medium">
                Monitor
              </Link>
            </div>
          </div>
        </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="border-gray-200">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-500">Total Sessions</div>
            </CardContent>
          </Card>
          <Card className="border-gray-200">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{stats.ok}</div>
              <div className="text-xs text-gray-500">Valid</div>
            </CardContent>
          </Card>
          <Card className="border-gray-200">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-amber-600">{stats.stale}</div>
              <div className="text-xs text-gray-500">Stale</div>
            </CardContent>
          </Card>
          <Card className="border-gray-200">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-600">{stats.invalid}</div>
              <div className="text-xs text-gray-500">Invalid/Expired</div>
            </CardContent>
          </Card>
        </div>

        {/* P1: Risk Engine Stats */}
        {riskReport && (
          <Card className="border-gray-200 mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-500" />
                Session Health (P1 Risk Engine)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-xl font-bold text-green-700">{riskReport.byRisk?.healthy || 0}</div>
                  <div className="text-xs text-green-600">Healthy (risk &lt;35)</div>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="text-xl font-bold text-amber-700">{riskReport.byRisk?.warning || 0}</div>
                  <div className="text-xs text-amber-600">Warning (35-70)</div>
                </div>
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-xl font-bold text-red-700">{riskReport.byRisk?.critical || 0}</div>
                  <div className="text-xs text-red-600">Critical (70+)</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-xl font-bold text-gray-700 flex items-center gap-1">
                    {workerStatus?.isRunning ? (
                      <>
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Active
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                        Stopped
                      </>
                    )}
                  </div>
                  <div className="text-xs text-gray-600">Health Worker</div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" onClick={handleRiskRecalculate}>
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Recalculate Risk
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Extension Setup Card */}
        <Card className="border-gray-200 mb-6" data-testid="extension-setup-card">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-500" />
              Extension Setup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Step 1: Download Extension */}
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-teal-600">1</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-2">Download Extension</h4>
                  <p className="text-sm text-gray-600 mb-3">Download and install the Chrome extension to sync Twitter cookies.</p>
                  <a
                    href="/fomo_extension_v1.3.0.zip"
                    download
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition"
                    data-testid="download-extension-btn"
                  >
                    <Download className="w-4 h-4" />
                    Download Extension (ZIP)
                  </a>
                  <p className="text-xs text-gray-500 mt-2">
                    Install: chrome://extensions → Developer mode → Load unpacked
                  </p>
                </div>
              </div>

              {/* Step 2: API Key */}
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-teal-600">2</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-2">Your API Key</h4>
                  <p className="text-sm text-gray-600 mb-3">Use this key in the extension settings.</p>
                  <div className="flex items-center gap-2 mb-3">
                    <code className="flex-1 p-3 bg-gray-100 rounded-lg text-sm font-mono break-all border border-gray-200">
                      {webhookInfo?.apiKey || 'Loading...'}
                    </code>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(webhookInfo?.apiKey)}
                      disabled={!webhookInfo?.apiKey}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRegenerateKey}
                    disabled={regenerating}
                    className="text-teal-600"
                  >
                    {regenerating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Key className="w-4 h-4 mr-2" />
                    )}
                    Generate New Key
                  </Button>
                </div>
              </div>

              {/* Step 3: Platform URL */}
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-teal-600">3</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-2">Platform URL</h4>
                  <p className="text-sm text-gray-600 mb-3">Enter this URL in the extension.</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 bg-gray-100 rounded-lg text-sm font-mono break-all border border-gray-200 text-teal-600">
                      {platformUrl}
                    </code>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(platformUrl)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Step 4: Sync */}
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-teal-600">4</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-2">Sync Session</h4>
                  <p className="text-sm text-gray-600">
                    Open the extension on Twitter (x.com), paste the Platform URL and API Key, then click "Sync Session".
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessions List */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-teal-500 mx-auto" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Cookie className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No sessions configured</p>
                <p className="text-sm mt-2">Use the webhook to ingest cookies from browser extension</p>
                <Button onClick={() => setShowWebhookDialog(true)} className="mt-4 bg-teal-500 hover:bg-teal-600 text-white">
                  View Webhook Info
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => {
                  // Find risk info from report
                  const riskInfo = riskReport?.sessions?.find(s => s.sessionId === session.sessionId);
                  
                  return (
                    <div key={session._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                          <Cookie className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{session.sessionId}</div>
                          {session.accountId && (
                            <div className="text-sm text-gray-600">
                              Account: @{session.accountId.username || session.accountId}
                            </div>
                          )}
                          <div className="text-xs text-gray-400">
                            {session.cookiesMeta?.count || 0} cookies • 
                            {session.cookiesMeta?.hasAuthToken ? ' ✓ auth_token' : ' ✗ auth_token'}
                            {session.cookiesMeta?.hasCt0 ? ' • ✓ ct0' : ' • ✗ ct0'}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {riskInfo && (
                              <>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3" />
                                  Risk: {riskInfo.riskScore}%
                                </span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Timer className="w-3 h-3" />
                                  ~{riskInfo.lifetime}d lifetime
                                </span>
                              </>
                            )}
                            {session.lastSyncedAt && (
                              <>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-400">
                                  Synced: {new Date(session.lastSyncedAt).toLocaleString()}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end gap-1">
                          <StatusBadge status={session.status} />
                          {riskInfo && <RiskBadge score={riskInfo.riskScore} />}
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleTest(session)}
                            disabled={testingSession === session.sessionId}
                          >
                            {testingSession === session.sessionId ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <PlayCircle className="w-4 h-4" />
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-700" 
                            onClick={() => setConfirmDelete(session)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Webhook Info Dialog */}
      <Dialog open={showWebhookDialog} onOpenChange={setShowWebhookDialog}>
        <DialogContent className="bg-white border-gray-200 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Webhook Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Webhook URL</label>
              <div className="flex gap-2">
                <code className="flex-1 p-2 bg-gray-100 rounded text-sm break-all">
                  {window.location.origin}{webhookInfo?.webhookUrl}
                </code>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(`${window.location.origin}${webhookInfo?.webhookUrl}`)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">API Key</label>
              <div className="flex gap-2">
                <code className="flex-1 p-2 bg-gray-100 rounded text-sm font-mono break-all">
                  {webhookInfo?.apiKey}
                </code>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(webhookInfo?.apiKey)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700">
                <strong>Security Note:</strong> Keep this API key secret. It is used to authenticate 
                cookie ingestion requests from the browser extension.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Request Format</label>
              <pre className="p-3 bg-gray-100 rounded text-xs overflow-auto">
{`POST ${webhookInfo?.webhookUrl}
Content-Type: application/json

{
  "apiKey": "<your-api-key>",
  "sessionId": "session_name",
  "cookies": [
    {"name": "auth_token", "value": "...", "domain": ".twitter.com"},
    {"name": "ct0", "value": "...", "domain": ".twitter.com"}
  ],
  "userAgent": "Mozilla/5.0...",
  "accountUsername": "twitter_handle"
}`}
              </pre>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWebhookDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Delete Session?</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Are you sure you want to delete session <strong>{confirmDelete?.sessionId}</strong>? 
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button 
              className="bg-red-500 hover:bg-red-600 text-white" 
              onClick={() => handleDelete(confirmDelete?.sessionId)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </AdminLayout>
  );
}
