// B4 - Twitter Parser Page (Final Clean Version)
// Two tabs: Accounts Parsing + Keywords Parsing
// Light theme, no LinkedIn/Threads, no Comments, no Admin button

import { useState, useCallback, useEffect, useRef } from 'react';
import { runRuntimeSearch } from '../../../modules/twitterParser';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Checkbox } from '../../../components/ui/checkbox';
import {
  Search,
  Users,
  Hash,
  X,
  Plus,
  Trash2,
  RefreshCw,
  Heart,
  Repeat,
  MessageCircle,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Twitter,
  Filter,
  SlidersHorizontal,
  ExternalLink,
  Eye,
  Calendar,
  ArrowUpDown,
} from 'lucide-react';

// Storage keys
const TRACKED_ACCOUNTS_KEY = 'parser-tracked-accounts';
const TRACKED_KEYWORDS_KEY = 'parser-tracked-keywords';

// Helper functions
function fmtNum(n) {
  if (n == null) return '—';
  if (n < 1000) return String(n);
  if (n < 1000000) return `${(n / 1000).toFixed(1)}k`;
  return `${(n / 1000000).toFixed(1)}m`;
}

function fmtTime(ts) {
  if (!ts) return '';
  const ms = ts < 2000000000 ? ts * 1000 : ts;
  const diff = Date.now() - ms;
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

// Tweet Row Component - Clickable with link to Twitter
function TweetRow({ tweet }) {
  const author = tweet.author || {};
  const engagement = tweet.engagement || {
    likes: tweet.likes || 0,
    reposts: tweet.reposts || 0,
    replies: tweet.replies || 0,
  };
  const timestamp = tweet.timestamp || tweet.createdAt;
  const tweetId = tweet.id?.replace('mock-', '').split('-')[0] || tweet.id;
  const twitterUrl = `https://twitter.com/${author.username}/status/${tweetId}`;

  // Parse text for links and hashtags
  const renderText = (text) => {
    if (!text) return null;
    // Simple regex to detect URLs, @mentions, and #hashtags
    const parts = text.split(/(\s+)/);
    return parts.map((part, i) => {
      if (part.startsWith('http')) {
        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{part}</a>;
      }
      if (part.startsWith('@')) {
        return <a key={i} href={`https://twitter.com/${part.slice(1)}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{part}</a>;
      }
      if (part.startsWith('#')) {
        return <a key={i} href={`https://twitter.com/hashtag/${part.slice(1)}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{part}</a>;
      }
      if (part.startsWith('$')) {
        return <span key={i} className="text-green-600 font-medium">{part}</span>;
      }
      return part;
    });
  };

  return (
    <div 
      className="p-4 hover:bg-blue-50/50 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors group"
      onClick={() => window.open(twitterUrl, '_blank')}
    >
      <div className="flex gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
          {(author.username || 'U').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900 text-sm group-hover:text-blue-600">
              {author.displayName || author.username || 'Unknown'}
            </span>
            {author.verified && <CheckCircle className="w-3.5 h-3.5 text-blue-500" />}
            <span className="text-xs text-gray-400">@{author.username}</span>
            <span className="text-xs text-gray-400">• {fmtTime(timestamp)}</span>
            <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-blue-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">{renderText(tweet.text)}</p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1 hover:text-red-500">
              <Heart className="w-3.5 h-3.5" /> {fmtNum(engagement.likes)}
            </span>
            <span className="flex items-center gap-1 hover:text-green-500">
              <Repeat className="w-3.5 h-3.5" /> {fmtNum(engagement.reposts)}
            </span>
            <span className="flex items-center gap-1 hover:text-blue-500">
              <MessageCircle className="w-3.5 h-3.5" /> {fmtNum(engagement.replies)}
            </span>
            {tweet.views && (
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> {fmtNum(tweet.views)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Tab 1: Accounts Parsing
// ============================================================================
function AccountsParsingTab() {
  const [accounts, setAccounts] = useState([]);
  const [newAccount, setNewAccount] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [tweets, setTweets] = useState([]);
  const [allTweets, setAllTweets] = useState([]); // Store all for pagination
  const [loading, setLoading] = useState(false);
  const refreshRef = useRef(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  
  // Filters
  const [filters, setFilters] = useState({
    timeRange: 'all', // 'all', '1h', '24h', '3d', '7d'
    minFollowers: 0, // 0, 5000, 50000
    verifiedOnly: false,
    sortBy: 'newest', // 'newest', 'likes', 'reposts', 'replies'
  });
  const [showFilters, setShowFilters] = useState(false);

  // Load accounts from API targets
  useEffect(() => {
    const loadTargets = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_BACKEND_URL || ''}/api/v4/twitter/targets`);
        const data = await res.json();
        if (data.ok && data.data?.targets) {
          // Filter ACCOUNT type targets
          const accountTargets = data.data.targets
            .filter(t => t.type === 'ACCOUNT' && t.enabled)
            .map(t => ({
              id: t._id,
              username: t.query,
              addedAt: new Date(t.createdAt).getTime()
            }));
          setAccounts(accountTargets);
          setSelectedAccounts(accountTargets.map(a => a.id));
        }
      } catch (e) {
        // Fallback to localStorage
        try {
          const saved = localStorage.getItem(TRACKED_ACCOUNTS_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            setAccounts(parsed);
            setSelectedAccounts(parsed.map(a => a.id));
          }
        } catch (e2) {}
      }
    };
    loadTargets();
  }, []);

  const saveAccounts = (updated) => {
    setAccounts(updated);
    localStorage.setItem(TRACKED_ACCOUNTS_KEY, JSON.stringify(updated));
  };

  const addAccount = () => {
    const username = newAccount.trim().replace('@', '');
    if (!username || username.length < 2) return;
    if (accounts.some(a => a.username.toLowerCase() === username.toLowerCase())) return;
    
    const newAcc = { id: Date.now(), username, addedAt: Date.now() };
    const updated = [...accounts, newAcc];
    saveAccounts(updated);
    setSelectedAccounts([...selectedAccounts, newAcc.id]);
    setNewAccount('');
  };

  const removeAccount = (id) => {
    saveAccounts(accounts.filter(a => a.id !== id));
    setSelectedAccounts(selectedAccounts.filter(sid => sid !== id));
  };

  const toggleAccount = (id) => {
    setSelectedAccounts(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  // Apply filters and sorting
  const applyFilters = useCallback((tweetsData) => {
    let filtered = [...tweetsData];
    
    // Time filter
    if (filters.timeRange !== 'all') {
      const now = Date.now();
      const ranges = { '1h': 3600000, '24h': 86400000, '3d': 259200000, '7d': 604800000 };
      const cutoff = now - (ranges[filters.timeRange] || 0);
      filtered = filtered.filter(t => (t.timestamp || t.createdAt || 0) >= cutoff);
    }
    
    // Verified filter
    if (filters.verifiedOnly) {
      filtered = filtered.filter(t => t.author?.verified);
    }
    
    // Min followers filter
    if (filters.minFollowers > 0) {
      filtered = filtered.filter(t => (t.author?.followers || 0) >= filters.minFollowers);
    }
    
    // Sorting
    const sortFns = {
      newest: (a, b) => (b.timestamp || b.createdAt || 0) - (a.timestamp || a.createdAt || 0),
      likes: (a, b) => ((b.engagement?.likes || b.likes || 0) - (a.engagement?.likes || a.likes || 0)),
      reposts: (a, b) => ((b.engagement?.reposts || b.reposts || 0) - (a.engagement?.reposts || a.reposts || 0)),
      replies: (a, b) => ((b.engagement?.replies || b.replies || 0) - (a.engagement?.replies || a.replies || 0)),
    };
    filtered.sort(sortFns[filters.sortBy] || sortFns.newest);
    
    return filtered;
  }, [filters]);

  const fetchTweets = useCallback(async () => {
    const activeAccounts = accounts.filter(a => selectedAccounts.includes(a.id));
    if (activeAccounts.length === 0) {
      setAllTweets([]);
      setTweets([]);
      return;
    }

    setLoading(true);
    try {
      const fetchedTweets = [];
      for (const account of activeAccounts) {
        const res = await runRuntimeSearch({
          type: 'account',
          username: account.username,
          limit: 50,
        });
        if (res?.ok && res.data) {
          fetchedTweets.push(...res.data);
        }
      }
      setAllTweets(fetchedTweets);
      setCurrentPage(1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [accounts, selectedAccounts]);

  // Apply filters when allTweets or filters change
  useEffect(() => {
    const filtered = applyFilters(allTweets);
    setTweets(filtered);
    setCurrentPage(1);
  }, [allTweets, applyFilters]);

  // Paginated tweets
  const paginatedTweets = tweets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const totalPages = Math.ceil(tweets.length / ITEMS_PER_PAGE);

  // Auto-refresh when accounts change
  useEffect(() => {
    if (accounts.length > 0 && selectedAccounts.length > 0) {
      fetchTweets();
      refreshRef.current = setInterval(fetchTweets, 60000); // 60s refresh
    }
    return () => clearInterval(refreshRef.current);
  }, [fetchTweets, accounts.length, selectedAccounts.length]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Account Management */}
      <div className="lg:col-span-3">
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Tracked Accounts</h3>
            
            {/* Add Account */}
            <div className="flex gap-2 mb-4">
              <Input
                value={newAccount}
                onChange={(e) => setNewAccount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addAccount()}
                placeholder="@username"
                className="text-sm bg-white border-gray-200"
              />
              <Button onClick={addAccount} size="sm" className="bg-teal-500 hover:bg-teal-600 text-white">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Account List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {accounts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  No accounts added yet
                </p>
              ) : (
                accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleAccount(account.id)}
                  >
                    <Checkbox
                      checked={selectedAccounts.includes(account.id)}
                      className="data-[state=checked]:bg-teal-500"
                    />
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {account.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="flex-1 text-sm font-medium text-gray-700">@{account.username}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeAccount(account.id); }}
                      className="p-1 text-gray-300 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <Button
              onClick={fetchTweets}
              disabled={loading || selectedAccounts.length === 0}
              className="w-full mt-4 bg-teal-500 hover:bg-teal-600 text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Refresh Feed
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Right: Live Feed */}
      <div className="lg:col-span-9">
        <Card className="border-gray-200">
          <CardContent className="p-0">
            {/* Header with filters */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">Live Feed</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Posts from tracked accounts • Auto-refresh every 60s</p>
                </div>
                <div className="flex items-center gap-2">
                  {tweets.length > 0 && (
                    <Badge variant="outline" className="text-xs">{tweets.length} tweets</Badge>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className={showFilters ? 'bg-blue-50 border-blue-200' : ''}
                  >
                    <Filter className="w-4 h-4 mr-1" />
                    Filters
                  </Button>
                </div>
              </div>
              
              {/* Filter Panel */}
              {showFilters && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Date Range */}
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Date Range</label>
                      <select 
                        value={filters.timeRange}
                        onChange={(e) => setFilters(f => ({...f, timeRange: e.target.value}))}
                        className="w-full text-sm border border-gray-200 rounded-md px-3 py-1.5 bg-white"
                      >
                        <option value="all">All Time</option>
                        <option value="1h">Last Hour</option>
                        <option value="24h">Last 24 Hours</option>
                        <option value="3d">Last 3 Days</option>
                        <option value="7d">Last 7 Days</option>
                      </select>
                    </div>
                    
                    {/* Min Followers */}
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Min Followers</label>
                      <select 
                        value={filters.minFollowers}
                        onChange={(e) => setFilters(f => ({...f, minFollowers: Number(e.target.value)}))}
                        className="w-full text-sm border border-gray-200 rounded-md px-3 py-1.5 bg-white"
                      >
                        <option value="0">Any</option>
                        <option value="5000">5k+</option>
                        <option value="50000">50k+</option>
                        <option value="100000">100k+</option>
                      </select>
                    </div>
                    
                    {/* Sorting */}
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Sort By</label>
                      <select 
                        value={filters.sortBy}
                        onChange={(e) => setFilters(f => ({...f, sortBy: e.target.value}))}
                        className="w-full text-sm border border-gray-200 rounded-md px-3 py-1.5 bg-white"
                      >
                        <option value="newest">Newest First</option>
                        <option value="likes">Most Liked</option>
                        <option value="reposts">Most Retweeted</option>
                        <option value="replies">Most Comments</option>
                      </select>
                    </div>
                    
                    {/* Verified Only */}
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox 
                          checked={filters.verifiedOnly}
                          onCheckedChange={(checked) => setFilters(f => ({...f, verifiedOnly: !!checked}))}
                        />
                        <span className="text-sm text-gray-700">Verified only</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tweet List */}
            {loading && tweets.length === 0 ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Loading tweets...</p>
              </div>
            ) : tweets.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No tweets yet</p>
                <p className="text-xs text-gray-400 mt-1">Add and select accounts to track their posts</p>
              </div>
            ) : (
              <>
                <div className="max-h-[500px] overflow-y-auto">
                  {paginatedTweets.map((tweet, idx) => (
                    <TweetRow key={tweet.id || idx} tweet={tweet} />
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, tweets.length)} of {tweets.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// Tab 2: Keywords Parsing
// ============================================================================
function KeywordsParsingTab() {
  const [keywords, setKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [activeKeyword, setActiveKeyword] = useState(null);
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(false);
  const refreshRef = useRef(null);
  
  // Engagement Filters
  const [filters, setFilters] = useState({
    minLikes: 0,
    minReposts: 0,
    timeRange: 'all', // 'all', '1h', '24h', '7d'
  });
  const [showFilters, setShowFilters] = useState(false);

  // Load keywords from API targets
  useEffect(() => {
    const loadTargets = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_BACKEND_URL || ''}/api/v4/twitter/targets`);
        const data = await res.json();
        if (data.ok && data.data?.targets) {
          // Filter KEYWORD type targets
          const keywordTargets = data.data.targets
            .filter(t => t.type === 'KEYWORD' && t.enabled)
            .map(t => ({
              id: t._id,
              text: t.query,
              addedAt: new Date(t.createdAt).getTime()
            }));
          setKeywords(keywordTargets);
          // Auto-select first keyword
          if (keywordTargets.length > 0) {
            setActiveKeyword(keywordTargets[0]);
          }
        }
      } catch (e) {
        // Fallback to localStorage
        try {
          const saved = localStorage.getItem(TRACKED_KEYWORDS_KEY);
          if (saved) {
            setKeywords(JSON.parse(saved));
          }
        } catch (e2) {}
      }
    };
    loadTargets();
  }, []);

  const saveKeywords = (updated) => {
    setKeywords(updated);
    localStorage.setItem(TRACKED_KEYWORDS_KEY, JSON.stringify(updated));
  };

  const addKeyword = () => {
    const kw = newKeyword.trim();
    if (!kw || kw.length < 2) return;
    if (keywords.some(k => k.text.toLowerCase() === kw.toLowerCase())) return;
    
    const newKw = { id: Date.now(), text: kw, addedAt: Date.now() };
    saveKeywords([...keywords, newKw]);
    setNewKeyword('');
    setActiveKeyword(newKw);
  };

  const removeKeyword = (id) => {
    saveKeywords(keywords.filter(k => k.id !== id));
    if (activeKeyword?.id === id) {
      setActiveKeyword(null);
      setTweets([]);
    }
  };

  const fetchTweets = useCallback(async (keyword) => {
    if (!keyword) return;
    
    setLoading(true);
    try {
      const res = await runRuntimeSearch({
        type: 'keyword',
        keyword: keyword.text,
        limit: 100, // Get more to allow filtering
      });
      if (res?.ok && res.data) {
        // Apply local filters
        let filtered = [...res.data];
        
        // Min likes filter
        if (filters.minLikes > 0) {
          filtered = filtered.filter(t => 
            (t.engagement?.likes || t.likes || 0) >= filters.minLikes
          );
        }
        
        // Min reposts filter
        if (filters.minReposts > 0) {
          filtered = filtered.filter(t => 
            (t.engagement?.reposts || t.reposts || 0) >= filters.minReposts
          );
        }
        
        // Time range filter
        if (filters.timeRange !== 'all') {
          const now = Date.now();
          let cutoff = 0;
          switch (filters.timeRange) {
            case '1h': cutoff = now - 60 * 60 * 1000; break;
            case '24h': cutoff = now - 24 * 60 * 60 * 1000; break;
            case '7d': cutoff = now - 7 * 24 * 60 * 60 * 1000; break;
          }
          if (cutoff > 0) {
            filtered = filtered.filter(t => {
              const ts = t.timestamp || t.createdAt || 0;
              const ms = ts < 2000000000 ? ts * 1000 : ts;
              return ms >= cutoff;
            });
          }
        }
        
        // Sort by timestamp
        const sorted = filtered.sort((a, b) => 
          (b.timestamp || b.createdAt || 0) - (a.timestamp || a.createdAt || 0)
        );
        setTweets(sorted);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const selectKeyword = (keyword) => {
    setActiveKeyword(keyword);
    fetchTweets(keyword);
  };

  // Auto-refresh
  useEffect(() => {
    if (activeKeyword) {
      refreshRef.current = setInterval(() => fetchTweets(activeKeyword), 30000);
    }
    return () => clearInterval(refreshRef.current);
  }, [activeKeyword, fetchTweets]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Keyword Management */}
      <div className="lg:col-span-3">
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Tracked Keywords</h3>
            
            {/* Add Keyword */}
            <div className="flex gap-2 mb-4">
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                placeholder="keyword or #hashtag"
                className="text-sm bg-white border-gray-200"
              />
              <Button onClick={addKeyword} size="sm" className="bg-teal-500 hover:bg-teal-600 text-white">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Keyword List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {keywords.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  No keywords added yet
                </p>
              ) : (
                keywords.map((keyword) => (
                  <div
                    key={keyword.id}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      activeKeyword?.id === keyword.id
                        ? 'bg-teal-50 border border-teal-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                    onClick={() => selectKeyword(keyword)}
                  >
                    <div className="w-8 h-8 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center">
                      <Hash className="w-4 h-4" />
                    </div>
                    <span className="flex-1 text-sm font-medium text-gray-700">{keyword.text}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeKeyword(keyword.id); }}
                      className="p-1 text-gray-300 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {activeKeyword && (
              <Button
                onClick={() => fetchTweets(activeKeyword)}
                disabled={loading}
                className="w-full mt-4 bg-teal-500 hover:bg-teal-600 text-white"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Refresh Results
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right: Results */}
      <div className="lg:col-span-9">
        <Card className="border-gray-200">
          <CardContent className="p-0">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {activeKeyword ? `Results for "${activeKeyword.text}"` : 'Search Results'}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Auto-refresh every 30s</p>
              </div>
              <div className="flex items-center gap-2">
                {tweets.length > 0 && (
                  <Badge variant="outline" className="text-xs">{tweets.length} tweets</Badge>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowFilters(!showFilters)}
                  className={showFilters ? 'border-teal-500 text-teal-600' : ''}
                >
                  <SlidersHorizontal className="w-4 h-4 mr-1" />
                  Filters
                </Button>
              </div>
            </div>
            
            {/* Filters Panel */}
            {showFilters && (
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Min Likes:</span>
                    <select 
                      value={filters.minLikes}
                      onChange={(e) => {
                        setFilters({...filters, minLikes: Number(e.target.value)});
                        if (activeKeyword) fetchTweets(activeKeyword);
                      }}
                      className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                    >
                      <option value="0">Any</option>
                      <option value="10">10+</option>
                      <option value="50">50+</option>
                      <option value="100">100+</option>
                      <option value="500">500+</option>
                      <option value="1000">1K+</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Min Reposts:</span>
                    <select 
                      value={filters.minReposts}
                      onChange={(e) => {
                        setFilters({...filters, minReposts: Number(e.target.value)});
                        if (activeKeyword) fetchTweets(activeKeyword);
                      }}
                      className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                    >
                      <option value="0">Any</option>
                      <option value="5">5+</option>
                      <option value="10">10+</option>
                      <option value="50">50+</option>
                      <option value="100">100+</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Time:</span>
                    <select 
                      value={filters.timeRange}
                      onChange={(e) => {
                        setFilters({...filters, timeRange: e.target.value});
                        if (activeKeyword) fetchTweets(activeKeyword);
                      }}
                      className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                    >
                      <option value="all">All Time</option>
                      <option value="1h">Last Hour</option>
                      <option value="24h">Last 24h</option>
                      <option value="7d">Last 7 Days</option>
                    </select>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setFilters({ minLikes: 0, minReposts: 0, timeRange: 'all' });
                      if (activeKeyword) fetchTweets(activeKeyword);
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>
            )}

            {loading && tweets.length === 0 ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Searching tweets...</p>
              </div>
            ) : !activeKeyword ? (
              <div className="p-12 text-center">
                <Hash className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Select a keyword to search</p>
                <p className="text-xs text-gray-400 mt-1">Add keywords and click to see results</p>
              </div>
            ) : tweets.length === 0 ? (
              <div className="p-12 text-center">
                <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No tweets found</p>
                <p className="text-xs text-gray-400 mt-1">Try a different keyword or adjust filters</p>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto">
                {tweets.map((tweet, idx) => (
                  <TweetRow key={tweet.id || idx} tweet={tweet} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// Main Parser Page
// ============================================================================
export default function ParserOverviewPage() {
  const [activeTab, setActiveTab] = useState('accounts');

  return (
    <div className="min-h-screen bg-gray-50" data-testid="parser-overview-page">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <Twitter className="w-6 h-6 text-teal-500" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Twitter Parsing</h1>
              <p className="text-sm text-gray-500">
                Real-time monitoring of Twitter posts from tracked accounts and keywords
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex">
            <button
              onClick={() => setActiveTab('accounts')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'accounts'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Accounts
            </button>
            <button
              onClick={() => setActiveTab('keywords')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'keywords'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Hash className="w-4 h-4 inline mr-2" />
              Keywords
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'accounts' ? <AccountsParsingTab /> : <KeywordsParsingTab />}
      </main>
    </div>
  );
}
