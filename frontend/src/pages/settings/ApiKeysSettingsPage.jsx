/**
 * API Keys Settings Page
 * 
 * Manage API keys for Chrome Extension and other integrations
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Key, 
  Plus, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Shield,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function ApiKeysSettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showKey, setShowKey] = useState({});
  
  // Fetch API keys
  const fetchKeys = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const res = await axios.get(`${BACKEND_URL}/api/v4/user/api-keys`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.ok) {
        setKeys(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch API keys:', err);
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);
  
  // Create new API key
  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for the key');
      return;
    }
    
    try {
      setActionLoading(true);
      const token = localStorage.getItem('admin_token');
      const res = await axios.post(
        `${BACKEND_URL}/api/v4/user/api-keys`,
        { 
          name: newKeyName.trim(),
          scopes: ['twitter:cookies:write']
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.ok) {
        const newKey = res.data.data.apiKey;
        setCreatedKey(newKey);
        toast.success('API key created');
        // Refresh list to get fullKey for new key
        await fetchKeys();
        // Auto-copy to clipboard
        navigator.clipboard.writeText(newKey);
        toast.success('Key copied to clipboard!');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create key');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Revoke API key
  const handleRevokeKey = async (keyId) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('admin_token');
      const res = await axios.delete(
        `${BACKEND_URL}/api/v4/user/api-keys/${keyId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.ok) {
        toast.success('API key revoked');
        await fetchKeys();
      }
    } catch (err) {
      toast.error('Failed to revoke key');
    }
  };
  
  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };
  
  // Close create dialog and reset
  const closeCreateDialog = () => {
    setCreateDialogOpen(false);
    setNewKeyName('');
    setCreatedKey(null);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard/twitter')}
          className="mb-4 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Twitter Setup
        </Button>
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Key className="w-5 h-5 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
          </div>
          <p className="text-gray-500">
            Manage API keys for Chrome Extension and other integrations
          </p>
        </div>
        
        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-1">About API Keys</h3>
              <p className="text-sm text-blue-700">
                API keys allow the Chrome Extension to securely sync your Twitter session.
                Each key can only be used for specific actions (scoped permissions).
              </p>
            </div>
          </div>
        </div>
        
        {/* Keys list */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Your API Keys</h2>
            <Button 
              onClick={() => setCreateDialogOpen(true)}
              size="sm"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Create New Key
            </Button>
          </div>
          
          {keys.length === 0 ? (
            <div className="p-8 text-center">
              <Key className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No API Keys</h3>
              <p className="text-gray-500 mb-4">
                Create an API key to use with the Chrome Extension
              </p>
              <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Your First Key
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {keys.map((key) => (
                <div key={key.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{key.name}</h3>
                        {key.revoked ? (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                            Revoked
                          </span>
                        ) : (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono text-gray-600">
                          {key.fullKey ? key.fullKey.slice(0, 20) + '...' : key.keyPrefix}
                        </code>
                        <button
                          onClick={() => {
                            if (key.fullKey) {
                              copyToClipboard(key.fullKey);
                            } else {
                              toast.error('Full key not available. Please create a new key.');
                            }
                          }}
                          className="text-gray-400 hover:text-gray-600"
                          title={key.fullKey ? "Copy full key" : "Full key not available"}
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                        {key.scopes && (
                          <span className="flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            {key.scopes.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {!key.revoked && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeKey(key.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Usage instructions */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">How to use API Keys</h3>
          <ol className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium flex-shrink-0">1</span>
              <span>Create a new API key above</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium flex-shrink-0">2</span>
              <span>Copy the key immediately (it won't be shown again)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium flex-shrink-0">3</span>
              <span>Paste the key into the Chrome Extension settings</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium flex-shrink-0">4</span>
              <span>Click "Sync" in the extension to connect your Twitter</span>
            </li>
          </ol>
        </div>
      </div>
      
      {/* Create Key Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={closeCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for the Chrome Extension
            </DialogDescription>
          </DialogHeader>
          
          {createdKey ? (
            // Show created key
            <div className="py-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">API Key Created!</span>
                </div>
                <p className="text-sm text-green-700 mb-3">
                  Copy this key now. It won't be shown again.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white px-3 py-2 rounded border border-green-200 font-mono text-sm break-all">
                    {createdKey}
                  </code>
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(createdKey)}
                    className="gap-1"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button>
                </div>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    Save this key securely. For security reasons, we cannot show it again.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Create form
            <div className="py-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Name
                </label>
                <Input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Chrome Extension"
                />
                <p className="text-xs text-gray-500 mt-1">
                  A friendly name to identify this key
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-600">
                  <strong>Permissions:</strong> twitter:cookies:write
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  This key can only sync Twitter session cookies
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            {createdKey ? (
              <Button onClick={closeCreateDialog} className="w-full">
                Done
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={closeCreateDialog}>
                  Cancel
                </Button>
                <Button onClick={handleCreateKey} disabled={actionLoading}>
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Create Key
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
