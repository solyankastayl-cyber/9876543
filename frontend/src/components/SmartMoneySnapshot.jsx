/**
 * SmartMoneySnapshot - EVM-only with honest status
 * 
 * Shows only entities with confirmed EVM addresses.
 * If no real data - shows honest placeholder.
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import SmartMoneyModal from './SmartMoneyModal';
import { api } from '../api/client';

export default function SmartMoneySnapshot() {
  const [showModal, setShowModal] = useState(false);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasRealData, setHasRealData] = useState(false);

  const loadEntities = useCallback(async () => {
    setLoading(true);
    try {
      // Try to fetch real entity data
      const response = await api.get('/api/entities', {
        params: { limit: 4, hasAddresses: true }
      });
      
      if (response.data?.ok && response.data.data?.length > 0) {
        const realEntities = response.data.data
          .filter(e => e.addresses?.length > 0) // Only with confirmed addresses
          .slice(0, 4)
          .map(e => ({
            id: e._id || e.id,
            name: e.name,
            status: e.recentActivity?.type || 'Monitoring',
            hasAddresses: true,
            addressCount: e.addresses?.length || 0,
          }));
        
        if (realEntities.length > 0) {
          setEntities(realEntities);
          setHasRealData(true);
        } else {
          setHasRealData(false);
        }
      } else {
        setHasRealData(false);
      }
    } catch (err) {
      console.error('Failed to load entities:', err);
      setHasRealData(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntities();
  }, [loadEntities]);

  // Loading state
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-2.5 flex flex-col h-full" data-testid="smart-money-loading">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-gray-900">Smart Money</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  // No real data - Honest placeholder
  if (!hasRealData) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-2.5 flex flex-col h-full" data-testid="smart-money-empty">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-gray-900">Smart Money</h3>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center text-center px-2 py-4">
          <div className="p-2 bg-gray-100 rounded-xl mb-2">
            <AlertCircle className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-xs font-medium text-gray-700 mb-1">Building index</p>
          <p className="text-xs text-gray-500">
            Smart money data appears after indexing EVM wallets
          </p>
        </div>
        
        <Link
          to="/entities"
          className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl text-xs font-semibold transition-colors text-center mt-auto"
        >
          Explore Entities
        </Link>
      </div>
    );
  }

  // Has real data
  return (
    <>
      <div className="bg-white border border-gray-200 rounded-2xl p-2.5 flex flex-col h-full" data-testid="smart-money-real">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-gray-900">Smart Money</h3>
          <span className="text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Live</span>
        </div>
        
        <div className="space-y-1.5 mb-3 flex-grow">
          {entities.map((entity, i) => (
            <Link
              key={entity.id || i}
              to={`/entity/${entity.name?.toLowerCase().replace(/\s+/g, '-') || entity.id}`}
              className="flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-gray-900">{entity.name}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-gray-600">{entity.status}</span>
              </div>
            </Link>
          ))}
        </div>
        
        <button
          onClick={() => setShowModal(true)}
          className="w-full py-2 bg-white hover:bg-gray-100 text-white rounded-2xl text-xs font-semibold transition-colors mt-auto"
          data-testid="view-all-smart-money-btn"
        >
          View All Smart Money
        </button>
      </div>
    
      {showModal && <SmartMoneyModal isOpen={showModal} onClose={() => setShowModal(false)} />}
    </>
  );
}
