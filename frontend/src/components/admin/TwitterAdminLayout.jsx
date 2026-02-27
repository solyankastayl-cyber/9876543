/**
 * TWITTER MODULE ADMIN LAYOUT
 * 
 * Layout ТОЛЬКО для Twitter Module
 * Вложенный в Platform Admin
 * 
 * Sections:
 * - Users (Twitter users management)
 * - Policies (Twitter-specific policies)
 * - System Health (Twitter parser health)
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, Activity, Shield, ChevronLeft, Twitter, Settings, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { 
    path: '/admin/twitter', 
    label: 'Users', 
    icon: Users,
    exact: true,
  },
  { 
    path: '/admin/twitter/policies', 
    label: 'Fair-Use Policies', 
    icon: Settings,
  },
  { 
    path: '/admin/twitter/consent-policies', 
    label: 'Data Policies', 
    icon: Shield,
  },
  { 
    path: '/admin/twitter/system', 
    label: 'System Health', 
    icon: Activity,
  },
  { 
    path: '/admin/twitter/performance', 
    label: 'Performance', 
    icon: BarChart3,
  },
];

export function TwitterAdminLayout({ children }) {
  const location = useLocation();
  
  const isActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };
  
  return (
    <div className="min-h-screen bg-gray-50" data-testid="twitter-admin-layout">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 h-14 flex items-center px-4 sticky top-0 z-10">
        <Link 
          to="/admin/system-overview" 
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm">Back to Platform Admin</span>
        </Link>
        
        <div className="flex items-center gap-2 ml-6">
          <Twitter className="w-5 h-5 text-blue-500" />
          <span className="font-semibold text-gray-900">Twitter Module Admin</span>
        </div>
        
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">MODULE</span>
        </div>
      </header>
      
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 bg-white border-r border-gray-200 min-h-[calc(100vh-3.5rem)] p-4">
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    active 
                      ? 'bg-amber-50 text-amber-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                  data-testid={`admin-nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <Icon className={cn('w-4 h-4', active ? 'text-amber-600' : 'text-gray-400')} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default TwitterAdminLayout;
