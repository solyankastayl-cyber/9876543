/**
 * TokenClusters (B3) - Token Context
 * 
 * P1 LIVE: Fetches cluster data from backend API
 * 
 * Shows wallet clusters related to this token's activity.
 * Max 3 clusters (not exhaustive list).
 */
import React, { useState, useEffect } from 'react';
import { Users, ExternalLink, Loader2, RefreshCw } from 'lucide-react';

/**
 * TokenClusters Component (B3)
 */
export default function TokenClusters({ tokenAddress, className = '' }) {
  const [clusters, setClusters] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchClusters() {
      if (!tokenAddress) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/market/token-clusters/${tokenAddress}?limit=3`
        );
        const data = await response.json();
        
        if (data?.ok && data?.data) {
          setClusters(data.data);
        }
      } catch (err) {
        console.error('Failed to load clusters:', err);
        setError('Failed to load cluster data');
      } finally {
        setLoading(false);
      }
    }
    
    fetchClusters();
  }, [tokenAddress]);

  // Loading state
  if (loading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Related Wallet Clusters</h3>
        </div>
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Analyzing patterns...</span>
        </div>
      </div>
    );
  }

  // Use new API structure with interpretation
  const clusterList = clusters?.clusters || [];
  const interpretation = clusters?.interpretation || {};
  const checkedCorrelations = clusters?.checkedCorrelations || 0;
  const hasClusters = clusterList.length > 0;

  // Empty state - explain WHAT was checked using API interpretation
  if (!hasClusters) {
    return (
      <div className={`bg-white border border-gray-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Related Wallet Clusters</h3>
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Analyzed</span>
        </div>
        <div className="text-center py-6 bg-gray-50 rounded-xl">
          <div className="p-3 bg-white rounded-xl inline-block mb-3 shadow-sm">
            <Users className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            {interpretation.headline || 'No coordinated clusters detected'}
          </p>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {interpretation.description || `We checked timing correlation across ${checkedCorrelations.toLocaleString()} wallet pairs.`}
          </p>
        </div>
      </div>
    );
  }

  // Show clusters (max 3) - use interpretation headline
  const displayClusters = clusterList.slice(0, 3);

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Related Wallet Clusters</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Live</span>
          <span className="text-xs text-gray-500">
            {displayClusters.length} cluster{displayClusters.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      
      {/* Interpretation headline */}
      <div className="mb-3 p-2 bg-blue-50 rounded-lg">
        <p className="text-xs font-medium text-blue-800">{interpretation.headline}</p>
      </div>
      
      <div className="space-y-2">
        {displayClusters.map((cluster, index) => (
          <div
            key={cluster.id || index}
            className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">
                    {cluster.id || `Cluster ${index + 1}`}
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                    {cluster.wallets?.length || 0} wallets
                  </span>
                </div>
                {cluster.pattern && (
                  <p className="text-xs text-gray-600 ml-6">
                    Pattern: {cluster.pattern.replace(/_/g, ' ')}
                  </p>
                )}
                {cluster.confidence && (
                  <p className="text-xs text-gray-500 ml-6 mt-1">
                    Confidence: {Math.round(cluster.confidence * 100)}%
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
