/**
 * Narratives by Sector Component (PART 2)
 * 
 * SectorNarrative = Narrative WHERE involvedTokens ⊆ Sector.tokens
 * 
 * ❌ НЕ делаем:
 * - Heatmap с цветами "hot/cold"
 * - Ranking sectors
 * - Intent из sector activity
 * 
 * ✅ Делаем:
 * - Простую группировку
 * - Filtered synthesis
 * - Sector = filter, не narrative
 */
import { useState, useEffect } from 'react';
import { Layers, ChevronRight, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { marketApi } from '../api';

export function NarrativesBySectorCard() {
  const navigate = useNavigate();
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSector, setExpandedSector] = useState(null);
  
  useEffect(() => {
    async function loadSectorNarratives() {
      setLoading(true);
      try {
        const response = await marketApi.getNarrativesBySector('24h');
        if (response.ok) {
          setSectors(response.data.sectors || []);
        }
      } catch (error) {
        console.error('Failed to load sector narratives:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadSectorNarratives();
  }, []);
  
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-indigo-500 animate-pulse" />
          <h3 className="text-base font-semibold text-gray-900">Narratives by Sector</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  
  // Empty state
  if (sectors.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-semibold text-gray-900">Narratives by Sector</h3>
          </div>
          <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-medium">
            24h
          </span>
        </div>
        
        <p className="text-xs text-gray-500 mb-4">
          Sector-specific pattern aggregation
        </p>
        
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600">No sector patterns detected</p>
          <p className="text-xs text-gray-500 mt-1">
            Activity is distributed across sectors
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-500" />
          <h3 className="text-base font-semibold text-gray-900">Narratives by Sector</h3>
        </div>
        <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-medium">
          {sectors.length} sectors
        </span>
      </div>
      
      <p className="text-xs text-gray-500 mb-4">
        Sector-specific pattern aggregation
      </p>
      
      <div className="space-y-2">
        {sectors.map((sector) => (
          <SectorCard
            key={sector.sectorId}
            sector={sector}
            expanded={expandedSector === sector.sectorId}
            onToggle={() => setExpandedSector(
              expandedSector === sector.sectorId ? null : sector.sectorId
            )}
            onNavigate={navigate}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Get sector color scheme
 */
function getSectorColor(sectorId) {
  const colors = {
    stablecoins: 'bg-blue-50 text-blue-700 border-blue-200',
    defi: 'bg-purple-50 text-purple-700 border-purple-200',
    infra: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    meme: 'bg-amber-50 text-amber-700 border-amber-200',
    ai: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  return colors[sectorId] || 'bg-gray-50 text-gray-700 border-gray-200';
}

/**
 * Individual Sector Card
 */
function SectorCard({ sector, expanded, onToggle, onNavigate }) {
  const { sectorLabel, narrativeCount, narratives } = sector;
  const colorClass = getSectorColor(sector.sectorId);
  
  return (
    <div 
      className={`border rounded-lg overflow-hidden hover:shadow-sm transition-all ${
        expanded ? 'border-indigo-300' : 'border-gray-200'
      }`}
    >
      {/* Header */}
      <div
        className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-lg border font-medium text-sm ${colorClass}`}>
              {sectorLabel}
            </div>
            <div className="text-xs text-gray-500">
              {narrativeCount} narrative{narrativeCount !== 1 ? 's' : ''}
            </div>
          </div>
          <ChevronRight 
            className={`w-4 h-4 text-gray-400 transition-transform ${
              expanded ? 'rotate-90' : ''
            }`}
          />
        </div>
      </div>
      
      {/* Expanded narratives */}
      {expanded && narratives.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 p-3">
          <div className="space-y-2">
            {narratives.map((narrative) => (
              <div
                key={narrative.id}
                className="bg-white rounded-lg p-3 hover:bg-indigo-50 transition-colors cursor-pointer border border-gray-100"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    {/* Category badge */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-medium capitalize">
                        {narrative.category}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-600">
                        {narrative.pattern?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {narrative.theme}
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{narrative.supportScore.signals} signals</span>
                      <span>•</span>
                      <span>{narrative.supportScore.tokens} tokens</span>
                    </div>
                  </div>
                  
                  <TrendingUp className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
