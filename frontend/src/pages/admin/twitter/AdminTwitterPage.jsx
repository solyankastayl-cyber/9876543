/**
 * A.3.1 - Admin Twitter Users Page
 * 
 * Overview и управление пользователями Twitter Module
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { TwitterAdminLayout } from '../../../components/admin/TwitterAdminLayout';
import { 
  Search, 
  Filter,
  Users,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function AdminTwitterPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [healthFilter, setHealthFilter] = useState('all');
  const [stats, setStats] = useState({
    totalUsers: 0,
    healthyUsers: 0,
    warningUsers: 0,
    degradedUsers: 0,
  });
  
  useEffect(() => {
    checkAdminAccess();
    loadUsers();
  }, []);
  
  const checkAdminAccess = () => {
    const userId = 'dev-user'; // TODO: Get from auth
    if (userId !== 'dev-user' && userId !== 'admin') {
      console.error('Access denied');
      window.location.href = '/dashboard';
    }
  };
  
  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/api/v4/admin/twitter/users`);
      
      if (res.data.ok) {
        // API returns { data: { users: [], total, page, pages } }
        const responseData = res.data.data || {};
        const usersData = Array.isArray(responseData) ? responseData : (responseData.users || []);
        setUsers(usersData);
        
        // Calculate stats
        const calculatedStats = {
          totalUsers: usersData.length,
          healthyUsers: usersData.filter(u => u.health === 'HEALTHY').length,
          warningUsers: usersData.filter(u => u.health === 'WARNING').length,
          degradedUsers: usersData.filter(u => u.health === 'DEGRADED').length,
        };
        setStats(calculatedStats);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      setUsers([]); // Ensure users is always an array
    } finally {
      setLoading(false);
    }
  };
  
  const filteredUsers = (users || []).filter(user => {
    const matchesSearch = user.userId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesHealth = healthFilter === 'all' || user.health === healthFilter;
    return matchesSearch && matchesHealth;
  });
  
  const getHealthBadge = (health) => {
    const badges = {
      HEALTHY: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      WARNING: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      DEGRADED: { color: 'bg-red-100 text-red-800', icon: XCircle },
    };
    
    const badge = badges[health] || badges.WARNING;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {health}
      </span>
    );
  };
  
  if (loading) {
    return (
      <TwitterAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading users...</p>
          </div>
        </div>
      </TwitterAdminLayout>
    );
  }
  
  return (
    <TwitterAdminLayout>
      <div className="p-6 space-y-6">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-indigo-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Healthy</p>
                <p className="text-2xl font-bold text-green-600">{stats.healthyUsers}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Warning</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.warningUsers}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Degraded</p>
                <p className="text-2xl font-bold text-red-600">{stats.degradedUsers}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by user ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  data-testid="search-users-input"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={healthFilter}
                onChange={(e) => setHealthFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                data-testid="health-filter-select"
              >
                <option value="all">All Health</option>
                <option value="HEALTHY">Healthy</option>
                <option value="WARNING">Warning</option>
                <option value="DEGRADED">Degraded</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Health
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Accounts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sessions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parse Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.userId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.userId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getHealthBadge(user.health)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.accounts}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          <span className="text-green-600">{user.sessions.ok}</span> /{' '}
                          <span className="text-yellow-600">{user.sessions.stale}</span> /{' '}
                          <span className="text-red-600">{user.sessions.invalid}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.parseCount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          to={`/admin/twitter/users/${user.userId}`}
                          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-900"
                          data-testid={`view-user-${user.userId}`}
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
    </TwitterAdminLayout>
  );
}
