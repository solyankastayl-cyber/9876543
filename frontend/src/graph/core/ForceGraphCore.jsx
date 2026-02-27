/**
 * ForceGraphCore - ЕДИНОЕ ЯДРО для Influence и Routers
 * 
 * Использует react-force-graph-2d с кастомными рендерами
 * 
 * ЖЁСТКИЕ ПРАВИЛА:
 * - Один компонент для ОБОИХ графов
 * - Edge snapping к окружностям
 * - Лейблы 0xABCD…1234
 * - Только IN (зелёный) и OUT (красный)
 * - drag/zoom/pan всегда включены
 */

import React, { useRef, useCallback, useState, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { drawNode, getNodeRadius } from '../render/drawNode.js';
import { drawLink } from '../render/drawLink.js';

/**
 * ForceGraphCore Component
 * 
 * @param {Object} props
 * @param {Object} props.data - { nodes: [], links: [] }
 * @param {Function} props.onNodeClick - callback при клике на узел
 * @param {Function} props.onNodeHover - callback при hover на узел
 * @param {Function} props.onLinkHover - callback при hover на ребро
 * @param {Function} props.onBackgroundClick - callback при клике на фон
 * @param {string} props.selectedNodeId - id выбранного узла
 * @param {Set} props.activePathIds - set of node/link ids в активном пути
 * @param {boolean} props.fitOnLoad - zoomToFit при загрузке
 * @param {number} props.width - ширина canvas
 * @param {number} props.height - высота canvas
 */
function ForceGraphCore({
  data,
  onNodeClick,
  onNodeHover,
  onLinkHover,
  onBackgroundClick,
  selectedNodeId,
  activePathIds,
  fitOnLoad = true,
  width,
  height,
}) {
  const fgRef = useRef(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  
  // ============ FIT ON LOAD ============
  useEffect(() => {
    if (!fitOnLoad || !fgRef.current) return;
    
    const timer = setTimeout(() => {
      try {
        fgRef.current?.zoomToFit?.(400, 50);
      } catch (e) {
        // ignore
      }
    }, 150);
    
    return () => clearTimeout(timer);
  }, [fitOnLoad, data?.nodes?.length]);
  
  // ============ FORCE CONFIGURATION ============
  useEffect(() => {
    if (!fgRef.current) return;
    
    const fg = fgRef.current;
    
    // Настройки сил (как в референсе Arkham) — БОЛЕЕ РАЗДВИНУТЫЙ ГРАФ
    fg.d3Force('charge')?.strength(-200);      // Сильнее отталкивание
    fg.d3Force('link')?.distance(120);         // Больше расстояние
    fg.d3Force('center')?.strength(0.15);      // Слабее притяжение к центру
    fg.d3VelocityDecay?.(0.3);                 // Умеренное затухание
    
  }, [data]);
  
  // ============ NODE DRAG ============
  const handleNodeDrag = useCallback((node) => {
    if (node) {
      node.fx = node.x;
      node.fy = node.y;
    }
  }, []);
  
  const handleNodeDragEnd = useCallback((node) => {
    if (node) {
      // Фиксируем позицию после перетаскивания
      node.fx = node.x;
      node.fy = node.y;
    }
  }, []);
  
  // ============ NODE CLICK ============
  const handleNodeClick = useCallback((node) => {
    onNodeClick?.(node);
  }, [onNodeClick]);
  
  // ============ NODE HOVER ============
  const handleNodeHover = useCallback((node) => {
    setHoveredNodeId(node?.id || null);
    onNodeHover?.(node);
    
    // Cursor
    if (typeof document !== 'undefined') {
      document.body.style.cursor = node ? 'pointer' : 'default';
    }
  }, [onNodeHover]);
  
  // ============ LINK HOVER ============
  const handleLinkHover = useCallback((link) => {
    onLinkHover?.(link);
  }, [onLinkHover]);
  
  // ============ BACKGROUND CLICK ============
  const handleBackgroundClick = useCallback(() => {
    onBackgroundClick?.();
  }, [onBackgroundClick]);
  
  // ============ CUSTOM NODE RENDER ============
  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const selected = node.id === selectedNodeId;
    const hovered = node.id === hoveredNodeId;
    
    // Active Path Mode: dim nodes not in path
    let dimmed = false;
    if (activePathIds && activePathIds.size > 0) {
      dimmed = !activePathIds.has(node.id);
    }
    
    drawNode(node, ctx, globalScale, { selected, hovered, dimmed });
  }, [selectedNodeId, hoveredNodeId, activePathIds]);
  
  // ============ CUSTOM LINK RENDER ============
  const linkCanvasObject = useCallback((link, ctx, globalScale) => {
    // Active Path Mode
    let active = false;
    let dimmed = false;
    
    if (activePathIds && activePathIds.size > 0) {
      const linkId = link.id || `${link.source?.id || link.source}-${link.target?.id || link.target}`;
      active = activePathIds.has(linkId);
      dimmed = !active;
    }
    
    drawLink(link, ctx, globalScale, { active, dimmed });
  }, [activePathIds]);
  
  // ============ NODE POINTER AREA ============
  const nodePointerAreaPaint = useCallback((node, color, ctx) => {
    const r = getNodeRadius(node);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(node.x, node.y, r + 4, 0, Math.PI * 2);
    ctx.fill();
  }, []);
  
  // ============ RENDER ============
  // Защита от пустых данных
  const safeData = {
    nodes: data?.nodes || [],
    links: data?.links || [],
  };
  
  // Не рендерим если нет данных
  if (!safeData.nodes.length) {
    return (
      <div style={{ 
        width, 
        height, 
        backgroundColor: '#0a0e1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#666'
      }}>
        Loading graph...
      </div>
    );
  }
  
  return (
    <ForceGraph2D
      ref={fgRef}
      graphData={safeData}
      width={width}
      height={height}
      backgroundColor="#0a0e1a"
      
      // Node rendering
      nodeCanvasObject={nodeCanvasObject}
      nodePointerAreaPaint={nodePointerAreaPaint}
      nodeRelSize={6}
      
      // Link rendering
      linkCanvasObjectMode={() => 'replace'}
      linkCanvasObject={linkCanvasObject}
      linkWidth={1}
      linkDirectionalParticles={0}
      
      // Interaction
      enableNodeDrag={true}
      enableZoomInteraction={true}
      enablePanInteraction={true}
      onNodeDrag={handleNodeDrag}
      onNodeDragEnd={handleNodeDragEnd}
      onNodeClick={handleNodeClick}
      onNodeHover={handleNodeHover}
      onLinkHover={handleLinkHover}
      onBackgroundClick={handleBackgroundClick}
      
      // Physics
      warmupTicks={80}
      cooldownTicks={140}
      d3VelocityDecay={0.25}
      d3AlphaDecay={0.02}
    />
  );
}

export default ForceGraphCore;
