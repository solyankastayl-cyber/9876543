/**
 * BLOCK 79 — Proposal Queue Table
 * 
 * Displays list of proposals with actions: View, Apply, Reject
 */

import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// ═══════════════════════════════════════════════════════════════
// BADGES
// ═══════════════════════════════════════════════════════════════

function StatusBadge({ status }) {
  const colors = {
    DRAFT: 'bg-gray-100 text-gray-700',
    PROPOSED: 'bg-blue-100 text-blue-700',
    APPLIED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
  };
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.DRAFT}`}>
      {status}
    </span>
  );
}

function VerdictBadge({ verdict }) {
  const colors = {
    HOLD: 'bg-amber-100 text-amber-700',
    TUNE: 'bg-emerald-100 text-emerald-700',
    ROLLBACK: 'bg-red-100 text-red-700',
  };
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[verdict] || colors.HOLD}`}>
      {verdict}
    </span>
  );
}

function SourceBadge({ source }) {
  const colors = {
    LIVE: 'bg-green-100 text-green-700 border border-green-300',
    V2020: 'bg-purple-100 text-purple-700',
    V2014: 'bg-orange-100 text-orange-700',
  };
  
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[source] || ''}`}>
      {source}
    </span>
  );
}

function GuardrailsIndicator({ guardrails }) {
  const allOk = guardrails?.eligible;
  
  return (
    <div className="flex items-center gap-1">
      <span className={allOk ? 'text-green-600' : 'text-red-600'}>
        {allOk ? '✓' : '✗'}
      </span>
      <span className="text-xs text-gray-500">
        {allOk ? 'Eligible' : 'Blocked'}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function ProposalQueueTable({ onViewProposal, onRefresh }) {
  const [proposals, setProposals] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (sourceFilter) params.append('source', sourceFilter);
      params.append('limit', '20');
      
      const res = await fetch(`${API_BASE}/api/fractal/v2.1/admin/proposal/list?${params}`);
      const data = await res.json();
      
      if (data.ok) {
        setProposals(data.proposals || []);
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
  }, [statusFilter, sourceFilter]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const handleApply = async (proposalId) => {
    if (!window.confirm('Apply this proposal? This will change the active policy.')) {
      return;
    }
    
    const reason = window.prompt('Enter reason for applying:');
    if (!reason) return;
    
    setActionLoading(proposalId);
    try {
      const res = await fetch(`${API_BASE}/api/fractal/v2.1/admin/proposal/apply/${proposalId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, actor: 'ADMIN' }),
      });
      const data = await res.json();
      
      if (data.ok) {
        alert(`Applied successfully!\nNew hash: ${data.newHash}`);
        fetchProposals();
        onRefresh?.();
      } else {
        alert(`Apply failed: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (proposalId) => {
    const reason = window.prompt('Enter reason for rejection:');
    if (!reason) return;
    
    setActionLoading(proposalId);
    try {
      const res = await fetch(`${API_BASE}/api/fractal/v2.1/admin/proposal/reject/${proposalId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, actor: 'ADMIN' }),
      });
      const data = await res.json();
      
      if (data.ok) {
        fetchProposals();
      } else {
        alert(`Reject failed: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
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

  if (loading && proposals.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-100 rounded"></div>
          <div className="h-12 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden" data-testid="proposal-queue-table">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-900 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white">BLOCK 79 — Proposal Queue</h3>
          <p className="text-xs text-slate-400">{total} proposals total</p>
        </div>
        <button
          onClick={fetchProposals}
          className="px-3 py-1 bg-slate-700 text-white text-sm rounded hover:bg-slate-600"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="px-4 py-2 bg-gray-50 border-b flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border rounded px-2 py-1"
        >
          <option value="">All Status</option>
          <option value="PROPOSED">Proposed</option>
          <option value="APPLIED">Applied</option>
          <option value="REJECTED">Rejected</option>
        </select>
        
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="text-sm border rounded px-2 py-1"
        >
          <option value="">All Sources</option>
          <option value="LIVE">LIVE</option>
          <option value="V2020">V2020</option>
          <option value="V2014">V2014</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Verdict</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Simulation</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Guardrails</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {proposals.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                  No proposals found
                </td>
              </tr>
            ) : (
              proposals.map((p) => (
                <tr key={p.proposalId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{p.proposalId}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{formatDate(p.createdAt)}</td>
                  <td className="px-4 py-3"><SourceBadge source={p.source} /></td>
                  <td className="px-4 py-3"><VerdictBadge verdict={p.verdict} /></td>
                  <td className="px-4 py-3">
                    <div className="text-xs">
                      <span className={p.simulation?.sharpeDelta >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ΔSharpe: {(p.simulation?.sharpeDelta || 0).toFixed(3)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><GuardrailsIndicator guardrails={p.guardrails} /></td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => onViewProposal?.(p)}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        View
                      </button>
                      {p.status === 'PROPOSED' && (
                        <>
                          <button
                            onClick={() => handleApply(p.proposalId)}
                            disabled={actionLoading === p.proposalId || p.source !== 'LIVE'}
                            className={`px-2 py-1 text-xs rounded ${
                              p.source === 'LIVE' && p.guardrails?.eligible
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                            title={p.source !== 'LIVE' ? 'LIVE source required' : ''}
                          >
                            {actionLoading === p.proposalId ? '...' : 'Apply'}
                          </button>
                          <button
                            onClick={() => handleReject(p.proposalId)}
                            disabled={actionLoading === p.proposalId}
                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProposalQueueTable;
