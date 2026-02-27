/**
 * FRACTAL RESEARCH TERMINAL - Main Chart Component
 * Canvas-first implementation with zoom/pan/crosshair
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { drawChart } from "./draw";
import { panViewport, zoomViewport, resetViewport } from "./interactions";
import { clamp } from "./scales";

export function ChartRoot({ 
  candles, 
  height = 460, 
  forecastByHorizon,
  fractalOverlay,
  showMA200 = true,
  onHorizonChange,
  onMatchChange,
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);

  const [width, setWidth] = useState(900);
  const [viewport, setViewport] = useState(() => resetViewport(candles.length));
  const [cross, setCross] = useState({ x: 0, y: 0, index: 0, active: false });
  const [drag, setDrag] = useState({ active: false, lastX: 0 });
  const [horizon, setHorizon] = useState("30d");
  const [showFractal, setShowFractal] = useState(false);

  // Resize observer
  useEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      setWidth(Math.max(320, Math.floor(rect.width)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Update viewport when candles change
  useEffect(() => {
    setViewport((v) => {
      const end = Math.min(candles.length, v.end);
      const win = Math.max(60, end - v.start);
      const start = Math.max(0, end - win);
      return { start, end };
    });
  }, [candles.length]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const options = {
      forecast: forecastByHorizon?.[horizon] ?? null,
      fractal: showFractal ? fractalOverlay : null,
      showMA200,
    };

    drawChart(ctx, candles, viewport, cross, width, height, options);
  }, [candles, viewport, cross, width, height, forecastByHorizon, horizon, fractalOverlay, showFractal, showMA200]);

  // Helpers
  const visibleCount = Math.max(1, viewport.end - viewport.start);
  const padL = 56;
  const padR = 70;
  const plotW = width - padL - padR;

  const nearestIndexFromX = useCallback((localX) => {
    const x = Math.max(padL, Math.min(padL + plotW, localX));
    const t = (x - padL) / plotW;
    return clamp(Math.round(t * (visibleCount - 1)), 0, visibleCount - 1);
  }, [plotW, visibleCount]);

  // Event handlers
  const onMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (drag.active) {
      const dx = x - drag.lastX;
      const barsPerPx = visibleCount / Math.max(1, plotW);
      const deltaBars = Math.round(-dx * barsPerPx);
      if (deltaBars !== 0) {
        setViewport((v) => panViewport(v, candles.length, deltaBars));
        setDrag({ active: true, lastX: x });
      }
      return;
    }

    const idx = nearestIndexFromX(x);
    setCross({ x, y, index: idx, active: true });
  }, [drag, plotW, visibleCount, candles.length, nearestIndexFromX]);

  const onMouseLeave = useCallback(() => {
    setCross((c) => ({ ...c, active: false }));
    setDrag({ active: false, lastX: 0 });
  }, []);

  const onMouseDown = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDrag({ active: true, lastX: e.clientX - rect.left });
  }, []);

  const onMouseUp = useCallback(() => {
    setDrag({ active: false, lastX: 0 });
  }, []);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const idx = nearestIndexFromX(x);
    const anchorIndex = viewport.start + idx;

    const zoomIn = e.deltaY < 0;
    const factor = zoomIn ? 0.88 : 1.14;

    setViewport((v) => zoomViewport(v, candles.length, anchorIndex, factor, 60, 520));
  }, [nearestIndexFromX, viewport.start, candles.length]);

  const onDoubleClick = useCallback(() => {
    setViewport(resetViewport(candles.length));
  }, [candles.length]);

  const handleHorizonChange = useCallback((h) => {
    setHorizon(h);
    onHorizonChange?.(h);
  }, [onHorizonChange]);

  const matchCount = fractalOverlay?.matches?.length ?? 0;
  const activeMatch = fractalOverlay?.activeMatchIndex ?? 0;

  return (
    <div ref={wrapRef} className="w-full rounded-xl border border-gray-200 bg-white p-4">
      {/* Header */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold text-gray-900">Fractal Terminal</div>
          <div className="text-xs text-gray-500">BTC/USD</div>
        </div>

        {/* Horizon selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 mr-1">Horizon:</span>
          <HorizonButton active={horizon === "7d"} onClick={() => handleHorizonChange("7d")}>7d</HorizonButton>
          <HorizonButton active={horizon === "14d"} onClick={() => handleHorizonChange("14d")}>14d</HorizonButton>
          <HorizonButton active={horizon === "30d"} onClick={() => handleHorizonChange("30d")}>30d</HorizonButton>
          <HorizonButton active={horizon === "global"} onClick={() => handleHorizonChange("global")}>Global</HorizonButton>
        </div>

        {/* Fractal toggle */}
        <button
          onClick={() => setShowFractal(!showFractal)}
          className={[
            "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
            showFractal
              ? "border-violet-600 bg-violet-600 text-white"
              : "border-gray-200 bg-white text-gray-700 hover:border-violet-400 hover:text-violet-600",
          ].join(" ")}
        >
          {showFractal ? "Fractal ON" : "Fractal OFF"}
        </button>
      </div>

      {/* Fractal match selector */}
      {showFractal && matchCount > 1 && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs text-gray-500">Match:</span>
          {Array.from({ length: Math.min(5, matchCount) }, (_, i) => (
            <button
              key={i}
              onClick={() => onMatchChange?.(i)}
              className={[
                "w-7 h-7 rounded-lg border text-xs font-medium transition",
                activeMatch === i
                  ? "border-violet-600 bg-violet-600 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-violet-400",
              ].join(" ")}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Instructions */}
      <div className="mb-2 text-xs text-gray-400">
        Zoom: scroll | Pan: drag | Reset: double-click
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        data-testid="fractal-chart-canvas"
        className="block w-full select-none rounded-lg border border-gray-100 cursor-crosshair"
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onWheel={onWheel}
        onDoubleClick={onDoubleClick}
      />
    </div>
  );
}

function HorizonButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-lg border px-3 py-1 text-xs font-medium transition",
        active
          ? "border-gray-900 bg-gray-900 text-white"
          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default ChartRoot;
