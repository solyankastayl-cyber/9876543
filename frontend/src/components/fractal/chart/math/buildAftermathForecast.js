/**
 * BLOCK 52.5.2 — Aftermath-Driven Forecast (Institutional Grade)
 * 
 * Логика:
 * 1. Берём aftermathNormalized лучшего матча (base ~100)
 * 2. Переводим в return path
 * 3. Калибруем к якорям R7/R14/R30
 * 4. Переводим в цену от currentPrice
 * 5. Строим асимметричный band
 * 6. Строим tail floor
 * 
 * Это shape-preserving transform — форма траектории сохраняется,
 * но масштабируется под наш прогноз.
 */

/**
 * @param {Object} input
 * @param {number} input.currentPrice - P0
 * @param {number} input.R7 - Expected return 7d (0.05 = +5%)
 * @param {number} input.R14 - Expected return 14d
 * @param {number} input.R30 - Expected return 30d
 * @param {number[]} input.aftermathNormalized - Historical aftermath path (base ~100)
 * @param {number} input.maxDD_WF - Working drawdown (0.08 = 8%)
 * @param {number} input.mcP95_DD - Tail risk P95 (0.50 = 50%)
 * @param {number} input.confidence - Model confidence (0.01 = 1%)
 * @returns {Object} ForecastOutput
 */
export function buildAftermathForecast(input) {
  const {
    currentPrice,
    R7,
    R14,
    R30,
    aftermathNormalized,
    maxDD_WF,
    mcP95_DD,
    confidence
  } = input;

  // Validate input
  if (!aftermathNormalized || aftermathNormalized.length < 7) {
    // Fallback to simple exponential if no aftermath data
    return buildFallbackForecast(currentPrice, R30, maxDD_WF, mcP95_DD, confidence);
  }

  const N = aftermathNormalized.length;
  
  // 1️⃣ Convert normalized to return path
  const base = aftermathNormalized[0];
  if (base <= 0) {
    return buildFallbackForecast(currentPrice, R30, maxDD_WF, mcP95_DD, confidence);
  }
  
  const rawReturns = aftermathNormalized.map(v => (v / base) - 1);

  // 2️⃣ Piecewise calibration to hit R7/R14/R30 exactly
  const calibratedReturns = calibrateToAnchors(rawReturns, R7, R14, R30);

  // 3️⃣ Convert to price path
  const pricePath = calibratedReturns.map(r => currentPrice * (1 + r));

  // 4️⃣ Build asymmetric confidence band
  const { upperBand, lowerBand } = buildAsymmetricBand(
    pricePath,
    maxDD_WF,
    mcP95_DD,
    confidence,
    N
  );

  // 5️⃣ Tail floor (P95 catastrophic)
  const tailFloor = currentPrice * (1 - mcP95_DD);

  // 6️⃣ Create day markers for key points
  const keyDays = [
    { day: 0, price: currentPrice, return: 0 },
    { day: 7, price: pricePath[6] || currentPrice, return: calibratedReturns[6] || 0 },
    { day: 14, price: pricePath[13] || currentPrice, return: calibratedReturns[13] || 0 },
    { day: 30, price: pricePath[N - 1] || currentPrice, return: calibratedReturns[N - 1] || 0 }
  ];

  return {
    pricePath,
    upperBand,
    lowerBand,
    tailFloor,
    keyDays,
    confidence,
    R30,
    maxDD_WF,
    mcP95_DD,
    type: 'aftermath-driven'
  };
}

/**
 * Piecewise calibration to hit anchor points exactly
 * while preserving the shape of the trajectory
 */
function calibrateToAnchors(rawReturns, R7, R14, R30) {
  const N = rawReturns.length;
  const calibrated = new Array(N);

  // Get raw values at anchor points (0-indexed: day 7 = index 6)
  const raw7 = rawReturns[6] || 0.0001;
  const raw14 = rawReturns[13] || 0.0001;
  const raw30 = rawReturns[N - 1] || 0.0001;

  // Segment 1: days 1-7 (indices 0-6)
  const scale1 = Math.abs(raw7) > 0.0001 ? R7 / raw7 : 1;
  
  // Segment 2: days 8-14 (indices 7-13)
  const delta_raw_2 = rawReturns[13] - rawReturns[6];
  const delta_target_2 = R14 - R7;
  const scale2 = Math.abs(delta_raw_2) > 0.0001 ? delta_target_2 / delta_raw_2 : 1;
  
  // Segment 3: days 15-30 (indices 14-29)
  const delta_raw_3 = rawReturns[N - 1] - rawReturns[13];
  const delta_target_3 = R30 - R14;
  const scale3 = Math.abs(delta_raw_3) > 0.0001 ? delta_target_3 / delta_raw_3 : 1;

  for (let i = 0; i < N; i++) {
    if (i <= 6) {
      // Segment 1: scale directly
      calibrated[i] = rawReturns[i] * scale1;
    } else if (i <= 13) {
      // Segment 2: base from R7, scale delta
      calibrated[i] = R7 + (rawReturns[i] - rawReturns[6]) * scale2;
    } else {
      // Segment 3: base from R14, scale delta
      calibrated[i] = R14 + (rawReturns[i] - rawReturns[13]) * scale3;
    }
  }

  return calibrated;
}

/**
 * Build asymmetric confidence band
 * - Downside wider (1.35x)
 * - Upside narrower (0.85x)
 * - Grows with √(time) — institutional standard
 * - Wider when confidence is low
 */
function buildAsymmetricBand(pricePath, maxDD_WF, mcP95_DD, confidence, N) {
  const upperBand = [];
  const lowerBand = [];

  const baseVol = maxDD_WF;
  
  // Confidence factor: low confidence = wider band
  const confScale = Math.max(0.6, Math.min(2.0, 1 + (1 - confidence) * 1.5));
  
  // Asymmetry coefficients
  const downK = 1.35;
  const upK = 0.85;

  for (let i = 0; i < pricePath.length; i++) {
    const t = (i + 1) / N;
    
    // Band grows with √(time) — institutional standard
    // This gives: narrow in first days, moderate at 14d, wide at 30d
    const timeFactor = Math.sqrt(t);
    
    // Calculate band width
    const bandWidth = baseVol * timeFactor * confScale;
    
    const price = pricePath[i];
    upperBand.push(price * (1 + upK * bandWidth));
    lowerBand.push(price * (1 - downK * bandWidth));
  }

  return { upperBand, lowerBand };
}

/**
 * Fallback forecast when no aftermath data available
 * Uses simple exponential model
 */
function buildFallbackForecast(currentPrice, R30, maxDD_WF, mcP95_DD, confidence) {
  const N = 30;
  const k = Math.log(1 + R30) / N;
  
  const pricePath = [];
  for (let i = 0; i < N; i++) {
    pricePath.push(currentPrice * Math.exp(k * (i + 1)));
  }

  const { upperBand, lowerBand } = buildAsymmetricBand(
    pricePath,
    maxDD_WF,
    mcP95_DD,
    confidence,
    N
  );

  const tailFloor = currentPrice * (1 - mcP95_DD);

  const keyDays = [
    { day: 0, price: currentPrice, return: 0 },
    { day: 7, price: pricePath[6], return: (pricePath[6] / currentPrice) - 1 },
    { day: 14, price: pricePath[13], return: (pricePath[13] / currentPrice) - 1 },
    { day: 30, price: pricePath[29], return: R30 }
  ];

  return {
    pricePath,
    upperBand,
    lowerBand,
    tailFloor,
    keyDays,
    confidence,
    R30,
    maxDD_WF,
    mcP95_DD,
    type: 'fallback-exponential'
  };
}
