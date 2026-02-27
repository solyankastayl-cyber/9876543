/**
 * Signal Trust Badge - Simplified Integration Component
 * Shows trust score inline in signal cards
 */
import React, { useState, useEffect } from 'react';
import { Shield, Info } from 'lucide-react';
import TrustBadge from './TrustBadge';
import TrustExplanation from './TrustExplanation';

export default function SignalTrustBadge({ signalId, compact = false }) {
  const [trustScore, setTrustScore] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (signalId) {
      fetchTrustScore();
    }
  }, [signalId]);

  const fetchTrustScore = async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
      const response = await fetch(
        `${backendUrl}/api/reputation/signal/${signalId}`
      );
      const data = await response.json();
      if (data.ok && data.data) {
        setTrustScore(data.data.trustScore);
      }
    } catch (error) {
      console.error('Failed to fetch trust score:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="inline-flex items-center gap-1 text-xs text-gray-400">
        <Shield className="h-3 w-3 animate-pulse" />
        <span>...</span>
      </div>
    );
  }

  if (trustScore === null) return null;

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1">
        <TrustBadge score={trustScore} size="sm" showLabel={false} />
        <TrustExplanation type="signal" targetId={signalId} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <TrustBadge score={trustScore} size="md" />
      <TrustExplanation type="signal" targetId={signalId} />
    </div>
  );
}
