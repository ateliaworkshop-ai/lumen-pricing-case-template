import {
  interpolateAcceptance,
  simulateCockpit,
  REC,
} from "./cockpit.js";

export function buildPriceCacView(data, inputs) {
  const budget = inputs.year1Budget;
  const lifetime = inputs.lifetimeMonths;
  const cac = inputs.cac;
  const channelShares = inputs.channelShares ?? REC.channelShares;
  const refPrice = REC.price;
  const refAcc = interpolateAcceptance(refPrice, data.acceptanceKnots);

  function pointAt(p) {
    const acc = interpolateAcceptance(p, data.acceptanceKnots);
    const fixed = simulateCockpit(data, {
      price: p,
      channelShares,
      year1Budget: budget,
      lifetimeMonths: lifetime,
      cac,
    });
    const scaledCac = acc > 0 ? cac * (refAcc / acc) : cac;
    const hard = simulateCockpit(data, {
      price: p,
      channelShares,
      year1Budget: budget,
      lifetimeMonths: lifetime,
      cac: scaledCac,
    });
    return {
      price: p,
      acceptance: acc,
      fixedNet: fixed.year1Net,
      hardNet: hard.year1Net,
    };
  }

  const series = [];
  for (let p = 1.5; p <= 3.001; p = Number((p + 0.02).toFixed(2))) {
    series.push(pointAt(p));
  }
  if (!series.some((row) => Math.abs(row.price - refPrice) < 1e-9)) {
    series.push(pointAt(refPrice));
    series.sort((a, b) => a.price - b.price);
  }

  const hardPeak = series.reduce((a, b) => (a.hardNet >= b.hardNet ? a : b));
  const rec = series.reduce((best, row) =>
    Math.abs(row.price - refPrice) < Math.abs(best.price - refPrice) ? row : best,
  );
  const plateau = series.filter(
    (row) => hardPeak.hardNet - row.hardNet <= Math.abs(hardPeak.hardNet) * 0.04 + 4000,
  );
  const plateauMin = plateau[0]?.price ?? hardPeak.price;
  const plateauMax = plateau[plateau.length - 1]?.price ?? hardPeak.price;

  return {
    series,
    hardPeak,
    rec,
    plateauMin,
    plateauMax,
    refAcc,
    cac,
    budget,
  };
}
