/**
 * FRACTAL RESEARCH TERMINAL — Data Mappers
 * Transform API responses to chart-ready structures
 */

/**
 * Build forecast overlays from signal response
 */
export function buildForecastOverlays(signal, currentPrice) {
  if (!signal || !currentPrice || !Number.isFinite(currentPrice)) {
    return { "7d": null, "14d": null, "30d": null, "global": null };
  }

  const s7 = signal.signalsByHorizon?.["7d"];
  const s14 = signal.signalsByHorizon?.["14d"];
  const s30 = signal.signalsByHorizon?.["30d"];

  const p7 = s7 ? currentPrice * (1 + s7.expectedReturn) : null;
  const p14 = s14 ? currentPrice * (1 + s14.expectedReturn) : null;
  const p30 = s30 ? currentPrice * (1 + s30.expectedReturn) : null;

  const band7 = s7 ? {
    low: currentPrice * (1 + s7.expectedReturn * (1 - s7.confidence)),
    high: currentPrice * (1 + s7.expectedReturn * (1 + s7.confidence)),
  } : null;

  const band14 = s14 ? {
    low: currentPrice * (1 + s14.expectedReturn * (1 - s14.confidence)),
    high: currentPrice * (1 + s14.expectedReturn * (1 + s14.confidence)),
  } : null;

  const band30 = s30 ? {
    low: currentPrice * (1 + s30.expectedReturn * (1 - s30.confidence)),
    high: currentPrice * (1 + s30.expectedReturn * (1 + s30.confidence)),
  } : null;

  return {
    "7d": p7 ? {
      horizon: "7d",
      label: `Forecast 7d (${s7?.action ?? "HOLD"})`,
      showBand: true,
      color: getActionColor(s7?.action),
      points: [
        { tDays: 0, price: currentPrice, low: currentPrice, high: currentPrice },
        { tDays: 7, price: p7, low: band7?.low, high: band7?.high, conf: s7?.confidence },
      ],
    } : null,

    "14d": p14 ? {
      horizon: "14d",
      label: `Forecast 14d (${s14?.action ?? "HOLD"})`,
      showBand: true,
      color: getActionColor(s14?.action),
      points: [
        { tDays: 0, price: currentPrice, low: currentPrice, high: currentPrice },
        { tDays: 7, price: p7 ?? currentPrice, low: band7?.low ?? currentPrice, high: band7?.high ?? currentPrice },
        { tDays: 14, price: p14, low: band14?.low, high: band14?.high, conf: s14?.confidence },
      ],
    } : null,

    "30d": p30 ? {
      horizon: "30d",
      label: `Forecast 30d (${s30?.action ?? "HOLD"})`,
      showBand: true,
      color: getActionColor(s30?.action),
      points: [
        { tDays: 0, price: currentPrice, low: currentPrice, high: currentPrice },
        { tDays: 7, price: p7 ?? currentPrice },
        { tDays: 14, price: p14 ?? (p7 ?? currentPrice) },
        { tDays: 30, price: p30, low: band30?.low, high: band30?.high, conf: s30?.confidence },
      ],
    } : null,

    "global": p30 ? {
      horizon: "global",
      label: `Global (${signal.assembled?.action ?? "HOLD"})`,
      showBand: false,
      color: getActionColor(signal.assembled?.action),
      points: [
        { tDays: 0, price: currentPrice },
        { tDays: 30, price: p30 },
      ],
    } : null,
  };
}

/**
 * Build fractal overlay from match response
 */
export function buildFractalOverlay(matchResponse, activeIndex = 0) {
  if (!matchResponse?.matches?.length || !matchResponse.currentWindow) {
    return null;
  }

  const matches = matchResponse.matches.map((m, i) => ({
    id: m.id || `match-${i}`,
    startDate: m.startDate,
    endDate: m.endDate,
    similarity: m.similarity,
    phase: m.phase,
    regime: m.regime,
    stability: m.stability,
    weight: m.weight,
    normalizedPattern: m.normalizedPattern || [],
    normalizedContinuation: m.normalizedContinuation || [],
  }));

  return {
    currentWindow: matchResponse.currentWindow,
    matches,
    activeMatchIndex: Math.min(activeIndex, matches.length - 1),
  };
}

/**
 * Build fractal overlay from signal explain (fallback)
 */
export function buildFractalOverlayFromSignal(signal, candles, windowLen = 60, activeIndex = 0) {
  if (!signal?.explain?.topMatches?.length || candles.length < windowLen) {
    return null;
  }

  const currentWindow = {
    startIndex: candles.length - windowLen,
    endIndex: candles.length,
    normalizedPrices: normalizeWindowPrices(candles.slice(-windowLen)),
  };

  const matches = signal.explain.topMatches.slice(0, 5).map((m, i) => ({
    id: `match-${i}`,
    startDate: m.start,
    endDate: "",
    similarity: m.similarity,
    phase: m.phase,
    regime: "N/A",
    stability: m.stability,
    weight: m.ageWeight,
    normalizedPattern: [],
    normalizedContinuation: [],
  }));

  return {
    currentWindow,
    matches,
    activeMatchIndex: Math.min(activeIndex, matches.length - 1),
  };
}

function getActionColor(action) {
  switch (action?.toUpperCase()) {
    case "LONG":
    case "BUY":
      return "#16a34a";
    case "SHORT":
    case "SELL":
      return "#dc2626";
    default:
      return "#111827";
  }
}

function normalizeWindowPrices(candles) {
  if (!candles.length) return [];
  const base = candles[0].close;
  if (!base || !Number.isFinite(base)) return [];
  return candles.map((c) => (c.close / base) * 100);
}
