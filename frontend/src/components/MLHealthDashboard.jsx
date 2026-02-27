/**
 * PHASE 4 - БЛОК 4.6: ML Health Dashboard
 * Settings → Intelligence → ML Health
 * 
 * Read-only observation dashboard
 * NO ML activation controls
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

export const MLHealthDashboard = () => {
  const [readiness, setReadiness] = useState(null);
  const [alertsSummary, setAlertsSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [readinessRes, alertsRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/ml/shadow/readiness`),
        axios.get(`${BACKEND_URL}/api/ml/alerts/summary`),
      ]);

      setReadiness(readinessRes.data.data);
      setAlertsSummary(alertsRes.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch ML health data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading ML Health...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hard Warning Banner */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <span className="font-bold">SIMULATION MODE</span> — ML results are not production-validated.
              ML never affects Engine decisions or rankings.
            </p>
          </div>
        </div>
      </div>

      {/* ML Status Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">ML Health Status</h2>
            <p className="mt-1 text-sm text-gray-500">Shadow ML observation and readiness monitoring</p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-500">Mode:</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                SIMULATION
              </span>
            </div>
            <div className="mt-2 flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-500">Phase 5 Ready:</span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                readiness?.readyForPhase5
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {readiness?.readyForPhase5 ? '✓ READY' : '✗ BLOCKED'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Readiness Gates Panel */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Readiness Gates (Phase 5 Blockers)</h3>
        <div className="space-y-3">
          {readiness?.gates?.map((gate) => (
            <div
              key={gate.gate}
              className={`border-l-4 p-4 rounded ${
                gate.status === 'PASS'
                  ? 'border-green-500 bg-green-50'
                  : 'border-red-500 bg-red-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className={`text-2xl ${
                      gate.status === 'PASS' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {gate.status === 'PASS' ? '✓' : '✗'}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{gate.gate}</h4>
                      {gate.blockingReason && (
                        <p className="text-sm text-red-700 mt-1">{gate.blockingReason}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {gate.metrics && (
                    <div className="text-xs text-gray-600 space-y-1">
                      {Object.entries(gate.metrics).map(([key, value]) => (
                        <div key={key}>
                          <span className="font-medium">{key}:</span>{' '}
                          {typeof value === 'number' ? value.toFixed(2) : value}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts Summary */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Active Alerts</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-gray-500">Total</div>
            <div className="mt-1 text-3xl font-bold text-gray-900">
              {alertsSummary?.total || 0}
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-red-600">Critical</div>
            <div className="mt-1 text-3xl font-bold text-red-900">
              {alertsSummary?.bySeverity?.CRITICAL || 0}
            </div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-orange-600">High</div>
            <div className="mt-1 text-3xl font-bold text-orange-900">
              {alertsSummary?.bySeverity?.HIGH || 0}
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-green-600">Open</div>
            <div className="mt-1 text-3xl font-bold text-green-900">
              {alertsSummary?.byStatus?.open || 0}
            </div>
          </div>
        </div>

        {alertsSummary?.byStatus?.open > 0 && (
          <div className="mt-4">
            <button
              onClick={() => window.location.href = '#alerts'}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View All Alerts →
            </button>
          </div>
        )}
      </div>

      {/* Hard Disclaimer */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h4 className="text-sm font-bold text-gray-900 mb-2">⚠️ Important Limitations</h4>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li>ML predictions are for observation only</li>
          <li>NO influence on Engine decisions</li>
          <li>NO influence on rankings or signals</li>
          <li>Phase 5 auto-calibration requires ALL gates to PASS</li>
          <li>Manual override is NOT possible by design</li>
        </ul>
      </div>
    </div>
  );
};

export default MLHealthDashboard;
