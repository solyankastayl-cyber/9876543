/**
 * UnifiedCard - Pure layout component (NO business logic)
 * 
 * Philosophy:
 * - Card is ONLY responsible for layout
 * - Card does NOT interpret data
 * - All styling comes from parent components
 * - Card doesn't know: alert, token, wallet, confidence, states
 * 
 * Usage:
 * <UnifiedCard
 *   header={{ title, subtitle, badge }}
 *   insight={<MyInsightComponent />}
 *   meta={<MyMetaComponent />}
 *   actions={[...]}
 * />
 */
import { cn } from '../lib/utils';

export default function UnifiedCard({
  // Header section
  header = {},
  
  // Primary insight (rendered as-is)
  insight = null,
  
  // Meta information (rendered as-is)
  meta = null,
  
  // Action buttons (rendered as-is)
  actions = [],
  
  // Icon (left side)
  icon = null,
  
  // Custom className for styling from parent
  className = '',
  
  // Click handler for entire card
  onClick = null,
  
  // Test ID
  testId = null,
}) {
  const {
    title,
    subtitle,
    badge,
    link,
  } = header;
  
  return (
    <div
      data-testid={testId}
      className={cn(
        'bg-white border border-gray-200 rounded-xl p-4 transition-all',
        onClick && 'cursor-pointer hover:shadow-md',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Icon + Content */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Icon */}
          {icon && (
            <div className="flex-shrink-0">
              {icon}
            </div>
          )}
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {link ? (
                <a
                  href={link.href}
                  onClick={(e) => {
                    e.stopPropagation();
                    link.onClick?.();
                  }}
                  className="text-sm font-semibold text-gray-900 hover:text-purple-600 transition-colors truncate"
                >
                  {title}
                </a>
              ) : (
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {title}
                </h3>
              )}
              
              {badge && (
                <span className="flex-shrink-0">
                  {badge}
                </span>
              )}
            </div>
            
            {/* Subtitle */}
            {subtitle && (
              <div className="mb-2">
                {subtitle}
              </div>
            )}
            
            {/* Primary Insight - rendered as-is */}
            {insight && (
              <div className="mb-2">
                {insight}
              </div>
            )}
            
            {/* Meta Information - rendered as-is */}
            {meta && (
              <div className="mt-2">
                {meta}
              </div>
            )}
          </div>
        </div>
        
        {/* Right: Actions */}
        {actions && actions.length > 0 && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {actions.map((action, index) => (
              <div key={index} onClick={(e) => e.stopPropagation()}>
                {action}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Helper: StatusBadge component
 * Parent decides what status means and what colors to use
 */
export function StatusBadge({ children, className = '' }) {
  return (
    <span className={cn(
      'px-1.5 py-0.5 text-xs font-medium rounded',
      className
    )}>
      {children}
    </span>
  );
}

/**
 * Helper: CardIcon wrapper
 * Parent decides type-specific colors
 */
export function CardIcon({ icon: Icon, className = '' }) {
  return (
    <div className={cn('p-2.5 rounded-xl', className)}>
      <Icon className="w-5 h-5" />
    </div>
  );
}
