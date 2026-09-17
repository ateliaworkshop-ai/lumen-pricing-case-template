import { Scenario } from '../types/simulator';

export const DEFAULT_SCENARIOS: Scenario[] = [
  {
    id: 'demo-dtc',
    name: 'Option A : Priority DTC Launch',
    revision: 'v1.2',
    description: 'Digital-first strategy with high unit margins and direct feedback from urban German consumers before scaling into supermarkets.',
    country: 'DE',
    launchDate: '2026-07-01',
    horizonMonths: 12,
    status: 'evaluated',
    mode: 'A',
    commercialA: {
      level: {
        value: 12000,
        unit: 'cans/month',
        kind: 'ASSUMPTION',
        source: 'Transferred assumption from NL, adjusted for German target urban audience',
        accepted: true
      },
      mix: {
        'DTC Online': {
          value: 0.60,
          unit: 'ratio',
          kind: 'ASSUMPTION',
          source: 'Executive committee strategy - Initial margin & community focus',
          accepted: true
        },
        'Retail/Grocery': {
          value: 0.40,
          unit: 'ratio',
          kind: 'ASSUMPTION',
          source: 'Pilot distribution across 50 organic/specialty stores in Berlin & Munich',
          accepted: true
        }
      },
      ramp: {
        'DTC Online': [0.4, 0.6, 0.75, 0.85, 0.95, 1.0, 1.0, 1.05, 1.1, 1.15, 1.2, 1.25],
        'Retail/Grocery': [0.2, 0.35, 0.5, 0.7, 0.85, 1.0, 1.0, 1.0, 1.1, 1.1, 1.2, 1.2]
      },
      seasonProfile: [1.25, 1.30, 1.10, 0.95, 0.85, 0.80, 0.75, 0.85, 1.00, 1.10, 1.20, 1.25]
    },
    marketingBudgets: {
      'Digital Ads (Meta/TikTok)': [4500, 4000, 3500, 3000, 2500, 2500, 2000, 2000, 2500, 2500, 3000, 3000],
      'Influencer & Creator DE': [3000, 2500, 2000, 1500, 1000, 1000, 800, 800, 1200, 1500, 1800, 2000],
      'Events & Sampling': [2500, 1500, 1000, 500, 500, 500, 400, 400, 800, 1000, 1200, 1500]
    },
    economics: {
      convention: 'gross_with_vat_and_deposit',
      vatRate: {
        value: 0.19,
        unit: 'ratio',
        kind: 'DATA',
        source: 'German statutory VAT (MwSt 19% on soft drinks & energy beverages)',
        accepted: true
      },
      depositPfand: {
        value: 0.25,
        unit: 'EUR/can',
        kind: 'DATA',
        source: 'Mandatory German federal single-use container deposit (Einwegpfand)',
        accepted: true
      },
      fixedCostsMonthly: {
        value: 4500,
        unit: 'EUR/month',
        kind: 'ASSUMPTION',
        source: 'Allocated German warehouse share, local DE customer support & compliance',
        accepted: true
      },
      prelaunchInvestment: {
        value: 35000,
        unit: 'EUR',
        kind: 'ASSUMPTION',
        source: 'DPG Pfand certified packaging setup, DE localization & launch campaign',
        accepted: true
      },
      channels: {
        'DTC Online': {
          price: {
            value: 2.49,
            unit: 'EUR/can',
            kind: 'ASSUMPTION',
            source: 'German Van Westendorp pricing study - Optimal acceptable price',
            accepted: true
          },
          retailerCut: {
            value: 0.0,
            unit: 'ratio',
            kind: 'DATA',
            source: 'Direct-to-consumer model (no retailer cut)',
            accepted: true
          },
          distributorCut: {
            value: 0.0,
            unit: 'ratio',
            kind: 'DATA',
            source: 'Direct-to-consumer model',
            accepted: true
          },
          paymentFee: {
            value: 0.025,
            unit: 'ratio',
            kind: 'DATA',
            source: 'Stripe / PayPal Europe processing fee 2.5%',
            accepted: true
          },
          fulfillment: {
            value: 0.45,
            unit: 'EUR/can',
            kind: 'DATA',
            source: '3PL fulfillment warehouse Cologne (12-pack shipping fee per unit)',
            accepted: true
          },
          cogs: {
            value: 0.62,
            unit: 'EUR/can',
            kind: 'DATA',
            source: 'LUMEN standard bill of materials (adaptogenic active formula + aluminum slim can)',
            accepted: true
          }
        },
        'Retail/Grocery': {
          price: {
            value: 2.19,
            unit: 'EUR/can',
            kind: 'ASSUMPTION',
            source: 'Competitive benchmark vs premium functional beverages in Germany',
            accepted: true
          },
          retailerCut: {
            value: 0.28,
            unit: 'ratio',
            kind: 'DATA',
            source: 'Target distributor terms for premium supermarket / organic channel (28%)',
            accepted: true
          },
          distributorCut: {
            value: 0.08,
            unit: 'ratio',
            kind: 'DATA',
            source: 'German beverage beverage wholesaler (8% wholesale margin)',
            accepted: true
          },
          paymentFee: {
            value: 0.005,
            unit: 'ratio',
            kind: 'DATA',
            source: 'B2B wire transfer bank fees',
            accepted: true
          },
          fulfillment: {
            value: 0.15,
            unit: 'EUR/can',
            kind: 'DATA',
            source: 'Palletized freight shipping to central wholesaler hub',
            accepted: true
          },
          cogs: {
            value: 0.62,
            unit: 'EUR/can',
            kind: 'DATA',
            source: 'LUMEN unit cost sheet',
            accepted: true
          }
        }
      }
    },
    createdAt: '2026-09-10T14:30:00Z',
    updatedAt: '2026-09-14T12:00:00Z'
  },
  {
    id: 'demo-retail',
    name: 'Option B : Volume & Retail Penetration',
    revision: 'v1.0',
    description: 'Volume-driven strategy with aggressive supermarket placement, competitive pricing (€2.09), faster fixed cost absorption but lower unit margin.',
    country: 'DE',
    launchDate: '2026-07-01',
    horizonMonths: 12,
    status: 'evaluated',
    mode: 'A',
    commercialA: {
      level: {
        value: 22000,
        unit: 'cans/month',
        kind: 'ASSUMPTION',
        source: 'Targeting 250 Rewe / Edeka supermarket doors in urban clusters',
        accepted: true
      },
      mix: {
        'DTC Online': {
          value: 0.25,
          unit: 'ratio',
          kind: 'ASSUMPTION',
          source: 'Direct sales serving brand discovery & trial',
          accepted: true
        },
        'Retail/Grocery': {
          value: 0.75,
          unit: 'ratio',
          kind: 'ASSUMPTION',
          source: 'Physical retail supermarket dominance',
          accepted: true
        }
      },
      ramp: {
        'DTC Online': [0.3, 0.5, 0.7, 0.8, 0.9, 1.0, 1.0, 1.0, 1.05, 1.1, 1.15, 1.2],
        'Retail/Grocery': [0.3, 0.5, 0.7, 0.85, 1.0, 1.05, 1.1, 1.15, 1.2, 1.25, 1.3, 1.35]
      },
      seasonProfile: [1.25, 1.30, 1.10, 0.95, 0.85, 0.80, 0.75, 0.85, 1.00, 1.10, 1.20, 1.25]
    },
    marketingBudgets: {
      'Trade Marketing (Endcaps/Displays)': [5000, 4500, 3500, 2500, 2000, 2000, 1500, 1500, 2000, 2500, 3000, 3000],
      'Targeted Digital & Influence': [3000, 2500, 2000, 1500, 1200, 1000, 1000, 1000, 1200, 1500, 1800, 2000],
      'In-Store Tasting & Sampling': [4000, 3000, 2000, 1000, 800, 800, 600, 600, 1000, 1200, 1500, 1800]
    },
    economics: {
      convention: 'gross_with_vat_and_deposit',
      vatRate: {
        value: 0.19,
        unit: 'ratio',
        kind: 'DATA',
        source: 'MwSt 19%',
        accepted: true
      },
      depositPfand: {
        value: 0.25,
        unit: 'EUR/can',
        kind: 'DATA',
        source: 'Einwegpfand €0.25',
        accepted: true
      },
      fixedCostsMonthly: {
        value: 5800,
        unit: 'EUR/month',
        kind: 'ASSUMPTION',
        source: 'National account management (KAM) & logistics auditing',
        accepted: true
      },
      prelaunchInvestment: {
        value: 50000,
        unit: 'EUR',
        kind: 'ASSUMPTION',
        source: 'Listing slotting fees & consignment safety inventory',
        accepted: true
      },
      channels: {
        'DTC Online': {
          price: {
            value: 2.29,
            unit: 'EUR/can',
            kind: 'ASSUMPTION',
            source: 'Narrow price differential to minimize channel conflict',
            accepted: true
          },
          retailerCut: {
            value: 0.0,
            unit: 'ratio',
            kind: 'DATA',
            source: 'Direct sales',
            accepted: true
          },
          distributorCut: {
            value: 0.0,
            unit: 'ratio',
            kind: 'DATA',
            source: 'Direct sales',
            accepted: true
          },
          paymentFee: {
            value: 0.025,
            unit: 'ratio',
            kind: 'DATA',
            source: 'Stripe 2.5%',
            accepted: true
          },
          fulfillment: {
            value: 0.45,
            unit: 'EUR/can',
            kind: 'DATA',
            source: '3PL Cologne',
            accepted: true
          },
          cogs: {
            value: 0.60,
            unit: 'EUR/can',
            kind: 'DATA',
            source: 'Volume procurement scale economies on ingredients',
            accepted: true
          }
        },
        'Retail/Grocery': {
          price: {
            value: 2.09,
            unit: 'EUR/can',
            kind: 'ASSUMPTION',
            source: 'Competitive price point vs mass functional beverages',
            accepted: true
          },
          retailerCut: {
            value: 0.32,
            unit: 'ratio',
            kind: 'DATA',
            source: 'Negotiated supermarket central purchasing margin 32%',
            accepted: true
          },
          distributorCut: {
            value: 0.08,
            unit: 'ratio',
            kind: 'DATA',
            source: 'Wholesaler logistics 8%',
            accepted: true
          },
          paymentFee: {
            value: 0.005,
            unit: 'ratio',
            kind: 'DATA',
            source: 'B2B 0.5%',
            accepted: true
          },
          fulfillment: {
            value: 0.12,
            unit: 'EUR/can',
            kind: 'DATA',
            source: 'Consolidated full pallet freight delivery',
            accepted: true
          },
          cogs: {
            value: 0.60,
            unit: 'EUR/can',
            kind: 'DATA',
            source: 'Volume-optimized COGS',
            accepted: true
          }
        }
      }
    },
    createdAt: '2026-09-11T09:15:00Z',
    updatedAt: '2026-09-13T17:45:00Z'
  },
  {
    id: 'demo-premium',
    name: 'Option C : Premium Niche & Wellness',
    revision: 'v1.0',
    description: 'High-end positioning (€2.79) targeting boutique gyms, yoga studios, and organic delis, maximizing unit margin.',
    country: 'DE',
    launchDate: '2026-07-01',
    horizonMonths: 12,
    status: 'evaluated',
    mode: 'A',
    commercialA: {
      level: {
        value: 7500,
        unit: 'cans/month',
        kind: 'ASSUMPTION',
        source: 'Selective, boutique velocity assumption',
        accepted: true
      },
      mix: {
        'DTC Online': {
          value: 0.50,
          unit: 'ratio',
          kind: 'ASSUMPTION',
          source: 'Direct subscriber recurring orders',
          accepted: true
        },
        'Retail/Grocery': {
          value: 0.50,
          unit: 'ratio',
          kind: 'ASSUMPTION',
          source: 'Specialty fitness, spa & organic deli doors',
          accepted: true
        }
      },
      ramp: {
        'DTC Online': [0.5, 0.65, 0.8, 0.9, 0.95, 1.0, 1.05, 1.1, 1.15, 1.2, 1.25, 1.3],
        'Retail/Grocery': [0.4, 0.55, 0.7, 0.85, 0.95, 1.0, 1.05, 1.1, 1.15, 1.2, 1.25, 1.3]
      },
      seasonProfile: [1.20, 1.25, 1.10, 0.95, 0.85, 0.80, 0.75, 0.85, 1.00, 1.10, 1.20, 1.25]
    },
    marketingBudgets: {
      'Coach & Studio Partnerships': [3000, 2500, 2000, 1500, 1200, 1000, 1000, 1000, 1200, 1500, 1800, 2000],
      'Hyrox & Wellness Events': [3500, 2500, 1500, 800, 600, 600, 500, 500, 800, 1200, 1500, 2000],
      'Brand Content & Press': [2000, 1500, 1000, 800, 600, 600, 500, 500, 600, 800, 1000, 1200]
    },
    economics: {
      convention: 'gross_with_vat_and_deposit',
      vatRate: {
        value: 0.19,
        unit: 'ratio',
        kind: 'DATA',
        source: 'MwSt 19%',
        accepted: true
      },
      depositPfand: {
        value: 0.25,
        unit: 'EUR/can',
        kind: 'DATA',
        source: 'Einwegpfand €0.25',
        accepted: true
      },
      fixedCostsMonthly: {
        value: 3800,
        unit: 'EUR/month',
        kind: 'ASSUMPTION',
        source: 'Lean, focused regional team setup',
        accepted: true
      },
      prelaunchInvestment: {
        value: 28000,
        unit: 'EUR',
        kind: 'ASSUMPTION',
        source: 'Tactile matte cans, PR gift boxes and sampling seeding',
        accepted: true
      },
      channels: {
        'DTC Online': {
          price: {
            value: 2.79,
            unit: 'EUR/can',
            kind: 'ASSUMPTION',
            source: 'Upper threshold in Van Westendorp survey for organic/clean profile',
            accepted: true
          },
          retailerCut: {
            value: 0.0,
            unit: 'ratio',
            kind: 'DATA',
            source: 'Direct sales',
            accepted: true
          },
          distributorCut: {
            value: 0.0,
            unit: 'ratio',
            kind: 'DATA',
            source: 'Direct sales',
            accepted: true
          },
          paymentFee: {
            value: 0.025,
            unit: 'ratio',
            kind: 'DATA',
            source: 'Stripe 2.5%',
            accepted: true
          },
          fulfillment: {
            value: 0.45,
            unit: 'EUR/can',
            kind: 'DATA',
            source: '3PL Cologne',
            accepted: true
          },
          cogs: {
            value: 0.65,
            unit: 'EUR/can',
            kind: 'DATA',
            source: 'Organic bio-certification & premium textured matte print',
            accepted: true
          }
        },
        'Retail/Grocery': {
          price: {
            value: 2.59,
            unit: 'EUR/can',
            kind: 'ASSUMPTION',
            source: 'Selective price point in fitness studios & organic grocers',
            accepted: true
          },
          retailerCut: {
            value: 0.30,
            unit: 'ratio',
            kind: 'DATA',
            source: 'Specialty retailer margin 30%',
            accepted: true
          },
          distributorCut: {
            value: 0.07,
            unit: 'ratio',
            kind: 'DATA',
            source: 'Organic specialist wholesaler 7%',
            accepted: true
          },
          paymentFee: {
            value: 0.005,
            unit: 'ratio',
            kind: 'DATA',
            source: 'B2B 0.5%',
            accepted: true
          },
          fulfillment: {
            value: 0.18,
            unit: 'EUR/can',
            kind: 'DATA',
            source: 'Direct urban store deliveries',
            accepted: true
          },
          cogs: {
            value: 0.65,
            unit: 'EUR/can',
            kind: 'DATA',
            source: 'Premium COGS',
            accepted: true
          }
        }
      }
    },
    createdAt: '2026-09-12T11:00:00Z',
    updatedAt: '2026-09-14T08:30:00Z'
  }
];
