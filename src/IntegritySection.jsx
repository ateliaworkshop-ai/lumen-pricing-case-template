import React from "react";
import costCsv from "../data/cost_breakdown.csv?raw";
import surveyCsv from "../data/customer_survey_anonymised.csv?raw";
import vwCsv from "../data/price_sensitivity_survey.csv?raw";
import { parseCsv } from "./csv.js";
import { buildAwareness, vwNotExpensiveShare } from "./exhibits.js";

const costLines = parseCsv(costCsv).filter(
  (r) => Number.isFinite(r.cost_per_unit_eur) && Number.isFinite(r.pct_of_total),
);
const awareness = buildAwareness(surveyCsv);
const vw = parseCsv(vwCsv);

function formatEur(value, digits = 2) {
  return `€${Number(value).toFixed(digits)}`;
}

export default function IntegritySection() {
  const vw179 = vwNotExpensiveShare(vw, 1.79);
  const vw219 = vwNotExpensiveShare(vw, 2.19);
  const vw259 = vwNotExpensiveShare(vw, 2.59);

  return (
    <section id="integrity" className="integrity" aria-labelledby="integrity-title">
      <header className="tool-header">
        <p className="eyebrow">What we did not take at face value</p>
        <h2 id="integrity-title">Assumptions, judgement, and the data</h2>
        <p className="lede">
          Named so the recommendation can be falsified, not just defended.
          Nothing here changes the team conclusion — it says what would.
        </p>
      </header>

      <div className="integrity-grid">
        <div>
          <h3>Material caveats</h3>
          <ul className="integrity-list">
            <li>
              <strong>Acceptance at €1.79 does not reconcile.</strong> The price
              test file says 61.7%. The Van Westendorp “not yet expensive”
              share at €1.79 is {(vw179 * 100).toFixed(0)}%. At €2.19 the two
              sources agree ({(vw219 * 100).toFixed(1)}% vs 51.7%); at €2.59
              they are close ({(vw259 * 100).toFixed(1)}% vs 26.7%). We flag
              the cheap-price volume case rather than paper over it. The
              recommendation does not depend on €1.79 volume.
            </li>
            <li>
              <strong>Channel cuts are additive in the economics file.</strong>{" "}
              Retail/Grocery nets price × (1 − retailer − distributor −
              payment) − fulfillment. We use that convention throughout. A
              sequential stack would raise retail contribution and make grocery
              look better than it does here.
            </li>
            <li>
              <strong>Marketing channels are not sales channels.</strong> The
              funnel file is Paid Social / Influencer / Sampling / Referral.
              We do not invent a DTC or Retail CAC. The same blended marketing
              CAC is applied to every funded sales channel.
            </li>
            <li>
              <strong>Duplicates live in a file we do not use.</strong>{" "}
              historical_sales_weekly.csv has four exact duplicate
              week×country rows. This tool never aggregates that file, so
              nothing is dropped here. The README spike week is there too.
            </li>
            <li>
              <strong>Personal data is stripped before it reaches the
              browser.</strong> The data-room file customer_survey.csv includes
              first_name, last_name, and email. The app never imports that
              file. It loads customer_survey_anonymised.csv (those three
              columns dropped). The original stays in the data room as
              received.
            </li>
          </ul>
        </div>
        <div>
          <h3>What would change our mind</h3>
          <ul className="integrity-list">
            <li>
              Urban Wellness “not yet expensive” at €2.19 falling well below
              ~80% (it is {(vwNotExpensiveShare(vw.filter((r) => String(r.segment).includes("Urban Wellness")), 2.19) * 100).toFixed(0)}%
              today).
            </li>
            <li>
              No marketing-mix path that can move LTV:CAC toward 3:1 without
              starving launch volume — Referral-heavy is the current lever.
            </li>
            <li>
              Oberbayern losing its live Eurostat income lead, or Munich
              survey intent collapsing versus other cities.
            </li>
            <li>
              A competitor list-price move that closes the €1.59–€2.37 empty
              shelf — that reopens the €1.79 case.
            </li>
          </ul>
        </div>
      </div>

      <h3 className="subhead">Reference figures (not a forecast)</h3>
      <div className="integrity-refs">
        <table>
          <thead>
            <tr>
              <th>COGS line</th>
              <th>€ / can</th>
              <th>Share</th>
            </tr>
          </thead>
          <tbody>
            {costLines.map((r) => (
              <tr key={r.cost_component}>
                <td>{r.cost_component}</td>
                <td>{formatEur(r.cost_per_unit_eur)}</td>
                <td>{r.pct_of_total}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <table>
          <thead>
            <tr>
              <th>Awareness in the German survey</th>
              <th>Share of {awareness.n}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>PulsUp</td>
              <td>{(awareness.pulsup * 100).toFixed(0)}%</td>
            </tr>
            <tr>
              <td>Mate Libre</td>
              <td>{(awareness.matelibre * 100).toFixed(0)}%</td>
            </tr>
            <tr>
              <td>VoltFit</td>
              <td>{(awareness.voltfit * 100).toFixed(0)}%</td>
            </tr>
            <tr>
              <td>Root &amp; Rise</td>
              <td>{(awareness.rootandrise * 100).toFixed(0)}%</td>
            </tr>
            <tr>
              <td>LUMEN purchase intent ≥ 7/10</td>
              <td>{(awareness.intent7 * 100).toFixed(0)}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
