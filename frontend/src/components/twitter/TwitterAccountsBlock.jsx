/**
 * A.2.1 - Twitter Accounts Block
 * 
 * Отображает список Twitter аккаунтов пользователя с возможностью:
 * - Добавления нового аккаунта (до лимита)
 * - Установки preferred аккаунта
 * - Просмотра статуса сессии каждого аккаунта
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Star, StarOff, RefreshCw, Trash2, 
  AlertCircle, CheckCircle, Clock, XCircle,
  User, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  getAccounts,
  addAccount,
  deleteAccount,
  setPreferredAccount,
  toggleAccount,
} from '@/api/twitterIntegration.api';

// Session status badge component
function SessionBadge({ status }) {
  const config = {
    NO_SESSION: { icon: AlertCircle, color: 'text-gray-400', bg: 'bg-gray-100', label: 'No Session' },
    OK: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'OK' },
    STALE: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Stale' },
    INVALID: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Invalid' },
  };
  
  const cfg = config[status] || config.NO_SESSION;
  const Icon = cfg.icon;
  
  return (
    <span 
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}
      data-testid={`session-badge-${status?.toLowerCase()}`}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// Single account card
function AccountCard({ account, onSetPreferred, onDelete, onRefresh, loading }) {
  const [deleting, setDeleting] = useState(false);
  
  const handleDelete = async () => {
    if (!confirm(`Remove @${account.username}?`)) return;
    setDeleting(true);
    try {
      await onDelete(account.id);
    } finally {
      setDeleting(false);
    }
  };
  
  return (
    <div 
      className={`p-4 rounded-lg border ${
        account.isPreferred ? 'border-blue-300 bg-blue-50/50' : 'border-gray-200 bg-white'
      } ${!account.enabled ? 'opacity-60' : ''}`}
      data-testid={`account-card-${account.username}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">@{account.username}</span>
              {account.isPreferred && (
                <Star className="w-4 h-4 text-blue-500 fill-blue-500" />
              )}
            </div>
            {account.displayName && account.displayName !== account.username && (
              <div className="text-sm text-gray-500">{account.displayName}</div>
            )}
          </div>
        </div>
        
        <SessionBadge status={account.sessionStatus} />
      </div>
      
      {/* Actions */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!account.isPreferred && account.enabled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSetPreferred(account.id)}
              disabled={loading}
              data-testid={`set-preferred-${account.username}`}
            >
              <StarOff className="w-4 h-4 mr-1" />
              Set Preferred
            </Button>
          )}
          
          {account.sessionStatus === 'NO_SESSION' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRefresh(account.username)}
              data-testid={`sync-cookies-${account.username}`}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Sync Cookies
            </Button>
          )}
          
          {['STALE', 'INVALID'].includes(account.sessionStatus) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRefresh(account.username)}
              data-testid={`refresh-session-${account.username}`}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={deleting || loading}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
          data-testid={`delete-account-${account.username}`}
        >
          {deleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

// Add account modal
function AddAccountModal({ open, onClose, onAdd, loading }) {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error('Username is required');
      return;
    }
    
    const success = await onAdd(username.trim(), displayName.trim());
    if (success) {
      setUsername('');
      setDisplayName('');
      onClose();
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="add-account-modal">
        <DialogHeader>
          <DialogTitle>Add Twitter Account</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Twitter Username
              </label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="@username"
                data-testid="add-account-username-input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name (optional)
              </label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display Name"
                data-testid="add-account-displayname-input"
              />
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              <p>We do not access your Twitter yet.</p>
              <p>Cookies are synced later via Chrome extension.</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !username.trim()}
              data-testid="add-account-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Account'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Main component
export function TwitterAccountsBlock({ onRefreshRequest }) {
  const [accounts, setAccounts] = useState([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(3);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Fetch accounts
  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAccounts();
      setAccounts(data.accounts || []);
      setTotal(data.total || 0);
      setLimit(data.limit || 3);
    } catch (err) {
      toast.error('Failed to load accounts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);
  
  // Add account handler
  const handleAddAccount = async (username, displayName) => {
    try {
      setActionLoading(true);
      await addAccount(username, displayName);
      toast.success(`Account @${username} added`);
      await fetchAccounts();
      return true;
    } catch (err) {
      if (err.message === 'ACCOUNT_LIMIT_REACHED') {
        toast.error(`Your plan allows up to ${limit} accounts`);
      } else if (err.message === 'ACCOUNT_ALREADY_EXISTS') {
        toast.error(`Account @${username} already added`);
      } else {
        toast.error(err.message || 'Failed to add account');
      }
      return false;
    } finally {
      setActionLoading(false);
    }
  };
  
  // Delete account handler
  const handleDeleteAccount = async (accountId) => {
    try {
      setActionLoading(true);
      await deleteAccount(accountId);
      toast.success('Account removed');
      await fetchAccounts();
    } catch (err) {
      if (err.message === 'HAS_ACTIVE_SESSIONS') {
        toast.error('Cannot delete account with active sessions');
      } else {
        toast.error(err.message || 'Failed to remove account');
      }
    } finally {
      setActionLoading(false);
    }
  };
  
  // Set preferred handler
  const handleSetPreferred = async (accountId) => {
    try {
      setActionLoading(true);
      await setPreferredAccount(accountId);
      toast.success('Account set as preferred');
      await fetchAccounts();
    } catch (err) {
      toast.error(err.message || 'Failed to set preferred');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Refresh session handler
  const handleRefreshSession = (username) => {
    toast.info(`Open Chrome extension and sync cookies for @${username}`);
    onRefreshRequest?.(username);
  };
  
  if (loading && accounts.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }
  
  return (
    <div className="p-6" data-testid="twitter-accounts-block">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Twitter Accounts</h3>
          <p className="text-sm text-gray-500">{total} / {limit} accounts</p>
        </div>
        
        <Button
          onClick={() => setShowAddModal(true)}
          disabled={total >= limit || actionLoading}
          data-testid="add-account-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Account
        </Button>
      </div>
      
      {/* Limit warning */}
      {total >= limit && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          You&apos;ve reached the account limit ({limit}). Remove an account to add a new one.
        </div>
      )}
      
      {/* Accounts list */}
      <div className="space-y-3">
        {accounts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No Twitter accounts connected</p>
            <p className="text-sm">Add your first account to start parsing</p>
          </div>
        ) : (
          accounts.map(account => (
            <AccountCard
              key={account.id}
              account={account}
              onSetPreferred={handleSetPreferred}
              onDelete={handleDeleteAccount}
              onRefresh={handleRefreshSession}
              loading={actionLoading}
            />
          ))
        )}
      </div>
      
      {/* Add modal */}
      <AddAccountModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddAccount}
        loading={actionLoading}
      />
    </div>
  );
}

export default TwitterAccountsBlock;
