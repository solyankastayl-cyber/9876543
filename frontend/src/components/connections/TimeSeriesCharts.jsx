/**
 * TimeSeriesCharts - Analytics charts for Connections
 * 
 * Shows:
 * - Followers Growth Chart
 * - Engagement Timeline
 * - Score Evolution
 */
import { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';
import { TrendingUp, TrendingDown, Activity, Users, Target, Zap } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// Grade colors
const GRADE_COLORS = {
  S: '#8b5cf6',
  A: '#22c55e',
  B: '#3b82f6',
  C: '#f59e0b',
  D: '#ef4444',
};

// Grade bands for reference lines
const GRADE_BANDS = [
  { value: 850, grade: 'S', color: '#8b5cf6' },
  { value: 700, grade: 'A', color: '#22c55e' },
  { value: 550, grade: 'B', color: '#3b82f6' },
  { value: 400, grade: 'C', color: '#f59e0b' },
];

// Format date for display
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Format number with K/M suffix
const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num?.toFixed(0) || '0';
};

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label, type }) => {
  if (!active || !payload || !payload.length) return null;
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <div className="font-medium text-gray-900 mb-2">{formatDate(label)}</div>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-medium text-gray-900">
            {type === 'percent' 
              ? (entry.value * 100).toFixed(2) + '%'
              : formatNumber(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

// Signal marker component
const SignalMarker = ({ cx, cy, badge }) => {
  if (!badge || badge === 'none') return null;
  
  const color = badge === 'breakout' ? '#ef4444' : '#f59e0b';
  
  return (
    <g>
      <circle cx={cx} cy={cy - 15} r={8} fill={color} />
      <text 
        x={cx} 
        y={cy - 11} 
        textAnchor="middle" 
        fill="white" 
        fontSize={10}
        fontWeight="bold"
      >
        {badge === 'breakout' ? '!' : '↑'}
      </text>
    </g>
  );
};

// Summary card component
const SummaryCard = ({ icon: Icon, label, value, subValue, trend, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg ${colors[color]} flex items-center justify-center`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {trend !== undefined && (
          <span className={`text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
          </span>
        )}
      </div>
      {subValue && <div className="text-sm text-gray-500 mt-1">{subValue}</div>}
    </div>
  );
};

export default function TimeSeriesCharts({ accountId, window = '30d' }) {
  const [data, setData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeChart, setActiveChart] = useState('followers');

  useEffect(() => {
    const fetchData = async () => {
      if (!accountId) return;
      
      setLoading(true);
      try {
        // Fetch time series data
        const [tsRes, summaryRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/connections/timeseries/${accountId}?window=${window}`),
          fetch(`${BACKEND_URL}/api/connections/timeseries/${accountId}/summary?window=${window}`),
        ]);
        
        const tsData = await tsRes.json();
        const summaryData = await summaryRes.json();
        
        if (tsData.ok) {
          // Process data for charts
          const processedData = tsData.data.followers.map((f, i) => ({
            ts: f.ts,
            followers: f.followers,
            delta: f.delta_1d,
            likes: tsData.data.engagement[i]?.likes || 0,
            reposts: tsData.data.engagement[i]?.reposts || 0,
            replies: tsData.data.engagement[i]?.replies || 0,
            views: tsData.data.engagement[i]?.views || 0,
            engagement_rate: tsData.data.engagement[i]?.engagement_rate || 0,
            twitter_score: tsData.data.scores[i]?.twitter_score || 0,
            grade: tsData.data.scores[i]?.grade || 'D',
            early_signal: tsData.data.scores[i]?.early_signal?.badge || 'none',
          }));
          
          setData(processedData);
        }
        
        if (summaryData.ok) {
          setSummary(summaryData.data);
        }
      } catch (err) {
        console.error('Error fetching time series:', err);
        setError(err.message);
      }
      setLoading(false);
    };
    
    fetchData();
  }, [accountId, window]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center text-gray-500 py-8">
          <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No time series data available</p>
          <p className="text-sm mt-1">Data will appear once history is generated</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="timeseries-charts">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-4 gap-4">
          <SummaryCard
            icon={Users}
            label="Followers"
            value={formatNumber(summary.followers.current)}
            trend={summary.followers.growth_percent}
            color="blue"
          />
          <SummaryCard
            icon={Activity}
            label="Avg. Engagement"
            value={formatNumber(summary.engagement.avg_likes)}
            subValue={`${(summary.engagement.avg_engagement_rate * 100).toFixed(2)}% ER`}
            color="green"
          />
          <SummaryCard
            icon={Target}
            label="Twitter Score"
            value={summary.scores.current}
            subValue={`Grade ${summary.scores.grade_current}`}
            trend={((summary.scores.current - summary.scores.start) / summary.scores.start) * 100}
            color="purple"
          />
          <SummaryCard
            icon={Zap}
            label="Early Signals"
            value={summary.scores.early_signals_count}
            subValue={`${summary.scores.breakouts_count} breakouts`}
            color="amber"
          />
        </div>
      )}

      {/* Chart Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200 px-4">
          <div className="flex gap-6">
            {[
              { id: 'followers', label: 'Followers Growth', icon: Users },
              { id: 'engagement', label: 'Engagement Timeline', icon: Activity },
              { id: 'scores', label: 'Score Evolution', icon: Target },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveChart(tab.id)}
                className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${
                  activeChart === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
                data-testid={`chart-tab-${tab.id}`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Followers Growth Chart */}
          {activeChart === 'followers' && (
            <div data-testid="followers-chart">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Followers Growth</h3>
                {summary && (
                  <div className={`flex items-center gap-1 text-sm ${
                    summary.followers.growth_percent >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {summary.followers.growth_percent >= 0 
                      ? <TrendingUp className="w-4 h-4" />
                      : <TrendingDown className="w-4 h-4" />}
                    {summary.followers.growth_percent >= 0 ? '+' : ''}
                    {summary.followers.growth_percent.toFixed(1)}% over {window}
                  </div>
                )}
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="followersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="ts" 
                    tickFormatter={formatDate}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tickFormatter={formatNumber}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="followers" 
                    stroke="#3b82f6" 
                    fill="url(#followersGradient)"
                    strokeWidth={2}
                    name="Followers"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Engagement Timeline */}
          {activeChart === 'engagement' && (
            <div data-testid="engagement-chart">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Engagement Timeline</h3>
                {summary && (
                  <div className="text-sm text-gray-500">
                    Avg. ER: {(summary.engagement.avg_engagement_rate * 100).toFixed(2)}%
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                      summary.engagement.volatility === 'low' 
                        ? 'bg-green-100 text-green-700' 
                        : summary.engagement.volatility === 'high'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {summary.engagement.volatility} volatility
                    </span>
                  </div>
                )}
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="likesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="repostsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="repliesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="ts" 
                    tickFormatter={formatDate}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <YAxis 
                    tickFormatter={formatNumber}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="likes" 
                    stackId="1"
                    stroke="#ef4444" 
                    fill="url(#likesGradient)"
                    name="Likes"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="reposts" 
                    stackId="1"
                    stroke="#22c55e" 
                    fill="url(#repostsGradient)"
                    name="Reposts"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="replies" 
                    stackId="1"
                    stroke="#3b82f6" 
                    fill="url(#repliesGradient)"
                    name="Replies"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Score Evolution */}
          {activeChart === 'scores' && (
            <div data-testid="score-chart">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Score Evolution</h3>
                {summary && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                      Velocity: 
                      <span className={`ml-1 font-medium ${
                        summary.scores.velocity > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {summary.scores.velocity > 0 ? '+' : ''}{summary.scores.velocity.toFixed(2)}
                      </span>
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      summary.scores.trend_direction === 'up' 
                        ? 'bg-green-100 text-green-700' 
                        : summary.scores.trend_direction === 'down'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {summary.scores.trend_direction}
                    </span>
                  </div>
                )}
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="ts" 
                    tickFormatter={formatDate}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <YAxis 
                    domain={[0, 1000]}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.[0]) return null;
                      const point = payload[0].payload;
                      return (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
                          <div className="font-medium text-gray-900 mb-2">{formatDate(label)}</div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-gray-600">Score:</span>
                            <span className="font-bold text-gray-900">{point.twitter_score}</span>
                            <span 
                              className="px-1.5 py-0.5 rounded text-xs font-medium text-white"
                              style={{ backgroundColor: GRADE_COLORS[point.grade] }}
                            >
                              {point.grade}
                            </span>
                          </div>
                          {point.early_signal !== 'none' && (
                            <div className={`text-xs mt-1 ${
                              point.early_signal === 'breakout' ? 'text-red-600' : 'text-amber-600'
                            }`}>
                              ⚡ {point.early_signal === 'breakout' ? 'Breakout Signal!' : 'Rising Signal'}
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
                  
                  {/* Grade band reference lines */}
                  {GRADE_BANDS.map(band => (
                    <ReferenceLine 
                      key={band.grade}
                      y={band.value} 
                      stroke={band.color} 
                      strokeDasharray="3 3"
                      strokeOpacity={0.5}
                      label={{ 
                        value: band.grade, 
                        position: 'right',
                        fill: band.color,
                        fontSize: 12
                      }}
                    />
                  ))}
                  
                  <Line 
                    type="monotone" 
                    dataKey="twitter_score" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      return (
                        <g key={`dot-${props.index}`}>
                          <circle cx={cx} cy={cy} r={4} fill="#8b5cf6" />
                          <SignalMarker cx={cx} cy={cy} badge={payload?.early_signal} />
                        </g>
                      );
                    }}
                    activeDot={{ r: 6, fill: '#8b5cf6' }}
                    name="Twitter Score"
                  />
                </LineChart>
              </ResponsiveContainer>
              
              {/* Grade Legend */}
              <div className="flex items-center justify-center gap-4 mt-4 text-xs">
                {GRADE_BANDS.map(band => (
                  <div key={band.grade} className="flex items-center gap-1">
                    <div 
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: band.color }}
                    />
                    <span className="text-gray-600">
                      Grade {band.grade} ({band.value}+)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
