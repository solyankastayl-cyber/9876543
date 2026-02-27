/**
 * Backer Influence Summary Component
 * 
 * Shows key metrics:
 * - Anchor Projects
 * - Early Projects  
 * - Co-Investors
 * - Key Accounts
 * - Network Reach
 */
import { Building2, Users, Star, Network, TrendingUp } from 'lucide-react';

export default function BackerInfluenceSummary({ summary }) {
  if (!summary) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-400">
        No influence data available
      </div>
    );
  }

  const stats = [
    {
      label: 'Anchor Projects',
      value: summary.anchorProjectCount,
      icon: Star,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
    },
    {
      label: 'Early Projects',
      value: summary.earlyProjectCount,
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Co-Investors',
      value: summary.coInvestorCount,
      icon: Building2,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Key Accounts',
      value: summary.keyAccountCount,
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Network Reach',
      value: summary.networkReach,
      icon: Network,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-4">
        Influence Summary
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div 
              key={stat.label}
              className={`${stat.bgColor} rounded-lg p-4 text-center`}
            >
              <Icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
              <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          );
        })}
      </div>
      
      {/* Segments */}
      {summary.segments?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-2">Influences segments:</div>
          <div className="flex flex-wrap gap-2">
            {summary.segments.map(seg => (
              <span 
                key={seg}
                className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
              >
                {seg}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Top Co-Investors */}
      {summary.strongCoInvestors?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-2">Strong Co-Investors:</div>
          <div className="flex flex-wrap gap-2">
            {summary.strongCoInvestors.map(ci => (
              <span 
                key={ci.id}
                className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
              >
                {ci.name}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Anchor Projects */}
      {summary.anchorProjects?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-2">Anchor Projects:</div>
          <div className="flex flex-wrap gap-2">
            {summary.anchorProjects.map(p => (
              <span 
                key={p.id}
                className="px-2.5 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1"
              >
                <Star className="w-3 h-3" />
                {p.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
