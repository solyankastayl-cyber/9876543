/**
 * NetworkPathsPanel - Network paths and exposure analysis
 * 
 * Shows:
 * - Exposure summary (tier, reachable elite/high)
 * - Top paths to influential nodes
 * - Path details with visualization
 * - Explain block
 * 
 * Phase 3.4 POLISH: Added path badges and inline explanations
 */
import { useState, useEffect } from 'react';
import { Network, Route, Users, Target, ChevronDown, ChevronUp, TrendingUp, AlertTriangle, Lightbulb, ArrowRight, Lock, Unlock, Flame, Brain, Zap, Crown, X } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// Path badge definitions (Phase 3.4.1A)
const PATH_BADGES = {
  strong_access: { icon: Flame, color: '#ef4444', text: 'Strong Access', description: 'Strong influence chain' },
  smart_route: { icon: Brain, color: '#8b5cf6', text: 'Smart Route', description: 'Through high-quality players' },
  short_reach: { icon: Zap, color: '#f59e0b', text: 'Short Reach', description: 'Quick access path' },
  elite_touch: { icon: Crown, color: '#eab308', text: 'Elite Touch', description: 'Reaches elite tier' },
};

// Tier colors
const TIER_COLORS = {
  elite: '#8b5cf6',
  high: '#22c55e',
  upper_mid: '#3b82f6',
  mid: '#06b6d4',
  low_mid: '#f59e0b',
  low: '#ef4444',
};

const EXPOSURE_COLORS = {
  elite: '#8b5cf6',
  strong: '#22c55e',
  moderate: '#f59e0b',
  weak: '#ef4444',
};

// Tier badge component
const TierBadge = ({ tier, small = false }) => {
  const color = TIER_COLORS[tier] || '#6b7280';
  const labels = {
    elite: 'Elite',
    high: 'High',
    upper_mid: 'Upper-Mid',
    mid: 'Mid',
    low_mid: 'Low-Mid',
    low: 'Low',
  };
  
  return (
    <span 
      className={`px-2 py-0.5 rounded text-white font-medium ${small ? 'text-xs' : 'text-sm'}`}
      style={{ backgroundColor: color }}
    >
      {labels[tier] || tier}
    </span>
  );
};

// Exposure badge
const ExposureBadge = ({ tier }) => {
  const color = EXPOSURE_COLORS[tier] || '#6b7280';
  const labels = {
    elite: 'Elite Exposure',
    strong: 'Strong Exposure',
    moderate: 'Moderate Exposure',
    weak: 'Weak Exposure',
  };
  
  return (
    <span 
      className="px-3 py-1 rounded-full text-white font-medium text-sm"
      style={{ backgroundColor: color }}
    >
      {labels[tier] || tier}
    </span>
  );
};

// Path badge component (Phase 3.4.1A)
const PathBadge = ({ badge }) => {
  const config = PATH_BADGES[badge];
  if (!config) return null;
  
  const Icon = config.icon;
  return (
    <span 
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: config.color }}
      title={config.description}
    >
      <Icon className="w-3 h-3" />
      {config.text}
    </span>
  );
};

// Path visualization component
const PathVisual = ({ path, onHighlight, onLock, isLocked }) => {
  const kindColors = {
    shortest: '#3b82f6',
    strongest: '#22c55e',
    elite: '#8b5cf6',
  };
  
  return (
    <div 
      className={`bg-white rounded-lg border p-4 hover:shadow-md transition-all cursor-pointer ${
        isLocked ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
      }`}
      onMouseEnter={() => !isLocked && onHighlight?.(path)}
      onMouseLeave={() => !isLocked && onHighlight?.(null)}
    >
      {/* Header with badges */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span 
            className="px-2 py-0.5 rounded text-white text-xs font-medium"
            style={{ backgroundColor: kindColors[path.kind] }}
          >
            {path.kind}
          </span>
          <span className="text-sm font-mono text-gray-600">{path.hops} hop{path.hops !== 1 ? 's' : ''}</span>
          {/* Phase 3.4.1A: Path badges */}
          {path.badges?.map((badge, idx) => (
            <PathBadge key={idx} badge={badge} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold text-green-600">
            +{Math.round(path.contribution_0_1 * 100)}%
          </div>
          {/* Phase 3.4.3B: Lock highlight */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLock?.(isLocked ? null : path);
            }}
            className={`p-1 rounded hover:bg-gray-100 transition-colors ${isLocked ? 'text-blue-500' : 'text-gray-400'}`}
            title={isLocked ? 'Unlock highlight' : 'Lock highlight'}
          >
            {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
      {/* Path nodes */}
      <div className="flex items-center gap-1 flex-wrap">
        {path.nodes.map((node, idx) => (
          <div key={node.id} className="flex items-center gap-1">
            <div className="flex items-center gap-1 bg-gray-50 rounded px-2 py-1">
              <span 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: TIER_COLORS[node.authority_tier] }}
              />
              <span className="text-sm text-gray-900">@{node.handle || node.id}</span>
            </div>
            {idx < path.nodes.length - 1 && (
              <ArrowRight className="w-4 h-4 text-gray-400" />
            )}
          </div>
        ))}
      </div>
      
      {/* Phase 3.4.1B: Inline explanation */}
      {path.explain_text && (
        <div className="mt-3 text-sm text-gray-600 bg-blue-50 rounded-lg px-3 py-2 italic">
          {path.explain_text}
        </div>
      )}
      
      {/* Metrics */}
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
        <span>Strength: {path.strength.toFixed(2)}</span>
        <span>Authority sum: {path.authority_sum.toFixed(2)}</span>
        <TierBadge tier={path.nodes[path.nodes.length - 1]?.authority_tier} small />
      </div>
    </div>
  );
};

// Exposure summary card
const ExposureCard = ({ exposure }) => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Network className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Network Exposure</h3>
            <ExposureBadge tier={exposure.exposure_tier} />
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-blue-600">
            {Math.round(exposure.exposure_score_0_1 * 100)}
          </div>
          <div className="text-sm text-gray-500">exposure score</div>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-lg font-semibold text-gray-900">{exposure.reachable_elite}</div>
          <div className="text-xs text-gray-500">Elite Reachable</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-gray-900">{exposure.reachable_high}</div>
          <div className="text-xs text-gray-500">High Reachable</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-gray-900">
            {exposure.avg_hops_to_elite != null ? exposure.avg_hops_to_elite.toFixed(1) : '—'}
          </div>
          <div className="text-xs text-gray-500">Avg Hops to Elite</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-gray-900">
            {exposure.avg_hops_to_high != null ? exposure.avg_hops_to_high.toFixed(1) : '—'}
          </div>
          <div className="text-xs text-gray-500">Avg Hops to High</div>
        </div>
      </div>
    </div>
  );
};

// Explain block
const ExplainBlock = ({ explain }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!explain) return null;
  
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          Path Analysis
        </h4>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      
      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Summary */}
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-gray-800 font-medium">{explain.summary}</p>
          </div>
          
          {/* Details */}
          {explain.details && explain.details.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-700">Details</span>
              </div>
              <ul className="space-y-1">
                {explain.details.map((detail, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Recommendations */}
          {explain.recommendations && explain.recommendations.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-700">Recommendations</span>
              </div>
              <ul className="space-y-1">
                {explain.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-amber-500 mt-1">💡</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Main component
export default function NetworkPathsPanel({ accountId, onHighlightPath }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllPaths, setShowAllPaths] = useState(false);
  const [lockedPath, setLockedPath] = useState(null); // Phase 3.4.3B: Lock highlight

  useEffect(() => {
    const fetchData = async () => {
      if (!accountId) return;
      
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND_URL}/api/connections/paths/${accountId}`);
        const json = await res.json();
        
        if (json.ok) {
          setData(json.data);
        } else {
          setError(json.message || 'Failed to load data');
        }
      } catch (err) {
        console.error('Error fetching paths:', err);
        setError(err.message);
      }
      setLoading(false);
    };
    
    fetchData();
  }, [accountId]);

  // Phase 3.4.3B: Handle lock path
  const handleLockPath = (path) => {
    setLockedPath(path);
    onHighlightPath?.(path);
  };

  // Phase 3.4.3C: Clear all highlights
  const clearHighlights = () => {
    setLockedPath(null);
    onHighlightPath?.(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-xl mb-4"></div>
          <div className="h-24 bg-gray-200 rounded-xl mb-4"></div>
          <div className="h-24 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
        <Network className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">Unable to load network paths data</p>
        <p className="text-sm text-gray-400 mt-1">{error}</p>
      </div>
    );
  }

  const { paths, exposure, explain } = data;
  const displayPaths = showAllPaths ? paths.paths : paths.paths.slice(0, 3);

  return (
    <div className="space-y-4" data-testid="network-paths-panel">
      {/* Exposure Summary */}
      <ExposureCard exposure={exposure} />
      
      {/* Paths List */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Route className="w-5 h-5 text-blue-600" />
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Network Paths ({paths.paths.length})
            </h4>
          </div>
          <div className="flex items-center gap-2">
            {/* Phase 3.4.3C: Clear highlights button */}
            {lockedPath && (
              <button
                onClick={clearHighlights}
                className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
                data-testid="clear-highlights-btn"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
            {paths.paths.length > 3 && (
              <button
                onClick={() => setShowAllPaths(!showAllPaths)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showAllPaths ? 'Show less' : `Show all ${paths.paths.length}`}
              </button>
            )}
          </div>
        </div>
        
        {paths.paths.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            <Target className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No paths found to influential nodes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayPaths.map((path, idx) => (
              <PathVisual 
                key={idx} 
                path={path} 
                onHighlight={onHighlightPath}
                onLock={handleLockPath}
                isLocked={lockedPath?.to === path.to && lockedPath?.kind === path.kind}
              />
            ))}
          </div>
        )}
        
        {/* Path explain bullets */}
        {paths.explain?.bullets && paths.explain.bullets.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex flex-wrap gap-3">
              {paths.explain.bullets.map((bullet, idx) => (
                <span key={idx} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {bullet}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Explain Block */}
      <ExplainBlock explain={explain} />
    </div>
  );
}
