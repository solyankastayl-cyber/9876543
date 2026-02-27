/**
 * Labs Alerts Panel
 * 
 * Shows real-time alerts from Labs:
 * - Critical state notifications
 * - Warning badges
 * - Alert history
 */

import { useState, useEffect } from 'react';
import { 
  Bell, AlertTriangle, AlertOctagon, Info, CheckCircle, 
  X, RefreshCw, Loader2, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/api/client';

const SEVERITY_CONFIG = {
  EMERGENCY: { 
    color: 'bg-red-500 text-white', 
    bgColor: 'bg-red-50 border-red-200',
    icon: AlertOctagon,
    label: 'Emergency'
  },
  CRITICAL: { 
    color: 'bg-orange-500 text-white', 
    bgColor: 'bg-orange-50 border-orange-200',
    icon: AlertTriangle,
    label: 'Critical'
  },
  WARNING: { 
    color: 'bg-yellow-500 text-white', 
    bgColor: 'bg-yellow-50 border-yellow-200',
    icon: AlertTriangle,
    label: 'Warning'
  },
  INFO: { 
    color: 'bg-blue-500 text-white', 
    bgColor: 'bg-blue-50 border-blue-200',
    icon: Info,
    label: 'Info'
  },
};

export function LabsAlertsPanel({ symbol, compact = false }) {
  const [alerts, setAlerts] = useState([]);
  const [counts, setCounts] = useState({ EMERGENCY: 0, CRITICAL: 0, WARNING: 0, INFO: 0 });
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const fetchAlerts = async () => {
    try {
      // First check for new alerts
      await api.post(`/api/v10/exchange/labs/v3/alerts/check?symbol=${symbol}`);
      
      // Then get active alerts
      const res = await api.get(`/api/v10/exchange/labs/v3/alerts?symbol=${symbol}`);
      if (res.data?.ok) {
        setAlerts(res.data.alerts || []);
        setCounts(res.data.counts || { EMERGENCY: 0, CRITICAL: 0, WARNING: 0, INFO: 0 });
      }
    } catch (err) {
      console.error('Alerts fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [symbol]);

  const acknowledgeAlert = async (alertId) => {
    try {
      await api.post(`/api/v10/exchange/labs/v3/alerts/${alertId}/ack`);
      setAlerts(alerts.filter(a => a.id !== alertId));
    } catch (err) {
      console.error('Ack error:', err);
    }
  };

  const totalAlerts = counts.EMERGENCY + counts.CRITICAL + counts.WARNING + counts.INFO;
  const hasCritical = counts.EMERGENCY > 0 || counts.CRITICAL > 0;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading alerts...</span>
      </div>
    );
  }

  // Compact mode for header/navbar
  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setExpanded(!expanded)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
            hasCritical ? 'bg-red-100 text-red-700 animate-pulse' :
            totalAlerts > 0 ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-600'
          }`}
        >
          <Bell className="w-4 h-4" />
          {totalAlerts > 0 && (
            <span className="font-medium">{totalAlerts}</span>
          )}
        </button>

        {/* Dropdown */}
        {expanded && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Labs Alerts</span>
                <button 
                  onClick={() => setExpanded(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {alerts.length > 0 ? (
                alerts.slice(0, 5).map((alert) => {
                  const config = SEVERITY_CONFIG[alert.severity];
                  const Icon = config.icon;
                  return (
                    <div 
                      key={alert.id}
                      className={`p-3 border-b border-gray-50 ${config.bgColor}`}
                    >
                      <div className="flex items-start gap-2">
                        <Icon className={`w-4 h-4 mt-0.5 ${
                          alert.severity === 'EMERGENCY' ? 'text-red-600' :
                          alert.severity === 'CRITICAL' ? 'text-orange-600' :
                          alert.severity === 'WARNING' ? 'text-yellow-600' :
                          'text-blue-600'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900">{alert.title}</p>
                          <p className="text-xs text-gray-600 truncate">{alert.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{alert.labName}</Badge>
                            <span className="text-xs text-gray-400">
                              {new Date(alert.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="p-1 hover:bg-white/50 rounded"
                          title="Acknowledge"
                        >
                          <CheckCircle className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                  <p className="text-sm">No active alerts</p>
                </div>
              )}
            </div>

            {alerts.length > 5 && (
              <div className="p-2 text-center border-t border-gray-100">
                <a 
                  href={`/exchange/labs?alerts=true&symbol=${symbol}`}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  View all {alerts.length} alerts →
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full panel mode
  return (
    <Card data-testid="labs-alerts-panel">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className={`w-4 h-4 ${hasCritical ? 'text-red-600 animate-pulse' : 'text-gray-600'}`} />
            Labs Alerts
          </CardTitle>
          <div className="flex items-center gap-2">
            {counts.EMERGENCY > 0 && (
              <Badge className="bg-red-500">{counts.EMERGENCY}</Badge>
            )}
            {counts.CRITICAL > 0 && (
              <Badge className="bg-orange-500">{counts.CRITICAL}</Badge>
            )}
            {counts.WARNING > 0 && (
              <Badge className="bg-yellow-500">{counts.WARNING}</Badge>
            )}
            <button
              onClick={fetchAlerts}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length > 0 ? (
          <div className="space-y-2">
            {alerts.map((alert) => {
              const config = SEVERITY_CONFIG[alert.severity];
              const Icon = config.icon;
              return (
                <div 
                  key={alert.id}
                  className={`p-3 rounded-lg border ${config.bgColor}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded ${config.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{alert.title}</span>
                        <Badge variant="outline" className="text-xs">{alert.labName}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{alert.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>State: {alert.labState}</span>
                        <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                      title="Acknowledge"
                    >
                      <CheckCircle className="w-5 h-5 text-gray-400 hover:text-green-500" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
            <p className="text-gray-500 font-medium">All Clear</p>
            <p className="text-sm text-gray-400">No active alerts for {symbol}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact alert indicator for headers
export function AlertIndicator({ symbol }) {
  const [counts, setCounts] = useState({ EMERGENCY: 0, CRITICAL: 0, WARNING: 0, INFO: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await api.get(`/api/v10/exchange/labs/v3/alerts?symbol=${symbol}`);
        if (res.data?.ok) {
          setCounts(res.data.counts || { EMERGENCY: 0, CRITICAL: 0, WARNING: 0, INFO: 0 });
        }
      } catch (err) {}
    };
    
    fetchCounts();
    const interval = setInterval(fetchCounts, 60000);
    return () => clearInterval(interval);
  }, [symbol]);

  const total = counts.EMERGENCY + counts.CRITICAL + counts.WARNING + counts.INFO;
  const hasCritical = counts.EMERGENCY > 0 || counts.CRITICAL > 0;

  if (total === 0) return null;

  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
      hasCritical ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
    }`}>
      <AlertTriangle className="w-3 h-3" />
      <span>{total}</span>
    </div>
  );
}
