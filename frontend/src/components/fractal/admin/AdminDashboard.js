/**
 * BLOCK 50 + 57.2 + P1.5 — Admin Dashboard with Tabs
 * 
 * Institutional control panel for Fractal V2.1
 * Tab: Overview | Shadow Divergence | Volatility
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { GovernanceCard } from './GovernanceCard';
import { HealthCard } from './HealthCard';
import { ReliabilityCard } from './ReliabilityCard';
import { PerformanceCard } from './PerformanceCard';
import { GuardCard } from './GuardCard';
import { PlaybookCard } from './PlaybookCard';
import { TailRiskCard } from './TailRiskCard';
import { SnapshotTimeline } from './SnapshotTimeline';
import { WeeklyCronCard } from './WeeklyCronCard';
import { ShadowDivergencePanel } from './shadow';
import VolatilityTab from './VolatilityTab';
import AlertsTab from './AlertsTab';
import AttributionTab from './AttributionTab';
import GovernanceTab from './GovernanceTab';
import BackfillProgressPanel from './BackfillProgressPanel';
import DriftTab from './DriftTab';
import OpsTab from './OpsTab';
import IntelTab from './IntelTab';
import SpxAdminTab from './SpxAdminTab';
import SpxAttributionTab from './SpxAttributionTab';
import SpxCalibrationTab from './SpxCalibrationTab';
import SpxDriftTab from './SpxDriftTab';
import SpxRulesTab from './SpxRulesTab';
import SpxCrisisTab from './SpxCrisisTab';
import SpxDecadeTrackerTab from './SpxDecadeTrackerTab';
import SpxRegimesTab from './SpxRegimesTab';
import SpxConstitutionTab from './SpxConstitutionTab';
import SpxGovernanceTab from './SpxGovernanceTab';
import LifecycleTab from './LifecycleTab';
import { AssetSelector } from '../AssetSelector';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// Asset product info for different terminals
const ASSET_INFO = {
  BTC: { name: 'BTC Terminal', status: 'FINAL', color: 'orange', available: true },
  SPX: { name: 'SPX Terminal', status: 'BUILDING', color: 'blue', available: true },
  COMBINED: { name: 'Combined', status: 'BUILDING', color: 'purple', available: false },
};

// Tabs for BTC
const BTC_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'lifecycle', label: 'Lifecycle' },
  { id: 'shadow', label: 'Shadow Divergence' },
  { id: 'volatility', label: 'Volatility' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'attribution', label: 'Attribution' },
  { id: 'governance', label: 'Governance' },
  { id: 'drift', label: 'Drift' },
  { id: 'intel', label: 'Intel' },
  { id: 'backfill', label: 'Backfill' },
  { id: 'ops', label: 'Ops' }
];

// Tabs for SPX (Data Foundation + Attribution + Calibration + Drift + Rules + Crisis + Decade + Regimes + Constitution + Governance)
const SPX_TABS = [
  { id: 'data', label: 'Data Foundation' },
  { id: 'lifecycle', label: 'Lifecycle' },
  { id: 'spx_attribution', label: 'Attribution' },
  { id: 'spx_calibration', label: 'Calibration' },
  { id: 'spx_drift', label: 'Drift' },
  { id: 'spx_rules', label: 'Rules' },
  { id: 'spx_crisis', label: 'Crisis' },
  { id: 'spx_decade', label: 'Decade Tracker' },
  { id: 'spx_regimes', label: 'Regimes' },
  { id: 'spx_constitution', label: 'Constitution' },
  { id: 'spx_governance', label: 'Governance' },
];

// Get tabs based on asset
function getTabsForAsset(asset) {
  switch (asset) {
    case 'SPX': return SPX_TABS;
    case 'BTC':
    default: return BTC_TABS;
  }
}

export function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = searchParams.get('tab') || 'overview';
  const currentAsset = searchParams.get('asset') || 'BTC';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // Handle asset selection
  const handleAssetSelect = (assetId) => {
    const params = new URLSearchParams(searchParams);
    params.set('asset', assetId);
    setSearchParams(params, { replace: true });
    // Force refresh data
    setLoading(true);
  };
  
  const setActiveTab = (tabId) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', tabId);
    // Reset shadow params when switching away
    if (tabId !== 'shadow') {
      params.delete('preset');
      params.delete('h');
      params.delete('role');
    }
    setSearchParams(params, { replace: true });
  };

  const fetchData = useCallback(async () => {
    try {
      // Use asset-specific API endpoint or fall back to fractal
      const apiPath = currentAsset === 'BTC' 
        ? `/api/fractal/v2.1/admin/overview?symbol=BTC`
        : `/api/${currentAsset.toLowerCase()}/v2.1/status`;
      
      const response = await fetch(`${API_BASE}${apiPath}`);
      if (!response.ok) throw new Error('Failed to fetch admin overview');
      const result = await response.json();
      setData(result);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentAsset]);
  
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);
  
  const handleApplyPlaybook = async (playbookType) => {
    try {
      const response = await fetch(`${API_BASE}/api/fractal/v2.1/admin/playbook/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: playbookType,
          confirm: true,
          actor: 'ADMIN',
          reason: 'Applied from Admin Dashboard',
        }),
      });
      
      if (!response.ok) throw new Error('Failed to apply playbook');
      await fetchData();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };
  
  // Loading state - only for Overview tab
  if (loading && activeTab === 'overview') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  const assetInfo = ASSET_INFO[currentAsset] || ASSET_INFO.BTC;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {assetInfo.name} — Institutional Panel
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    assetInfo.status === 'FINAL' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {assetInfo.status}
                  </span>
                  <span className="text-sm text-gray-500">v2.1</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Asset Selector */}
              <AssetSelector 
                currentAsset={currentAsset} 
                onSelect={handleAssetSelect}
              />
              
              <span className="text-xs text-gray-400">
                Last update: {lastUpdate?.toLocaleTimeString() || '—'}
              </span>
              <button
                onClick={fetchData}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
                data-testid="refresh-btn"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 border-b border-gray-200 -mb-px">
            {getTabsForAsset(currentAsset).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                data-testid={`tab-${tab.id}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>
      
      {/* Tab Content */}
      {currentAsset === 'SPX' ? (
        /* SPX Tabs */
        activeTab === 'data' ? (
          <div className="max-w-7xl mx-auto px-4 py-6">
            <SpxAdminTab />
          </div>
        ) : activeTab === 'lifecycle' ? (
          <LifecycleTab />
        ) : activeTab === 'spx_attribution' ? (
          <div className="max-w-7xl mx-auto px-4 py-6">
            <SpxAttributionTab />
          </div>
        ) : activeTab === 'spx_calibration' ? (
          <div className="max-w-7xl mx-auto px-4 py-6">
            <SpxCalibrationTab />
          </div>
        ) : activeTab === 'spx_drift' ? (
          <SpxDriftTab />
        ) : activeTab === 'spx_rules' ? (
          <SpxRulesTab />
        ) : activeTab === 'spx_crisis' ? (
          <SpxCrisisTab />
        ) : activeTab === 'spx_decade' ? (
          <SpxDecadeTrackerTab />
        ) : activeTab === 'spx_regimes' ? (
          <SpxRegimesTab />
        ) : activeTab === 'spx_constitution' ? (
          <SpxConstitutionTab />
        ) : activeTab === 'spx_governance' ? (
          <SpxGovernanceTab />
        ) : (
          <div className="max-w-7xl mx-auto px-4 py-6">
            <SpxAdminTab />
          </div>
        )
      ) : activeTab === 'overview' ? (
        <OverviewTab 
          data={data} 
          error={error} 
          fetchData={fetchData}
          handleApplyPlaybook={handleApplyPlaybook}
        />
      ) : activeTab === 'lifecycle' ? (
        <LifecycleTab />
      ) : activeTab === 'shadow' ? (
        <ShadowDivergencePanel />
      ) : activeTab === 'volatility' ? (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <VolatilityTab />
        </div>
      ) : activeTab === 'alerts' ? (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <AlertsTab />
        </div>
      ) : activeTab === 'attribution' ? (
        <AttributionTab />
      ) : activeTab === 'governance' ? (
        <GovernanceTab />
      ) : activeTab === 'drift' ? (
        <DriftTab />
      ) : activeTab === 'intel' ? (
        <IntelTab />
      ) : activeTab === 'backfill' ? (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <BackfillProgressPanel />
        </div>
      ) : activeTab === 'ops' ? (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <OpsTab />
        </div>
      ) : (
        <ShadowDivergencePanel />
      )}
      
      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Fractal V2.1</span>
            <span>Institutional Risk Governance Dashboard</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * Overview Tab (Original Admin Dashboard content)
 */
function OverviewTab({ data, error, fetchData, handleApplyPlaybook }) {
  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center p-6 bg-red-50 rounded-xl border border-red-200 max-w-md">
          <p className="text-red-600 font-medium mb-2">Error loading dashboard</p>
          <p className="text-red-500 text-sm">{error}</p>
          <button 
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      {/* Top Row - Critical Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <GovernanceCard governance={data?.governance} />
        <HealthCard health={data?.health} />
        <GuardCard guard={data?.guard} />
      </div>
      
      {/* Middle Row - Model Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <ReliabilityCard model={data?.model} />
        <TailRiskCard model={data?.model} />
        <PerformanceCard performance={data?.performance} />
      </div>
      
      {/* Bottom Row - Actions & History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <PlaybookCard 
          recommendation={data?.recommendation} 
          onApply={handleApplyPlaybook}
        />
        <SnapshotTimeline recent={data?.recent} />
      </div>
      
      {/* BLOCK 76.2.2: Weekly Cron Control */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <WeeklyCronCard />
      </div>
    </main>
  );
}

export default AdminDashboard;
