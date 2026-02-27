/**
 * Market Narratives Component v2 - WITH TAXONOMY
 * 
 * Показывает агрегированные факты более высокого порядка с taxonomy
 * 
 * ❌ НЕ intent
 * ❌ НЕ прогноз
 * ✅ Синтез signals
 * ✅ Обнаруженная повторяемость
 * ✅ Category + Pattern + Scope
 */
import { useState, useEffect } from 'react';
import { TrendingUp, ChevronRight, Info, Layers, Target, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { marketApi } from '../api';

export function MarketNarrativesCard() {
  const navigate = useNavigate();
  const [narratives, setNarratives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [interpretation, setInterpretation] = useState(null);
  const [expanded, setExpanded] = useState(null);
  
  useEffect(() => {
    async function loadNarratives() {
      setLoading(true);
      try {
        const response = await marketApi.getNarratives('24h', 5);
        if (response.ok) {
          setNarratives(response.data.narratives || []);
          setInterpretation(response.data.interpretation);
        }
      } catch (error) {
        console.error('Failed to load narratives:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadNarratives();
  }, []);
  
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-purple-500 animate-pulse" />
          <h3 className="text-base font-semibold text-gray-900">Market Narratives</h3>
        </div>
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  
  // Empty state
  if (narratives.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <h3 className="text-base font-semibold text-gray-900">Market Narratives</h3>
          </div>
          <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded font-medium">
            24h Window
          </span>
        </div>
        
        <p className="text-xs text-gray-500 mb-4">
          Coordinated patterns across multiple tokens
        </p>
        
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600">
            {interpretation?.headline || 'No coordinated patterns detected'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {interpretation?.description || 'Activity appears dispersed'}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-500" />
          <h3 className="text-base font-semibold text-gray-900">Market Narratives</h3>
        </div>
        <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded font-medium">
          {narratives[0]?.window || '24h'}
        </span>
      </div>
      
      {/* Why this matters */}
      <p className="text-xs text-gray-500 mb-4">
        {interpretation?.description || 'Coordinated patterns detected across multiple tokens'}
      </p>
      
      <div className="space-y-3">
        {narratives.map((narrative) => (
          <NarrativeCard 
            key={narrative.id}
            narrative={narrative}
            expanded={expanded === narrative.id}
            onToggle={() => setExpanded(expanded === narrative.id ? null : narrative.id)}
            onNavigate={navigate}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Get category icon and color
 */
function getCategoryStyle(category) {
  switch (category) {
    case 'flow':
      return { icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' };
    case 'activity':
      return { icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' };
    case 'structure':
      return { icon: Layers, color: 'text-emerald-600', bg: 'bg-emerald-50' };
    case 'actors':
      return { icon: Target, color: 'text-amber-600', bg: 'bg-amber-50' };
    case 'composite':
      return { icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50' };
    default:
      return { icon: TrendingUp, color: 'text-gray-600', bg: 'bg-gray-50' };
  }
}

/**
 * Format pattern for display
 */
function formatPattern(pattern) {
  return pattern?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
}

/**
 * Individual Narrative Card with Taxonomy
 */
function NarrativeCard({ narrative, expanded, onToggle, onNavigate }) {
  const { theme, whyItMatters, evidence, supportScore, category, pattern, scope, sector } = narrative;
  
  const categoryStyle = getCategoryStyle(category);
  const CategoryIcon = categoryStyle.icon;
  
  // Get unique tokens from evidence
  const uniqueTokens = evidence.reduce((acc, e) => {
    if (!acc.find(t => t.token === e.token)) {
      acc.push(e);
    }
    return acc;
  }, []).slice(0, 3);
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:border-purple-300 transition-colors">
      {/* Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            {/* Taxonomy badges */}
            <div className="flex items-center gap-2 mb-2">
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${categoryStyle.bg} ${categoryStyle.color}`}>
                <CategoryIcon className="w-3 h-3" />
                <span className="capitalize">{category || 'unknown'}</span>
              </div>
              {scope && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  {scope}
                </span>
              )}
              {sector && (
                <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded capitalize">
                  {sector}
                </span>
              )}
            </div>
            
            <h4 className="text-sm font-semibold text-gray-900 mb-1">
              {theme}
            </h4>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Info className="w-3.5 h-3.5" />
              <span>{whyItMatters}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-xs font-semibold text-purple-600">
                {supportScore.signals} signals
              </div>
              <div className="text-xs text-gray-500">
                {supportScore.tokens} tokens
              </div>
            </div>
            <ChevronRight 
              className={`w-4 h-4 text-gray-400 transition-transform ${
                expanded ? 'rotate-90' : ''
              }`}
            />
          </div>
        </div>
      </div>
      
      {/* Expanded evidence */}
      {expanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          {/* Pattern info */}
          <div className="mb-3 pb-3 border-b border-gray-200">
            <div className="text-xs font-medium text-gray-700 mb-1">
              Pattern: <span className="text-purple-600">{formatPattern(pattern)}</span>
            </div>
            <div className="text-xs text-gray-500">
              Machine classification: {pattern}
            </div>
          </div>
          
          <div className="text-xs font-medium text-gray-700 mb-2">
            Evidence ({evidence.length} signals):
          </div>
          <div className="space-y-2">
            {uniqueTokens.map((e, i) => (
              <div
                key={i}
                onClick={() => onNavigate(`/tokens/${e.token}`)}
                className="flex items-center justify-between p-2 bg-white rounded hover:bg-purple-50 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-purple-600">
                      {e.symbol?.slice(0, 2) || '??'}
                    </span>
                  </div>
                  <div className="text-xs">
                    <div className="font-medium text-gray-900">
                      {e.symbol || e.token.slice(0, 10) + '...'}
                    </div>
                    <div className="text-gray-500">
                      {e.signalType?.replace('_', ' ')} • {e.deviation?.toFixed(1)}x deviation
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
            
            {evidence.length > 3 && (
              <div className="text-xs text-gray-500 text-center pt-1">
                + {evidence.length - 3} more signals
              </div>
            )}
          </div>
          
          {/* CTA */}
          <button
            onClick={() => onNavigate(`/tokens/${uniqueTokens[0].token}`)}
            className="w-full mt-3 py-2 text-xs font-medium text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 rounded transition-colors"
          >
            Investigate further
          </button>
        </div>
      )}
    </div>
  );
}
