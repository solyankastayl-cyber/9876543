/**
 * ADMIN NAVIGATION REGISTRY
 * 
 * Hierarchical navigation structure for the admin panel.
 * 
 * PRINCIPLES:
 * 1. Tree structure, not flat list
 * 2. Level 1 always visible (domains)
 * 3. Level 2 collapsible (groups)
 * 4. Level 3 is actual pages
 * 5. Modules are isolated - cannot affect Platform/ML
 * 
 * Adding new pages: just add a node to the tree
 * Adding new modules: add to MODULES section
 */

import {
  Activity,
  Database,
  Zap,
  Server,
  TestTube,
  FileText,
  Brain,
  BarChart3,
  Layers,
  Box,
  RefreshCw,
  GitBranch,
  CheckCircle,
  Target,
  LineChart,
  Gauge,
  Award,
  TrendingUp,
  Twitter,
  Users,
  Shield,
  HeartPulse,
  Settings,
  MessageSquare,
  Radio,
  Newspaper,
  MessageCircle,
  Link2,
  Bell,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';

/**
 * Navigation node type
 * @typedef {Object} NavNode
 * @property {string} label - Display label
 * @property {string} [path] - Route path (only for leaf nodes)
 * @property {React.ComponentType} [icon] - Lucide icon component
 * @property {NavNode[]} [children] - Child nodes
 * @property {string} [badge] - Optional badge (e.g., "NEW", "BETA")
 * @property {boolean} [defaultExpanded] - Whether to expand by default
 */

export const ADMIN_NAV = [
  // ═══════════════════════════════════════════════════════════════
  // PLATFORM - Core infrastructure, data, and control
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'platform',
    label: 'Platform',
    icon: Server,
    defaultExpanded: true,
    children: [
      {
        id: 'platform-overview',
        label: 'Overview',
        children: [
          { 
            id: 'system-overview',
            label: 'System Overview', 
            path: '/admin/system-overview',
            icon: Activity,
          },
        ],
      },
      {
        id: 'platform-data',
        label: 'Data',
        children: [
          { 
            id: 'data-pipelines',
            label: 'Data Pipelines', 
            path: '/admin/data-pipelines',
            icon: Database,
          },
          { 
            id: 'providers',
            label: 'Providers', 
            path: '/admin/providers',
            icon: Zap,
          },
          { 
            id: 'indexer',
            label: 'Indexer', 
            path: '/admin/indexer',
            icon: Layers,
          },
        ],
      },
      {
        id: 'platform-analysis',
        label: 'Analysis',
        children: [
          { 
            id: 'backtesting',
            label: 'Backtesting', 
            path: '/admin/backtesting',
            icon: TestTube,
          },
          { 
            id: 'validation',
            label: 'Validation', 
            path: '/admin/validation',
            icon: CheckCircle,
          },
          { 
            id: 'audit',
            label: 'Audit Log', 
            path: '/admin/audit',
            icon: FileText,
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // ML & INTELLIGENCE - Models, training, quality, metrics
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'ml',
    label: 'ML & Intelligence',
    icon: Brain,
    children: [
      {
        id: 'ml-overview',
        label: 'Overview',
        children: [
          { 
            id: 'ml-dashboard',
            label: 'ML Dashboard', 
            path: '/admin/ml',
            icon: Brain,
          },
        ],
      },
      {
        id: 'ml-models',
        label: 'Models',
        children: [
          { 
            id: 'models',
            label: 'Models', 
            path: '/admin/ml/models',
            icon: Box,
          },
          { 
            id: 'datasets',
            label: 'Datasets', 
            path: '/admin/ml/datasets',
            icon: Database,
          },
          { 
            id: 'features',
            label: 'Features', 
            path: '/admin/ml-features',
            icon: Layers,
          },
        ],
      },
      {
        id: 'ml-training',
        label: 'Training',
        children: [
          { 
            id: 'retrain',
            label: 'Retrain', 
            path: '/admin/retrain',
            icon: RefreshCw,
          },
          { 
            id: 'auto-retrain',
            label: 'Auto-Retrain', 
            path: '/admin/auto-retrain',
            icon: GitBranch,
          },
          { 
            id: 'approvals',
            label: 'Approvals', 
            path: '/admin/ml/approvals',
            icon: CheckCircle,
          },
        ],
      },
      {
        id: 'ml-evaluation',
        label: 'Evaluation',
        children: [
          { 
            id: 'accuracy',
            label: 'Accuracy', 
            path: '/admin/ml-accuracy',
            icon: Target,
          },
          { 
            id: 'ablation',
            label: 'Ablation', 
            path: '/admin/ml/ablation',
            icon: LineChart,
          },
          { 
            id: 'stability',
            label: 'Stability', 
            path: '/admin/ml/stability',
            icon: Gauge,
          },
          { 
            id: 'attribution',
            label: 'Attribution', 
            path: '/admin/ml/attribution',
            icon: Award,
          },
          { 
            id: 'confidence',
            label: 'Confidence', 
            path: '/admin/metrics/confidence',
            icon: BarChart3,
          },
        ],
      },
      {
        id: 'ml-outputs',
        label: 'Outputs',
        children: [
          { 
            id: 'signals',
            label: 'Signals', 
            path: '/admin/signals',
            icon: TrendingUp,
          },
        ],
      },
      {
        id: 'ml-sentiment',
        label: 'Sentiment Engine',
        children: [
          { 
            id: 'sentiment-dashboard',
            label: 'Sentiment Admin', 
            path: '/admin/ml/sentiment',
            icon: MessageCircle,
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // MODULES - Pluggable, independent platform modules
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'modules',
    label: 'Modules',
    icon: Box,
    children: [
      {
        id: 'twitter-module',
        label: 'Twitter Module',
        icon: Twitter,
        badge: 'ACTIVE',
        children: [
          { 
            id: 'twitter-users',
            label: 'Users', 
            path: '/admin/twitter',
            icon: Users,
          },
          { 
            id: 'twitter-policies',
            label: 'Fair-Use Policies', 
            path: '/admin/twitter/policies',
            icon: Shield,
          },
          { 
            id: 'twitter-consent-policies',
            label: 'Data Policies', 
            path: '/admin/twitter/consent-policies',
            icon: FileText,
          },
          { 
            id: 'twitter-health',
            label: 'System Health', 
            path: '/admin/twitter/system',
            icon: HeartPulse,
          },
          { 
            id: 'twitter-performance',
            label: 'Performance', 
            path: '/admin/twitter/performance',
            icon: Activity,
          },
        ],
      },
      // ═══════════════════════════════════════════════════════════════
      // TWITTER PARSER - Admin cookie sessions management
      // ═══════════════════════════════════════════════════════════════
      {
        id: 'twitter-parser',
        label: 'Twitter Parser',
        icon: Database,
        badge: 'ADMIN',
        children: [
          { 
            id: 'parser-sessions',
            label: 'Sessions', 
            path: '/admin/twitter-parser/sessions',
            icon: Shield,
          },
          { 
            id: 'parser-accounts',
            label: 'Accounts', 
            path: '/admin/twitter-parser/accounts',
            icon: Users,
          },
          { 
            id: 'parser-slots',
            label: 'Slots', 
            path: '/admin/twitter-parser/slots',
            icon: Layers,
          },
          { 
            id: 'parser-monitor',
            label: 'Monitor', 
            path: '/admin/twitter-parser/monitor',
            icon: Activity,
          },
        ],
      },
      // ═══════════════════════════════════════════════════════════════
      // CONNECTIONS MODULE - Influencer rating & early signals
      // ═══════════════════════════════════════════════════════════════
      {
        id: 'connections-module',
        label: 'Connections Module',
        icon: Link2,
        badge: 'ACTIVE',
        children: [
          { 
            id: 'connections-overview',
            label: 'Overview', 
            path: '/admin/connections',
            icon: Activity,
          },
          { 
            id: 'connections-config',
            label: 'Configuration', 
            path: '/admin/connections?tab=config',
            icon: Settings,
          },
          { 
            id: 'connections-engines',
            label: 'Engines Config', 
            path: '/admin/connections?tab=engines',
            icon: Settings,
            badge: 'NEW',
          },
          { 
            id: 'connections-stability',
            label: 'Stability', 
            path: '/admin/connections?tab=stability',
            icon: Gauge,
          },
          { 
            id: 'connections-alerts',
            label: 'Alerts Engine', 
            path: '/admin/connections?tab=alerts',
            icon: Bell,
          },
          { 
            id: 'connections-telegram',
            label: 'Telegram Delivery', 
            path: '/admin/connections?tab=telegram',
            icon: MessageSquare,
          },
        ],
      },
      // ═══════════════════════════════════════════════════════════════
      // FRACTAL MODULE - Institutional Risk Engine (BTC-only)
      // ═══════════════════════════════════════════════════════════════
      {
        id: 'fractal-module',
        label: 'Fractal Module',
        icon: TrendingDown,
        badge: 'ACTIVE',
        children: [
          { 
            id: 'fractal-overview',
            label: 'Overview', 
            path: '/admin/fractal?tab=overview',
            icon: Activity,
          },
          { 
            id: 'fractal-shadow',
            label: 'Shadow Divergence', 
            path: '/admin/fractal?tab=shadow',
            icon: Layers,
          },
          { 
            id: 'fractal-volatility',
            label: 'Volatility Attribution', 
            path: '/admin/fractal?tab=volatility',
            icon: Gauge,
          },
          { 
            id: 'fractal-alerts',
            label: 'Alerts', 
            path: '/admin/fractal?tab=alerts',
            icon: Bell,
            badge: 'NEW',
          },
        ],
      },
      // Future modules (disabled/placeholder)
      {
        id: 'reddit-module',
        label: 'Reddit Module',
        icon: MessageSquare,
        badge: 'SOON',
        disabled: true,
        children: [],
      },
      {
        id: 'telegram-module',
        label: 'Telegram Module',
        icon: Radio,
        badge: 'SOON',
        disabled: true,
        children: [],
      },
      {
        id: 'news-module',
        label: 'News Module',
        icon: Newspaper,
        badge: 'SOON',
        disabled: true,
        children: [],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // CONFIGURATION - Global platform settings
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'configuration',
    label: 'Configuration',
    icon: Settings,
    children: [
      {
        id: 'config-settings',
        label: 'Settings',
        path: '/admin/settings',
        icon: Settings,
      },
    ],
  },
];

/**
 * Flatten navigation tree to get all paths for route matching
 */
export function getAllPaths(nodes = ADMIN_NAV, paths = []) {
  for (const node of nodes) {
    if (node.path) {
      paths.push(node.path);
    }
    if (node.children) {
      getAllPaths(node.children, paths);
    }
  }
  return paths;
}

/**
 * Find node by path
 */
export function findNodeByPath(path, nodes = ADMIN_NAV) {
  for (const node of nodes) {
    if (node.path === path) {
      return node;
    }
    if (node.children) {
      const found = findNodeByPath(path, node.children);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Get breadcrumb path for a given route
 */
export function getBreadcrumb(path, nodes = ADMIN_NAV, trail = []) {
  for (const node of nodes) {
    const currentTrail = [...trail, node.label];
    
    if (node.path === path) {
      return currentTrail;
    }
    
    if (node.children) {
      const found = getBreadcrumb(path, node.children, currentTrail);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Check if a path is within a section
 */
export function isPathInSection(path, sectionId, nodes = ADMIN_NAV) {
  const section = nodes.find(n => n.id === sectionId);
  if (!section) return false;
  
  const sectionPaths = getAllPaths([section]);
  return sectionPaths.some(p => path.startsWith(p));
}

export default ADMIN_NAV;
