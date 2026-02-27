import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { Suspense, lazy } from "react";
import { WebSocketProvider } from "./context/WebSocketContext.jsx";
import { ActivePathProvider } from "./context/ActivePathContext.jsx"; // ETAP C
import { AdminAuthProvider } from "./context/AdminAuthContext.jsx";
import AppLayout from "./layout/AppLayout";
import { useDashboard } from "./hooks/useDashboard";

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      <p className="text-sm text-gray-500 font-medium">Loading...</p>
    </div>
  </div>
);

// Lazy loaded pages - Code Splitting
// Critical pages (loaded immediately for fast initial render)
import MarketDiscovery from "./pages/MarketDiscovery";
import P0Dashboard from "./pages/P0Dashboard";

// Advanced v2 (loaded immediately)
import SystemOverview from "./pages/SystemOverview";
import MLHealth from "./pages/MLHealth";
import SignalsAttribution from "./pages/SignalsAttribution";

// Main navigation pages (lazy loaded)
// ENHANCED: L1+L2 architecture preserving ALL working logic
const TokensPage = lazy(() => import("./pages/TokensPageEnhanced"));
const WalletsPage = lazy(() => import("./pages/WalletsPage"));
const EntitiesPage = lazy(() => import("./pages/EntitiesPage"));
const SignalsPage = lazy(() => import("./pages/SignalsPageD1"));
const SignalDetailPage = lazy(() => import("./pages/SignalDetailPage"));
const WatchlistPage = lazy(() => import("./pages/WatchlistPage"));
// Alerts V2 - System & Intelligence Notifications (replaced legacy AlertsPage)
const AlertsPage = lazy(() => import("./pages/AlertsPageV2"));
const StrategiesPage = lazy(() => import("./pages/StrategiesPage"));
const ActorsPage = lazy(() => import("./pages/ActorsPage"));
const ActorsGraphPage = lazy(() => import("./pages/ActorsGraphPage"));
const ActorDetailPage = lazy(() => import("./pages/ActorDetailPage"));
const CorrelationPage = lazy(() => import("./pages/CorrelationPage"));
// PHASE 4.1: V2 UI Pages (replacing V1)
const EnginePage = lazy(() => import("./pages/EnginePageV2"));
const EngineDashboard = lazy(() => import("./pages/EngineDashboardV2"));
// P0.2 - Registries Page (Token Registry + Address Labels)
const RegistriesPage = lazy(() => import("./pages/RegistriesPage"));
const RankingsDashboard = lazy(() => import("./pages/RankingsDashboardV2"));
const AttributionDashboard = lazy(() => import("./pages/AttributionDashboard"));
const MLReadyDashboard = lazy(() => import("./pages/MLReadyDashboard"));
// PHASE 4.2: Shadow Mode Dashboard
const ShadowModeDashboard = lazy(() => import("./pages/ShadowModeDashboard"));
// PHASE 4.3: Data Pipeline Monitoring
const DataPipelineMonitoring = lazy(() => import("./pages/DataPipelineMonitoring"));
const ShadowMLDashboard = lazy(() => import("./pages/ShadowMLDashboard"));

// Phase 4.6 - ML Intelligence Dashboard
const IntelligencePage = lazy(() => import("./components/IntelligencePage"));

// P1 - ML Monitoring Dashboard
const MLMonitoringPage = lazy(() => import("./pages/MLMonitoringPage"));

// P2.A - Confidence Dashboard
const ConfidenceDashboardPage = lazy(() => import("./pages/admin/metrics/ConfidenceDashboardPage"));

// Admin Panel Pages
const AdminLoginPage = lazy(() => import("./pages/admin/AdminLoginPage"));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminMLPage = lazy(() => import("./pages/admin/AdminMLPage"));
const AdminMLOpsPage = lazy(() => import("./pages/admin/AdminMLOpsPage"));
const AdminProvidersPage = lazy(() => import("./pages/admin/AdminProvidersPage"));
const AdminAuditPage = lazy(() => import("./pages/admin/AdminAuditPage"));
const AdminProfilePage = lazy(() => import("./pages/admin/AdminProfilePage"));
const SystemOverviewPage = lazy(() => import("./pages/admin/SystemOverviewPage"));
const DataPipelinesPage = lazy(() => import("./pages/admin/DataPipelinesPage"));
const AdminSettingsPage = lazy(() => import("./pages/admin/AdminSettingsPage"));
const AdminBacktestingPage = lazy(() => import("./pages/admin/AdminBacktestingPage"));
const AdminValidationPage = lazy(() => import("./pages/admin/AdminValidationPage"));
const AdminMLAccuracyPage = lazy(() => import("./pages/admin/AdminMLAccuracyPage"));
const AdminRetrainPage = lazy(() => import("./pages/admin/AdminRetrainPage"));
// ML v2.3 - Auto-Retrain Policies + Feature Analysis
const AdminAutoRetrainPage = lazy(() => import("./pages/admin/AdminAutoRetrainPage"));
const AdminMLFeaturesPage = lazy(() => import("./pages/admin/AdminMLFeaturesPage"));
// ML Governance - Approvals
const AdminApprovalsPage = lazy(() => import("./pages/admin/AdminApprovalsPage"));
// D4 - Indexer Control Panel
const IndexerPage = lazy(() => import("./pages/admin/IndexerPage"));

// Product Signals - Alerts Settings
const AdminAlertsSettingsPage = lazy(() => import("./pages/admin/AdminAlertsSettingsPage"));

// FOMO Alerts Admin (Full Control)
const FomoAlertsAdminPage = lazy(() => import("./pages/admin/FomoAlertsAdminPage"));

// Twitter Parser Admin v4.0
const TwitterParserAccountsPage = lazy(() => import("./pages/admin/TwitterParserAccountsPage"));
const TwitterParserSessionsPage = lazy(() => import("./pages/admin/TwitterParserSessionsPage"));
const TwitterParserSlotsPage = lazy(() => import("./pages/admin/TwitterParserSlotsPage"));
const TwitterParserMonitorPage = lazy(() => import("./pages/admin/TwitterParserMonitorPage"));

// A.3 - Admin Control Plane (Twitter Users)
const AdminTwitterPage = lazy(() => import("./pages/admin/twitter/AdminTwitterPage"));
const AdminUserDetailPage = lazy(() => import("./pages/admin/twitter/AdminUserDetailPage"));
const AdminPoliciesPage = lazy(() => import("./pages/admin/twitter/AdminPoliciesPage"));
const AdminSystemPage = lazy(() => import("./pages/admin/twitter/AdminSystemPage"));
// Phase 7.1 - Admin System Control Panel (enhanced)
const AdminSystemControlPage = lazy(() => import("./pages/admin/twitter/AdminSystemControlPage"));
const AdminLoadTestPage = lazy(() => import("./pages/admin/twitter/AdminLoadTestPage"));
const AdminConsentPoliciesPage = lazy(() => import("./pages/admin/twitter/AdminConsentPoliciesPage"));

// Connections Admin
const AdminConnectionsPage = lazy(() => import("./pages/admin/AdminConnectionsPage"));

// TASK 2: Admin System Parsing Console (SYSTEM scope)
const SystemParsingLayout = lazy(() => import("./pages/admin/system-parsing/SystemParsingLayout"));
const SystemHealthPage = lazy(() => import("./pages/admin/system-parsing/SystemHealthPage"));
const SystemAccountsPage = lazy(() => import("./pages/admin/system-parsing/SystemAccountsPage"));
const SystemSessionsPage = lazy(() => import("./pages/admin/system-parsing/SystemSessionsPage"));
const SystemTasksPage = lazy(() => import("./pages/admin/system-parsing/SystemTasksPage"));

// B4 - User-Facing Parser UI
const ParserOverviewPage = lazy(() => import("./pages/dashboard/parser/ParserOverviewPage"));

// P4.1 - Twitter Integration (User-Owned Accounts)
const TwitterIntegrationPage = lazy(() => import("./pages/dashboard/twitter/TwitterIntegrationPage"));
const TwitterTargetsPage = lazy(() => import("./pages/dashboard/twitter/TwitterTargetsPage"));

// P4.1 - Notification Settings
const NotificationsSettingsPage = lazy(() => import("./pages/settings/NotificationsSettingsPage"));

// Settings - API Keys
const ApiKeysSettingsPage = lazy(() => import("./pages/settings/ApiKeysSettingsPage"));

// A1 - Admin ML & Signals Pages
const AdminSignalsPage = lazy(() => import("./pages/admin/AdminSignalsPage"));
const AdminDatasetsPage = lazy(() => import("./pages/admin/AdminDatasetsPage"));
const AdminModelsPage = lazy(() => import("./pages/admin/AdminModelsPage"));
const AdminAblationPage = lazy(() => import("./pages/admin/AdminAblationPage"));
const AdminStabilityPage = lazy(() => import("./pages/admin/AdminStabilityPage"));
const AdminAttributionPage = lazy(() => import("./pages/admin/AdminAttributionPage"));

// P1.8 - Graph Intelligence Page
const GraphIntelligencePage = lazy(() => import("./pages/GraphIntelligencePage"));

// P0 MULTICHAIN - Wallet Explorer
const WalletExplorerPage = lazy(() => import("./pages/WalletExplorerPage"));

// P1 - Market Signals Dashboard
const MarketSignalsPage = lazy(() => import("./pages/MarketSignalsPage"));

// S3.7 - Classic Sentiment Analyzer (URL-first)
const SentimentPage = lazy(() => import("./pages/SentimentPage"));

// S3.9 - Twitter Feed (Sentiment без цены)
const TwitterFeedPage = lazy(() => import("./pages/TwitterSentimentPage"));

// S5 - Twitter AI (Sentiment × Price)
const TwitterAIPage = lazy(() => import("./pages/TwitterAIPage"));

// S3.8.2 - Sentiment Admin Dashboard
const AdminSentimentPage = lazy(() => import("./pages/admin/AdminSentimentPage"));

// Block 7 - Sentiment Early Validation
const AdminSentimentValidationPage = lazy(() => import("./pages/admin/AdminSentimentValidationPage"));

// S5.4 - Sentiment × Price Admin Dashboard
const AdminSentimentPricePage = lazy(() => import("./pages/admin/AdminSentimentPricePage"));

// S6.4 - Observation Model Admin Dashboard
const AdminObservationPage = lazy(() => import("./pages/admin/AdminObservationPage"));

// S7 - Onchain Validation Admin Dashboard
const AdminOnchainValidationPage = lazy(() => import("./pages/admin/AdminOnchainValidationPage"));

// S8 - Meta-Brain Admin Dashboard
const AdminMetaBrainPage = lazy(() => import("./pages/admin/AdminMetaBrainPage"));

// S4.ADM - ML Admin Control Layer
const AdminMLOverviewPage = lazy(() => import("./pages/admin/AdminMLOverviewPage"));
const AdminTwitterControlPage = lazy(() => import("./pages/admin/AdminTwitterPage"));
const AdminAutomationPage = lazy(() => import("./pages/admin/AdminAutomationPage"));

// U1.2 - Market Signals A-F Cards
const MarketSignalsU12Page = lazy(() => import("./modules/market/MarketSignalsPage"));

// FREEZE v2.3 - Unified Market Hub
const MarketHub = lazy(() => import("./pages/MarketHub"));

// S1.4 - User Strategies Page
const MarketStrategiesPage = lazy(() => import("./pages/MarketStrategiesPage"));

// S10.1 - Exchange Intelligence
const ExchangeOverviewPage = lazy(() => import("./pages/ExchangeOverviewPage"));
const AdminExchangePage = lazy(() => import("./pages/admin/AdminExchangePage"));

// Exchange Dashboard v2 (unified entry point with View Mode)
const ExchangeDashboardPage = lazy(() => import("./pages/ExchangeDashboardPage"));

// Y2 - Exchange Admin Control Page (Providers + Jobs)
const AdminExchangeControlPage = lazy(() => import("./pages/admin/AdminExchangeControlPage"));

// Admin Exchange Wrapper (for all Exchange pages in Admin)
const AdminExchangeWrapper = lazy(() => import("./pages/admin/AdminExchangeWrapper"));

// Phase 1.2 - Market Product Pages
const MarketAssetPage = lazy(() => import("./pages/market/MarketAssetPage"));

// S10.2 - Order Flow Intelligence
const OrderFlowPage = lazy(() => import("./pages/OrderFlowPage"));

// S10.3 - Volume & OI Regimes
const VolumeOIPage = lazy(() => import("./pages/VolumeOIPage"));

// S10.4 - Liquidation Cascades
const LiquidationsPage = lazy(() => import("./pages/LiquidationsPage"));

// S10.5 - Exchange Patterns
const PatternsPage = lazy(() => import("./pages/PatternsPage"));

// S10.6 - Exchange Labs (Dataset)
const LabsPage = lazy(() => import("./pages/LabsPage"));

// Exchange Research Page (Hypotheses & Interpretations)
const ExchangeResearchPage = lazy(() => import("./pages/ExchangeResearchPage"));

// Intelligence Pages
const MetaBrainPage = lazy(() => import("./pages/MetaBrainPage"));
const OnchainValidationPage = lazy(() => import("./pages/OnchainValidationPage"));

// Fractal V2.1 - Pattern Analysis Engine (BLOCK 47-50)
const FractalPage = lazy(() => import("./pages/FractalPage"));
const FractalAdminPage = lazy(() => import("./pages/FractalAdminPage"));
const AeBrainPage = lazy(() => import("./pages/AeBrainPage"));

// Compare Dashboard - V1 vs V2 Institutional Validation
const CompareDashboardPage = lazy(() => import("./engine-ui/CompareDashboard"));

// SPX Terminal - BLOCK B5.3 (Multi-Horizon SPX Engine)
const SpxTerminalPage = lazy(() => import("./pages/SpxTerminalPage"));

// Bitcoin Terminal - Re-export of FractalPage for /bitcoin route
const BitcoinTerminalPage = lazy(() => import("./pages/BitcoinTerminalPage"));

// Combined Terminal - BLOCK C (BTC × SPX Unified View)
const CombinedTerminalPage = lazy(() => import("./pages/CombinedTerminalPage"));

// Labs v3 - 18 Canonical Labs
const LabsPageV3 = lazy(() => import("./pages/LabsPageV3"));

// S10.6I.8 - Indicators Explorer
const IndicatorsExplorerPage = lazy(() => import("./pages/IndicatorsExplorerPage"));

// S10.LABS-01 - Regime Forward Outcome
const LabsRegimeForwardPage = lazy(() => import("./pages/LabsRegimeForwardPage"));

// S10.LABS-02 - Regime Attribution
const LabsRegimeAttributionPage = lazy(() => import("./pages/LabsRegimeAttributionPage"));

// S10.LABS-03 - Pattern Risk
const LabsPatternRiskPage = lazy(() => import("./pages/LabsPatternRiskPage"));

// S10.LABS-04 - Sentiment Interaction
const LabsSentimentInteractionPage = lazy(() => import("./pages/LabsSentimentInteractionPage"));

// S10.W - Whale Intelligence Pages
const WhalePatternsPage = lazy(() => import("./pages/WhalePatternsPage"));
const WhaleStatePage = lazy(() => import("./pages/WhaleStatePage"));
const LabsWhaleRiskPage = lazy(() => import("./pages/LabsWhaleRiskPage"));

// Macro Regime - Market Intelligence
const LabsMacroRegimePage = lazy(() => import("./pages/Exchange/LabsMacroRegimePage"));

// BLOCK 5-6: Exchange Segments Test Page - REMOVED (integrated into PriceExpectationV2Page)

// C1 - Alignment Explorer (Exchange × Sentiment Fusion)
const AlignmentExplorerPage = lazy(() => import("./pages/AlignmentExplorerPage"));

// B2 + B4 - Exchange Markets & Verdicts
const ExchangeMarketsPage = lazy(() => import("./pages/ExchangeMarketsPage"));

// Alt Radar - Altcoin Opportunity Scanner (Blocks 1-28)
const AltRadarPage = lazy(() => import("./pages/AltRadarPage"));

// Alt Screener - ML-powered Pattern Matching (Block 1.6)
const AltScreenerPage = lazy(() => import("./pages/AltScreenerPage"));

// Alt Movers - Cluster-based Rotation Candidates (Block 2.14)
const AltMoversPage = lazy(() => import("./pages/AltMoversPage"));

// S10.7.4 - Exchange ML Admin
const MLAdminPage = lazy(() => import("./pages/MLAdminPage"));

// FOMO AI - Main Product (Phase 5 UI)
const FomoAiPage = lazy(() => import("./pages/fomo-ai/FomoAiPage"));

// Snapshot Page (Public Share Links)
const SnapshotPage = lazy(() => import("./pages/snapshot/SnapshotPage"));

// MLOps Dashboard (Phase 5 - Model Management)
const MLOpsPage = lazy(() => import("./pages/mlops/MLOpsPage"));

// MLOps Promotion Page (ML Model Promotion & Control)
const MLOpsPromotionPage = lazy(() => import("./pages/Intelligence/MLOpsPromotionPage"));

// Price vs Expectation Page (Central Chart - Price vs Prediction)
const PriceExpectationPage = lazy(() => import("./pages/Intelligence/PriceExpectationPage"));

// Price vs Expectation V2 Page (New Forecast System)
const PriceExpectationV2Page = lazy(() => import("./pages/Intelligence/PriceExpectationV2Page"));

// Connections Module Pages (Layer 2 Analytics - OSINT Dashboard)
const ConnectionsPage = lazy(() => import("./pages/connections/ConnectionsPage"));
const ConnectionsInfluencersPage = lazy(() => import("./pages/connections/ConnectionsInfluencersPage"));
const InfluencerDetailPage = lazy(() => import("./pages/connections/InfluencerDetailPage"));
const ConnectionsUnifiedPage = lazy(() => import("./pages/connections/ConnectionsUnifiedPage"));
const ConnectionsGraphV2Page = lazy(() => import("./pages/connections/ConnectionsGraphV2Page"));
const ClusterAttentionPage = lazy(() => import("./pages/connections/ClusterAttentionPage"));
const AltSeasonPage = lazy(() => import("./pages/connections/AltSeasonPage"));
const RealityLeaderboardPage = lazy(() => import("./pages/connections/Reality/RealityLeaderboardPage"));
const ConnectionsEarlySignalPage = lazy(() => import("./pages/connections/ConnectionsEarlySignalPage"));
const ConnectionsBackersPage = lazy(() => import("./pages/connections/ConnectionsBackersPage"));
const BackerDetailPage = lazy(() => import("./pages/connections/BackerDetailPage"));
const LifecyclePage = lazy(() => import("./pages/connections/LifecyclePage"));
const NarrativesPage = lazy(() => import("./pages/connections/NarrativesPage"));
const FarmNetworkPage = lazy(() => import("./pages/connections/FarmNetworkPage"));
const StrategySimulationPage = lazy(() => import("./pages/connections/StrategySimulationPage"));
const ConnectionsWatchlistPage = lazy(() => import("./pages/connections/WatchlistPage"));
const ConnectionsDetailPage = lazy(() => import("./pages/connections/ConnectionsDetailPage"));

// P2.4.3 - Graph Share Page (standalone, no layout)
const GraphSharePage = lazy(() => import("./pages/share/GraphSharePage"));

// Legal Pages (Chrome Extension Privacy Policy - required for Chrome Web Store)
const ChromeExtensionPrivacyPage = lazy(() => import("./pages/legal/ChromeExtensionPrivacyPage"));

// Token Pages - NEW CANONICAL ROUTING ARCHITECTURE
// Alias route: /token/:symbol → resolves to canonical
// Canonical route: /token/:chainId/:address → source of truth
const TokenAliasResolver = lazy(() => import("./pages/TokenAliasResolver"));
const TokenCanonicalPage = lazy(() => import("./pages/TokenCanonicalPage"));

// Detail pages (lazy loaded - less frequently accessed)
const TokenDetail = lazy(() => import("./pages/TokenDetailRefactored"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const EntityDetail = lazy(() => import("./pages/EntityDetail"));
const SignalSnapshot = lazy(() => import("./pages/SignalSnapshot"));
const ActorProfile = lazy(() => import("./pages/ActorProfile"));

function App() {
  const { data } = useDashboard(1, 1); // Fetch only for globalState

  return (
    <WebSocketProvider>
      <ActivePathProvider>
        <AdminAuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Admin Panel Routes (standalone, no main layout) */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/system-overview" element={<SystemOverviewPage />} />
              <Route path="/admin/data-pipelines" element={<DataPipelinesPage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
              <Route path="/admin/backtesting" element={<AdminBacktestingPage />} />
              <Route path="/admin/validation" element={<AdminValidationPage />} />
              <Route path="/admin/ml-accuracy" element={<AdminMLAccuracyPage />} />
              <Route path="/admin/retrain" element={<AdminRetrainPage />} />
              <Route path="/admin/auto-retrain" element={<AdminAutoRetrainPage />} />
              <Route path="/admin/ml-features" element={<AdminMLFeaturesPage />} />
              <Route path="/admin/ml/approvals" element={<AdminApprovalsPage />} />
              <Route path="/admin/indexer" element={<IndexerPage />} />
              
              {/* MLOps Dashboard - Model Lifecycle Management */}
              <Route path="/admin/mlops" element={<AdminMLOpsPage />} />
              
              {/* Product Signals - Alerts Settings */}
              <Route path="/admin/alerts" element={<AdminAlertsSettingsPage />} />
              
              {/* FOMO Alerts Admin (Full Control) */}
              <Route path="/admin/fomo-alerts" element={<FomoAlertsAdminPage />} />
              
              {/* P2.A - Admin Metrics (Confidence Dashboard) */}
              <Route path="/admin/metrics/confidence" element={<ConfidenceDashboardPage />} />
              
              {/* Twitter Parser Admin v4.0 */}
              <Route path="/admin/twitter-parser/accounts" element={<TwitterParserAccountsPage />} />
              <Route path="/admin/twitter-parser/sessions" element={<TwitterParserSessionsPage />} />
              <Route path="/admin/twitter-parser/slots" element={<TwitterParserSlotsPage />} />
              <Route path="/admin/twitter-parser/monitor" element={<TwitterParserMonitorPage />} />
              
              {/* A.3 - Admin Control Plane (Twitter Users) */}
              <Route path="/admin/twitter" element={<AdminTwitterPage />} />
              <Route path="/admin/twitter/users/:userId" element={<AdminUserDetailPage />} />
              <Route path="/admin/twitter/policies" element={<AdminPoliciesPage />} />
              <Route path="/admin/twitter/consent-policies" element={<AdminConsentPoliciesPage />} />
              <Route path="/admin/twitter/system" element={<AdminSystemControlPage />} />
              <Route path="/admin/twitter/system-legacy" element={<AdminSystemPage />} />
              <Route path="/admin/twitter/performance" element={<AdminLoadTestPage />} />
              
              {/* Connections Admin */}
              <Route path="/admin/connections" element={<AdminConnectionsPage />} />
              
              {/* Fractal V2.1 Admin - Institutional Control Panel (BLOCK 47-50) */}
              <Route path="/admin/fractal" element={<FractalAdminPage />} />
              
              {/* TASK 2: Admin System Parsing Console (SYSTEM scope) */}
              <Route path="/admin/system-parsing" element={<SystemParsingLayout />}>
                <Route index element={<SystemHealthPage />} />
                <Route path="accounts" element={<SystemAccountsPage />} />
                <Route path="sessions" element={<SystemSessionsPage />} />
                <Route path="tasks" element={<SystemTasksPage />} />
              </Route>
              
              {/* A1 - Admin ML & Signals */}
              <Route path="/admin/signals" element={<AdminSignalsPage />} />
              <Route path="/admin/ml/datasets" element={<AdminDatasetsPage />} />
              <Route path="/admin/ml/models" element={<AdminModelsPage />} />
              <Route path="/admin/ml/ablation" element={<AdminAblationPage />} />
              <Route path="/admin/ml/stability" element={<AdminStabilityPage />} />
              <Route path="/admin/ml/attribution" element={<AdminAttributionPage />} />
              
              {/* S3.8.2 - Sentiment Admin Dashboard (standalone Admin Layout) */}
              <Route path="/admin/ml/sentiment" element={<AdminSentimentPage />} />
              
              {/* Block 7 - Sentiment Early Validation */}
              <Route path="/admin/ml/sentiment-validation" element={<AdminSentimentValidationPage />} />
              
              {/* S5.4 - Sentiment × Price Admin Dashboard */}
              <Route path="/admin/ml/sentiment-price" element={<AdminSentimentPricePage />} />
              
              {/* S6.4 - Observation Model Admin Dashboard */}
              <Route path="/admin/ml/observation" element={<AdminObservationPage />} />
              
              {/* S7 - Onchain Validation Admin Dashboard */}
              <Route path="/admin/ml/onchain-validation" element={<AdminOnchainValidationPage />} />
              
              {/* S8 - Meta-Brain Admin Dashboard */}
              <Route path="/admin/ml/meta-brain" element={<AdminMetaBrainPage />} />
              
              {/* S4.ADM - ML Admin Control Layer (standalone Admin Layout) */}
              <Route path="/admin/ml/overview" element={<AdminMLOverviewPage />} />
              <Route path="/admin/ml/twitter-control" element={<AdminTwitterControlPage />} />
              <Route path="/admin/ml/automation" element={<AdminAutomationPage />} />
              
              {/* S10.1 - Exchange Admin */}
              <Route path="/admin/exchange" element={<AdminExchangePage />} />
              
              {/* Y2 - Exchange Admin Control (Providers + Jobs) */}
              <Route path="/admin/exchange/control" element={<AdminExchangeControlPage />} />
              
              {/* ML Admin (wrapped in AdminLayout) */}
              <Route path="/admin/exchange/ml" element={<AdminExchangeWrapper />} />
              
              {/* Exchange Data Pages in Admin */}
              <Route path="/admin/exchange/data/overview" element={<AdminExchangeWrapper />} />
              <Route path="/admin/exchange/data/markets" element={<AdminExchangeWrapper />} />
              <Route path="/admin/exchange/data/orderflow" element={<AdminExchangeWrapper />} />
              <Route path="/admin/exchange/data/volume" element={<AdminExchangeWrapper />} />
              <Route path="/admin/exchange/data/indicators" element={<AdminExchangeWrapper />} />
              
              {/* Exchange Signals Pages in Admin */}
              <Route path="/admin/exchange/signals/liquidations" element={<AdminExchangeWrapper />} />
              <Route path="/admin/exchange/signals/patterns" element={<AdminExchangeWrapper />} />
              
              {/* Exchange Labs Pages in Admin */}
              <Route path="/admin/exchange/labs" element={<AdminExchangeWrapper />} />
              <Route path="/admin/exchange/labs/regime-forward" element={<AdminExchangeWrapper />} />
              <Route path="/admin/exchange/labs/regime-attribution" element={<AdminExchangeWrapper />} />
              <Route path="/admin/exchange/labs/pattern-risk" element={<AdminExchangeWrapper />} />
              <Route path="/admin/exchange/labs/sentiment" element={<AdminExchangeWrapper />} />
              <Route path="/admin/exchange/labs/whale-risk" element={<AdminExchangeWrapper />} />
              <Route path="/admin/exchange/labs/alignment" element={<AdminExchangeWrapper />} />
              
              {/* Exchange Whale Pages in Admin */}
              <Route path="/admin/exchange/whales/patterns" element={<AdminExchangeWrapper />} />
              <Route path="/admin/exchange/whales/state" element={<AdminExchangeWrapper />} />
              
              <Route path="/admin/ml" element={<AdminMLPage />} />
              <Route path="/admin/providers" element={<AdminProvidersPage />} />
              <Route path="/admin/audit" element={<AdminAuditPage />} />
              <Route path="/admin/profile" element={<AdminProfilePage />} />
              
              {/* P2.4.3: Standalone share page (no layout) */}
              <Route path="/share/graph/:shareId" element={<GraphSharePage />} />
              
              {/* Snapshot Page (Public Share Links - standalone, no layout) */}
              <Route path="/snapshot/:id" element={<SnapshotPage />} />
              
              {/* Legal Pages (Chrome Web Store compliance) */}
              <Route path="/privacy/chrome-extension" element={<ChromeExtensionPrivacyPage />} />
              
              {/* U1.2: Market Signals A-F Cards (standalone) */}
              <Route path="/market/signals/:asset" element={<MarketSignalsU12Page />} />
              <Route path="/market/signals" element={<MarketSignalsU12Page />} />
              
              {/* S1.4: User Strategies Page */}
              <Route path="/market/strategies/:network" element={<MarketStrategiesPage />} />
              <Route path="/market/strategies" element={<MarketStrategiesPage />} />
              
              <Route element={<AppLayout globalState={data?.globalState} />}>
                {/* Main Navigation */}
                {/* FRACTAL — Default landing page for development */}
                <Route path="/" element={<FractalPage />} />
                <Route path="/prediction" element={<PriceExpectationV2Page />} />
                <Route path="/intelligence/dashboard" element={<P0Dashboard />} />
                
              {/* FOMO AI - Main Product */}
              <Route path="/fomo-ai" element={<FomoAiPage />} />
              <Route path="/fomo-ai/:symbol" element={<FomoAiPage />} />
              
              {/* MLOps Dashboard */}
              <Route path="/mlops" element={<MLOpsPage />} />
              
              {/* MLOps Promotion - Model Control */}
              <Route path="/intelligence/mlops/promotion" element={<MLOpsPromotionPage />} />
              
              {/* FREEZE v2.3: Unified Market Hub (replaces /market + /market-signals) */}
              <Route path="/market" element={<MarketHub />} />
              <Route path="/market-signals" element={<MarketHub />} /> {/* Redirect */}
              <Route path="/tokens" element={<TokensPage />} />
              <Route path="/wallets" element={<WalletsPage />} />
              <Route path="/entities" element={<EntitiesPage />} />
              <Route path="/signals" element={<SignalsPage />} />
              <Route path="/signals/:id" element={<SignalDetailPage />} />
              <Route path="/watchlist" element={<WatchlistPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/strategies" element={<StrategiesPage />} />
              <Route path="/actors" element={<ActorsPage />} />
              <Route path="/actors/graph" element={<ActorsGraphPage />} />
              <Route path="/actors/correlation" element={<CorrelationPage />} />
              <Route path="/actors/:actorId" element={<ActorDetailPage />} />
              <Route path="/engine" element={<EnginePage />} />
              <Route path="/engine/dashboard" element={<EngineDashboard />} />
              <Route path="/shadow" element={<ShadowModeDashboard />} />
              <Route path="/pipeline" element={<DataPipelineMonitoring />} />
              <Route path="/registries" element={<RegistriesPage />} />
              <Route path="/rankings" element={<RankingsDashboard />} />
              <Route path="/attribution" element={<AttributionDashboard />} />
              <Route path="/ml-ready" element={<MLReadyDashboard />} />
              <Route path="/shadow-ml" element={<ShadowMLDashboard />} />
              
              {/* ═══════════════════════════════════════════════════════════
                  EXCHANGE v3 — Analytics + Labs (instruments returned!)
                  - Dashboard: Market state overview
                  - Market: Price, volume, OI, funding
                  - Signals: Raw exchange signals
                  - Research: Interpretations/hypotheses
                  - Labs: Individual analysis tools
                  ═══════════════════════════════════════════════════════════ */}
              <Route path="/exchange" element={<ExchangeDashboardPage />} />
              <Route path="/exchange/markets" element={<ExchangeMarketsPage />} />
              <Route path="/exchange/signals" element={<MarketSignalsPage />} />
              <Route path="/exchange/research" element={<ExchangeResearchPage />} />
              <Route path="/exchange/labs" element={<LabsPageV3 />} />
              
              {/* Legacy Exchange routes (kept for backward compatibility) */}
              <Route path="/exchange/orderflow" element={<OrderFlowPage />} />
              <Route path="/exchange/volume" element={<VolumeOIPage />} />
              <Route path="/exchange/liquidations" element={<LiquidationsPage />} />
              <Route path="/exchange/patterns" element={<PatternsPage />} />
              <Route path="/exchange/labs/regime-forward" element={<LabsRegimeForwardPage />} />
              <Route path="/exchange/labs/regime-attribution" element={<LabsRegimeAttributionPage />} />
              <Route path="/exchange/labs/pattern-risk" element={<LabsPatternRiskPage />} />
              <Route path="/exchange/labs/sentiment-interaction" element={<LabsSentimentInteractionPage />} />
              <Route path="/exchange/labs/whale-risk" element={<LabsWhaleRiskPage />} />
              
              {/* Macro Regime - Market Intelligence */}
              <Route path="/exchange/labs/macro-regime" element={<LabsMacroRegimePage />} />
              
              {/* C1 - Alignment Explorer (Exchange × Sentiment Fusion) */}
              <Route path="/exchange/labs/alignment" element={<AlignmentExplorerPage />} />
              
              {/* S10.W - Whale Intelligence */}
              <Route path="/exchange/whales/patterns" element={<WhalePatternsPage />} />
              <Route path="/exchange/whales/state" element={<WhaleStatePage />} />
              
              {/* S10.6I.8 - Indicators Explorer */}
              <Route path="/exchange/indicators" element={<IndicatorsExplorerPage />} />
              
              {/* S10.7.4 - Exchange ML Admin */}
              <Route path="/admin/exchange/ml" element={<MLAdminPage />} />
              
              {/* BLOCK 5-6: Exchange Segments - integrated into PriceExpectationV2Page */}
              
              {/* ═══════════════════════════════════════════════════════════
                  ALT RADAR — Altcoin Opportunity Scanner (Blocks 1-28)
                  ═══════════════════════════════════════════════════════════ */}
              <Route path="/exchange/alt-radar" element={<AltRadarPage />} />
              
              {/* ═══════════════════════════════════════════════════════════
                  ALT SCREENER — ML Pattern Matching (Block 1.6)
                  ═══════════════════════════════════════════════════════════ */}
              <Route path="/exchange/alt-screener" element={<AltScreenerPage />} />
              <Route path="/market/alts" element={<AltScreenerPage />} />
              
              {/* ═══════════════════════════════════════════════════════════
                  ALT MOVERS — Cluster Rotation Candidates (Block 2.14)
                  ═══════════════════════════════════════════════════════════ */}
              <Route path="/market/alt-movers" element={<AltMoversPage />} />
              
              {/* ═══════════════════════════════════════════════════════════
                  INTELLIGENCE v3 — Brain/ML/Control (cleaned)
                  - Dashboard: System health
                  - MLOps: Model lifecycle
                  - Meta-Brain: Decision orchestration
                  - On-chain Validation: Signal verification
                  ═══════════════════════════════════════════════════════════ */}
              <Route path="/intelligence" element={<IntelligencePage />} />
              <Route path="/intelligence/metabrain" element={<MetaBrainPage />} />
              <Route path="/intelligence/onchain" element={<OnchainValidationPage />} />
              <Route path="/intelligence/price-expectation" element={<PriceExpectationPage />} />
              <Route path="/intelligence/price-expectation-v2" element={<PriceExpectationV2Page />} />
              
              {/* ═══════════════════════════════════════════════════════════════
                  FRACTAL V2.1 — Historical Pattern Analysis Engine
                  Main tab in sidebar with own sub-routes
                  ═══════════════════════════════════════════════════════════ */}
              <Route path="/fractal" element={<FractalPage />} />
              <Route path="/fractal/btc" element={<FractalPage />} />
              <Route path="/fractal/signal" element={<FractalPage />} />
              <Route path="/fractal/matches" element={<FractalPage />} />
              <Route path="/fractal/backtest" element={<FractalPage />} />
              {/* SPX Fractal — Uses unified FractalPage with asset="SPX" */}
              <Route path="/fractal/spx" element={<FractalPage asset="SPX" />} />
              
              {/* DXY Fractal — P6 UI ENABLED */}
              <Route path="/fractal/dxy" element={<FractalPage asset="DXY" />} />
              <Route path="/dxy" element={<FractalPage asset="DXY" />} />
              
              {/* AE Brain — Macro Analysis Engine */}
              <Route path="/fractal/ae-brain" element={<AeBrainPage />} />
              
              {/* Compare Dashboard — V1 vs V2 Institutional Validation */}
              <Route path="/engine/compare" element={<CompareDashboardPage />} />
              
              {/* SPX Terminal - BLOCK B5.3 (Multi-Horizon SPX Engine) */}
              <Route path="/spx" element={<SpxTerminalPage />} />
              <Route path="/spx/terminal" element={<SpxTerminalPage />} />
              
              {/* Bitcoin Terminal - /bitcoin route */}
              <Route path="/bitcoin" element={<BitcoinTerminalPage />} />
              
              {/* Combined Terminal - BLOCK C (BTC × SPX) */}
              <Route path="/combined" element={<CombinedTerminalPage />} />
              
              {/* Connections Module - Layer 2 Analytics (OSINT Dashboard - Isolated) */}
              <Route path="/connections" element={<ConnectionsPage />} />
              <Route path="/connections/unified" element={<ConnectionsUnifiedPage />} />
              <Route path="/connections/groups" element={<ConnectionsUnifiedPage />} />
              <Route path="/connections/radar" element={<ConnectionsEarlySignalPage />} />
              <Route path="/connections/reality" element={<RealityLeaderboardPage />} />
              <Route path="/connections/graph" element={<ConnectionsGraphV2Page />} />
              <Route path="/connections/graph-v2" element={<ConnectionsGraphV2Page />} />
              <Route path="/connections/clusters" element={<ClusterAttentionPage />} />
              <Route path="/connections/cluster-attention" element={<ClusterAttentionPage />} />
              <Route path="/connections/alt-season" element={<AltSeasonPage />} />
              <Route path="/connections/opportunities" element={<AltSeasonPage />} />
              <Route path="/connections/lifecycle" element={<LifecyclePage />} />
              <Route path="/connections/narratives" element={<NarrativesPage />} />
              <Route path="/connections/alpha" element={<NarrativesPage />} />
              <Route path="/connections/backers" element={<ConnectionsBackersPage />} />
              <Route path="/connections/backers/:slug" element={<BackerDetailPage />} />
              <Route path="/connections/influencers" element={<ConnectionsInfluencersPage />} />
              <Route path="/connections/influencers/:handle" element={<InfluencerDetailPage />} />
              <Route path="/connections/watchlists" element={<ConnectionsWatchlistPage />} />
              <Route path="/connections/watchlists/:id" element={<ConnectionsWatchlistPage />} />
              <Route path="/connections/farm-network" element={<FarmNetworkPage />} />
              <Route path="/connections/strategy-simulation" element={<StrategySimulationPage />} />
              <Route path="/connections/:authorId" element={<ConnectionsDetailPage />} />
              
              {/* Phase 1.2 - Market Product Pages */}
              <Route path="/market/:symbol" element={<MarketAssetPage />} />
              
              {/* P1 - ML Monitoring Dashboard */}
              <Route path="/ml-monitoring" element={<MLMonitoringPage />} />
              
              {/* Advanced v2 - 3 screens */}
              <Route path="/advanced/system-overview" element={<SystemOverview />} />
              <Route path="/advanced/ml-health" element={<MLHealth />} />
              <Route path="/advanced/signals-attribution" element={<SignalsAttribution />} />
              
              {/* B4 - Twitter Parser User UI */}
              <Route path="/dashboard/parser" element={<ParserOverviewPage />} />
              <Route path="/parsing" element={<ParserOverviewPage />} />
              
              {/* P4.1 - Twitter Integration (User-Owned Accounts) */}
              <Route path="/dashboard/twitter" element={<TwitterIntegrationPage />} />
              <Route path="/dashboard/twitter/targets" element={<TwitterTargetsPage />} />
              <Route path="/twitter" element={<TwitterIntegrationPage />} />
              
              {/* S2.2 - Sentiment Analyzer */}
              <Route path="/sentiment" element={<SentimentPage />} />
              
              {/* S3.9 - Twitter Feed (Sentiment без цены) */}
              <Route path="/sentiment/twitter" element={<TwitterFeedPage />} />
              
              {/* S5 - Twitter AI (Sentiment × Price) */}
              <Route path="/sentiment/twitter-ai" element={<TwitterAIPage />} />
              
              {/* P4.1 - Settings */}
              <Route path="/settings/notifications" element={<NotificationsSettingsPage />} />
              <Route path="/settings/api-keys" element={<ApiKeysSettingsPage />} />
              
              {/* P1.8 - Graph Intelligence */}
              <Route path="/graph-intelligence" element={<GraphIntelligencePage />} />
              
              {/* P0 MULTICHAIN - Wallet Explorer */}
              <Route path="/wallet-explorer" element={<WalletExplorerPage />} />
              
              {/* Legacy Market Signals route (redirects to Market Hub) */}
              {/* /market-signals now handled above as redirect to MarketHub */}
              
              {/* TOKEN ROUTING - NEW CANONICAL ARCHITECTURE */}
              {/* Canonical URL: /token/:chainId/:address - Source of truth */}
              <Route path="/token/:chainId/:address" element={<TokenCanonicalPage />} />
              {/* Alias URL: /token/:symbol - Resolves to canonical */}
              <Route path="/token/:symbol" element={<TokenAliasResolver />} />
              
              {/* Legacy token routes (backwards compatibility) */}
              <Route path="/tokens/:address" element={<TokensPage />} />
              
              {/* Other Detail Pages */}
              <Route path="/portfolio/:address" element={<Portfolio />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/entity/:entityId" element={<EntityDetail />} />
              <Route path="/signal/:id" element={<SignalSnapshot />} />
              
              {/* Fallback */}
              <Route path="/*" element={<P0Dashboard />} />
            </Route>
          </Routes>
        </Suspense>
        <Toaster position="top-right" />
      </BrowserRouter>
      </AdminAuthProvider>
      </ActivePathProvider>
    </WebSocketProvider>
  );
}

export default App;
