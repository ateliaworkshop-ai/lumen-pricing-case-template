import { parseCsv } from "./csv.js";
import { buildFunnelView } from "./funnel.js";

export const SALES_CHANNELS = ["DTC Online", "Retail/Grocery", "Gym & Office"];
export const PRICE_PICKS = [1.79, 2.19, 2.59];
export const PRICE_MIN = 1.49;
export const PRICE_MAX = 2.79;
export const LTV_CAC_TARGET = 3;
export const DATA_LTV_MONTHS = 18;
export const DEFAULT_YEAR1_BUDGET = 400000;

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
    marketingCacs: funnel.byChannel,
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

export function weightedMarketingCac(marketingCacs, shares) {
  let spend = 0;
  let customers = 0;
  for (const row of marketingCacs) {
    const w = Number(shares?.[row.channel]) || 0;
    if (w <= 0 || !(row.cac > 0)) continue;
    spend += w;
    customers += w / row.cac;
  }
  if (customers <= 0) {
    const tot = marketingCacs.reduce((s, r) => s + r.spend, 0);
    const cust = marketingCacs.reduce((s, r) => s + r.customers, 0);
    return cust > 0 ? tot / cust : 0;
  }
  return spend / customers;
}

export const REC = {
  price: 2.19,
  channelShares: {
    "DTC Online": 15,
    "Retail/Grocery": 45,
    "Gym & Office": 40,
  },
  lifetimeMonths: DATA_LTV_MONTHS,
  regionCode: "DE21",
};

export function simulateCockpit(data, inputs) {
  const price = Number(inputs.price);
  const lifetime = Math.max(1, Number(inputs.lifetimeMonths) || DATA_LTV_MONTHS);
  const budget = Math.max(0, Number(inputs.year1Budget) || 0);
  const { shares, total: shareSum } = normalizeShares(inputs.channelShares);
  const funded = SALES_CHANNELS.filter((ch) => shares[ch] > 0);
  const cac = Number(inputs.cac) > 0 ? Number(inputs.cac) : data.blendedCac;

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
    const customers = cac > 0 ? spend / cac : 0;
    const monthsActive = Math.min(12, lifetime);
    const units = customers * data.freq * monthsActive;
    const ltv = monthlyValue(econ.contribution) * lifetime;
    const ratio = cac > 0 ? ltv / cac : 0;
    const payback =
      monthlyValue(econ.contribution) > 0
        ? cac / monthlyValue(econ.contribution)
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
  const blendRatio = cac > 0 ? blendLtv / cac : 0;
  const blendPayback =
    monthlyValue(blendContrib) > 0
      ? cac / monthlyValue(blendContrib)
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
    cac,
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

export function defaultMarketingShares(marketingCacs) {
  return Object.fromEntries(
    marketingCacs.map((row) => [row.channel, Math.round(row.spendShare * 100)]),
  );
}

export function tensionScores(sim, data) {
  const cfo = Math.round(100 * Math.min(1.15, sim.blendRatio / LTV_CAC_TARGET));

  let premium = 0;
  if (sim.price >= 2.1 && sim.price <= 2.7) premium = 100;
  else if (sim.price < 2.1) {
    premium = Math.max(0, Math.round((100 * (sim.price - 1.4)) / 0.7));
  } else {
    premium = Math.max(0, Math.round(100 - (sim.price - 2.7) * 80));
  }

  const urban = data.vw.filter((r) =>
    String(r.segment).includes("Urban Wellness"),
  );
  const urbanComfort =
    urban.length === 0
      ? 0
      : urban.filter(
          (r) => r.too_cheap_eur < sim.price && sim.price < r.too_expensive_eur,
        ).length / urban.length;

  const cmo = Math.round(0.65 * premium + 0.35 * urbanComfort * 100);

  return {
    cfo: Math.max(0, Math.min(100, cfo)),
    cmo: Math.max(0, Math.min(100, cmo)),
    premium,
    urbanComfort,
  };
}

export function sensitivityTornado(data, baseInputs) {
  const base = simulateCockpit(data, baseInputs);
  const mkt = data.marketingCacs;
  const def = defaultMarketingShares(mkt);
  const tilt = (samplingPct, referralPct) =>
    Object.fromEntries(
      mkt.map((row) => {
        if (String(row.channel).includes("Sampling")) {
          return [row.channel, samplingPct];
        }
        if (String(row.channel).includes("Referral")) {
          return [row.channel, referralPct];
        }
        return [row.channel, def[row.channel]];
      }),
    );

  const scenarios = [
    { label: "Price €1.79", patch: { price: 1.79 } },
    { label: "Price €2.59", patch: { price: 2.59 } },
    { label: "Lifetime 12 months", patch: { lifetimeMonths: 12 } },
    { label: "Lifetime 24 months", patch: { lifetimeMonths: 24 } },
    {
      label: "All Retail/Grocery",
      patch: {
        channelShares: {
          "DTC Online": 0,
          "Retail/Grocery": 100,
          "Gym & Office": 0,
        },
      },
    },
    {
      label: "All DTC Online",
      patch: {
        channelShares: {
          "DTC Online": 100,
          "Retail/Grocery": 0,
          "Gym & Office": 0,
        },
      },
    },
    {
      label: "Referral-heavy CAC",
      patch: { mktShares: tilt(20, 70) },
    },
    {
      label: "Sampling-heavy CAC",
      patch: { mktShares: tilt(80, 10) },
    },
  ];

  return scenarios
    .map((s) => {
      const inputs = {
        ...baseInputs,
        ...s.patch,
      };
      if (s.patch.mktShares) {
        inputs.cac = weightedMarketingCac(mkt, s.patch.mktShares);
      }
      const sim = simulateCockpit(data, inputs);
      return {
        label: s.label,
        patch: s.patch,
        dRatio: sim.blendRatio - base.blendRatio,
        ratio: sim.blendRatio,
      };
    })
    .sort((a, b) => Math.abs(b.dRatio) - Math.abs(a.dRatio));
}

export function vsRecommendation(sim, recSim, regionCode, mktShares, defaultMkt) {
  const onPrice = Math.abs(sim.price - REC.price) < 0.005;
  const onLife = sim.lifetime === REC.lifetimeMonths;
  const onRegion = !regionCode || regionCode === REC.regionCode;
  const onMix = SALES_CHANNELS.every(
    (ch) =>
      Math.abs(
        (sim.channels.find((c) => c.channel === ch)?.share ?? 0) * 100 -
          REC.channelShares[ch],
      ) < 1.5,
  );
  const onMkt =
    !mktShares ||
    !defaultMkt ||
    Object.keys(defaultMkt).every(
      (ch) =>
        Math.abs((Number(mktShares[ch]) || 0) - (Number(defaultMkt[ch]) || 0)) <
        1.5,
    );
  return {
    onRec: onPrice && onLife && onRegion && onMix && onMkt,
    dPrice: sim.price - REC.price,
    dAcceptance: sim.acceptance - recSim.acceptance,
    dContrib: sim.blendContrib - recSim.blendContrib,
    dRatio: sim.blendRatio - recSim.blendRatio,
    dCac: sim.cac - recSim.cac,
  };
}
