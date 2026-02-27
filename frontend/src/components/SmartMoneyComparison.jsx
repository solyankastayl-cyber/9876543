import { useState } from 'react';
import { X, TrendingUp, Search } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Smart Money Performance Comparison Chart
export default function SmartMoneyComparison() {
  const [selectedEntities, setSelectedEntities] = useState([
    { id: 'alameda', name: 'Alameda Research', color: '#10B981' },
    { id: 'dwf', name: 'DWF Labs', color: '#8B5CF6' },
  ]);
  
  const [timeframe, setTimeframe] = useState('30D');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Available entities to add
  const allEntities = [
    { id: 'alameda', name: 'Alameda Research', color: '#10B981' },
    { id: 'dwf', name: 'DWF Labs', color: '#8B5CF6' },
    { id: 'pantera', name: 'Pantera Capital', color: '#EF4444' },
    { id: 'a16z', name: 'a16z Crypto', color: '#F59E0B' },
    { id: 'paradigm', name: 'Paradigm', color: '#3B82F6' },
    { id: 'jump', name: 'Jump Trading', color: '#EC4899' },
    { id: 'wintermute', name: 'Wintermute', color: '#14B8A6' },
  ];

  // Mock performance data
  const generateData = () => {
    const dates = [];
    const now = new Date();
    const days = timeframe === '30D' ? 30 : timeframe === '90D' ? 90 : timeframe === '6M' ? 180 : timeframe === '1Y' ? 365 : 730;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const dataPoint = {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: date.toISOString()
      };
      
      selectedEntities.forEach(entity => {
        // Generate random performance data
        const baseValue = 1.0;
        const trend = Math.random() > 0.5 ? 1 : -1;
        const volatility = 0.5;
        dataPoint[entity.id] = baseValue + (Math.random() * volatility * trend);
      });
      
      dates.push(dataPoint);
    }
    
    return dates;
  };

  const data = generateData();

  const addEntity = (entity) => {
    if (selectedEntities.length < 5 && !selectedEntities.find(e => e.id === entity.id)) {
      setSelectedEntities([...selectedEntities, entity]);
    }
    setSearchQuery('');
    setShowSearch(false);
  };

  const removeEntity = (entityId) => {
    if (selectedEntities.length > 1) {
      setSelectedEntities(selectedEntities.filter(e => e.id !== entityId));
    }
  };

  const filteredEntities = allEntities.filter(
    e => !selectedEntities.find(s => s.id === e.id) && 
         e.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-2xl border-2 border-gray-200 shadow-lg">
          <p className="text-xs text-gray-500 mb-2">{label}</p>
          {payload.map((entry, index) => {
            const entity = selectedEntities.find(e => e.id === entry.dataKey);
            const value = entry.value;
            const change = ((value - 1) * 100).toFixed(2);
            return (
              <div key={index} className="flex items-center justify-between gap-3 mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-xs font-medium text-gray-700">{entity?.name}</span>
                </div>
                <span className={`text-xs font-bold ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {change >= 0 ? '+' : ''}{change}%
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-100 p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
          <h3 className="text-sm font-bold text-gray-900">Smart Money Performance</h3>
          <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded">LINE 2</span>
        </div>
        
        {/* Timeframe selector */}
        <div className="flex items-center gap-1">
          {['30D', '90D', '6M', '1Y', 'All'].map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                timeframe === tf 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Entity selector */}
      <div className="mb-4">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="text-xs text-gray-500 font-semibold">Compare:</span>
          
          {selectedEntities.map(entity => (
            <div 
              key={entity.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entity.color }} />
              <span className="text-xs font-medium text-gray-700">{entity.name}</span>
              {selectedEntities.length > 1 && (
                <button
                  onClick={() => removeEntity(entity.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          
          {selectedEntities.length < 5 && (
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors text-xs font-semibold"
            >
              <Search className="w-3 h-3" />
              Add
            </button>
          )}
        </div>

        {/* Search dropdown */}
        {showSearch && (
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search entities..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
              autoFocus
            />
            {filteredEntities.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredEntities.map(entity => (
                  <button
                    key={entity.id}
                    onClick={() => addEntity(entity)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entity.color }} />
                    <span className="text-sm text-gray-700">{entity.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11, fill: '#6B7280' }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#6B7280' }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
              tickFormatter={(value) => `${((value - 1) * 100).toFixed(0)}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {selectedEntities.map(entity => (
              <Line
                key={entity.id}
                type="monotone"
                dataKey={entity.id}
                stroke={entity.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: entity.color }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Current performance badges */}
      <div className="mt-4 flex items-center gap-2 flex-wrap">
        {selectedEntities.map(entity => {
          const lastValue = data[data.length - 1]?.[entity.id] || 1;
          const change = ((lastValue - 1) * 100).toFixed(2);
          return (
            <div 
              key={entity.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg"
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entity.color }} />
              <span className="text-xs font-medium text-gray-600">{entity.name}</span>
              <span className={`text-xs font-bold ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {change >= 0 ? '+' : ''}{change}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
