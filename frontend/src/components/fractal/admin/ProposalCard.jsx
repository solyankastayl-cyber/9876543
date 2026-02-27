/**
 * BLOCK 77.UI — Proposal Card
 * 
 * Displays latest policy proposal in Governance Tab.
 * Allows DRY_RUN → PROPOSE → APPLY flow.
 */

import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// ═══════════════════════════════════════════════════════════════
// VERDICT BADGE
// ═══════════════════════════════════════════════════════════════

function VerdictBadge({ verdict, risk }) {
  const verdictColors = {
    TUNE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    HOLD: 'bg-gray-100 text-gray-600 border-gray-200',
    ROLLBACK: 'bg-red-100 text-red-700 border-red-200',
  };
  
  const riskColors = {
    LOW: 'bg-emerald-50 text-emerald-600',
    MED: 'bg-amber-50 text-amber-600',
    HIGH: 'bg-red-50 text-red-600',
  };
  
  return (
    <div className="flex items-center gap-2">
      <span className={`px-3 py-1 rounded-lg text-sm font-semibold border ${verdictColors[verdict] || verdictColors.HOLD}`}>
        {verdict}
      </span>
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${riskColors[risk] || riskColors.MED}`}>
        Risk: {risk}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DELTA ROW
// ═══════════════════════════════════════════════════════════════

function DeltaRow({ delta }) {
  const categoryColors = {
    TIER_WEIGHT: 'bg-blue-100 text-blue-700',
    DIVERGENCE_PENALTY: 'bg-purple-100 text-purple-700',
    PHASE_MULTIPLIER: 'bg-emerald-100 text-emerald-700',
    THRESHOLD: 'bg-amber-100 text-amber-700',
  };
  
  const change = delta.to - delta.from;
  const changeStr = change >= 0 ? `+${(change * 100).toFixed(1)}` : `${(change * 100).toFixed(1)}`;
  
  return (
    <div className="py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${categoryColors[delta.category] || 'bg-gray-100 text-gray-600'}`}>
            {delta.category.replace(/_/g, ' ')}
          </span>
          <span className="text-sm font-medium text-gray-800">{delta.path}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">{(delta.from * 100).toFixed(1)}%</span>
          <span className="text-gray-400">→</span>
          <span className="font-medium text-gray-800">{(delta.to * 100).toFixed(1)}%</span>
          <span className={`font-medium ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            ({changeStr}pp)
          </span>
        </div>
      </div>
      <div className="text-xs text-gray-500">{delta.reason}</div>
      <div className="mt-1 flex items-center gap-1">
        <span className="text-[10px] text-gray-400">Confidence:</span>
        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 rounded-full" 
            style={{ width: `${delta.confidence * 100}%` }}
          />
        </div>
        <span className="text-[10px] text-gray-500">{(delta.confidence * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// GUARDRAILS STATUS
// ═══════════════════════════════════════════════════════════════

function GuardrailsStatus({ guardrails }) {
  if (!guardrails) return null;
  
  const { checks, eligible, reasons } = guardrails;
  
  return (
    <div className={`p-3 rounded-lg ${eligible ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-lg ${eligible ? '' : ''}`}>{eligible ? '✅' : '❌'}</span>
        <span className={`font-semibold ${eligible ? 'text-emerald-700' : 'text-red-700'}`}>
          Guardrails {eligible ? 'PASSED' : 'FAILED'}
        </span>
      </div>
      
      {!eligible && reasons.length > 0 && (
        <ul className="text-xs text-red-600 space-y-1">
          {reasons.map((r, i) => (
            <li key={i}>• {r}</li>
          ))}
        </ul>
      )}
      
      {eligible && checks && (
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <span className={checks.minSamples?.pass ? 'text-emerald-600' : 'text-red-600'}>
              {checks.minSamples?.pass ? '✓' : '✗'}
            </span>
            <span className="text-gray-600">Samples: {checks.minSamples?.value}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={checks.crisisShare?.pass ? 'text-emerald-600' : 'text-red-600'}>
              {checks.crisisShare?.pass ? '✓' : '✗'}
            </span>
            <span className="text-gray-600">CRISIS: {((checks.crisisShare?.value || 0) * 100).toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={checks.calibrationError?.pass ? 'text-emerald-600' : 'text-red-600'}>
              {checks.calibrationError?.pass ? '✓' : '✗'}
            </span>
            <span className="text-gray-600">Cal Error: {((checks.calibrationError?.value || 0) * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SIMULATION STATUS
// ═══════════════════════════════════════════════════════════════

function SimulationStatus({ simulation }) {
  if (!simulation) return null;
  
  const { passed, method, notes, metrics } = simulation;
  
  return (
    <div className={`p-3 rounded-lg ${passed ? 'bg-blue-50 border border-blue-200' : 'bg-amber-50 border border-amber-200'}`}>
      <div className="flex items-center gap-2 mb-2">
        <span>{passed ? '🧪' : '⚠️'}</span>
        <span className={`font-semibold ${passed ? 'text-blue-700' : 'text-amber-700'}`}>
          {method} {passed ? 'PASSED' : 'FAILED'}
        </span>
      </div>
      
      {metrics && (
        <div className="grid grid-cols-2 gap-2 text-xs mb-2">
          <div className="text-gray-600">
            Sharpe: {metrics.baseSharpe?.toFixed(2)} → {metrics.candidateSharpe?.toFixed(2)}
          </div>
          <div className="text-gray-600">
            HitRate: {(metrics.baseHitRate * 100).toFixed(0)}% → {(metrics.candidateHitRate * 100).toFixed(0)}%
          </div>
        </div>
      )}
      
      {notes && notes.length > 0 && (
        <ul className="text-xs text-gray-600 space-y-0.5">
          {notes.map((n, i) => (
            <li key={i}>• {n}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function ProposalCard() {
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  
  const fetchProposal = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/fractal/v2.1/admin/governance/proposal/latest?symbol=BTC`);
      const data = await res.json();
      if (data.ok && data.proposal) {
        setProposal(data.proposal);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch proposal');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchProposal();
  }, [fetchProposal]);
  
  const handleDryRun = async () => {
    setActionLoading('dryrun');
    try {
      const res = await fetch(`${API_BASE}/api/fractal/v2.1/admin/governance/proposal/dry-run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: 'BTC', windowDays: 90 }),
      });
      const data = await res.json();
      if (data.ok && data.proposal) {
        setProposal(data.proposal);
      }
    } catch (err) {
      console.error('Dry-run error:', err);
    } finally {
      setActionLoading(null);
    }
  };
  
  const handlePropose = async () => {
    if (!proposal?.guardrails?.eligible) {
      alert('Cannot propose: guardrails not passed');
      return;
    }
    if (!proposal?.simulation?.passed) {
      alert('Cannot propose: simulation failed');
      return;
    }
    
    setActionLoading('propose');
    try {
      const res = await fetch(`${API_BASE}/api/fractal/v2.1/admin/governance/proposal/propose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: 'BTC', windowDays: 90 }),
      });
      const data = await res.json();
      if (data.ok && data.proposal) {
        setProposal(data.proposal);
        alert('Proposal saved for review');
      } else {
        alert(data.error || data.message || 'Failed to propose');
      }
    } catch (err) {
      console.error('Propose error:', err);
    } finally {
      setActionLoading(null);
    }
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-24 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-6">
        <div className="text-red-600 text-sm">Error: {error}</div>
        <button 
          onClick={fetchProposal}
          className="mt-2 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" data-testid="proposal-card">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧠</span>
            <span className="font-semibold text-gray-800">Policy Proposal</span>
            <span className="text-xs text-gray-400">BLOCK 77</span>
          </div>
          {proposal && (
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              proposal.status === 'PROPOSED' ? 'bg-blue-100 text-blue-700' :
              proposal.status === 'APPLIED' ? 'bg-emerald-100 text-emerald-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {proposal.status}
            </span>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Headline */}
        {proposal?.headline && (
          <div>
            <VerdictBadge verdict={proposal.headline.verdict} risk={proposal.headline.risk} />
            <p className="mt-2 text-sm text-gray-600">{proposal.headline.summary}</p>
            
            {/* Expected Impact */}
            {proposal.headline.expectedImpact && proposal.headline.verdict !== 'HOLD' && (
              <div className="mt-2 flex items-center gap-4 text-xs">
                <span className={proposal.headline.expectedImpact.sharpeDelta >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                  Sharpe: {proposal.headline.expectedImpact.sharpeDelta >= 0 ? '+' : ''}{proposal.headline.expectedImpact.sharpeDelta.toFixed(3)}
                </span>
                <span className={proposal.headline.expectedImpact.hitRateDelta >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                  HitRate: {proposal.headline.expectedImpact.hitRateDelta >= 0 ? '+' : ''}{(proposal.headline.expectedImpact.hitRateDelta * 100).toFixed(1)}pp
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* Deltas */}
        {proposal?.deltas?.length > 0 && (
          <div className="border border-gray-200 rounded-lg p-3">
            <div className="text-xs font-semibold text-gray-500 mb-2">PROPOSED CHANGES ({proposal.deltas.length})</div>
            {proposal.deltas.slice(0, 5).map((delta, i) => (
              <DeltaRow key={i} delta={delta} />
            ))}
            {proposal.deltas.length > 5 && (
              <div className="text-xs text-gray-400 mt-2">+{proposal.deltas.length - 5} more changes</div>
            )}
          </div>
        )}
        
        {/* Guardrails */}
        <GuardrailsStatus guardrails={proposal?.guardrails} />
        
        {/* Simulation */}
        <SimulationStatus simulation={proposal?.simulation} />
        
        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={handleDryRun}
            disabled={actionLoading}
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {actionLoading === 'dryrun' ? (
              <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>🔍</span>
            )}
            Dry Run
          </button>
          <button
            onClick={handlePropose}
            disabled={actionLoading || !proposal?.guardrails?.eligible || !proposal?.simulation?.passed}
            className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {actionLoading === 'propose' ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>📋</span>
            )}
            Propose
          </button>
        </div>
        
        {/* Meta */}
        <div className="text-[10px] text-gray-400 text-right">
          {proposal?.asof} • Window: {proposal?.windowDays}d • ID: {proposal?.id}
        </div>
      </div>
    </div>
  );
}

export default ProposalCard;
