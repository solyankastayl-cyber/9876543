/**
 * BackerDetailPage - Backer Network View
 * 
 * Shows detailed backer info with influence network visualization.
 * Displays: portfolio projects, co-investors, and network graph.
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import ForceGraph2D from 'react-force-graph-2d';
import { 
  Building2, 
  ArrowLeft,
  Network, 
  Briefcase,
  Users,
  ExternalLink,
  Shield,
  TrendingUp,
  RefreshCw,
  Globe,
  ChevronRight,
  AlertCircle,
  Zap,
  Target,
  Star
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import BackerNetworkPanel from '../../components/backers/BackerNetworkPanel';

// Influence Components
import BackerInfluenceSummary from '../../components/backers/BackerInfluenceSummary';
import BackerProjectImpactTable from '../../components/backers/BackerProjectImpactTable';
import BackerInfluenceGraph from '../../components/backers/BackerInfluenceGraph';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// ============================================================
// CATEGORY COLORS
// ============================================================

const CATEGORY_COLORS = {
  DEFI: 'bg-green-100 text-green-700',
  INFRA: 'bg-blue-100 text-blue-700',
  NFT: 'bg-purple-100 text-purple-700',
  TRADING: 'bg-yellow-100 text-yellow-700',
  GAMING: 'bg-pink-100 text-pink-700',
  LAYER1: 'bg-indigo-100 text-indigo-700',
  LAYER2: 'bg-cyan-100 text-cyan-700',
  SOCIAL: 'bg-orange-100 text-orange-700',
  ORACLE: 'bg-violet-100 text-violet-700',
};

const NODE_COLORS = {
  BACKER: '#10b981',
  PROJECT: '#3b82f6',
  TWITTER: '#8b5cf6',
  WALLET: '#f59e0b',
  CENTER: '#ef4444',
};

// ============================================================
// COMPONENTS
// ============================================================

const AuthorityBar = ({ value, max = 100, size = 'default' }) => {
  const percentage = Math.min(100, (value / max) * 100);
  const getColor = (val) => {
    if (val >= 80) return 'bg-gradient-to-r from-emerald-400 to-green-500';
    if (val >= 60) return 'bg-gradient-to-r from-blue-400 to-cyan-500';
    if (val >= 40) return 'bg-gradient-to-r from-amber-400 to-orange-500';
    return 'bg-gray-400';
  };
  
  return (
    <div className="flex items-center gap-3">
      <div className={`${size === 'large' ? 'w-36 h-3' : 'w-24 h-2'} bg-gray-100 rounded-full overflow-hidden`}>
        <div 
          className={`h-full ${getColor(value)} rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`font-bold ${size === 'large' ? 'text-2xl' : 'text-sm'} text-gray-900`}>{value}</span>
    </div>
  );
};

const MetricCard = ({ icon: Icon, label, value, color = 'violet' }) => {
  const colors = {
    violet: 'bg-gradient-to-br from-violet-50 to-purple-100 border-violet-200 text-violet-600',
    emerald: 'bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200 text-emerald-600',
    blue: 'bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-200 text-blue-600',
    amber: 'bg-gradient-to-br from-amber-50 to-orange-100 border-amber-200 text-amber-600',
  };
  
  return (
    <div className={`${colors[color]} border rounded-xl p-4 hover:shadow-md transition-all`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" />
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
};

const ProjectCard = ({ project }) => (
  <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium text-gray-900">{project.project?.name || project.projectId}</div>
        <div className="text-xs text-gray-500 mt-0.5">
          {project.round && <span className="mr-2">{project.round}</span>}
          {project.project?.categories?.slice(0, 2).join(', ')}
        </div>
      </div>
      {project.project?.stage && (
        <Badge variant="outline" className="text-xs">
          {project.project.stage}
        </Badge>
      )}
    </div>
  </div>
);

const CoInvestorCard = ({ investor, onSelect }) => (
  <button
    onClick={() => onSelect(investor.backerId || investor._id?.coBackerId || investor.id)}
    className="w-full p-3 bg-gray-50 rounded-lg hover:bg-violet-50 transition-colors text-left group"
    data-testid={`coinvestor-${investor.name || 'unknown'}`}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
          <Building2 className="w-4 h-4 text-violet-600" />
        </div>
        <div>
          <div className="font-medium text-gray-900 group-hover:text-violet-600 transition-colors">
            {investor.name || investor.backerId || investor._id?.coBackerId || 'Unknown'}
          </div>
          <div className="text-xs text-gray-500">
            {investor.sharedCount || investor.shared} shared projects
          </div>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
    </div>
  </button>
);

const TypeBadge = ({ type }) => {
  const config = {
    FUND: { label: 'VC Fund', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    VC: { label: 'VC Fund', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    FOUNDATION: { label: 'Foundation', color: 'bg-violet-100 text-violet-700 border-violet-200' },
    COMPANY: { label: 'Company', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  };
  
  const { label, color } = config[type] || { label: type, color: 'bg-gray-100 text-gray-700 border-gray-200' };
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${color}`}>
      {label}
    </span>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function BackerDetailPage() {
  const { slug } = useParams();
  const [backer, setBacker] = useState(null);
  const [network, setNetwork] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [coInvestors, setCoInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [influenceData, setInfluenceData] = useState(null);

  const fetchData = useCallback(async () => {
    if (!slug) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch backer details
      const backerRes = await fetch(`${BACKEND_URL}/api/connections/backers/${slug}`);
      const backerData = await backerRes.json();
      
      if (backerData.ok) {
        const backerInfo = backerData.data?.backer || backerData.data || backerData.backer;
        setBacker(backerInfo);
      } else {
        setError(backerData.error || 'Failed to load backer');
        return;
      }
      
      // Fetch network graph
      const networkRes = await fetch(`${BACKEND_URL}/api/connections/backers/${slug}/network`);
      const networkData = await networkRes.json();
      
      if (networkData.ok && networkData.data) {
        const nodes = (networkData.data.nodes || []).map(n => ({
          ...n,
          id: n.id,
          name: n.name || n.id,
          color: n.id === slug ? NODE_COLORS.CENTER : NODE_COLORS[n.type] || NODE_COLORS.BACKER,
          val: n.id === slug ? 15 : (n.authority || 5),
        }));
        
        const links = (networkData.data.edges || []).map(e => ({
          ...e,
          source: e.from,
          target: e.to,
          value: e.weight || 0.5,
        }));
        
        setNetwork({ nodes, links, stats: networkData.data.stats });
      }
      
      // Fetch co-investors
      const coInvestRes = await fetch(`${BACKEND_URL}/api/connections/backers/${slug}/coinvestors?limit=20`);
      const coInvestData = await coInvestRes.json();
      
      if (coInvestData.ok && coInvestData.data) {
        setCoInvestors(coInvestData.data.coinvestors || []);
      }
      
      // Fetch portfolio
      const portfolioRes = await fetch(`${BACKEND_URL}/api/connections/backers/${slug}/investments?limit=50`);
      const portfolioData = await portfolioRes.json();
      
      if (portfolioData.ok && portfolioData.data) {
        setPortfolio(portfolioData.data.investments || []);
      }
      
      // Fetch influence data
      const influenceRes = await fetch(`${BACKEND_URL}/api/connections/backers/${slug}/influence`);
      const influenceDataResult = await influenceRes.json();
      
      if (influenceDataResult.ok && influenceDataResult.data) {
        setInfluenceData(influenceDataResult.data);
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectBacker = (backerId) => {
    window.location.href = `/connections/backers/${backerId}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-violet-500" />
          <span className="text-gray-500 text-sm">Loading profile...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Link to="/connections/backers" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Backers
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <div>
              <h2 className="font-semibold text-red-900">Error loading backer</h2>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="backer-detail-page">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-5">
          {/* Back Link */}
          <Link 
            to="/connections/backers" 
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 text-sm group"
            data-testid="back-link"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Backers
          </Link>
          
          {/* Backer Info */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{backer?.name || slug}</h1>
                  <TypeBadge type={backer?.type} />
                </div>
                <p className="text-gray-500 max-w-xl">{backer?.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  {backer?.categories?.map(cat => (
                    <span 
                      key={cat}
                      className={`px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[cat] || 'bg-gray-100 text-gray-600'}`}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Authority Score</div>
              <AuthorityBar value={backer?.seedAuthority || 0} size="large" />
              <div className="text-sm text-gray-500 mt-2">
                Confidence: {((backer?.confidence || 0) * 100).toFixed(0)}%
              </div>
            </div>
          </div>
          
          {/* External Links */}
          {backer?.externalRefs?.website && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <a
                href={backer.externalRefs.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-700 text-sm"
                data-testid="external-link"
              >
                <Globe className="w-4 h-4" />
                {backer.externalRefs.website}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MetricCard icon={Users} label="Co-Investors" value={coInvestors.length} color="emerald" />
          <MetricCard icon={Briefcase} label="Portfolio" value={portfolio.length} color="blue" />
          <MetricCard icon={Zap} label="Impact Score" value={influenceData?.summary?.impactScore || '—'} color="violet" />
          <MetricCard icon={Target} label="Network Rank" value={influenceData?.summary?.networkRank || '—'} color="amber" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Network Graph */}
          <div className="lg:col-span-2">
            <BackerNetworkPanel backerId={slug} />
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Co-Investors */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Top Co-Investors
                  <Badge variant="secondary" className="ml-auto">{coInvestors.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[280px] overflow-y-auto">
                {coInvestors.length > 0 ? (
                  coInvestors.slice(0, 8).map((inv, idx) => (
                    <CoInvestorCard 
                      key={idx} 
                      investor={inv} 
                      onSelect={handleSelectBacker}
                    />
                  ))
                ) : (
                  <div className="text-center text-gray-400 py-6">
                    <Users className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    No co-investors found
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Portfolio */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  Portfolio Projects
                  <Badge variant="secondary" className="ml-auto">{portfolio.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[320px] overflow-y-auto">
                {portfolio.length > 0 ? (
                  portfolio.slice(0, 10).map((p, idx) => (
                    <ProjectCard key={idx} project={p} />
                  ))
                ) : (
                  <div className="text-center text-gray-400 py-6">
                    <Briefcase className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    No investments found
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Network Insight */}
        <div className="mt-6 p-6 bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100 rounded-xl">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-violet-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Capital Flow Analysis</h3>
              <p className="text-sm text-gray-600">
                This backer has <strong className="text-emerald-600">{coInvestors.length}</strong> co-investors and <strong className="text-blue-600">{portfolio.length}</strong> portfolio projects.
                {coInvestors.length > 0 && (
                  <> The strongest connection is with <strong className="text-violet-600">{coInvestors[0]?.name || coInvestors[0]?._id?.coBackerId || 'Unknown'}</strong> ({coInvestors[0]?.sharedCount || coInvestors[0]?.shared || 0} shared projects).</>
                )}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Co-investment links represent verified capital allocation patterns — stronger signal than social follows.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* ================================================================ */}
      {/* INFLUENCE NETWORK SECTION */}
      {/* ================================================================ */}
      {influenceData && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Network className="w-6 h-6 text-violet-500" />
              Capital Flow & Influence
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Visualizes where capital, network connections, and influence actually flow from this backer.
            </p>
          </div>
          
          {/* Influence Summary */}
          <div className="mb-6">
            <BackerInfluenceSummary summary={influenceData.summary} />
          </div>
          
          {/* Influence Graph */}
          <div className="mb-6">
            <BackerInfluenceGraph graph={influenceData.graph} />
          </div>
          
          {/* Project Impact Table */}
          <div className="mb-6">
            <BackerProjectImpactTable impact={influenceData.projectImpact} />
          </div>
        </div>
      )}
    </div>
  );
}
