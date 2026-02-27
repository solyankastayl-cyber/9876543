/**
 * ConnectionsDetailPage - Single account detail view
 * Shows: Basics, Trend Dynamics, Early Signal, Activity, Risk, Analytics (Phase 2.2), Smart Followers (Phase 3.2), Network Paths (Phase 3.4)
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, AlertTriangle, TrendingUp, Activity, Eye, MessageCircle, User, Rocket, Scale, BarChart3, Users, Network } from 'lucide-react';
import { Button } from '../../components/ui/button';
import AccountTrendPanel from '../../components/connections/AccountTrendPanel';
import CompareModal from '../../components/connections/CompareModal';
import TimeSeriesCharts from '../../components/connections/TimeSeriesCharts';
import SmartFollowersPanel from '../../components/connections/SmartFollowersPanel';
import NetworkPathsPanel from '../../components/connections/NetworkPathsPanel';
import AiSummaryPanel from '../../components/connections/AiSummaryPanel';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// Profile badge component
const ProfileBadge = ({ profile }) => {
  const styles = {
    retail: 'bg-blue-100 text-blue-700 border-blue-200',
    influencer: 'bg-purple-100 text-purple-700 border-purple-200',
    whale: 'bg-amber-100 text-amber-700 border-amber-200',
  };
  const labels = {
    retail: 'Retail (<50K)',
    influencer: 'Influencer (50K-500K)',
    whale: 'Whale (500K+)',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[profile] || 'bg-gray-100 text-gray-500'}`}>
      {labels[profile] || profile || 'Unknown'}
    </span>
  );
};

// Progress bar component
const ProgressBar = ({ value, max = 1, color = 'blue' }) => {
  const percent = Math.min((value / max) * 100, 100);
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
  };
  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className={`h-full ${colors[color]} rounded-full transition-all duration-500`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};

// Metric card component
const MetricCard = ({ label, value, subValue, icon: Icon, color = 'blue' }) => {
  const colors = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    yellow: 'text-yellow-600 bg-yellow-50',
    red: 'text-red-600 bg-red-50',
    purple: 'text-purple-600 bg-purple-50',
  };
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200">
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg ${colors[color]} flex items-center justify-center`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {subValue && <div className="text-sm text-gray-500 mt-1">{subValue}</div>}
    </div>
  );
};

// Risk flag component
const RiskFlag = ({ flag }) => {
  const severityColors = {
    1: 'border-yellow-300 bg-yellow-50',
    2: 'border-orange-300 bg-orange-50',
    3: 'border-red-300 bg-red-50',
  };
  const severityIcons = {
    1: 'text-yellow-600',
    2: 'text-orange-600',
    3: 'text-red-600',
  };
  return (
    <div className={`p-4 rounded-lg border ${severityColors[flag.severity]}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={`w-5 h-5 mt-0.5 ${severityIcons[flag.severity]}`} />
        <div>
          <div className="font-medium text-gray-900">{flag.type.replace(/_/g, ' ')}</div>
          <div className="text-sm text-gray-600 mt-1">{flag.reason}</div>
        </div>
      </div>
    </div>
  );
};

export default function ConnectionsDetailPage() {
  const { authorId } = useParams();
  const [profile, setProfile] = useState(null);
  const [scoreResult, setScoreResult] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [earlySignal, setEarlySignal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareAccount, setCompareAccount] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch profile from database
        let profileData = null;
        try {
          const profileRes = await fetch(`${BACKEND_URL}/api/connections/accounts/${authorId}`);
          const data = await profileRes.json();
          if (data.ok && data.data) {
            profileData = data.data;
          }
        } catch (e) {
          console.log('Profile fetch failed, using mock data');
        }
        
        // If no profile found, generate mock for demo
        if (!profileData) {
          profileData = {
            author_id: authorId,
            username: authorId.replace('_', '').slice(0, 12),
            followers: Math.round(5000 + Math.random() * 50000),
            profile: ['retail', 'influencer', 'whale'][Math.floor(Math.random() * 3)],
            scores: {
              influence_score: Math.round(400 + Math.random() * 400),
              x_score: Math.round(250 + Math.random() * 300),
              signal_noise: 5 + Math.random() * 3,
              risk_level: ['low', 'medium'][Math.floor(Math.random() * 2)],
            },
            activity: {
              posts_count: Math.round(50 + Math.random() * 200),
              window_days: 30,
            },
          };
        }
        
        setProfile(profileData);
        
        // Generate trend values
        const velocity = profileData.trend?.velocity_norm ?? (Math.random() - 0.3) * 1.2;
        const accel = profileData.trend?.acceleration_norm ?? (Math.random() - 0.3) * 1.0;
        const baseInfluence = profileData.scores?.influence_score || 500;
        
        // Fetch trend-adjusted score
        try {
          const trendRes = await fetch(`${BACKEND_URL}/api/connections/trend-adjusted`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              influence_score: baseInfluence,
              x_score: profileData.scores?.x_score || 300,
              velocity_norm: velocity,
              acceleration_norm: accel,
            }),
          });
          const trend = await trendRes.json();
          if (trend.ok) {
            setTrendData({
              influence_base: baseInfluence,
              influence_adjusted: trend.data.influence.adjusted_score,
              velocity: velocity,
              acceleration: accel,
              state: velocity > 0.2 ? 'growing' : velocity < -0.2 ? 'cooling' : Math.abs(accel) > 0.3 ? 'volatile' : 'stable',
              delta: trend.data.influence.delta,
            });
          }
        } catch (err) {
          console.error('Trend fetch error:', err);
          const adjusted = Math.round(baseInfluence * (1 + 0.35 * velocity + 0.15 * accel));
          setTrendData({
            influence_base: baseInfluence,
            influence_adjusted: adjusted,
            velocity: velocity,
            acceleration: accel,
            state: velocity > 0.2 ? 'growing' : velocity < -0.2 ? 'cooling' : 'stable',
          });
        }
        
        // Fetch early signal
        try {
          const earlyRes = await fetch(`${BACKEND_URL}/api/connections/early-signal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              influence_base: baseInfluence,
              influence_adjusted: Math.round(baseInfluence * (1 + 0.35 * velocity + 0.15 * accel)),
              trend: { velocity_norm: velocity, acceleration_norm: accel },
              signal_noise: profileData.scores?.signal_noise || 5,
              risk_level: profileData.scores?.risk_level || 'low',
              profile: profileData.profile || 'retail',
            }),
          });
          const early = await earlyRes.json();
          if (early.ok) {
            setEarlySignal(early.data);
          } else {
            // Fallback calculation
            throw new Error('API returned not ok');
          }
        } catch (err) {
          console.error('Early signal error:', err);
          // Calculate early signal based on profile data
          const engagementScore = profileData.scores?.x_score || 500;
          const influenceScore = profileData.scores?.influence_score || 500;
          // Early signal based on engagement and influence combination
          const earlyScore = Math.round((engagementScore * 0.4 + influenceScore * 0.3 + Math.max(0, velocity * 300)) / 0.7);
          const badge = earlyScore >= 700 && velocity > 0.2 ? 'breakout' : earlyScore >= 450 ? 'rising' : 'none';
          setEarlySignal({
            early_signal_score: Math.min(earlyScore, 999),
            badge: badge,
            confidence: 0.7,
            reasons: [
              velocity > 0.2 ? 'Positive growth dynamics' : null,
              engagementScore > 600 ? 'High engagement score' : null,
              influenceScore > 600 ? 'Strong influence base' : null,
            ].filter(Boolean),
            explanation: badge === 'breakout' 
              ? 'Early breakout signal detected. Account is rapidly gaining influence.'
              : badge === 'rising'
                ? 'Positive dynamics. Monitoring recommended.'
                : 'No significant early growth signals detected at this time.'
          });
        }
        
        // Fetch mock score for demo
        try {
          const mockRes = await fetch(`${BACKEND_URL}/api/connections/score/mock`);
          const mockData = await mockRes.json();
          if (mockData.ok) {
            setScoreResult(mockData.data);
          }
        } catch (err) {
          console.error('Mock score error:', err);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
      }
      setLoading(false);
    };
    fetchData();
  }, [authorId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!profile || error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-4">{error || 'Account not found'}</div>
          <Link to="/connections">
            <Button>Back to Connections</Button>
          </Link>
        </div>
      </div>
    );
  }

  const metrics = scoreResult?.metrics || profile.activity || {};
  const redFlags = scoreResult?.red_flags || [];
  const accountProfile = scoreResult?.profile || 'unknown';

  return (
    <div className="min-h-screen bg-gray-50" data-testid="connections-detail-page">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link
            to="/connections"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Connections
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Basics */}
          <div className="col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Basics
                </h3>
                <ProfileBadge profile={accountProfile} />
              </div>
              <div className="flex items-center gap-4 mb-6">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.username || profile.handle}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {profile.handle?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <div>
                  <div className="text-xl font-bold text-gray-900">
                    {profile.username || `@${profile.handle}`}
                  </div>
                  <a
                    href={`https://twitter.com/${profile.handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    @{profile.handle} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Followers</span>
                  <span className="font-semibold text-gray-900">
                    {(profile.followers || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Growth (30d)</span>
                  <span className={`font-semibold ${(profile.follower_growth_30d || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {((profile.follower_growth_30d || 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Total Posts</span>
                  <span className="font-semibold text-gray-900">
                    {profile.activity?.posts_count || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-500">Risk Level</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    profile.scores?.risk_level === 'low' ? 'bg-green-100 text-green-700' :
                    profile.scores?.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    profile.scores?.risk_level === 'high' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {profile.scores?.risk_level?.toUpperCase() || 'UNKNOWN'}
                  </span>
                </div>
              </div>
            </div>

            {/* Scores */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Scores
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Influence Score</span>
                    <span className="text-lg font-bold text-blue-600">
                      {scoreResult?.influence_score || profile.scores?.influence_score || 0}
                    </span>
                  </div>
                  <ProgressBar value={(scoreResult?.influence_score || profile.scores?.influence_score || 0) / 1000} color="blue" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">X Score</span>
                    <span className="text-lg font-bold text-purple-600">
                      {profile.scores?.x_score || scoreResult?.x_score || 0}
                    </span>
                  </div>
                  <ProgressBar value={(profile.scores?.x_score || scoreResult?.x_score || 0) / 1000} color="purple" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Signal/Noise</span>
                    <span className="text-lg font-bold text-green-600">
                      {(profile.scores?.signal_noise || scoreResult?.signal_noise || 0).toFixed(1)}/10
                    </span>
                  </div>
                  <ProgressBar value={(profile.scores?.signal_noise || scoreResult?.signal_noise || 0) / 10} color="green" />
                </div>
              </div>
              
              {/* Profile Weights Info */}
              {scoreResult?.explain?.weights && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-500 mb-2">
                    Profile weights ({accountProfile}):
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-gray-600">
                      Views: {(scoreResult.explain.weights.influence.rve * 100).toFixed(0)}%
                    </div>
                    <div className="text-gray-600">
                      Reach: {(scoreResult.explain.weights.influence.re * 100).toFixed(0)}%
                    </div>
                    <div className="text-gray-600">
                      Quality: {(scoreResult.explain.weights.influence.eq * 100).toFixed(0)}%
                    </div>
                    <div className="text-gray-600">
                      Authority: {(scoreResult.explain.weights.influence.authority * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Trend, Early Signal, Activity & Risk */}
          <div className="col-span-2 space-y-6">
            {/* Trend Dynamics Panel - NEW */}
            {trendData && (
              <AccountTrendPanel
                trend={{
                  velocity: trendData.velocity,
                  acceleration: trendData.acceleration,
                  state: trendData.state,
                }}
                influence_base={trendData.influence_base}
                influence_adjusted={trendData.influence_adjusted}
                period="30d"
              />
            )}

            {/* Early Signal Panel - COMPACT with tooltip */}
            {earlySignal && (
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-gray-400" />
                    <h3 className="text-sm font-semibold text-gray-700">Early Signal</h3>
                    {/* Tooltip with explanation */}
                    <div className="relative group">
                      <AlertTriangle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                      <div className="absolute left-0 bottom-full mb-2 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                        <div className="font-semibold mb-1">What is Early Signal?</div>
                        <p className="text-gray-300 leading-relaxed">
                          Alpha radar that detects accounts showing early growth patterns before they become widely recognized.
                          <br/><br/>
                          <span className="text-green-400">🚀 Breakout (700+)</span>: Rapid influence gain, high confidence<br/>
                          <span className="text-yellow-400">📈 Rising (450-699)</span>: Positive dynamics, worth watching<br/>
                          <span className="text-gray-400">➖ None (&lt;450)</span>: No significant early signals
                        </p>
                        <div className="absolute left-4 top-full w-2 h-2 bg-gray-900 transform rotate-45 -translate-y-1"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-gray-800">{earlySignal.early_signal_score}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                      earlySignal.badge === 'breakout' ? 'bg-green-100 text-green-700' :
                      earlySignal.badge === 'rising' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {earlySignal.badge === 'breakout' && '🚀'}
                      {earlySignal.badge === 'rising' && '📈'}
                      {earlySignal.badge === 'none' && '➖'}
                      {earlySignal.badge}
                    </span>
                  </div>
                </div>
                {(earlySignal.badge === 'breakout' || earlySignal.badge === 'rising') && (
                  <div className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                    {earlySignal.explanation || (earlySignal.badge === 'breakout' 
                      ? 'Early breakout detected — account is rapidly gaining influence.'
                      : 'Positive dynamics — monitoring recommended.')}
                  </div>
                )}
                {earlySignal.reasons?.length > 0 && (earlySignal.badge === 'breakout' || earlySignal.badge === 'rising') && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {earlySignal.reasons.slice(0, 3).map((reason, idx) => (
                      <span key={idx} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {reason}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Activity Overview */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Activity Overview
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <MetricCard
                  label="Real Views"
                  value={metrics.real_views?.toLocaleString() || '—'}
                  subValue="Median views per post"
                  icon={Eye}
                  color="blue"
                />
                <MetricCard
                  label="Engagement Quality"
                  value={`${((metrics.engagement_quality || 0) * 100).toFixed(1)}%`}
                  subValue="Weighted engagement rate"
                  icon={MessageCircle}
                  color="green"
                />
                <MetricCard
                  label="Posting Consistency"
                  value={`${((metrics.posting_consistency || 0) * 100).toFixed(0)}%`}
                  subValue="Regular posting pattern"
                  icon={Activity}
                  color="purple"
                />
              </div>

              <div className="grid grid-cols-2 gap-6 mt-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Engagement Stability</span>
                    <span className="text-sm font-medium">
                      {((metrics.engagement_stability || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <ProgressBar value={metrics.engagement_stability || 0} color="blue" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Reach Efficiency</span>
                    <span className="text-sm font-medium">
                      {((metrics.reach_efficiency || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <ProgressBar value={metrics.reach_efficiency || 0} color="green" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Volatility</span>
                    <span className="text-sm font-medium">
                      {(metrics.volatility || 0).toFixed(2)}
                    </span>
                  </div>
                  <ProgressBar value={Math.min(metrics.volatility || 0, 2) / 2} color="yellow" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Follower Growth</span>
                    <span className={`text-sm font-medium ${(metrics.follower_growth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metrics.follower_growth !== undefined ? `${(metrics.follower_growth * 100).toFixed(1)}%` : '—'}
                    </span>
                  </div>
                  <ProgressBar value={Math.min(Math.abs(metrics.follower_growth || 0), 1)} color={metrics.follower_growth >= 0 ? 'green' : 'red'} />
                </div>
              </div>
            </div>

            {/* AI Summary Panel (Phase 3.6) */}
            <AiSummaryPanel 
              accountId={authorId}
              scoreData={{
                twitter_score: scoreResult?.influence_score || profile.scores?.influence_score || 500,
                influence_score: trendData?.influence_adjusted || scoreResult?.influence_score || 500,
                grade: scoreResult?.grade || 'B',
                quality: metrics.engagement_quality || 0.7,
                trend_score: trendData?.velocity > 0 ? 0.7 : 0.4,
                network: 0.6,
                consistency: metrics.posting_consistency || 0.7,
                audience_quality: 0.75,
                authority: 0.6,
                smart_followers: 65,
                hops: { avg_hops_to_top: 2.5 },
                trends: trendData ? { 
                  velocity_pts_per_day: trendData.velocity * 10, 
                  state: trendData.state 
                } : { state: 'stable' },
                early_signal: earlySignal ? { 
                  badge: earlySignal.badge, 
                  score: earlySignal.early_signal_score 
                } : { badge: 'none' },
                red_flags: redFlags.map(f => f.reason) || [],
                confidence: 75,
              }}
              isAdmin={false}
            />

            {/* Analytics Section (Phase 2.2) */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Analytics
                </h3>
              </div>
              <TimeSeriesCharts accountId={authorId} window="30d" />
            </div>

            {/* Smart Followers Section (Phase 3.2) */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Smart Followers
                </h3>
              </div>
              <SmartFollowersPanel accountId={authorId} />
            </div>

            {/* Network Paths Section (Phase 3.4) */}
            <div className="bg-white rounded-xl p-6 border border-gray-200" data-testid="network-paths-section">
              <div className="flex items-center gap-2 mb-4">
                <Network className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Network Paths & Exposure
                </h3>
              </div>
              <NetworkPathsPanel 
                accountId={authorId} 
                onHighlightPath={(path) => {
                  // Future: highlight path on graph visualization
                  console.log('Highlight path:', path);
                }}
              />
            </div>

            {/* Risk Flags */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Risk Analysis
              </h3>
              {redFlags.length > 0 ? (
                <div className="space-y-3">
                  {redFlags.map((flag, idx) => (
                    <RiskFlag key={idx} flag={flag} />
                  ))}
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-green-800">No Risk Flags Detected</div>
                    <div className="text-sm text-green-600">This account passes all automated risk checks.</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Compare Modal */}
      <CompareModal
        isOpen={compareOpen}
        onClose={() => setCompareOpen(false)}
        accountA={profile && trendData && earlySignal ? {
          author_id: profile.author_id,
          username: profile.username,
          profile: profile.profile || 'retail',
          risk_level: profile.scores?.risk_level || 'low',
          influence_base: trendData.influence_base,
          influence_adjusted: trendData.influence_adjusted,
          trend: {
            velocity_norm: trendData.velocity,
            acceleration_norm: trendData.acceleration,
            state: trendData.state,
          },
          early_signal: {
            score: earlySignal.early_signal_score,
            badge: earlySignal.badge,
            confidence: earlySignal.confidence,
          },
        } : null}
        accountB={compareAccount}
        onSelectAccount={(id) => {
          setCompareOpen(false);
          if (id !== authorId) {
            window.location.href = `/connections/${id}`;
          }
        }}
      />
    </div>
  );
}
