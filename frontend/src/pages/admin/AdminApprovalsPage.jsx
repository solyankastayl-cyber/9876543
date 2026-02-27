/**
 * Admin ML Approvals Page - FREEZE v2.3
 * 
 * Human-in-the-loop governance for ML models:
 * - Tab 1: Pending Approval (SHADOW + PASS)
 * - Tab 2: Active Models 
 * - Tab 3: History (audit log)
 */

import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useMlApprovalsStore } from '../../store/mlApprovals.store';
import { 
  Shield, RefreshCw, Loader2, CheckCircle, XCircle,
  AlertTriangle, Clock, Activity, TrendingUp, TrendingDown,
  Layers, Zap, ThumbsUp, ThumbsDown, RotateCcw, History,
  ChevronRight, Eye, User
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs';

// ============ HELPERS ============

function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDelta(value, inverse = false) {
  if (value === undefined || value === null) return '-';
  const num = (value * 100).toFixed(2);
  const isPositive = inverse ? value < 0 : value > 0;
  return (
    <span className={isPositive ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-slate-500'}>
      {value > 0 ? '+' : ''}{num}%
    </span>
  );
}

function formatPercent(value) {
  if (value === undefined || value === null) return '-';
  return `${(value * 100).toFixed(1)}%`;
}

function VerdictBadge({ verdict }) {
  const styles = {
    PASS: 'bg-green-100 text-green-700 border-green-200',
    FAIL: 'bg-red-100 text-red-700 border-red-200',
    INCONCLUSIVE: 'bg-amber-100 text-amber-700 border-amber-200',
    NONE: 'bg-slate-100 text-slate-500 border-slate-200',
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styles[verdict] || styles.NONE}`}>
      {verdict}
    </span>
  );
}

function ActionBadge({ action }) {
  const styles = {
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    ROLLBACK: 'bg-amber-100 text-amber-700',
    PROMOTED: 'bg-blue-100 text-blue-700',
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[action] || 'bg-slate-100 text-slate-500'}`}>
      {action}
    </span>
  );
}

function MlVersionBadge({ version }) {
  const isV23 = version?.includes('v2.3') || version?.includes('2.3');
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono ${isV23 ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
      {isV23 ? 'v2.3' : 'v2.1'}
    </span>
  );
}

// ============ PENDING TAB ============

function PendingTab() {
  const { 
    pending, pendingLoading, selectedTask, selectedNetwork,
    setSelectedTask, setSelectedNetwork, fetchPending, 
    approve, reject, promote, actionLoading, error
  } = useMlApprovalsStore();
  
  const [actionModal, setActionModal] = useState(null);
  const [comment, setComment] = useState('');
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    fetchPending();
  }, [selectedTask, selectedNetwork, fetchPending]);

  const networks = ['ethereum', 'arbitrum', 'optimism', 'base', 'polygon', 'bsc'];
  
  const handleAction = async () => {
    if (!actionModal) return;
    if (comment.length < 10) {
      setLocalError('Comment must be at least 10 characters');
      return;
    }
    
    let success = false;
    if (actionModal.action === 'approve') {
      success = await approve(actionModal.modelId, comment);
    } else if (actionModal.action === 'reject') {
      success = await reject(actionModal.modelId, comment);
    }
    
    if (success) {
      setActionModal(null);
      setComment('');
      setLocalError(null);
    }
  };

  const handlePromote = async (item) => {
    const success = await promote(item.task, item.version);
    if (!success) {
      setLocalError(error || 'Failed to promote');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Task:</span>
          <Select value={selectedTask} onValueChange={setSelectedTask}>
            <SelectTrigger className="w-28 bg-white border-slate-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="market">Market</SelectItem>
              <SelectItem value="actor">Actor</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Network:</span>
          <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
            <SelectTrigger className="w-36 bg-white border-slate-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {networks.map(net => (
                <SelectItem key={net} value={net}>{net}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchPending}
          disabled={pendingLoading}
          className="ml-auto"
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${pendingLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error */}
      {(error || localError) && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4" />
          {error || localError}
          <button onClick={() => { useMlApprovalsStore.getState().clearError(); setLocalError(null); }} className="ml-auto">✕</button>
        </div>
      )}

      {/* Candidates Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-900">Pending Approval</h3>
          <p className="text-xs text-slate-500">SHADOW models with PASS verdict awaiting decision</p>
        </div>
        
        {pendingLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : pending.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No pending approvals for {selectedTask}/{selectedNetwork}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-2 px-4 font-medium text-slate-600">Model</th>
                <th className="text-left py-2 px-4 font-medium text-slate-600">Version</th>
                <th className="text-center py-2 px-4 font-medium text-slate-600">ML</th>
                <th className="text-center py-2 px-4 font-medium text-slate-600">Δ Acc</th>
                <th className="text-center py-2 px-4 font-medium text-slate-600">Δ F1</th>
                <th className="text-center py-2 px-4 font-medium text-slate-600">Verdict</th>
                <th className="text-center py-2 px-4 font-medium text-slate-600">Features</th>
                <th className="text-right py-2 px-4 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.map(item => (
                <tr key={item.modelId} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-900">{item.task}</div>
                    <div className="text-xs text-slate-500">{item.network}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-mono text-sm text-slate-700 truncate max-w-40" title={item.version}>
                      {item.version.split('_').slice(-1)[0]}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <MlVersionBadge version={item.version} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    {formatDelta(item.eval?.delta?.accuracy)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {formatDelta(item.eval?.delta?.f1)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <VerdictBadge verdict={item.eval?.verdict || 'NONE'} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.featureMeta ? (
                      <span className="text-sm text-slate-600">
                        {item.featureMeta.kept}/{item.featureMeta.total}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {item.approvalStatus === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setActionModal({ ...item, action: 'approve' })}
                            disabled={actionLoading}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Approve"
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setActionModal({ ...item, action: 'reject' })}
                            disabled={actionLoading}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Reject"
                          >
                            <ThumbsDown className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {item.canPromote && (
                        <Button
                          size="sm"
                          onClick={() => handlePromote(item)}
                          disabled={actionLoading}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Zap className="w-4 h-4 mr-1" />
                          Promote
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Action Modal */}
      <Dialog open={!!actionModal} onOpenChange={() => { setActionModal(null); setComment(''); setLocalError(null); }}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionModal?.action === 'approve' ? (
                <><CheckCircle className="w-5 h-5 text-green-600" /> Approve Model</>
              ) : (
                <><XCircle className="w-5 h-5 text-red-600" /> Reject Model</>
              )}
            </DialogTitle>
            <DialogDescription>
              {actionModal?.action === 'approve' 
                ? 'This will allow the model to be promoted to ACTIVE.'
                : 'This model will be marked as rejected and cannot be promoted.'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg space-y-1">
              <div className="text-sm text-slate-600">Model: <span className="font-mono">{actionModal?.version}</span></div>
              <div className="text-sm text-slate-600">Task: {actionModal?.task} / {actionModal?.network}</div>
              <div className="text-sm text-slate-600">Verdict: <VerdictBadge verdict={actionModal?.eval?.verdict} /></div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Comment <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={actionModal?.action === 'approve' ? 'Reason for approval...' : 'Reason for rejection...'}
                className="bg-white border-slate-300 min-h-24"
              />
              <p className="text-xs text-slate-500 mt-1">Minimum 10 characters required</p>
            </div>

            {localError && (
              <div className="text-sm text-red-600">{localError}</div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionModal(null); setComment(''); setLocalError(null); }}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={actionLoading || comment.length < 10}
              className={actionModal?.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {actionModal?.action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ ACTIVE TAB ============

function ActiveTab() {
  const { 
    active, activeLoading, rollbackTargets, 
    fetchActive, fetchRollbackTargets, rollback, actionLoading, error 
  } = useMlApprovalsStore();
  
  const [rollbackModal, setRollbackModal] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchActive();
  }, [fetchActive]);

  const handleOpenRollback = async (model) => {
    setRollbackModal(model);
    await fetchRollbackTargets(model.task);
  };

  const handleRollback = async () => {
    if (!rollbackModal) return;
    const success = await rollback(rollbackModal.task, selectedTarget || undefined, comment);
    if (success) {
      setRollbackModal(null);
      setSelectedTarget('');
      setComment('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">Active Models</h3>
          <p className="text-xs text-slate-500">Currently deployed models in production</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchActive}
          disabled={activeLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${activeLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {activeLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      ) : active.length === 0 ? (
        <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
          <Shield className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>No active models</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {active.map(model => (
            <div key={model.modelId} className="p-4 bg-white rounded-xl border border-green-200 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-xs text-green-600 font-medium uppercase">ACTIVE</div>
                    <div className="font-semibold text-slate-900">{model.task} / {model.network}</div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenRollback(model)}
                  disabled={actionLoading}
                  className="text-amber-600 border-amber-300 hover:bg-amber-50"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Rollback
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Version</span>
                  <span className="font-mono text-slate-700">{model.version.split('_').slice(-1)[0]}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Accuracy</span>
                  <span className="font-medium text-slate-900">{formatPercent(model.metrics?.accuracy)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">F1 Score</span>
                  <span className="font-medium text-slate-900">{formatPercent(model.metrics?.f1)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Activated</span>
                  <span className="text-slate-600">{formatDate(model.activatedAt ? new Date(model.activatedAt) : model.promotedAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rollback Modal */}
      <Dialog open={!!rollbackModal} onOpenChange={() => { setRollbackModal(null); setSelectedTarget(''); setComment(''); }}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-600" />
              Rollback Model
            </DialogTitle>
            <DialogDescription>
              Rollback will deactivate the current model and restore a previous version.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="text-sm text-amber-800">
                Current: <span className="font-mono">{rollbackModal?.version}</span>
              </div>
              <div className="text-sm text-amber-800">
                Task: {rollbackModal?.task} / {rollbackModal?.network}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Target Version
              </label>
              <Select value={selectedTarget} onValueChange={setSelectedTarget}>
                <SelectTrigger className="bg-white border-slate-300">
                  <SelectValue placeholder="Select target version (or latest archived)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Latest archived</SelectItem>
                  {rollbackTargets.map(t => (
                    <SelectItem key={t.modelId} value={t.version}>
                      {t.version} ({t.network})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reason <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Reason for rollback..."
                className="bg-white border-slate-300 min-h-20"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRollbackModal(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleRollback}
              disabled={actionLoading || comment.length < 10}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm Rollback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ HISTORY TAB ============

function HistoryTab() {
  const { history, historyLoading, fetchHistory, selectedTask, setSelectedTask } = useMlApprovalsStore();

  useEffect(() => {
    fetchHistory();
  }, [selectedTask, fetchHistory]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="font-semibold text-slate-900">Approval History</h3>
            <p className="text-xs text-slate-500">Audit log of all governance decisions</p>
          </div>
          <Select value={selectedTask} onValueChange={setSelectedTask}>
            <SelectTrigger className="w-28 bg-white border-slate-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="market">Market</SelectItem>
              <SelectItem value="actor">Actor</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchHistory}
          disabled={historyLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${historyLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {historyLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <History className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No history yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-2 px-4 font-medium text-slate-600">Time</th>
                <th className="text-left py-2 px-4 font-medium text-slate-600">Action</th>
                <th className="text-left py-2 px-4 font-medium text-slate-600">Model</th>
                <th className="text-left py-2 px-4 font-medium text-slate-600">Network</th>
                <th className="text-left py-2 px-4 font-medium text-slate-600">Actor</th>
                <th className="text-left py-2 px-4 font-medium text-slate-600">Reason</th>
              </tr>
            </thead>
            <tbody>
              {history.map(event => (
                <tr key={event.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="py-3 px-4 text-slate-600">{formatDate(event.createdAt)}</td>
                  <td className="py-3 px-4"><ActionBadge action={event.action} /></td>
                  <td className="py-3 px-4 font-mono text-slate-700 truncate max-w-32" title={event.modelVersion}>
                    {event.modelVersion.split('_').slice(-1)[0]}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{event.network}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-slate-600">
                      <User className="w-3 h-3" />
                      {event.actor?.username || event.actor?.id || '-'}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-500 truncate max-w-48" title={event.reason}>
                    {event.reason || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ============ MAIN PAGE ============

export default function AdminApprovalsPage() {
  const { pending, active, pendingLoading, activeLoading } = useMlApprovalsStore();

  const pendingCount = pending.filter(p => p.approvalStatus === 'PENDING').length;
  const activeCount = active.length;

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="admin-approvals-page">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">ML Model Approvals</h1>
            <p className="text-sm text-slate-500">Human-in-the-loop governance for ML models</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="bg-slate-100 p-1">
            <TabsTrigger value="pending" className="data-[state=active]:bg-white">
              <Clock className="w-4 h-4 mr-1" />
              Pending
              {pendingCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="data-[state=active]:bg-white">
              <Activity className="w-4 h-4 mr-1" />
              Active Models
              {activeCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                  {activeCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-white">
              <History className="w-4 h-4 mr-1" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <PendingTab />
          </TabsContent>

          <TabsContent value="active">
            <ActiveTab />
          </TabsContent>

          <TabsContent value="history">
            <HistoryTab />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
