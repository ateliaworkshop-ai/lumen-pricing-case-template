export type ValueKind = 'DATA' | 'MODEL' | 'ASSUMPTION' | 'EXTERNAL';

export interface ParameterValue<T = number | string | boolean> {
  value: T;
  unit: string;
  kind: ValueKind;
  source: string;
  accepted?: boolean;
}

export interface ChannelTerms {
  price: ParameterValue<number>;          // EUR/can (consumer gross shelf price)
  retailerCut: ParameterValue<number>;    // ratio 0..1
  distributorCut: ParameterValue<number>; // ratio 0..1
  paymentFee: ParameterValue<number>;     // ratio 0..1
  fulfillment: ParameterValue<number>;    // EUR/can
  cogs: ParameterValue<number>;           // EUR/can
}

export interface ScenarioEconomics {
  convention: 'gross_with_vat_and_deposit' | 'net_ex_vat_and_deposit';
  vatRate: ParameterValue<number>;         // 0.19 in Germany
  depositPfand: ParameterValue<number>;    // 0.25 EUR in Germany
  fixedCostsMonthly: ParameterValue<number>; // EUR/month
  prelaunchInvestment: ParameterValue<number>; // EUR
  channels: Record<string, ChannelTerms>;
}

export interface CommercialModeA {
  level: ParameterValue<number>; // cans/month at maturity
  mix: Record<string, ParameterValue<number>>; // ratio summing to 1.0
  ramp: Record<string, number[]>; // 12 monthly factors (0..1)
  seasonProfile: number[]; // 12 monthly factors centered on 1.0
}

export interface MarketingChannelBudget {
  channel: string;
  budgetMonthly: number[]; // 12 months EUR
  cacEstimated: ParameterValue<number>; // EUR
  incrementality: ParameterValue<number>; // 0..1
  deduplication: ParameterValue<number>; // 0..1
  unitsPerCustomer: ParameterValue<number>; // cans
  repeatRatio: ParameterValue<number>; // 0..1
}

export interface CommercialModeB {
  organicBaseMonthly: ParameterValue<number>; // cans/month
  marketingChannels: Record<string, MarketingChannelBudget>;
  channelSalesAllocation: Record<string, number>; // ratio to sales channels
}

export interface Scenario {
  id: string;
  name: string;
  revision: string;
  description: string;
  country: string; // "DE"
  launchDate: string; // "2026-07-01"
  horizonMonths: 12;
  status: 'draft' | 'evaluated' | 'stale';
  mode: 'A' | 'B';
  commercialA: CommercialModeA;
  commercialB?: CommercialModeB;
  marketingBudgets: Record<string, number[]>; // EUR by month
  economics: ScenarioEconomics;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyFinancial {
  month: number;
  monthName: string;
  calendarDate: string;
  volumeTotal: number;
  volumeByChannel: Record<string, number>;
  grossTurnover: number;
  grossTurnoverByChannel: Record<string, number>;
  vatPaid: number;
  depositPaid: number;
  netRevenue: number;
  netRevenueByChannel: Record<string, number>;
  cogsTotal: number;
  fulfillmentTotal: number;
  retailerDeductionTotal: number;
  distributorDeductionTotal: number;
  paymentFeeTotal: number;
  grossMargin: number;
  grossMarginRate: number;
  marketingSpend: number;
  contributionAfterMarketing: number;
  fixedCosts: number;
  operatingProfit: number;
  cumulativeOperatingProfit: number;
  cumulativeCashBalance: number;
}

export interface HorizonCheckpoint {
  volumeTotal: number;
  grossTurnover: number;
  netRevenue: number;
  cogsTotal: number;
  grossMargin: number;
  grossMarginRate: number;
  marketingSpend: number;
  contributionAfterMarketing: number;
  fixedCosts: number;
  operatingProfit: number;
}

export interface EvaluationResult {
  scenarioId: string;
  revision: string;
  fingerprint: string;
  evaluatedAt: string;
  isStale: boolean;
  months: MonthlyFinancial[];
  checkpoints: {
    m3: HorizonCheckpoint;
    m6: HorizonCheckpoint;
    m12: HorizonCheckpoint;
  };
  paybackCrossingMonth: number | null; // null if not reached
  cumulativeRecoveryCurve: number[]; // 13 points (month 0 to 12)
  breakevenVolumeAnnual: number;
  weightedNetPrice: number;
  weightedMarginPerCan: number;
  provenanceSummary: {
    dataCount: number;
    assumptionCount: number;
    modelCount: number;
    externalCount: number;
  };
  warnings: string[];
}

export interface SensitivityVariant {
  name: string;
  label: string;
  description: string;
  deltaPercent: number;
  annualVolume: number;
  annualRevenue: number;
  annualContribution: number;
  annualOperatingProfit: number;
  paybackMonth: number | null;
}

export interface DecisionRecord {
  scenarioId: string;
  scenarioName: string;
  decidedAt: string;
  decisionMaker: string;
  justification: string;
  selectedAlternativeId?: string;
  status: 'recommended' | 'accepted' | 'overridden';
}
