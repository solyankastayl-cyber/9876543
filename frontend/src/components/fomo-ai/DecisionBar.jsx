/**
 * Decision Bar Component (Light Theme)
 * 
 * Shows the current BUY/SELL/AVOID decision with confidence + Share button
 */

import { useState } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Shield, Zap, Activity, Share2, Check, Loader2 } from 'lucide-react';
import { MacroImpactLine } from '../macro/MacroImpactLine';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export function DecisionBar({ decision, symbol }) {
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  
  if (!decision || !decision.ok) return null;

  const { action, confidence, explainability } = decision;
  const riskFlags = explainability?.riskFlags || {};

  const getActionStyle = () => {
    switch (action) {
      case 'BUY':
        return {
          bg: 'bg-gradient-to-r from-green-50 to-green-100',
          border: 'border-green-200',
          text: 'text-green-700',
          icon: TrendingUp,
        };
      case 'SELL':
        return {
          bg: 'bg-gradient-to-r from-red-50 to-red-100',
          border: 'border-red-200',
          text: 'text-red-700',
          icon: TrendingDown,
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-gray-50 to-gray-100',
          border: 'border-gray-200',
          text: 'text-gray-700',
          icon: AlertCircle,
        };
    }
  };

  const style = getActionStyle();
  const Icon = style.icon;

  const dataMode = explainability?.dataMode || 'LIVE';
  
  const riskArray = [];
  if (riskFlags.whaleRisk && riskFlags.whaleRisk !== 'LOW') {
    riskArray.push({ code: 'WHALE_RISK', severity: riskFlags.whaleRisk, description: 'Whale positioning detected' });
  }
  if (riskFlags.contradiction) {
    riskArray.push({ code: 'CONTRADICTION', severity: 'HIGH', description: 'Signal contradiction detected' });
  }
  if (riskFlags.marketStress && riskFlags.marketStress !== 'NORMAL') {
    riskArray.push({ code: 'MARKET_STRESS', severity: 'MEDIUM', description: 'Elevated market stress' });
  }
  if (riskFlags.liquidationRisk) {
    riskArray.push({ code: 'LIQUIDATION', severity: 'HIGH', description: 'Liquidation risk detected' });
  }
  
  const hasRisks = riskArray.length > 0;
  const highRisks = riskArray.filter(r => r.severity === 'HIGH');

  const handleShare = async () => {
    setSharing(true);
    try {
      const res = await fetch(`${API_URL}/api/v10/snapshot/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: symbol || decision.symbol }),
      });
      const data = await res.json();
      if (data.ok && data.shareUrl) {
        setShareUrl(data.shareUrl);
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
    setSharing(false);
  };

  const handleCopy = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`rounded-xl p-5 ${style.bg} border ${style.border} shadow-sm`} data-testid="decision-bar">
      <div className="flex items-center justify-between">
        {/* Left: Action & Confidence */}
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl bg-white shadow-sm`}>
            <Icon className={`w-8 h-8 ${style.text}`} />
          </div>
          
          <div>
            <div className="flex items-center gap-3">
              <span className={`text-3xl font-bold ${style.text}`}>
                {action}
              </span>
              
              {/* Data Mode Badge */}
              <span className={`text-xs px-2 py-1 rounded font-medium ${
                dataMode === 'LIVE' 
                  ? 'bg-green-100 text-green-700'
                  : dataMode === 'MIXED'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {dataMode}
              </span>
            </div>
            
            <div className="text-gray-500 text-sm mt-1">
              Confidence: <span className="text-gray-900 font-medium">
                {(confidence * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Right: Confidence Bar & Badges */}
        <div className="flex items-center gap-6">
          {/* Confidence Visual */}
          <div className="w-48">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Confidence</span>
              <span>{(confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-white rounded-full overflow-hidden shadow-inner">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  confidence >= 0.7 ? 'bg-green-500' :
                  confidence >= 0.5 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${confidence * 100}%` }}
              />
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex items-center gap-2">
            {explainability?.mlReady && (
              <span className="flex items-center gap-1 text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded font-medium">
                <Zap className="w-3 h-3" />
                ML
              </span>
            )}
            
            {hasRisks && (
              <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded font-medium ${
                highRisks.length > 0 
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                <Shield className="w-3 h-3" />
                {riskArray.length} Risk{riskArray.length > 1 ? 's' : ''}
              </span>
            )}
            
            {/* Share Button */}
            {!shareUrl ? (
              <button
                onClick={handleShare}
                disabled={sharing}
                className="flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded font-medium hover:bg-blue-200 transition-colors disabled:opacity-50"
                data-testid="share-button"
              >
                {sharing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Share2 className="w-3 h-3" />
                )}
                Share
              </button>
            ) : (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded font-medium hover:bg-green-200 transition-colors"
                data-testid="copy-link-button"
              >
                {copied ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Share2 className="w-3 h-3" />
                )}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Applied Rules */}
      {explainability?.appliedRules?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200/50">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">Applied:</span>
            {explainability.appliedRules.map((rule, i) => (
              <span 
                key={i}
                className="text-xs px-2 py-0.5 bg-white text-gray-600 rounded shadow-sm border border-gray-100"
              >
                {rule}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Macro Regime Impact */}
      <div className="mt-4 pt-4 border-t border-gray-200/50">
        <MacroImpactLine />
      </div>
    </div>
  );
}
