// Aggregated, non-personal inputs transcribed from the supplied LUMEN case files.
// customer_survey.csv was read only for segment, purchase_frequency_per_month,
// and preferred_channel; no respondent-level data is stored here.
export const COGS_PER_CAN = 0.62;
export const BLENDED_CAC = 44.0090509311;
export const BERLIN_MUNICH_POPULATION_SHARE = 0.33;
export const PRICE_TESTS = [{ price: 1.79, acceptance: 0.617 }, { price: 2.19, acceptance: 0.517 }, { price: 2.59, acceptance: 0.267 }];
export const CHANNELS = {
  dtc: { label: 'DTC Online', retailerMargin: 0, distributorCut: 0, paymentProcessing: 0.029, fulfillment: 0.35, annualComparableUnits: 84973.56, frequency: 6.3655, respondents: 119 },
  retail: { label: 'Retail/Grocery', retailerMargin: 0.35, distributorCut: 0.08, paymentProcessing: 0, fulfillment: 0, annualComparableUnits: 133944, frequency: 5.8621, respondents: 195 },
  gym: { label: 'Gym & Office', retailerMargin: 0.2, distributorCut: 0, paymentProcessing: 0, fulfillment: 0, annualComparableUnits: 47714.22, frequency: 6.4151, respondents: 106 },
};
export const COMPETITORS = [
  { name: 'PulsUp', channel: 'Retail/Grocery', price: 1.07 }, { name: 'PulsUp', channel: 'DTC Online', price: 1.15 },
  { name: 'Mate Libre', channel: 'Retail/Grocery', price: 1.59 }, { name: 'VoltFit', channel: 'Retail/Grocery', price: 2.37 },
  { name: 'VoltFit', channel: 'DTC Online', price: 2.49 }, { name: 'VoltFit', channel: 'Gym & Office', price: 2.72 },
  { name: 'Root & Rise', channel: 'Retail/Grocery', price: 2.98 }, { name: 'Root & Rise', channel: 'DTC Online', price: 3.11 },
];
