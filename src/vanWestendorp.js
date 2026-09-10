/**
 * Van Westendorp Price Sensitivity Meter from the four threshold columns.
 *
 * Cumulative shares at price P:
 *   too cheap     — % whose too_cheap >= P  (falls as P rises)
 *   cheap         — % whose cheap >= P
 *   expensive     — % whose expensive <= P  (rises as P rises)
 *   too expensive — % whose too_expensive <= P
 *
 * Intersections (standard):
 *   PMC = too cheap ∩ expensive
 *   PME = cheap ∩ too expensive
 *   IPP = cheap ∩ expensive
 *   OPP = too cheap ∩ too expensive
 * Acceptable range = PMC–PME.
 */

const STEP = 0.02;

export function buildVanWestendorp(rows) {
  const read = rows.length;
  const valid = [];
  let droppedOrder = 0;
  let droppedMissing = 0;

  for (const row of rows) {
    const tooCheap = Number(row.too_cheap_eur);
    const cheap = Number(row.cheap_eur);
    const expensive = Number(row.expensive_eur);
    const tooExpensive = Number(row.too_expensive_eur);
    if (![tooCheap, cheap, expensive, tooExpensive].every(Number.isFinite)) {
      droppedMissing += 1;
      continue;
    }
    if (!(tooCheap <= cheap && cheap <= expensive && expensive <= tooExpensive)) {
      droppedOrder += 1;
      continue;
    }
    valid.push({ tooCheap, cheap, expensive, tooExpensive });
  }

  const n = valid.length;
  if (n === 0) {
    throw new Error("No usable Van Westendorp rows");
  }

  const minP = Math.min(...valid.map((r) => r.tooCheap));
  const maxP = Math.max(...valid.map((r) => r.tooExpensive));
  const prices = [];
  for (let p = round2(minP); p <= maxP + 1e-9; p = round2(p + STEP)) {
    prices.push(p);
  }

  const tooCheap = prices.map(
    (p) => (100 * valid.filter((r) => r.tooCheap >= p).length) / n,
  );
  const cheap = prices.map(
    (p) => (100 * valid.filter((r) => r.cheap >= p).length) / n,
  );
  const expensive = prices.map(
    (p) => (100 * valid.filter((r) => r.expensive <= p).length) / n,
  );
  const tooExpensive = prices.map(
    (p) => (100 * valid.filter((r) => r.tooExpensive <= p).length) / n,
  );

  const pmc = firstCrossing(prices, tooCheap, expensive);
  const pme = firstCrossing(prices, cheap, tooExpensive);
  const ipp = firstCrossing(prices, cheap, expensive);
  let opp = firstCrossing(prices, tooCheap, tooExpensive);
  let oppNote = null;

  if (!opp) {
    const lastTooCheap = lastPriceWhere(prices, tooCheap, (y) => y > 0);
    const firstTooExp = prices.find((_, i) => tooExpensive[i] > 0);
    if (lastTooCheap != null && firstTooExp != null) {
      opp = {
        price: (lastTooCheap + firstTooExp) / 2,
        share: 0,
        inferred: true,
      };
      oppNote = `Too Cheap reaches 0% at €${lastTooCheap.toFixed(2)} before Too Expensive leaves 0% at €${firstTooExp.toFixed(2)}, so the curves do not intersect. OPP is shown as the midpoint of that gap.`;
    }
  }

  return {
    n,
    read,
    droppedOrder,
    droppedMissing,
    prices,
    curves: { tooCheap, cheap, expensive, tooExpensive },
    pmc,
    pme,
    ipp,
    opp,
    oppNote,
  };
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function lastPriceWhere(prices, series, pred) {
  for (let i = series.length - 1; i >= 0; i--) {
    if (pred(series[i])) return prices[i];
  }
  return null;
}

/** First crossing of series A and B, skipping the both-near-zero region. */
function firstCrossing(prices, a, b) {
  for (let i = 0; i < prices.length - 1; i++) {
    const nearZero = a[i] + b[i] < 0.5 && a[i + 1] + b[i + 1] < 0.5;
    if (nearZero) continue;
    const d0 = a[i] - b[i];
    const d1 = a[i + 1] - b[i + 1];
    if (d0 === 0) {
      return { price: prices[i], share: a[i] };
    }
    if (d0 * d1 < 0) {
      const t = d0 / (d0 - d1);
      return {
        price: prices[i] + t * (prices[i + 1] - prices[i]),
        share: a[i] + t * (a[i + 1] - a[i]),
      };
    }
  }
  return null;
}
