import { parseCsv } from "./csv.js";
import { buildFunnelView } from "./funnel.js";

export const SALES_CHANNELS = ["DTC Online", "Retail/Grocery", "Gym & Office"];
export const PRICE_PICKS = [1.79, 2.19, 2.59];
export const LTV_CAC_TARGET = 3;
export const DATA_LTV_MONTHS = 18;

export function loadCockpitData({
  priceTestCsv,
  economicsCsv,
  costCsv,
  funnelCsv,
  surveyCsv,
  vwCsv,
}) {
  const priceTest = parseCsv(priceTestCsv);
  const economics = parseCsv(economicsCsv);
  const costs = parseCsv(costCsv);
  const survey = parseCsv(surveyCsv);
  const vw = parseCsv(vwCsv);
  const funnel = buildFunnelView(funnelCsv);

  const cogsRow = costs.find((r) =>
    String(r.cost_component).startsWith("TOTAL COGS"),
  );
  const cogs = cogsRow?.cost_per_unit_eur ?? 0.62;

  const takeRates = {};
  for (const channel of SALES_CHANNELS) {
    const row = economics.find((r) => r.channel === channel);
    takeRates[channel] = {
      retailer: row.retailer_margin_pct,
      distributor: row.distributor_cut_pct,
      payment: row.payment_processing_pct,
      fulfillment: row.fulfillment_cost_eur,
    };
  }

  const acceptanceKnots = [...new Set(priceTest.map((r) => r.price_eur))]
    .sort((a, b) => a - b)
    .map((price) => ({
      price,
      acceptance: priceTest.find((r) => r.price_eur === price)
        .estimated_acceptance_pct_of_survey,
    }));

  const freq =
    survey.reduce((s, r) => s + r.purchase_frequency_per_month, 0) /
    survey.length;

  return {
    cogs,
    takeRates,
    acceptanceKnots,
    blendedCac: funnel.blendedCac,
    dataLtv: funnel.blendedLtv,
    freq,
    survey,
    vw,
  };
}

export function interpolateAcceptance(price, knots) {
  if (!knots.length) return 0;
  if (price <= knots[0].price) return knots[0].acceptance;
  if (price >= knots[knots.length - 1].price) {
    return knots[knots.length - 1].acceptance;
  }
  for (let i = 0; i < knots.length - 1; i++) {
    const a = knots[i];
    const b = knots[i + 1];
    if (price >= a.price && price <= b.price) {
      const t = (price - a.price) / (b.price - a.price);
      return a.acceptance + t * (b.acceptance - a.acceptance);
    }
  }
  return knots[knots.length - 1].acceptance;
}

export function unitEconomics(price, channel, takeRates, cogs) {
  const t = takeRates[channel];
  const net =
    price * (1 - t.retailer - t.distributor - t.payment) - t.fulfillment;
  const contribution = net - cogs;
  const margin = net > 0 ? (contribution / net) * 100 : 0;
  return { net, contribution, margin };
}

export function blendedContribution(price, channels, takeRates, cogs) {
  if (!channels.length) return null;
  const parts = channels.map((ch) => unitEconomics(price, ch, takeRates, cogs));
  return parts.reduce((s, p) => s + p.contribution, 0) / parts.length;
}

function normalizeShares(shares) {
  const total = SALES_CHANNELS.reduce((s, ch) => s + (Number(shares[ch]) || 0), 0);
  if (total <= 0) {
    return { shares: Object.fromEntries(SALES_CHANNELS.map((c) => [c, 0])), total: 0 };
  }
  return {
    shares: Object.fromEntries(
      SALES_CHANNELS.map((c) => [c, (Number(shares[c]) || 0) / total]),
    ),
    total,
  };
}

export function simulateCockpit(data, inputs) {
  const price = Number(inputs.price);
  const lifetime = Math.max(1, Number(inputs.lifetimeMonths) || DATA_LTV_MONTHS);
  const budget = Math.max(0, Number(inputs.year1Budget) || 0);
  const { shares, total: shareSum } = normalizeShares(inputs.channelShares);
  const funded = SALES_CHANNELS.filter((ch) => shares[ch] > 0);

  const acceptance = interpolateAcceptance(price, data.acceptanceKnots);
  const blend = blendedContribution(
    price,
    funded.length ? funded : SALES_CHANNELS,
    data.takeRates,
    data.cogs,
  );

  const ltvScale = lifetime / DATA_LTV_MONTHS;
  const monthlyValue = (contribution) => contribution * data.freq;

  const channels = SALES_CHANNELS.map((channel) => {
    const econ = unitEconomics(price, channel, data.takeRates, data.cogs);
    const spend = budget * shares[channel];
    const customers = data.blendedCac > 0 ? spend / data.blendedCac : 0;
    const monthsActive = Math.min(12, lifetime);
    const units = customers * data.freq * monthsActive;
    const ltv = monthlyValue(econ.contribution) * lifetime;
    const ratio = data.blendedCac > 0 ? ltv / data.blendedCac : 0;
    const payback =
      monthlyValue(econ.contribution) > 0
        ? data.blendedCac / monthlyValue(econ.contribution)
        : Infinity;
    const year1Net = units * econ.contribution - spend;
    let verdict = "below";
    if (ratio >= LTV_CAC_TARGET) verdict = "clears 3:1";
    else if (ratio >= 2.5) verdict = "close";
    return {
      channel,
      share: shares[channel],
      funded: shares[channel] > 0,
      ...econ,
      spend,
      customers,
      units,
      ltv,
      ratio,
      payback,
      year1Net,
      verdict,
    };
  });

  const fundedRows = channels.filter((c) => c.funded);
  const customers = fundedRows.reduce((s, c) => s + c.customers, 0);
  const units = fundedRows.reduce((s, c) => s + c.units, 0);
  const revenue = units * price;
  const year1Net = fundedRows.reduce((s, c) => s + c.year1Net, 0);
  const blendContrib =
    fundedRows.length > 0
      ? fundedRows.reduce((s, c) => s + c.contribution * c.share, 0) /
        fundedRows.reduce((s, c) => s + c.share, 0)
      : blend;
  const blendLtv = monthlyValue(blendContrib) * lifetime;
  const blendRatio = data.blendedCac > 0 ? blendLtv / data.blendedCac : 0;
  const blendPayback =
    monthlyValue(blendContrib) > 0
      ? data.blendedCac / monthlyValue(blendContrib)
      : Infinity;

  return {
    price,
    acceptance,
    blendContrib,
    blendRatio,
    blendPayback,
    customers,
    units,
    revenue,
    year1Net,
    channels,
    fundedRows,
    shareSum,
    renormalized: Math.abs(shareSum - 100) > 0.05 && shareSum > 0,
    lifetime,
    ltvScale,
    budget,
    fundedNames: funded,
  };
}

export function computeGivesUp(data, price, fundedNames) {
  const funded = new Set(fundedNames);
  const survey = data.survey.filter((r) => r.preferred_channel);
  const n = survey.length || 1;
  const channelWalkaway = SALES_CHANNELS.map((channel) => {
    const fans = survey.filter((r) => r.preferred_channel === channel);
    return {
      channel,
      preferShare: fans.length / n,
      funded: funded.has(channel),
    };
  });

  const bySegment = new Map();
  for (const row of data.vw) {
    const segment = row.segment;
    const bucket = bySegment.get(segment) ?? {
      segment,
      n: 0,
      inBand: 0,
      tooExpensive: 0,
    };
    bucket.n += 1;
    if (price > row.too_cheap_eur && price < row.too_expensive_eur) {
      bucket.inBand += 1;
    }
    if (price >= row.too_expensive_eur) bucket.tooExpensive += 1;
    bySegment.set(segment, bucket);
  }

  const segments = [...bySegment.values()]
    .map((b) => ({
      segment: b.segment,
      n: b.n,
      comfort: b.n ? b.inBand / b.n : 0,
      tooExpensive: b.n ? b.tooExpensive / b.n : 0,
    }))
    .sort((a, b) => a.comfort - b.comfort);

  const unfundedPref = channelWalkaway.filter((c) => !c.funded && c.preferShare > 0);
  const prefShareUnfunded = unfundedPref.reduce((s, c) => s + c.preferShare, 0);

  return { channelWalkaway, segments, prefShareUnfunded, unfundedPref };
}
