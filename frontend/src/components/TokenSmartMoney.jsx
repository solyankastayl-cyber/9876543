/**
 * TokenSmartMoney (B4) - Token Context
 * 
 * P1 LIVE: Fetches smart money data from backend API
 * 
 * Shows smart money activity patterns for this token.
 */
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, Loader2, Users } from 'lucide-react';

/**
 * Format wallet address for display
 */
const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * TokenSmartMoney Component (B4)
 */
export default function TokenSmartMoney({ tokenAddress, className = '' }) {
  const [smartMoneyData, setSmartMoneyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSmartMoney() {
      if (!tokenAddress) return;
      
      setLoading(true);
      
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/market/token-smart-money/${tokenAddress}`
        );
        const data = await response.json();
        
        if (data?.ok && data?.data) {
          setSmartMoneyData(data.data);
        }
      } catch (err) {
        console.error('Failed to load smart money data:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchSmartMoney();
  }, [tokenAddress]);

  // Loading state
  if (loading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Smart Money Activity</h3>
        </div>
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Analyzing wallets...</span>
        </div>
      </div>
    );
  }

  const hasData = smartMoneyData && (
    smartMoneyData.participants?.length > 0 || 
    smartMoneyData.totalSmartVolume > 0
  );
  
  // Get interpretation from API
  const interpretation = smartMoneyData?.interpretation || {};

  // Empty state - explain WHAT was checked
  if (!hasData) {
    return (
      <div className={`bg-white border border-gray-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Smart Money Activity</h3>
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Analyzed</span>
        </div>
        <div className="text-center py-6 bg-gray-50 rounded-xl">
          <div className="p-3 bg-white rounded-xl inline-block mb-3 shadow-sm">
            <TrendingUp className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            {interpretation.headline || 'No significant smart money patterns'}
          </p>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {interpretation.description || `We analyzed ${smartMoneyData?.checkedWallets?.toLocaleString() || 0} wallets for high-volume activity patterns.`}
          </p>
        </div>
      </div>
    );
  }

  // Show smart money data - use new API structure
  const { participants, totalSmartVolume, shareOfTotalVolume, checkedWallets } = smartMoneyData;
  const accumulators = participants?.filter(w => w.action === 'accumulating') || [];
  const distributors = participants?.filter(w => w.action === 'distributing') || [];
  
  // Format recent activity summary
  const recentActivity = interpretation.description || null;
  
  // Alias for consistent naming
  const wallets = participants;

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Smart Money Activity</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Live</span>
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
            {participants?.length || 0} wallet{(participants?.length || 0) !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      
      {/* Interpretation headline */}
      <div className="mb-3 p-2 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
        <p className="text-xs font-medium text-purple-800">{interpretation.headline}</p>
        {interpretation.description && (
          <p className="text-xs text-purple-600 mt-1">{interpretation.description}</p>
        )}
      </div>
      
      <div className="space-y-3">
        {/* Total Value & Share */}
        {totalSmartVolume > 0 && (
          <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Smart Money Volume</span>
              <span className="text-sm font-bold text-emerald-700">
                ${totalSmartVolume.toLocaleString()}
              </span>
            </div>
            {shareOfTotalVolume > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                {(shareOfTotalVolume * 100).toFixed(1)}% of total volume
              </div>
            )}
          </div>
        )}
        
        {/* Recent Activity Summary */}
        {recentActivity && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-gray-700">
                24h Activity
              </span>
            </div>
            <p className="text-xs text-gray-600 ml-6">
              {recentActivity}
            </p>
          </div>
        )}
        
        {/* Top Wallets */}
        {wallets && wallets.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Key Wallets
            </h4>
            {wallets.slice(0, 3).map((wallet, index) => (
              <div key={wallet.address || index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {wallet.action === 'accumulating' ? (
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className="font-mono text-xs text-gray-700">
                    {formatAddress(wallet.address)}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-medium ${
                    wallet.action === 'accumulating' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {wallet.action === 'accumulating' ? 'Buying' : 'Selling'}
                  </span>
                  {wallet.volumeUsd && (
                    <div className="text-xs text-gray-500">
                      ${Math.round(wallet.volumeUsd).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
