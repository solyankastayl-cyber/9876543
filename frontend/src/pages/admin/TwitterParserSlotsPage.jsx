/**
 * Twitter Parser Egress Slots Admin Page
 * Manage slots (PROXY / REMOTE_WORKER / MOCK) for the parser
 * LIGHT THEME VERSION
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  getEgressSlots,
  createEgressSlot,
  updateEgressSlot,
  deleteEgressSlot,
  getTwitterAccounts,
  testSlotConnection,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Server,
  Globe,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Link2,
  User,
  Wifi,
} from 'lucide-react';
import { toast } from 'sonner';

const TYPE_CONFIG = {
  PROXY: { label: 'Proxy', icon: Globe, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  REMOTE_WORKER: { label: 'Railway', icon: Server, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  MOCK: { label: 'Mock', icon: Zap, color: 'bg-amber-50 text-amber-700 border-amber-200' },
};

const HEALTH_CONFIG = {
  HEALTHY: { label: 'Healthy', color: 'bg-green-50 text-green-700 border-green-200' },
  DEGRADED: { label: 'Degraded', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  ERROR: { label: 'Error', color: 'bg-red-50 text-red-700 border-red-200' },
  UNKNOWN: { label: 'Unknown', color: 'bg-gray-50 text-gray-600 border-gray-200' },
};

function TypeBadge({ type }) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.MOCK;
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={`${config.color} font-medium`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}

function HealthBadge({ health }) {
  const config = HEALTH_CONFIG[health?.status] || HEALTH_CONFIG.UNKNOWN;
  return (
    <Badge variant="outline" className={`${config.color} font-medium`}>
      {config.label}
    </Badge>
  );
}

function SlotForm({ slot, accounts, onSave, onCancel }) {
  const [label, setLabel] = useState(slot?.label || '');
  const [type, setType] = useState(slot?.type || 'MOCK');
  const [baseUrl, setBaseUrl] = useState(slot?.worker?.baseUrl || '');
  const [proxyUrl, setProxyUrl] = useState(slot?.proxy?.url || '');
  const [accountId, setAccountId] = useState(slot?.boundAccountId || slot?.accountId || '');
  const [limitPerHour, setLimitPerHour] = useState(slot?.limits?.requestsPerHour || 200);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!label.trim()) {
      toast.error('Label is required');
      return;
    }
    setLoading(true);
    try {
      const data = {
        label: label.trim(),
        type,
        enabled: true,
        limits: { requestsPerHour: parseInt(limitPerHour) || 200 },
      };
      if (type === 'REMOTE_WORKER' && baseUrl) data.worker = { baseUrl: baseUrl.trim() };
      if (type === 'PROXY' && proxyUrl) data.proxy = { url: proxyUrl.trim() };
      if (accountId) data.boundAccountId = accountId;
      
      await onSave(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Label *</label>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g., Railway-EU-01"
          className="bg-white border-gray-200"
        />
      </div>
      
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Type *</label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="bg-white border-gray-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MOCK">Mock (Development)</SelectItem>
            <SelectItem value="PROXY">Proxy</SelectItem>
            <SelectItem value="REMOTE_WORKER">Railway / Remote Worker</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {type === 'REMOTE_WORKER' && (
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Base URL</label>
          <Input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://your-parser.up.railway.app"
            className="bg-white border-gray-200"
          />
        </div>
      )}

      {type === 'PROXY' && (
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Proxy URL</label>
          <Input
            value={proxyUrl}
            onChange={(e) => setProxyUrl(e.target.value)}
            placeholder="http://proxy:port"
            className="bg-white border-gray-200"
          />
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Bound Account</label>
        <Select value={accountId || 'none'} onValueChange={(val) => setAccountId(val === 'none' ? '' : val)}>
          <SelectTrigger className="bg-white border-gray-200">
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {accounts.map((a) => (
              <SelectItem key={a._id} value={a._id}>{a.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Limit per Hour</label>
        <Input
          type="number"
          value={limitPerHour}
          onChange={(e) => setLimitPerHour(e.target.value)}
          min={10}
          max={1000}
          className="bg-white border-gray-200"
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading} className="bg-teal-500 hover:bg-teal-600 text-white">
          {loading ? 'Saving...' : (slot ? 'Update' : 'Create')}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function TwitterParserSlotsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAdminAuth();

  const [slots, setSlots] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showDialog, setShowDialog] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [slotsRes, accountsRes] = await Promise.all([
        getEgressSlots(),
        getTwitterAccounts(),
      ]);
      if (slotsRes.ok) setSlots(slotsRes.data || []);
      if (accountsRes.ok) setAccounts(accountsRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchData();
    }
  }, [authLoading, isAuthenticated, fetchData]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleCreate = async (data) => {
    const res = await createEgressSlot(data);
    if (res.ok) {
      toast.success('Slot created');
      setShowDialog(false);
      fetchData();
    } else {
      toast.error(res.error || 'Failed to create');
    }
  };

  const handleUpdate = async (data) => {
    const res = await updateEgressSlot(editingSlot._id, data);
    if (res.ok) {
      toast.success('Slot updated');
      setShowDialog(false);
      setEditingSlot(null);
      fetchData();
    } else {
      toast.error(res.error || 'Failed to update');
    }
  };

  const handleDelete = async (id) => {
    const res = await deleteEgressSlot(id);
    if (res.ok) {
      toast.success('Slot deleted');
      setConfirmDelete(null);
      fetchData();
    } else {
      toast.error(res.error || 'Failed to delete');
    }
  };

  const [testingSlot, setTestingSlot] = useState(null);
  
  const handleTestConnection = async (slot) => {
    setTestingSlot(slot._id);
    try {
      const res = await testSlotConnection(slot._id);
      if (res.ok && res.data?.status?.ok) {
        toast.success(`Connection OK! Status: ${res.data.status.status || 'READY'}`);
      } else if (res.ok) {
        toast.warning(`Connection issue: ${res.data?.status?.message || 'Unknown status'}`);
      } else {
        toast.error(res.error || 'Connection test failed');
      }
      fetchData(); // Refresh to update health status
    } catch (err) {
      toast.error('Connection test failed: ' + (err.message || 'Network error'));
    } finally {
      setTestingSlot(null);
    }
  };

  const getAccountLabel = (id) => {
    const acc = accounts.find(a => a._id === id);
    return acc?.label || 'Not bound';
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
      <div className="min-h-screen bg-gray-50" data-testid="admin-slots-page">
        {/* Page Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Egress Slots</h1>
              <p className="text-sm text-gray-500">Configure data sources (Proxy, Railway, Mock)</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={() => { setEditingSlot(null); setShowDialog(true); }} className="bg-teal-500 hover:bg-teal-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Slot
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
              <Link to="/admin/twitter-parser/sessions" className="py-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 text-sm font-medium">
                Sessions
              </Link>
              <Link to="/admin/twitter-parser/slots" className="py-3 border-b-2 border-teal-500 text-teal-600 text-sm font-medium">
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
              <div className="text-2xl font-bold text-gray-900">{slots.length}</div>
              <div className="text-xs text-gray-500">Total Slots</div>
            </CardContent>
          </Card>
          <Card className="border-gray-200">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-purple-600">
                {slots.filter(s => s.type === 'REMOTE_WORKER').length}
              </div>
              <div className="text-xs text-gray-500">Railway</div>
            </CardContent>
          </Card>
          <Card className="border-gray-200">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-600">
                {slots.filter(s => s.type === 'PROXY').length}
              </div>
              <div className="text-xs text-gray-500">Proxy</div>
            </CardContent>
          </Card>
          <Card className="border-gray-200">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-amber-600">
                {slots.filter(s => s.type === 'MOCK').length}
              </div>
              <div className="text-xs text-gray-500">Mock</div>
            </CardContent>
          </Card>
        </div>

        {/* Slots List */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Configured Slots</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-teal-500 mx-auto" />
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Server className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No slots configured</p>
                <Button onClick={() => { setEditingSlot(null); setShowDialog(true); }} className="mt-4 bg-teal-500 hover:bg-teal-600 text-white">
                  Add First Slot
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {slots.map((slot) => (
                  <div key={slot._id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center">
                          {slot.type === 'REMOTE_WORKER' ? <Server className="w-5 h-5" /> :
                           slot.type === 'PROXY' ? <Globe className="w-5 h-5" /> :
                           <Zap className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{slot.label}</div>
                          <div className="text-sm text-gray-500">
                            {slot.type === 'REMOTE_WORKER' && slot.worker?.baseUrl && (
                              <span className="flex items-center gap-1">
                                <Link2 className="w-3 h-3" />
                                {slot.worker.baseUrl}
                              </span>
                            )}
                            {slot.type === 'PROXY' && slot.proxy?.url && (
                              <span className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {slot.proxy.url}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <TypeBadge type={slot.type} />
                        <HealthBadge health={slot.health} />
                        <div className="text-sm text-gray-500">
                          <User className="w-3 h-3 inline mr-1" />
                          {getAccountLabel(slot.boundAccountId)}
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-teal-600 border-teal-200 hover:bg-teal-50"
                            onClick={() => handleTestConnection(slot)}
                            disabled={testingSlot === slot._id}
                          >
                            <Wifi className={`w-4 h-4 mr-1 ${testingSlot === slot._id ? 'animate-pulse' : ''}`} />
                            {testingSlot === slot._id ? 'Testing...' : 'Test'}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { setEditingSlot(slot); setShowDialog(true); }}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => setConfirmDelete(slot)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    {/* Usage Bar */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Usage this hour</span>
                        <span>{slot.usage?.usedInWindow || 0} / {slot.limits?.requestsPerHour || 200}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full transition-all"
                          style={{ width: `${((slot.usage?.usedInWindow || 0) / (slot.limits?.requestsPerHour || 200)) * 100}%` }}
                        />
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
            <DialogTitle className="text-gray-900">{editingSlot ? 'Edit Slot' : 'Add Slot'}</DialogTitle>
          </DialogHeader>
          <SlotForm
            slot={editingSlot}
            accounts={accounts}
            onSave={editingSlot ? handleUpdate : handleCreate}
            onCancel={() => { setShowDialog(false); setEditingSlot(null); }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Delete Slot?</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Are you sure you want to delete "{confirmDelete?.label}"? This action cannot be undone.
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
