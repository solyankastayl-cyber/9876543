/**
 * FOMO AI Chart Component (Light Theme)
 * 
 * TradingView + FOMO Overlay (hybrid architecture)
 */

import { useEffect, useRef, useState } from 'react';

export function FomoAiChart({ symbol, chartData, decision, selectedTime, onSelectTime }) {
  const containerRef = useRef(null);
  const [tvLoaded, setTvLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = '';

    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'tv-widget-container';
    widgetContainer.style.width = '100%';
    widgetContainer.style.height = '100%';
    containerRef.current.appendChild(widgetContainer);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          autosize: true,
          symbol: `BYBIT:${symbol}.P`,
          interval: '15',
          timezone: 'Etc/UTC',
          theme: 'light',
          style: '1',
          locale: 'en',
          toolbar_bg: '#ffffff',
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          container_id: 'tv-widget-container',
          backgroundColor: '#ffffff',
          gridColor: '#f0f0f0',
        });
        setTvLoaded(true);
      }
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [symbol]);

  return (
    <div className="relative rounded-xl overflow-hidden bg-white border border-gray-200 shadow-sm">
      {/* TradingView Container */}
      <div 
        ref={containerRef} 
        className="w-full h-[520px]"
      />

      {/* FOMO Overlay */}
      {tvLoaded && (
        <FomoOverlay 
          decision={decision}
          chartData={chartData}
          selectedTime={selectedTime}
          onSelectTime={onSelectTime}
        />
      )}

      {/* Decision Badge */}
      {decision && (
        <div className="absolute top-4 right-4 z-10">
          <div className={`px-4 py-2 rounded-lg text-sm font-bold shadow-md ${
            decision.action === 'BUY' 
              ? 'bg-green-100 text-green-700 border border-green-200'
              : decision.action === 'SELL'
              ? 'bg-red-100 text-red-700 border border-red-200'
              : 'bg-gray-100 text-gray-700 border border-gray-200'
          }`}>
            {decision.action} • {(decision.confidence * 100).toFixed(0)}%
          </div>
        </div>
      )}
    </div>
  );
}

function FomoOverlay({ decision, chartData, selectedTime, onSelectTime }) {
  const verdicts = chartData?.verdicts || [];
  const divergences = chartData?.divergences || [];

  if (!verdicts.length && !divergences.length) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-4 text-xs bg-white/90 px-3 py-2 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span className="text-gray-600">BUY</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          <span className="text-gray-600">SELL</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-400"></span>
          <span className="text-gray-600">AVOID</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-red-500">✕</span>
          <span className="text-gray-600">Divergence</span>
        </div>
      </div>
    </div>
  );
}
