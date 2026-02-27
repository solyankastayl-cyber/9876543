/**
 * Cluster Attention Page - Light Theme
 * Displays influencer clusters and coordinated token attention
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { RefreshCw, Loader2, ArrowRight } from 'lucide-react';
import { IconCluster, IconNetwork, IconSpikePump, IconAttention, IconAltSeason } from '../../components/icons/FomoIcons';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

const MOMENTUM_COLORS = {
  PUMP_LIKE: 'bg-red-500 text-white',
  MOMENTUM: 'bg-orange-500 text-white',
  BUILDING: 'bg-blue-500 text-white',
  ATTENTION: 'bg-yellow-500 text-gray-900',
  BACKGROUND: 'bg-gray-300 text-gray-700',
};

const MOMENTUM_DOT_COLORS = {
  PUMP_LIKE: 'bg-red-500',
  MOMENTUM: 'bg-orange-500',
  BUILDING: 'bg-blue-500',
  ATTENTION: 'bg-yellow-500',
  BACKGROUND: 'bg-gray-400',
};

const MOMENTUM_LABELS = {
  PUMP_LIKE: 'Possible Pump',
  MOMENTUM: 'Momentum',
  BUILDING: 'Building',
  ATTENTION: 'Attention',
  BACKGROUND: 'Background',
};

export default function ClusterAttentionPage() {
  const [clusters, setClusters] = useState([]);
  const [momentum, setMomentum] = useState([]);
  const [credibility, setCredibility] = useState([]);
  const [alignments, setAlignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [error, setError] = useState(null);

  const fetchClusters = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/connections/clusters`);
      const data = await res.json();
      if (data.ok) setClusters(data.data || []);
    } catch (err) {
      console.error('Error fetching clusters:', err);
    }
  }, []);

  const fetchMomentum = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/connections/cluster-momentum`);
      const data = await res.json();
      if (data.ok) setMomentum(data.data || []);
    } catch (err) {
      console.error('Error fetching momentum:', err);
    }
  }, []);

  const fetchCredibility = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/connections/cluster-credibility`);
      const data = await res.json();
      if (data.ok) setCredibility(data.data || []);
    } catch (err) {
      console.error('Error fetching credibility:', err);
    }
  }, []);

  const fetchAlignments = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/connections/cluster-alignment`);
      const data = await res.json();
      if (data.ok) setAlignments(data.data || []);
    } catch (err) {
      console.error('Error fetching alignments:', err);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchClusters(), fetchMomentum(), fetchCredibility(), fetchAlignments()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchClusters, fetchMomentum]);

  const rebuildClusters = useCallback(async () => {
    setRebuilding(true);
    try {
      const res = await fetch(`${API_BASE}/api/connections/clusters/rebuild`, { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setClusters(data.data || []);
        alert(`Rebuilt ${data.count} clusters`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setRebuilding(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6" data-testid="cluster-attention-page">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8 animate-fade-in-up">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 flex-shrink-0 mt-1">
              <IconCluster size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-gray-900">
                Cluster Attention
              </h1>
              <p className="text-gray-500 text-xs md:text-base mt-1 max-w-xl">
                Detect coordinated influencer activity and potential pump signals. The system groups influencers 
                who frequently interact or co-mention tokens, then monitors their collective attention to identify 
                early momentum patterns before they hit mainstream.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 md:gap-3">
            <Button
              onClick={loadData}
              disabled={loading}
              variant="outline"
              size="sm"
              className="border-gray-300 hover:scale-105 active:scale-95 transition-all duration-200"
              data-testid="refresh-btn"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span className="ml-1 md:ml-2">Refresh</span>
            </Button>
            <Button
              onClick={rebuildClusters}
              disabled={rebuilding}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white hover:shadow-lg hover:shadow-purple-500/30 hover:scale-105 active:scale-95 transition-all duration-200"
              data-testid="rebuild-btn"
            >
              {rebuilding ? <Loader2 className="w-4 h-4 animate-spin" /> : <IconSpikePump size={16} />}
              <span className="ml-1 md:ml-2">Rebuild Clusters</span>
            </Button>
            <Link to="/connections/alt-season">
              <Button
                variant="outline"
                size="sm"
                className="border-orange-300 text-orange-600 hover:bg-orange-50 hover:scale-105 active:scale-95 transition-all duration-200"
                data-testid="alt-season-link"
              >
                <IconAltSeason size={16} />
                <span className="ml-1 md:ml-2 hidden sm:inline">Alt Season</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3 text-red-700 animate-fade-in-scale">
            <IconAttention size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Clusters Panel */}
          <div className="lg:col-span-1 animate-fade-in-up stagger-1">
            <Card className="bg-white border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-gray-900 section-header">
                  <IconCluster size={20} className="text-blue-600" />
                  Influencer Clusters
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {clusters.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <IconCluster size={48} className="mx-auto mb-3 opacity-40" />
                    <p>No clusters found</p>
                    <p className="text-sm mt-1">Parse more accounts to build clusters</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {clusters.map((cluster, idx) => (
                      <div
                        key={cluster.id}
                        className={`bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md hover:border-purple-300 transition-all duration-300 animate-fade-in-up stagger-${idx + 1}`}
                        data-testid={`cluster-${cluster.id}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <Badge className="bg-purple-100 text-purple-700 border-0">
                            {cluster.metrics?.size || cluster.members?.length || 0} members
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Cohesion: {((cluster.metrics?.cohesion || 0) * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(cluster.members || []).map((member) => (
                            <span
                              key={member}
                              className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700 hover:border-purple-400 hover:bg-purple-50 transition-colors duration-200"
                            >
                              @{member}
                            </span>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-xs text-gray-500">
                          <span>Authority: {(cluster.metrics?.authority || 0).toFixed(1)}</span>
                          <span>Trust: {((cluster.metrics?.avgTrust || 0) * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Momentum Panel */}
          <div className="lg:col-span-2 animate-fade-in-up stagger-2">
            <Card className="bg-white border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-gray-900 section-header">
                  <IconSpikePump size={20} className="text-green-600" />
                  Coordinated Momentum
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {momentum.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <IconSpikePump size={64} className="mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium text-gray-700">No token momentum detected</p>
                    <p className="text-sm mt-2">
                      When influencer clusters mention tokens, momentum signals will appear here
                    </p>
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg max-w-md mx-auto border border-gray-200">
                      <p className="text-xs text-gray-600 text-left">
                        <strong>How it works:</strong>
                        <br />1. Parse Twitter accounts to build clusters
                        <br />2. Parse tweets with token mentions ($SOL, $ETH, etc.)
                        <br />3. System detects coordinated attention patterns
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {momentum.map((item, idx) => (
                      <div
                        key={`${item.cluster}-${item.token}-${idx}`}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex items-center justify-between hover:shadow-md transition-all duration-200"
                        data-testid={`momentum-${item.token}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${MOMENTUM_DOT_COLORS[item.classification] || 'bg-gray-400'}`} />
                          <div>
                            <span className="font-bold text-lg text-gray-900">{item.token}</span>
                            <span className="text-gray-500 text-sm ml-3">
                              {item.uniqueMentioners || 0} mentioners
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Score</div>
                            <div className="font-bold text-lg text-gray-900">
                              {(item.score || 0).toFixed(2)}
                            </div>
                          </div>
                          <Badge className={MOMENTUM_COLORS[item.classification] || 'bg-gray-100 text-gray-700'}>
                            {MOMENTUM_LABELS[item.classification] || item.classification}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-4 md:mt-6">
              <Card className="bg-white border-gray-200 shadow-sm group relative cursor-help">
                <CardContent className="p-3 md:p-4 text-center">
                  <div className="text-xl md:text-2xl font-bold text-gray-900">{clusters.length}</div>
                  <div className="text-xs text-gray-500">Clusters</div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    Groups of influencers with high mutual engagement or overlapping token mentions
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border-gray-200 shadow-sm group relative cursor-help">
                <CardContent className="p-3 md:p-4 text-center">
                  <div className="text-xl md:text-2xl font-bold text-red-500">
                    {momentum.filter(m => m.level === 'PUMP_LIKE').length}
                  </div>
                  <div className="text-xs text-gray-500">Pump-like</div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    High-risk signals: sudden coordinated mentions from multiple clusters. May indicate pump & dump
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border-gray-200 shadow-sm group relative cursor-help">
                <CardContent className="p-3 md:p-4 text-center">
                  <div className="text-xl md:text-2xl font-bold text-orange-500">
                    {momentum.filter(m => m.level === 'MOMENTUM').length}
                  </div>
                  <div className="text-xs text-gray-500">Momentum</div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    Strong sustained attention from credible influencers. Higher probability of real price movement
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border-gray-200 shadow-sm group relative cursor-help">
                <CardContent className="p-3 md:p-4 text-center">
                  <div className="text-xl md:text-2xl font-bold text-yellow-600">
                    {momentum.filter(m => m.level === 'ATTENTION').length}
                  </div>
                  <div className="text-xs text-gray-500">Attention</div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    Early interest signals from clusters. Worth monitoring but not yet actionable
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* БЛОК 4-5: Credibility & Alignments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Cluster Credibility - БЛОК 5 */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <IconAttention size={20} className="text-purple-600" />
                Cluster Credibility
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {credibility.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <p className="text-sm">No credibility data yet</p>
                  <p className="text-xs mt-1">Credibility builds as clusters make predictions</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {credibility.map((cred) => (
                    <div
                      key={cred.clusterId}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                      data-testid={`cred-${cred.clusterId}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                          {cred.clusterId}
                        </span>
                        <Badge className={
                          cred.score >= 0.7 ? 'bg-green-100 text-green-700' :
                          cred.score >= 0.4 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }>
                          {((cred.score || 0) * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Confirmation: {((cred.confirmationRate || 0) * 100).toFixed(0)}%</span>
                        <span>Events: {cred.totalEvents || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Price Alignments - БЛОК 4 */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <IconSpikePump size={20} className="text-green-600" />
                Price Alignments
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {alignments.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <p className="text-sm">No alignment data yet</p>
                  <p className="text-xs mt-1">Alignments appear when momentum signals are confirmed by price</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alignments.slice(0, 5).map((align, idx) => (
                    <div
                      key={`${align.clusterId}-${align.token}-${idx}`}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                      data-testid={`align-${align.token}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-900">{align.token}</span>
                        <Badge className={
                          align.verdict === 'CONFIRMED' ? 'bg-green-500 text-white' :
                          align.verdict === 'LAGGING' ? 'bg-yellow-500 text-gray-900' :
                          'bg-gray-300 text-gray-700'
                        }>
                          {align.verdict}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Return: {((align.priceReturn || 0) * 100).toFixed(2)}%</span>
                        <span>Impact: {(align.impact || 0).toFixed(2)}</span>
                        <span>Score: {(align.alignmentScore || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
