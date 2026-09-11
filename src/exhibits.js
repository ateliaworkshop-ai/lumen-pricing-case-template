import { parseCsv } from "./csv.js";

export const LUMEN_PRICE = 2.19;
export const SINGLE_CAN = "Single can (330ml)";

export const CITY_NUTS = {
  Berlin: { code: "DE30", nutsName: "Berlin" },
  Munich: { code: "DE21", nutsName: "Oberbayern" },
  Hamburg: { code: "DE60", nutsName: "Hamburg" },
  Cologne: { code: "DEA2", nutsName: "Köln" },
  Frankfurt: { code: "DE71", nutsName: "Darmstadt" },
};

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function buildShelf(csvText) {
  const rows = parseCsv(csvText).filter((r) => r.format === SINGLE_CAN);
  const byChannel = new Map();
  for (const row of rows) {
    const list = byChannel.get(row.channel) ?? [];
    list.push({
      competitor: row.competitor,
      positioning: row.positioning,
      price: row.price_eur,
    });
    byChannel.set(row.channel, list);
  }
  for (const list of byChannel.values()) list.sort((a, b) => a.price - b.price);

  const retail = (byChannel.get("Retail/Grocery") ?? []).slice();
  const maxPrice = Math.max(
    LUMEN_PRICE,
    ...rows.map((r) => r.price_eur),
    3.2,
  );
  return { rows, byChannel, retail, maxPrice };
}

export function buildSeasonality(csvText) {
  const months = parseCsv(csvText).map((r) => ({
    month: r.month,
    label: MONTH_NAMES[r.month - 1] ?? String(r.month),
    index: r.seasonality_index_100_avg,
    temp: r.avg_temp_germany_celsius,
  }));
  const peak = months.reduce((a, b) => (a.index >= b.index ? a : b));
  const trough = months.reduce((a, b) => (a.index <= b.index ? a : b));
  const window = months.filter((m) => m.index >= 110);
  return { months, peak, trough, window };
}

export function seasonIndexFor(months, monthNumber) {
  if (!monthNumber) return 100;
  return months.find((m) => m.month === monthNumber)?.index ?? 100;
}

export function buildQuotes(csvText) {
  return parseCsv(csvText).map((r) => ({
    segment: r.segment,
    sentiment: r.sentiment,
    quote: String(r.quote).replace(/^"|"$/g, ""),
  }));
}

export function buildMarket(csvText) {
  const rows = parseCsv(csvText);
  const size = (name, year) =>
    rows.find(
      (r) =>
        r.dimension_type === "subcategory" &&
        String(r.name).startsWith(name) &&
        r.metric === "market_size_eur" &&
        r.year === year,
    )?.value ?? null;

  const regions = [];
  const seen = new Set();
  for (const r of rows.filter((row) => row.dimension_type === "region")) {
    if (seen.has(r.name)) continue;
    seen.add(r.name);
    const share = rows.find(
      (x) => x.name === r.name && x.metric === "population_share_of_market",
    )?.value;
    const cagr = rows.find(
      (x) => x.name === r.name && x.metric === "regional_cagr",
    )?.value;
    regions.push({ name: r.name, share, cagr });
  }
  regions.sort((a, b) => (b.share ?? 0) - (a.share ?? 0));

  return {
    adaptogenic2026: size("Plant-based", 2026),
    energy2026: size("Energy", 2026),
    regions,
  };
}

export function buildSurveyBridge(csvText) {
  const rows = parseCsv(csvText);
  const n = rows.length;
  const cities = new Map();
  const segments = new Map();
  for (const row of rows) {
    const city = row.city || "Unknown";
    const bucket = cities.get(city) ?? {
      city,
      n: 0,
      urban: 0,
      intent: 0,
      sens: 0,
    };
    bucket.n += 1;
    bucket.intent += Number(row.lumen_purchase_intent_1_10) || 0;
    bucket.sens += Number(row.price_sensitivity_1_10) || 0;
    if (String(row.segment).includes("Urban Wellness")) bucket.urban += 1;
    cities.set(city, bucket);
    segments.set(row.segment, (segments.get(row.segment) ?? 0) + 1);
  }
  const cityRows = [...cities.values()]
    .map((b) => ({
      ...b,
      share: n ? b.n / n : 0,
      urbanShare: b.n ? b.urban / b.n : 0,
      intent: b.n ? b.intent / b.n : 0,
      sens: b.n ? b.sens / b.n : 0,
      nuts: CITY_NUTS[b.city] ?? null,
    }))
    .sort((a, b) => b.n - a.n);
  return { n, cityRows, segments };
}

export function buildPromoPressure(csvText) {
  const rows = parseCsv(csvText);
  const byComp = new Map();
  for (const row of rows) {
    const bucket = byComp.get(row.competitor) ?? {
      competitor: row.competitor,
      months: 0,
      promo: 0,
    };
    bucket.months += 1;
    const flag = row.promo_active;
    if (flag === true || flag === "True" || flag === "true") bucket.promo += 1;
    byComp.set(row.competitor, bucket);
  }
  return [...byComp.values()].map((b) => ({
    ...b,
    promoShare: b.months ? b.promo / b.months : 0,
  }));
}

export function buildPromoEvents(csvText) {
  return parseCsv(csvText)
    .filter((r) => {
      const flag = r.promo_active;
      return flag === true || flag === "True" || flag === "true";
    })
    .map((r) => ({
      competitor: r.competitor,
      month: r.month,
      monthNum: Number(String(r.month).slice(5, 7)),
      discount: r.promo_discount_pct,
      shelf: r.shelf_price_eur,
    }))
    .sort((a, b) => String(a.month).localeCompare(String(b.month)));
}

export function vwNotExpensiveShare(rows, price, { column = "expensive_eur" } = {}) {
  if (!rows.length) return 0;
  return rows.filter((r) => Number(r[column]) > price).length / rows.length;
}

export function buildSegmentCards(surveyCsv, vwCsv, quotesCsv, price = LUMEN_PRICE) {
  const survey = parseCsv(surveyCsv);
  const vw = parseCsv(vwCsv);
  const quotes = buildQuotes(quotesCsv);
  const n = survey.length || 1;
  const bySeg = new Map();

  for (const row of survey) {
    const segment = row.segment;
    const bucket = bySeg.get(segment) ?? {
      segment,
      n: 0,
      intent: 0,
      sens: 0,
      freq: 0,
      channels: new Map(),
    };
    bucket.n += 1;
    bucket.intent += Number(row.lumen_purchase_intent_1_10) || 0;
    bucket.sens += Number(row.price_sensitivity_1_10) || 0;
    bucket.freq += Number(row.purchase_frequency_per_month) || 0;
    bucket.channels.set(
      row.preferred_channel,
      (bucket.channels.get(row.preferred_channel) ?? 0) + 1,
    );
    bySeg.set(segment, bucket);
  }

  const vwBySeg = new Map();
  for (const row of vw) {
    const list = vwBySeg.get(row.segment) ?? [];
    list.push(row);
    vwBySeg.set(row.segment, list);
  }

  return [...bySeg.values()]
    .map((b) => {
      const vwRows = vwBySeg.get(b.segment) ?? [];
      const preferred = [...b.channels.entries()].sort((a, c) => c[1] - a[1])[0];
      return {
        segment: b.segment,
        n: b.n,
        share: b.n / n,
        intent: b.n ? b.intent / b.n : 0,
        sens: b.n ? b.sens / b.n : 0,
        freq: b.n ? b.freq / b.n : 0,
        preferredChannel: preferred?.[0] ?? "—",
        preferredShare: preferred && b.n ? preferred[1] / b.n : 0,
        notExpensive: vwNotExpensiveShare(vwRows, price),
        quotes: quotes.filter((q) => q.segment === b.segment),
      };
    })
    .sort((a, b) => b.share - a.share);
}

export function buildAwareness(surveyCsv) {
  const rows = parseCsv(surveyCsv);
  const n = rows.length || 1;
  return {
    n,
    pulsup: rows.filter((r) => r.aware_pulsup).length / n,
    matelibre: rows.filter((r) => r.aware_matelibre).length / n,
    voltfit: rows.filter((r) => r.aware_voltfit).length / n,
    rootandrise: rows.filter((r) => r.aware_rootandrise).length / n,
    intent7: rows.filter((r) => r.lumen_purchase_intent_1_10 >= 7).length / n,
  };
}
