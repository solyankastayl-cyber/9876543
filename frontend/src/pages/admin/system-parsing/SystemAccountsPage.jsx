// Admin System Parsing - Accounts Management
import React, { useState, useEffect } from 'react';
import { Users, Plus, Tag, CheckCircle, XCircle, MoreVertical } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function SystemAccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAccount, setNewAccount] = useState({ username: '', label: '', tags: '' });
  const [creating, setCreating] = useState(false);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v4/admin/system/accounts`);
      const data = await res.json();
      if (data.ok) {
        setAccounts(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreate = async () => {
    if (!newAccount.username) return;
    
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/v4/admin/system/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newAccount.username,
          label: newAccount.label || undefined,
          tags: newAccount.tags ? newAccount.tags.split(',').map(t => t.trim()) : [],
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setShowCreateDialog(false);
        setNewAccount({ username: '', label: '', tags: '' });
        fetchAccounts();
      } else {
        alert(data.error || 'Failed to create account');
      }
    } catch (err) {
      alert('Failed to create account: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDisable = async (accountId) => {
    if (!confirm('Are you sure you want to disable this account?')) return;
    
    try {
      const res = await fetch(`${API_URL}/api/v4/admin/system/accounts/${accountId}/disable`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.ok) {
        fetchAccounts();
      }
    } catch (err) {
      alert('Failed to disable account: ' + err.message);
    }
  };

  const SessionBadge = ({ sessions }) => {
    const total = (sessions?.ok || 0) + (sessions?.stale || 0) + (sessions?.invalid || 0);
    if (total === 0) return <span className="text-xs text-zinc-500">No sessions</span>;
    
    return (
      <div className="flex items-center gap-1">
        {sessions?.ok > 0 && (
          <span className="px-1.5 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded">
            {sessions.ok} OK
          </span>
        )}
        {sessions?.stale > 0 && (
          <span className="px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded">
            {sessions.stale} STALE
          </span>
        )}
        {sessions?.invalid > 0 && (
          <span className="px-1.5 py-0.5 text-xs bg-red-500/20 text-red-400 rounded">
            {sessions.invalid} INVALID
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6" data-testid="system-accounts-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-500" />
          System Accounts
        </h2>
        <Button onClick={() => setShowCreateDialog(true)} data-testid="create-account-btn">
          <Plus className="w-4 h-4 mr-2" />
          Add Account
        </Button>
      </div>

      {/* Accounts List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      ) : accounts.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">No system accounts yet</p>
            <p className="text-sm text-zinc-500 mt-1">Create your first system account to start parsing</p>
            <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <Card key={account._id} className="bg-zinc-900 border-zinc-800" data-testid={`account-${account.username}`}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
                      <span className="text-lg">@</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{account.label || account.username}</span>
                        <span className={`w-2 h-2 rounded-full ${
                          account.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-zinc-500'
                        }`} />
                      </div>
                      <div className="text-sm text-zinc-500">@{account.username}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Tags */}
                    {account.tags?.length > 0 && (
                      <div className="flex items-center gap-1">
                        {account.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-400 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Sessions */}
                    <SessionBadge sessions={account.sessions} />
                    
                    {/* Actions */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisable(account._id)}
                      className="text-zinc-400 hover:text-red-400"
                      disabled={account.status === 'DISABLED'}
                    >
                      {account.status === 'ACTIVE' ? 'Disable' : 'Disabled'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle>Add System Account</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1.5 block">Twitter Username *</label>
              <Input
                placeholder="@elonmusk"
                value={newAccount.username}
                onChange={(e) => setNewAccount({ ...newAccount, username: e.target.value })}
                className="bg-zinc-800 border-zinc-700"
                data-testid="input-username"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1.5 block">Label</label>
              <Input
                placeholder="Elon Main Account"
                value={newAccount.label}
                onChange={(e) => setNewAccount({ ...newAccount, label: e.target.value })}
                className="bg-zinc-800 border-zinc-700"
                data-testid="input-label"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1.5 block">Tags (comma-separated)</label>
              <Input
                placeholder="core, sentiment, news"
                value={newAccount.tags}
                onChange={(e) => setNewAccount({ ...newAccount, tags: e.target.value })}
                className="bg-zinc-800 border-zinc-700"
                data-testid="input-tags"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating || !newAccount.username} data-testid="submit-create">
              {creating ? 'Creating...' : 'Create Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
