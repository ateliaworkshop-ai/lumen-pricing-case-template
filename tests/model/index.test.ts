import { describe, expect, it } from 'vitest';
import { acceptanceContribution, acquisitionFunnel, DEFAULT_MIX, payback, phase2Gates } from '../../src/lib/model';
describe('decision model', () => {
  it('uses the locked 70/30 phase-one mapping', () => { const result = acceptanceContribution(2.19, DEFAULT_MIX); expect(result.expectedValuePerProspect).toBeCloseTo(.595067, 6); expect(result.unitsToRecoverWeightedCac).toBeCloseTo(38.236, 3); });
  it.each([[1.79,.482494],[2.19,.595067],[2.59,.403971]] as const)('calculates expected value at %s', (price, expected) => expect(acceptanceContribution(price, DEFAULT_MIX).expectedValuePerProspect).toBeCloseTo(expected, 6));
  it('handles zero budget and returns a proxy repeat result', () => { const result = acquisitionFunnel({ budget: 0 }); expect(result.monthlyUnits).toBe(0); expect(result.repeatBuyers.isProxy).toBe(true); });
  it('supports a 100% D2C mix', () => expect(acceptanceContribution(2.19,{dtc:1,specialty:0,modernTrade:0}).blendedContributionPerUnit).toBe(1.16));
  it('returns a typed no-payback outcome', () => expect(payback({monthlyContribution:1,monthlySpend:2}).status).toBe('not_paid_back_within_horizon'));
  it('checks every phase-two gate', () => expect(phase2Gates({contributionMargin:.35,cac:50,ltvCacRatio:2.5,dtcRepeatPurchaseRate:.25}).allPass).toBe(true));
});
