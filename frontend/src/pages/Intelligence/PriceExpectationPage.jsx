/**
 * Price vs Expectation Page
 * 
 * Shows real price vs system predictions
 * Located in: /intelligence/price-expectation
 * 
 * Does NOT touch FOMO AI page
 */

import { useState, useEffect } from 'react';
import { SearchIcon, RefreshCwIcon, LayersIcon } from 'lucide-react';
import CentralChart from '../../components/fomo-ai/CentralChart';
import LayerToggles from '../../components/fomo-ai/LayerToggles';
import RangeSelector from '../../components/fomo-ai/RangeSelector';
import DecisionStrip from '../../components/fomo-ai/DecisionStrip';
import DriversMiniPanel from '../../components/fomo-ai/DriversMiniPanel';

const POPULAR_ASSETS = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', short: 'BTC' },
  { symbol: 'ETHUSDT', name: 'Ethereum', short: 'ETH' },
  { symbol: 'SOLUSDT', name: 'Solana', short: 'SOL' },
  { symbol: 'BNBUSDT', name: 'BNB', short: 'BNB' },
];

export default function PriceExpectationPage() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [range, setRange] = useState('7d');
  const [visibleLayers, setVisibleLayers] = useState(['price', 'combined']);
  const [chartData, setChartData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const handleLayerToggle = (layerId) => {
    setVisibleLayers(prev => 
      prev.includes(layerId)
        ? prev.filter(l => l !== layerId)
        : [...prev, layerId]
    );
  };

  const handleDataLoad = (data) => {
    setChartData(data);
  };

  const currentAsset = POPULAR_ASSETS.find(a => a.symbol === symbol) || {
    symbol,
    name: symbol.replace('USDT', ''),
    short: symbol.replace('USDT', ''),
  };

  // Get current decision from latest prediction
  const latestPrediction = chartData?.prediction?.points?.slice(-1)[0];
  const currentDecision = latestPrediction?.direction === 'BULLISH' ? 'BUY' :
                          latestPrediction?.direction === 'BEARISH' ? 'SELL' : 'AVOID';

  return (
    <div className="min-h-screen bg-gray-50" data-testid="price-expectation-page">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Title */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <LayersIcon className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">Price vs Expectation</h1>
              </div>
              
              {/* Asset Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  data-testid="asset-selector"
                >
                  <span className="font-bold text-gray-900">{currentAsset.short}</span>
                  <span className="text-sm text-gray-500">{currentAsset.name}</span>
                  <SearchIcon className="w-4 h-4 text-gray-400 ml-2" />
                </button>
                
                {showSearch && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-lg z-20">
                    <div className="p-3 border-b border-gray-100">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search asset..."
                        className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    </div>
                    <div className="p-2 max-h-60 overflow-y-auto">
                      {POPULAR_ASSETS
                        .filter(a => 
                          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.short.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map(asset => (
                          <button
                            key={asset.symbol}
                            onClick={() => {
                              setSymbol(asset.symbol);
                              setShowSearch(false);
                              setSearchQuery('');
                            }}
                            className={`w-full px-3 py-2 rounded-lg text-left hover:bg-gray-50 flex items-center justify-between ${
                              symbol === asset.symbol ? 'bg-blue-50' : ''
                            }`}
                          >
                            <span className="font-medium text-gray-900">{asset.short}</span>
                            <span className="text-sm text-gray-500">{asset.name}</span>
                          </button>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Center: Range Selector */}
            <RangeSelector 
              activeRange={range} 
              onRangeChange={setRange} 
            />
            
            {/* Right: Refresh */}
            <button 
              onClick={() => window.location.reload()}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
              title="Refresh"
            >
              <RefreshCwIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: Chart Area (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Decision Strip */}
            <DecisionStrip
              decision={currentDecision}
              confidence={latestPrediction?.combinedConfidence || 0.5}
              direction={latestPrediction?.direction || 'NEUTRAL'}
              accuracy={chartData?.accuracy}
            />
            
            {/* Layer Toggles + Price */}
            <div className="flex items-center justify-between">
              <LayerToggles
                visibleLayers={visibleLayers}
                onToggle={handleLayerToggle}
              />
              
              {chartData?.price?.meta && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    ${chartData.price.meta.lastPrice?.toLocaleString()}
                  </div>
                  <div className={`text-sm ${
                    chartData.price.meta.priceChangePercent >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {chartData.price.meta.priceChangePercent >= 0 ? '+' : ''}
                    {chartData.price.meta.priceChangePercent?.toFixed(2)}%
                  </div>
                </div>
              )}
            </div>
            
            {/* Central Chart */}
            <CentralChart
              symbol={symbol}
              range={range}
              tf="1h"
              visibleLayers={visibleLayers}
              onDataLoad={handleDataLoad}
            />
            
            {/* Legend explanation */}
            <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
              <strong>How to read:</strong> Blue line = Real price from Binance. 
              Green dashed = Our combined prediction. Toggle layers to see Exchange, Onchain, Sentiment signals.
              When prediction diverges from price, system is learning from the gap.
            </div>
          </div>
          
          {/* Right: Side Panel (1 col) */}
          <div className="space-y-4">
            {/* Drivers Panel */}
            <DriversMiniPanel 
              prediction={chartData?.prediction} 
              topDrivers={chartData?.topDrivers}
            />
            
            {/* Events Summary */}
            {chartData?.events && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">SIGNAL CHANGES</h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-lg font-bold text-green-600">
                      {chartData.events.meta?.buyCount || 0}
                    </div>
                    <div className="text-xs text-gray-500">BUY</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-red-600">
                      {chartData.events.meta?.sellCount || 0}
                    </div>
                    <div className="text-xs text-gray-500">SELL</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-600">
                      {chartData.events.meta?.avoidCount || 0}
                    </div>
                    <div className="text-xs text-gray-500">AVOID</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Accuracy Card */}
            {chartData?.accuracy && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">MODEL ACCURACY</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Direction Match</span>
                    <span className="font-medium text-gray-900">
                      {chartData.accuracy.directionAccuracy}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Hit Rate</span>
                    <span className="font-medium text-gray-900">
                      {chartData.accuracy.hitRate}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Avg Deviation</span>
                    <span className="font-medium text-gray-900">
                      {chartData.accuracy.avgDeviation}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
