/**
 * U1.2 - Market Signals Page
 * 
 * User-facing signal dashboard for a specific asset.
 * Shows decision header and 6 signal driver cards (A-F).
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RefreshCw, ArrowLeft, AlertTriangle } from 'lucide-react';
import DecisionHeader from './DecisionHeader';
import SignalGrid from './SignalGrid';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Real networks from our indexer (not mock tokens)
const SUPPORTED_NETWORKS = ['ethereum', 'bnb'];

export default function MarketSignalsPage() {
  const { asset = 'ethereum' } = useParams();
  // Validate network - default to ethereum if invalid
  const network = SUPPORTED_NETWORKS.includes(asset) ? asset : 'ethereum';
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v3/signals/market/${network}`);
      const json = await res.json();
      
      if (json.ok) {
        setData(json.data);
        setError(null);
      } else {
        setError(json.error || 'Failed to load signals');
      }
    } catch (err) {
      setError('Unable to fetch signal data');
    } finally {
      setLoading(false);
    }
  }, [network]);

  useEffect(() => {
    fetchSignals();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchSignals, 60000);
    return () => clearInterval(interval);
  }, [fetchSignals]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Back link */}
            <Link 
              to="/market" 
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Market</span>
            </Link>

            {/* Network tabs - Real networks only */}
            <div className="flex items-center gap-1">
              {SUPPORTED_NETWORKS.map((n) => (
                <Link
                  key={n}
                  to={`/market/signals/${n}`}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                    n === network
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {n}
                </Link>
              ))}
            </div>

            {/* Refresh button */}
            <button
              onClick={fetchSignals}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Error state */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div>
              <div className="font-medium text-amber-800">Unable to load signals</div>
              <div className="text-sm text-amber-600">{error}</div>
            </div>
            <button
              onClick={fetchSignals}
              className="ml-auto px-3 py-1 text-sm bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && !data && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
              <p className="text-slate-500">Loading signals...</p>
            </div>
          </div>
        )}

        {/* Data loaded */}
        {data && (
          <>
            {/* Decision Header */}
            <DecisionHeader
              decision={data.decision}
              quality={data.quality}
              asset={data.network?.toUpperCase() || network.toUpperCase()}
              timestamp={data.timestamp}
            />

            {/* Signal Cards */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Signal Drivers
              </h2>
              <SignalGrid drivers={data.drivers} />
            </div>

            {/* Footer note */}
            <div className="text-center py-6 border-t border-slate-200">
              <p className="text-sm text-slate-500">
                Signals are updated in real-time based on on-chain activity.
                <br />
                This is not financial advice.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
