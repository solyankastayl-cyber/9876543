/**
 * RelatedAddresses (B3)
 * 
 * UI component for Wallet Profile page
 * Shows "Related Addresses" block with cluster suggestions
 * 
 * CRITICAL UI RULE:
 * Never says "this is definitely one actor" —
 * only "system suggests these addresses may be related"
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Users, Link2, Check, X, ChevronRight, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { 
  getWalletClusters, 
  analyzeWalletClusters,
} from '../api/clusters.api';

/**
 * Format wallet address for display
 */
const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Get status badge
 */
const getStatusBadge = (status) => {
  switch (status) {
    case 'confirmed':
      return { color: 'bg-green-100 text-green-700', icon: Check, label: 'Confirmed' };
    case 'rejected':
      return { color: 'bg-red-100 text-red-700', icon: X, label: 'Rejected' };
    default:
      return { color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle, label: 'Suggested' };
  }
};

/**
 * Get confidence badge
 */
const getConfidenceBadge = (confidence) => {
  if (confidence >= 0.7) {
    return { label: 'High', color: 'bg-green-100 text-green-700' };
  } else if (confidence >= 0.5) {
    return { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' };
  }
  return { label: 'Low', color: 'bg-gray-100 text-gray-600' };
};

/**
 * Single Related Address Card
 */
const RelatedAddressCard = ({ address, evidenceCount, topEvidence, onClick }) => {
  return (
    <div 
      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      onClick={onClick}
      data-testid={`related-address-${address.slice(0, 8)}`}
    >
      <div className="flex items-center gap-3">
        <Link2 className="w-4 h-4 text-slate-400" />
        <div>
          <span className="font-mono text-sm font-medium">
            {formatAddress(address)}
          </span>
          <p className="text-xs text-muted-foreground mt-0.5">
            {topEvidence}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {evidenceCount} evidence
        </Badge>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </div>
  );
};

/**
 * Cluster Suggestion Card
 */
const ClusterSuggestionCard = ({ suggestion, onReview, onWalletClick }) => {
  const statusBadge = getStatusBadge(suggestion.status);
  const StatusIcon = statusBadge.icon;
  const confidenceBadge = getConfidenceBadge(suggestion.confidence);
  
  return (
    <div className="border border-slate-200 dark:border-gray-200 rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className={`${statusBadge.color} text-xs`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusBadge.label}
          </Badge>
          <Badge className={`${confidenceBadge.color} text-xs`}>
            {Math.round(suggestion.confidence * 100)}% confidence
          </Badge>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onReview(suggestion.clusterId)}
        >
          <Eye className="w-4 h-4 mr-1" />
          Review
        </Button>
      </div>
      
      {/* Summary - CRITICAL: uses "may be related" language */}
      <p className="text-sm text-muted-foreground">
        {suggestion.summary}
      </p>
      
      {/* Related addresses */}
      <div className="space-y-2">
        {(suggestion.relatedAddresses || []).slice(0, 3).map((addr) => (
          <RelatedAddressCard
            key={addr.address}
            address={addr.address}
            evidenceCount={addr.evidenceCount}
            topEvidence={addr.topEvidence}
            onClick={() => onWalletClick?.(addr.address)}
          />
        ))}
        
        {(suggestion.relatedAddresses?.length || 0) > 3 && (
          <p className="text-xs text-center text-muted-foreground">
            +{suggestion.relatedAddresses.length - 3} more addresses
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Main RelatedAddresses Component
 * 
 * NEW: Uses /api/wallets/:address/related API
 */
export function RelatedAddresses({ 
  walletAddress, 
  chain = 'Ethereum',
  timeWindow = '24h',
  onWalletClick,
  onReviewCluster,
  className = '',
}) {
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchClusters = useCallback(async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Use new API endpoint
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/wallets/${walletAddress}/related?window=${timeWindow}`
      );
      const data = await response.json();
      
      if (data?.ok && data?.data) {
        setApiData(data.data);
      } else {
        setError(data?.error || 'Failed to load clusters');
      }
    } catch (err) {
      console.error('Error fetching clusters:', err);
      setError('Unable to load related addresses');
    } finally {
      setLoading(false);
    }
  }, [walletAddress, timeWindow]);
  
  useEffect(() => {
    fetchClusters();
  }, [fetchClusters]);
  
  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      await analyzeWalletClusters(walletAddress, chain);
      await fetchClusters();
    } catch (err) {
      console.error('Error analyzing clusters:', err);
    } finally {
      setAnalyzing(false);
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-4 h-4" />
            Related Addresses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Extract data from API response
  const clusters = apiData?.clusters || [];
  const interpretation = apiData?.interpretation || {};
  const checkedCorrelations = apiData?.checkedCorrelations || 0;
  
  // No clusters found - CONTRACT: explain WHAT was checked using API interpretation
  if (!loading && clusters.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Related Addresses
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-emerald-100 text-emerald-700">Checked</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 bg-slate-50 rounded-xl">
            <div className="p-3 bg-white rounded-xl inline-block mb-3 shadow-sm">
              <Users className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              {interpretation.headline || 'No related addresses detected'}
            </p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {interpretation.description || `We checked timing correlation across ${checkedCorrelations} wallet pairs.`}
            </p>
            <p className="text-xs text-gray-400 mt-3 italic">
              Correlation based on timing, token overlap, and behavioral similarity.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className} data-testid="related-addresses">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" />
            Related Addresses
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {clusters.length} cluster{clusters.length !== 1 ? 's' : ''}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Info banner - CRITICAL messaging */}
        <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-xs text-blue-700 dark:text-blue-300">
          System suggests these addresses may be related based on behavioral analysis. 
          Review evidence to confirm or reject.
        </div>
        
        {/* Cluster suggestions */}
        {clusters.map((suggestion) => (
          <ClusterSuggestionCard
            key={suggestion.clusterId}
            suggestion={suggestion}
            onReview={onReviewCluster}
            onWalletClick={onWalletClick}
          />
        ))}
      </CardContent>
    </Card>
  );
}

export default RelatedAddresses;
