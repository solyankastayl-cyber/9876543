/**
 * ASSET SELECTOR — Product Switcher
 * 
 * Allows switching between:
 * - BTC Terminal (Final)
 * - SPX Terminal (Building)
 * - Combined Terminal (Building)
 */

import React from 'react';

const PRODUCTS = [
  {
    id: 'BTC',
    name: 'BTC Terminal',
    status: 'FINAL',
    description: 'Pure BTC Fractal',
    route: '/btc',
    adminRoute: '/admin/fractal',
    color: 'bg-orange-500',
    available: true,
  },
  {
    id: 'SPX',
    name: 'SPX Terminal',
    status: 'BUILDING',
    description: 'S&P 500 Fractal',
    route: '/spx',
    adminRoute: '/admin/spx',
    color: 'bg-blue-500',
    available: true, // Now available with Data Foundation
  },
  {
    id: 'COMBINED',
    name: 'Combined',
    status: 'BUILDING',
    description: 'BTC×SPX Intelligence',
    route: '/combined',
    adminRoute: '/admin/combined',
    color: 'bg-purple-500',
    available: false,
  },
];

export function AssetSelector({ currentAsset = 'BTC', onSelect, theme = 'light' }) {
  const isDark = theme === 'dark';
  
  return (
    <div className="flex items-center gap-2" data-testid="asset-selector">
      {PRODUCTS.map((product) => (
        <button
          key={product.id}
          onClick={() => product.available && onSelect?.(product.id)}
          disabled={!product.available}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
            transition-all duration-200
            ${currentAsset === product.id 
              ? `${product.color} text-white shadow-lg` 
              : product.available 
                ? isDark 
                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : isDark
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                  : 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-50'
            }
          `}
          data-testid={`asset-btn-${product.id}`}
        >
          <span className={`w-2 h-2 rounded-full ${
            product.status === 'FINAL' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
          }`}></span>
          <span>{product.id}</span>
          {product.status === 'BUILDING' && (
            <span className="text-xs opacity-60">(soon)</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function AssetSelectorCard({ currentAsset = 'BTC', onSelect }) {
  const current = PRODUCTS.find(p => p.id === currentAsset) || PRODUCTS[0];
  
  return (
    <div className="bg-slate-900 rounded-xl p-4" data-testid="asset-selector-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold">Select Terminal</h3>
        <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${
          current.status === 'FINAL' ? 'bg-emerald-500' : 'bg-amber-500'
        }`}>
          {current.status}
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {PRODUCTS.map((product) => (
          <button
            key={product.id}
            onClick={() => product.available && onSelect?.(product.id)}
            disabled={!product.available}
            className={`
              flex flex-col items-center justify-center p-3 rounded-lg
              transition-all duration-200
              ${currentAsset === product.id 
                ? `${product.color} text-white` 
                : product.available 
                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }
            `}
          >
            <span className="text-lg font-bold">{product.id}</span>
            <span className="text-xs opacity-75 mt-1">{product.description}</span>
          </button>
        ))}
      </div>
      
      <div className="mt-3 text-xs text-slate-500">
        {current.description} — {current.status === 'FINAL' ? 'Production Ready' : 'Under Construction'}
      </div>
    </div>
  );
}

export default AssetSelector;
