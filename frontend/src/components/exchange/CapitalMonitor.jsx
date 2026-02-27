/**
 * Capital Monitor Widget
 * ======================
 * 
 * v4.8.0 - Read-only monitoring widget for Exchange module.
 * Displays capital metrics, exposure status, and mini equity chart.
 * 
 * Design: Compact, collapsible, non-intrusive.
 */

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/api/client';

// ═══════════════════════════════════════════════════════════════
// KPI CARD COMPONENT
// ═══════════════════════════════════════════════════════════════

function KpiCard({ label, value, suffix = '', status = 'neutral' }) {
  const statusColors = {
    good: 'text-green-600',
    bad: 'text-red-600',
    warning: 'text-yellow-600',
    neutral: 'text-gray-700',
  };
  
  return (
    <div className="bg-gray-100 rounded-lg p-3 text-center border border-gray-200">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-lg font-bold ${statusColors[status]}`}>
        {value}{suffix}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MINI EQUITY CHART (Simple SVG)
// ═══════════════════════════════════════════════════════════════

function MiniEquityChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-24 flex items-center justify-center text-gray-500 text-sm">
        No equity data available
      </div>
    );
  }
  
  // Normalize data for SVG
  const values = data.map(p => p.equity);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;
  
  const width = 100;
  const height = 60;
  const padding = 2;
  
  const points = data.map((p, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((p.equity - minVal) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');
  
  // Determine color based on trend
  const startEquity = data[0]?.equity || 0;
  const endEquity = data[data.length - 1]?.equity || 0;
  const isPositive = endEquity >= startEquity;
  const strokeColor = isPositive ? '#16a34a' : '#dc2626';
  
  return (
    <div className="h-24 w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        {/* Grid lines */}
        <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="2,2" />
        
        {/* Equity line */}
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          points={points}
        />
        
        {/* Fill area */}
        <polygon
          fill={`${strokeColor}15`}
          points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
        />
      </svg>
      
      <div className="flex justify-between text-xs text-gray-600 mt-1">
        <span>${startEquity.toLocaleString()}</span>
        <span>${endEquity.toLocaleString()}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function CapitalMonitor() {
  const [expanded, setExpanded] = useState(true);
  const [summary, setSummary] = useState(null);
  const [equity, setEquity] = useState([]);
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch data
  const fetchData = async () => {
    try {
      const [summaryRes, equityRes, riskRes] = await Promise.all([
        api.get('/api/admin/exchange-ml/monitor/summary'),
        api.get('/api/admin/exchange-ml/monitor/equity?days=365'),
        api.get('/api/admin/exchange-ml/monitor/risk'),
      ]);
      
      if (summaryRes.data?.ok) {
        setSummary(summaryRes.data.data);
      }
      if (equityRes.data?.ok) {
        setEquity(equityRes.data.data || []);
      }
      if (riskRes.data?.ok) {
        setRisk(riskRes.data.data);
      }
      setError(null);
    } catch (err) {
      console.error('[CapitalMonitor] Fetch error:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
    // Poll every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);
  
  // Get status colors
  const getMaxDDStatus = (dd) => {
    if (dd < 20) return 'good';
    if (dd < 25) return 'warning';
    return 'bad';
  };
  
  const getSharpeStatus = (sharpe) => {
    if (sharpe > 0.2) return 'good';
    if (sharpe > 0) return 'warning';
    return 'bad';
  };
  
  const getWinRateStatus = (wr) => {
    if (wr > 55) return 'good';
    if (wr > 48) return 'warning';
    return 'bad';
  };
  
  const getRiskBadge = () => {
    if (!risk) return null;
    const config = {
      OK: { color: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle },
      WARNING: { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: AlertTriangle },
      CRITICAL: { color: 'bg-red-100 text-red-700 border-red-300', icon: XCircle },
    };
    const c = config[risk.status];
    const Icon = c.icon;
    return (
      <Badge variant="outline" className={`${c.color} border`}>
        <Icon className="w-3 h-3 mr-1" />
        {risk.status}
      </Badge>
    );
  };
  
  const getRegimeBadge = (regime) => {
    const config = {
      BULL: 'bg-green-100 text-green-700',
      BEAR: 'bg-red-100 text-red-700',
      CHOP: 'bg-yellow-100 text-yellow-700',
      UNKNOWN: 'bg-gray-100 text-gray-600',
    };
    return (
      <Badge variant="outline" className={config[regime] || config.UNKNOWN}>
        {regime}
      </Badge>
    );
  };
  
  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader 
        className="cursor-pointer py-3 px-4" 
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {summary?.freeze?.frozen ? (
              <Lock className="w-4 h-4 text-blue-600" />
            ) : (
              <Unlock className="w-4 h-4 text-gray-500" />
            )}
            <CardTitle className="text-sm font-medium text-gray-900">
              Capital Monitor
            </CardTitle>
            {summary?.freeze?.frozen && (
              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 text-xs">
                FROZEN v{summary.freeze.version}
              </Badge>
            )}
            {getRiskBadge()}
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </CardHeader>
      
      {expanded && (
        <CardContent className="pt-0 px-4 pb-4">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <Activity className="w-5 h-5 animate-pulse mr-2" />
              Loading...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-32 text-red-600">
              <AlertTriangle className="w-5 h-5 mr-2" />
              {error}
            </div>
          ) : summary ? (
            <div className="space-y-4">
              {/* KPI Row */}
              <div className="grid grid-cols-4 gap-2">
                <KpiCard 
                  label="MaxDD" 
                  value={summary.capital.maxDrawdownPct.toFixed(1)} 
                  suffix="%" 
                  status={getMaxDDStatus(summary.capital.maxDrawdownPct)}
                />
                <KpiCard 
                  label="Sharpe" 
                  value={summary.capital.sharpeLike.toFixed(2)} 
                  status={getSharpeStatus(summary.capital.sharpeLike)}
                />
                <KpiCard 
                  label="WinRate" 
                  value={summary.capital.tradeWinRate.toFixed(1)} 
                  suffix="%" 
                  status={getWinRateStatus(summary.capital.tradeWinRate)}
                />
                <KpiCard 
                  label="Expect" 
                  value={summary.capital.expectancyPct.toFixed(3)} 
                  suffix="%" 
                  status={summary.capital.expectancyPct > 0 ? 'good' : 'bad'}
                />
              </div>
              
              {/* Status Row */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">Position:</span>
                    <span className="text-gray-700">
                      {summary.exposure.activePositions} / {summary.exposure.maxAllowed}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">Regime:</span>
                    {getRegimeBadge(summary.regime.current)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">Rollbacks:</span>
                    <span className="text-green-600">{summary.lifecycle.rollbacks365d}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">Promos:</span>
                    <span className="text-green-600">{summary.lifecycle.promotions365d}</span>
                  </div>
                </div>
              </div>
              
              {/* Mini Equity Chart */}
              <div className="border-t border-gray-200 pt-3">
                <div className="text-xs text-gray-500 mb-2">Equity Curve (365d)</div>
                <MiniEquityChart data={equity} />
              </div>
              
              {/* Risk reasons */}
              {risk && risk.reasons.length > 0 && (
                <div className="border-t border-gray-200 pt-3">
                  <div className="text-xs text-gray-500 mb-1">Status</div>
                  <ul className="text-xs space-y-0.5">
                    {risk.reasons.map((r, i) => (
                      <li key={i} className={risk.status === 'OK' ? 'text-green-600' : 'text-yellow-600'}>
                        • {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
      )}
    </Card>
  );
}
