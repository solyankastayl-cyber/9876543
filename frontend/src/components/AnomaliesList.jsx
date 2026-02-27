import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// Compact Anomalies list with mini-charts
export default function AnomaliesList() {
  const anomalies = [
    { entity: 'a16z', token: 'ETH', zscore: 2.8, positive: true, volume: '$92M', change: '+245%' },
    { entity: 'Binance', token: 'USDT', zscore: 2.5, positive: true, volume: '$89M', change: '+198%' },
    { entity: 'Jump', token: 'SOL', zscore: 2.3, positive: true, volume: '$78M', change: '+167%' },
    { entity: 'Wintermute', token: 'USDT', zscore: -2.1, positive: false, volume: '$45M', change: '-156%' },
  ];

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-100 p-4 shadow-sm">
      {/* Header with LINE 1 indicator */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-gradient-to-b from-orange-500 to-red-500 rounded-full" />
          <h3 className="text-sm font-bold text-gray-900">Flow Anomalies</h3>
          <span className="text-xs px-2 py-0.5 bg-orange-50 text-orange-700 font-semibold rounded">LINE 1</span>
        </div>
        <span className="text-xs text-gray-500">Z-score &gt; 2.0</span>
      </div>
      
      <div className="space-y-2">
        {anomalies.map((a, i) => (
          <div 
            key={i}
            className="group p-3 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${a.positive ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  {a.positive ? (
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">
                    {a.entity} → {a.token}
                  </div>
                  <div className="text-xs text-gray-500">{a.volume} volume</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${a.positive ? 'text-emerald-600' : 'text-red-600'}`}>
                  {a.zscore > 0 ? '+' : ''}{a.zscore}σ
                </div>
                <div className={`text-xs font-semibold ${a.positive ? 'text-emerald-600' : 'text-red-600'}`}>
                  {a.change}
                </div>
              </div>
            </div>
            
            {/* Mini sparkline visualization */}
            <div className="h-8 flex items-end gap-0.5">
              {Array.from({ length: 12 }).map((_, idx) => {
                const height = Math.random() * 100;
                const isLast = idx === 11;
                return (
                  <div 
                    key={idx}
                    className={`flex-1 rounded-t transition-all ${
                      a.positive 
                        ? isLast ? 'bg-emerald-500' : 'bg-emerald-200' 
                        : isLast ? 'bg-red-500' : 'bg-red-200'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      <Link 
        to="/tokens"
        className="mt-3 w-full py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-1 shadow-sm"
      >
        Open Flow Explorer <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

