import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, RefreshCw, ArrowLeft } from 'lucide-react';
import { IconWatchlist, IconSpikePump, IconAttention } from '../../components/icons/FomoIcons';
import { getWatchlists, createWatchlist, getWatchlistWithDiff, addToWatchlist, removeFromWatchlist } from '../../api/connectionsIntelligence.api';

export default function WatchlistPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [watchlists, setWatchlists] = useState([]);
  const [activeWatchlist, setActiveWatchlist] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const loadWatchlists = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getWatchlists();
      setWatchlists(res.watchlists || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWatchlistDetail = useCallback(async (watchlistId) => {
    setLoading(true);
    try {
      const res = await getWatchlistWithDiff(watchlistId);
      setActiveWatchlist(res.watchlist);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWatchlists();
  }, [loadWatchlists]);

  useEffect(() => {
    if (id) {
      loadWatchlistDetail(id);
    } else {
      setActiveWatchlist(null);
    }
  }, [id, loadWatchlistDetail]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createWatchlist(newName, 'CUSTOM');
    setNewName('');
    setShowCreate(false);
    loadWatchlists();
  };

  const handleRemoveItem = async (entityId) => {
    if (!activeWatchlist?._id) return;
    await removeFromWatchlist(activeWatchlist._id, entityId);
    loadWatchlistDetail(activeWatchlist._id);
  };

  return (
    <div className="space-y-6 p-4">
      {/* Back Button */}
      <button
        onClick={() => navigate('/connections')}
        data-testid="back-to-connections-btn"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Connections</span>
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Watchlists</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track accounts and monitor changes</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Watchlist
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Watchlist name..."
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Create
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Watchlist list */}
        <div className="lg:col-span-1 space-y-2">
          {watchlists.map((wl) => (
            <button
              key={wl._id}
              onClick={() => loadWatchlistDetail(wl._id)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                activeWatchlist?._id === wl._id
                  ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700'
                  : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="font-semibold text-gray-900 dark:text-white">{wl.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {wl.items?.length || 0} items
              </div>
            </button>
          ))}

          {watchlists.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No watchlists yet
            </div>
          )}
        </div>

        {/* Watchlist detail */}
        <div className="lg:col-span-3">
          {activeWatchlist ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">{activeWatchlist.name}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {activeWatchlist.items?.length || 0} items
                  </p>
                </div>
                <button
                  onClick={() => loadWatchlistDetail(activeWatchlist._id)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {activeWatchlist.items?.map((item) => (
                  <div key={item.entityId} className="p-4 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {item.current?.title || item.entityId}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {item.type} • Added {new Date(item.addedAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Diff indicators */}
                    {item.diff && (
                      <div className="flex items-center gap-3">
                        <DiffIndicator 
                          label="Authority" 
                          value={item.diff.authority} 
                        />
                        <DiffIndicator 
                          label="Network" 
                          value={item.diff.network} 
                        />
                      </div>
                    )}

                    <button
                      onClick={() => handleRemoveItem(item.entityId)}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {(!activeWatchlist.items || activeWatchlist.items.length === 0) && (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    No items in this watchlist
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
              Select a watchlist to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DiffIndicator({ label, value }) {
  if (Math.abs(value) < 0.01) {
    return (
      <div className="text-center">
        <Minus className="w-4 h-4 text-gray-400 mx-auto" />
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    );
  }

  const isPositive = value > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const color = isPositive ? 'text-green-500' : 'text-red-500';

  return (
    <div className="text-center">
      <div className={`flex items-center gap-1 ${color}`}>
        <Icon className="w-4 h-4" />
        <span className="text-sm font-semibold">{isPositive ? '+' : ''}{Math.round(value * 100)}%</span>
      </div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
