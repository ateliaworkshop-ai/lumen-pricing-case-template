# LUMEN Germany launch analysis

## Recommendation

Use a **Balanced Launch**: test a €2.19 price through DTC Online and Gym & Office first, with a controlled retail expansion after initial learning. Prioritise Urban Wellness Professionals and Fitness & Gym-Goers in Berlin and Munich, using a May–July pilot window.

This is a recommendation, not an observed German sales result. LUMEN has no German historical sales, so the analysis uses German survey evidence, price tests, competitor/channel economics, market context, and home-market marketing data as explicitly labelled proxies.

## Evidence used

- €2.19 has 51.7% estimated acceptance, versus 61.7% at €1.79 and 26.7% at €2.59.
- At €2.19, unit contribution is €1.16 DTC, €1.13 Gym & Office, and €0.63 Retail/Grocery.
- German survey intent is highest for Urban Wellness Professionals (9.12/10) and then Fitness & Gym-Goers (7.97/10).
- Retail/Grocery is the most common stated preferred channel (46.4%), but DTC and Gym & Office have stronger tested unit economics at €2.19.
- The marketing-funnel data gives a weighted CAC of €44.01 and weighted LTV of €126.32, or 2.87x LTV:CAC across the supplied home-market channel data.
- Berlin and Munich have the largest city market-share proxies among named cities (18% and 15%) and the highest regional CAGR assumption (9%).
- Seasonality peaks in July (138), followed by June (132) and August (128), against a 100 average.

## Data quality treatment

The supplied CSVs were checked for missing values and exact duplicate rows. The core files have no missing values; `historical_sales_weekly.csv` contains four duplicate rows as documented by the case and it was not used to create a German volume forecast. The customer survey contains 420 complete records and name/email fields, but those fields—and respondent IDs—were excluded from all calculations and displays; only grouped aggregates are used. The raw survey should remain restricted to the team and must not be published as part of a public deployment.

## Deliberate limitations

The dashboard does not invent units sold, revenue, German CAC, or payback period. The case files provide acceptance and contribution tests but no German launch budget or base-volume assumption. Those metrics should be added as editable scenario inputs once the team agrees a pilot budget and distribution target.
