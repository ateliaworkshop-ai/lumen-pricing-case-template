export interface CompetitorProfile {
  id: string;
  name: string;
  tier: 'Mass Market' | 'Heritage Niche' | 'Direct Performance' | 'Boutique Adaptogen';
  positioning: string;
  description: string;
  supermarketPrice: number; // shelf price incl. VAT & Pfand
  gymOfficePrice: number;
  dtcSinglePrice: number;
  dtc12PackPrice: number;
  caffeineSource: string;
  targetDemographic: string;
  unaidedAwarenessPct: number; // from customer_survey.csv
  marketingIntensityIndex: number; // 0-100 scale
  strengths: string[];
  vulnerabilities: string[];
}

export interface CompetitorChannelPrice {
  competitor: string;
  channel: string;
  channelLabel: string;
  format: string;
  packSize: number;
  priceEur: number;
  vatRate: number;
  depositEur: number;
  shelfPriceInclAll: number;
  unitPricePerCan: number;
  notes: string;
}

export interface CompetitorMonthlyHistory {
  month: string;
  monthNum: number;
  competitor: string;
  listPriceEur: number;
  promotionalDiscountPct: number;
  netShelfPriceEur: number;
}

export const COMPETITOR_PROFILES: CompetitorProfile[] = [
  {
    id: 'pulsup',
    name: 'PulsUp',
    tier: 'Mass Market',
    positioning: 'Low-cost high-caffeine synthetic energy drink',
    description: 'Aggressive volume player in discounters and supermarkets. Heavy promotional discounting and TV/social media advertising.',
    supermarketPrice: 1.07,
    gymOfficePrice: 1.28,
    dtcSinglePrice: 1.15,
    dtc12PackPrice: 12.90, // €1.075/can
    caffeineSource: 'Synthetic anhydrous caffeine + taurine',
    targetDemographic: 'Students, young gamers, late-night shift workers',
    unaidedAwarenessPct: 77.5,
    marketingIntensityIndex: 100,
    strengths: ['Unmatched retail shelf distribution', 'Low entry price (€1.07)', 'Mass brand recognition'],
    vulnerabilities: ['Severe caffeine crash complaints', 'Artificial sweeteners & chemicals', 'Low brand prestige among professionals'],
  },
  {
    id: 'matelibre',
    name: 'Mate Libre',
    tier: 'Heritage Niche',
    positioning: 'Organic brewed yerba mate & natural soda',
    description: 'Cult favorite in Berlin and urban organic supermarkets (Denns, Alnatura). Highly authentic hipster branding, modest digital presence.',
    supermarketPrice: 1.59,
    gymOfficePrice: 1.83,
    dtcSinglePrice: 1.70,
    dtc12PackPrice: 19.20, // €1.60/can
    caffeineSource: 'Brewed yerba mate leaf extract',
    targetDemographic: 'Tech co-working professionals, creatives, bio-conscious urbanites',
    unaidedAwarenessPct: 41.7,
    marketingIntensityIndex: 40,
    strengths: ['Strong organic/bio credentials', 'Loyal urban community', 'Clean non-crash reputation'],
    vulnerabilities: ['Acquired taste profile (earthy bitterness)', 'Limited distribution outside top 4 metro areas', 'Weak performance marketing'],
  },
  {
    id: 'voltfit',
    name: 'VoltFit',
    tier: 'Direct Performance',
    positioning: 'Active lifestyle performance beverage with B-vitamins & green tea caffeine',
    description: 'The primary direct benchmark for LUMEN in Germany. Strong gym cooler presence (CrossFit boxes, boutique studios) and influencer-driven D2C.',
    supermarketPrice: 2.37,
    gymOfficePrice: 2.72,
    dtcSinglePrice: 2.49,
    dtc12PackPrice: 27.90, // €2.325/can
    caffeineSource: 'Green tea extract (120mg) + B-complex',
    targetDemographic: 'Fitness enthusiasts, CrossFit athletes, urban professionals',
    unaidedAwarenessPct: 53.8,
    marketingIntensityIndex: 85,
    strengths: ['Direct target demographic overlap with LUMEN', 'Strong fitness & DTC halo effect', 'High price acceptance at €2.49'],
    vulnerabilities: ['Perceived as masculine/gym-only', 'Noticeable medicinal aftertaste noted in customer quotes', 'Vulnerable to cleaner nootropic alternatives'],
  },
  {
    id: 'rootandrise',
    name: 'Root & Rise',
    tier: 'Boutique Adaptogen',
    positioning: 'Ultra-premium adaptogenic botanical elixir (Lion’s Mane, Cordyceps, L-theanine)',
    description: 'Premium boutique wellness brand sold primarily via high-end specialty grocery and digital subscription. High-margin, low-volume strategy.',
    supermarketPrice: 2.98,
    gymOfficePrice: 3.30,
    dtcSinglePrice: 3.11,
    dtc12PackPrice: 34.90, // €2.908/can
    caffeineSource: 'Ceremonial matcha & mushroom nootropics',
    targetDemographic: 'Affluent biohackers, executives, holistic wellness consumers',
    unaidedAwarenessPct: 18.9,
    marketingIntensityIndex: 15,
    strengths: ['High gross margins (>65%)', 'Prestigious brand halo', 'Zero chemical additives'],
    vulnerabilities: ['Very high barrier to trial (€2.98+)', 'Low mass velocity in conventional supermarkets', 'Low unaided awareness (19%)'],
  },
];

export const COMPETITOR_PRICES_BY_CHANNEL: CompetitorChannelPrice[] = [
  { competitor: 'PulsUp', channel: 'supermarket', channelLabel: 'Retail / Supermarket', format: 'single_can', packSize: 1, priceEur: 0.82, vatRate: 0.19, depositEur: 0.25, shelfPriceInclAll: 1.07, unitPricePerCan: 1.07, notes: 'Frequent promotional discounts' },
  { competitor: 'PulsUp', channel: 'gym_office', channelLabel: 'Gym & Office Coolers', format: 'single_can', packSize: 1, priceEur: 1.03, vatRate: 0.19, depositEur: 0.25, shelfPriceInclAll: 1.28, unitPricePerCan: 1.28, notes: 'Vending machines and gym coolers' },
  { competitor: 'PulsUp', channel: 'dtc_online', channelLabel: 'DTC Online Store', format: '4pack', packSize: 4, priceEur: 3.60, vatRate: 0.19, depositEur: 1.00, shelfPriceInclAll: 4.60, unitPricePerCan: 1.15, notes: 'Free shipping above €30' },
  { competitor: 'PulsUp', channel: 'dtc_online', channelLabel: 'DTC Online Store', format: 'subscription_12pack', packSize: 12, priceEur: 9.90, vatRate: 0.19, depositEur: 3.00, shelfPriceInclAll: 12.90, unitPricePerCan: 1.075, notes: 'Monthly recurring delivery' },

  { competitor: 'Mate Libre', channel: 'supermarket', channelLabel: 'Retail / Supermarket', format: 'single_can', packSize: 1, priceEur: 1.34, vatRate: 0.19, depositEur: 0.25, shelfPriceInclAll: 1.59, unitPricePerCan: 1.59, notes: 'Established bio/organic listings' },
  { competitor: 'Mate Libre', channel: 'gym_office', channelLabel: 'Gym & Office Coolers', format: 'single_can', packSize: 1, priceEur: 1.58, vatRate: 0.19, depositEur: 0.25, shelfPriceInclAll: 1.83, unitPricePerCan: 1.83, notes: 'Yoga studios and co-working spaces' },
  { competitor: 'Mate Libre', channel: 'dtc_online', channelLabel: 'DTC Online Store', format: '4pack', packSize: 4, priceEur: 5.80, vatRate: 0.19, depositEur: 1.00, shelfPriceInclAll: 6.80, unitPricePerCan: 1.70, notes: 'Limited online ad spend' },
  { competitor: 'Mate Libre', channel: 'dtc_online', channelLabel: 'DTC Online Store', format: 'subscription_12pack', packSize: 12, priceEur: 16.20, vatRate: 0.19, depositEur: 3.00, shelfPriceInclAll: 19.20, unitPricePerCan: 1.60, notes: '5% recurring discount' },

  { competitor: 'VoltFit', channel: 'supermarket', channelLabel: 'Retail / Supermarket', format: 'single_can', packSize: 1, priceEur: 2.12, vatRate: 0.19, depositEur: 0.25, shelfPriceInclAll: 2.37, unitPricePerCan: 2.37, notes: 'Premium functional beverage shelf' },
  { competitor: 'VoltFit', channel: 'gym_office', channelLabel: 'Gym & Office Coolers', format: 'single_can', packSize: 1, priceEur: 2.47, vatRate: 0.19, depositEur: 0.25, shelfPriceInclAll: 2.72, unitPricePerCan: 2.72, notes: 'CrossFit boxes and boutique fitness' },
  { competitor: 'VoltFit', channel: 'dtc_online', channelLabel: 'DTC Online Store', format: 'single_can', packSize: 1, priceEur: 2.24, vatRate: 0.19, depositEur: 0.25, shelfPriceInclAll: 2.49, unitPricePerCan: 2.49, notes: 'Starter trial single can' },
  { competitor: 'VoltFit', channel: 'dtc_online', channelLabel: 'DTC Online Store', format: '4pack', packSize: 4, priceEur: 8.96, vatRate: 0.19, depositEur: 1.00, shelfPriceInclAll: 9.96, unitPricePerCan: 2.49, notes: 'Standard 4-can trial pack' },
  { competitor: 'VoltFit', channel: 'dtc_online', channelLabel: 'DTC Online Store', format: 'subscription_12pack', packSize: 12, priceEur: 24.90, vatRate: 0.19, depositEur: 3.00, shelfPriceInclAll: 27.90, unitPricePerCan: 2.325, notes: '10% subscription discount' },

  { competitor: 'Root & Rise', channel: 'supermarket', channelLabel: 'Retail / Supermarket', format: 'single_can', packSize: 1, priceEur: 2.73, vatRate: 0.19, depositEur: 0.25, shelfPriceInclAll: 2.98, unitPricePerCan: 2.98, notes: 'High-end organic only (Denns, Alnatura)' },
  { competitor: 'Root & Rise', channel: 'gym_office', channelLabel: 'Gym & Office Coolers', format: 'single_can', packSize: 1, priceEur: 3.05, vatRate: 0.19, depositEur: 0.25, shelfPriceInclAll: 3.30, unitPricePerCan: 3.30, notes: 'Luxury wellness spas' },
  { competitor: 'Root & Rise', channel: 'dtc_online', channelLabel: 'DTC Online Store', format: '4pack', packSize: 4, priceEur: 11.44, vatRate: 0.19, depositEur: 1.00, shelfPriceInclAll: 12.44, unitPricePerCan: 3.11, notes: 'Glass bottle aesthetic' },
  { competitor: 'Root & Rise', channel: 'dtc_online', channelLabel: 'DTC Online Store', format: 'subscription_12pack', packSize: 12, priceEur: 31.90, vatRate: 0.19, depositEur: 3.00, shelfPriceInclAll: 34.90, unitPricePerCan: 2.908, notes: 'Exclusive community wellness perks' },
];

export const COMPETITOR_PRICE_HISTORY: CompetitorMonthlyHistory[] = [
  { month: '2025-01', monthNum: 1, competitor: 'PulsUp', listPriceEur: 1.07, promotionalDiscountPct: 0.0, netShelfPriceEur: 1.07 },
  { month: '2025-02', monthNum: 2, competitor: 'PulsUp', listPriceEur: 1.07, promotionalDiscountPct: 18.7, netShelfPriceEur: 0.87 },
  { month: '2025-03', monthNum: 3, competitor: 'PulsUp', listPriceEur: 1.07, promotionalDiscountPct: 0.0, netShelfPriceEur: 1.07 },
  { month: '2025-04', monthNum: 4, competitor: 'PulsUp', listPriceEur: 1.07, promotionalDiscountPct: 0.0, netShelfPriceEur: 1.07 },
  { month: '2025-05', monthNum: 5, competitor: 'PulsUp', listPriceEur: 1.07, promotionalDiscountPct: 15.0, netShelfPriceEur: 0.91 },
  { month: '2025-06', monthNum: 6, competitor: 'PulsUp', listPriceEur: 1.07, promotionalDiscountPct: 0.0, netShelfPriceEur: 1.07 },
  { month: '2025-07', monthNum: 7, competitor: 'PulsUp', listPriceEur: 1.07, promotionalDiscountPct: 0.0, netShelfPriceEur: 1.07 },
  { month: '2025-08', monthNum: 8, competitor: 'PulsUp', listPriceEur: 1.07, promotionalDiscountPct: 18.7, netShelfPriceEur: 0.87 },
  { month: '2025-09', monthNum: 9, competitor: 'PulsUp', listPriceEur: 1.07, promotionalDiscountPct: 0.0, netShelfPriceEur: 1.07 },
  { month: '2025-10', monthNum: 10, competitor: 'PulsUp', listPriceEur: 1.07, promotionalDiscountPct: 0.0, netShelfPriceEur: 1.07 },
  { month: '2025-11', monthNum: 11, competitor: 'PulsUp', listPriceEur: 1.07, promotionalDiscountPct: 10.0, netShelfPriceEur: 0.96 },
  { month: '2025-12', monthNum: 12, competitor: 'PulsUp', listPriceEur: 1.07, promotionalDiscountPct: 0.0, netShelfPriceEur: 1.07 },

  { month: '2025-01', monthNum: 1, competitor: 'Mate Libre', listPriceEur: 1.59, promotionalDiscountPct: 0.0, netShelfPriceEur: 1.59 },
  { month: '2025-02', monthNum: 2, competitor: 'Mate Libre', listPriceEur: 1.59, promotionalDiscountPct: 0.0, netShelfPriceEur: 1.59 },
  { month: '2025-03', monthNum: 3, competitor: 'Mate Libre', listPriceEur: 1.59, promotionalDiscountPct: 10.0, netShelfPriceEur: 1.43 },
  { month: '2025-04', monthNum: 4, competitor: 'Mate Libre', listPriceEur: 1.59, promotionalDiscountPct: 0.0, netShelfPriceEur: 1.59 },
  { month: '2025-05', monthNum: 5, competitor: 'Mate Libre', listPriceEur: 1.59, promotionalDiscountPct: 0.0, netShelfPriceEur: 1.59 },
  { month: '2025-06', monthNum: 6, competitor: 'Mate Libre', listPriceEur: 1.59, promotionalDiscountPct: 10.0, netShelfPriceEur: 1.43 },
  { month: '2025-07', monthNum: 7, competitor: 'Mate Libre', listPriceEur: 1.59, promotionalDiscountPct: 0.0, netShelfPriceEur: 1.59 },
  { month: '2025-08', monthNum: 8, competitor: 'Mate Libre', listPriceEur: 1.59, promotionalDiscountPct: 0.0, netShelfPriceEur: 1.59 },
  { month: '2025-09', monthNum: 9, competitor: 'Mate Libre', listPriceEur: 1.59, promotionalDiscountPct: 0.0, netShelfPriceEur: 1.59 },
  { month: '2025-10', monthNum: 10, competitor: 'Mate Libre', listPriceEur: 1.59, promotionalDiscountPct: 0.0, netShelfPriceEur: 1.59 },
  { month: '2025-11', monthNum: 11, competitor: 'Mate Libre', listPriceEur: 1.59, promotionalDiscountPct: 0.0, netShelfPriceEur: 1.59 },
  { month: '2025-12', monthNum: 12, competitor: 'Mate Libre', listPriceEur: 1.59, promotionalDiscountPct: 0.0, netShelfPriceEur: 1.59 },

  { month: '2025-01', monthNum: 1, competitor: 'VoltFit', listPriceEur: 2.37, promotionalDiscountPct: 0.0, netShelfPriceEur: 2.37 },
  { month: '2025-02', monthNum: 2, competitor: 'VoltFit', listPriceEur: 2.37, promotionalDiscountPct: 0.0, netShelfPriceEur: 2.37 },
  { month: '2025-03', monthNum: 3, competitor: 'VoltFit', listPriceEur: 2.37, promotionalDiscountPct: 0.0, netShelfPriceEur: 2.37 },
  { month: '2025-04', monthNum: 4, competitor: 'VoltFit', listPriceEur: 2.37, promotionalDiscountPct: 12.7, netShelfPriceEur: 2.07 },
  { month: '2025-05', monthNum: 5, competitor: 'VoltFit', listPriceEur: 2.37, promotionalDiscountPct: 0.0, netShelfPriceEur: 2.37 },
  { month: '2025-06', monthNum: 6, competitor: 'VoltFit', listPriceEur: 2.37, promotionalDiscountPct: 0.0, netShelfPriceEur: 2.37 },
  { month: '2025-07', monthNum: 7, competitor: 'VoltFit', listPriceEur: 2.37, promotionalDiscountPct: 12.7, netShelfPriceEur: 2.07 },
  { month: '2025-08', monthNum: 8, competitor: 'VoltFit', listPriceEur: 2.37, promotionalDiscountPct: 0.0, netShelfPriceEur: 2.37 },
  { month: '2025-09', monthNum: 9, competitor: 'VoltFit', listPriceEur: 2.37, promotionalDiscountPct: 0.0, netShelfPriceEur: 2.37 },
  { month: '2025-10', monthNum: 10, competitor: 'VoltFit', listPriceEur: 2.37, promotionalDiscountPct: 0.0, netShelfPriceEur: 2.37 },
  { month: '2025-11', monthNum: 11, competitor: 'VoltFit', listPriceEur: 2.37, promotionalDiscountPct: 8.9, netShelfPriceEur: 2.16 },
  { month: '2025-12', monthNum: 12, competitor: 'VoltFit', listPriceEur: 2.37, promotionalDiscountPct: 0.0, netShelfPriceEur: 2.37 },

  { month: '2025-01', monthNum: 1, competitor: 'Root & Rise', listPriceEur: 2.98, promotionalDiscountPct: 0.0, netShelfPriceEur: 2.98 },
  { month: '2025-02', monthNum: 2, competitor: 'Root & Rise', listPriceEur: 2.98, promotionalDiscountPct: 0.0, netShelfPriceEur: 2.98 },
  { month: '2025-03', monthNum: 3, competitor: 'Root & Rise', listPriceEur: 2.98, promotionalDiscountPct: 0.0, netShelfPriceEur: 2.98 },
  { month: '2025-04', monthNum: 4, competitor: 'Root & Rise', listPriceEur: 2.98, promotionalDiscountPct: 0.0, netShelfPriceEur: 2.98 },
  { month: '2025-05', monthNum: 5, competitor: 'Root & Rise', listPriceEur: 2.98, promotionalDiscountPct: 0.0, netShelfPriceEur: 2.98 },
  { month: '2025-06', monthNum: 6, competitor: 'Root & Rise', listPriceEur: 2.98, promotionalDiscountPct: 0.0, netShelfPriceEur: 2.98 },
  { month: '2025-07', monthNum: 7, competitor: 'Root & Rise', listPriceEur: 2.98, promotionalDiscountPct: 0.0, netShelfPriceEur: 2.98 },
  { month: '2025-08', monthNum: 8, competitor: 'Root & Rise', listPriceEur: 2.98, promotionalDiscountPct: 0.0, netShelfPriceEur: 2.98 },
  { month: '2025-09', monthNum: 9, competitor: 'Root & Rise', listPriceEur: 2.98, promotionalDiscountPct: 0.0, netShelfPriceEur: 2.98 },
  { month: '2025-10', monthNum: 10, competitor: 'Root & Rise', listPriceEur: 2.98, promotionalDiscountPct: 0.0, netShelfPriceEur: 2.98 },
  { month: '2025-11', monthNum: 11, competitor: 'Root & Rise', listPriceEur: 2.98, promotionalDiscountPct: 0.0, netShelfPriceEur: 2.98 },
  { month: '2025-12', monthNum: 12, competitor: 'Root & Rise', listPriceEur: 2.98, promotionalDiscountPct: 0.0, netShelfPriceEur: 2.98 },
];

export const GERMAN_CONSUMER_SURVEY_SUMMARY = {
  sampleSize: 422,
  cities: ['Berlin (31%)', 'Munich (26%)', 'Hamburg (23%)', 'Cologne (20%)'],
  averageWillingnessToPayEur: 2.34,
  priceAcceptabilityZone: {
    tooCheapSuspicious: 1.49,
    bargainSweetspot: 1.99,
    premiumAcceptable: 2.49,
    expensiveBarrier: 2.99,
  },
  awarenessRankings: [
    { name: 'PulsUp', awarenessPct: 77.5, category: 'Mass Energy' },
    { name: 'VoltFit', awarenessPct: 53.8, category: 'Functional Performance' },
    { name: 'Mate Libre', awarenessPct: 41.7, category: 'Bio / Niche' },
    { name: 'Root & Rise', awarenessPct: 18.9, category: 'Boutique Adaptogen' },
  ],
  customerQuotes: [
    {
      segment: 'Fitness & Gym-Goers',
      sentiment: 'positive',
      quote: "If it performs like VoltFit but tastes better I'm switching immediately.",
      strategicInsight: 'VoltFit is the direct benchmark for athletic/gym consumers; taste and clean caffeine are key differentiators.'
    },
    {
      segment: 'Students & Budget-Conscious',
      sentiment: 'negative',
      quote: 'Honestly 2,50EUR for a can is a hard no on a student budget, whatever is inside it.',
      strategicInsight: 'LUMEN will struggle in pure student discounters against PulsUp (€1.07); must focus on professionals.'
    },
    {
      segment: 'Urban Wellness Professionals',
      sentiment: 'positive',
      quote: "I switched most of my afternoon coffee runs to something like this, I don't mind paying more for clean ingredients.",
      strategicInsight: 'High willingness-to-pay (€2.50+) when positioned as clean coffee replacement rather than a soft drink.'
    },
    {
      segment: 'Urban Wellness Professionals',
      sentiment: 'negative',
      quote: "Too many wellness brands taste like medicine, that's the real risk here, not the price.",
      strategicInsight: 'Sensory experience must overcome the medicinal perception that plagues Root & Rise and VoltFit.'
    }
  ]
};
