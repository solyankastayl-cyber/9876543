/**
 * Wallet Credibility Badge Component
 * 
 * E3: Shows actor's on-chain wallet credibility
 */

import React, { useState, useEffect } from 'react';
import { Wallet, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

export default function WalletCredibilityBadge({ actorId, compact = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actorId) return;
    
    const load = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/connections/wallets/credibility/${actorId}`);
        if (res.data.ok) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load wallet credibility:', err);
      } finally {
        setLoading(false);
      }
    };
    
    load();
  }, [actorId]);

  if (loading) {
    return <div className="animate-pulse bg-gray-700/50 rounded h-6 w-24" />;
  }

  if (!data || !data.hasWallets) {
    if (compact) return null;
    return (
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <Wallet className="w-3 h-3" />
        <span>No wallets linked</span>
      </div>
    );
  }

  const { walletCount, verifiedCount, avgConfidence_0_1, credibilityBoost_0_1 } = data;

  if (compact) {
    return (
      <span 
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
          verifiedCount > 0 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
        }`}
        title={`${walletCount} wallets, ${verifiedCount} verified`}
      >
        <Wallet className="w-3 h-3" />
        {verifiedCount > 0 ? 'Verified' : 'Linked'}
      </span>
    );
  }

  return (
    <div className="bg-gray-800/80 rounded-lg border border-gray-700 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-white">On-chain Identity</span>
        </div>
        {verifiedCount > 0 && (
          <span className="flex items-center gap-1 text-xs text-emerald-400">
            <CheckCircle className="w-3 h-3" />
            Verified
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-lg font-bold text-white">{walletCount}</div>
          <div className="text-[10px] text-gray-500">Wallets</div>
        </div>
        <div>
          <div className="text-lg font-bold text-emerald-400">{verifiedCount}</div>
          <div className="text-[10px] text-gray-500">Verified</div>
        </div>
        <div>
          <div className="text-lg font-bold text-blue-400">+{Math.round(credibilityBoost_0_1 * 100)}%</div>
          <div className="text-[10px] text-gray-500">Trust Boost</div>
        </div>
      </div>

      {avgConfidence_0_1 > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-700">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Avg. Confidence</span>
            <span className="text-white">{Math.round(avgConfidence_0_1 * 100)}%</span>
          </div>
          <div className="mt-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${avgConfidence_0_1 * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
