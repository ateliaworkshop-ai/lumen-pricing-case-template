import { parseCsv } from "./csv.js";

const TARGET_LTV_CAC = 3;

/**
 * marketing_funnel_monthly.csv is 18 months × 4 marketing channels (72 rows).
 * This file has no duplicate month+channel keys, and cac_eur matches
 * spend ÷ conversions on every row.
 *
 * The data-room README warns about duplicate rows and an unusual spike week.
 * Those issues are in historical_sales_weekly.csv (home-market weekly sales),
 * not in this funnel file — so nothing is dropped or adjusted here.
 */
export function buildFunnelView(csvText) {
  const rows = parseCsv(csvText);
  const seen = new Set();
  const clean = [];

  for (const row of rows) {
    const key = `${row.month}|${row.channel}`;
    if (seen.has(key)) continue;
    seen.add(key);
    clean.push(row);
  }

  const dropped = rows.length - clean.length;

  const spend = sum(clean, (r) => r.spend_eur);
  const customers = sum(clean, (r) => r.conversions_customers_acquired);
  const blendedCac = spend / customers;
  const blendedLtv =
    sum(clean, (r) => r.ltv_estimate_eur * r.conversions_customers_acquired) /
    customers;
  const ltvCac = blendedLtv / blendedCac;

  const byMonth = new Map();
  for (const row of clean) {
    const bucket = byMonth.get(row.month) ?? {
      month: row.month,
      spend: 0,
      customers: 0,
      ltvWeighted: 0,
    };
    bucket.spend += row.spend_eur;
    bucket.customers += row.conversions_customers_acquired;
    bucket.ltvWeighted +=
      row.ltv_estimate_eur * row.conversions_customers_acquired;
    byMonth.set(row.month, bucket);
  }

  const series = [...byMonth.values()]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((bucket) => {
      const cac = bucket.spend / bucket.customers;
      const ltv = bucket.ltvWeighted / bucket.customers;
      return {
        month: bucket.month,
        label: formatMonth(bucket.month),
        cac,
        ltvCac: ltv / cac,
      };
    });

  return {
    target: TARGET_LTV_CAC,
    blendedCac,
    blendedLtv,
    ltvCac,
    meetsTarget: ltvCac >= TARGET_LTV_CAC,
    series,
    marketingChannels: [...new Set(clean.map((r) => r.channel))].sort(),
    dataNote: {
      rowsRead: rows.length,
      rowsUsed: clean.length,
      dropped,
    },
  };
}

function sum(rows, pick) {
  return rows.reduce((total, row) => total + pick(row), 0);
}

function formatMonth(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}
