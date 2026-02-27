/**
 * BLOCK 75.UI.2 — Governance Tab (Institutional Grade)
 * 
 * Policy management with DRY_RUN / PROPOSE / APPLY
 * All changes require guardrails pass + manual confirmation
 * 
 * BLOCK 77 — Adaptive Weight Learning integration
 * BLOCK 78.5 — Governance Lock (LIVE-only APPLY) integration
 * BLOCK 79 — Proposal Persistence + Audit Trail
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ProposalCard } from './ProposalCard';
import { GovernanceLockCard } from './GovernanceLockCard';
import { ProposalQueueTable } from './ProposalQueueTable';
import { ProposalDetailModal } from './ProposalDetailModal';
import { AuditTrailCard } from './AuditTrailCard';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// ═══════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════

function PolicyWeightRow({ label, value, proposed, unit = '' }) {
  const changed = proposed != null && proposed !== value;
  const delta = proposed != null ? ((proposed - value) / value * 100).toFixed(1) : null;
  
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-mono ${changed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
          {typeof value === 'number' ? value.toFixed(3) : value}{unit}
        </span>
        {changed && (
          <>
            <span className="text-gray-400">→</span>
            <span className="text-sm font-mono text-blue-600">
              {proposed.toFixed(3)}{unit}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              delta > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}>
              {delta > 0 ? '+' : ''}{delta}%
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function GuardrailBadge({ label, pass }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
      pass ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
    }`}>
      <span className="text-lg">{pass ? '✅' : '❌'}</span>
      <span className={`text-sm font-medium ${pass ? 'text-emerald-700' : 'text-red-700'}`}>
        {label}
      </span>
    </div>
  );
}

function AuditLogRow({ entry }) {
  const actionColors = {
    'APPLY': 'bg-emerald-100 text-emerald-700',
    'PROPOSE': 'bg-blue-100 text-blue-700',
    'DRY_RUN': 'bg-gray-100 text-gray-700',
    'REJECT': 'bg-red-100 text-red-700'
  };
  
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        <span className={`px-2 py-0.5 text-xs font-medium rounded ${actionColors[entry.action] || actionColors['DRY_RUN']}`}>
          {entry.action}
        </span>
        <span className="text-sm text-gray-700">{entry.summary}</span>
      </div>
      <div className="text-xs text-gray-400">
        {new Date(entry.timestamp).toLocaleDateString()} • {entry.actor}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function GovernanceTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [showConfirm, setShowConfirm] = useState(null);
  const [selectedProposal, setSelectedProposal] = useState(null);
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/fractal/v2.1/admin/governance?symbol=BTC`);
      if (!response.ok) throw new Error('Failed to fetch governance data');
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleAction = async (action) => {
    setActionLoading(action);
    try {
      const response = await fetch(`${API_BASE}/api/fractal/v2.1/admin/governance/policy/${action}?symbol=BTC`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error(`Failed to ${action}`);
      
      await fetchData();
      setShowConfirm(null);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading governance data...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center p-6 bg-red-50 rounded-xl border border-red-200 max-w-md">
          <p className="text-red-600 font-medium mb-2">Error loading governance</p>
          <p className="text-red-500 text-sm">{error}</p>
          <button 
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  const { currentPolicy, proposedChanges, driftStats, guardrails, auditLog } = data || {};
  
  // Build diff map for highlighting
  const diffMap = {};
  if (proposedChanges?.diffs) {
    for (const diff of proposedChanges.diffs) {
      diffMap[diff.field] = diff.newValue;
    }
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6" data-testid="governance-tab">
      {/* Policy Snapshot */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Current Policy</h3>
            <p className="text-xs text-gray-500">{currentPolicy?.version || 'v2.1.0'}</p>
          </div>
          <span className="text-xs text-gray-400">
            Updated: {currentPolicy?.updatedAt ? new Date(currentPolicy.updatedAt).toLocaleDateString() : '—'}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
          {/* Tier Weights */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Tier Weights</h4>
            <div className="bg-gray-50 rounded-lg p-3">
              <PolicyWeightRow 
                label="STRUCTURE" 
                value={currentPolicy?.tierWeights?.STRUCTURE} 
                proposed={diffMap['tierWeights.STRUCTURE']}
              />
              <PolicyWeightRow 
                label="TACTICAL" 
                value={currentPolicy?.tierWeights?.TACTICAL}
                proposed={diffMap['tierWeights.TACTICAL']}
              />
              <PolicyWeightRow 
                label="TIMING" 
                value={currentPolicy?.tierWeights?.TIMING}
                proposed={diffMap['tierWeights.TIMING']}
              />
            </div>
          </div>
          
          {/* Divergence Penalties */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Divergence Penalties</h4>
            <div className="bg-gray-50 rounded-lg p-3">
              {['A', 'B', 'C', 'D', 'F'].map(grade => (
                <PolicyWeightRow 
                  key={grade}
                  label={`Grade ${grade}`} 
                  value={currentPolicy?.divergencePenalties?.[grade] || 0}
                  unit=""
                />
              ))}
            </div>
          </div>
          
          {/* Phase Multipliers */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Phase Grade Multipliers</h4>
            <div className="bg-gray-50 rounded-lg p-3">
              {['A', 'B', 'C', 'D', 'F'].map(grade => (
                <PolicyWeightRow 
                  key={grade}
                  label={`Grade ${grade}`} 
                  value={currentPolicy?.phaseGradeMultipliers?.[grade] || 1}
                  unit="×"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Proposed Changes */}
      {proposedChanges && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 overflow-hidden">
          <div className="px-4 py-3 bg-blue-100 border-b border-blue-200">
            <h3 className="font-semibold text-blue-900">Proposed Changes</h3>
            <p className="text-xs text-blue-700">
              {proposedChanges.version} • Proposed: {new Date(proposedChanges.proposedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {proposedChanges.diffs?.map((diff, i) => (
                <div key={i} className="flex items-center justify-between bg-white rounded px-3 py-2">
                  <span className="text-sm font-mono text-gray-700">{diff.field}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-gray-400">{diff.oldValue.toFixed(3)}</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-sm font-mono text-blue-600">{diff.newValue.toFixed(3)}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      diff.changePercent > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {diff.changePercent > 0 ? '+' : ''}{diff.changePercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Guardrails Status */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Guardrails Status</h3>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-3">
            <GuardrailBadge label="Min Samples" pass={guardrails?.minSamplesOk !== false} />
            <GuardrailBadge label="Drift ≤ 5%" pass={guardrails?.driftWithinLimit !== false} />
            <GuardrailBadge label="Not in Crisis" pass={guardrails?.notInCrisis !== false} />
          </div>
          
          {guardrails?.reasons?.length > 0 && (
            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="text-sm text-amber-700">
                <span className="font-medium">Blocking issues:</span>
                <ul className="mt-1 list-disc list-inside">
                  {guardrails.reasons.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Actions */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Actions</h3>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleAction('dry-run')}
              disabled={actionLoading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2"
            >
              {actionLoading === 'dry-run' && (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              )}
              🔍 Dry Run
            </button>
            
            <button
              onClick={() => handleAction('propose')}
              disabled={actionLoading}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 flex items-center gap-2"
            >
              {actionLoading === 'propose' && (
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              )}
              📝 Propose
            </button>
            
            <button
              onClick={() => setShowConfirm('apply')}
              disabled={actionLoading || !guardrails?.canApply}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              ✅ Apply
            </button>
          </div>
          
          {!guardrails?.canApply && (
            <p className="mt-2 text-xs text-gray-500">
              Apply is disabled: no pending proposal or guardrails not passed
            </p>
          )}
        </div>
      </div>
      
      {/* Audit Log */}
      {auditLog?.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Audit Log</h3>
          </div>
          <div className="p-4">
            {auditLog.slice(0, 10).map((entry, i) => (
              <AuditLogRow key={i} entry={entry} />
            ))}
          </div>
        </div>
      )}
      
      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Apply</h3>
            <p className="text-gray-600 mb-4">
              This will update the live policy configuration. This action is logged and auditable.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction('apply')}
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {actionLoading === 'apply' ? 'Applying...' : 'Confirm Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* BLOCK 77: Adaptive Weight Learning Proposal */}
      <div className="mt-6">
        <ProposalCard />
      </div>
      
      {/* BLOCK 78.5: Governance Lock (LIVE-only APPLY) */}
      <div className="mt-6">
        <GovernanceLockCard />
      </div>
      
      {/* BLOCK 79: Proposal Queue */}
      <div className="mt-6">
        <ProposalQueueTable 
          onViewProposal={setSelectedProposal}
          onRefresh={() => {}}
        />
      </div>
      
      {/* BLOCK 79: Audit Trail */}
      <div className="mt-6">
        <AuditTrailCard />
      </div>
      
      {/* BLOCK 79: Proposal Detail Modal */}
      {selectedProposal && (
        <ProposalDetailModal 
          proposal={selectedProposal}
          onClose={() => setSelectedProposal(null)}
        />
      )}
    </div>
  );
}

export default GovernanceTab;
