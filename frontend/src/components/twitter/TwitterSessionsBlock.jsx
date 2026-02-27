/**
 * A.2.2 - Twitter Sessions Block
 * 
 * Показывает список сессий для каждого Twitter аккаунта:
 * - Статус (OK/STALE/INVALID)
 * - Risk Score
 * - Version, Last Sync
 * - Refresh cookies flow
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  Shield, RefreshCw, Clock, AlertTriangle, CheckCircle, 
  XCircle, Activity, ChevronDown, ChevronRight, 
  ExternalLink, Loader2, Info, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from 'sonner';
import {
  getAccountSessions,
  getRefreshHint,
} from '@/api/twitterIntegration.api';

// Status config
const STATUS_CONFIG = {
  OK: { 
    icon: CheckCircle, 
    color: 'text-green-600', 
    bg: 'bg-green-100', 
    label: 'OK',
    explanation: 'Session valid, parser can run'
  },
  STALE: { 
    icon: Clock, 
    color: 'text-amber-600', 
    bg: 'bg-amber-100', 
    label: 'Stale',
    explanation: 'Cookies outdated or parser aborted. Refresh needed.'
  },
  INVALID: { 
    icon: XCircle, 
    color: 'text-red-600', 
    bg: 'bg-red-100', 
    label: 'Invalid',
    explanation: 'Auth token revoked or account locked. Re-sync required.'
  },
  ERROR: { 
    icon: AlertTriangle, 
    color: 'text-red-600', 
    bg: 'bg-red-100', 
    label: 'Error',
    explanation: 'Session encountered an error'
  },
};

// Risk level config
function getRiskLevel(score) {
  if (score <= 30) return { color: 'bg-green-500', label: 'Low', textColor: 'text-green-700' };
  if (score <= 60) return { color: 'bg-yellow-500', label: 'Medium', textColor: 'text-yellow-700' };
  if (score <= 80) return { color: 'bg-orange-500', label: 'High', textColor: 'text-orange-700' };
  return { color: 'bg-red-500', label: 'Critical', textColor: 'text-red-700' };
}

// Risk Meter component
function RiskMeter({ score }) {
  const level = getRiskLevel(score);
  const percentage = Math.min(100, Math.max(0, score));
  
  return (
    <div className="flex items-center gap-2" data-testid="risk-meter">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[80px]">
        <div 
          className={`h-full ${level.color} transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`text-xs font-medium ${level.textColor}`}>
        {score}
      </span>
    </div>
  );
}

// Status Badge
function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.ERROR;
  const Icon = config.icon;
  
  return (
    <div className="flex flex-col gap-1">
      <span 
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}
        data-testid={`status-badge-${status?.toLowerCase()}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
      <span className="text-[10px] text-gray-500 max-w-[200px]">
        {config.explanation}
      </span>
    </div>
  );
}

// Session Card
function SessionCard({ session, onRefresh }) {
  const [timeAgo, setTimeAgo] = useState('');
  
  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  // Calculate time ago in useEffect to avoid impure render
  useEffect(() => {
    const calculateTimeAgo = (date) => {
      if (!date) return 'Never';
      const diff = Date.now() - new Date(date).getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours < 1) return 'Just now';
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    };
    setTimeAgo(calculateTimeAgo(session.lastSyncAt));
  }, [session.lastSyncAt]);

  return (
    <div 
      className={`p-4 rounded-lg border ${
        session.isActive 
          ? 'border-blue-200 bg-blue-50/30' 
          : 'border-gray-200 bg-gray-50/50 opacity-70'
      }`}
      data-testid={`session-card-v${session.version}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">
            Version {session.version}
          </span>
          {session.isActive && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium">
              <Star className="w-3 h-3 fill-blue-500" />
              Active
            </span>
          )}
          {!session.isActive && (
            <span className="px-1.5 py-0.5 bg-gray-200 text-gray-500 rounded text-[10px]">
              Inactive
            </span>
          )}
        </div>
        <StatusBadge status={session.status} />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <div>
          <div className="text-[10px] text-gray-500 uppercase">Risk Score</div>
          <RiskMeter score={session.riskScore || 0} />
        </div>
        <div>
          <div className="text-[10px] text-gray-500 uppercase">Last Sync</div>
          <div className="text-xs text-gray-700">{timeAgo || 'Never'}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500 uppercase">Source</div>
          <div className="text-xs text-gray-700">{session.source || 'Unknown'}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500 uppercase">Lifetime Est.</div>
          <div className="text-xs text-gray-700">{session.lifetimeDaysEstimate || 14} days</div>
        </div>
      </div>

      {/* Additional info */}
      {(session.lastAbortAt || session.staleReason) && (
        <div className="mb-3 p-2 bg-amber-50 rounded text-xs">
          {session.staleReason && (
            <div className="flex items-center gap-1 text-amber-700">
              <AlertTriangle className="w-3 h-3" />
              {session.staleReason}
            </div>
          )}
          {session.lastAbortAt && (
            <div className="text-amber-600 mt-1">
              Last abort: {formatDate(session.lastAbortAt)}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {session.isActive && session.status !== 'OK' && (
        <div className="pt-3 border-t border-gray-200">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRefresh(session)}
            data-testid={`refresh-session-v${session.version}`}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh Cookies
          </Button>
        </div>
      )}
    </div>
  );
}

// Refresh Cookies Modal
function RefreshCookiesModal({ open, onClose, accountId, accountUsername, currentStatus }) {
  const [hint, setHint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (open && accountId) {
      setLoading(true);
      getRefreshHint(accountId)
        .then(data => setHint(data))
        .catch(err => {
          console.error(err);
          toast.error('Failed to load refresh info');
        })
        .finally(() => setLoading(false));
    }
  }, [open, accountId]);

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      const data = await getRefreshHint(accountId);
      setHint(data);
      if (data.currentStatus === 'OK') {
        toast.success('Session refreshed successfully!');
        onClose();
      } else {
        toast.info(`Status: ${data.currentStatus}`);
      }
    } catch (err) {
      toast.error('Failed to check status');
    } finally {
      setChecking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg" data-testid="refresh-cookies-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-500" />
            Refresh Cookies for @{accountUsername}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : hint ? (
          <div className="space-y-4">
            {/* Current Status */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current Status</span>
                <StatusBadge status={hint.currentStatus} />
              </div>
              {hint.lastSyncAt && (
                <div className="text-xs text-gray-500 mt-2">
                  Last sync: {new Date(hint.lastSyncAt).toLocaleString()}
                </div>
              )}
            </div>

            {/* Steps */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Follow these steps:</h4>
              <ol className="space-y-2">
                {hint.steps?.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-medium flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-gray-700 pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Extension Download Info */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <ExternalLink className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Chrome Extension Required</p>
                  <p className="text-xs mt-1">
                    Download the FOMO Twitter Sync extension to sync your cookies securely.
                    The extension reads Twitter cookies and sends them to the platform.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <a 
                      href="/fomo_extension_v1.3.0.zip" 
                      download
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Download Extension
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* API Key Info */}
            {hint.apiKeyRequired && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">API Key Required</p>
                    <p className="text-xs mt-1">
                      Make sure you have configured your API key in the extension.
                      <a 
                        href={hint.apiKeyPageUrl} 
                        className="text-amber-700 underline ml-1"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Manage API Keys
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Check Status Button */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
              <Button 
                onClick={handleCheckStatus}
                disabled={checking}
                data-testid="check-status-btn"
              >
                {checking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Check Status
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Failed to load refresh information
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Sessions list for single account
function AccountSessionsList({ accountId, accountUsername, expanded, onToggle }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshModal, setRefreshModal] = useState(null);
  const [showInactive, setShowInactive] = useState(false);

  const fetchSessions = useCallback(async () => {
    if (!expanded) return;
    
    setLoading(true);
    try {
      const data = await getAccountSessions(accountId, { onlyActive: !showInactive });
      setSessions(data.sessions || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [accountId, expanded, showInactive]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRefresh = (session) => {
    setRefreshModal({
      accountId,
      accountUsername,
      currentStatus: session.status,
    });
  };

  const activeSessions = sessions.filter(s => s.isActive);
  const inactiveSessions = sessions.filter(s => !s.isActive);

  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <button 
          className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          data-testid={`toggle-sessions-${accountUsername}`}
        >
          <div className="flex items-center gap-2">
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
            <Shield className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              Sessions for @{accountUsername}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {activeSessions.length} active
          </span>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="pt-3 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Shield className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No sessions found</p>
            <p className="text-xs">Sync cookies via Chrome extension to create a session</p>
          </div>
        ) : (
          <>
            {/* Active Sessions */}
            {activeSessions.map(session => (
              <SessionCard 
                key={session.id} 
                session={session} 
                onRefresh={handleRefresh}
              />
            ))}

            {/* Inactive Sessions Toggle */}
            {inactiveSessions.length > 0 && (
              <div className="pt-2">
                <button
                  onClick={() => setShowInactive(!showInactive)}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  {showInactive ? (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      Hide {inactiveSessions.length} inactive sessions
                    </>
                  ) : (
                    <>
                      <ChevronRight className="w-3 h-3" />
                      Show {inactiveSessions.length} inactive sessions
                    </>
                  )}
                </button>
                
                {showInactive && (
                  <div className="mt-2 space-y-2">
                    {inactiveSessions.map(session => (
                      <SessionCard 
                        key={session.id} 
                        session={session} 
                        onRefresh={handleRefresh}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Refresh Modal */}
        {refreshModal && (
          <RefreshCookiesModal
            open={true}
            onClose={() => {
              setRefreshModal(null);
              fetchSessions(); // Refresh list after closing
            }}
            {...refreshModal}
          />
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

// Main Sessions Block
export function TwitterSessionsBlock({ accounts }) {
  // Initialize expanded state based on accounts
  const getInitialExpanded = useCallback(() => {
    if (!accounts?.length) return {};
    const initial = {};
    accounts.forEach((acc, idx) => {
      // Expand first account, or accounts with non-OK status
      if (idx === 0 || acc.sessionStatus !== 'OK') {
        initial[acc.id] = true;
      }
    });
    return initial;
  }, [accounts]);

  const [expandedAccounts, setExpandedAccounts] = useState(getInitialExpanded);

  // Update when accounts change
  const accountIds = accounts?.map(a => a.id).join(',') || '';
  useEffect(() => {
    setExpandedAccounts(getInitialExpanded());
  }, [accountIds]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleAccount = (accountId) => {
    setExpandedAccounts(prev => ({
      ...prev,
      [accountId]: !prev[accountId],
    }));
  };

  if (!accounts || accounts.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <Shield className="w-10 h-10 mx-auto mb-3 text-gray-300" />
        <p>No accounts to show sessions for</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4" data-testid="twitter-sessions-block">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-gray-600" />
          Sessions
        </h3>
      </div>

      <div className="space-y-3">
        {accounts.map(account => (
          <AccountSessionsList
            key={account.id}
            accountId={account.id}
            accountUsername={account.username}
            expanded={expandedAccounts[account.id] || false}
            onToggle={() => toggleAccount(account.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default TwitterSessionsBlock;
