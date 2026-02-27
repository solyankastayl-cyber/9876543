/**
 * CohortFlows Component
 * 
 * Shows redistribution of tokens between wallet age groups.
 * Philosophy: Facts only, no intent.
 * 
 * - Collapsed by default
 * - Neutral colors (no green/red for direction)
 * - No "buy/sell" language
 */
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Users, ArrowRight, Info } from 'lucide-react';

// Cohort colors (neutral, not directional)
const COHORT_COLORS = {
  early: '#374151', // gray-700
  mid: '#6B7280',   // gray-500
  new: '#9CA3AF',   // gray-400
};

const COHORT_LABELS = {
  early: 'Early (>12m)',
  mid: 'Mid (3-12m)',
  new: 'New (<3m)',
};

function formatUSD(value) {
  if (!value) return '$0';
  const abs = Math.abs(value);
  if (abs >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

// Simple flow visualization without external Sankey library
function FlowDiagram({ flows }) {
  if (!flows || flows.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <div className="text-sm">No significant redistribution detected</div>
        <div className="text-xs mt-1">Token movement between wallet age groups was minimal</div>
      </div>
    );
  }

  // Sort flows by volume
  const sortedFlows = [...flows].sort((a, b) => b.amountUsd - a.amountUsd);
  const maxFlow = sortedFlows[0]?.amountUsd || 1;

  return (
    <div className="space-y-3">
      {sortedFlows.slice(0, 5).map((flow, i) => {
        const widthPercent = Math.max(20, (flow.amountUsd / maxFlow) * 100);
        
        return (
          <div key={i} className="flex items-center gap-3">
            {/* From cohort */}
            <div 
              className="px-3 py-1.5 rounded text-xs font-semibold text-white min-w-[90px] text-center"
              style={{ backgroundColor: COHORT_COLORS[flow.from] }}
            >
              {COHORT_LABELS[flow.from]}
            </div>
            
            {/* Flow bar */}
            <div className="flex-1 relative h-8">
              <div 
                className="absolute inset-y-0 left-0 bg-gray-200 rounded flex items-center justify-center transition-all"
                style={{ width: `${widthPercent}%` }}
              >
                <ArrowRight className="w-4 h-4 text-gray-500" />
                <span className="ml-1 text-xs font-bold text-gray-700">
                  {formatUSD(flow.amountUsd)}
                </span>
              </div>
            </div>
            
            {/* To cohort */}
            <div 
              className="px-3 py-1.5 rounded text-xs font-semibold text-white min-w-[90px] text-center"
              style={{ backgroundColor: COHORT_COLORS[flow.to] }}
            >
              {COHORT_LABELS[flow.to]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Cohort summary cards
function CohortSummary({ cohorts }) {
  if (!cohorts || cohorts.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-3 mb-4">
      {cohorts.map((cohort) => (
        <div 
          key={cohort.cohort}
          className="p-3 rounded-lg border border-gray-100"
          style={{ borderLeftColor: COHORT_COLORS[cohort.cohort], borderLeftWidth: 3 }}
        >
          <div className="text-xs text-gray-500 mb-1">{COHORT_LABELS[cohort.cohort]}</div>
          <div className="text-lg font-bold text-gray-900">
            {cohort.walletsCount.toLocaleString()}
          </div>
          <div className="text-xs text-gray-400">wallets</div>
          {cohort.holdingsSharePct > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              {cohort.holdingsSharePct}% of holdings
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function CohortFlows({ tokenAddress, tokenSymbol }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!expanded || !tokenAddress) return;
    
    async function loadCohorts() {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/tokens/${tokenAddress}/cohorts?window=7d`
        );
        const json = await response.json();
        
        if (json.ok && json.data) {
          setData(json.data);
        } else {
          setError('Failed to load cohort data');
        }
      } catch (err) {
        console.error('Cohorts load error:', err);
        setError('Failed to load cohort data');
      } finally {
        setLoading(false);
      }
    }
    
    loadCohorts();
  }, [expanded, tokenAddress]);

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="font-semibold text-gray-900">Wallet Cohort Flows</span>
          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-500">7d</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {expanded ? 'Hide' : 'View cohort flows'}
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      
      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          {loading ? (
            <div className="py-8 text-center text-gray-400">Loading cohort data...</div>
          ) : error ? (
            <div className="py-8 text-center text-red-400">{error}</div>
          ) : data ? (
            <>
              {/* Interpretation headline */}
              {data.interpretation && (
                <div className="mt-4 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="font-semibold text-gray-900 text-sm">
                    {data.interpretation.headline}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {data.interpretation.description}
                  </div>
                </div>
              )}
              
              {/* Cohort summary */}
              <CohortSummary cohorts={data.cohorts} />
              
              {/* Flow diagram */}
              <div className="mt-4">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Token Movement Between Cohorts
                </div>
                <FlowDiagram flows={data.flowsBetweenCohorts} />
              </div>
              
              {/* Disclaimer */}
              <div className="mt-4 flex items-start gap-2 text-xs text-gray-400 bg-gray-50 rounded p-3">
                <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>
                  Shows redistribution of tokens between wallet age groups. 
                  This does not indicate intent or trading behavior.
                </span>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
