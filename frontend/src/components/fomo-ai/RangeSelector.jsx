/**
 * Range Selector — Chart timeframe tabs
 */

const RANGES = [
  { id: '24h', label: '24H' },
  { id: '7d', label: '7D' },
  { id: '30d', label: '30D' },
  { id: '90d', label: '90D' },
  { id: '1y', label: '1Y' },
];

export function RangeSelector({ activeRange, onRangeChange }) {
  return (
    <div className="flex rounded-lg bg-gray-100 p-1" data-testid="range-selector">
      {RANGES.map(range => (
        <button
          key={range.id}
          onClick={() => onRangeChange(range.id)}
          className={`
            px-4 py-1.5 rounded-md text-sm font-medium transition-all
            ${activeRange === range.id 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
            }
          `}
          data-testid={`range-${range.id}`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}

export default RangeSelector;
