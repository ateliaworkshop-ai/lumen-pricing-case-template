export type Price = 1.79 | 2.19 | 2.59;
export type Channel = 'dtc' | 'specialty' | 'modernTrade';
export type ChannelMix = Record<Channel, number>;
export type ProxyValue<T> = { value: T; isProxy: true; proxySource: string };

/** Exhibit 11; channels map per Decision 001. */
const PRICE_TEST: Record<Price, Record<Channel, { acceptance: number; contribution: number; margin: number }>> = {
  1.79: { dtc: { acceptance: .617, contribution: .77, margin: .553 }, specialty: { acceptance: .617, contribution: .81, margin: .567 }, modernTrade: { acceptance: .617, contribution: .4, margin: .392 } },
  2.19: { dtc: { acceptance: .517, contribution: 1.16, margin: .651 }, specialty: { acceptance: .517, contribution: 1.13, margin: .646 }, modernTrade: { acceptance: .517, contribution: .63, margin: .503 } },
  2.59: { dtc: { acceptance: .267, contribution: 1.54, margin: .714 }, specialty: { acceptance: .267, contribution: 1.45, margin: .701 }, modernTrade: { acceptance: .267, contribution: .86, margin: .58 } },
};
export const DEFAULT_MIX: ChannelMix = { dtc: .7, specialty: .3, modernTrade: 0 };
export const WEIGHTED_CAC = 44.01; // Exhibit 7, total spend / total acquisitions.
export const PLACEHOLDER_REPEAT_PURCHASE_RATE = .3; // Historical sales has no customer cohorts; validate before launch.
const sumMix = (mix: ChannelMix) => mix.dtc + mix.specialty + mix.modernTrade;
export function acceptanceContribution(price: Price, mix: ChannelMix = DEFAULT_MIX) {
  if (Math.abs(sumMix(mix) - 1) > 1e-9) throw new Error('Channel mix must total 100%.');
  const rows = PRICE_TEST[price];
  const contribution = (Object.keys(mix) as Channel[]).reduce((sum, channel) => sum + mix[channel] * rows[channel].contribution, 0);
  const margin = (Object.keys(mix) as Channel[]).reduce((sum, channel) => sum + mix[channel] * rows[channel].margin, 0);
  const acceptanceRate = rows.dtc.acceptance;
  return { acceptanceRate, blendedContributionPerUnit: contribution, blendedContributionMargin: margin, expectedValuePerProspect: acceptanceRate * contribution, unitsToRecoverWeightedCac: WEIGHTED_CAC / contribution };
}
/** Exhibit 7; Paid Social proxies D2C and Retail Sampling proxies specialty activation. */
export const ACQUISITION_RATES = { dtc: { cpm: 44.98, engagementRate: .0151, cac: 45.79, ltv: 132.0 }, specialty: { cpm: 1422.63, engagementRate: .095, cac: 60.13, ltv: 170.0 } };
export function acquisitionFunnel(input: { budget: number; mix?: Pick<ChannelMix, 'dtc' | 'specialty'>; price?: Price; months?: number }) {
  const mix = input.mix ?? { dtc: .7, specialty: .3 }; const price = input.price ?? 2.19; const months = input.months ?? 24;
  if (input.budget < 0 || Math.abs(mix.dtc + mix.specialty - 1) > 1e-9) throw new Error('Budget must be non-negative and acquisition mix must total 100%.');
  const model = acceptanceContribution(price, { ...mix, modernTrade: 0 });
  const channel = (name: 'dtc' | 'specialty') => { const budget = input.budget * mix[name]; const rate = ACQUISITION_RATES[name]; const reach = budget / rate.cpm * 1000; const engaged = reach * rate.engagementRate; const trials = engaged * model.acceptanceRate; return { budget, reach, engaged, trials, cac: rate.cac, ltv: rate.ltv }; };
  const dtc = channel('dtc'), specialty = channel('specialty'); const trials = dtc.trials + specialty.trials;
  const repeatBuyers: ProxyValue<number> = { value: trials * PLACEHOLDER_REPEAT_PURCHASE_RATE, isProxy: true, proxySource: 'NL/DK/SE historical sales (Exhibit 6) cannot identify repeat customers; 30% is a validation placeholder.' };
  const units = trials + repeatBuyers.value;
  return { dtc, specialty, trials, repeatBuyers, monthlyUnits: units / months, monthlyRevenue: units * price / months, monthlyContribution: units * model.blendedContributionPerUnit / months, months };
}
export type Payback = { status: 'paid_back'; month: number } | { status: 'not_paid_back_within_horizon'; horizonMonths: number };
export function payback(projection: { monthlyContribution: number; monthlySpend: number; months?: number }): Payback { let contribution = 0, spend = 0; const months = projection.months ?? 24; for (let month = 1; month <= months; month += 1) { contribution += projection.monthlyContribution; spend += projection.monthlySpend; if (contribution >= spend) return { status: 'paid_back', month }; } return { status: 'not_paid_back_within_horizon', horizonMonths: months }; }
export function ltvCac(ltv: number, cac: number) { return cac === 0 ? Number.POSITIVE_INFINITY : ltv / cac; }
export function phase2Gates(metrics: { contributionMargin: number; cac: number; ltvCacRatio: number; dtcRepeatPurchaseRate: number }) { const gates = { contributionMargin: metrics.contributionMargin >= .35, cac: metrics.cac <= 50, ltvCac: metrics.ltvCacRatio >= 2.5, dtcRepeatPurchase: metrics.dtcRepeatPurchaseRate >= .25 }; return { gates, allPass: Object.values(gates).every(Boolean) }; }
