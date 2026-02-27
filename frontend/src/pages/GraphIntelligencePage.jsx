/**
 * Graph Intelligence Demo Page (P1.8 + P1.9 + P1.9.C + ETAP B1)
 * 
 * Demo page for graph intelligence visualization with timeline.
 * P1.9.C: Bidirectional sync between graph and timeline.
 * ETAP B1: Network-scoped queries with global NetworkSelector
 */

import { useState, useMemo, useCallback, useRef } from 'react';
import { Network, ArrowRight, Clock, LayoutGrid, LayoutList, Link2 } from 'lucide-react';
import RouteGraphView from '../components/RouteGraphView';
import RouteTimeline from '../components/RouteTimeline';
import useGraphIntelligence from '../hooks/useGraphIntelligence';
import GraphLogicToggle from '../components/GraphLogicToggle';
import { NetworkSelectorFull, NetworkBadge } from '../components/NetworkSelector';
import useNetworkStore from '../state/network.store';
import { 
  canSyncInFocusMode,
  canSyncInTruncatedGraph,
  mapEdgeToStepIndex,
} from '../graph/sync/graphTimelineSync.controller';

// Demo addresses
const DEMO_ADDRESSES = [
  { address: '0x28c6c06298d514db089934071355e5743bf21d60', label: 'Binance Hot Wallet' },
  { address: '0x21a31ee1afc51d94c2efccaa2092ad1028285549', label: 'Binance 2' },
  { address: '0x71660c4005ba85c37ccec55d0c4493e66fe775d3', label: 'Coinbase' },
];

// Layout options
const LAYOUTS = {
  GRAPH_ONLY: 'graph_only',
  GRAPH_TIMELINE: 'graph_timeline',
  TIMELINE_ONLY: 'timeline_only',
};

export default function GraphIntelligencePage() {
  const [address, setAddress] = useState(''); // Empty by default - user must input
  const [inputAddress, setInputAddress] = useState('');
  const [layout, setLayout] = useState(LAYOUTS.GRAPH_TIMELINE);
  const [syncEnabled, setSyncEnabled] = useState(true); // P1.9.C
  
  // ETAP B1: Get current network
  const network = useNetworkStore(state => state.network);
  
  // P1.9.C: Step refs for scroll targeting
  const stepRefsMap = useRef(new Map());
  
  // Use shared graph intelligence hook (ETAP B1: auto includes network)
  const {
    graph,
    loading,
    error,
    selectedEdgeId,
    focusMode,
    selectEdge,
    clearEdgeSelection,
    riskSummary,
  } = useGraphIntelligence({
    address,
    autoFetch: true,
  });
  
  // Mock market context from P1.6 (would come from API in production)
  const marketContext = useMemo(() => {
    if (!riskSummary) return null;
    
    return {
      regime: riskSummary.marketRegime || 'STABLE',
      volumeSpike: riskSummary.contextTags?.includes('VOLUME_SPIKE') || false,
      liquidityDrop: riskSummary.contextTags?.includes('THIN_LIQUIDITY') || false,
      confidenceImpact: riskSummary.confidenceImpact || 0,
      marketAmplifier: riskSummary.marketAmplifier || 1,
      contextTags: riskSummary.contextTags || [],
    };
  }, [riskSummary]);
  
  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (inputAddress.length >= 10) {
      setAddress(inputAddress);
    }
  };
  
  // P1.9.C: Check if sync is allowed for edge
  const canSync = useCallback((edgeId) => {
    if (!syncEnabled) return false;
    
    const highlightedPath = graph?.highlightedPath || [];
    const truncated = graph?.truncated || false;
    
    // Apply guards
    if (!canSyncInFocusMode(focusMode, edgeId, highlightedPath)) return false;
    if (!canSyncInTruncatedGraph(truncated, edgeId, highlightedPath)) return false;
    
    return true;
  }, [syncEnabled, graph, focusMode]);
  
  // P1.9.C: Handle timeline step click -> sync with graph
  const handleTimelineStepClick = useCallback((edgeId, step) => {
    // Always allow selection toggle
    if (selectedEdgeId === edgeId) {
      clearEdgeSelection();
      return;
    }
    
    // Select edge (this syncs via shared state)
    selectEdge(edgeId);
  }, [selectedEdgeId, selectEdge, clearEdgeSelection]);
  
  // P1.9.C: Register step refs for scroll targeting
  const handleStepRefCallback = useCallback((edgeId, element) => {
    if (element) {
      stepRefsMap.current.set(edgeId, element);
    } else {
      stepRefsMap.current.delete(edgeId);
    }
  }, []);
  
  // P1.9.C: Handle graph edge click -> scroll timeline
  const handleGraphEdgeClickForSync = useCallback((edgeId) => {
    if (!canSync(edgeId)) return;
    
    // Scroll timeline to step
    const element = stepRefsMap.current.get(edgeId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [canSync]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-[1600px] mx-auto px-4 py-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Network className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">Graph Intelligence</h1>
                  {/* Graph Logic Toggle - same as Actors page */}
                  <GraphLogicToggle />
                </div>
                <p className="text-sm text-gray-500">Exit routes • DEX/CEX/Bridges • Timeline sync</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sub-controls row - ETAP B1: Add NetworkSelector */}
        <div className="flex items-center justify-between mb-4">
          {/* ETAP B1: Network Selector */}
          <NetworkSelectorFull label="Network" />
          
          <div className="flex items-center gap-2">
              {/* P1.9.C: Sync toggle */}
              <button
                onClick={() => setSyncEnabled(!syncEnabled)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  syncEnabled 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                }`}
                title={syncEnabled ? 'Sync enabled' : 'Sync disabled'}
                data-testid="sync-toggle"
              >
                <Link2 className="w-3 h-3" />
                Sync {syncEnabled ? 'ON' : 'OFF'}
              </button>
              
              {/* Layout switcher */}
              <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-gray-200">
                <button
                  onClick={() => setLayout(LAYOUTS.GRAPH_ONLY)}
                  className={`p-2 rounded-md transition-all ${
                    layout === LAYOUTS.GRAPH_ONLY ? 'bg-white text-white' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  title="Graph Only"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setLayout(LAYOUTS.GRAPH_TIMELINE)}
                  className={`p-2 rounded-md transition-all ${
                    layout === LAYOUTS.GRAPH_TIMELINE ? 'bg-white text-white' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  title="Graph + Timeline"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setLayout(LAYOUTS.TIMELINE_ONLY)}
                  className={`p-2 rounded-md transition-all ${
                    layout === LAYOUTS.TIMELINE_ONLY ? 'bg-white text-white' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  title="Timeline Only"
                >
                  <Clock className="w-4 h-4" />
                </button>
              </div>
            </div>
        </div>
        
        {/* Search & Quick Access */}
        <div className="flex items-center gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={inputAddress}
                onChange={(e) => setInputAddress(e.target.value)}
                placeholder="Enter wallet address (0x...)"
                className="w-full pl-4 pr-24 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-white text-white rounded-lg text-sm font-medium hover:bg-gray-100"
              >
                Analyze
              </button>
            </div>
          </form>
        </div>
        
        {/* Quick Access */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xs text-gray-500 font-medium">Quick access:</span>
          {DEMO_ADDRESSES.map((item) => (
            <button
              key={item.address}
              onClick={() => {
                setAddress(item.address);
                setInputAddress(item.address);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                address === item.address
                  ? 'bg-white text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {item.label}
              <ArrowRight className="w-3 h-3" />
            </button>
          ))}
        </div>
        
        {/* Current Address - only show if address exists */}
        {address && (
          <div className="mb-4 p-3 bg-white border border-gray-200 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Analyzing:</span>
              <code className="text-sm font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                {address}
              </code>
              {graph?.truncated && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold rounded">
                  SIMPLIFIED
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Main Content - Layout Based */}
        {!address ? (
          /* Empty state - no address selected */
          <div className="flex items-center justify-center py-20">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Network className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No address selected</h3>
              <p className="text-sm text-gray-500 mb-6">
                Enter a wallet address above or select from quick access to analyze exit routes and intelligence
              </p>
              <div className="flex items-center justify-center gap-2">
                {DEMO_ADDRESSES.slice(0, 2).map((item) => (
                  <button
                    key={item.address}
                    onClick={() => {
                      setAddress(item.address);
                      setInputAddress(item.address);
                    }}
                    className="px-4 py-2 bg-white text-white rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    Try {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {layout === LAYOUTS.GRAPH_ONLY && (
              <RouteGraphView 
                address={address}
                showExplainPanel={true}
              />
            )}
            
            {layout === LAYOUTS.GRAPH_TIMELINE && (
              <div className="grid grid-cols-12 gap-6">
                {/* Graph */}
                <div className="col-span-8">
                  <RouteGraphView 
                    address={address}
                    showExplainPanel={false}
                    onEdgeClickForSync={handleGraphEdgeClickForSync}
                  />
                </div>
                
                {/* Timeline (P1.9.A + P1.9.B + P1.9.C) */}
                <div className="col-span-4">
                  <RouteTimeline
                    graphSnapshot={graph}
                    marketContext={marketContext}
                    selectedEdgeId={selectedEdgeId}
                    onStepClick={handleTimelineStepClick}
                    showMarket={true}
                    stepRefsCallback={handleStepRefCallback}
                  />
                </div>
              </div>
            )}
            
            {layout === LAYOUTS.TIMELINE_ONLY && (
              <div className="max-w-2xl mx-auto">
                <RouteTimeline
                  graphSnapshot={graph}
                  marketContext={marketContext}
                  selectedEdgeId={selectedEdgeId}
                  onStepClick={handleTimelineStepClick}
                  showMarket={true}
                  stepRefsCallback={handleStepRefCallback}
                />
              </div>
            )}
          </>
        )}
        
        
        {/* Bottom spacer */}
      </main>
    </div>
  );
}
