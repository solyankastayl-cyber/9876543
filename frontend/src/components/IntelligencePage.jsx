/**
 * PHASE 4 - БЛОК 4.6: Intelligence Page
 * Settings → Intelligence
 * 
 * Main ML observation dashboard
 */
import React, { useState } from 'react';
import MLHealthDashboard from './MLHealthDashboard';
import AlertsDashboard from './AlertsDashboard';
import ShadowRunExplorer from './ShadowRunExplorer';

const TAB_CONFIG = [
  { id: 'health', label: 'ML Health', icon: '❤️', testId: 'tab-ml-health' },
  { id: 'alerts', label: 'Alerts', icon: '🔔', testId: 'tab-alerts' },
  { id: 'runs', label: 'Shadow Runs', icon: '🔍', testId: 'tab-shadow-runs' },
];

export const IntelligencePage = () => {
  const [activeTab, setActiveTab] = useState('health');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Intelligence</h1>
          <p className="mt-2 text-sm text-gray-600">
            ML Shadow Evaluation & Readiness Monitoring
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {TAB_CONFIG.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                data-testid={tab.testId}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'health' && <MLHealthDashboard />}
          {activeTab === 'alerts' && <AlertsDashboard />}
          {activeTab === 'runs' && <ShadowRunExplorer />}
        </div>
      </div>
    </div>
  );
};

export default IntelligencePage;
