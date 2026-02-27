/**
 * WindowSelector (P0 - Common Platform Layer)
 * 
 * Единый селектор временных окон на весь проект
 * Options: 1h, 6h, 24h, 7d
 */
import { Clock } from 'lucide-react';

const DEFAULT_OPTIONS = [
  { value: '1h', label: '1H' },
  { value: '6h', label: '6H' },
  { value: '24h', label: '24H' },
  { value: '7d', label: '7D' },
];

export default function WindowSelector({ 
  value = '24h', 
  onChange,
  options = DEFAULT_OPTIONS,
  showIcon = true,
  size = 'default', // 'small' | 'default'
  className = '',
}) {
  const sizeClasses = size === 'small' 
    ? 'text-xs px-1.5 py-0.5' 
    : 'text-sm px-2 py-1';
  
  return (
    <div className={`inline-flex items-center gap-1 ${className}`} data-testid="window-selector">
      {showIcon && (
        <Clock className={`text-gray-400 ${size === 'small' ? 'w-3 h-3' : 'w-4 h-4'}`} />
      )}
      
      <div className="inline-flex rounded-lg bg-gray-100 p-0.5">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange?.(option.value)}
            className={`
              ${sizeClasses}
              rounded-md font-medium transition-all
              ${value === option.value 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * WindowSelector as dropdown (alternative)
 */
export function WindowDropdown({ 
  value = '24h', 
  onChange,
  options = DEFAULT_OPTIONS,
  className = '',
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className={`text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white ${className}`}
      data-testid="window-dropdown"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
