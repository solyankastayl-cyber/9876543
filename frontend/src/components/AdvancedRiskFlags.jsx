import { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';

const GlassCard = ({ children, className = "", hover = false }) => (
  <div className={`glass-card ${hover ? 'hover:shadow-[0_6px_24px_rgba(0,0,0,0.1)] transition-all duration-300' : ''} ${className}`}>
    {children}
  </div>
);

export default function AdvancedRiskFlags() {
  const [viewMode, setViewMode] = useState('overview');

  // Overall risk score
  const overallRisk = {
    score: 23,
    level: 'Low',
    color: 'green', // зеленый для низкого риска
  };

  // Risk categories
  const riskCategories = [
    { 
      category: 'Sanctions Risk',
      score: 0,
      level: 'None',
      color: '#10B981', // зеленый
      description: 'No exposure to sanctioned addresses',
      icon: Shield,
      checks: [
        { name: 'OFAC List', status: 'pass' },
        { name: 'EU Sanctions', status: 'pass' },
        { name: 'UN Sanctions', status: 'pass' },
      ]
    },
    { 
      category: 'Mixer Usage',
      score: 5,
      level: 'Very Low',
      color: '#10B981', // зеленый
      description: 'Minimal interaction with mixing services',
      icon: AlertTriangle,
      checks: [
        { name: 'Tornado Cash', status: 'no-interaction' },
        { name: 'Other Mixers', status: 'minimal' },
      ]
    },
    { 
      category: 'Rug Pull History',
      score: 12,
      level: 'Low',
      color: '#6B7280', // серый
      description: '2 tokens with suspicious activity',
      icon: AlertTriangle,
      checks: [
        { name: 'Honeypot Tokens', status: '2 detected' },
        { name: 'Abandoned Projects', status: '0' },
      ]
    },
    { 
      category: 'Risky Approvals',
      score: 35,
      level: 'Medium',
      color: '#6B7280', // серый
      description: '8 unlimited approvals to contracts',
      icon: AlertTriangle,
      checks: [
        { name: 'Unlimited Approvals', status: '8 found' },
        { name: 'Old Contracts', status: '3 found' },
        { name: 'Unverified Contracts', status: '2 found' },
      ]
    },
    { 
      category: 'Smart Contract Risk',
      score: 8,
      level: 'Very Low',
      color: '#10B981', // зеленый
      description: 'Low exposure to risky contracts',
      icon: Shield,
      checks: [
        { name: 'Unaudited Contracts', status: '1 interaction' },
        { name: 'Recent Deployments', status: '0' },
      ]
    },
  ];

  // Recent alerts
  const recentAlerts = [
    { type: 'warning', time: '2h ago', message: 'New unlimited approval to 0x1234...5678' },
    { type: 'info', time: '1d ago', message: 'Interaction with newly deployed contract' },
    { type: 'cleared', time: '3d ago', message: 'Previous rug pull token removed from wallet' },
  ];

  const getScoreColor = (score) => {
    if (score <= 20) return 'text-green-600';
    if (score <= 50) return 'text-gray-700';
    return 'text-gray-900';
  };

  const getAlertIcon = (type) => {
    if (type === 'warning') return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    if (type === 'info') return <Shield className="w-4 h-4 text-gray-600" />;
    return <CheckCircle className="w-4 h-4 text-green-600" />;
  };

  return (
    <GlassCard className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Advanced Risk Flags</h3>
        <div className="time-selector">
          {[
            { value: 'overview', label: 'Overview' },
            { value: 'alerts', label: 'Alerts' },
          ].map(mode => (
            <button
              key={mode.value}
              onClick={() => setViewMode(mode.value)}
              className={`time-selector-btn ${viewMode === mode.value ? 'active' : ''}`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overall Risk Score */}
      <div className="roi-box mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="roi-label mb-1">Overall Risk Score</div>
            <div className="flex items-center gap-3">
              <div className={`text-4xl font-extrabold ${getScoreColor(overallRisk.score)}`}>
                {overallRisk.score}/100
              </div>
              <div>
                <div className={`badge ${overallRisk.score <= 20 ? 'bg-green-100 text-green-700' : overallRisk.score <= 50 ? 'bg-gray-100 text-gray-700' : 'bg-gray-200 text-gray-900'}`}>
                  {overallRisk.level} Risk
                </div>
              </div>
            </div>
          </div>
          <div className="progress-bar-container w-32 h-3">
            <div 
              className="h-full rounded-full"
              style={{ 
                width: `${overallRisk.score}%`,
                background: overallRisk.score <= 20 
                  ? '#10B981' // зеленый
                  : overallRisk.score <= 50
                  ? '#6B7280' // серый
                  : '#374151' // темно-серый
              }}
            />
          </div>
        </div>
      </div>

      {viewMode === 'overview' && (
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-2 gap-3">
            {riskCategories.map((risk, i) => {
              const Icon = risk.icon;
              return (
                <div key={i} className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-gray-600" />
                      <span className="text-xs font-bold text-gray-900">{risk.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${getScoreColor(risk.score)}`}>{risk.score}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{risk.description}</p>
                  <div className="progress-bar-container h-1.5 mb-2">
                    <div 
                      className="h-full rounded-full"
                      style={{ 
                        width: `${risk.score}%`,
                        background: risk.color
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    {risk.checks.map((check, j) => (
                      <div key={j} className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 truncate">{check.name}</span>
                        <span className="font-semibold text-gray-700 ml-2 whitespace-nowrap">
                          {check.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'alerts' && (
        <div className="flex-1 space-y-2 overflow-auto">
          {recentAlerts.map((alert, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl hover:bg-gray-100/50 transition-colors">
              {getAlertIcon(alert.type)}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-900">{alert.type.toUpperCase()}</span>
                  <span className="text-xs text-gray-500">{alert.time}</span>
                </div>
                <p className="text-xs text-gray-600">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
