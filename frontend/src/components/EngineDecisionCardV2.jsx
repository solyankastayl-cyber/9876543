/**
 * Engine Decision Card V2 - PHASE 4.1
 * 
 * UI = V2 Truth, без V1 артефактов
 * Source: GET /api/engine/v2/decide
 * 
 * Blocks:
 * - A1: Header (Decision + Status + Disclaimer)
 * - A2: Decision Summary
 * - A3: Scores Block (Evidence, Coverage, Risk)
 * - A4: Gating Reasons (CRITICAL)
 * - A5: Attribution Preview
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, Minus, Shield, AlertTriangle,
  CheckCircle, XCircle, ChevronRight, Loader2, RefreshCw,
  Users, Database, Eye
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { api } from '../api/client';

// ============ COLORS ============
const DECISION_COLORS = {
  BUY: '#2ECC71',
  SELL: '#E74C3C',
  NEUTRAL: '#95A5A6',
};

const STATUS_COLORS = {
  OPERATIONAL: '#2ECC71',
  NORMAL_OPERATION: '#2ECC71',
  PROTECTION: '#F39C12',
  PROTECTION_MODE: '#F39C12',
  DATA_COLLECTION: '#7F8C8D',
  DATA_COLLECTION_MODE: '#7F8C8D',
};

// ============ SCORE BAR COMPONENT ============
function ScoreBar({ value, label, tooltip, colorLogic }) {
  const getColor = () => {
    if (colorLogic === 'evidence') {
      if (value >= 70) return '#2ECC71';
      if (value >= 40) return '#F39C12';
      return '#E74C3C';
    }
    if (colorLogic === 'coverage') {
      if (value >= 60) return '#2ECC71';
      if (value >= 40) return '#F39C12';
      return '#E74C3C';
    }
    if (colorLogic === 'risk') {
      if (value >= 70) return '#E74C3C';
      if (value >= 40) return '#F39C12';
      return '#2ECC71';
    }
    return '#95A5A6';
  };

  const color = getColor();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help">
            <div className="text-xs text-gray-500 mb-1">{label}</div>
            <div className="text-2xl font-bold text-gray-900 mb-2">{value}</div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, value)}%`, backgroundColor: color }}
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-3 bg-white border-gray-200">
          <p className="text-sm text-gray-800">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============ GATING REASON ITEM ============
function GatingReasonItem({ reason, type }) {
  const icons = {
    passed: <CheckCircle className="w-4 h-4 text-green-500" />,
    blocked: <XCircle className="w-4 h-4 text-red-500" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-500" />,
  };

  const colors = {
    passed: 'text-green-400',
    blocked: 'text-red-400',
    warning: 'text-amber-400',
  };

  return (
    <div className="flex items-center gap-2 py-1">
      {icons[type]}
      <span className={`text-sm ${colors[type]}`}>{reason}</span>
    </div>
  );
}

// ============ MAIN COMPONENT ============
export default function EngineDecisionCardV2({ 
  actor = null, 
  token = null, 
  window = '24h',
  onRefresh 
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchDecision = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query params
      const params = new URLSearchParams({ window });
      if (actor) params.append('actor', actor);
      if (token) params.append('token', token);
      
      const response = await api.get(`/api/engine/v2/decide?${params}`);
      
      if (response.data.ok) {
        setData(response.data.data);
      } else {
        setError(response.data.error || 'Failed to fetch decision');
      }
    } catch (err) {
      setError('Failed to connect to engine');
      console.error('Engine V2 error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecision();
  }, [actor, token, window]);

  const handleRefresh = () => {
    fetchDecision();
    if (onRefresh) onRefresh();
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-[720px] mx-auto p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-[720px] mx-auto p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 text-red-500">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
        <button 
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { decision, scores, gating, notes, attribution, health } = data;
  const engineStatus = health?.engineStatus || 'DATA_COLLECTION_MODE';
  
  // Determine decision icon
  const DecisionIcon = decision === 'BUY' ? TrendingUp : 
                       decision === 'SELL' ? TrendingDown : Minus;

  // Build gating reasons with types
  const buildGatingReasons = () => {
    const reasons = [];
    
    // Check coverage gate
    if (scores.coverage >= 60) {
      reasons.push({ text: 'Coverage ≥ 60 (passed)', type: 'passed' });
    } else {
      reasons.push({ text: `Coverage ${scores.coverage}% < 60 (blocked)`, type: 'blocked' });
    }
    
    // Check risk gate
    if (scores.risk >= 80) {
      reasons.push({ text: `Risk ${scores.risk} ≥ 80 (blocked)`, type: 'blocked' });
    } else if (scores.risk >= 60) {
      reasons.push({ text: `Risk ${scores.risk} in warning zone`, type: 'warning' });
    } else {
      reasons.push({ text: `Risk ${scores.risk} acceptable`, type: 'passed' });
    }
    
    // Check evidence gate
    if (scores.evidence >= 60) {
      reasons.push({ text: `Evidence ${scores.evidence} sufficient`, type: 'passed' });
    } else if (scores.evidence >= 40) {
      reasons.push({ text: `Evidence ${scores.evidence} in soft zone`, type: 'warning' });
    } else {
      reasons.push({ text: `Evidence ${scores.evidence} < 40 (blocked)`, type: 'blocked' });
    }
    
    // Add API gating reasons
    if (gating?.reasons) {
      gating.reasons.forEach(r => {
        if (!reasons.find(x => x.text.includes(r))) {
          reasons.push({ 
            text: r.replace(/_/g, ' '), 
            type: gating.blocked ? 'blocked' : 'warning' 
          });
        }
      });
    }
    
    return reasons;
  };

  // Build decision summary
  const buildSummary = () => {
    if (notes?.summary) return notes.summary;
    
    const parts = [];
    if (decision === 'BUY') {
      parts.push('BUY allowed');
      if (scores.evidence >= 60) parts.push('strong evidence');
      if (scores.risk <= 40) parts.push('acceptable risk');
      if (scores.coverage >= 60) parts.push('sufficient coverage');
    } else if (decision === 'SELL') {
      parts.push('SELL recommended');
      if (scores.risk >= 60) parts.push('elevated risk');
    } else {
      parts.push('NEUTRAL');
      if (gating?.blocked) parts.push('decision gated');
      if (scores.coverage < 60) parts.push('insufficient coverage');
    }
    
    return parts.join(': ') + '.';
  };

  const gatingReasons = buildGatingReasons();
  const summaryText = buildSummary();

  return (
    <TooltipProvider>
      <div 
        className="max-w-[720px] mx-auto p-6 bg-white rounded-xl border border-gray-200 shadow-sm"
        data-testid="engine-decision-card-v2"
      >
        {/* ===== A1: HEADER ===== */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {/* Decision Badge */}
            <div 
              className="text-[28px] font-bold uppercase tracking-wide"
              style={{ color: DECISION_COLORS[decision] }}
              data-testid="decision-badge"
            >
              {decision}
            </div>
            
            {/* Decision Icon */}
            <DecisionIcon 
              className="w-8 h-8" 
              style={{ color: DECISION_COLORS[decision] }}
            />
          </div>
          
          {/* Status Badge */}
          <div 
            className="px-2 py-1 rounded-md text-[11px] font-medium uppercase"
            style={{ 
              backgroundColor: `${STATUS_COLORS[engineStatus]}20`,
              color: STATUS_COLORS[engineStatus],
              border: `1px solid ${STATUS_COLORS[engineStatus]}40`
            }}
            data-testid="engine-status-badge"
          >
            {engineStatus.replace(/_/g, ' ')}
          </div>
        </div>
        
        {/* Disclaimer */}
        <p className="text-[11px] text-gray-500 mb-6">
          System decision based on rule engine. Not financial advice.
        </p>

        {/* ===== A2: DECISION SUMMARY ===== */}
        <div className="mb-6">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Decision Summary</div>
          <p className="text-sm text-gray-700 leading-relaxed" data-testid="decision-summary">
            {summaryText}
          </p>
        </div>

        {/* ===== A3: SCORES BLOCK ===== */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <ScoreBar 
            value={scores.evidence} 
            label="Evidence"
            tooltip="Aggregated signal strength after penalties and confirmations."
            colorLogic="evidence"
          />
          <ScoreBar 
            value={scores.coverage} 
            label="Coverage"
            tooltip="How much of the market is observable by the system."
            colorLogic="coverage"
          />
          <ScoreBar 
            value={scores.risk} 
            label="Risk"
            tooltip="Estimated downside and instability risk."
            colorLogic="risk"
          />
        </div>

        {/* ===== A4: GATING REASONS (CRITICAL) ===== */}
        <div className="mb-6">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-3">Decision Gates</div>
          <div className="space-y-1 p-3 bg-gray-50 rounded-lg" data-testid="gating-reasons">
            {gatingReasons.map((reason, idx) => (
              <GatingReasonItem key={idx} reason={reason.text} type={reason.type} />
            ))}
          </div>
        </div>

        {/* ===== A5: ATTRIBUTION PREVIEW ===== */}
        {attribution?.topSignals?.length > 0 && (
          <div className="mb-6">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-3">Top Contributors</div>
            <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
              {attribution.topSignals.slice(0, 3).map((signal, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{signal.actorSlug || signal.type || 'Signal'}</span>
                  </div>
                  <span className="text-gray-500">{Math.round(signal.weight || signal.impact || 0)}%</span>
                </div>
              ))}
            </div>
            
            {/* CTA: View Signals */}
            <Link
              to="/signals"
              className="mt-3 inline-flex items-center gap-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors"
              data-testid="view-signals-btn"
            >
              <Eye className="w-4 h-4" />
              View Signals
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* No signals state */}
        {(!attribution?.topSignals || attribution.topSignals.length === 0) && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
            <Database className="w-8 h-8 text-gray-700 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No signal contributors yet</p>
            <p className="text-xs text-gray-400 mt-1">System is collecting data</p>
          </div>
        )}

        {/* ===== ACTIONS ===== */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            data-testid="refresh-btn"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          
          {/* Footer Meta */}
          <p className="text-[10px] text-gray-400">
            Decisions are logged and auditable. Engine v2.
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
}
