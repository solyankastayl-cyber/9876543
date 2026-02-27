/**
 * P2.4.3: Graph Share Page
 * 
 * Read-only viewer for shared graph snapshots.
 * Features:
 * - View calibrated graph
 * - Download as PNG
 * - No editing/filters
 * 
 * P2.5: Uses Flow Layout Engine
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Share2, Loader2, AlertTriangle, Network, ExternalLink } from 'lucide-react';
import { downloadGraphPNG, calculateExportDimensions, prepareNodesForExport } from '../../graph/export/png_exporter';
import { DIRECTION_COLORS } from '../../graph/calibrated.adapter';
import {
  getNodeBucket,
  getEdgePath,
  getEdgeStrokeWidth,
  buildCorridors,
  shortenAddress,
} from '../../graph/layout/flowLayoutEngine';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// ============================================
// Shared Graph Component (P2.5: Flow Layout)
// ============================================

function SharedGraph({ nodes, edges }) {
  const width = 700;
  const height = 500;
  
  // P2.5: Build corridors for strand-first geometry
  const corridors = useMemo(() => {
    return buildCorridors(edges);
  }, [edges]);
  
  // P2.5: Assign corridor index/total to each edge
  const edgesWithCorridor = useMemo(() => {
    const edgeMap = new Map();
    corridors.forEach(corridor => {
      corridor.edges.forEach((edge, index) => {
        edgeMap.set(edge.id, {
          ...edge,
          corridorIndex: index,
          corridorTotal: corridor.edges.length,
        });
      });
    });
    return edges.map(e => edgeMap.get(e.id) || e);
  }, [edges, corridors]);
  
  // P2.5: Position nodes with rank-based sizing
  const positionedNodes = useMemo(() => {
    if (nodes.length === 0) return [];
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;
    
    return nodes.map((node, i) => {
      const bucket = getNodeBucket(node.sizeWeight);
      return {
        ...node,
        x: centerX + radius * Math.cos((2 * Math.PI * i) / nodes.length),
        y: centerY + radius * Math.sin((2 * Math.PI * i) / nodes.length),
        radius: bucket.radius,
        fontSize: bucket.fontSize,
      };
    });
  }, [nodes, width, height]);
  
  // Create node lookup
  const nodeMap = useMemo(() => {
    const map = new Map();
    positionedNodes.forEach(n => map.set(n.id, n));
    return map;
  }, [positionedNodes]);
  
  // P2.5: Generate edge path using flow layout engine
  const renderEdgePath = useCallback((edge) => {
    const from = nodeMap.get(edge.fromNodeId);
    const to = nodeMap.get(edge.toNodeId);
    if (!from || !to) return null;
    
    return getEdgePath({
      sx: from.x,
      sy: from.y,
      tx: to.x,
      ty: to.y,
      index: edge.corridorIndex || 0,
      total: edge.corridorTotal || 1,
    });
  }, [nodeMap]);
  
  return (
    <svg 
      width={width} 
      height={height} 
      className="bg-[#0F0F0F] rounded-xl"
      data-testid="shared-graph-svg"
    >
      {/* Edges - P2.5: Corridor-first geometry */}
      <g>
        {edgesWithCorridor.map(edge => {
          const path = renderEdgePath(edge);
          if (!path) return null;
          
          const isOut = edge.direction === 'OUT';
          const strokeWidth = getEdgeStrokeWidth(edge.weight);
          
          return (
            <path
              key={edge.id}
              d={path}
              fill="none"
              stroke={isOut ? DIRECTION_COLORS.OUT : DIRECTION_COLORS.IN}
              strokeWidth={strokeWidth}
              strokeOpacity={0.8}
              strokeLinecap="round"
            />
          );
        })}
      </g>
      
      {/* Nodes - P2.5: Rank-based sizing */}
      <g>
        {positionedNodes.map(node => {
          const nodeRadius = node.radius;
          const fontSize = node.fontSize;
          const maxLabelChars = nodeRadius < 24 ? 6 : nodeRadius < 30 ? 7 : 9;
          const label = shortenAddress(node.displayName || node.label || '', maxLabelChars);
          
          return (
            <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
              <circle r={nodeRadius} fill="white" stroke="#6366F1" strokeWidth={2} />
              <text
                textAnchor="middle"
                dy="0.35em"
                fontSize={fontSize}
                fontWeight="600"
                fill="#6366F1"
              >
                {label}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function GraphSharePage() {
  const { shareId } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareData, setShareData] = useState(null);
  const [downloading, setDownloading] = useState(false);
  
  // Fetch shared snapshot
  useEffect(() => {
    async function fetchShare() {
      if (!shareId) {
        setError('No share ID provided');
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`${API_URL}/api/graph-intelligence/share/${shareId}`);
        const data = await response.json();
        
        if (!data.ok) {
          setError(data.error || 'Failed to load shared graph');
        } else {
          setShareData(data.data);
        }
      } catch (err) {
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    }
    
    fetchShare();
  }, [shareId]);
  
  // Handle PNG download
  const handleDownload = useCallback(async () => {
    if (!shareData) return;
    
    setDownloading(true);
    
    try {
      // Simple layout for export
      const width = 800;
      const height = 600;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.35;
      
      const positionedNodes = (shareData.nodes || []).map((node, i) => ({
        ...node,
        x: centerX + radius * Math.cos((2 * Math.PI * i) / shareData.nodes.length),
        y: centerY + radius * Math.sin((2 * Math.PI * i) / shareData.nodes.length),
      }));
      
      await downloadGraphPNG({
        nodes: positionedNodes,
        edges: shareData.edges || [],
        corridors: shareData.corridors || [],
        width,
        height,
        isCalibrated: true,
        scale: 2,
        address: shareData.address,
        snapshotId: shareData.snapshotId,
      });
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  }, [shareData]);
  
  // Copy share link
  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
  }, []);
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading shared graph...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Link Not Found</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <a 
            href="/graph-intelligence" 
            className="text-indigo-400 hover:text-indigo-300 flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Go to Graph Intelligence
          </a>
        </div>
      </div>
    );
  }
  
  const nodes = shareData?.nodes || [];
  const edges = shareData?.edges || [];
  const calibrationMeta = shareData?.calibrationMeta;
  
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Network className="w-6 h-6 text-indigo-500" />
            <div>
              <h1 className="font-bold text-lg">Shared Influence Graph</h1>
              {shareData?.address && (
                <p className="text-sm text-gray-400 font-mono">
                  {shareData.address.slice(0, 10)}...{shareData.address.slice(-8)}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center gap-2 text-sm transition-colors"
              data-testid="copy-link-btn"
            >
              <Share2 className="w-4 h-4" />
              Copy Link
            </button>
            
            {/* Download PNG */}
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center gap-2 text-sm transition-colors disabled:opacity-50"
              data-testid="download-png-btn"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download PNG
            </button>
          </div>
        </div>
      </header>
      
      {/* Graph */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          {/* Stats */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>{nodes.length} nodes</span>
              <span>•</span>
              <span>{edges.length} edges</span>
              {calibrationMeta && (
                <>
                  <span>•</span>
                  <span className="px-2 py-0.5 bg-green-900/50 text-green-400 rounded text-xs">
                    {calibrationMeta.version || 'Calibrated'}
                  </span>
                </>
              )}
            </div>
            
            {shareData?.accessCount && (
              <span className="text-xs text-gray-500">
                Viewed {shareData.accessCount} times
              </span>
            )}
          </div>
          
          {/* Graph View */}
          <div className="flex justify-center">
            <SharedGraph nodes={nodes} edges={edges} />
          </div>
          
          {/* Legend */}
          <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 rounded" style={{ backgroundColor: DIRECTION_COLORS.IN }} />
              <span>Incoming</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 rounded" style={{ backgroundColor: DIRECTION_COLORS.OUT }} />
              <span>Outgoing</span>
            </div>
            <span className="italic">thickness = weight</span>
          </div>
        </div>
        
        {/* Expiry Notice */}
        {shareData?.expiresAt && (
          <p className="text-center text-xs text-gray-500 mt-4">
            This link expires {new Date(shareData.expiresAt).toLocaleDateString()}
          </p>
        )}
      </main>
    </div>
  );
}
