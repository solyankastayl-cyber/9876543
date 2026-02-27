/**
 * A.3.4 - Admin System Health Dashboard
 * 
 * System-wide health monitoring:
 * - Overview cards
 * - Problem sessions table
 * - Users health table
 * - Parser status
 * - Admin events feed
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TwitterAdminLayout } from '../../../components/admin/TwitterAdminLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Input } from '../../../components/ui/input';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function AdminSystemPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [usersHealth, setUsersHealth] = useState([]);
  const [parserStatus, setParserStatus] = useState(null);
  const [adminEvents, setAdminEvents] = useState([]);
  
  const [activeTab, setActiveTab] = useState('sessions'); // sessions | users | parser | events
  
  // Filter state for Admin Events
  const [eventFilters, setEventFilters] = useState({
    category: 'ALL',
    type: '',
    userId: '',
  });
  const [eventsLoading, setEventsLoading] = useState(false);
  
  // Load all data
  useEffect(() => {
    loadAllData();
  }, []);
  
  async function loadAllData() {
    setLoading(true);
    try {
      await Promise.all([
        fetchOverview(),
        fetchSessions(),
        fetchUsersHealth(),
        fetchParserStatus(),
        fetchAdminEvents(),
      ]);
    } catch (err) {
      console.error('[AdminSystem] Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }
  
  async function fetchOverview() {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/v4/admin/twitter/system/overview`);
      if (res.data.ok) {
        setOverview(res.data.data);
      }
    } catch (err) {
      console.error('[AdminSystem] fetchOverview error:', err);
    }
  }
  
  async function fetchSessions() {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/v4/admin/twitter/system/sessions?status=STALE&limit=50&sort=risk`);
      if (res.data.ok) {
        setSessions(res.data.data);
      }
    } catch (err) {
      console.error('[AdminSystem] fetchSessions error:', err);
    }
  }
  
  async function fetchUsersHealth() {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/v4/admin/twitter/system/users/health?limit=50&sort=health`);
      if (res.data.ok) {
        setUsersHealth(res.data.data);
      }
    } catch (err) {
      console.error('[AdminSystem] fetchUsersHealth error:', err);
    }
  }
  
  async function fetchParserStatus() {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/v4/admin/twitter/system/parsers`);
      if (res.data.ok) {
        const data = res.data.data['twitter-parser-v2'];
        setParserStatus(data);
      }
    } catch (err) {
      console.error('[AdminSystem] fetchParserStatus error:', err);
    }
  }
  
  async function fetchAdminEvents(filters = eventFilters) {
    try {
      setEventsLoading(true);
      
      // Build query params from filters
      const params = new URLSearchParams({ limit: '50' });
      
      if (filters.category && filters.category !== 'ALL') {
        params.append('category', filters.category);
      }
      if (filters.type && filters.type.trim()) {
        params.append('type', filters.type.trim());
      }
      if (filters.userId && filters.userId.trim()) {
        params.append('userId', filters.userId.trim());
      }
      
      const res = await axios.get(`${BACKEND_URL}/api/v4/admin/twitter/system/admin-events?${params.toString()}`);
      if (res.data.ok) {
        setAdminEvents(res.data.data);
      }
    } catch (err) {
      console.error('[AdminSystem] fetchAdminEvents error:', err);
    } finally {
      setEventsLoading(false);
    }
  }
  
  // Apply filters handler
  function applyEventFilters() {
    fetchAdminEvents(eventFilters);
  }
  
  // Reset filters handler
  function resetEventFilters() {
    const defaultFilters = { category: 'ALL', type: '', userId: '' };
    setEventFilters(defaultFilters);
    fetchAdminEvents(defaultFilters);
  }
  
  if (loading) {
    return (
      <TwitterAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading system health...</p>
          </div>
        </div>
      </TwitterAdminLayout>
    );
  }
  
  return (
    <TwitterAdminLayout>
      <div className="p-6 space-y-6">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">System Health Dashboard</h1>
          <p className="text-gray-600">Platform-wide monitoring and control</p>
        </div>
        
        {/* Overview Cards */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            
            {/* Users Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
                <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-gray-900">{overview.users.total}</p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="text-green-600 font-medium">{overview.users.active}</span> active,{' '}
                <span className="text-red-600 font-medium">{overview.users.disabled}</span> disabled
              </p>
            </div>
            
            {/* Sessions Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Active Sessions</h3>
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-gray-900">{overview.sessions.total}</p>
              <div className="text-sm text-gray-600 mt-1 flex gap-2">
                <span className="text-green-600 font-medium">{overview.sessions.ok} OK</span>
                <span className="text-yellow-600 font-medium">{overview.sessions.stale} STALE</span>
                <span className="text-red-600 font-medium">{overview.sessions.invalid} INVALID</span>
              </div>
            </div>
            
            {/* Tasks Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Tasks (1h)</h3>
                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-gray-900">{overview.tasks.last1h}</p>
              <p className="text-sm text-gray-600 mt-1">
                Abort rate: <span className={`font-medium ${overview.tasks.abortRatePct > 30 ? 'text-red-600' : 'text-gray-600'}`}>
                  {overview.tasks.abortRatePct}%
                </span>
              </p>
            </div>
            
            {/* Parser Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Parser Status</h3>
                {parserStatus?.status === 'UP' ? (
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                ) : (
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                )}
              </div>
              <p className={`text-3xl font-bold ${parserStatus?.status === 'UP' ? 'text-green-600' : 'text-red-600'}`}>
                {parserStatus?.status || 'UNKNOWN'}
              </p>
              {parserStatus?.uptimeSec && (
                <p className="text-sm text-gray-600 mt-1">
                  Uptime: {Math.floor(parserStatus.uptimeSec / 3600)}h
                </p>
              )}
              {parserStatus?.lastError && (
                <p className="text-sm text-red-600 mt-1 truncate" title={parserStatus.lastError}>
                  {parserStatus.lastError}
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('sessions')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'sessions'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                data-testid="tab-sessions"
              >
                Problem Sessions ({sessions.length})
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'users'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                data-testid="tab-users"
              >
                Users Health ({usersHealth.length})
              </button>
              <button
                onClick={() => setActiveTab('parser')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'parser'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                data-testid="tab-parser"
              >
                Parser Status
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'events'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                data-testid="tab-events"
              >
                Admin Events ({adminEvents.length})
              </button>
            </nav>
          </div>
          
          <div className="p-6">
            {/* Sessions Tab */}
            {activeTab === 'sessions' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Problem Sessions</h3>
                {sessions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No problem sessions found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Twitter</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tasks 24h</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sessions.map((session, idx) => (
                          <tr key={idx}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.userId}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.twitter}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded ${
                                session.status === 'OK' ? 'bg-green-100 text-green-800' :
                                session.status === 'STALE' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {session.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.riskScore}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.tasks24h}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                                onClick={() => window.location.href = `/admin/twitter/users/${session.userId}`}
                                data-testid={`view-user-${idx}`}
                              >
                                View User
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            
            {/* Users Health Tab */}
            {activeTab === 'users' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Users Health</h3>
                {usersHealth.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No users found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Health</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Accounts</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sessions</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abort %</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {usersHealth.map((user, idx) => (
                          <tr key={idx}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{user.userId}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded ${
                                user.health === 'HEALTHY' ? 'bg-green-100 text-green-800' :
                                user.health === 'WARNING' ? 'bg-yellow-100 text-yellow-800' :
                                user.health === 'DEGRADED' ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {user.health}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.accounts}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              <span className="text-green-600">{user.sessions.ok}</span> /{' '}
                              <span className="text-yellow-600">{user.sessions.stale}</span> /{' '}
                              <span className="text-red-600">{user.sessions.invalid}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.abortRatePct}%</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                className="text-indigo-600 hover:text-indigo-900"
                                onClick={() => window.location.href = `/admin/twitter/users/${user.userId}`}
                                data-testid={`view-user-detail-${idx}`}
                              >
                                View Detail
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            
            {/* Parser Status Tab */}
            {activeTab === 'parser' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Parser Status</h3>
                {parserStatus && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Status</p>
                        <p className={`text-2xl font-bold ${
                          parserStatus.status === 'UP' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {parserStatus.status}
                        </p>
                      </div>
                      {parserStatus.uptimeSec && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Uptime</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {Math.floor(parserStatus.uptimeSec / 3600)}h {Math.floor((parserStatus.uptimeSec % 3600) / 60)}m
                          </p>
                        </div>
                      )}
                      {parserStatus.tasksRunning !== undefined && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Tasks Running</p>
                          <p className="text-2xl font-bold text-gray-900">{parserStatus.tasksRunning}</p>
                        </div>
                      )}
                      {parserStatus.avgLatencyMs && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Avg Latency</p>
                          <p className="text-2xl font-bold text-gray-900">{parserStatus.avgLatencyMs}ms</p>
                        </div>
                      )}
                    </div>
                    {parserStatus.lastError && (
                      <div className="mt-4 p-4 bg-red-50 rounded border border-red-200">
                        <p className="text-sm font-medium text-red-800 mb-1">Last Error</p>
                        <p className="text-sm text-red-600">{parserStatus.lastError}</p>
                      </div>
                    )}
                    <button
                      onClick={fetchParserStatus}
                      className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                      data-testid="refresh-parser-btn"
                    >
                      Refresh Status
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Admin Events Tab */}
            {activeTab === 'events' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Events Feed</h3>
                
                {/* Filter Controls */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                  <div className="flex flex-wrap items-end gap-4">
                    {/* Category Filter */}
                    <div className="flex flex-col gap-1.5 min-w-[160px]">
                      <label className="text-sm font-medium text-gray-700">Category</label>
                      <Select
                        value={eventFilters.category}
                        onValueChange={(value) => setEventFilters(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger data-testid="filter-category-select" className="bg-white">
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Categories</SelectItem>
                          <SelectItem value="SYSTEM">System</SelectItem>
                          <SelectItem value="POLICY">Policy</SelectItem>
                          <SelectItem value="USER">User</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Event Type Filter */}
                    <div className="flex flex-col gap-1.5 min-w-[180px]">
                      <label className="text-sm font-medium text-gray-700">Event Type</label>
                      <Input
                        type="text"
                        placeholder="e.g., PARSER_DOWN"
                        value={eventFilters.type}
                        onChange={(e) => setEventFilters(prev => ({ ...prev, type: e.target.value }))}
                        className="bg-white"
                        data-testid="filter-type-input"
                      />
                    </div>
                    
                    {/* User ID Filter */}
                    <div className="flex flex-col gap-1.5 min-w-[200px]">
                      <label className="text-sm font-medium text-gray-700">User ID</label>
                      <Input
                        type="text"
                        placeholder="Filter by user ID..."
                        value={eventFilters.userId}
                        onChange={(e) => setEventFilters(prev => ({ ...prev, userId: e.target.value }))}
                        className="bg-white"
                        data-testid="filter-userid-input"
                      />
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={applyEventFilters}
                        disabled={eventsLoading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
                        data-testid="apply-filters-btn"
                      >
                        {eventsLoading ? 'Loading...' : 'Apply Filters'}
                      </button>
                      <button
                        onClick={resetEventFilters}
                        disabled={eventsLoading}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 text-sm font-medium"
                        data-testid="reset-filters-btn"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                  
                  {/* Active Filters Summary */}
                  {(eventFilters.category !== 'ALL' || eventFilters.type || eventFilters.userId) && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <span className="text-xs text-gray-500">Active filters: </span>
                      {eventFilters.category !== 'ALL' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 mr-2">
                          Category: {eventFilters.category}
                        </span>
                      )}
                      {eventFilters.type && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                          Type: {eventFilters.type}
                        </span>
                      )}
                      {eventFilters.userId && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mr-2">
                          User: {eventFilters.userId}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Events List */}
                {eventsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <span className="ml-3 text-gray-600">Loading events...</span>
                  </div>
                ) : adminEvents.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No events found matching your filters</p>
                ) : (
                  <div className="space-y-3" data-testid="events-list">
                    <p className="text-sm text-gray-500 mb-2">{adminEvents.length} events found</p>
                    {adminEvents.map((event) => (
                      <div key={event.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200" data-testid={`event-item-${event.id}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-1 text-xs font-medium rounded ${
                                event.type.includes('POLICY') ? 'bg-red-100 text-red-800' :
                                event.type.includes('SESSION') || event.type.includes('ACCOUNT') ? 'bg-green-100 text-green-800' :
                                event.type.includes('PARSER') ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {event.type}
                              </span>
                              {event.category && (
                                <span className={`px-2 py-1 text-xs font-medium rounded ${
                                  event.category === 'SYSTEM' ? 'bg-purple-100 text-purple-800' :
                                  event.category === 'POLICY' ? 'bg-orange-100 text-orange-800' :
                                  'bg-cyan-100 text-cyan-800'
                                }`}>
                                  {event.category}
                                </span>
                              )}
                              {event.userId && (
                                <span className="text-sm font-mono text-gray-600">{event.userId}</span>
                              )}
                            </div>
                            {event.details && Object.keys(event.details).length > 0 && (
                              <div className="text-sm text-gray-600 mt-2">
                                {event.details.twitter && <p>Twitter: {event.details.twitter}</p>}
                                {event.details.reason && <p>Reason: {event.details.reason}</p>}
                                {event.details.action && <p>Action: {event.details.action}</p>}
                                {event.details.message && <p>Message: {event.details.message}</p>}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 ml-4">
                            {new Date(event.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Refresh Button */}
        <div className="flex justify-center">
          <button
            onClick={loadAllData}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            data-testid="refresh-all-btn"
          >
            Refresh All Data
          </button>
        </div>
      </div>
    </TwitterAdminLayout>
  );
}
