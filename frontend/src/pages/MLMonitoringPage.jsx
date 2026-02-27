/**
 * P1: ML Monitoring Dashboard Page
 * One-glance view of ML state and safety
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, ChevronLeft, RefreshCw, Eye
} from 'lucide-react';
import {
  MLLifecycleTimeline,
  WhyMLBlockedCard,
  KillSwitchHistory,
  MLInfluenceScope,
  MinimalRegressionPanel,
} from '../components/monitoring/MLMonitoringDashboard';
import { SystemRuntimeStatus } from '../components/SystemRuntimeStatus';

export default function MLMonitoringPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ML Monitoring</h1>
                <p className="text-sm text-gray-500">Real-time ML state & safety overview</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              
              <Link
                to="/settings"
                className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Settings
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* System Runtime Status - TOP */}
        <div className="mb-6">
          <SystemRuntimeStatus key={`status-${refreshKey}`} />
        </div>

        {/* Top Row: Lifecycle + Why Blocked */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <MLLifecycleTimeline key={`lifecycle-${refreshKey}`} />
          <WhyMLBlockedCard key={`blocked-${refreshKey}`} />
        </div>

        {/* Middle Row: Influence Scope + Regression */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <MLInfluenceScope />
          <MinimalRegressionPanel key={`regression-${refreshKey}`} />
        </div>

        {/* Bottom Row: Kill Switch History */}
        <KillSwitchHistory key={`killswitch-${refreshKey}`} limit={10} />

        {/* Footer note */}
        <div className="mt-6 p-4 bg-gray-100 rounded-xl text-center">
          <p className="text-xs text-gray-600">
            <strong>Investor-ready view:</strong> All data is real-time. No controls, only observation.
          </p>
        </div>
      </main>
    </div>
  );
}
