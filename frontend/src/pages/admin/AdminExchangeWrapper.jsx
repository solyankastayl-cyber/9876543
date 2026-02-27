/**
 * Admin Exchange Wrapper
 * Wraps existing Exchange pages in AdminLayout for admin panel access
 */

import React, { Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { Loader2 } from 'lucide-react';

// Lazy load Exchange pages
const ExchangeOverviewPage = lazy(() => import('../ExchangeOverviewPage'));
const OrderFlowPage = lazy(() => import('../OrderFlowPage'));
const VolumeOIPage = lazy(() => import('../VolumeOIPage'));
const LiquidationsPage = lazy(() => import('../LiquidationsPage'));
const PatternsPage = lazy(() => import('../PatternsPage'));
const IndicatorsExplorerPage = lazy(() => import('../IndicatorsExplorerPage'));
const ExchangeMarketsPage = lazy(() => import('../ExchangeMarketsPage'));
const LabsPage = lazy(() => import('../LabsPage'));
const LabsRegimeForwardPage = lazy(() => import('../LabsRegimeForwardPage'));
const LabsRegimeAttributionPage = lazy(() => import('../LabsRegimeAttributionPage'));
const LabsPatternRiskPage = lazy(() => import('../LabsPatternRiskPage'));
const LabsSentimentInteractionPage = lazy(() => import('../LabsSentimentInteractionPage'));
const LabsWhaleRiskPage = lazy(() => import('../LabsWhaleRiskPage'));
const AlignmentExplorerPage = lazy(() => import('../AlignmentExplorerPage'));
const WhalePatternsPage = lazy(() => import('../WhalePatternsPage'));
const WhaleStatePage = lazy(() => import('../WhaleStatePage'));
const MLAdminPage = lazy(() => import('../MLAdminPage'));

const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
  </div>
);

// Path to component mapping
const getPageComponent = (pathname) => {
  // ML Admin
  if (pathname.includes('/exchange/ml')) return MLAdminPage;
  
  // Data pages
  if (pathname.includes('/data/overview')) return ExchangeOverviewPage;
  if (pathname.includes('/data/markets')) return ExchangeMarketsPage;
  if (pathname.includes('/data/orderflow')) return OrderFlowPage;
  if (pathname.includes('/data/volume')) return VolumeOIPage;
  if (pathname.includes('/data/indicators')) return IndicatorsExplorerPage;
  
  // Signals pages
  if (pathname.includes('/signals/liquidations')) return LiquidationsPage;
  if (pathname.includes('/signals/patterns')) return PatternsPage;
  
  // Labs pages
  if (pathname.includes('/labs/regime-forward')) return LabsRegimeForwardPage;
  if (pathname.includes('/labs/regime-attribution')) return LabsRegimeAttributionPage;
  if (pathname.includes('/labs/pattern-risk')) return LabsPatternRiskPage;
  if (pathname.includes('/labs/sentiment')) return LabsSentimentInteractionPage;
  if (pathname.includes('/labs/whale-risk')) return LabsWhaleRiskPage;
  if (pathname.includes('/labs/alignment')) return AlignmentExplorerPage;
  if (pathname.includes('/labs')) return LabsPage;
  
  // Whale pages
  if (pathname.includes('/whales/patterns')) return WhalePatternsPage;
  if (pathname.includes('/whales/state')) return WhaleStatePage;
  
  // Default
  return ExchangeOverviewPage;
};

export default function AdminExchangeWrapper() {
  const location = useLocation();
  
  const PageComponent = getPageComponent(location.pathname);
  
  return (
    <AdminLayout>
      <div className="admin-exchange-wrapper">
        <Suspense fallback={<PageLoader />}>
          <PageComponent />
        </Suspense>
      </div>
    </AdminLayout>
  );
}
