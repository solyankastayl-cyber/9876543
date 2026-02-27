import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ForceGraph2D from 'react-force-graph-2d';
import { Sliders, RotateCcw, ArrowLeft, Search, X } from 'lucide-react';
import { IconNetwork, IconInfluencer } from '../../components/icons/FomoIcons';
import { fetchGraphV2, fetchHandshakeV2 } from '../../api/connectionsGraphV2.api';
import AuthorityBreakdown from '../../components/connections/AuthorityBreakdown';
import HandshakePathView from '../../components/connections/HandshakePathView';

const LAYER_LABELS = {
  BLENDED: 'Blended',
  CO_INVESTMENT: 'Co-Investment',
  CO_ENGAGEMENT: 'Co-Engagement',
  FOLLOW: 'Follow',
  ONCHAIN: 'Onchain',
  MEDIA: 'Media'
};

const LAYER_COLORS = {
  BLENDED: '#6B7280',
  CO_INVESTMENT: '#8B5CF6',
  CO_ENGAGEMENT: '#F59E0B',
  FOLLOW: '#3B82F6',
  ONCHAIN: '#10B981',
  MEDIA: '#EC4899'
};

function clamp01(x) {
  return Math.max(0, Math.min(1, isNaN(x) ? 0 : x));
}

export default function ConnectionsGraphV2Page() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const graphRef = useRef();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // State
  const [data, setData] = useState({ nodes: [], edges: [], meta: {} });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Layer filters (which connections to show)
  const [activeLayers, setActiveLayers] = useState({
    CO_INVESTMENT: true,
    FOLLOW: true,
    ONCHAIN: true,
    MEDIA: true
  });

  // Filters - Adjusted for FOLLOW edges which have lower weights
  const [minConfidence, setMinConfidence] = useState(0.3);
  const [minWeight, setMinWeight] = useState(0.01);
  const [anchorsEnabled, setAnchorsEnabled] = useState(true);

  // Selection
  const [selectedA, setSelectedA] = useState(null);
  const [selectedB, setSelectedB] = useState(null);
  const [handshake, setHandshake] = useState(null);
  const [highlightPath, setHighlightPath] = useState([]);

  const layer = searchParams.get('layer') || 'BLENDED';

  const setLayer = (l) => {
    setSearchParams({ layer: l });
    clearSelection();
  };

  const toggleLayerFilter = (layerKey) => {
    setActiveLayers(prev => ({
      ...prev,
      [layerKey]: !prev[layerKey]
    }));
  };

  const loadGraph = useCallback(async (query = '') => {
    if (!query.trim()) {
      setData({ nodes: [], edges: [], meta: {} });
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);
    
    try {
      const result = await fetchGraphV2({
        layer,
        anchors: anchorsEnabled ? '1' : '0',
        minConfidence,
        minWeight,
        handle: query.trim().replace('@', '')
      });
      setData({
        nodes: result.nodes || [],
        edges: result.edges || [],
        meta: result.meta || {}
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [layer, anchorsEnabled, minConfidence, minWeight]);

  const handleSearch = (e) => {
    e?.preventDefault();
    loadGraph(searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setData({ nodes: [], edges: [], meta: {} });
    setHasSearched(false);
    clearSelection();
  };

  // Filter edges by active layers
  const filteredData = useMemo(() => {
    const filteredEdges = data.edges.filter(edge => {
      // Map edge layer to our filter keys
      const edgeLayer = edge.layer?.toUpperCase();
      if (edgeLayer === 'COINVEST' || edgeLayer === 'CO_INVESTMENT') {
        return activeLayers.CO_INVESTMENT;
      }
      if (edgeLayer === 'FOLLOW') {
        return activeLayers.FOLLOW;
      }
      if (edgeLayer === 'ONCHAIN') {
        return activeLayers.ONCHAIN;
      }
      if (edgeLayer === 'MEDIA') {
        return activeLayers.MEDIA;
      }
      return true; // Show unknown layers by default
    });

    // Only include nodes that have at least one edge
    const connectedNodeIds = new Set();
    filteredEdges.forEach(edge => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });

    const filteredNodes = data.nodes.filter(node => 
      connectedNodeIds.has(node.id) || node.id === searchQuery.replace('@', '')
    );

    return { nodes: filteredNodes, edges: filteredEdges };
  }, [data, activeLayers, searchQuery]);

  const graphData = useMemo(() => ({
    nodes: filteredData.nodes.map(n => ({ ...n })),
    links: filteredData.edges.map(e => ({ ...e, source: e.source, target: e.target }))
  }), [filteredData]);

  const clearSelection = () => {
    setSelectedA(null);
    setSelectedB(null);
    setHandshake(null);
    setHighlightPath([]);
  };

  const handleNodeClick = useCallback(async (node) => {
    if (!selectedA) {
      setSelectedA(node);
      setSelectedB(null);
      setHandshake(null);
      setHighlightPath([]);
    } else if (!selectedB && node.id !== selectedA.id) {
      setSelectedB(node);
      // Calculate handshake
      try {
        const result = await fetchHandshakeV2({
          fromId: selectedA.id,
          toId: node.id,
          layer
        });
        setHandshake(result);
        if (result.ok && result.pathIds) {
          setHighlightPath(result.pathIds);
        }
      } catch {
        setHandshake({ ok: false, reason: 'Error' });
      }
    } else {
      setSelectedA(node);
      setSelectedB(null);
      setHandshake(null);
      setHighlightPath([]);
    }
  }, [selectedA, selectedB, layer]);

  const highlightSet = useMemo(() => new Set(highlightPath), [highlightPath]);

  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const isHighlight = highlightSet.has(node.id);
    const isSelected = node.id === selectedA?.id || node.id === selectedB?.id;
    const isBacker = node.kind === 'BACKER';
    const isSearchTarget = node.id === searchQuery.replace('@', '') || node.handle === searchQuery.replace('@', '');
    
    // Compact nodes - same as Farm Network (radius 3-4)
    const baseRadius = 3;
    const connectionBonus = isBacker ? 1 : isSearchTarget ? 1.5 : 0;
    const radius = baseRadius + connectionBonus;
    const finalRadius = isSelected ? radius + 1.5 : radius;
    
    // Node fill
    ctx.beginPath();
    ctx.arc(node.x, node.y, finalRadius, 0, 2 * Math.PI);
    
    let fillColor = '#6B7280';
    if (isSearchTarget) fillColor = '#EF4444';
    else if (isSelected) fillColor = '#1F2937';
    else if (isHighlight) fillColor = '#3B82F6';
    else if (isBacker) fillColor = '#8B5CF6';
    
    ctx.fillStyle = fillColor;
    ctx.fill();
    
    if (isSelected || isHighlight || isSearchTarget) {
      ctx.strokeStyle = isSearchTarget ? '#EF4444' : isSelected ? '#1F2937' : '#3B82F6';
      ctx.lineWidth = 1 / globalScale;
      ctx.stroke();
    }
    
    // Label - same as Farm Network (font 5-6, black color)
    const fontSize = Math.max(5, 6 / globalScale);
    ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#000000';
    const label = (node.label || node.handle || node.id).slice(0, 10);
    ctx.fillText(label, node.x, node.y + finalRadius + 1);
  }, [highlightSet, selectedA, selectedB, searchQuery]);

  const linkColor = useCallback((link) => {
    const srcId = typeof link.source === 'object' ? link.source.id : link.source;
    const tgtId = typeof link.target === 'object' ? link.target.id : link.target;
    
    // Highlight path
    if (highlightSet.has(srcId) && highlightSet.has(tgtId)) {
      return '#EF4444';
    }
    
    const edgeLayer = link.layer?.toUpperCase();
    
    // FOLLOW edges - blue color
    if (edgeLayer === 'FOLLOW') {
      return `rgba(59, 130, 246, ${0.4 + clamp01(link.confidence || 0.5) * 0.5})`;
    }
    
    // CO_INVEST edges - purple color
    if (edgeLayer === 'COINVEST' || edgeLayer === 'CO_INVESTMENT') {
      return `rgba(139, 92, 246, ${0.4 + clamp01(link.confidence || 0.5) * 0.5})`;
    }
    
    // ONCHAIN edges - green
    if (edgeLayer === 'ONCHAIN') {
      return `rgba(16, 185, 129, ${0.4 + clamp01(link.confidence || 0.5) * 0.5})`;
    }
    
    // MEDIA edges - pink
    if (edgeLayer === 'MEDIA') {
      return `rgba(236, 72, 153, ${0.4 + clamp01(link.confidence || 0.5) * 0.5})`;
    }
    
    return `rgba(156, 163, 175, ${0.3 + clamp01(link.confidence || 0.5) * 0.5})`;
  }, [highlightSet]);

  const linkWidth = useCallback((link) => {
    const srcId = typeof link.source === 'object' ? link.source.id : link.source;
    const tgtId = typeof link.target === 'object' ? link.target.id : link.target;
    if (highlightSet.has(srcId) && highlightSet.has(tgtId)) {
      return 2;
    }
    return 0.5 + clamp01(link.weight || 0.1) * 1;
  }, [highlightSet]);

  return (
    <div className="space-y-6 p-4">
      {/* Back Button */}
      <button
        onClick={() => navigate('/connections')}
        data-testid="back-to-connections-btn"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Connections</span>
      </button>

      {/* Header with Search */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <IconNetwork size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Influence Network</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xl">
            Visualize connection strength between influencers, VCs, and projects. 
            Discover co-investment patterns, follow relationships, and on-chain interactions.
          </p>
          
          {/* Search Input */}
          <form onSubmit={handleSearch} className="mt-4 flex gap-2">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter @handle to explore connections..."
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                data-testid="graph-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={!searchQuery.trim() || loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              data-testid="graph-search-btn"
            >
              <IconNetwork size={16} />
              Explore
            </button>
          </form>
        </div>

        {/* Stats */}
        {hasSearched && (
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{filteredData.nodes.length} nodes</span>
            <span>{filteredData.edges.length} edges</span>
          </div>
        )}
      </div>

      {/* Layer Filter Buttons */}
      {hasSearched && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-500 py-1.5">Show:</span>
          {Object.entries({
            CO_INVESTMENT: 'Co-Invested',
            FOLLOW: 'Follow',
            ONCHAIN: 'Onchain',
            MEDIA: 'Media'
          }).map(([key, label]) => (
            <button
              key={key}
              onClick={() => toggleLayerFilter(key)}
              data-testid={`layer-filter-${key.toLowerCase()}`}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                activeLayers[key]
                  ? 'text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
              }`}
              style={activeLayers[key] ? { backgroundColor: LAYER_COLORS[key] } : {}}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: LAYER_COLORS[key] }}></span>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!hasSearched && (
        <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12" style={{ height: '60vh' }}>
          <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-6">
            <IconInfluencer size={48} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Search for an Account
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
            Enter a Twitter handle above to explore their network connections, including co-investments, follows, on-chain activity, and media mentions.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            <span className="text-xs text-gray-400">Try:</span>
            {['@cobie', '@hsaka', '@inversebrah', '@sassal0x'].map(handle => (
              <button
                key={handle}
                onClick={() => { setSearchQuery(handle); loadGraph(handle); }}
                className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {handle}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Graph Area */}
      {hasSearched && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Graph Canvas */}
          <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden" style={{ height: '70vh' }}>
            {loading && (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            )}
            {error && (
              <div className="flex items-center justify-center h-full text-red-500">
                Error: {error}
              </div>
            )}
            {!loading && !error && graphData.nodes.length > 0 && (
              <ForceGraph2D
                ref={graphRef}
                graphData={graphData}
                nodeId="id"
                onNodeClick={handleNodeClick}
                nodeCanvasObject={nodeCanvasObject}
                linkColor={linkColor}
                linkWidth={linkWidth}
                cooldownTicks={100}
                d3VelocityDecay={0.3}
              />
            )}
            {!loading && !error && graphData.nodes.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <IconInfluencer size={48} className="mb-4 text-gray-300" />
                <p className="font-medium">No connections found</p>
                <p className="text-sm text-gray-400">Try a different handle or adjust filters</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-4">
                <Sliders className="w-4 h-4 text-gray-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Min Confidence</label>
                  <input
                    type="range"
                    min="0" max="1" step="0.05"
                    value={minConfidence}
                    onChange={(e) => setMinConfidence(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 mt-1"
                    data-testid="filter-min-confidence"
                  />
                  <div className="text-xs text-gray-500 mt-1">{Math.round(minConfidence * 100)}%</div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Min Weight</label>
                  <input
                    type="range"
                    min="0" max="1" step="0.05"
                    value={minWeight}
                    onChange={(e) => setMinWeight(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 mt-1"
                    data-testid="filter-min-weight"
                  />
                  <div className="text-xs text-gray-500 mt-1">{minWeight.toFixed(2)}</div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Anchors</span>
                  <button
                    onClick={() => setAnchorsEnabled(!anchorsEnabled)}
                    data-testid="filter-anchors-toggle"
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                      anchorsEnabled
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {anchorsEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                <button
                  onClick={() => loadGraph(searchQuery)}
                  disabled={!searchQuery.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  data-testid="apply-filters-btn"
                >
                  <RotateCcw className="w-4 h-4" />
                  Apply Filters
                </button>
              </div>
            </div>

            {/* Handshake Panel */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-4">
                <IconNetwork size={16} className="text-gray-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Handshake</h3>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Click node A, then node B to compute path.
              </p>

              <div className="space-y-2">
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Node A</div>
                  <div className="font-semibold text-gray-900 dark:text-white truncate">
                    {selectedA?.label || selectedA?.handle || selectedA?.id || '—'}
                  </div>
                  {selectedA?.scores && (
                    <div className="mt-2">
                      <AuthorityBreakdown scores={selectedA.scores} preset={layer} />
                    </div>
                  )}
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Node B</div>
                  <div className="font-semibold text-gray-900 dark:text-white truncate">
                    {selectedB?.label || selectedB?.handle || selectedB?.id || '—'}
                  </div>
                  {selectedB?.scores && (
                    <div className="mt-2">
                      <AuthorityBreakdown scores={selectedB.scores} preset={layer} />
                    </div>
                  )}
                </div>

                <button
                  onClick={clearSelection}
                  className="w-full px-4 py-2 text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  data-testid="handshake-clear-btn"
                >
                  Clear
                </button>
              </div>

              {handshake && (
                <div className="mt-4 space-y-4">
                  {handshake.ok ? (
                    <>
                      <HandshakePathView 
                        path={handshake.pathNodes || handshake.pathLabels?.map((label, i) => ({ 
                          id: handshake.pathIds?.[i] || label, 
                          label,
                          isAnchor: handshake.anchorsInPath?.includes(label) 
                        })) || []}
                        strength={handshake.strength || 0}
                        hops={handshake.hops || 0}
                      />
                      
                      {handshake.formula && (
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-xs text-gray-500 dark:text-gray-400 space-y-1">
                          <div className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Formula</div>
                          <div>Edge Term: {handshake.formula.edgeTerm}</div>
                          <div>Node Term: {handshake.formula.nodeTerm}</div>
                          <div>Hop Penalty: {handshake.formula.hopPenalty}</div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-500 font-semibold">
                      No path found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Legend</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gray-500"></span>
                  <span className="text-gray-600 dark:text-gray-400">Twitter Account</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                  <span className="text-gray-600 dark:text-gray-400">Backer (Anchor)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  <span className="text-gray-600 dark:text-gray-400">Search Target</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gray-800"></span>
                  <span className="text-gray-600 dark:text-gray-400">Selected</span>
                </div>
                <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-[10px] uppercase text-gray-500 mb-2">Edge Types</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-0.5 bg-purple-500"></span>
                  <span className="text-gray-600 dark:text-gray-400">Co-Investment</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-0.5 bg-blue-500"></span>
                  <span className="text-gray-600 dark:text-gray-400">Follow</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-0.5 bg-green-500"></span>
                  <span className="text-gray-600 dark:text-gray-400">Onchain</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-0.5 bg-pink-500"></span>
                  <span className="text-gray-600 dark:text-gray-400">Media</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-0.5 bg-red-500"></span>
                  <span className="text-gray-600 dark:text-gray-400">Handshake Path</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
