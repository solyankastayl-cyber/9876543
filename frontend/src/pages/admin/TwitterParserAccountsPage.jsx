/**
 * Twitter Parser Accounts Admin Page
 * Manage Twitter accounts for the parser
 * LIGHT THEME VERSION
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  getTwitterAccounts,
  createTwitterAccount,
  updateTwitterAccount,
  enableTwitterAccount,
  disableTwitterAccount,
  deleteTwitterAccount,
} from '../../api/twitterParserAdmin.api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Power,
  PowerOff,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lock,
  LogIn,
} from 'lucide-react';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  ACTIVE: { label: 'Active', icon: CheckCircle, color: 'bg-green-50 text-green-700 border-green-200' },
  DISABLED: { label: 'Disabled', icon: PowerOff, color: 'bg-gray-50 text-gray-600 border-gray-200' },
  SUSPENDED: { label: 'Suspended', icon: XCircle, color: 'bg-red-50 text-red-700 border-red-200' },
  LOCKED: { label: 'Locked', icon: Lock, color: 'bg-red-50 text-red-700 border-red-200' },
  NEEDS_LOGIN: { label: 'Needs Login', icon: LogIn, color: 'bg-amber-50 text-amber-700 border-amber-200' },
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DISABLED;
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={`${config.color} font-medium`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}

function AccountForm({ account, onSave, onCancel }) {
  const [username, setUsername] = useState(account?.username || '');
  const [displayName, setDisplayName] = useState(account?.displayName || '');
  const [notes, setNotes] = useState(account?.notes || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error('Username is required');
      return;
    }
    setLoading(true);
    try {
      await onSave({ 
        username: username.trim().replace('@', ''), 
        displayName: displayName.trim() || undefined,
        notes: notes.trim() || undefined 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Twitter Username *</label>
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g., @cryptotrader"
          className="bg-white border-gray-200"
          disabled={!!account}
        />
        {!!account && <p className="text-xs text-gray-400 mt-1">Username cannot be changed</p>}
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Display Name</label>
        <Input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g., Main Trading Account"
          className="bg-white border-gray-200"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Notes</label>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., For SOL projects"
          className="bg-white border-gray-200"
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading} className="bg-teal-500 hover:bg-teal-600 text-white">
          {loading ? 'Saving...' : (account ? 'Update' : 'Create')}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function TwitterParserAccountsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAdminAuth();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showDialog, setShowDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTwitterAccounts();
      if (res.ok) {
        setAccounts(res.data || []);
      } else {
        setError(res.error || 'Failed to load accounts');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchAccounts();
    }
  }, [authLoading, isAuthenticated, fetchAccounts]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleCreate = async (data) => {
    const res = await createTwitterAccount(data);
    if (res.ok) {
      toast.success('Account created');
      setShowDialog(false);
      fetchAccounts();
    } else {
      toast.error(res.error || 'Failed to create');
    }
  };

  const handleUpdate = async (data) => {
    const res = await updateTwitterAccount(editingAccount._id, data);
    if (res.ok) {
      toast.success('Account updated');
      setShowDialog(false);
      setEditingAccount(null);
      fetchAccounts();
    } else {
      toast.error(res.error || 'Failed to update');
    }
  };

  const handleToggleStatus = async (account) => {
    const action = account.status === 'ACTIVE' ? disableTwitterAccount : enableTwitterAccount;
    const res = await action(account._id);
    if (res.ok) {
      toast.success(`Account ${account.status === 'ACTIVE' ? 'disabled' : 'enabled'}`);
      fetchAccounts();
    } else {
      toast.error(res.error || 'Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    const res = await deleteTwitterAccount(id);
    if (res.ok) {
      toast.success('Account deleted');
      setConfirmDelete(null);
      fetchAccounts();
    } else {
      toast.error(res.error || 'Failed to delete');
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
      <div className="min-h-screen bg-gray-50" data-testid="admin-accounts-page">
        {/* Page Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Twitter Accounts</h1>
              <p className="text-sm text-gray-500">Manage accounts for parsing</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={fetchAccounts} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={() => { setEditingAccount(null); setShowDialog(true); }} className="bg-teal-500 hover:bg-teal-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Account
              </Button>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex gap-6">
              <Link to="/admin/twitter-parser/accounts" className="py-3 border-b-2 border-teal-500 text-teal-600 text-sm font-medium">
                Accounts
              </Link>
              <Link to="/admin/twitter-parser/sessions" className="py-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 text-sm font-medium">
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
              <div className="text-2xl font-bold text-gray-900">{accounts.length}</div>
              <div className="text-xs text-gray-500">Total Accounts</div>
            </CardContent>
          </Card>
          <Card className="border-gray-200">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">
                {accounts.filter(a => a.status === 'ACTIVE').length}
              </div>
              <div className="text-xs text-gray-500">Active</div>
            </CardContent>
          </Card>
          <Card className="border-gray-200">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-gray-500">
                {accounts.filter(a => a.status === 'DISABLED').length}
              </div>
              <div className="text-xs text-gray-500">Disabled</div>
            </CardContent>
          </Card>
          <Card className="border-gray-200">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-amber-600">
                {accounts.filter(a => a.status === 'NEEDS_LOGIN' || a.status === 'LOCKED').length}
              </div>
              <div className="text-xs text-gray-500">Issues</div>
            </CardContent>
          </Card>
        </div>

        {/* Accounts List */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-teal-500 mx-auto" />
              </div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No accounts configured</p>
                <Button onClick={() => { setEditingAccount(null); setShowDialog(true); }} className="mt-4 bg-teal-500 hover:bg-teal-600 text-white">
                  Add First Account
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {accounts.map((account) => (
                  <div key={account._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">@{account.username}</div>
                        {account.displayName && <div className="text-sm text-gray-600">{account.displayName}</div>}
                        {account.notes && <div className="text-xs text-gray-400">{account.notes}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-xs text-gray-400">
                        Rate: {account.rateLimit || 200}/hr
                      </div>
                      <StatusBadge status={account.status} />
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(account)}>
                          {account.status === 'ACTIVE' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setEditingAccount(account); setShowDialog(true); }}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => setConfirmDelete(account)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900">{editingAccount ? 'Edit Account' : 'Add Account'}</DialogTitle>
          </DialogHeader>
          <AccountForm
            account={editingAccount}
            onSave={editingAccount ? handleUpdate : handleCreate}
            onCancel={() => { setShowDialog(false); setEditingAccount(null); }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Delete Account?</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Are you sure you want to delete <strong>@{confirmDelete?.username}</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={() => handleDelete(confirmDelete._id)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </AdminLayout>
  );
}
