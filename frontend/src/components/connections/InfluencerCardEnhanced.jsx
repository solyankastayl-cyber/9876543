/**
 * Enhanced Influencer Card Component
 * 
 * Extends InfluencerCard with BLOCKS 15-28 data:
 * - AQI (Audience Quality Index) 
 * - Authenticity Score
 * - Behavior Profile
 * - Bot Market Signals
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Network, CheckCircle, AlertTriangle, XCircle, Heart, Clock, 
  TrendingUp, Info, Twitter, Shield, Users, Zap, AlertCircle
} from 'lucide-react';
import { getAuthorityColor, getGroupConfig, formatFollowers, METRIC_TOOLTIPS } from '../../config/influencer.config';
import { 
  fetchAudienceQualityNew, 
  fetchAuthenticity, 
  fetchBehaviorProfile 
} from '../../api/blocks15-28.api';

// Tooltip Component
const MetricTooltip = ({ text, children, wide = false }) => (
  <div className="relative group inline-block">
    {children}
    <div className={`absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-50 shadow-lg text-left ${wide ? 'w-72' : 'w-56'}`}>
      {text}
      <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-gray-900" />
    </div>
  </div>
);

// AQI Mini Badge
const AQIMini = ({ data }) => {
  if (!data) return null;
  
  const colors = {
    ELITE: 'bg-green-100 text-green-700 border-green-200',
    GOOD: 'bg-blue-100 text-blue-700 border-blue-200',
    MIXED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    RISKY: 'bg-red-100 text-red-700 border-red-200'
  };
  
  return (
    <MetricTooltip text={`AQI: ${data.aqi} - Human: ${data.pctHuman}%, Bot: ${data.pctBot}%`}>
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border cursor-help ${colors[data.level] || colors.MIXED}`}>
        <Users className="w-3 h-3" />
        {Math.round(data.aqi)}
      </span>
    </MetricTooltip>
  );
};

// Authenticity Mini Badge
const AuthenticityMini = ({ data }) => {
  if (!data) return null;
  
  const colors = {
    ORGANIC: 'bg-green-100 text-green-700 border-green-200',
    MOSTLY_REAL: 'bg-blue-100 text-blue-700 border-blue-200',
    MIXED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    FARMED: 'bg-orange-100 text-orange-700 border-orange-200',
    HIGHLY_FARMED: 'bg-red-100 text-red-700 border-red-200'
  };
  
  const icons = {
    ORGANIC: CheckCircle,
    MOSTLY_REAL: Shield,
    MIXED: AlertTriangle,
    FARMED: AlertCircle,
    HIGHLY_FARMED: XCircle
  };
  
  const Icon = icons[data.label] || Shield;
  
  return (
    <MetricTooltip text={`Authenticity: ${data.score}% - ${data.label.replace(/_/g, ' ')}`}>
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border cursor-help ${colors[data.label] || colors.MIXED}`}>
        <Icon className="w-3 h-3" />
        {data.score}
      </span>
    </MetricTooltip>
  );
};

// Behavior Profile Mini Badge  
const BehaviorMini = ({ data }) => {
  if (!data) return null;
  
  const configs = {
    LONG_TERM_ACCUMULATOR: { icon: TrendingUp, color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Accum' },
    PUMP_AND_EXIT: { icon: AlertTriangle, color: 'bg-red-100 text-red-700 border-red-200', label: 'P&E' },
    EARLY_CONVICTION: { icon: Zap, color: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Early' },
    LIQUIDITY_PROVIDER: { icon: Network, color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'LP' },
    NOISE_ACTOR: { icon: AlertCircle, color: 'bg-gray-100 text-gray-600 border-gray-200', label: 'Noise' }
  };
  
  const config = configs[data.profile] || configs.NOISE_ACTOR;
  const Icon = config.icon;
  
  return (
    <MetricTooltip text={`${data.profile.replace(/_/g, ' ')} - ${data.description}`}>
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border cursor-help ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    </MetricTooltip>
  );
};

// Reality Badge
const RealityBadge = ({ badge }) => {
  const configs = {
    CONFIRMED: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', label: 'Confirmed' },
    MIXED: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'Mixed' },
    RISKY: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Risky' }
  };
  const cfg = configs[badge] || configs.MIXED;
  const Icon = cfg.icon;
  
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${cfg.color} ${cfg.bg}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
};

// Group Badge
const GroupBadge = ({ groupId }) => {
  const labels = {
    INFLUENCE: 'Influence', SMART: 'Smart', MEDIA: 'Media',
    TRADING: 'Trading', NFT: 'NFT', POPULAR: 'Popular',
    VC: 'VC', EARLY: 'Early', MOST_SEARCHED: 'Hot'
  };
  const config = getGroupConfig(groupId);
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
      {labels[groupId] || groupId}
    </span>
  );
};

// Score Bar
const ScoreBar = ({ score, maxScore = 1000, label, icon: Icon, color }) => {
  const percent = Math.min(100, (score / maxScore) * 100);
  const barColor = color || getAuthorityColor(score);
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-500 flex items-center gap-1">
          {Icon && <Icon className="w-3 h-3" />}
          {label}
        </span>
        <span className={`text-sm font-bold ${barColor.text}`}>{score}</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%`, backgroundColor: barColor.bar }}
        />
      </div>
    </div>
  );
};

export default function InfluencerCardEnhanced({ influencer, view = 'grid' }) {
  const [aqi, setAqi] = useState(null);
  const [authenticity, setAuthenticity] = useState(null);
  const [behaviorProfile, setBehaviorProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEnhancedData() {
      if (!influencer?.handle) return;
      
      try {
        const [aqiData, authData, profileData] = await Promise.all([
          fetchAudienceQualityNew(influencer.handle),
          fetchAuthenticity(influencer.handle),
          fetchBehaviorProfile(influencer.handle)
        ]);
        
        setAqi(aqiData);
        setAuthenticity(authData);
        setBehaviorProfile(profileData);
      } catch (err) {
        console.error('[InfluencerCardEnhanced] Error loading data:', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadEnhancedData();
  }, [influencer?.handle]);

  const isGrid = view === 'grid';

  if (isGrid) {
    return (
      <Link 
        to={`/connections/influencers/${influencer.handle}`}
        className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-200 overflow-hidden cursor-pointer"
        data-testid={`influencer-card-${influencer.handle}`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-start gap-3">
            <img
              src={influencer.avatar}
              alt={influencer.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-gray-100 dark:border-gray-700"
              onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${influencer.name}&background=random`; }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{influencer.name}</h3>
                <RealityBadge badge={influencer.realityBadge} />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">@{influencer.handle}</p>
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {influencer.groups?.slice(0, 2).map(g => (
                  <GroupBadge key={g} groupId={g} />
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* BLOCKS 15-28 Badges Row */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 flex-wrap">
            <AQIMini data={aqi} />
            <AuthenticityMini data={authenticity} />
            <BehaviorMini data={behaviorProfile} />
          </div>
        </div>
        
        {/* Scores Section */}
        <div className="px-4 py-3 space-y-2">
          <ScoreBar 
            score={influencer.twitterScore || influencer.authorityScore} 
            label="Twitter Score"
            icon={Twitter}
            color={{ text: 'text-blue-600', bar: '#3B82F6' }}
          />
          <ScoreBar 
            score={influencer.authorityScore} 
            label="Authority"
            icon={Shield}
          />
        </div>
        
        {/* Stats */}
        <div className="p-4 grid grid-cols-3 gap-3 text-center border-t border-gray-100 dark:border-gray-700">
          <div>
            <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {formatFollowers(influencer.followers)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Followers</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {formatFollowers(influencer.following)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Following</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center justify-center gap-1">
              <Network className="w-4 h-4 text-blue-500" />
              {influencer.strongConnections}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Strong</div>
          </div>
        </div>
        
        {/* Activity */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Heart className="w-3 h-3" />
            {influencer.engagementRate?.toFixed(1) || '—'}% engage
          </div>
          {influencer.lastActive && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {influencer.lastActive}
            </div>
          )}
        </div>
      </Link>
    );
  }
  
  // List View
  return (
    <Link 
      to={`/connections/influencers/${influencer.handle}`}
      className="block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-900 hover:border-purple-200 dark:hover:border-purple-700 transition-all"
      data-testid={`influencer-row-${influencer.handle}`}
    >
      <div className="flex items-center gap-4">
        {/* Avatar + Identity */}
        <div className="flex items-center gap-3 w-56 flex-shrink-0">
          <img
            src={influencer.avatar}
            alt={influencer.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 dark:border-gray-700"
            onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${influencer.name}&background=random`; }}
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900 dark:text-white">{influencer.name}</h3>
              <RealityBadge badge={influencer.realityBadge} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">@{influencer.handle}</p>
          </div>
        </div>
        
        {/* BLOCKS 15-28 Badges */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <AQIMini data={aqi} />
          <AuthenticityMini data={authenticity} />
          <BehaviorMini data={behaviorProfile} />
        </div>
        
        {/* Authority */}
        <div className="w-24 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full"
                style={{ 
                  width: `${Math.min(100, influencer.authorityScore)}%`,
                  backgroundColor: getAuthorityColor(influencer.authorityScore).bar
                }}
              />
            </div>
            <span className={`text-sm font-bold ${getAuthorityColor(influencer.authorityScore).text}`}>
              {influencer.authorityScore}
            </span>
          </div>
        </div>
        
        {/* Followers */}
        <div className="w-20 text-center flex-shrink-0">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{formatFollowers(influencer.followers)}</div>
          <div className="text-xs text-gray-400">followers</div>
        </div>
        
        {/* Engagement */}
        <div className="w-16 text-right flex-shrink-0">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {influencer.engagementRate?.toFixed(1) || '—'}%
          </div>
        </div>
      </div>
    </Link>
  );
}
