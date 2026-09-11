// The generated asset contains no personal fields: customer survey output is deliberately limited to four non-PII fields.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dataDir = join(root, 'data');
const outputFile = join(root, 'assets', 'data.json');
const prices = [1.79, 2.19, 2.59];

function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i += 1; }
      else quoted = !quoted;
    } else if (c === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell); cell = '';
      if (row.some(value => value !== '')) rows.push(row);
      row = [];
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [headers, ...body] = rows;
  return body.map(values => Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ''])));
}

const number = value => value === '' ? null : Number(value);
const round = (value, places = 2) => value == null || Number.isNaN(value) ? null : Number(value.toFixed(places));
const readCsv = async name => parseCsv(await readFile(join(dataDir, name), 'utf8'));
const toNumbers = (row, keys) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, keys.includes(key) ? number(value) : value]));

const [market, economics, survey, sensitivity, tests, sales] = await Promise.all([
  readCsv('market_context.csv'), readCsv('channel_economics.csv'), readCsv('customer_survey.csv'),
  readCsv('price_sensitivity_survey.csv'), readCsv('price_test_results.csv'), readCsv('historical_sales_weekly.csv'),
]);

const dataQuality = [];
const salesKeys = new Set();
const cleanSales = [];
for (const row of sales) {
  const key = JSON.stringify(row);
  if (salesKeys.has(key)) continue;
  salesKeys.add(key);
  cleanSales.push(toNumbers(row, ['units_sold', 'revenue_eur']));
}
const duplicateCount = sales.length - cleanSales.length;
console.log(`Removed ${duplicateCount} exact duplicate rows from historical_sales_weekly.csv`);
if (duplicateCount !== 4) dataQuality.push({ type: 'unexpected_duplicate_count', source: 'historical_sales_weekly.csv', expected: 4, found: duplicateCount });
else dataQuality.push({ type: 'duplicate_rows_removed', source: 'historical_sales_weekly.csv', count: duplicateCount });

const cleanSurvey = survey.map(row => ({
  segment: row.segment, city: row.city,
  purchase_frequency_per_month: number(row.purchase_frequency_per_month), preferred_channel: row.preferred_channel,
}));
const segments = [...new Set(sensitivity.map(row => row.segment))].sort();
const priceSensitivityBySegment = Object.fromEntries(segments.map(segment => {
  const rows = sensitivity.filter(row => row.segment === segment);
  let previous = null;
  const byPrice = prices.map((price, index) => {
    const accepted = rows.filter(row => number(row.too_cheap_eur) <= price && price <= number(row.expensive_eur)).length;
    const hardAccepted = rows.filter(row => number(row.too_expensive_eur) > price).length;
    const comfortable = rows.filter(row => number(row.expensive_eur) > price).length;
    const acceptancePct = round(100 * accepted / rows.length, 1);
    const dropoff = previous == null ? null : round(previous - acceptancePct, 1);
    previous = acceptancePct;
    return { price_eur: price, acceptance_pct: acceptancePct, dropoff_vs_previous: dropoff, hard_acceptance: round(hardAccepted / rows.length, 3), comfort_acceptance: round(comfortable / rows.length, 3) };
  });
  return [segment, byPrice];
}));
const segmentShares = Object.fromEntries(segments.map(segment => [segment, sensitivity.filter(row => row.segment === segment).length / sensitivity.length]));
const blendedPriceSensitivity = prices.map((price, index) => ({
  price_eur: price,
  acceptance_pct: round(segments.reduce((sum, segment) => sum + priceSensitivityBySegment[segment][index].acceptance_pct * segmentShares[segment], 0), 1),
  hard_acceptance: round(segments.reduce((sum, segment) => sum + priceSensitivityBySegment[segment][index].hard_acceptance * segmentShares[segment], 0), 3),
  comfort_acceptance: round(segments.reduce((sum, segment) => sum + priceSensitivityBySegment[segment][index].comfort_acceptance * segmentShares[segment], 0), 3),
}));

const channelEconomics = Object.fromEntries([...new Set(economics.map(row => row.channel))].map(channel => {
  const row = economics.find(item => item.channel === channel);
  return [channel, { retailer_margin_pct: round(number(row.retailer_margin_pct), 3), distributor_cut_pct: round(number(row.distributor_cut_pct), 3), payment_processing_pct: round(number(row.payment_processing_pct), 3), fulfilment_cost_per_can: round(number(row.fulfillment_cost_eur), 2), by_price: Object.fromEntries(tests.filter(item => item.channel === channel).map(item => [item.price_eur, { net_price_to_lumen_eur: round(number(item.net_price_to_lumen_eur)), unit_contribution_eur: round(number(item.unit_contribution_eur)) }])) }];
}));

const payback = [];
for (const test of tests) {
  const frequencyBySegment = Object.fromEntries(segments.map(segment => {
    const rows = cleanSurvey.filter(row => row.segment === segment);
    return [segment, rows.reduce((sum, row) => sum + row.purchase_frequency_per_month, 0) / rows.length];
  }));
  const cans = round(44 / number(test.unit_contribution_eur), 2);
  payback.push({ price_eur: number(test.price_eur), channel: test.channel, segment_payback_months: Object.fromEntries(segments.map(segment => [segment, round(cans / frequencyBySegment[segment], 2)])), cans_to_repay_cac: cans });
}

const expectedAcceptance = Object.fromEntries(tests.map(row => [`${row.price_eur}|${row.channel}`, number(row.estimated_acceptance_pct_of_survey)]));
for (const price of prices) {
  const overall = sensitivity.filter(row => number(row.too_cheap_eur) <= price && price <= number(row.expensive_eur)).length / sensitivity.length * 100;
  const expected = expectedAcceptance[`${price}|DTC Online`];
  if (expected != null && Math.abs(overall - expected) > 0.1) dataQuality.push({ type: 'acceptance_discrepancy', price_eur: price, computed_pct: round(overall, 1), source_pct: expected, note: 'Computed from too_cheap_eur through expensive_eur by the documented survey rule.' });
}
for (const test of tests) {
  const economicsRow = economics.find(row => row.channel === test.channel && Math.abs(number(row.illustrative_retail_price_eur) - number(test.price_eur)) < 0.001);
  if (!economicsRow) { dataQuality.push({ type: 'missing_channel_economics', price_eur: number(test.price_eur), channel: test.channel }); continue; }
  const net = number(test.price_eur) * (1 - number(economicsRow.retailer_margin_pct) - number(economicsRow.distributor_cut_pct) - number(economicsRow.payment_processing_pct)) - number(economicsRow.fulfillment_cost_eur);
  const contribution = net - 0.62;
  if (Math.abs(net - number(test.net_price_to_lumen_eur)) > 0.005 || Math.abs(contribution - number(test.unit_contribution_eur)) > 0.005) dataQuality.push({ type: 'channel_economics_discrepancy', price_eur: number(test.price_eur), channel: test.channel, computed_net: round(net), source_net: number(test.net_price_to_lumen_eur), computed_contribution: round(contribution), source_contribution: number(test.unit_contribution_eur) });
}

const output = {
  generated_at: new Date().toISOString(),
  historical_sales_weekly: cleanSales,
  customer_survey: cleanSurvey,
  price_sensitivity: { by_segment: priceSensitivityBySegment, blended: blendedPriceSensitivity, segment_shares: Object.fromEntries(Object.entries(segmentShares).map(([key, value]) => [key, round(value, 3)])) },
  channel_economics: channelEconomics,
  payback_months: payback,
  market_context: market.map(row => toNumbers(row, ['value', 'year'])),
  data_quality: dataQuality,
};
await mkdir(join(root, 'assets'), { recursive: true });
await writeFile(outputFile, `${JSON.stringify(output, null, 2)}\n`);
