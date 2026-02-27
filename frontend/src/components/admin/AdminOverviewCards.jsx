/**
 * A.3.1 - Admin Overview Cards
 * 
 * System totals display:
 * - Total users
 * - Active users
 * - Sessions by status
 * - Aborts last 24h
 */

import { Users, UserCheck, AlertCircle, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminOverviewCards({ overview, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg p-4 border border-gray-200 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }
  
  if (!overview) return null;
  
  const cards = [
    {
      label: 'Total Users',
      value: overview.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Active Users',
      value: overview.activeUsers,
      subtext: `${Math.round((overview.activeUsers / overview.totalUsers) * 100) || 0}%`,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Sessions',
      value: overview.totalSessions.ok + overview.totalSessions.stale + overview.totalSessions.invalid,
      subtext: `${overview.totalSessions.ok} OK / ${overview.totalSessions.stale} Stale / ${overview.totalSessions.invalid} Invalid`,
      icon: CheckCircle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      label: 'Aborts (24h)',
      value: overview.abortsLast24h,
      icon: AlertTriangle,
      color: overview.abortsLast24h > 10 ? 'text-red-600' : 'text-gray-600',
      bgColor: overview.abortsLast24h > 10 ? 'bg-red-50' : 'bg-gray-50',
    },
  ];
  
  return (
    <div className="grid grid-cols-4 gap-4 mb-6" data-testid="admin-overview-cards">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div 
            key={idx}
            className="bg-white rounded-lg p-4 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">{card.label}</span>
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', card.bgColor)}>
                <Icon className={cn('w-4 h-4', card.color)} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{card.value}</div>
            {card.subtext && (
              <div className="text-xs text-gray-500 mt-1">{card.subtext}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
