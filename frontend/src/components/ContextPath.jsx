/**
 * ContextPath - Contextual breadcrumbs (NOT global navigation)
 * 
 * Philosophy:
 * - Maximum 2 levels: Back + Current
 * - Helps answer: "Where am I?"
 * - Only "back" is clickable
 * - Current item is bold, not clickable
 * 
 * Usage:
 * <ContextPath>
 *   <ContextPath.Item href="/market">Market</ContextPath.Item>
 *   <ContextPath.Item current>USDT</ContextPath.Item>
 * </ContextPath>
 */
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function ContextPath({ children, className = '' }) {
  return (
    <nav 
      className={cn('flex items-center gap-2 text-sm', className)}
      aria-label="Breadcrumb"
    >
      {children}
    </nav>
  );
}

function ContextPathItem({ 
  children, 
  href, 
  current = false,
  className = '' 
}) {
  // Current item - bold, not clickable
  if (current) {
    return (
      <span 
        className={cn(
          'font-semibold text-gray-900',
          className
        )}
        aria-current="page"
      >
        {children}
      </span>
    );
  }
  
  // Back link - clickable
  return (
    <>
      <Link
        to={href}
        className={cn(
          'text-gray-500 hover:text-purple-600 transition-colors',
          className
        )}
      >
        {children}
      </Link>
      <ChevronRight className="w-4 h-4 text-gray-700" />
    </>
  );
}

ContextPath.Item = ContextPathItem;
