/**
 * ConnectionsBackersPage - Backers (Funds, Projects, DAOs) View
 * 
 * Shows real-world entities that provide seed authority.
 * This is the "truth anchor" layer - entities that exist
 * independently of Twitter activity.
 * 
 * Phase 1: Basic listing with filters
 * Phase 2: Will include linked accounts and authority flow
 */
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Network, 
  Radio,
  Search,
  Filter,
  X,
  RefreshCw,
  Globe,
  ChevronRight,
  Shield,
  Link2,
  ExternalLink,
  TrendingUp,
  BarChart3,
  Trophy
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { IconVCFund, IconInfluencer, IconNFT, IconMedia } from '../../components/icons/FomoIcons';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// ============================================================
// CONSTANTS
// ============================================================

const BACKER_TYPES = [
  { value: 'FUND', label: 'VC Funds', Icon: IconVCFund, color: 'green', tooltip: 'Venture Capital funds investing in crypto projects' },
  { value: 'INFLUENCER', label: 'Influencers', Icon: IconInfluencer, color: 'blue', tooltip: 'Key opinion leaders with significant reach' },
  { value: 'NFT_PROJECT', label: 'NFT Projects', Icon: IconNFT, color: 'purple', tooltip: 'NFT collections and marketplaces with community influence' },
  { value: 'MEDIA', label: 'Media Partners', Icon: IconMedia, color: 'yellow', tooltip: 'News outlets, podcasts, and content creators' },
];

const CATEGORY_COLORS = {
  DEFI: 'bg-green-100 text-green-700',
  INFRA: 'bg-blue-100 text-blue-700',
  NFT: 'bg-purple-100 text-purple-700',
  TRADING: 'bg-yellow-100 text-yellow-700',
  GAMING: 'bg-pink-100 text-pink-700',
  SECURITY: 'bg-red-100 text-red-700',
  LAYER1: 'bg-indigo-100 text-indigo-700',
  LAYER2: 'bg-cyan-100 text-cyan-700',
  SOCIAL: 'bg-orange-100 text-orange-700',
  DATA: 'bg-teal-100 text-teal-700',
  ORACLE: 'bg-violet-100 text-violet-700',
};

// ============================================================
// COMPONENTS
// ============================================================

const TypeBadge = ({ type }) => {
  const config = BACKER_TYPES.find(t => t.value === type) || BACKER_TYPES[0];
  
  // No background, no border - just icon and text
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
      {config.Icon && <config.Icon size={14} className="text-gray-400" />}
      <span>{config.label.replace(/s$/, '')}</span>
    </span>
  );
};

const AuthorityBar = ({ value, max = 100 }) => {
  const percentage = (value / max) * 100;
  const getColor = (val) => {
    if (val >= 80) return 'bg-green-500';
    if (val >= 60) return 'bg-blue-500';
    if (val >= 40) return 'bg-yellow-500';
    return 'bg-gray-400';
  };
  
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor(value)} transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );
};

const BackerCard = ({ backer }) => (
  <Link to={`/connections/backers/${backer.slug || backer.id || backer._id}`}>
    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
      <CardContent className="p-4 h-[140px] flex flex-col">
        <div className="flex items-start justify-between flex-1">
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="font-semibold text-gray-900 truncate mb-1">{backer.name}</h3>
            
            {backer.description && (
              <p className="text-sm text-gray-500 mb-2 line-clamp-1">{backer.description}</p>
            )}
            
            <div className="flex items-center gap-2 flex-wrap">
              {backer.categories?.slice(0, 3).map(cat => (
                <span 
                  key={cat} 
                  className={`px-1.5 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[cat] || 'bg-gray-100 text-gray-600'}`}
                >
                  {cat}
                </span>
              ))}
              {backer.categories?.length > 3 && (
                <span className="text-xs text-gray-400">+{backer.categories.length - 3}</span>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1 flex-shrink-0 w-28">
            <TypeBadge type={backer.type} />
            <AuthorityBar value={backer.seedAuthority} />
            <span className="text-xs text-gray-500">
              Confidence: {((backer.confidence || 0.7) * 100).toFixed(0)}%
            </span>
          </div>
        </div>
        
        {backer.externalRefs?.website && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <span 
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              onClick={(e) => { e.preventDefault(); window.open(backer.externalRefs.website, '_blank'); }}
            >
              <ExternalLink className="w-3 h-3" />
              Website
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  </Link>
);

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function ConnectionsBackersPage() {
  const [backers, setBackers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Fetch backers
  useEffect(() => {
    const fetchBackers = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (selectedType) params.append('type', selectedType);
        if (search) params.append('search', search);
        
        const res = await fetch(`${BACKEND_URL}/api/connections/backers?${params}`);
        
        // Check if response is ok
        if (!res.ok) {
          // Use mock data if API not available
          const mockBackers = [
            { id: '1', name: 'a16z Crypto', slug: 'a16z', type: 'FUND', seedAuthority: 95, confidence: 0.92, categories: ['DEFI', 'INFRA', 'LAYER1'], description: 'Andreessen Horowitz crypto fund', externalRefs: { website: 'https://a16zcrypto.com' } },
            { id: '2', name: 'Paradigm', slug: 'paradigm', type: 'FUND', seedAuthority: 92, confidence: 0.90, categories: ['DEFI', 'TRADING'], description: 'Research-driven technology investment firm', externalRefs: { website: 'https://paradigm.xyz' } },
            { id: '3', name: 'Multicoin Capital', slug: 'multicoin', type: 'FUND', seedAuthority: 88, confidence: 0.85, categories: ['INFRA', 'LAYER1'], description: 'Thesis-driven crypto fund', externalRefs: { website: 'https://multicoin.capital' } },
            { id: '4', name: 'Cobie', slug: 'cobie', type: 'INFLUENCER', seedAuthority: 85, confidence: 0.88, categories: ['TRADING', 'DEFI'], description: 'Crypto thought leader and trader' },
            { id: '5', name: 'Punk6529', slug: 'punk6529', type: 'INFLUENCER', seedAuthority: 82, confidence: 0.86, categories: ['NFT', 'SOCIAL'], description: 'NFT collector and community builder' },
            { id: '6', name: 'Azuki', slug: 'azuki', type: 'NFT_PROJECT', seedAuthority: 78, confidence: 0.80, categories: ['NFT', 'GAMING'], description: 'Leading NFT collection', externalRefs: { website: 'https://azuki.com' } },
            { id: '7', name: 'The Block', slug: 'theblock', type: 'MEDIA', seedAuthority: 75, confidence: 0.82, categories: ['DATA', 'SOCIAL'], description: 'Crypto news and research', externalRefs: { website: 'https://theblock.co' } },
            { id: '8', name: 'Sequoia Capital', slug: 'sequoia', type: 'FUND', seedAuthority: 90, confidence: 0.88, categories: ['INFRA', 'DEFI'], description: 'Global venture capital firm' },
          ];
          
          let filtered = mockBackers;
          if (selectedType) {
            filtered = filtered.filter(b => b.type === selectedType);
          }
          if (search) {
            const q = search.toLowerCase();
            filtered = filtered.filter(b => 
              b.name.toLowerCase().includes(q) ||
              b.description?.toLowerCase().includes(q)
            );
          }
          
          setBackers(filtered);
          setError(null);
          return;
        }
        
        const data = await res.json();
        
        if (data.ok) {
          setBackers(data.data.backers || []);
          setError(null);
        } else {
          setError(data.error || 'Failed to load backers');
        }
      } catch (err) {
        // Fallback to mock data on error
        const mockBackers = [
          { id: '1', name: 'a16z Crypto', slug: 'a16z', type: 'FUND', seedAuthority: 95, confidence: 0.92, categories: ['DEFI', 'INFRA', 'LAYER1'], description: 'Andreessen Horowitz crypto fund', externalRefs: { website: 'https://a16zcrypto.com' } },
          { id: '2', name: 'Paradigm', slug: 'paradigm', type: 'FUND', seedAuthority: 92, confidence: 0.90, categories: ['DEFI', 'TRADING'], description: 'Research-driven technology investment firm', externalRefs: { website: 'https://paradigm.xyz' } },
          { id: '3', name: 'Multicoin Capital', slug: 'multicoin', type: 'FUND', seedAuthority: 88, confidence: 0.85, categories: ['INFRA', 'LAYER1'], description: 'Thesis-driven crypto fund', externalRefs: { website: 'https://multicoin.capital' } },
          { id: '4', name: 'Cobie', slug: 'cobie', type: 'INFLUENCER', seedAuthority: 85, confidence: 0.88, categories: ['TRADING', 'DEFI'], description: 'Crypto thought leader and trader' },
          { id: '5', name: 'Punk6529', slug: 'punk6529', type: 'INFLUENCER', seedAuthority: 82, confidence: 0.86, categories: ['NFT', 'SOCIAL'], description: 'NFT collector and community builder' },
          { id: '6', name: 'Azuki', slug: 'azuki', type: 'NFT_PROJECT', seedAuthority: 78, confidence: 0.80, categories: ['NFT', 'GAMING'], description: 'Leading NFT collection', externalRefs: { website: 'https://azuki.com' } },
          { id: '7', name: 'The Block', slug: 'theblock', type: 'MEDIA', seedAuthority: 75, confidence: 0.82, categories: ['DATA', 'SOCIAL'], description: 'Crypto news and research', externalRefs: { website: 'https://theblock.co' } },
          { id: '8', name: 'Sequoia Capital', slug: 'sequoia', type: 'FUND', seedAuthority: 90, confidence: 0.88, categories: ['INFRA', 'DEFI'], description: 'Global venture capital firm' },
        ];
        
        let filtered = mockBackers;
        if (selectedType) {
          filtered = filtered.filter(b => b.type === selectedType);
        }
        if (search) {
          const q = search.toLowerCase();
          filtered = filtered.filter(b => 
            b.name.toLowerCase().includes(q) ||
            b.description?.toLowerCase().includes(q)
          );
        }
        
        setBackers(filtered);
        setError(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBackers();
  }, [selectedType, search]);

  // Stats
  const stats = useMemo(() => {
    const byType = {};
    let totalAuthority = 0;
    
    backers.forEach(b => {
      byType[b.type] = (byType[b.type] || 0) + 1;
      totalAuthority += b.seedAuthority;
    });
    
    return {
      total: backers.length,
      byType,
      avgAuthority: backers.length > 0 ? Math.round(totalAuthority / backers.length) : 0,
    };
  }, [backers]);

  // Filtered backers
  const filteredBackers = useMemo(() => {
    let result = backers;
    
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(b => 
        b.name.toLowerCase().includes(searchLower) ||
        b.description?.toLowerCase().includes(searchLower)
      );
    }
    
    return result;
  }, [backers, search]);

  return (
    <div className="min-h-screen bg-gray-50" data-testid="backers-page">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Title & Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Building2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Backers</h1>
                <p className="text-sm text-gray-500">Real-world entities that back the crypto ecosystem</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search backers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-64"
                  data-testid="backers-search"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel - Always visible */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium text-gray-700">Type:</span>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedType('')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  !selectedType ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {BACKER_TYPES.map(t => (
                <div key={t.value} className="relative group">
                  <button
                    onClick={() => setSelectedType(t.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1.5 ${
                      selectedType === t.value ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t.Icon && <t.Icon size={16} />} {t.label}
                  </button>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
                    {t.tooltip}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
                  </div>
                </div>
              ))}
            </div>
            
            {(selectedType || search) && (
              <button
                onClick={() => { setSelectedType(''); setSearch(''); }}
                className="ml-auto text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Compact Stats - Only show when data exists */}
      {stats.total > 0 && (
        <div className="bg-white border-b border-gray-100 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-4 text-sm">
            <span className="text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredBackers.length}</span> of {stats.total} backers
            </span>
            {stats.avgAuthority > 0 && (
              <span className="text-gray-500 flex items-center gap-1">
                • Avg Authority: <span className="font-semibold text-gray-700">{stats.avgAuthority}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : filteredBackers.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No backers found</h3>
            <p className="text-gray-500 mb-4">
              {search || selectedType 
                ? 'Try adjusting your filters'
                : 'Backers will appear here once added by administrators'}
            </p>
            {(search || selectedType) && (
              <Button variant="outline" onClick={() => { setSearch(''); setSelectedType(''); }}>
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          /* Backers Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="backers-grid">
            {filteredBackers.map(backer => (
              <BackerCard key={backer.id} backer={backer} />
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-100 rounded-xl">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What are Backers?</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                <strong>Backers</strong> are real-world anchors (funds, projects, DAOs) that exist 
                independently of Twitter. They provide <strong>Seed Authority</strong> — base weight 
                that Twitter accounts inherit through linkages.
              </p>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                <strong>Key principle:</strong> Twitter never creates authority — it only inherits 
                and amplifies. Network v2 uses Backers as anchors for validating the connection graph.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
