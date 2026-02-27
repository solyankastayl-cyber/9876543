/**
 * BLOCK 80.3 — Consensus Timeline Card
 * 
 * 30-day consensus index sparkline with drift severity overlay.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// ═══════════════════════════════════════════════════════════════
// SPARKLINE CHART COMPONENT
// ═══════════════════════════════════════════════════════════════

function SparklineChart({ data, height = 120 }) {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const h = canvas.height;
    const padding = 20;
    
    // Clear
    ctx.clearRect(0, 0, width, h);
    
    // Draw background zones
    const drawZone = (yStart, yEnd, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(padding, yStart, width - padding * 2, yEnd - yStart);
    };
    
    // Zone boundaries (0-100 scale mapped to canvas)
    const mapY = (val) => h - padding - ((val / 100) * (h - padding * 2));
    
    // Critical zone (0-30)
    drawZone(mapY(30), mapY(0), 'rgba(239, 68, 68, 0.1)');
    // Warn zone (30-50)
    drawZone(mapY(50), mapY(30), 'rgba(245, 158, 11, 0.1)');
    // Watch zone (50-70)
    drawZone(mapY(70), mapY(50), 'rgba(252, 211, 77, 0.1)');
    // OK zone (70-100)
    drawZone(mapY(100), mapY(70), 'rgba(34, 197, 94, 0.1)');
    
    // Draw horizontal grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    [25, 50, 75].forEach(val => {
      const y = mapY(val);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    });
    
    // Draw line
    const stepX = (width - padding * 2) / Math.max(1, data.length - 1);
    
    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    
    data.forEach((point, i) => {
      const x = padding + i * stepX;
      const y = mapY(point.consensusIndex || 0);
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Draw points
    data.forEach((point, i) => {
      const x = padding + i * stepX;
      const y = mapY(point.consensusIndex || 0);
      
      // Point color based on severity
      let pointColor = '#3b82f6';
      if (point.driftSeverity === 'CRITICAL') pointColor = '#ef4444';
      else if (point.driftSeverity === 'WARN') pointColor = '#f59e0b';
      else if (point.driftSeverity === 'WATCH') pointColor = '#fcd34d';
      
      ctx.beginPath();
      ctx.fillStyle = pointColor;
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Lock indicator
      if (point.structuralLock) {
        ctx.fillStyle = '#ef4444';
        ctx.font = '10px sans-serif';
        ctx.fillText('🔒', x - 5, y - 8);
      }
    });
    
    // Draw Y-axis labels
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('100', padding - 5, mapY(100) + 3);
    ctx.fillText('75', padding - 5, mapY(75) + 3);
    ctx.fillText('50', padding - 5, mapY(50) + 3);
    ctx.fillText('25', padding - 5, mapY(25) + 3);
    ctx.fillText('0', padding - 5, mapY(0) + 3);
    
  }, [data]);
  
  return (
    <canvas 
      ref={canvasRef} 
      width={600} 
      height={height}
      className="w-full"
      style={{ maxWidth: '100%' }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════
// STATS DISPLAY
// ═══════════════════════════════════════════════════════════════

function TrendIndicator({ trend }) {
  const icons = {
    UP: { icon: '↑', color: 'text-green-600', bg: 'bg-green-100' },
    DOWN: { icon: '↓', color: 'text-red-600', bg: 'bg-red-100' },
    FLAT: { icon: '→', color: 'text-gray-600', bg: 'bg-gray-100' },
  };
  
  const { icon, color, bg } = icons[trend] || icons.FLAT;
  
  return (
    <span className={`px-2 py-0.5 rounded ${bg} ${color} text-sm font-medium`}>
      {icon} {trend}
    </span>
  );
}

function DriftCountBadge({ severity, count }) {
  const colors = {
    OK: 'bg-green-100 text-green-700',
    WATCH: 'bg-yellow-100 text-yellow-700',
    WARN: 'bg-orange-100 text-orange-700',
    CRITICAL: 'bg-red-100 text-red-700',
  };
  
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[severity] || ''}`}>
      {severity}: {count}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function ConsensusTimelineCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(30);

  const fetchTimeline = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/fractal/v2.1/admin/consensus/timeline?symbol=BTC&days=${days}`);
      const result = await res.json();
      
      if (result.ok) {
        setData(result);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  const handleWriteSnapshot = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/fractal/v2.1/admin/consensus/snapshot?symbol=BTC`, {
        method: 'POST',
      });
      await res.json();
      await fetchTimeline();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading && !data) {
    return (
      <div className="bg-white rounded-lg border p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  const { series = [], stats = {}, latest } = data || {};

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden" data-testid="consensus-timeline-card">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-900 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white">BLOCK 80.3 — Consensus Timeline</h3>
          <p className="text-xs text-slate-400">BTC · {days}D LIVE History</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="text-sm border rounded px-2 py-1 bg-slate-700 text-white border-slate-600"
          >
            <option value="7">7 Days</option>
            <option value="14">14 Days</option>
            <option value="30">30 Days</option>
            <option value="90">90 Days</option>
          </select>
          <button
            onClick={fetchTimeline}
            className="px-3 py-1 bg-slate-700 text-white text-sm rounded hover:bg-slate-600"
          >
            ↻
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-50 text-red-600 text-sm">{error}</div>
      )}

      {/* Stats Row */}
      <div className="px-4 py-3 bg-gray-50 border-b grid grid-cols-2 md:grid-cols-5 gap-4">
        <div>
          <div className="text-xs text-gray-500 uppercase">Avg Consensus</div>
          <div className="text-xl font-bold text-gray-900">{stats.avgConsensus || 0}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase">7D Trend</div>
          <div className="mt-1"><TrendIndicator trend={stats.trend7d || 'FLAT'} /></div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase">Lock Days</div>
          <div className="text-xl font-bold text-red-600">{stats.lockDays || 0}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase">Total Days</div>
          <div className="text-xl font-bold text-gray-900">{stats.totalDays || 0}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase mb-1">Drift Distribution</div>
          <div className="flex flex-wrap gap-1">
            {stats.driftCounts && Object.entries(stats.driftCounts).map(([sev, count]) => (
              count > 0 && <DriftCountBadge key={sev} severity={sev} count={count} />
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4">
        {series.length > 0 ? (
          <SparklineChart data={series} height={150} />
        ) : (
          <div className="h-32 flex items-center justify-center text-gray-500">
            No timeline data yet. Run daily pipeline to start collecting.
          </div>
        )}
      </div>

      {/* Latest Point */}
      {latest && (
        <div className="px-4 pb-4">
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 uppercase mb-2">Latest Snapshot ({latest.date})</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Consensus:</span>
                <span className="ml-2 font-medium">{latest.consensusIndex}</span>
              </div>
              <div>
                <span className="text-gray-500">Drift:</span>
                <span className={`ml-2 font-medium ${
                  latest.driftSeverity === 'CRITICAL' ? 'text-red-600' :
                  latest.driftSeverity === 'WARN' ? 'text-orange-600' :
                  latest.driftSeverity === 'WATCH' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {latest.driftSeverity}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Lock:</span>
                <span className={`ml-2 font-medium ${latest.structuralLock ? 'text-red-600' : 'text-green-600'}`}>
                  {latest.structuralLock ? '🔒 LOCKED' : '🔓 Open'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">LIVE Samples:</span>
                <span className="ml-2 font-medium">{latest.liveSamples || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 bg-gray-50 border-t">
        <button
          onClick={handleWriteSnapshot}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          Write Snapshot Now
        </button>
        <span className="ml-3 text-xs text-gray-500">
          Snapshots are auto-written during daily pipeline runs
        </span>
      </div>
    </div>
  );
}

export default ConsensusTimelineCard;
