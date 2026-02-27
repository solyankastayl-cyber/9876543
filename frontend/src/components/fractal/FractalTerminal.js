/**
 * FRACTAL RESEARCH TERMINAL — Main Page Component
 * Combines chart + signal panels + strategy simulation
 */

import React, { useState, useEffect, useCallback } from "react";
import { ChartRoot } from "./chart/ChartRoot";
import { fetchFractalSignal, fetchCandles, fetchFractalMatches } from "./chart/api";
import { buildForecastOverlays, buildFractalOverlay, buildFractalOverlayFromSignal } from "./chart/mappers";
import { fmtPrice, fmtPercent } from "./chart/format";

// Mock candles for development
function generateMockCandles(count = 500) {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  let price = 60000 + Math.random() * 10000;

  return Array.from({ length: count }, (_, i) => {
    const volatility = 0.02 + Math.random() * 0.03;
    const change = (Math.random() - 0.48) * volatility;
    price = price * (1 + change);

    const high = price * (1 + Math.random() * 0.015);
    const low = price * (1 - Math.random() * 0.015);
    const open = low + Math.random() * (high - low);
    const close = low + Math.random() * (high - low);

    return {
      time: now - (count - i) * dayMs,
      open,
      high,
      low,
      close,
      volume: Math.random() * 50000000000,
    };
  });
}

export function FractalTerminal() {
  const [candles, setCandles] = useState([]);
  const [signal, setSignal] = useState(null);
  const [forecastOverlays, setForecastOverlays] = useState({
    "7d": null,
    "14d": null,
    "30d": null,
    "global": null,
  });
  const [fractalOverlay, setFractalOverlay] = useState(null);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [horizon, setHorizon] = useState("30d");

  // Load data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        // Fetch candles
        const candleRes = await fetchCandles("BTC", "1D", 1500);
        let loadedCandles = [];

        if (candleRes?.candles?.length) {
          loadedCandles = candleRes.candles.map((c) => ({
            time: c.time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
            volume: c.volume,
          }));
        } else {
          console.log("[FractalTerminal] Using mock candles");
          loadedCandles = generateMockCandles(500);
        }

        setCandles(loadedCandles);

        // Fetch signal
        const sig = await fetchFractalSignal("BTC");
        setSignal(sig);

        // Build forecast overlays
        const currentPrice = loadedCandles[loadedCandles.length - 1]?.close ?? 0;
        const forecasts = buildForecastOverlays(sig, currentPrice);
        setForecastOverlays(forecasts);

        // Build fractal overlay
        const matchRes = await fetchFractalMatches("BTC", "30d", 5);
        if (matchRes) {
          setFractalOverlay(buildFractalOverlay(matchRes, 0));
        } else if (sig) {
          setFractalOverlay(buildFractalOverlayFromSignal(sig, loadedCandles, 60, 0));
        }
      } catch (err) {
        console.error("[FractalTerminal] Load error:", err);
        setError("Failed to load data");
        const mockCandles = generateMockCandles(500);
        setCandles(mockCandles);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleMatchChange = useCallback((index) => {
    setActiveMatchIndex(index);
    setFractalOverlay((prev) =>
      prev ? { ...prev, activeMatchIndex: index } : null
    );
  }, []);

  const handleHorizonChange = useCallback((h) => {
    setHorizon(h);
  }, []);

  const currentPrice = candles[candles.length - 1]?.close ?? 0;
  const currentSignal = signal?.signalsByHorizon?.[horizon] ?? signal?.assembled;

  return (
    <div className="min-h-screen bg-gray-50" data-testid="fractal-terminal-page">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-900">Fractal Research Terminal</h1>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
              v4.0
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-gray-500">BTC/USD:</span>
              <span className="ml-2 font-semibold text-gray-900">{fmtPrice(currentPrice)}</span>
            </div>
            <div>
              <span className="text-gray-500">Phase:</span>
              <span className="ml-2 font-medium text-gray-700">{signal?.meta?.phase ?? "—"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-500">Loading terminal...</div>
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
        ) : (
          <div className="space-y-6">
            {/* Main Chart */}
            <ChartRoot
              candles={candles}
              height={480}
              forecastByHorizon={forecastOverlays}
              fractalOverlay={fractalOverlay}
              showMA200={true}
              onHorizonChange={handleHorizonChange}
              onMatchChange={handleMatchChange}
            />

            {/* Signal & Risk Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Signal Card */}
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Signal ({horizon})
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className={[
                      "rounded-lg px-4 py-2 text-lg font-bold",
                      currentSignal?.action === "LONG"
                        ? "bg-green-100 text-green-700"
                        : currentSignal?.action === "SHORT"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-600",
                    ].join(" ")}
                  >
                    {currentSignal?.action ?? "HOLD"}
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Confidence</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {fmtPercent(currentSignal?.confidence ?? 0)}
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-sm">
                  <span className="text-gray-500">Expected Return:</span>
                  <span
                    className={[
                      "ml-2 font-medium",
                      (currentSignal?.expectedReturn ?? 0) >= 0 ? "text-green-600" : "text-red-600",
                    ].join(" ")}
                  >
                    {fmtPercent(currentSignal?.expectedReturn ?? 0)}
                  </span>
                </div>
              </div>

              {/* Reliability Card */}
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Reliability
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className={[
                      "rounded-lg px-3 py-1.5 text-sm font-bold",
                      signal?.reliability?.badge === "OK"
                        ? "bg-green-100 text-green-700"
                        : signal?.reliability?.badge === "WARN"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700",
                    ].join(" ")}
                  >
                    {signal?.reliability?.badge ?? "—"}
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {signal?.reliability?.score ? `${Math.round(signal.reliability.score * 100)}%` : "—"}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Drift:</span>
                    <span className="ml-1 text-gray-700">
                      {signal?.reliability?.components?.drift?.toFixed(2) ?? "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Calibration:</span>
                    <span className="ml-1 text-gray-700">
                      {signal?.reliability?.components?.calibration?.toFixed(2) ?? "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Risk Card */}
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Risk
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className={[
                      "rounded-lg px-3 py-1.5 text-sm font-bold",
                      signal?.risk?.tailRisk === "LOW"
                        ? "bg-green-100 text-green-700"
                        : signal?.risk?.tailRisk === "ELEVATED"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700",
                    ].join(" ")}
                  >
                    {signal?.risk?.tailRisk ?? "—"}
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">P95 MaxDD</div>
                    <div className="text-lg font-semibold text-red-600">
                      {signal?.risk?.mcP95_DD ? fmtPercent(signal.risk.mcP95_DD) : "—"}
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-sm">
                  <span className="text-gray-500">Size Multiplier:</span>
                  <span className="ml-2 font-medium text-gray-700">
                    {currentSignal?.sizeMultiplier?.toFixed(2) ?? "—"}x
                  </span>
                </div>
              </div>

              {/* Entropy Card */}
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Entropy / EffectiveN
                </div>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold text-gray-900">
                    {currentSignal?.entropy?.toFixed(3) ?? "—"}
                  </div>
                  <div className="text-sm text-gray-500">entropy</div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <div className="text-xl font-semibold text-gray-700">
                    {currentSignal?.effectiveN?.toFixed(1) ?? "—"}
                  </div>
                  <div className="text-sm text-gray-500">effective N</div>
                </div>
              </div>
            </div>

            {/* Strategy Simulation */}
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">
                Strategy Simulation
              </div>
              <div className="grid grid-cols-3 gap-4">
                {["Conservative", "Neutral", "Aggressive"].map((strategy, i) => {
                  const mult = [0.5, 1.0, 1.5][i];
                  const expectedReturn = (currentSignal?.expectedReturn ?? 0) * mult;
                  const risk = (signal?.risk?.mcP95_DD ?? 0.15) * mult;
                  const wouldTrade = (currentSignal?.confidence ?? 0) > [0.6, 0.4, 0.2][i];

                  return (
                    <div
                      key={strategy}
                      className={[
                        "rounded-lg border p-4",
                        i === 1 ? "border-blue-200 bg-blue-50" : "border-gray-100",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-900">{strategy}</span>
                        <span
                          className={[
                            "rounded px-2 py-0.5 text-xs font-medium",
                            wouldTrade
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500",
                          ].join(" ")}
                        >
                          {wouldTrade ? "TRADE" : "NO"}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Expected</span>
                          <span
                            className={expectedReturn >= 0 ? "text-green-600" : "text-red-600"}
                          >
                            {fmtPercent(expectedReturn)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Risk (DD)</span>
                          <span className="text-red-600">{fmtPercent(risk)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Size</span>
                          <span className="text-gray-700">{mult}x</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* No Trade Reasons */}
            {signal?.explain?.noTradeReasons?.length > 0 && (
              <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                <div className="text-xs font-medium text-yellow-800 uppercase tracking-wide mb-2">
                  No Trade Reasons
                </div>
                <div className="flex flex-wrap gap-2">
                  {signal.explain.noTradeReasons.map((reason, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default FractalTerminal;
