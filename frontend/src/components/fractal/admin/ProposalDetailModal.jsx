/**
 * BLOCK 79 — Proposal Detail Modal
 * 
 * Shows full proposal details: deltas, simulation, guardrails
 */

import React from 'react';

// ═══════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════

function DeltaTable({ title, deltas }) {
  if (!deltas || Object.keys(deltas).length === 0) {
    return null;
  }
  
  return (
    <div className="mb-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
      <div className="bg-gray-50 rounded p-2">
        {Object.entries(deltas).map(([key, value]) => (
          <div key={key} className="flex justify-between text-xs py-1">
            <span className="text-gray-600">{key}</span>
            <span className={Number(value) >= 0 ? 'text-green-600' : 'text-red-600'}>
              {Number(value) >= 0 ? '+' : ''}{Number(value).toFixed(4)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SimulationCard({ simulation }) {
  if (!simulation) return null;
  
  return (
    <div className="bg-slate-50 rounded-lg p-3 mb-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Simulation Results</h4>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex justify-between text-xs">
          <span className="text-gray-600">ΔSharpe:</span>
          <span className={simulation.sharpeDelta >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
            {simulation.sharpeDelta >= 0 ? '+' : ''}{simulation.sharpeDelta?.toFixed(3) || '0.000'}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-600">ΔHitRate:</span>
          <span className={simulation.hitRateDelta >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
            {simulation.hitRateDelta >= 0 ? '+' : ''}{(simulation.hitRateDelta * 100)?.toFixed(2) || '0.00'}pp
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-600">ΔMaxDD:</span>
          <span className={simulation.maxDdDelta <= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
            {simulation.maxDdDelta >= 0 ? '+' : ''}{(simulation.maxDdDelta * 100)?.toFixed(2) || '0.00'}pp
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-600">ΔEquity:</span>
          <span className={simulation.equityDelta >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
            {simulation.equityDelta >= 0 ? '+' : ''}{(simulation.equityDelta * 100)?.toFixed(2) || '0.00'}%
          </span>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-gray-200">
        <span className={`text-xs font-medium ${simulation.passed ? 'text-green-600' : 'text-red-600'}`}>
          {simulation.passed ? '✓ Simulation PASSED' : '✗ Simulation FAILED'}
        </span>
      </div>
    </div>
  );
}

function GuardrailsCard({ guardrails }) {
  if (!guardrails) return null;
  
  const checks = [
    { key: 'liveSamplesOk', label: 'LIVE Samples ≥ 30' },
    { key: 'driftOk', label: 'Drift < CRITICAL' },
    { key: 'crisisShareOk', label: 'Crisis Share < 20%' },
    { key: 'calibrationOk', label: 'Calibration OK' },
  ];
  
  return (
    <div className="bg-slate-50 rounded-lg p-3 mb-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Guardrails Status</h4>
      <div className="space-y-1">
        {checks.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2 text-xs">
            <span className={guardrails[key] ? 'text-green-600' : 'text-red-600'}>
              {guardrails[key] ? '✓' : '✗'}
            </span>
            <span className={guardrails[key] ? 'text-gray-700' : 'text-red-700'}>
              {label}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-gray-200">
        <span className={`text-xs font-medium ${guardrails.eligible ? 'text-green-600' : 'text-red-600'}`}>
          {guardrails.eligible ? '✓ ELIGIBLE for APPLY' : '✗ NOT ELIGIBLE'}
        </span>
      </div>
      {guardrails.reasons?.length > 0 && (
        <div className="mt-2 text-xs text-red-600">
          {guardrails.reasons.map((r, i) => (
            <div key={i}>• {r}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function ProposalDetailModal({ proposal, onClose }) {
  if (!proposal) return null;
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="proposal-detail-modal">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-900 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white">Proposal Detail</h3>
            <p className="text-xs text-slate-400 font-mono">{proposal.proposalId}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 text-xl"
          >
            ×
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Meta Info */}
          <div className="grid grid-cols-3 gap-4 mb-4 text-xs">
            <div>
              <span className="text-gray-500">Status:</span>
              <span className={`ml-2 px-2 py-0.5 rounded-full font-medium ${
                proposal.status === 'APPLIED' ? 'bg-green-100 text-green-700' :
                proposal.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {proposal.status}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Verdict:</span>
              <span className={`ml-2 px-2 py-0.5 rounded-full font-medium ${
                proposal.verdict === 'TUNE' ? 'bg-emerald-100 text-emerald-700' :
                proposal.verdict === 'ROLLBACK' ? 'bg-red-100 text-red-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {proposal.verdict}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Source:</span>
              <span className={`ml-2 px-2 py-0.5 rounded font-medium ${
                proposal.source === 'LIVE' ? 'bg-green-100 text-green-700 border border-green-300' :
                'bg-purple-100 text-purple-700'
              }`}>
                {proposal.source}
              </span>
            </div>
          </div>
          
          {/* Scope */}
          <div className="bg-gray-50 rounded p-2 mb-4 text-xs">
            <span className="text-gray-500">Scope:</span>
            <span className="ml-2 font-mono">
              {proposal.scope?.symbol} / {proposal.scope?.preset} / {proposal.scope?.role} / {proposal.scope?.focus}
            </span>
          </div>
          
          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
            <div>
              <span className="text-gray-500">Created:</span>
              <span className="ml-2">{formatDate(proposal.createdAt)}</span>
            </div>
            {proposal.appliedAt && (
              <div>
                <span className="text-gray-500">Applied:</span>
                <span className="ml-2">{formatDate(proposal.appliedAt)}</span>
              </div>
            )}
          </div>
          
          {/* Hashes */}
          {(proposal.previousPolicyHash || proposal.appliedPolicyHash) && (
            <div className="bg-slate-100 rounded p-2 mb-4 text-xs font-mono">
              {proposal.previousPolicyHash && (
                <div>
                  <span className="text-gray-500">Previous Hash:</span>
                  <span className="ml-2">{proposal.previousPolicyHash}</span>
                </div>
              )}
              {proposal.appliedPolicyHash && (
                <div>
                  <span className="text-gray-500">Applied Hash:</span>
                  <span className="ml-2 text-green-600">{proposal.appliedPolicyHash}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Simulation */}
          <SimulationCard simulation={proposal.simulation} />
          
          {/* Guardrails */}
          <GuardrailsCard guardrails={proposal.guardrails} />
          
          {/* Deltas */}
          <h4 className="text-sm font-medium text-gray-700 mb-2">Policy Deltas</h4>
          <DeltaTable title="Tier Weights" deltas={proposal.deltas?.tierWeights} />
          <DeltaTable title="Divergence Penalties" deltas={proposal.deltas?.divergencePenalties} />
          <DeltaTable title="Phase Multipliers" deltas={proposal.deltas?.phaseMultipliers} />
          <DeltaTable title="Thresholds" deltas={proposal.deltas?.thresholds} />
          
          {!proposal.deltas?.tierWeights && !proposal.deltas?.divergencePenalties && 
           !proposal.deltas?.phaseMultipliers && !proposal.deltas?.thresholds && (
            <div className="text-xs text-gray-500 italic">No deltas proposed</div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProposalDetailModal;
