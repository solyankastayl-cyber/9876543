/**
 * ML Toggle Component (БЛОК 1 - FE-4)
 * 
 * Operator control over ML runtime
 * Priority: Kill Switch > Runtime Config > Default
 */
import React, { useState, useEffect } from 'react';

export function MLToggle() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchConfig();
    
    // Poll every 10 seconds
    const interval = setInterval(fetchConfig, 10000);
    return () => clearInterval(interval);
  }, []);
  
  async function fetchConfig() {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8002';
      const response = await fetch(`${backendUrl}/api/engine/ml/runtime`);
      const data = await response.json();
      
      if (data.ok) {
        setConfig(data.data);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error('Failed to fetch ML config:', err);
      setError('Failed to fetch ML config');
    }
  }
  
  async function handleModeChange(e) {
    const newMode = e.target.value;
    
    if (config?.killSwitchActive && newMode !== 'off') {
      alert('Cannot enable ML: Kill Switch is active');
      return;
    }
    
    setLoading(true);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8002';
      const response = await fetch(`${backendUrl}/api/engine/ml/runtime`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mlEnabled: newMode !== 'off',
          mlMode: newMode,
        }),
      });
      
      const data = await response.json();
      
      if (data.ok) {
        await fetchConfig();
      } else {
        alert(`Failed to update: ${data.error}\n${data.details || ''}`);
      }
    } catch (err) {
      alert('Failed to update ML mode');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }
  
  if (!config) {
    return (
      <div className="ml-toggle">
        <div className="text-sm text-gray-500">Loading ML config...</div>
      </div>
    );
  }
  
  const getModeColor = () => {
    if (config.killSwitchActive) return 'text-red-600';
    if (!config.mlEnabled || config.mlMode === 'off') return 'text-gray-500';
    if (config.mlMode === 'advisor') return 'text-blue-600';
    if (config.mlMode === 'assist') return 'text-green-600';
    return 'text-gray-500';
  };
  
  const getModeLabel = () => {
    if (config.killSwitchActive) return '⚠️ DISABLED (Kill Switch)';
    if (!config.mlEnabled || config.mlMode === 'off') return '○ OFF (Rules-only)';
    if (config.mlMode === 'advisor') return '◉ ADVISOR';
    if (config.mlMode === 'assist') return '◉ ASSIST';
    return 'Unknown';
  };
  
  return (
    <div className="ml-toggle p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-semibold text-gray-900">ML Advisor</label>
        {config.killSwitchActive && (
          <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
            Kill Switch Active
          </span>
        )}
      </div>
      
      <select
        value={config.mlMode || 'off'}
        onChange={handleModeChange}
        disabled={loading || config.killSwitchActive}
        className={`w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm ${getModeColor()} ${
          loading || config.killSwitchActive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        <option value="off">OFF - Rules-only mode</option>
        <option value="advisor">ADVISOR - Confidence/Risk adjustments</option>
        <option value="assist">ASSIST - Ranking within bucket</option>
      </select>
      
      <div className="mt-3 text-xs text-gray-600">
        <div className={`font-medium ${getModeColor()}`}>
          {getModeLabel()}
        </div>
        {config.disableReason && (
          <div className="mt-1 text-yellow-700">
            Reason: {config.disableReason}
          </div>
        )}
        {config.lastUpdate && (
          <div className="mt-1">
            Last update: {new Date(config.lastUpdate).toLocaleString()}
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-3 text-xs text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
      
      <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
        <div className="font-medium mb-1">About ML Advisor:</div>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>OFF:</strong> ML runs in shadow but has no influence</li>
          <li><strong>ADVISOR:</strong> ML influences confidence and risk scores (±10)</li>
          <li><strong>ASSIST:</strong> ML influences token ranking within same bucket (±10)</li>
        </ul>
        <div className="mt-2 font-medium text-orange-600">
          ⚠️ ML never changes BUY → SELL or bypasses gates
        </div>
      </div>
    </div>
  );
}
