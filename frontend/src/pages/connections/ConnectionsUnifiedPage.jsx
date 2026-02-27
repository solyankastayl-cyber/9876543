import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, RefreshCw, Scale } from 'lucide-react';
import FacetTabs from '../../components/connections/FacetTabs';
import UnifiedAccountCard from '../../components/connections/UnifiedAccountCard';
import CompareDrawer from '../../components/connections/CompareDrawer';
import WhyThisMatters from '../../components/connections/WhyThisMatters';
import PresetSwitcher from '../../components/connections/PresetSwitcher';
import { fetchUnifiedAccounts, UNIFIED_FACETS } from '../../api/connectionsUnified.api';
import { getWatchlists, addToWatchlist } from '../../api/connectionsIntelligence.api';

export default function ConnectionsUnifiedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [facetTitle, setFacetTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [counters, setCounters] = useState({});
  
  // Compare state
  const [compareItems, setCompareItems] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  
  // Explain state
  const [explainItem, setExplainItem] = useState(null);
  
  // Watchlist state
  const [watchlists, setWatchlists] = useState([]);
  const [savedItems, setSavedItems] = useState(new Set());

  const activeFacet = searchParams.get('facet') || 'SMART';

  // Load watchlists on mount
  useEffect(() => {
    getWatchlists().then(data => {
      setWatchlists(data.data || []);
      const saved = new Set();
      (data.data || []).forEach(wl => {
        (wl.items || []).forEach(item => saved.add(item.entityId));
      });
      setSavedItems(saved);
    }).catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUnifiedAccounts({ facet: activeFacet, q: searchQuery || undefined, limit: 60 });
      setAccounts(data.data || data.items || []);
      setFacetTitle(data.title || activeFacet);
      setCounters(data.meta?.counters || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeFacet, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFacetChange = (key) => {
    setSearchParams({ facet: key });
  };

  const filteredAccounts = useMemo(() => {
    if (!searchQuery) return accounts;
    const q = searchQuery.toLowerCase();
    return accounts.filter(acc =>
      acc.title?.toLowerCase().includes(q) ||
      acc.handle?.toLowerCase().includes(q) ||
      acc.label?.toLowerCase().includes(q)
    );
  }, [accounts, searchQuery]);

  const onOpen = (item) => {
    if (item.kind === 'BACKER' && item.slug) {
      window.location.href = `/connections/backers/${item.slug}`;
    } else if (item.id) {
      window.location.href = `/connections/${encodeURIComponent(item.id)}`;
    }
  };

  const handleCompare = (item) => {
    setCompareItems(prev => {
      if (prev.find(i => i.id === item.id)) {
        return prev.filter(i => i.id !== item.id);
      }
      if (prev.length >= 2) {
        return [prev[1], item];
      }
      return [...prev, item];
    });
  };

  const handleWatchlist = async (item) => {
    if (watchlists.length === 0) {
      window.location.href = '/connections/watchlists';
      return;
    }
    const defaultWl = watchlists[0];
    try {
      await addToWatchlist(defaultWl._id, item.id, item.kind, activeFacet);
      setSavedItems(prev => new Set([...prev, item.id]));
    } catch (err) {
      console.error('Failed to add to watchlist', err);
    }
  };

  const handleExplain = (item) => {
    setExplainItem(item);
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Unified Accounts</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Browse accounts by category</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Preset Switcher */}
          <PresetSwitcher basePath="/connections/unified" />
          
          <div className="relative">
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Facet Tabs */}
      <FacetTabs
        facets={UNIFIED_FACETS}
        active={activeFacet}
        counters={counters}
        onChange={handleFacetChange}
      />

      {/* Current Facet Info */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{facetTitle}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {filteredAccounts.length} accounts found
        </p>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-red-700 dark:text-red-300">
          Error: {error}
        </div>
      )}

      {/* Accounts Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAccounts.map((account) => (
            <UnifiedAccountCard
              key={account.id}
              item={account}
              facet={activeFacet}
              onOpen={onOpen}
              onCompare={handleCompare}
              onWatchlist={handleWatchlist}
              onExplain={handleExplain}
              onRefresh={loadData}
              isInWatchlist={savedItems.has(account.id)}
              isCompareMode={compareItems.some(i => i.id === account.id)}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filteredAccounts.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No accounts found for this filter.
        </div>
      )}

      {/* Compare floating button */}
      {compareItems.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setShowCompare(true)}
            disabled={compareItems.length < 2}
            data-testid="compare-floating-btn"
            className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg transition-all ${
              compareItems.length >= 2
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Scale className="w-5 h-5" />
            Compare {compareItems.length}/2
          </button>
        </div>
      )}

      {/* Compare Drawer */}
      {showCompare && compareItems.length >= 2 && (
        <CompareDrawer
          leftId={compareItems[0].id}
          rightId={compareItems[1].id}
          preset={activeFacet}
          onClose={() => {
            setShowCompare(false);
            setCompareItems([]);
          }}
        />
      )}

      {/* Explain Modal */}
      {explainItem && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setExplainItem(null)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {explainItem.title || explainItem.label}
              </h2>
            </div>
            <div className="p-4">
              <WhyThisMatters entityId={explainItem.id} preset={activeFacet} />
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setExplainItem(null)}
                className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
