/**
 * Twitter Admin Page — S4.ADM.3
 * ==============================
 * 
 * Контроль Twitter pipeline:
 * - Parser status
 * - Data Quality
 * - Runtime flags
 */

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { AlertCircle, CheckCircle, AlertTriangle, Twitter, Database, Settings, RefreshCw, Loader2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function AdminTwitterPage() {
  const [twitterStatus, setTwitterStatus] = useState(null);
  const [dataQuality, setDataQuality] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, qualityRes] = await Promise.all([
        fetch(`${API_URL}/api/v4/admin/runtime/twitter`),
        fetch(`${API_URL}/api/v4/admin/sentiment/twitter/data-quality`).catch(() => ({ ok: false })),
      ]);
      
      const statusData = await statusRes.json();
      
      if (statusData.ok) {
        setTwitterStatus(statusData.data);
      }
      
      if (qualityRes.ok) {
        const qualityData = await qualityRes.json();
        if (qualityData.ok) {
          setDataQuality(qualityData.data);
        }
      }
      
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleFlagChange = async (flag, value) => {
    setActionLoading(true);
    try {
      const body = {};
      if (flag === 'parser') body.parser = value;
      if (flag === 'sentiment') body.sentiment = value;
      if (flag === 'price') body.price = value;
      
      const res = await fetch(`${API_URL}/api/v4/admin/runtime/twitter/flags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const data = await res.json();
      if (data.ok) {
        fetchData();
      } else {
        alert(data.message || 'Failed to update flag');
      }
    } catch (err) {
      console.error('Flag update error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6">
          <h1 className="text-2xl font-bold text-slate-900">Twitter Admin</h1>
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

  const getStatusBadge = (status) => {
    const variants = {
      'RUNNING': 'bg-green-100 text-green-800',
      'DISABLED': 'bg-gray-200 text-gray-600',
      'STOPPED': 'bg-red-100 text-red-800',
    };
    return variants[status] || 'bg-gray-100';
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6" data-testid="twitter-admin-page">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Twitter className="h-6 w-6" />
          Twitter Admin
        </h1>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Parser Status */}
      <Card data-testid="parser-status-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Parser Status
          </CardTitle>
          <CardDescription>Twitter data ingestion pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Status</p>
              <Badge className={getStatusBadge(twitterStatus?.parser?.status)}>
                {twitterStatus?.parser?.status || 'UNKNOWN'}
              </Badge>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Parser Enabled</p>
              <p className="font-semibold">
                {twitterStatus?.parser?.enabled ? (
                  <span className="text-green-600">✓ Yes</span>
                ) : (
                  <span className="text-red-600">✗ No</span>
                )}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Sentiment Enabled</p>
              <p className="font-semibold">
                {twitterStatus?.sentiment?.enabled ? (
                  <span className="text-green-600">✓ Yes</span>
                ) : (
                  <span className="text-red-600">✗ No</span>
                )}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Price Enabled</p>
              <p className="font-semibold">
                {twitterStatus?.price?.enabled ? (
                  <span className="text-green-600">✓ Yes</span>
                ) : (
                  <span className="text-gray-400">✗ Locked (S5)</span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Runtime Flags Control */}
      <Card data-testid="runtime-flags-card">
        <CardHeader>
          <CardTitle>Runtime Flags</CardTitle>
          <CardDescription>Toggle modules without restart</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-semibold">TWITTER_PARSER_ENABLED</h3>
              <p className="text-sm text-gray-600">Enable/disable Twitter data ingestion</p>
            </div>
            <Switch
              checked={twitterStatus?.flags?.TWITTER_PARSER_ENABLED || false}
              onCheckedChange={(checked) => handleFlagChange('parser', checked)}
              disabled={actionLoading}
              data-testid="parser-toggle"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-semibold">TWITTER_SENTIMENT_ENABLED</h3>
              <p className="text-sm text-gray-600">Enable/disable sentiment analysis for tweets</p>
            </div>
            <Switch
              checked={twitterStatus?.flags?.TWITTER_SENTIMENT_ENABLED || false}
              onCheckedChange={(checked) => handleFlagChange('sentiment', checked)}
              disabled={actionLoading}
              data-testid="sentiment-toggle"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg opacity-50">
            <div>
              <h3 className="font-semibold">TWITTER_PRICE_ENABLED</h3>
              <p className="text-sm text-gray-600">🔒 Locked until Phase S5</p>
            </div>
            <Switch
              checked={false}
              disabled={true}
              data-testid="price-toggle"
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Quality */}
      {dataQuality && (
        <Card data-testid="data-quality-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Quality
            </CardTitle>
            <CardDescription>Tweet data completeness metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Status Distribution */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {dataQuality.statusCounts?.COMPLETE || 0}
                  </p>
                  <p className="text-sm text-green-700">Complete</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {dataQuality.statusCounts?.PARTIAL || 0}
                  </p>
                  <p className="text-sm text-yellow-700">Partial</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {dataQuality.statusCounts?.INVALID || 0}
                  </p>
                  <p className="text-sm text-red-700">Invalid</p>
                </div>
              </div>

              {/* Average Completeness */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Average Completeness</span>
                  <span className="font-mono font-bold">
                    {((dataQuality.avgCompleteness || 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      dataQuality.avgCompleteness >= 0.85 ? 'bg-green-500' :
                      dataQuality.avgCompleteness >= 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(dataQuality.avgCompleteness || 0) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Missing Fields */}
              {dataQuality.missingFieldsFrequency && Object.keys(dataQuality.missingFieldsFrequency).length > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Missing Fields Frequency</h4>
                  <div className="space-y-2">
                    {Object.entries(dataQuality.missingFieldsFrequency)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([field, count]) => (
                        <div key={field} className="flex justify-between text-sm">
                          <span className="font-mono">{field}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 flex-wrap">
            <a href="/admin/ml/overview" className="text-blue-600 hover:underline text-sm">
              ← Back to ML Overview
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
