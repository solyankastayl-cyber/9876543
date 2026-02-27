/**
 * Admin Providers Page
 * 
 * External provider management: status, reset, add/remove.
 * Uses AdminLayout with light theme.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  getProvidersStatus,
  resetAllProviders,
  addProvider,
  removeProvider,
} from '../../api/admin.api';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { InfoTooltip, ADMIN_TOOLTIPS } from '../../components/admin/InfoTooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import {
  Server,
  RefreshCw,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RotateCcw,
  Loader2,
  Clock,
} from 'lucide-react';

function ProviderCard({ provider, isAdmin, onRemove, removing }) {
  const isHealthy = provider.healthy;
  
  return (
    <div 
      className={`p-4 rounded-lg border ${
        isHealthy 
          ? 'bg-white border-slate-200' 
          : 'bg-red-50 border-red-200'
      }`}
      data-testid={`provider-card-${provider.id}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded ${isHealthy ? 'bg-green-100' : 'bg-red-100'}`}>
            <Server className={`w-4 h-4 ${isHealthy ? 'text-green-600' : 'text-red-600'}`} />
          </div>
          <div>
            <p className="font-medium text-slate-900">{provider.id}</p>
            <p className="text-xs text-slate-500">{provider.type}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isHealthy ? (
            <Badge className="bg-green-100 text-green-700 border-green-300">
              <CheckCircle className="w-3 h-3 mr-1" />
              Healthy
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-700 border-red-300">
              <XCircle className="w-3 h-3 mr-1" />
              Cooldown
            </Badge>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-2 bg-slate-50 border border-slate-200 rounded">
          <p className="text-xs text-slate-500">Requests</p>
          <p className="font-semibold text-slate-900">{provider.requestCount || 0}</p>
        </div>
        <div className="p-2 bg-slate-50 border border-slate-200 rounded">
          <p className="text-xs text-slate-500">Errors</p>
          <p className="font-semibold text-red-600">{provider.errorCount || 0}</p>
        </div>
        <div className="p-2 bg-slate-50 border border-slate-200 rounded">
          <p className="text-xs text-slate-500">Weight</p>
          <p className="font-semibold text-slate-900">{provider.weight || 1}</p>
        </div>
      </div>
      
      {!isHealthy && provider.cooldownUntil && (
        <div className="mt-3 flex items-center gap-2 text-xs text-amber-600">
          <Clock className="w-3 h-3" />
          <span>Cooldown until: {new Date(provider.cooldownUntil).toLocaleTimeString()}</span>
        </div>
      )}
      
      {isAdmin && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(provider.id)}
            disabled={removing}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            data-testid={`provider-remove-${provider.id}`}
          >
            {removing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span className="ml-2">Remove</span>
          </Button>
        </div>
      )}
    </div>
  );
}

export default function AdminProvidersPage() {
  const navigate = useNavigate();
  const { isAdmin, isAuthenticated, loading: authLoading } = useAdminAuth();
  
  const [providers, setProviders] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newProvider, setNewProvider] = useState({
    id: '',
    type: 'coingecko',
    baseUrl: 'https://api.coingecko.com/api/v3',
    apiKey: '',
    weight: 1,
  });

  const fetchProviders = useCallback(async () => {
    try {
      const result = await getProvidersStatus();
      if (result.ok) {
        setProviders(result.data);
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
      fetchProviders();
    }
  }, [authLoading, isAuthenticated, navigate, fetchProviders]);

  const handleResetAll = async () => {
    if (!isAdmin) return;
    setActionLoading('reset');
    try {
      await resetAllProviders();
      await fetchProviders();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveProvider = async (id) => {
    if (!isAdmin) return;
    setActionLoading(`remove-${id}`);
    try {
      await removeProvider(id);
      await fetchProviders();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddProvider = async () => {
    if (!isAdmin) return;
    setActionLoading('add');
    try {
      await addProvider(newProvider);
      setShowAddDialog(false);
      setNewProvider({
        id: '',
        type: 'coingecko',
        baseUrl: 'https://api.coingecko.com/api/v3',
        apiKey: '',
        weight: 1,
      });
      await fetchProviders();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  const { providers: providerList = [], summary = {} } = providers || {};

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Server className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Providers</h1>
              <p className="text-sm text-slate-500">External data sources and API configuration</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchProviders} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}

        {!isAdmin && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-700">
            <AlertTriangle className="w-5 h-5" />
            Read-only mode. Only ADMIN role can modify providers.
          </div>
        )}

        {/* Summary */}
        <div className="bg-white rounded-lg border border-slate-200 p-6" data-testid="providers-summary">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              Provider Pool Summary
              <InfoTooltip text={ADMIN_TOOLTIPS.providers} />
            </h3>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetAll}
                    disabled={actionLoading === 'reset'}
                    className="border-amber-300 text-amber-700 hover:bg-amber-50"
                    data-testid="providers-reset-all-btn"
                  >
                    {actionLoading === 'reset' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4" />
                    )}
                    <span className="ml-2">Reset All</span>
                  </Button>
                  
                  <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-green-300 text-green-700 hover:bg-green-50"
                        data-testid="providers-add-btn"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="ml-2">Add</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white border-slate-200">
                      <DialogHeader>
                        <DialogTitle className="text-slate-900">Add Provider</DialogTitle>
                        <DialogDescription className="text-slate-500">
                          Add a new external data provider to the pool.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label className="text-slate-700">Provider ID</Label>
                          <Input
                            value={newProvider.id}
                            onChange={(e) => setNewProvider({ ...newProvider, id: e.target.value })}
                            placeholder="coingecko-backup"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-700">Type</Label>
                          <select
                            value={newProvider.type}
                            onChange={(e) => setNewProvider({ ...newProvider, type: e.target.value })}
                            className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-slate-900"
                          >
                            <option value="coingecko">CoinGecko</option>
                            <option value="binance">Binance</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-slate-700">Base URL</Label>
                          <Input
                            value={newProvider.baseUrl}
                            onChange={(e) => setNewProvider({ ...newProvider, baseUrl: e.target.value })}
                            placeholder="https://api.coingecko.com/api/v3"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-700">API Key (optional)</Label>
                          <Input
                            value={newProvider.apiKey}
                            onChange={(e) => setNewProvider({ ...newProvider, apiKey: e.target.value })}
                            type="password"
                            placeholder="••••••••"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-700">Weight</Label>
                          <Input
                            type="number"
                            value={newProvider.weight}
                            onChange={(e) => setNewProvider({ ...newProvider, weight: parseInt(e.target.value) })}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="ghost"
                          onClick={() => setShowAddDialog(false)}
                          className="text-slate-600"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddProvider}
                          disabled={!newProvider.id || actionLoading === 'add'}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {actionLoading === 'add' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Add Provider'
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total</p>
              <p className="text-2xl font-bold text-slate-900">{summary.total || 0}</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Healthy</p>
              <p className="text-2xl font-bold text-green-600">{summary.healthy || 0}</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Requests</p>
              <p className="text-2xl font-bold text-slate-900">{summary.totalRequests || 0}</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Errors</p>
              <p className="text-2xl font-bold text-red-600">{summary.totalErrors || 0}</p>
            </div>
          </div>
        </div>

        {/* Provider List */}
        <div className="bg-white rounded-lg border border-slate-200 p-6" data-testid="providers-list">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Active Providers</h3>
          <p className="text-sm text-slate-500 mb-4">External API providers for price data</p>
          
          {providerList.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Server className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No providers configured</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {providerList.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  isAdmin={isAdmin}
                  onRemove={handleRemoveProvider}
                  removing={actionLoading === `remove-${provider.id}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
