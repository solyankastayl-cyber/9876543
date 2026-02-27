// Admin System Parsing - Main Layout
import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Server, Users, Key, Activity, PlayCircle } from 'lucide-react';
import AdminLayout from '../../../components/admin/AdminLayout';

const navItems = [
  { path: '/admin/system-parsing', label: 'Health', icon: Activity, exact: true },
  { path: '/admin/system-parsing/accounts', label: 'Accounts', icon: Users },
  { path: '/admin/system-parsing/sessions', label: 'Sessions', icon: Key },
  { path: '/admin/system-parsing/tasks', label: 'Tasks', icon: PlayCircle },
];

export default function SystemParsingLayout() {
  const location = useLocation();

  return (
    <AdminLayout>
      <div data-testid="system-parsing-layout">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-3">
              <Server className="w-6 h-6 text-emerald-600" />
              <h1 className="text-xl font-semibold text-gray-900">System Parsing Console</h1>
              <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded">ADMIN</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Manage system Twitter accounts, sessions, and parsing tasks
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <nav className="flex gap-1">
              {navItems.map((item) => {
                const isActive = item.exact 
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path) && item.path !== '/admin/system-parsing';
                
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      isActive
                        ? 'border-emerald-600 text-emerald-700'
                        : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                    }`}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Outlet />
        </div>
      </div>
    </AdminLayout>
  );
}
