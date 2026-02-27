/**
 * Registries Page (P0.2)
 * 
 * Token Registry + Address Labels Management
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Database, Tag, Building2, ChevronLeft, Search, Plus, 
  RefreshCw, Loader2, Edit2, Trash2, CheckCircle, 
  AlertTriangle, ExternalLink, Copy, Check, Filter
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { toast } from 'sonner';
import ChainBadge from '../components/ChainBadge';
import {
  searchTokens,
  getTokenStats,
  searchLabels,
  getLabelsStats,
  upsertLabel,
  deleteLabel,
  searchExchanges,
  getExchangeStats,
  seedKnownLabels,
  upsertExchange
} from '../api/registry.api';

// ============================================
// Constants
// ============================================

const LABEL_CATEGORIES = [
  { value: 'CEX', label: 'Centralized Exchange', color: 'bg-blue-100 text-blue-700' },
  { value: 'DEX', label: 'Decentralized Exchange', color: 'bg-purple-100 text-purple-700' },
  { value: 'BRIDGE', label: 'Bridge Protocol', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'LENDING', label: 'Lending Protocol', color: 'bg-green-100 text-green-700' },
  { value: 'FUND', label: 'Investment Fund', color: 'bg-amber-100 text-amber-700' },
  { value: 'WHALE', label: 'Whale Wallet', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'PROTOCOL', label: 'DeFi Protocol', color: 'bg-pink-100 text-pink-700' },
  { value: 'CONTRACT', label: 'Smart Contract', color: 'bg-gray-100 text-gray-700' },
  { value: 'MIXER', label: 'Mixer Service', color: 'bg-red-100 text-red-700' },
  { value: 'SCAM', label: 'Known Scam', color: 'bg-red-200 text-red-800' },
  { value: 'CUSTODIAN', label: 'Custodial Service', color: 'bg-teal-100 text-teal-700' },
  { value: 'OTHER', label: 'Other', color: 'bg-gray-100 text-gray-600' },
];

const CHAINS = ['ETH', 'ARB', 'OP', 'BASE', 'POLY', 'BNB', 'AVAX', 'ZKSYNC', 'SCROLL', 'LINEA'];

const CONFIDENCE_LEVELS = [
  { value: 'HIGH', label: 'High', color: 'bg-green-100 text-green-700' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-amber-100 text-amber-700' },
  { value: 'LOW', label: 'Low', color: 'bg-red-100 text-red-700' },
];

// ============================================
// Tab Navigation
// ============================================

function TabNav({ active, onChange }) {
  const tabs = [
    { id: 'tokens', label: 'Tokens', icon: Database },
    { id: 'labels', label: 'Address Labels', icon: Tag },
    { id: 'exchanges', label: 'Exchanges & Bridges', icon: Building2 },
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="flex gap-6">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              data-testid={`registry-tab-${tab.id}`}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors ${
                active === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// ============================================
// Stats Card
// ============================================

function StatsCard({ title, value, icon: Icon, iconColor = 'text-gray-500', subtext }) {
  return (
    <div className="p-4 bg-white rounded-xl border border-gray-200">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-gray-50 ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{title}</div>
          {subtext && <div className="text-xs text-gray-400 mt-1">{subtext}</div>}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Copy Button
// ============================================

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
    >
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

// ============================================
// Tokens Tab
// ============================================

function TokensTab() {
  const [tokens, setTokens] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [chainFilter, setChainFilter] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { q: searchQuery, limit: 100 };
      if (chainFilter && chainFilter !== '__all__') params.chain = chainFilter;
      
      const [tokensRes, statsRes] = await Promise.all([
        searchTokens(params),
        getTokenStats()
      ]);
      
      if (tokensRes.ok) setTokens(tokensRes.data.tokens);
      if (statsRes.ok) setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
      toast.error('Failed to load tokens');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, chainFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard 
            title="Total Tokens" 
            value={stats.totalTokens} 
            icon={Database}
            iconColor="text-blue-500"
          />
          <StatsCard 
            title="Active" 
            value={stats.tokensByStatus?.ACTIVE || 0} 
            icon={CheckCircle}
            iconColor="text-green-500"
          />
          <StatsCard 
            title="Unknown" 
            value={stats.tokensByStatus?.UNKNOWN || 0} 
            icon={AlertTriangle}
            iconColor="text-amber-500"
          />
          <StatsCard 
            title="Added (7d)" 
            value={stats.recentlyAdded} 
            icon={Plus}
            iconColor="text-purple-500"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by symbol, name or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="token-search"
          />
        </div>
        <Select value={chainFilter} onValueChange={setChainFilter}>
          <SelectTrigger className="w-40" data-testid="token-chain-filter">
            <SelectValue placeholder="All Chains" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Chains</SelectItem>
            {CHAINS.map(chain => (
              <SelectItem key={chain} value={chain}>{chain}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </Button>
      </div>

      {/* Token List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Token</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chain</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sources</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading tokens...
                </td>
              </tr>
            ) : tokens.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No tokens found
                </td>
              </tr>
            ) : (
              tokens.map((token) => (
                <tr key={token.tokenId} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                        {token.symbol?.slice(0, 2) || '??'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{token.symbol || 'UNKNOWN'}</div>
                        <div className="text-xs text-gray-500">{token.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <ChainBadge chain={token.chain} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <code className="text-xs text-gray-600 font-mono">
                        {token.address.slice(0, 10)}...{token.address.slice(-6)}
                      </code>
                      <CopyButton text={token.address} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      token.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                      token.status === 'DEPRECATED' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {token.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {token.sources?.map((source, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                          {source}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// Add/Edit Label Dialog
// ============================================

function LabelDialog({ open, onClose, onSave, label = null }) {
  const [formData, setFormData] = useState({
    chain: '',
    address: '',
    name: '',
    category: '',
    subcategory: '',
    confidence: 'MEDIUM',
    tags: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (label) {
      setFormData({
        chain: label.chain || '',
        address: label.address || '',
        name: label.name || '',
        category: label.category || '',
        subcategory: label.subcategory || '',
        confidence: label.confidence || 'MEDIUM',
        tags: label.tags?.join(', ') || ''
      });
    } else {
      setFormData({
        chain: '',
        address: '',
        name: '',
        category: '',
        subcategory: '',
        confidence: 'MEDIUM',
        tags: ''
      });
    }
  }, [label, open]);

  const handleSave = async () => {
    if (!formData.chain || !formData.address || !formData.name || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const data = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      };
      await onSave(data);
      onClose();
      toast.success(label ? 'Label updated' : 'Label created');
    } catch (error) {
      toast.error('Failed to save label');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{label ? 'Edit Label' : 'Add New Label'}</DialogTitle>
          <DialogDescription>
            Label an address to identify its type and entity
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Chain *</label>
              <Select value={formData.chain} onValueChange={(v) => setFormData({ ...formData, chain: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select chain" />
                </SelectTrigger>
                <SelectContent>
                  {CHAINS.map(chain => (
                    <SelectItem key={chain} value={chain}>{chain}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Category *</label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {LABEL_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Address *</label>
            <Input
              placeholder="0x..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              disabled={!!label}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Name *</label>
            <Input
              placeholder="e.g., Binance Hot Wallet"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Subcategory</label>
              <Input
                placeholder="e.g., hot, cold, router"
                value={formData.subcategory}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Confidence</label>
              <Select value={formData.confidence} onValueChange={(v) => setFormData({ ...formData, confidence: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONFIDENCE_LEVELS.map(level => (
                    <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Tags</label>
            <Input
              placeholder="deposit, withdrawal, swap (comma separated)"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {label ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Labels Tab
// ============================================

function LabelsTab() {
  const [labels, setLabels] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [chainFilter, setChainFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { q: searchQuery, limit: 100 };
      if (chainFilter && chainFilter !== '__all__') params.chain = chainFilter;
      if (categoryFilter && categoryFilter !== '__all__') params.category = categoryFilter;
      
      const [labelsRes, statsRes] = await Promise.all([
        searchLabels(params),
        getLabelsStats()
      ]);
      
      if (labelsRes.ok) setLabels(labelsRes.data.labels);
      if (statsRes.ok) setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch labels:', error);
      toast.error('Failed to load labels');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, chainFilter, categoryFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleSaveLabel = async (data) => {
    await upsertLabel(data);
    fetchData();
  };

  const handleDeleteLabel = async (chain, address) => {
    if (!window.confirm('Are you sure you want to delete this label?')) return;
    try {
      await deleteLabel(chain, address);
      toast.success('Label deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete label');
    }
  };

  const handleSeedLabels = async () => {
    try {
      const result = await seedKnownLabels();
      toast.success(`Seeded ${result.data.entities} entities and ${result.data.labels} labels`);
      fetchData();
    } catch (error) {
      toast.error('Failed to seed labels');
    }
  };

  const getCategoryBadge = (category) => {
    const cat = LABEL_CATEGORIES.find(c => c.value === category);
    if (!cat) return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">{category}</span>;
    return <span className={`px-2 py-1 rounded text-xs font-medium ${cat.color}`}>{cat.label}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatsCard 
            title="Total Labels" 
            value={stats.totalLabels} 
            icon={Tag}
            iconColor="text-blue-500"
          />
          <StatsCard 
            title="Exchanges" 
            value={(stats.byCategory?.CEX || 0) + (stats.byCategory?.DEX || 0)} 
            icon={Building2}
            iconColor="text-purple-500"
          />
          <StatsCard 
            title="Bridges" 
            value={stats.byCategory?.BRIDGE || 0} 
            icon={ExternalLink}
            iconColor="text-indigo-500"
          />
          <StatsCard 
            title="Verified" 
            value={stats.verified} 
            icon={CheckCircle}
            iconColor="text-green-500"
          />
          <StatsCard 
            title="Added (7d)" 
            value={stats.recentlyAdded} 
            icon={Plus}
            iconColor="text-amber-500"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="label-search"
          />
        </div>
        <Select value={chainFilter} onValueChange={setChainFilter}>
          <SelectTrigger className="w-32" data-testid="label-chain-filter">
            <SelectValue placeholder="Chain" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Chains</SelectItem>
            {CHAINS.map(chain => (
              <SelectItem key={chain} value={chain}>{chain}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40" data-testid="label-category-filter">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Categories</SelectItem>
            {LABEL_CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </Button>
        <Button onClick={() => { setEditingLabel(null); setDialogOpen(true); }} data-testid="add-label-btn">
          <Plus className="w-4 h-4 mr-2" />
          Add Label
        </Button>
        <Button variant="outline" onClick={handleSeedLabels} data-testid="seed-labels-btn">
          <Database className="w-4 h-4 mr-2" />
          Seed Known
        </Button>
      </div>

      {/* Labels List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chain</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tags</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading labels...
                </td>
              </tr>
            ) : labels.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No labels found. Click "Seed Known" to add popular exchanges and bridges.
                </td>
              </tr>
            ) : (
              labels.map((label) => (
                <tr key={label.labelId} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{label.name}</div>
                    {label.subcategory && (
                      <div className="text-xs text-gray-500">{label.subcategory}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ChainBadge chain={label.chain} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <code className="text-xs text-gray-600 font-mono">
                        {label.address.slice(0, 10)}...{label.address.slice(-6)}
                      </code>
                      <CopyButton text={label.address} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {getCategoryBadge(label.category)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      CONFIDENCE_LEVELS.find(l => l.value === label.confidence)?.color || 'bg-gray-100 text-gray-600'
                    }`}>
                      {label.confidence}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {label.tags?.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                      {label.tags?.length > 3 && (
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                          +{label.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditingLabel(label); setDialogOpen(true); }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteLabel(label.chain, label.address)}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <LabelDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveLabel}
        label={editingLabel}
      />
    </div>
  );
}

// ============================================
// Exchanges Tab
// ============================================

function ExchangesTab() {
  const [exchanges, setExchanges] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [expanded, setExpanded] = useState(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { q: searchQuery, limit: 100 };
      if (typeFilter && typeFilter !== '__all__') params.type = typeFilter;
      
      const [exchangesRes, statsRes] = await Promise.all([
        searchExchanges(params),
        getExchangeStats()
      ]);
      
      if (exchangesRes.ok) setExchanges(exchangesRes.data.entities);
      if (statsRes.ok) setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch exchanges:', error);
      toast.error('Failed to load exchanges');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, typeFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const toggleExpand = (entityId) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(entityId)) {
        next.delete(entityId);
      } else {
        next.add(entityId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard 
            title="Total Entities" 
            value={stats.totalEntities} 
            icon={Building2}
            iconColor="text-blue-500"
          />
          <StatsCard 
            title="CEX" 
            value={stats.byType?.CEX || 0} 
            icon={Building2}
            iconColor="text-purple-500"
          />
          <StatsCard 
            title="Bridges" 
            value={stats.byType?.BRIDGE || 0} 
            icon={ExternalLink}
            iconColor="text-indigo-500"
          />
          <StatsCard 
            title="Total Wallets" 
            value={stats.totalWallets} 
            icon={Database}
            iconColor="text-green-500"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="exchange-search"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40" data-testid="exchange-type-filter">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Types</SelectItem>
            <SelectItem value="CEX">CEX</SelectItem>
            <SelectItem value="DEX">DEX</SelectItem>
            <SelectItem value="BRIDGE">Bridge</SelectItem>
            <SelectItem value="PROTOCOL">Protocol</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </Button>
      </div>

      {/* Exchanges List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            Loading exchanges...
          </div>
        ) : exchanges.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            No exchanges found
          </div>
        ) : (
          exchanges.map((exchange) => (
            <div key={exchange.entityId} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => toggleExpand(exchange.entityId)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-600">
                    {exchange.shortName?.slice(0, 2) || '??'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{exchange.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        exchange.type === 'CEX' ? 'bg-blue-100 text-blue-700' :
                        exchange.type === 'DEX' ? 'bg-purple-100 text-purple-700' :
                        exchange.type === 'BRIDGE' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {exchange.type}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        exchange.tier === 1 ? 'bg-amber-100 text-amber-700' :
                        exchange.tier === 2 ? 'bg-gray-100 text-gray-600' :
                        'bg-gray-50 text-gray-500'
                      }`}>
                        Tier {exchange.tier}
                      </span>
                      {exchange.isRegulated && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                          Regulated
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{exchange.totalWallets} wallets</div>
                    <div className="flex gap-1 mt-1">
                      {exchange.chainsPresent?.slice(0, 4).map((chain, idx) => (
                        <ChainBadge key={idx} chain={chain} size="xs" />
                      ))}
                      {exchange.chainsPresent?.length > 4 && (
                        <span className="text-xs text-gray-500">+{exchange.chainsPresent.length - 4}</span>
                      )}
                    </div>
                  </div>
                  <ChevronLeft className={`w-5 h-5 text-gray-400 transition-transform ${expanded.has(exchange.entityId) ? '-rotate-90' : ''}`} />
                </div>
              </div>
              
              {expanded.has(exchange.entityId) && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="text-sm font-medium text-gray-700 mb-3">Wallets</div>
                  <div className="space-y-2">
                    {exchange.wallets?.map((wallet, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-white rounded-lg">
                        <ChainBadge chain={wallet.chain} size="sm" />
                        <code className="text-xs text-gray-600 font-mono flex-1">
                          {wallet.address}
                        </code>
                        <CopyButton text={wallet.address} />
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          wallet.type === 'hot' ? 'bg-red-100 text-red-700' :
                          wallet.type === 'cold' ? 'bg-blue-100 text-blue-700' :
                          wallet.type === 'router' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {wallet.type}
                        </span>
                      </div>
                    ))}
                  </div>
                  {exchange.website && (
                    <a 
                      href={exchange.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {exchange.website}
                    </a>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================
// Main Page
// ============================================

export default function RegistriesPage() {
  const [activeTab, setActiveTab] = useState('labels');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Database className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Registries</h1>
                <p className="text-sm text-gray-500">Token metadata and address labels management</p>
              </div>
            </div>
            
            <Link
              to="/settings"
              className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Settings
            </Link>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <TabNav active={activeTab} onChange={setActiveTab} />
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'tokens' && <TokensTab />}
        {activeTab === 'labels' && <LabelsTab />}
        {activeTab === 'exchanges' && <ExchangesTab />}
      </main>
    </div>
  );
}
