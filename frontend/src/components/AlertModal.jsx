import { useState } from 'react';
import { X, Bell } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

export default function AlertModal({ isOpen, onClose, defaultEntity = '' }) {
  const [threshold, setThreshold] = useState('$10M');
  const [timeframe, setTimeframe] = useState('24h');
  const [condition, setCondition] = useState('accumulation');
  
  // Use prop directly, with local state only for select interaction
  const [entity, setEntity] = useState('');
  const displayEntity = entity || defaultEntity || 'Alameda Research';

  if (!isOpen) return null;

  const handleClose = () => {
    setEntity(''); // Reset to allow new defaultEntity on next open
    onClose();
  };

  const entities = [
    'Any Smart Money',
    'Alameda Research',
    'DWF Labs',
    'Pantera Capital',
    'a16z Crypto',
    'Galaxy Digital',
    'Jump Trading',
    'Wintermute',
  ];

  const conditions = [
    { value: 'accumulation', label: 'Accumulation Detected' },
    { value: 'distribution', label: 'Distribution Detected' },
    { value: 'new_position', label: 'New Position Opened' },
    { value: 'large_transfer', label: 'Large Transfer (>$50M)' },
  ];

  const timeframes = [
    { value: '1h', label: '1 Hour' },
    { value: '6h', label: '6 Hours' },
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Creating alert:', { entity: displayEntity, threshold, timeframe, condition });
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-white/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal - compact square shape */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
        {/* Header - more compact */}
        <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-gray-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Create Alert</h2>
              <p className="text-xs text-gray-500">Get notified of market movements</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Form - compact layout */}
        <form onSubmit={handleSubmit} className="p-5">
          {/* Top row: Entity + Timeframe side by side */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Entity Select */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Smart Money Entity
              </label>
              <Select value={displayEntity} onValueChange={setEntity}>
                <SelectTrigger className="w-full h-10 px-3 bg-gray-50 border-gray-200 text-sm font-medium text-gray-900 rounded-xl">
                  <SelectValue placeholder="Select entity" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  {entities.map(e => (
                    <SelectItem 
                      key={e} 
                      value={e}
                      className="py-2 px-3 text-sm font-medium text-gray-900 hover:bg-gray-50 cursor-pointer"
                    >
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Timeframe Select */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Timeframe
              </label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-full h-10 px-3 bg-gray-50 border-gray-200 text-sm font-medium text-gray-900 rounded-xl">
                  <SelectValue placeholder="Timeframe" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  {timeframes.map(tf => (
                    <SelectItem 
                      key={tf.value} 
                      value={tf.value}
                      className="py-2 px-3 text-sm font-medium text-gray-900 hover:bg-gray-50 cursor-pointer"
                    >
                      {tf.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Condition Select - 2x2 grid */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Alert Condition
            </label>
            <div className="grid grid-cols-2 gap-2">
              {conditions.map((cond) => (
                <label
                  key={cond.value}
                  className={`flex items-center p-2.5 rounded-xl border cursor-pointer transition-all ${
                    condition === cond.value
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="condition"
                    value={cond.value}
                    checked={condition === cond.value}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-3.5 h-3.5 text-gray-900 focus:ring-gray-900"
                  />
                  <span className="ml-2 text-xs font-medium text-gray-900 leading-tight">{cond.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Threshold */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Minimum Threshold
            </label>
            <input
              type="text"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="e.g., $10M"
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>

          {/* Preview - inline compact */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 mb-4">
            <div className="text-xs text-gray-500 mb-0.5">Alert Preview</div>
            <div className="text-sm font-medium text-gray-900">
              Notify when <span className="font-bold">{displayEntity}</span> shows{' '}
              <span className="font-bold text-gray-700">{conditions.find(c => c.value === condition)?.label.toLowerCase()}</span>{' '}
              with ≥{threshold} within{' '}
              <span className="font-bold">{timeframes.find(t => t.value === timeframe)?.label}</span>
            </div>
          </div>

          {/* Submit Buttons - compact */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-white hover:bg-gray-100 text-white rounded-xl font-semibold text-sm transition-colors"
            >
              Create Alert
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
