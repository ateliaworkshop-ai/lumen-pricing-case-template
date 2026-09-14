import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const data = JSON.parse(await readFile(join(root, 'assets/data.json'), 'utf8'));

test('removes exactly four historical duplicates', () => {
  assert.equal(data.data_quality.find(issue => issue.type === 'duplicate_rows_removed')?.count, 4);
  assert.equal(data.historical_sales_weekly.length, 702);
});

test('generated data contains no customer PII', async () => {
  const json = await readFile(join(root, 'assets/data.json'), 'utf8');
  assert.doesNotMatch(json, /first_name|last_name|email|@/);
  assert.deepEqual(Object.keys(data.customer_survey[0]), ['segment', 'city', 'purchase_frequency_per_month', 'preferred_channel']);
});

test('channel economics match case data to the cent', () => {
  const dtc = data.channel_economics['DTC Online'];
  assert.ok(Math.abs(dtc.by_price['2.19'].net_price_to_lumen_eur - 1.78) <= 0.01);
  assert.ok(Math.abs(data.channel_economics['Retail/Grocery'].by_price['1.79'].unit_contribution_eur - 0.40) <= 0.01);
  assert.equal(data.data_quality.filter(issue => issue.type === 'channel_economics_discrepancy').length, 0);
  assert.equal(dtc.payment_processing_pct, 0.029);
});

test('price sensitivity hard acceptance matches segment thresholds', () => {
  const bySegment = data.price_sensitivity.by_segment;
  assert.equal(bySegment['Urban Wellness Professionals'][2].hard_acceptance, 1.000);
  assert.ok(Math.abs(bySegment['Students & Budget-Conscious'][2].hard_acceptance - 0.03) <= 0.01);
});
