import { ChevronRight, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PageHeader({ title, description, breadcrumbs, actions }) {
  return (
    <div className="px-4 py-6">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 mb-3">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />}
              {crumb.path ? (
                <Link 
                  to={crumb.path} 
                  className="text-hint hover:text-gray-900 transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-body text-gray-900">{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-page-title">{title}</h1>
          {description && (
            <p className="text-description mt-1">{description}</p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export function SectionHeader({ title, description, actions, className = '' }) {
  return (
    <div className={`flex items-start justify-between mb-4 ${className}`}>
      <div>
        <h2 className="text-section-title">{title}</h2>
        {description && (
          <p className="text-hint mt-0.5">{description}</p>
        )}
      </div>
      
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

export function CardHeader({ title, actions, className = '' }) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <h3 className="text-card-title">{title}</h3>
      {actions && (
        <div className="flex items-center gap-1.5">
          {actions}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
