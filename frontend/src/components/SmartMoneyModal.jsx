import { X, TrendingUp, TrendingDown, ArrowUpRight, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SmartMoneyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const allEntities = [
    { id: 'alameda', name: 'Alameda Research', status: 'Accumulating', token: 'APT', confidence: 69, netflow: '+$89M', change: '+12.4%' },
    { id: 'dwf-labs', name: 'DWF Labs', status: 'Adding', token: 'ETH', confidence: 73, netflow: '+$45M', change: '+8.2%' },
    { id: 'pantera', name: 'Pantera Capital', status: 'Rotating', token: 'SOL', confidence: 75, netflow: '+$23M', change: '+5.1%' },
    { id: 'a16z', name: 'a16z Crypto', status: 'Accumulating', token: 'ARB', confidence: 82, netflow: '+$156M', change: '+18.9%' },
    { id: 'paradigm', name: 'Paradigm', status: 'Holding', token: 'BTC', confidence: 67, netflow: '+$12M', change: '+2.3%' },
    { id: 'jump', name: 'Jump Trading', status: 'Distributing', token: 'MATIC', confidence: 71, netflow: '-$67M', change: '-11.2%' },
    { id: 'wintermute', name: 'Wintermute', status: 'Adding', token: 'LINK', confidence: 65, netflow: '+$34M', change: '+6.7%' },
    { id: 'three-arrows', name: 'Three Arrows Capital', status: 'Rotating', token: 'AVAX', confidence: 58, netflow: '+$18M', change: '+4.2%' },
    { id: 'grayscale', name: 'Grayscale', status: 'Accumulating', token: 'BTC', confidence: 88, netflow: '+$234M', change: '+15.6%' },
    { id: 'galaxy', name: 'Galaxy Digital', status: 'Adding', token: 'ETH', confidence: 76, netflow: '+$78M', change: '+9.4%' },
    { id: 'celsius', name: 'Celsius Network', status: 'Distributing', token: 'USDC', confidence: 62, netflow: '-$123M', change: '-14.8%' },
    { id: 'blockfi', name: 'BlockFi', status: 'Holding', token: 'BTC', confidence: 54, netflow: '+$8M', change: '+1.2%' },
  ];

  const getStatusIcon = (status) => {
    if (status === 'Accumulating' || status === 'Adding') return <TrendingUp className="w-4 h-4" />;
    if (status === 'Distributing') return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Smart Money Activity</h2>
            <p className="text-sm text-gray-500">Real-time tracking of institutional movements</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allEntities.map((entity) => (
              <Link
                key={entity.id}
                to={`/entity/${entity.id}`}
                onClick={onClose}
                className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all hover:shadow-md cursor-pointer group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-3 h-3 rounded-full bg-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm mb-0.5 truncate group-hover:text-gray-700 transition-colors">
                      {entity.name}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="flex items-center gap-1 font-medium text-gray-600">
                        {getStatusIcon(entity.status)}
                        {entity.status}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="font-medium text-gray-600">{entity.token}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <div className="text-sm font-bold text-gray-900 mb-0.5">
                    {entity.netflow}
                  </div>
                  <div className="text-xs text-gray-500">
                    {entity.confidence}% confidence
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{allEntities.length}</span> entities tracked
          </div>
          <Link 
            to="/entities"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-gray-100 text-white rounded-2xl font-semibold text-sm transition-colors flex items-center gap-2"
          >
            View All Entities
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
