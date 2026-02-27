export type Candle = {
  t: number; // unix ms
  o: number;
  h: number;
  l: number;
  c: number;
  v?: number;
};

export type SMAPoint = { t: number; value: number };

export type Phase =
  | "ACCUMULATION"
  | "MARKUP"
  | "DISTRIBUTION"
  | "MARKDOWN"
  | "CAPITULATION"
  | "RECOVERY";

export type PhaseZone = { from: number; to: number; phase: Phase };

export type ChartResponse = {
  symbol: string;
  tf: "1D" | string;
  count: number;
  candles: Candle[];
  sma200?: SMAPoint[];
  phaseZones?: PhaseZone[];
};

export type Horizon = 7 | 14 | 30;

export type SignalResponse = {
  symbol: string;
  priceNow?: number;
  confidence?: number; // 0..1
  reliability?: { score: number; badge: "OK" | "WARN" | "DEGRADED" | "CRITICAL" };
  signalsByHorizon?: Partial<Record<Horizon, { expectedReturn?: number; projectedPrice?: number }>>;
  assembled?: { expectedReturn?: number; projectedPrice?: number; dominantHorizon?: Horizon };
};

export type ForecastPoint = { days: 0 | 7 | 14 | 30; price: number };

export type ForecastPayload = {
  points: ForecastPoint[];      // 4 точки: 0/7/14/30
  confidence: number;           // 0..1
  bandPct: number;              // 0.01..0.10
};

// Overlay types
export type OverlayMatch = {
  id: string;                    // e.g. "2014-11-25"
  similarity: number;
  phase: string;
  volatilityMatch?: number;
  drawdownShape?: number;
  stability?: number;            // PSS-ish
  windowNormalized: number[];    // len = windowLen
  aftermathNormalized: number[]; // len = aftermathDays (0..N)
  return7d?: number;
  return14d?: number;
  return30d?: number;
  maxDrawdown?: number;
  maxExcursion?: number;
};

export type OverlayResp = {
  windowLen: number;
  aftermathDays?: number;
  currentWindow: {
    timestamps: number[];          // len = windowLen
    raw: number[];                 // raw prices
    normalized: number[];          // base 100
  };
  matches: OverlayMatch[];
  distribution?: {
    p10: number[];
    p25: number[];
    p50: number[];
    p75: number[];
    p90: number[];
  };
};
