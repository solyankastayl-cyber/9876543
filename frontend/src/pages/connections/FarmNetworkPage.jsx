/**
 * Farm Network Graph Page (Block 19)
 * 
 * Visualizes shared bot farm connections between influencers
 * Using react-force-graph-2d for interactive visualization
 */

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { RefreshCw, ChevronDown, ChevronUp, ZoomIn, ZoomOut, Maximize2, ExternalLink } from 'lucide-react';
import { IconOverlapFarm, IconNetwork, IconWarning, IconCluster, IconAttention } from '../../components/icons/FomoIcons';
import { fetchFarmGraph, fetchActorDetails } from '../../api/blocks15-28.api';
import ActorDetailsModal from '../../components/connections/ActorDetailsModal';

// Farm colors by risk level
const FARM_COLORS = {
  'farm_vc_network': '#8B5CF6',      // Purple
  'farm_kol_ring': '#EF4444',        // Red - high risk
  'farm_analyst_hub': '#3B82F6',     // Blue
  'farm_whale_watchers': '#F59E0B',  // Orange
  'cross_farm': '#EC4899',           // Pink
  'default': '#6B7280'               // Gray
};

// How It Works explanatory section
function HowItWorksSection() {
  const [expanded, setExpanded] = useState(true);
  
  return (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl p-5 border border-red-200 dark:border-red-800 mb-6 animate-fade-in-up">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <IconOverlapFarm size={20} className="text-red-600 dark:text-red-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">What is Farm Network?</h2>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>
      
      {expanded && (
        <div className="mt-4 space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            This tool detects <strong>coordinated bot networks</strong> by analyzing shared suspicious followers between Twitter accounts.
          </p>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
              <IconWarning size={20} className="text-red-500 mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">BOT FARMS</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Groups of fake accounts used to artificially inflate followers and engagement. Often controlled by the same operator.
              </p>
            </div>
            
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
              <IconAttention size={20} className="text-orange-500 mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">HOW WE DETECT</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                We analyze follower overlap between accounts. High overlap = likely using the same bot farm to inflate numbers.
              </p>
            </div>
            
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
              <IconNetwork size={20} className="text-green-500 mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">WHY IT MATTERS</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Accounts using bot farms are less trustworthy. Their "influence" is artificial - avoid following their trading signals.
              </p>
            </div>
          </div>
          
          <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3 border-l-4 border-orange-400">
            <h4 className="font-medium text-gray-900 dark:text-white mb-1">How to read the graph:</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• <strong>Nodes</strong> = Twitter accounts with detected bot farm usage</li>
              <li>• <strong>Lines</strong> = Shared suspicious followers between accounts</li>
              <li>• <strong>Thicker lines</strong> = More shared bots (stronger connection)</li>
              <li>• <strong>Colors</strong> = Different farm groups</li>
              <li>• <strong>Drag nodes</strong> to rearrange, <strong>scroll to zoom</strong>, <strong>click</strong> for details</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// Farm Groups Panel
function FarmGroupsPanel({ farms, onSelectFarm }) {
  if (!farms || farms.length === 0) return null;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 mb-4 animate-fade-in-up stagger-2">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <IconCluster size={20} className="text-purple-500" />
        Detected Farm Groups
      </h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
        {farms.map((farm, idx) => (
          <div
            key={farm.farmId || idx}
            onClick={() => onSelectFarm(farm)}
            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow duration-300 border-l-4"
            style={{ borderLeftColor: FARM_COLORS[farm.farmId] || FARM_COLORS.default }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm text-gray-900 dark:text-white">{farm.name || 'Unknown Farm'}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${farm.riskLevel === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {farm.riskLevel || 'MEDIUM'}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {farm.memberCount || (farm.members?.length || 0)} members
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {(farm.members || []).slice(0, 3).map(m => (
                <a
                  key={m}
                  href={`https://twitter.com/${m}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:text-blue-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  @{m}
                </a>
              ))}
              {(farm.members || []).length > 3 && (
                <span className="text-xs text-gray-400">+{farm.members.length - 3}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FarmNetworkPage() {
  const graphRef = useRef();
  const [data, setData] = useState({ nodes: [], edges: [] });
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minScore, setMinScore] = useState(0.35);
  const [selectedNode, setSelectedNode] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedActor, setSelectedActor] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [highlightFarm, setHighlightFarm] = useState(null);
  
  // Load farm graph data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchFarmGraph(minScore, 100);
      
      // Transform data for ForceGraph2D
      const nodes = (response.nodes || []).map(node => ({
        id: node.id,
        label: node.id,
        farmId: node.farmId,
        connections: (response.edges || []).filter(e => e.a === node.id || e.b === node.id).length
      }));
      
      const edges = (response.edges || []).map(edge => ({
        source: edge.a,
        target: edge.b,
        score: edge.overlapScore,
        shared: edge.sharedSuspects,
        farmId: edge.farmId,
        farmName: edge.farmName
      }));
      
      setData({ nodes, edges });
      
      // Load farm groups
      const farmsResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/connections/bot-farms`);
      if (farmsResponse.ok) {
        const farmsData = await farmsResponse.json();
        setFarms(farmsData.data || []);
      }
    } catch (err) {
      console.error('Error loading farm graph:', err);
    } finally {
      setLoading(false);
    }
  }, [minScore]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Handle node click - show actor details
  const handleNodeClick = useCallback(async (node) => {
    setSelectedNode(node);
    setModalLoading(true);
    setModalOpen(true);
    
    try {
      const details = await fetchActorDetails(node.id);
      setSelectedActor(details);
    } catch (err) {
      console.error('Error fetching actor details:', err);
      // Create basic actor data from node
      setSelectedActor({
        username: node.id,
        name: node.label,
        riskLevel: node.connections > 3 ? 'HIGH' : 'MEDIUM',
        connections: node.connections
      });
    } finally {
      setModalLoading(false);
    }
  }, []);
  
  const closeModal = useCallback(() => {
    setModalOpen(false);
    setSelectedActor(null);
  }, []);
  
  // Custom node rendering - compact style
  const paintNode = useCallback((node, ctx, globalScale) => {
    const isHighlight = highlightFarm && node.farmId === highlightFarm;
    const isSelected = selectedNode?.id === node.id;
    
    // Compact nodes - radius 3-4
    const baseRadius = 3;
    const connectionBonus = Math.min((node.connections || 0) * 0.3, 1);
    const radius = baseRadius + connectionBonus;
    const finalRadius = isSelected ? radius + 1.5 : radius;
    
    // Node fill
    ctx.beginPath();
    ctx.arc(node.x, node.y, finalRadius, 0, 2 * Math.PI);
    
    let fillColor = FARM_COLORS[node.farmId] || FARM_COLORS.default;
    if (isSelected) fillColor = '#1F2937';
    
    ctx.fillStyle = fillColor;
    ctx.globalAlpha = isHighlight || !highlightFarm ? 1 : 0.3;
    ctx.fill();
    ctx.globalAlpha = 1;
    
    // Border for selected/highlight
    if (isSelected || isHighlight) {
      ctx.strokeStyle = isSelected ? '#1F2937' : fillColor;
      ctx.lineWidth = 1 / globalScale;
      ctx.stroke();
    }
    
    // Label - smaller font, black color
    const fontSize = Math.max(4, 5 / globalScale);
    ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#000000';
    const label = (node.label || node.id).slice(0, 10);
    ctx.fillText(label, node.x, node.y + finalRadius + 1);
  }, [selectedNode, highlightFarm]);
  
  // Custom link color based on farm
  const linkColor = useCallback((link) => {
    const farmId = link.farmId || 'default';
    const color = FARM_COLORS[farmId] || FARM_COLORS.default;
    const opacity = 0.3 + (link.score || 0.5) * 0.5;
    
    if (highlightFarm) {
      if (link.farmId === highlightFarm) {
        return color;
      }
      return 'rgba(200,200,200,0.1)';
    }
    
    // Convert hex to rgba
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${opacity})`;
  }, [highlightFarm]);
  
  // Link width based on overlap score - thinner like main graph
  const linkWidth = useCallback((link) => {
    return 0.5 + (link.score || 0.5) * 1.5;
  }, []);
  
  // Graph data formatted for ForceGraph2D
  const graphData = useMemo(() => ({
    nodes: data.nodes,
    links: data.edges
  }), [data]);
  
  // Handle farm selection - highlight in graph
  const handleSelectFarm = useCallback((farm) => {
    if (highlightFarm === farm.farmId) {
      setHighlightFarm(null);
    } else {
      setHighlightFarm(farm.farmId);
      // Center on farm nodes
      if (graphRef.current) {
        const farmNodes = data.nodes.filter(n => farm.members.includes(n.id));
        if (farmNodes.length > 0) {
          const avgX = farmNodes.reduce((sum, n) => sum + (n.x || 0), 0) / farmNodes.length;
          const avgY = farmNodes.reduce((sum, n) => sum + (n.y || 0), 0) / farmNodes.length;
          graphRef.current.centerAt(avgX, avgY, 500);
          graphRef.current.zoom(2, 500);
        }
      }
    }
  }, [highlightFarm, data.nodes]);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in-up">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
                <IconOverlapFarm size={28} className="text-white" />
              </div>
              Farm Network Graph
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 ml-15">
              Shared suspicious followers between influencers
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/30 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* How It Works */}
        <HowItWorksSection />
        
        {/* Farm Groups */}
        <FarmGroupsPanel farms={farms} onSelectFarm={handleSelectFarm} />

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 mb-6 shadow-sm hover:shadow-md transition-shadow duration-300 animate-fade-in-up stagger-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <IconAttention size={16} className="text-gray-400" />
                <label className="text-sm text-gray-600 dark:text-gray-300">Min Overlap Score:</label>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-32 accent-red-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12">
                  {minScore.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
                  Nodes: {data.nodes.length}
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-6 h-0.5 bg-red-500 shadow-sm shadow-red-500/50" />
                  Edges: {data.edges.length}
                </span>
              </div>
            </div>
            
            {/* Zoom controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => graphRef.current?.zoom(graphRef.current.zoom() * 1.5, 300)}
                className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={() => graphRef.current?.zoom(graphRef.current.zoom() / 1.5, 300)}
                className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={() => graphRef.current?.zoomToFit(400, 50)}
                className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                title="Fit to View"
              >
                <Maximize2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>
          
          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 text-xs">
            {Object.entries(FARM_COLORS).filter(([k]) => k !== 'default').map(([key, color]) => (
              <div
                key={key}
                className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition ${highlightFarm === key ? 'bg-gray-200 dark:bg-gray-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                onClick={() => setHighlightFarm(highlightFarm === key ? null : key)}
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-gray-600 dark:text-gray-400">
                  {key.replace('farm_', '').replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Graph */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden animate-fade-in-up stagger-4">
          {loading ? (
            <div className="h-[600px] flex items-center justify-center">
              <RefreshCw className="w-8 h-8 animate-spin text-red-500" />
            </div>
          ) : data.nodes.length === 0 ? (
            <div className="h-[600px] flex flex-col items-center justify-center text-gray-500">
              <IconWarning size={48} className="mb-4 text-yellow-500" />
              <p>No farm connections found above threshold {minScore}</p>
              <p className="text-sm mt-1">Try lowering the minimum overlap score</p>
            </div>
          ) : (
            <ForceGraph2D
              ref={graphRef}
              graphData={graphData}
              width={document.body.clientWidth > 1280 ? 1200 : document.body.clientWidth - 100}
              height={600}
              nodeCanvasObject={paintNode}
              linkColor={linkColor}
              linkWidth={linkWidth}
              linkDirectionalParticles={2}
              linkDirectionalParticleWidth={(link) => link.score > 0.7 ? 3 : 0}
              onNodeClick={handleNodeClick}
              onNodeHover={(node) => setSelectedNode(node)}
              cooldownTicks={100}
              d3AlphaDecay={0.02}
              d3VelocityDecay={0.3}
              enableNodeDrag={true}
              enableZoomPanInteraction={true}
            />
          )}
        </div>
        
        {/* Selected Node Info */}
        {selectedNode && !modalOpen && (
          <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 animate-fade-in-scale">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: FARM_COLORS[selectedNode.farmId] || FARM_COLORS.default }}
                />
                <span className="font-medium text-gray-900 dark:text-white">@{selectedNode.id}</span>
                <a
                  href={`https://twitter.com/${selectedNode.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{selectedNode.connections} connections</span>
                <button
                  onClick={() => handleNodeClick(selectedNode)}
                  className="text-purple-500 hover:text-purple-600 font-medium"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Connections Table */}
        {data.edges.length > 0 && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden animate-fade-in-up">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <IconOverlapFarm size={20} className="text-red-500" />
                Farm Connections Table
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Click on any row to highlight the connection in the graph
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Account A</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Account B</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Overlap Score</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Shared Bots</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Risk</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {data.edges.map((edge, idx) => {
                    // Extract IDs - source/target may be objects or strings
                    const sourceId = typeof edge.source === 'object' ? edge.source.id : edge.source;
                    const targetId = typeof edge.target === 'object' ? edge.target.id : edge.target;
                    const riskLevel = edge.score > 0.7 ? 'HIGH' : edge.score > 0.5 ? 'MEDIUM' : 'LOW';
                    const riskColor = riskLevel === 'HIGH' ? 'bg-red-100 text-red-700' : riskLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700';
                    
                    return (
                      <tr 
                        key={idx}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition"
                        onClick={() => {
                          const nodeA = data.nodes.find(n => n.id === sourceId);
                          if (nodeA) setSelectedNode(nodeA);
                        }}
                      >
                        <td className="px-4 py-3">
                          <a
                            href={`https://twitter.com/${sourceId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-600 hover:underline font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            @{sourceId}
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <a
                            href={`https://twitter.com/${targetId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-600 hover:underline font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            @{targetId}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-red-500 rounded-full" 
                                style={{ width: `${(edge.score || 0) * 100}%` }}
                              />
                            </div>
                            <span className="text-gray-700 dark:text-gray-300 font-medium">
                              {((edge.score || 0) * 100).toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                          {edge.shared || 0}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${riskColor}`}>
                            {riskLevel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const nodeA = data.nodes.find(n => n.id === sourceId);
                              if (nodeA) handleNodeClick(nodeA);
                            }}
                            className="text-purple-500 hover:text-purple-600 text-xs font-medium"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      {/* Actor Details Modal */}
      <ActorDetailsModal
        isOpen={modalOpen}
        actor={selectedActor}
        loading={modalLoading}
        onClose={closeModal}
      />
    </div>
  );
}
