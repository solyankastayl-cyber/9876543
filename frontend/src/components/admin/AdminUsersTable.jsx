/**
 * A.3.1 - Admin Users Table
 * 
 * Paginated table of all users with:
 * - User ID
 * - Accounts count
 * - Sessions (OK/STALE/INVALID)
 * - Risk score
 * - Last parse
 * - Telegram status
 * - Health badge
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Eye, ChevronLeft, ChevronRight, Search, 
  MessageCircle, AlertTriangle, CheckCircle, XCircle, AlertCircle,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const HEALTH_CONFIG = {
  HEALTHY: { label: 'Healthy', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  WARNING: { label: 'Warning', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
  DEGRADED: { label: 'Degraded', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
  BLOCKED: { label: 'Blocked', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export function AdminUsersTable({ 
  users, 
  total, 
  page, 
  pages,
  loading,
  onPageChange,
  onSearch,
  onFilterStatus,
  currentStatus,
}) {
  const [searchValue, setSearchValue] = useState('');
  
  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchValue);
  };
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    
    return date.toLocaleDateString();
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200" data-testid="admin-users-table">
      {/* Filters */}
      <div className="p-4 border-b border-gray-200 flex items-center gap-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by user ID..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button type="submit" variant="outline" size="sm">Search</Button>
        </form>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          {['ALL', 'HEALTHY', 'WARNING', 'DEGRADED', 'BLOCKED'].map((status) => (
            <button
              key={status}
              onClick={() => onFilterStatus(status === 'ALL' ? null : status)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                currentStatus === status || (status === 'ALL' && !currentStatus)
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {status}
            </button>
          ))}
        </div>
        
        <div className="ml-auto text-sm text-gray-500">
          {total} users total
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">User</th>
              <th className="text-center text-xs font-medium text-gray-500 px-4 py-3">Accounts</th>
              <th className="text-center text-xs font-medium text-gray-500 px-4 py-3">Sessions</th>
              <th className="text-center text-xs font-medium text-gray-500 px-4 py-3">Risk</th>
              <th className="text-center text-xs font-medium text-gray-500 px-4 py-3">Last Parse</th>
              <th className="text-center text-xs font-medium text-gray-500 px-4 py-3">Telegram</th>
              <th className="text-center text-xs font-medium text-gray-500 px-4 py-3">Status</th>
              <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={8} className="px-4 py-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const healthConfig = HEALTH_CONFIG[user.health] || HEALTH_CONFIG.HEALTHY;
                const HealthIcon = healthConfig.icon;
                
                return (
                  <tr key={user.userId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{user.userId}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm text-gray-700">{user.accounts}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700">
                          {user.sessions.ok}
                        </span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-amber-100 text-amber-700">
                          {user.sessions.stale}
                        </span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-700">
                          {user.sessions.invalid}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center">
                        <div 
                          className={cn(
                            'w-12 h-2 rounded-full overflow-hidden bg-gray-200',
                          )}
                        >
                          <div 
                            className={cn(
                              'h-full rounded-full',
                              user.riskAvg < 30 ? 'bg-green-500' :
                              user.riskAvg < 60 ? 'bg-amber-500' : 'bg-red-500'
                            )}
                            style={{ width: `${user.riskAvg}%` }}
                          />
                        </div>
                        <span className="ml-2 text-xs text-gray-500">{user.riskAvg}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm text-gray-500">
                        {formatDate(user.lastParseAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {user.telegramConnected ? (
                        <MessageCircle className="w-4 h-4 text-blue-500 mx-auto" />
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                        healthConfig.color
                      )}>
                        <HealthIcon className="w-3 h-3" />
                        {healthConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/admin/twitter/users/${user.userId}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {pages > 1 && (
        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Page {page} of {pages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pages}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
