/**
 * BLOCK 79 — Audit Trail Card
 * 
 * Shows history of policy applications and rollbacks.
 */

import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

export function AuditTrailCard() {
  const [applications, setApplications] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rollbackLoading, setRollbackLoading] = useState(null);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/fractal/v2.1/admin/policy/applications?limit=10`);
      const data = await res.json();
      
      if (data.ok) {
        setApplications(data.applications || []);
        setTotal(data.total || 0);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleRollback = async (applicationId) => {
    if (!window.confirm('Rollback this policy change? This will revert to the previous policy state.')) {
      return;
    }
    
    const reason = window.prompt('Enter reason for rollback:');
    if (!reason) return;
    
    setRollbackLoading(applicationId);
    try {
      const res = await fetch(`${API_BASE}/api/fractal/v2.1/admin/policy/rollback/${applicationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, actor: 'ADMIN' }),
      });
      const data = await res.json();
      
      if (data.ok) {
        alert(`Rolled back successfully!\nRestored hash: ${data.restoredHash}`);
        fetchApplications();
      } else {
        alert(`Rollback failed: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setRollbackLoading(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden" data-testid="audit-trail-card">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-800 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white">Audit Trail</h3>
          <p className="text-xs text-slate-400">{total} applications total</p>
        </div>
        <button
          onClick={fetchApplications}
          className="px-3 py-1 bg-slate-600 text-white text-sm rounded hover:bg-slate-500"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-50 text-red-600 text-sm">{error}</div>
      )}

      {/* Timeline */}
      <div className="p-4">
        {applications.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-4">
            No policy applications yet
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app, idx) => (
              <div 
                key={app.applicationId} 
                className={`relative pl-6 pb-3 ${idx < applications.length - 1 ? 'border-l-2 border-gray-200' : ''}`}
              >
                {/* Timeline dot */}
                <div className={`absolute left-[-5px] top-0 w-3 h-3 rounded-full ${
                  app.rollbackOf ? 'bg-amber-500' : 'bg-green-500'
                }`}></div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        app.rollbackOf ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {app.rollbackOf ? 'ROLLBACK' : 'APPLY'}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">{app.applicationId}</span>
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(app.appliedAt)}</span>
                  </div>
                  
                  <div className="text-xs space-y-1">
                    <div className="flex gap-2">
                      <span className="text-gray-500">Proposal:</span>
                      <span className="font-mono">{app.proposalId}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-gray-500">Hash:</span>
                      <span className="font-mono text-red-600">{app.previousPolicyHash}</span>
                      <span>→</span>
                      <span className="font-mono text-green-600">{app.newPolicyHash}</span>
                    </div>
                    {app.reason && (
                      <div className="flex gap-2">
                        <span className="text-gray-500">Reason:</span>
                        <span className="italic">{app.reason}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <span className="text-gray-500">By:</span>
                      <span>{app.appliedBy}</span>
                    </div>
                  </div>
                  
                  {!app.rollbackOf && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <button
                        onClick={() => handleRollback(app.applicationId)}
                        disabled={rollbackLoading === app.applicationId}
                        className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded hover:bg-amber-200"
                      >
                        {rollbackLoading === app.applicationId ? 'Rolling back...' : 'Rollback'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditTrailCard;
