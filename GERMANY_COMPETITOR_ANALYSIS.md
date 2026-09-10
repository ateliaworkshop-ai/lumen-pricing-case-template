# Germany competitor pricing

The case brief identifies these brands as competitors in Germany. These are supplied case benchmarks, not independently verified live prices.

## Single-can prices (330 ml)

| Competitor | DTC Online | Retail/Grocery | Gym & Office |
|---|---:|---:|---:|
| PulsUp | €1.15 | €1.07 | €1.28 |
| Mate Libre | Not listed | €1.59 | €1.83 |
| VoltFit | €2.49 | €2.37 | €2.72 |
| Root & Rise | €3.11 | €2.98 | Not listed |
| Proposed LUMEN | €2.19 | €2.19 | €2.19 |

Source: `data/competitor_prices_by_channel.csv`, restricted to `Single can (330ml)`. Missing entries mean not supplied, not zero. Multipack prices are excluded from this comparison.

## Price history: September 2025–August 2026

| Competitor | Average shelf price | Lowest promotional price | Promotional months |
|---|---:|---:|---|
| PulsUp | €1.06 | €0.87 | October 2025 (10%); February 2026 (20%) |
| Mate Libre | €1.56 | €1.26 | July 2026 (20%) |
| VoltFit | €2.37 | €2.16 | June 2026 (10%) |
| Root & Rise | €2.91 | €2.50 | February 2026 (15%) |

Source: `data/competitor_price_history.csv`. Averages are arithmetic means of 12 monthly shelf-price observations, including promotions, rounded to cents. They are not sales-weighted. This file does not specify channel or pack format, so it provides context rather than a directly matched channel comparison.

## Implications for LUMEN

At €2.19 per can, LUMEN sits above Mate Libre and below VoltFit in the available matched single-can channels. It is 12.0% below VoltFit online, 7.6% below in grocery, and 19.5% below in gyms/offices. This supports an accessible-premium positioning.

VoltFit's June promotion reached €2.16, which is €0.03 below the proposed LUMEN price. LUMEN therefore needs a convincing ingredient and taste proposition alongside its everyday price advantage.

The supporting pricing analysis uses `data/price_test_results.csv`: €2.19 provides the highest acceptance-weighted unit contribution of the three tested prices in every channel. Competitor prices contextualize that result; they do not establish LUMEN demand or willingness to pay.

No German competitor sales volumes or market shares are supplied. A competitor sales-weighted price blend cannot be calculated from these files. `data/historical_sales_weekly.csv` contains LUMEN sales in the Netherlands, Denmark, and Sweden, not German competitor sales. VAT and deposit treatment require clarification before implementing shelf prices.
