import { Search, X } from 'lucide-react';

/**
 * Reusable search input component with proper icon positioning
 * Solves the recurring bug of icon overlapping text
 */
export const SearchInput = ({ 
  value, 
  onChange, 
  placeholder = "Search...",
  className = "",
  inputClassName = "",
  testId = "search-input",
  onClear,
  autoFocus = false,
  size = "default" // "default" | "large"
}) => {
  const sizeClasses = {
    default: "py-3 pl-11 pr-10 text-sm",
    large: "py-4 pl-12 pr-10 text-base"
  };

  const iconSizeClasses = {
    default: "left-4 w-4 h-4",
    large: "left-4 w-5 h-5"
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      onChange({ target: { value: '' } });
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Search 
        className={`absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none ${iconSizeClasses[size]}`} 
      />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        data-testid={testId}
        className={`w-full bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-all ${sizeClasses[size]} ${inputClassName}`}
        style={{ color: '#111827' }}
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
          type="button"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
