/**
 * ML Overview Admin Page — S4.ADM.1
 * ==================================
 * 
 * Единая точка входа для управления ML системой.
 * Показывает общее состояние всех модулей.
 */

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { AlertCircle, CheckCircle, AlertTriangle, Power, PowerOff, Activity, Database, Cpu, Server, Loader2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function AdminMLOverviewPage() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/v4/admin/runtime/overview`);
      const data = await res.json();
      if (data.ok) {
        setOverview(data.data);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch overview');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 5000);
    return () => clearInterval(interval);
  }, [fetchOverview]);

  const handleKillSwitch = async (activate) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v4/admin/runtime/kill-switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activate }),
      });
      const data = await res.json();
      if (data.ok) {
        fetchOverview();
      }
    } catch (err) {
      console.error('Kill switch error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSoftStop = async (activate) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v4/admin/runtime/soft-stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activate }),
      });
      const data = await res.json();
      if (data.ok) {
        fetchOverview();
      }
    } catch (err) {
      console.error('Soft stop error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6">
          <h1 className="text-2xl font-bold text-slate-900">ML Overview</h1>
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Error: {error}</span>
            </div>
          </CardContent>
        </Card>
        </div>
      </AdminLayout>
    );
  }

  const { health, ram, modules, killSwitch } = overview;

  const getHealthIcon = (status) => {
    switch (status) {
      case 'OK': return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'DEGRADED': return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      case 'CRITICAL': return <AlertCircle className="h-6 w-6 text-red-500" />;
      default: return null;
    }
  };

  const getHealthColor = (status) => {
    switch (status) {
      case 'OK': return 'bg-green-100 border-green-300 text-green-800';
      case 'DEGRADED': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'CRITICAL': return 'bg-red-100 border-red-300 text-red-800';
      default: return 'bg-gray-100';
    }
  };

  const getModuleStatusBadge = (status) => {
    const variants = {
      'RUNNING': 'bg-green-100 text-green-800',
      'IDLE': 'bg-gray-100 text-gray-800',
      'DISABLED': 'bg-gray-200 text-gray-600',
      'STOPPED': 'bg-red-100 text-red-800',
      'STOPPING': 'bg-yellow-100 text-yellow-800',
    };
    return variants[status] || 'bg-gray-100';
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6" data-testid="ml-overview-page">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900">ML Overview</h1>
          <Badge variant="outline" className="text-xs">
            Auto-refresh: 5s
          </Badge>
        </div>

      {/* Health Status */}
      <Card className={`border-2 ${getHealthColor(health.status)}`} data-testid="health-status-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getHealthIcon(health.status)}
              <div>
                <h2 className="text-xl font-bold">System Status: {health.status}</h2>
                <p className="text-sm opacity-75">{health.reasons.join(' • ')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Safety Controls */}
      <Card className="border-2 border-red-200" data-testid="safety-controls-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Power className="h-5 w-5" />
            Safety Controls
          </CardTitle>
          <CardDescription>Emergency controls for system shutdown</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-semibold">🔴 Global Kill Switch</h3>
              <p className="text-sm text-gray-600">Immediately stops all modules</p>
            </div>
            <Button
              variant={killSwitch.global ? "destructive" : "outline"}
              onClick={() => handleKillSwitch(!killSwitch.global)}
              disabled={actionLoading}
              data-testid="kill-switch-btn"
            >
              {killSwitch.global ? (
                <>
                  <PowerOff className="h-4 w-4 mr-2" />
                  Deactivate
                </>
              ) : (
                <>
                  <Power className="h-4 w-4 mr-2" />
                  Activate Kill Switch
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-semibold">🟡 Soft Stop</h3>
              <p className="text-sm text-gray-600">Finish current batch, stop accepting new</p>
            </div>
            <Button
              variant={killSwitch.softStop ? "secondary" : "outline"}
              onClick={() => handleSoftStop(!killSwitch.softStop)}
              disabled={actionLoading || killSwitch.global}
              data-testid="soft-stop-btn"
            >
              {killSwitch.softStop ? 'Resume' : 'Soft Stop'}
            </Button>
          </div>

          {killSwitch.lastActivation && (
            <p className="text-xs text-gray-500">
              Last kill switch: {new Date(killSwitch.lastActivation).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* RAM Status */}
      <Card data-testid="ram-status-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Memory Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Used</span>
              <span className="font-mono">{ram.usedMB} MB ({ram.usedPercent}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  ram.usedPercent > 90 ? 'bg-red-500' :
                  ram.usedPercent > 75 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${ram.usedPercent}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Free: {ram.freeMB} MB</span>
              <span>Total: {ram.totalMB} MB</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 text-sm">
                {ram.canEnableRealML ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Can enable REAL ML
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Insufficient RAM for REAL ML
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Module Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sentiment Module */}
        <Card data-testid="sentiment-module-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              Sentiment Engine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status</span>
                <Badge className={getModuleStatusBadge(modules.sentiment.status)}>
                  {modules.sentiment.status}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Mode</span>
                <Badge variant="outline">{modules.sentiment.mode}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Enabled</span>
                <span className={modules.sentiment.enabled ? 'text-green-600' : 'text-red-600'}>
                  {modules.sentiment.enabled ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Twitter Module */}
        <Card data-testid="twitter-module-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Twitter Parser
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status</span>
                <Badge className={getModuleStatusBadge(modules.twitter.status)}>
                  {modules.twitter.status}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Parser</span>
                <span className={modules.twitter.parserEnabled ? 'text-green-600' : 'text-red-600'}>
                  {modules.twitter.parserEnabled ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Sentiment</span>
                <span className={modules.twitter.sentimentEnabled ? 'text-green-600' : 'text-red-600'}>
                  {modules.twitter.sentimentEnabled ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Automation Module */}
        <Card data-testid="automation-module-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="h-4 w-4" />
              Automation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status</span>
                <Badge className={getModuleStatusBadge(modules.automation.status)}>
                  {modules.automation.status}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Enabled</span>
                <span className={modules.automation.enabled ? 'text-green-600' : 'text-red-600'}>
                  {modules.automation.enabled ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Running</span>
                <span className={modules.automation.running ? 'text-green-600' : 'text-gray-400'}>
                  {modules.automation.running ? '✓ Active' : '○ Idle'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Module Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <a href="/admin/ml/sentiment" className="text-blue-600 hover:underline text-sm">
              → Sentiment Admin
            </a>
            <a href="/admin/ml/twitter-control" className="text-blue-600 hover:underline text-sm">
              → Twitter Admin
            </a>
            <a href="/admin/ml/automation" className="text-blue-600 hover:underline text-sm">
              → Automation Admin
            </a>
          </div>
        </CardContent>
      </Card>
      </div>
    </AdminLayout>
  );
}
