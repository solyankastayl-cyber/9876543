/**
 * Market Discovery v2
 * Entry point into Decision System
 * 
 * PURPOSE: Pre-filter and bridge between raw signals and decisions
 * 
 * 3 BLOCKS:
 * 1. Unusual Activity (Raw) - what's happening physically
 * 2. Narratives & Coordination - coordinated patterns
 * 3. Deviation Watchlist - what may become a decision
 * 
 * KEY: Every element links to Token Page or Signals
 * KEY: Shows if it affects Decision Engine
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, TrendingUp, AlertTriangle, Flame, Users, Target } from 'lucide-react';
import { apiGet } from '../api/client';

export default function MarketDiscoveryV2() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const result = await apiGet('/api/market/discovery');
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="p-8">Loading market discovery...</div>;
  }

  if (!data) {
    return <div className="p-8 text-gray-600">No market data available</div>;
  }

  const { unusualActivity, narratives, deviations } = data;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Market Discovery</h1>
      <p className="text-gray-600 mb-8">
        Pre-filter and entry point into Decision System
      </p>

      <div className="space-y-8">
        {/* Block 1: Unusual Activity (Raw) */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Flame className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold">Unusual Activity (Raw)</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            What's happening physically on-chain right now
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unusualActivity.map((item) => (
              <Link
                key={item.id}
                to={`/token/${item.symbol}`}
                className="bg-white border rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold text-lg">{item.symbol}</div>
                    <div className="text-xs text-gray-500">{item.type}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {item.decisionImpact !== 'NONE' && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          item.decisionImpact === 'HIGH'
                            ? 'bg-red-100 text-red-700'
                            : item.decisionImpact === 'MEDIUM'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {item.decisionImpact === 'HIGH' ? 'Affects Decision' : 
                         item.decisionImpact === 'MEDIUM' ? 'Monitored' : 
                         'Low Impact'}
                      </span>
                    )}
                    {item.highRisk && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">
                        High Risk
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-sm text-gray-700 mb-3">{item.description}</div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    {item.engineStatus === 'USED_IN_DECISION' && '✓ Used in Engine'}
                    {item.engineStatus === 'WEIGHTED_DOWN' && '⚠ Weighted Down'}
                    {item.engineStatus === 'IGNORED' && '○ Ignored (noise)'}
                  </span>
                  <span className="text-blue-600 font-medium">View →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Block 2: Narratives & Coordination */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-purple-500" />
            <h2 className="text-2xl font-bold">Narratives & Coordination</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Coordinated patterns and market narratives
          </p>

          <div className="space-y-4">
            {narratives.map((narrative) => (
              <div
                key={narrative.id}
                className="bg-white border rounded-lg p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{narrative.title}</h3>
                    <p className="text-sm text-gray-600">{narrative.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <span className="text-xs text-gray-500">
                      {narrative.tokensAffected} tokens
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded font-medium ${
                        narrative.decisionBias === 'BUY'
                          ? 'bg-green-100 text-green-700'
                          : narrative.decisionBias === 'SELL'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {narrative.decisionBias === 'BUY' ? 'BUY bias' :
                       narrative.decisionBias === 'SELL' ? 'SELL bias' :
                       'Neutral'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {narrative.affectedTokens.slice(0, 5).map((symbol) => (
                    <Link
                      key={symbol}
                      to={`/token/${symbol}`}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded font-medium text-gray-700"
                    >
                      {symbol}
                    </Link>
                  ))}
                  {narrative.affectedTokens.length > 5 && (
                    <span className="text-xs text-gray-500">
                      +{narrative.affectedTokens.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Block 3: Deviation Watchlist */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold">Deviation Watchlist</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Patterns that may transition into decisions
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deviations.map((deviation) => (
              <Link
                key={deviation.id}
                to={`/token/${deviation.symbol}`}
                className="bg-white border rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold text-lg">{deviation.symbol}</div>
                    <div className="text-xs text-gray-500">{deviation.deviationType}</div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded font-medium ${
                      deviation.engineStatus === 'WATCHED_BY_ENGINE'
                        ? 'bg-blue-100 text-blue-700'
                        : deviation.engineStatus === 'IGNORED'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {deviation.engineStatus === 'WATCHED_BY_ENGINE' && 'Watched by Engine'}
                    {deviation.engineStatus === 'IGNORED' && 'Ignored (noise)'}
                    {deviation.engineStatus === 'CONTRIBUTING' && 'Contributing to Decision'}
                  </span>
                </div>

                <div className="text-sm text-gray-700 mb-2">{deviation.description}</div>

                <div className="text-xs text-gray-500">
                  Detected: {new Date(deviation.detectedAt).toLocaleString()}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
