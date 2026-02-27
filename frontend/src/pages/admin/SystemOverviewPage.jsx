/**
 * System Overview Page (ЭТАП 1)
 * 
 * Операционный контроль системы:
 * - System Health
 * - Runtime Config  
 * - Networks Status
 * - Pipeline Timestamps
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { getSystemOverview } from '../../api/admin.api';
import AdminLayout from '../../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  Server,
  Brain,
  Database,
  Zap,
  Clock,
  Globe,
  HelpCircle,
  MessageCircle,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip';

// Info tooltip helper
function InfoTip({ text }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="text-slate-400 hover:text-slate-600 ml-1">
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-white text-white border-slate-700">
          <p className="text-xs">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Status badge component
function StatusBadge({ status }) {
  const config = {
    OK: { icon: CheckCircle, class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    DEGRADED: { icon: AlertTriangle, class: 'bg-amber-50 text-amber-700 border-amber-200' },
    RATE_LIMITED: { icon: AlertTriangle, class: 'bg-amber-50 text-amber-700 border-amber-200' },
    OFFLINE: { icon: XCircle, class: 'bg-red-50 text-red-700 border-red-200' },
    FAILED: { icon: XCircle, class: 'bg-red-50 text-red-700 border-red-200' },
  };
  const { icon: Icon, class: className } = config[status] || config.OFFLINE;
  
  return (
    <Badge variant="outline" className={`${className} font-medium`}>
      <Icon className="w-3 h-3 mr-1" />
      {status}
    </Badge>
  );
}

// Network indicator
function NetworkIndicator({ name, enabled }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
      enabled ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-50'
    }`}>
      <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
      <span className="text-sm font-medium text-slate-700 capitalize">{name}</span>
    </div>
  );
}

export default function SystemOverviewPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAdminAuth();
  
  const [data, setData] = useState(null);
  const [sentimentStatus, setSentimentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch sentiment status
  const fetchSentimentStatus = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/v4/admin/sentiment/status`);
      const result = await res.json();
      if (result.ok) {
        setSentimentStatus(result.data);
      }
    } catch (err) {
      console.log('[SystemOverview] Sentiment status fetch failed');
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const result = await getSystemOverview();
      if (result.ok) {
        setData(result.data);
        setError(null);
      }
    } catch (err) {
      if (err.message === 'UNAUTHORIZED') {
        navigate('/admin/login', { replace: true });
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin/login', { replace: true });
      return;
    }
    if (isAuthenticated) {
      fetchData();
      fetchSentimentStatus();
      const interval = setInterval(() => {
        fetchData();
        fetchSentimentStatus();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [authLoading, isAuthenticated, navigate, fetchData, fetchSentimentStatus]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const { system, runtime, networks, timestamps } = data || {};

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">System Overview</h1>
            <p className="text-sm text-slate-500 mt-1">Operational status of all platform components</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="border-slate-300"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* System Health */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-600" />
              System Health
              <InfoTip text="Real-time status of all platform services. OK = healthy, DEGRADED = partial issues, OFFLINE = not responding." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                  Backend
                  <InfoTip text="Node.js API server. Handles all API requests and business logic." />
                </p>
                <StatusBadge status={system?.backend?.status || 'OFFLINE'} />
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                  ML Service
                  <InfoTip text="Python ML service. Provides predictions and model inference. Latency shows response time." />
                </p>
                <StatusBadge status={system?.mlService?.status || 'OFFLINE'} />
                {system?.mlService?.latencyMs && (
                  <p className="text-xs text-slate-400 mt-1">{system.mlService.latencyMs}ms</p>
                )}
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                  Price Service
                  <InfoTip text="Market data provider. Fetches token prices from CoinGecko/Binance." />
                </p>
                <StatusBadge status={system?.priceService?.status || 'OFFLINE'} />
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                  Provider Pool
                  <InfoTip text="Pool of market data providers. Multiple providers ensure redundancy and failover." />
                </p>
                <StatusBadge status={system?.providerPool?.status || 'OFFLINE'} />
                <p className="text-xs text-slate-400 mt-1">
                  {system?.providerPool?.healthyCount || 0}/{system?.providerPool?.totalCount || 0} healthy
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sentiment Engine */}
        <Card className="border-slate-200" data-testid="sentiment-engine-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-purple-600" />
                Sentiment Engine
                <InfoTip text="NLP service for analyzing sentiment of tweets, news, and posts." />
              </CardTitle>
              <Link 
                to="/admin/ml/sentiment" 
                className="text-xs text-purple-600 hover:text-purple-700 font-medium"
              >
                Manage →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                  Status
                  <InfoTip text="Engine health. HEALTHY = operational, DEGRADED = partial, DISABLED = offline." />
                </p>
                <StatusBadge status={sentimentStatus?.health === 'HEALTHY' ? 'OK' : sentimentStatus?.health === 'DEGRADED' ? 'DEGRADED' : 'OFFLINE'} />
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                  Mode
                  <InfoTip text="MOCK = using simulated data, RUNTIME = using real ML model." />
                </p>
                <Badge variant="outline" className={sentimentStatus?.engineMode === 'mock' 
                  ? 'bg-amber-50 text-amber-700 border-amber-200 font-mono' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 font-mono'}>
                  {sentimentStatus?.engineMode?.toUpperCase() || 'N/A'}
                </Badge>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                  Uptime
                  <InfoTip text="Time since last engine restart." />
                </p>
                <p className="text-lg font-semibold text-slate-900">
                  {sentimentStatus?.uptimeSec ? `${Math.floor(sentimentStatus.uptimeSec / 60)}m` : 'N/A'}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                  Model
                  <InfoTip text="Current model version. Quality layer: S3 = advanced rules + normalization." />
                </p>
                <p className="text-sm text-slate-700 font-mono">
                  {sentimentStatus?.modelVersion || 'N/A'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Quality: {sentimentStatus?.qualityVersion || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Runtime */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600" />
              Runtime
              <InfoTip text="Current system configuration and operational mode." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                  Decision Mode
                  <InfoTip text="RULES_ONLY = pure algorithmic. ADVISORY = ML suggests. INFLUENCE = ML adjusts confidence." />
                </p>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-mono">
                  {runtime?.decisionMode || 'RULES_ONLY'}
                </Badge>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                  ML Influence
                  <InfoTip text="Whether ML model can adjust confidence scores. ON = ML active, OFF = rules only." />
                </p>
                <Badge variant="outline" className={runtime?.mlInfluence 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-slate-100 text-slate-600 border-slate-200'}>
                  {runtime?.mlInfluence ? 'ON' : 'OFF'}
                </Badge>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                  Kill Switch
                  <InfoTip text="Emergency stop. ARMED = ready to trigger. When activated, stops all automated trading." />
                </p>
                <Badge variant="outline" className={runtime?.killSwitch 
                  ? 'bg-red-50 text-red-700 border-red-200' 
                  : 'bg-slate-100 text-slate-600 border-slate-200'}>
                  {runtime?.killSwitch ? 'ARMED' : 'DISARMED'}
                </Badge>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                  Drift Level
                  <InfoTip text="Data drift detection. LOW = stable. MEDIUM = monitor. HIGH = investigate immediately." />
                </p>
                <Badge variant="outline" className={
                  runtime?.driftLevel === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200' :
                  runtime?.driftLevel === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-emerald-50 text-emerald-700 border-emerald-200'
                }>
                  {runtime?.driftLevel || 'LOW'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Networks */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-600" />
                Networks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {networks && Object.entries(networks).map(([name, enabled]) => (
                  <NetworkIndicator key={name} name={name} enabled={enabled} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-600" />
                Pipeline Timestamps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: 'Last Feature Build', key: 'lastFeatureBuild' },
                  { label: 'Last Labeling', key: 'lastLabeling' },
                  { label: 'Last Dataset Build', key: 'lastDatasetBuild' },
                  { label: 'Last ML Inference', key: 'lastMLInference' },
                ].map(({ label, key }) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <span className="text-sm text-slate-600">{label}</span>
                    <span className="text-sm font-mono text-slate-900">
                      {timestamps?.[key] 
                        ? new Date(timestamps[key]).toLocaleTimeString()
                        : '—'
                      }
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
