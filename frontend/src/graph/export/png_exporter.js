/**
 * P2.4.2: PNG Exporter
 * 
 * Public API for exporting graph as PNG.
 * Uses canvas renderer for deterministic output.
 * 
 * Usage:
 *   const blob = await exportGraphPNG({ nodes, edges, width, height });
 *   downloadBlob(blob, 'graph.png');
 */

import { createExportCanvas, renderGraph } from './png_renderer';

// ============================================
// Configuration
// ============================================

const DEFAULT_EXPORT_CONFIG = {
  scale: 2,           // Retina
  padding: 60,        // Pixels around graph
  background: '#0F0F0F',
  filename: 'influence-graph',
};

// ============================================
// Export Functions
// ============================================

/**
 * Export graph as PNG Blob
 * 
 * @param {object} params
 * @param {Array} params.nodes - Positioned nodes with x, y, sizeWeight, etc
 * @param {Array} params.edges - Edges with fromNodeId, toNodeId, weight, direction
 * @param {Array} params.corridors - Optional corridors
 * @param {number} params.width - Viewport width
 * @param {number} params.height - Viewport height
 * @param {boolean} params.isCalibrated - Show calibrated badge
 * @param {number} params.scale - Export scale (1 or 2)
 * @param {string} params.background - Background color
 * @returns {Promise<Blob>} PNG blob
 */
export async function exportGraphPNG({
  nodes,
  edges,
  corridors = [],
  width,
  height,
  isCalibrated = true,
  scale = DEFAULT_EXPORT_CONFIG.scale,
  background = DEFAULT_EXPORT_CONFIG.background,
}) {
  // Create offscreen canvas
  const { canvas, ctx } = createExportCanvas(width, height, scale);
  
  // Render graph
  renderGraph({
    ctx,
    width,
    height,
    nodes,
    edges,
    corridors,
    isCalibrated,
  });
  
  // Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create PNG blob'));
        }
      },
      'image/png',
      1.0
    );
  });
}

/**
 * Export and download graph as PNG file
 * 
 * @param {object} params - Same as exportGraphPNG
 * @param {string} params.filename - Download filename (without extension)
 * @param {string} params.address - Optional address for filename
 * @param {string} params.snapshotId - Optional snapshot ID for filename
 */
export async function downloadGraphPNG({
  nodes,
  edges,
  corridors = [],
  width,
  height,
  isCalibrated = true,
  scale = DEFAULT_EXPORT_CONFIG.scale,
  background = DEFAULT_EXPORT_CONFIG.background,
  filename,
  address,
  snapshotId,
}) {
  // Generate filename
  let exportFilename = filename || DEFAULT_EXPORT_CONFIG.filename;
  if (address) {
    exportFilename = `graph-${address.slice(0, 10)}`;
  }
  if (snapshotId) {
    exportFilename += `-${snapshotId.slice(0, 8)}`;
  }
  exportFilename += '.png';
  
  // Export to blob
  const blob = await exportGraphPNG({
    nodes,
    edges,
    corridors,
    width,
    height,
    isCalibrated,
    scale,
    background,
  });
  
  // Trigger download
  downloadBlob(blob, exportFilename);
  
  return { blob, filename: exportFilename };
}

/**
 * Download blob as file
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get export dimensions from graph bounds
 */
export function calculateExportDimensions(nodes, padding = 60) {
  if (!nodes || nodes.length === 0) {
    return { width: 800, height: 600, offsetX: 0, offsetY: 0 };
  }
  
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  
  nodes.forEach(node => {
    const radius = node.radius || 30;
    minX = Math.min(minX, node.x - radius);
    minY = Math.min(minY, node.y - radius);
    maxX = Math.max(maxX, node.x + radius);
    maxY = Math.max(maxY, node.y + radius);
  });
  
  return {
    width: Math.max(400, maxX - minX + padding * 2),
    height: Math.max(300, maxY - minY + padding * 2),
    offsetX: -minX + padding,
    offsetY: -minY + padding,
  };
}

/**
 * Prepare nodes for export (add position offset)
 */
export function prepareNodesForExport(nodes, offsetX = 0, offsetY = 0) {
  return nodes.map(node => ({
    ...node,
    x: (node.x || 0) + offsetX,
    y: (node.y || 0) + offsetY,
  }));
}
