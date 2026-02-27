/**
 * Intelligence On-chain Validation Page
 * 
 * Validation layer for decisions (internal):
 * - Confirmation/contradiction detection
 * - On-chain signal verification
 * - Trust score validation
 * 
 * This is NOT the old On-chain UI (wallets/actors)
 * This is the validation layer for decision integrity
 */

import { useState, useEffect } from 'react';
import { 
  Link2, RefreshCw, Loader2, CheckCircle, XCircle, AlertTriangle,
  Shield, Activity, Clock, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api } from '@/api/client';

const VALIDATION_STATUS = {
  CONFIRMED: { label: 'Confirmed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  CONTRADICTED: { label: 'Contradicted', color: 'bg-red-100 text-red-700', icon: XCircle },
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  INSUFFICIENT: { label: 'Insufficient Data', color: 'bg-gray-100 text-gray-700', icon: AlertTriangle },
};

export default function OnchainValidationPage() {
  const [validations, setValidations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Mock validation data - in production this comes from validation service
      const mockValidations = [
        {
          asset: 'BTCUSDT',
          signal: 'BUY',
          signalSource: 'Exchange',
          status: 'CONFIRMED',
          onchainSignal: 'Accumulation detected',
          agreement: 0.78,
          checkedAt: new Date(Date.now() - 120000).toISOString(),
          details: [
            { metric: 'Whale Inflow', value: '+$12.4M', supports: true },
            { metric: 'Exchange Outflow', value: '+$8.2M', supports: true },
            { metric: 'Active Addresses', value: '+15%', supports: true },
          ],
        },
        {
          asset: 'ETHUSDT',
          signal: 'SELL',
          signalSource: 'Sentiment',
          status: 'CONTRADICTED',
          onchainSignal: 'No distribution pattern',
          agreement: 0.32,
          checkedAt: new Date(Date.now() - 300000).toISOString(),
          details: [
            { metric: 'Whale Activity', value: 'Neutral', supports: false },
            { metric: 'Exchange Flow', value: 'Balanced', supports: false },
            { metric: 'Smart Money', value: 'Accumulating', supports: false },
          ],
        },
        {
          asset: 'SOLUSDT',
          signal: 'AVOID',
          signalSource: 'Meta-Brain',
          status: 'PENDING',
          onchainSignal: 'Analyzing...',
          agreement: null,
          checkedAt: new Date().toISOString(),
          details: [],
        },
      ];

      setValidations(mockValidations);
      
      setStats({
        totalChecks: 156,
        confirmed: 89,
        contradicted: 34,
        pending: 12,
        avgAgreement: 0.67,
      });
    } catch (err) {
      console.error('Validation fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen" data-testid="onchain-validation-page">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Link2 className="w-6 h-6 text-blue-600" />
            On-chain Validation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Signal verification through on-chain data (internal layer)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Shield className="w-3 h-3 mr-1" /> Validation Layer
          </Badge>
          <button
            onClick={fetchData}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Shield className="w-5 h-5 text-blue-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-800">Internal Validation System</p>
          <p className="text-xs text-blue-600">
            This is NOT the On-chain explorer (wallets/actors). 
            This is the validation layer that checks signal integrity against on-chain evidence.
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total Checks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalChecks}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Confirmed</p>
              <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Contradicted</p>
              <p className="text-2xl font-bold text-red-600">{stats.contradicted}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Avg Agreement</p>
              <p className="text-2xl font-bold text-gray-900">{(stats.avgAgreement * 100).toFixed(0)}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Validations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Validations</CardTitle>
          <CardDescription>Signal checks against on-chain evidence</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {validations.map((v, idx) => {
              const statusConfig = VALIDATION_STATUS[v.status] || VALIDATION_STATUS.PENDING;
              const StatusIcon = statusConfig.icon;
              
              return (
                <div
                  key={idx}
                  className="p-4 bg-white border border-gray-200 rounded-xl"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant="outline"
                        className={
                          v.signal === 'BUY' ? 'bg-green-100 text-green-700' :
                          v.signal === 'SELL' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }
                      >
                        {v.signal}
                      </Badge>
                      <span className="font-semibold text-gray-900">{v.asset}</span>
                      <span className="text-xs text-gray-500">from {v.signalSource}</span>
                    </div>
                    <Badge variant="outline" className={statusConfig.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-1">On-chain Signal: {v.onchainSignal}</p>
                      {v.agreement !== null && (
                        <div className="flex items-center gap-2">
                          <Progress value={v.agreement * 100} className="h-2 flex-1" />
                          <span className="text-xs text-gray-500">{(v.agreement * 100).toFixed(0)}% agreement</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {v.details.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
                      {v.details.map((d, i) => (
                        <div key={i} className="text-center">
                          <p className="text-xs text-gray-500">{d.metric}</p>
                          <p className={`text-sm font-medium ${d.supports ? 'text-green-600' : 'text-red-600'}`}>
                            {d.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-400">
                      Checked: {new Date(v.checkedAt).toLocaleTimeString()}
                    </span>
                    <button className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                      View Details <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
