/**
 * PHASE 4 - БЛОК 4.6: Shadow Run Explorer
 * Detailed view of shadow evaluation runs
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

export const ShadowRunExplorer = () => {
  const [summary, setSummary] = useState(null);
  const [selectedRun, setSelectedRun] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/ml/shadow/summary?window=7d`);
      setSummary(res.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch shadow summary:', error);
      setLoading(false);
    }
  };

  const fetchRunDetails = async (runId) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/ml/shadow/report/${runId}`);
      setSelectedRun(res.data.data);
    } catch (error) {
      console.error('Failed to fetch run details:', error);
    }
  };

  const runNewEvaluation = async () => {
    try {
      const res = await axios.post(`${BACKEND_URL}/api/ml/shadow/run`, {
        window: '7d',
        limit: 100,
      });
      alert(`Shadow run started: ${res.data.data.runId}`);
      setTimeout(fetchSummary, 2000);
    } catch (error) {
      console.error('Failed to start shadow run:', error);
      alert('Failed to start shadow run');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Shadow Runs</h2>
          <p className="mt-1 text-sm text-gray-500">ML evaluation history and drill-down</p>
        </div>
        <button
          onClick={runNewEvaluation}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          ▶ Run New Evaluation
        </button>
      </div>

      {/* Latest Run Summary */}
      {summary?.lastRun && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Latest Run</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500">Run ID</div>
              <div className="mt-1 text-sm font-mono text-gray-900 truncate">
                {summary.lastRun.runId}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Status</div>
              <div className={`mt-1 inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                summary.lastRun.status === 'DONE'
                  ? 'bg-green-100 text-green-800'
                  : summary.lastRun.status === 'RUNNING'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {summary.lastRun.status}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Samples</div>
              <div className="mt-1 text-2xl font-bold text-gray-900">
                {summary.sampleCount}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Gate Status</div>
              <div className={`mt-1 inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                summary.gateStatus === 'PASS'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {summary.gateStatus}
              </div>
            </div>
          </div>

          {summary.metrics && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded">
                <div className="text-sm font-medium text-gray-500">Accuracy</div>
                <div className="mt-1 text-2xl font-bold text-gray-900">
                  {(summary.metrics.accuracy * 100).toFixed(1)}%
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <div className="text-sm font-medium text-gray-500">ECE</div>
                <div className="mt-1 text-2xl font-bold text-gray-900">
                  {summary.metrics.ece.toFixed(3)}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <div className="text-sm font-medium text-gray-500">Agreement Rate</div>
                <div className="mt-1 text-2xl font-bold text-gray-900">
                  {(summary.metrics.agreementRate * 100).toFixed(1)}%
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <div className="text-sm font-medium text-gray-500">Flip Rate</div>
                <div className="mt-1 text-2xl font-bold text-gray-900">
                  {(summary.metrics.flipRate * 100).toFixed(1)}%
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <div className="text-sm font-medium text-gray-500">Precision</div>
                <div className="mt-1 text-2xl font-bold text-gray-900">
                  {(summary.metrics.precision * 100).toFixed(1)}%
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <div className="text-sm font-medium text-gray-500">F1 Score</div>
                <div className="mt-1 text-2xl font-bold text-gray-900">
                  {(summary.metrics.f1 * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          )}

          <div className="mt-4">
            <button
              onClick={() => fetchRunDetails(summary.lastRun.runId)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View Full Report →
            </button>
          </div>
        </div>
      )}

      {/* Detailed Run Report */}
      {selectedRun && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Run Details</h3>

          {/* Confusion Matrix */}
          {selectedRun.evaluation?.confusionMatrix && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Confusion Matrix (UP vs not-UP)</h4>
              <div className="grid grid-cols-2 gap-2 max-w-md">
                <div className="bg-green-50 p-3 rounded text-center">
                  <div className="text-xs text-gray-500">True Positive</div>
                  <div className="text-2xl font-bold text-green-700">
                    {selectedRun.evaluation.confusionMatrix.tp}
                  </div>
                </div>
                <div className="bg-red-50 p-3 rounded text-center">
                  <div className="text-xs text-gray-500">False Positive</div>
                  <div className="text-2xl font-bold text-red-700">
                    {selectedRun.evaluation.confusionMatrix.fp}
                  </div>
                </div>
                <div className="bg-red-50 p-3 rounded text-center">
                  <div className="text-xs text-gray-500">False Negative</div>
                  <div className="text-2xl font-bold text-red-700">
                    {selectedRun.evaluation.confusionMatrix.fn}
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded text-center">
                  <div className="text-xs text-gray-500">True Negative</div>
                  <div className="text-2xl font-bold text-green-700">
                    {selectedRun.evaluation.confusionMatrix.tn}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Coverage Strata */}
          {selectedRun.evaluation?.coverageStrata && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Coverage Strata Breakdown</h4>
              <div className="space-y-2">
                {selectedRun.evaluation.coverageStrata.map((strata) => (
                  <div key={strata.band} className="bg-gray-50 p-4 rounded">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-gray-900 capitalize">{strata.band} Coverage</div>
                      <div className="text-sm text-gray-500">{strata.sampleCount} samples</div>
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Accuracy</div>
                        <div className="font-medium">{(strata.accuracy * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Precision</div>
                        <div className="font-medium">{(strata.precision * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-gray-500">F1</div>
                        <div className="font-medium">{(strata.f1 * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-gray-500">ECE</div>
                        <div className="font-medium">{strata.ece?.toFixed(3) || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShadowRunExplorer;
