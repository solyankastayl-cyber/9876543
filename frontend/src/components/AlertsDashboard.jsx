/**
 * PHASE 4 - БЛОК 4.6: Alerts Dashboard
 * Detailed view of ML alerts
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const SEVERITY_COLORS = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-300',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  LOW: 'bg-blue-100 text-blue-800 border-blue-300',
};

const TYPE_LABELS = {
  DRIFT: 'Drift',
  DEGRADATION: 'Degradation',
  ANOMALY: 'Anomaly',
  DATA_GAP: 'Data Gap',
};

export const AlertsDashboard = () => {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all'); // all | active | resolved
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, [filter]);

  const fetchAlerts = async () => {
    try {
      const params = {};
      if (filter === 'active') params.status = 'OPEN';
      if (filter === 'resolved') params.status = 'RESOLVED';

      const res = await axios.get(`${BACKEND_URL}/api/ml/alerts`, { params });
      setAlerts(res.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId) => {
    try {
      await axios.post(`${BACKEND_URL}/api/ml/alerts/${alertId}/ack`);
      fetchAlerts();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading alerts...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ML Alerts</h2>
          <p className="mt-1 text-sm text-gray-500">Internal monitoring alerts (passive observation)</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filter === 'active'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filter === 'resolved'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Resolved
          </button>
        </div>
      </div>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <p className="text-gray-500">No alerts found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert._id}
              className={`bg-white shadow rounded-lg p-6 border-l-4 ${
                SEVERITY_COLORS[alert.severity] || 'border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Alert Header */}
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs font-bold rounded ${
                      SEVERITY_COLORS[alert.severity] || 'bg-gray-100 text-gray-800'
                    }`}>
                      {alert.severity}
                    </span>
                    <span className="text-sm font-medium text-gray-600">
                      {TYPE_LABELS[alert.type] || alert.type}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      alert.status === 'OPEN'
                        ? 'bg-red-100 text-red-800'
                        : alert.status === 'ACKED'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {alert.status}
                    </span>
                  </div>

                  {/* Alert Message */}
                  <p className="mt-2 text-sm text-gray-900">{alert.message}</p>

                  {/* Alert Metrics */}
                  <div className="mt-3 flex items-center space-x-4 text-xs text-gray-600">
                    {alert.metrics && Object.entries(alert.metrics).map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium capitalize">{key}:</span>{' '}
                        {typeof value === 'number' 
                          ? (value < 1 ? (value * 100).toFixed(1) + '%' : value.toFixed(2))
                          : value}
                      </div>
                    ))}
                    {alert.threshold !== undefined && (
                      <div>
                        <span className="font-medium">Threshold:</span> {alert.threshold?.toFixed(3)}
                      </div>
                    )}
                  </div>

                  {/* Timestamps */}
                  <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
                    <div>
                      <span className="font-medium">First:</span>{' '}
                      {alert.firstSeenAt || alert.createdAt 
                        ? new Date(alert.firstSeenAt || alert.createdAt).toLocaleString() 
                        : 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Last:</span>{' '}
                      {alert.lastSeenAt || alert.updatedAt 
                        ? new Date(alert.lastSeenAt || alert.updatedAt).toLocaleString() 
                        : 'N/A'}
                    </div>
                    {alert.resolvedAt && (
                      <div className="text-green-600">
                        <span className="font-medium">Resolved:</span> {new Date(alert.resolvedAt).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Resolution Reason */}
                  {alert.resolutionReason && (
                    <div className="mt-2 text-sm text-green-700">
                      <span className="font-medium">Resolved:</span> {alert.resolutionReason}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {alert.status === 'OPEN' && (
                  <div>
                    <button
                      onClick={() => acknowledgeAlert(alert.alertId)}
                      className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-300 rounded hover:bg-blue-50"
                    >
                      Acknowledge
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertsDashboard;
