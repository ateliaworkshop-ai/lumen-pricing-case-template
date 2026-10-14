// Recomputes every figure the LUMEN brief takes from the data room, and fails if one drifts.
// Rule from the ESCP edition (09/2026): a brief figure is checked against the files before the case is published.
// Usage: node scripts/check-brief.mjs   (no dependencies)
import { readFileSync } from "node:fs";

const read = (f) => {
  const [head, ...rows] = readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8").trim().split(/\r?\n/);
  const cols = head.split(",");
  return { raw: rows, rows: rows.map((r) => Object.fromEntries(r.split(",").map((v, i) => [cols[i], v]))) };
};
const brief = readFileSync(new URL("../LUMEN_Case_Brief.md", import.meta.url), "utf8");
let failed = 0;
const check = (label, ok, detail) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
  if (!ok) failed++;
};
const near = (a, b, tol) => Math.abs(a - b) <= tol;

// Exhibit 6: weekly sales
// The duplicate rows are a deliberate imperfection (data/README_data.md): figures are computed without them.
const all = read("historical_sales_weekly.csv");
const dupes = all.raw.length - new Set(all.raw).size;
check("the 4 deliberate duplicate rows are still there", dupes === 4, `${dupes} duplicates`);
const sales = { rows: [...new Set(all.raw)].map((r) => all.rows[all.raw.indexOf(r)]) };
const weeks = [...new Set(sales.rows.map((r) => r.week_start_date))].sort();
check("78 weeks of sales", weeks.length === 78 && /78 weeks/.test(brief), `${weeks.length} weeks`);
const last52 = new Set(weeks.slice(-52));
const ttm = sales.rows.filter((r) => last52.has(r.week_start_date)).reduce((s, r) => s + Number(r.revenue_eur), 0);
const total = sales.rows.reduce((s, r) => s + Number(r.revenue_eur), 0);
const stated = brief.match(/€([\d.]+)M in trailing-twelve-month revenue/);
check("trailing-twelve-month revenue in the brief", stated && near(Number(stated[1]) * 1e6, ttm, 0.05e6), `data €${(ttm / 1e6).toFixed(2)}M, brief ${stated ? `€${stated[1]}M` : "missing"}`);
const statedTotal = brief.match(/€([\d.]+)M over the 78 weeks/);
check("78-week revenue in the brief", statedTotal && near(Number(statedTotal[1]) * 1e6, total, 0.05e6), `data €${(total / 1e6).toFixed(2)}M, brief ${statedTotal ? `€${statedTotal[1]}M` : "missing"}`);

// Exhibit 7: funnel
const funnel = read("marketing_funnel_monthly.csv").rows;
const spend = funnel.reduce((s, r) => s + Number(r.spend_eur), 0);
const customers = funnel.reduce((s, r) => s + Number(r.conversions_customers_acquired), 0);
const cac = spend / customers;
check("blended CAC ≈ €44", /CAC across all marketing channels ≈ \*\*€44\*\*/.test(brief) && near(cac, 44, 1.5), `data €${cac.toFixed(2)}`);
const ltv = funnel.reduce((s, r) => s + Number(r.ltv_estimate_eur) * Number(r.conversions_customers_acquired), 0) / customers;
check("LTV:CAC ≈ 3:1", /≈\s*\n?\*\*3:1\*\*/.test(brief) && near(ltv / cac, 3, 0.35), `data ${(ltv / cac).toFixed(2)}:1`);
const months = new Set(funnel.map((r) => r.month)).size;
check("18 months of funnel data", months === 18, `${months} months`);

// Exhibit 8: costs
const margin = read("cost_breakdown.csv").raw.find((r) => r.includes("gross margin"));
check("blended gross margin ≈ 30%", margin && /,30(\.0)?,?$/.test(margin) && /margin, home markets ≈ \*\*30%\*\*/.test(brief));

// Exhibit 4 and 10: survey sizes
const survey = read("customer_survey.csv").rows.length;
check("~420 survey respondents", near(survey, 420, 10), `${survey}`);
const vw = read("price_sensitivity_survey.csv").rows.length;
check("~300 price-sensitivity respondents", near(vw, 300, 10), `${vw}`);

// Exhibit 3: competitor history
const compMonths = new Set(read("competitor_price_history.csv").rows.map((r) => r.month)).size;
check("12 months of competitor prices", compMonths === 12, `${compMonths} months`);

// Exhibit 11: the price table in the brief
const tests = read("price_test_results.csv").rows;
for (const price of ["1.79", "2.19", "2.59"]) {
  const rows = tests.filter((r) => r.price_eur === price);
  const acc = rows[0].estimated_acceptance_pct_of_survey;
  const contrib = rows.map((r) => Number(r.unit_contribution_eur));
  const lo = Math.min(...contrib).toFixed(2), hi = Math.max(...contrib).toFixed(2);
  const line = brief.split("\n").find((l) => l.startsWith(`| €${price} |`)) ?? "";
  check(`€${price}: acceptance ${acc}%, contribution €${lo}–€${hi}`, line.includes(`${acc}%`) && line.includes(`€${lo}–€${hi}`), line.trim() || "row missing");
}

console.log(failed ? `\n${failed} figure(s) do not match the data.` : "\nEvery figure in the brief matches the data.");
process.exit(failed ? 1 : 0);
