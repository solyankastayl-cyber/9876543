/**
 * CohortFlowsSankey - Wallet Cohort Redistribution Visualization
 * 
 * Shows token redistribution between wallet age groups.
 * Philosophy: Facts only, no intent.
 * 
 * - Collapsed by default
 * - Neutral colors (no green/red)
 * - No buy/sell language
 */
import { useState, useEffect } from 'react';
import { ResponsiveSankey } from '@nivo/sankey';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

// Neutral color palette for cohorts
const COHORT_COLORS = {
  early: '#374151',  // Gray-700
  mid: '#6B7280',    // Gray-500
  new: '#9CA3AF',    // Gray-400
};

function formatUSD(value) {
  if (!value) return '$0';
  const absValue = Math.abs(value);
  if (absValue >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (absValue >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (absValue >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

export default function CohortFlowsSankey({ tokenAddress, tokenSymbol }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!expanded || !tokenAddress) return;
    
    async function loadCohortFlows() {
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
        setError('Network error');
      } finally {
        setLoading(false);
      }
    }
    
    loadCohortFlows();
  }, [expanded, tokenAddress]);

  // Transform API data to Sankey format
  const sankeyData = data ? transformToSankey(data) : null;
  const hasFlows = sankeyData && sankeyData.links.length > 0;

  return (
    <div className="border border-gray-100 rounded-xl bg-white">
      {/* Header - Always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        data-testid="cohort-flows-toggle"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">Wallet Cohort Flows</span>
          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">7d</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {expanded ? 'Hide' : 'View cohort flows'}
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Content - Expandable */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          {loading ? (
            <div className="h-48 flex items-center justify-center text-gray-400">
              Loading cohort data...
            </div>
          ) : error ? (
            <div className="h-48 flex items-center justify-center text-red-400">
              {error}
            </div>
          ) : !hasFlows ? (
            <EmptyState data={data} />
          ) : (
            <>
              {/* Cohort Summary */}
              <CohortSummary cohorts={data.cohorts} />
              
              {/* Sankey Diagram */}
              <div className="h-64 mt-4">
                <ResponsiveSankey
                  data={sankeyData}
                  margin={{ top: 20, right: 140, bottom: 20, left: 140 }}
                  align="justify"
                  colors={(node) => COHORT_COLORS[node.id.split('_')[0]] || '#9CA3AF'}
                  nodeOpacity={1}
                  nodeThickness={18}
                  nodeInnerPadding={3}
                  nodeSpacing={24}
                  nodeBorderWidth={0}
                  linkOpacity={0.4}
                  linkHoverOpacity={0.6}
                  linkContract={3}
                  enableLinkGradient={false}
                  labelPosition="outside"
                  labelOrientation="horizontal"
                  labelPadding={16}
                  labelTextColor={{ from: 'color', modifiers: [['darker', 1]] }}
                  nodeTooltip={({ node }) => (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
                      <div className="font-semibold">{node.label}</div>
                      <div className="text-gray-500">{formatUSD(node.value)} volume</div>
                    </div>
                  )}
                  linkTooltip={({ link }) => (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
                      <div className="font-semibold">{link.source.label} → {link.target.label}</div>
                      <div className="text-gray-600">{formatUSD(link.value)} transferred</div>
                    </div>
                  )}
                />
              </div>
              
              {/* Interpretation */}
              {data.interpretation && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium text-gray-900 text-sm">{data.interpretation.headline}</div>
                  <div className="text-xs text-gray-500 mt-1">{data.interpretation.description}</div>
                </div>
              )}
              
              {/* Disclaimer */}
              <div className="mt-3 flex items-start gap-2 text-xs text-gray-400">
                <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>
                  Diagram shows movement of tokens between wallet age groups. 
                  This does not indicate intent or trading behavior.
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Cohort summary cards
function CohortSummary({ cohorts }) {
  if (!cohorts || cohorts.length === 0) return null;
  
  const cohortLabels = {
    early: 'Early (>12m)',
    mid: 'Mid (3-12m)',
    new: 'New (<3m)',
  };
  
  return (
    <div className="grid grid-cols-3 gap-3 mt-4">
      {cohorts.map((c) => (
        <div key={c.cohort} className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: COHORT_COLORS[c.cohort] }}
            />
            <span className="text-xs font-medium text-gray-600">
              {cohortLabels[c.cohort]}
            </span>
          </div>
          <div className="text-lg font-bold text-gray-900">
            {c.walletsCount.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">wallets</div>
          {c.holdingsSharePct > 0 && (
            <div className="text-xs text-gray-400 mt-1">
              {c.holdingsSharePct}% of holdings
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Empty state when no significant flows
function EmptyState({ data }) {
  const totalWallets = data?.cohorts?.reduce((sum, c) => sum + c.walletsCount, 0) || 0;
  
  return (
    <div className="py-8 text-center">
      <div className="text-gray-400 mb-2">No significant redistribution detected</div>
      <div className="text-xs text-gray-400">
        Token movement between wallet age groups was minimal during this window.
      </div>
      {totalWallets > 0 && (
        <div className="mt-4 text-sm text-gray-500">
          {totalWallets.toLocaleString()} wallets analyzed
        </div>
      )}
    </div>
  );
}

// Transform API response to Sankey format
function transformToSankey(data) {
  const cohortLabels = {
    early: 'Early (>12m)',
    mid: 'Mid (3-12m)',
    new: 'New (<3m)',
  };
  
  // Create nodes for each cohort
  const nodes = data.cohorts
    .filter(c => c.walletsCount > 0)
    .map(c => ({
      id: c.cohort,
      label: cohortLabels[c.cohort],
    }));
  
  // Create links from flows
  const links = (data.flowsBetweenCohorts || [])
    .filter(f => f.amountUsd > 10000) // Filter out dust
    .map(f => ({
      source: f.from,
      target: f.to,
      value: f.amountUsd,
    }));
  
  return { nodes, links };
}
