import React from "react";
import priceTestCsv from "../data/price_test_results.csv?raw";
import economicsCsv from "../data/channel_economics.csv?raw";
import costCsv from "../data/cost_breakdown.csv?raw";
import funnelCsv from "../data/marketing_funnel_monthly.csv?raw";
import surveyCsv from "../data/customer_survey_anonymised.csv?raw";
import vwCsv from "../data/price_sensitivity_survey.csv?raw";
import {
  DATA_LTV_MONTHS,
  REC,
  defaultMarketingShares,
  loadCockpitData,
  weightedMarketingCac,
} from "./cockpit.js";
import { buildPriceCacView } from "./priceCac.js";

const data = loadCockpitData({
  priceTestCsv,
  economicsCsv,
  costCsv,
  funnelCsv,
  surveyCsv,
  vwCsv,
});

const view = buildPriceCacView(data, {
  year1Budget: 400000,
  lifetimeMonths: DATA_LTV_MONTHS,
  channelShares: REC.channelShares,
  cac: weightedMarketingCac(
    data.marketingCacs,
    defaultMarketingShares(data.marketingCacs),
  ),
});

function formatEurK(value) {
  const sign = value < 0 ? "−" : "";
  return `${sign}€${Math.round(Math.abs(value) / 1000)}k`;
}

function formatEur(value) {
  return `€${value.toFixed(2)}`;
}

function NetChart({ view }) {
  const width = 800;
  const height = 280;
  const pad = { top: 22, right: 16, bottom: 36, left: 48 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const xs = view.series.map((p) => p.price);
  const ys = view.series.flatMap((p) => [p.fixedNet, p.hardNet]);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys, 0);
  const y1 = Math.max(...ys, 0);
  const x = (p) => pad.left + ((p - x0) / (x1 - x0)) * innerW;
  const y = (v) => pad.top + innerH - ((v - y0) / (y1 - y0 || 1)) * innerH;
  const line = (key) =>
    view.series.map((p) => `${x(p.price)},${y(p[key])}`).join(" ");

  return (
    <svg
      className="vw-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Year-1 net versus launch price under two CAC assumptions"
    >
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const v = y0 + t * (y1 - y0);
        return (
          <g key={t}>
            <line
              className="trend-grid"
              x1={pad.left}
              x2={pad.left + innerW}
              y1={y(v)}
              y2={y(v)}
            />
            <text className="trend-tick" x={pad.left - 8} y={y(v) + 4} textAnchor="end">
              {formatEurK(v)}
            </text>
          </g>
        );
      })}
      <line
        className="trend-target"
        x1={pad.left}
        x2={pad.left + innerW}
        y1={y(0)}
        y2={y(0)}
      />
      <line
        className="vw-rec-line"
        x1={x(REC.price)}
        x2={x(REC.price)}
        y1={pad.top}
        y2={pad.top + innerH}
      />
      <text className="vw-rec-label" x={x(REC.price) + 6} y={pad.top + 14}>
        Our rec. {formatEur(REC.price)}
      </text>
      <polyline className="net-fixed" points={line("fixedNet")} />
      <polyline className="net-hard" points={line("hardNet")} />
      <circle
        className="net-peak"
        cx={x(view.hardPeak.price)}
        cy={y(view.hardPeak.hardNet)}
        r="4.5"
      />
      {[1.5, 2, 2.5, 3].map((p) => (
        <text key={p} className="trend-x" x={x(p)} y={height - 8} textAnchor="middle">
          {formatEur(p)}
        </text>
      ))}
    </svg>
  );
}

export default function PriceCacSection() {
  return (
    <section id="price-cac" className="price-cac" aria-labelledby="price-cac-title">
      <header className="tool-header">
        <p className="eyebrow">Price · the CAC question</p>
        <h2 id="price-cac-title">The price question is really a CAC question</h2>
        <p className="lede">
          One of these two lines has no answer in the data room. If winning a
          customer costs the same at every price, the model just says charge
          more. If a higher price makes customers harder to win, there is a
          real optimum — and a plateau, not a single point.
        </p>
      </header>

      <div className="vw-legend" aria-hidden="true">
        <span className="vw-swatch expensive">CAC fixed (data-room default)</span>
        <span className="vw-swatch too-cheap">CAC rises as acceptance falls</span>
        <span className="vw-swatch rec-line">Our rec. €2.19</span>
      </div>
      <NetChart view={view} />

      <div className="tradeoff">
        <article className="stat">
          <p className="stat-kicker">If CAC is independent of price</p>
          <h3>No peak</h3>
          <p className="stat-note">
            Year-1 net at €2.19 is {formatEurK(view.rec.fixedNet)} under the
            cockpit defaults (€400k budget, historical marketing mix, 18-month
            lifetime). The dashed line keeps rising because contribution per
            unit rises and customer count does not fall. That is our current
            model — and it is an assumption, not a finding.
          </p>
        </article>
        <article className="stat">
          <p className="stat-kicker">If win-rate tracks acceptance</p>
          <h3>Optimum {formatEur(view.hardPeak.price)}</h3>
          <p className="stat-note">
            Effective CAC = blended CAC × (acceptance at €2.19 ÷ acceptance at
            P). Peak hard-win net is {formatEurK(view.hardPeak.hardNet)} at{" "}
            {formatEur(view.hardPeak.price)}. The plateau (within ~4% of that
            peak) runs {formatEur(view.plateauMin)}–{formatEur(view.plateauMax)}.
            €2.19 sits on that plateau, not at a knife-edge. Acceptance outside
            €1.79–€2.59 is clamped to the nearest price-test knot.
          </p>
        </article>
      </div>
    </section>
  );
}
