/**
 * PLATFORM ADMIN LAYOUT
 * 
 * Hierarchical admin navigation with collapsible sections.
 * 
 * PRINCIPLES:
 * - Level 1 (domains) always visible
 * - Level 2 (groups) collapsible
 * - Level 3 (pages) shown when parent expanded
 * - Never more than 8-10 items visible at once
 * - Modules isolated from Platform/ML
 */

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, ChevronLeft, ChevronRight, ChevronDown, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ADMIN_NAV } from '@/config/adminNav.registry';

// Recursive component for rendering nav nodes
function NavNode({ node, level = 0, expandedSections, toggleSection, currentPath }) {
  const hasChildren = node.children && node.children.length > 0;
  const isLeaf = !!node.path;
  const isExpanded = expandedSections[node.id];
  const isActive = node.path === currentPath;
  const isInActivePath = currentPath?.startsWith(node.path?.replace(/\/:.*$/, '') || '___');
  
  // Check if any child is active
  const hasActiveChild = hasChildren && node.children.some(child => {
    if (child.path === currentPath) return true;
    if (child.children) {
      return child.children.some(c => c.path === currentPath);
    }
    return false;
  });

  const Icon = node.icon;

  // Leaf node (actual page link)
  if (isLeaf) {
    return (
      <Link
        to={node.path}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
          'hover:bg-gray-100',
          level === 0 && 'mt-1',
          level === 1 && 'ml-4',
          level === 2 && 'ml-8',
          level === 3 && 'ml-12',
          isActive 
            ? 'bg-indigo-50 text-indigo-700 border-l-2 border-indigo-600' 
            : 'text-gray-600'
        )}
        data-testid={`admin-nav-${node.id}`}
      >
        {Icon && <Icon className={cn('w-4 h-4', isActive ? 'text-indigo-600' : 'text-gray-400')} />}
        <span className="flex-1">{node.label}</span>
        {node.badge && (
          <span className={cn(
            'px-1.5 py-0.5 text-[10px] font-semibold rounded',
            node.badge === 'ACTIVE' && 'bg-green-100 text-green-700',
            node.badge === 'NEW' && 'bg-blue-100 text-blue-700',
            node.badge === 'BETA' && 'bg-amber-100 text-amber-700',
            node.badge === 'SOON' && 'bg-gray-100 text-gray-500',
          )}>
            {node.badge}
          </span>
        )}
      </Link>
    );
  }

  // Disabled node (future modules)
  if (node.disabled) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
          'text-gray-400 cursor-not-allowed',
          level === 0 && 'mt-1',
          level === 1 && 'ml-4',
          level === 2 && 'ml-8',
        )}
      >
        {Icon && <Icon className="w-4 h-4 text-gray-300" />}
        <span className="flex-1">{node.label}</span>
        {node.badge && (
          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-gray-100 text-gray-400">
            {node.badge}
          </span>
        )}
      </div>
    );
  }

  // Section node (has children, collapsible)
  return (
    <div className={cn(level === 0 && 'mb-2')}>
      <button
        onClick={() => toggleSection(node.id)}
        className={cn(
          'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all',
          'hover:bg-gray-100',
          level === 0 && 'text-gray-900 font-semibold',
          level === 1 && 'ml-4 text-gray-700',
          level === 2 && 'ml-8 text-gray-600',
          (isExpanded || hasActiveChild) && level === 0 && 'bg-gray-50',
        )}
        data-testid={`admin-nav-section-${node.id}`}
      >
        {Icon && (
          <Icon className={cn(
            'w-4 h-4',
            level === 0 ? 'text-gray-700' : 'text-gray-400',
            hasActiveChild && 'text-indigo-600'
          )} />
        )}
        <span className="flex-1 text-left">{node.label}</span>
        {node.badge && (
          <span className={cn(
            'px-1.5 py-0.5 text-[10px] font-semibold rounded mr-1',
            node.badge === 'ACTIVE' && 'bg-green-100 text-green-700',
            node.badge === 'NEW' && 'bg-blue-100 text-blue-700',
          )}>
            {node.badge}
          </span>
        )}
        <ChevronRight className={cn(
          'w-4 h-4 text-gray-400 transition-transform',
          isExpanded && 'rotate-90'
        )} />
      </button>
      
      {/* Children */}
      {isExpanded && hasChildren && (
        <div className="mt-1">
          {node.children.map(child => (
            <NavNode
              key={child.id || child.path || child.label}
              node={child}
              level={level + 1}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
              currentPath={currentPath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminLayout({ children }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});

  // Auto-expand sections based on current path
  useEffect(() => {
    const path = location.pathname;
    const newExpanded = { ...expandedSections };
    
    // Find and expand parent sections
    function expandParents(nodes, parentIds = []) {
      for (const node of nodes) {
        const currentIds = [...parentIds, node.id];
        
        if (node.path === path) {
          // Expand all parents
          currentIds.forEach(id => {
            newExpanded[id] = true;
          });
          return true;
        }
        
        if (node.children) {
          const found = expandParents(node.children, currentIds);
          if (found) return true;
        }
      }
      return false;
    }
    
    expandParents(ADMIN_NAV);
    setExpandedSections(newExpanded);
  }, [location.pathname]);

  const toggleSection = (id) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="platform-admin-layout">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 h-14 flex items-center px-4 sticky top-0 z-20">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden mr-2 p-2 hover:bg-gray-100 rounded-lg"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        
        <Link 
          to="/dashboard" 
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm">Back to Dashboard</span>
        </Link>
        
        <div className="flex items-center gap-2 ml-6">
          <Shield className="w-5 h-5 text-indigo-600" />
          <span className="font-semibold text-gray-900">Platform Admin</span>
        </div>
        
        <div className="ml-auto flex items-center gap-4">
          <span className="text-xs text-gray-400 hidden sm:block">
            Hierarchical Navigation • Enterprise UI
          </span>
        </div>
      </header>
      
      <div className="flex">
        {/* Sidebar */}
        <aside 
          className={cn(
            'w-72 bg-white border-r border-gray-200 min-h-[calc(100vh-3.5rem)] transition-all duration-200',
            'fixed lg:static lg:translate-x-0 z-10',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-3.5rem)]">
            {ADMIN_NAV.map(node => (
              <NavNode
                key={node.id}
                node={node}
                level={0}
                expandedSections={expandedSections}
                toggleSection={toggleSection}
                currentPath={location.pathname}
              />
            ))}
          </div>
        </aside>
        
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/20 lg:hidden z-0"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-3.5rem)] lg:ml-0">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
