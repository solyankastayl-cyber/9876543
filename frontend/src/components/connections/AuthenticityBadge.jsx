/**
 * Authenticity Badge Component
 * 
 * Shows Influencer Authenticity Score (IAS) from Block 21
 * Labels: ORGANIC, MOSTLY_REAL, MIXED, FARMED, HIGHLY_FARMED
 */

import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldX, Shield, AlertTriangle } from 'lucide-react';

const LABEL_CONFIG = {
  ORGANIC: {
    icon: ShieldCheck,
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
    label: 'Organic',
    description: 'Highly authentic audience with genuine engagement'
  },
  MOSTLY_REAL: {
    icon: Shield,
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    label: 'Mostly Real',
    description: 'Predominantly authentic with minor concerns'
  },
  MIXED: {
    icon: ShieldAlert,
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-400',
    border: 'border-yellow-200 dark:border-yellow-800',
    label: 'Mixed',
    description: 'Mixed authenticity - some bot or farm activity detected'
  },
  FARMED: {
    icon: AlertTriangle,
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
    label: 'Farmed',
    description: 'Significant bot farm activity detected'
  },
  HIGHLY_FARMED: {
    icon: ShieldX,
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    label: 'Highly Farmed',
    description: 'Heavy manipulation - majority fake followers'
  }
};

export default function AuthenticityBadge({ data, compact = false }) {
  if (!data) {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-800 text-gray-400">
        <Shield className="w-3 h-3" />
        <span>--</span>
      </div>
    );
  }

  const config = LABEL_CONFIG[data.label] || LABEL_CONFIG.MIXED;
  const Icon = config.icon;

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
        title={`Authenticity: ${data.score}% - ${config.description}`}
      >
        <Icon className="w-3 h-3" />
        <span>{data.score}</span>
      </div>
    );
  }

  return (
    <div className={`p-3 rounded-lg border ${config.bg} ${config.border}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${config.text}`} />
          <span className={`font-medium ${config.text}`}>{config.label}</span>
        </div>
        <span className={`text-2xl font-bold ${config.text}`}>{data.score}</span>
      </div>
      
      {/* Score Bar */}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            data.score >= 80 ? 'bg-green-500' :
            data.score >= 60 ? 'bg-blue-500' :
            data.score >= 40 ? 'bg-yellow-500' :
            data.score >= 20 ? 'bg-orange-500' : 'bg-red-500'
          }`}
          style={{ width: `${data.score}%` }}
        />
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">{config.description}</p>

      {/* Breakdown */}
      {data.breakdown && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 grid grid-cols-3 gap-2 text-xs">
          <div>
            <div className="text-gray-400">Real Followers</div>
            <div className="font-medium">{Math.round(data.breakdown.realFollowerRatio)}%</div>
          </div>
          <div>
            <div className="text-gray-400">Quality</div>
            <div className="font-medium">{Math.round(data.breakdown.audienceQuality)}</div>
          </div>
          <div>
            <div className="text-gray-400">Integrity</div>
            <div className="font-medium">{Math.round(data.breakdown.networkIntegrity)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
