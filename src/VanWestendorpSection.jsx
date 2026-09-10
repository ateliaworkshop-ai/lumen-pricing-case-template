import React from "react";
import surveyCsv from "../data/price_sensitivity_survey.csv?raw";
import { parseCsv } from "./csv.js";
import { buildVanWestendorp } from "./vanWestendorp.js";

const view = buildVanWestendorp(parseCsv(surveyCsv));

function formatEur(value) {
  return `€${value.toFixed(2)}`;
}

function CurveChart({ view, recPrice = 2.19, premiumBand = { min: 2.1, max: 2.7 } }) {
  const width = 800;
  const height = 280;
  const pad = { top: 18, right: 16, bottom: 36, left: 42 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const { prices, curves } = view;
  const x0 = prices[0];
  const x1 = prices[prices.length - 1];
  const x = (p) => pad.left + ((p - x0) / (x1 - x0)) * innerW;
  const xc = (p) => x(Math.min(x1, Math.max(x0, p)));
  const y = (pct) => pad.top + innerH - (pct / 100) * innerH;

  function line(series) {
    return series
      .map((pct, i) => `${x(prices[i])},${y(pct)}`)
      .join(" ");
  }

  const marks = [
    view.pmc && { key: "PMC", ...view.pmc, className: "vw-pmc" },
    view.ipp && { key: "IPP", ...view.ipp, className: "vw-ipp" },
    view.pme && { key: "PME", ...view.pme, className: "vw-pme" },
    view.opp && { key: "OPP", ...view.opp, className: "vw-opp" },
  ].filter(Boolean);

  const band =
    view.pmc && view.pme
      ? { x: x(view.pmc.price), w: x(view.pme.price) - x(view.pmc.price) }
      : null;

  const xTicks = [];
  const start = Math.ceil(x0 * 2) / 2;
  for (let p = start; p <= x1 + 1e-9; p += 0.5) xTicks.push(Number(p.toFixed(1)));

  return (
    <svg
      className="vw-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Van Westendorp cumulative price-sensitivity curves"
    >
      {[0, 25, 50, 75, 100].map((tick) => (
        <g key={tick}>
          <line
            className="trend-grid"
            x1={pad.left}
            x2={pad.left + innerW}
            y1={y(tick)}
            y2={y(tick)}
          />
          <text className="trend-tick" x={pad.left - 8} y={y(tick) + 4} textAnchor="end">
            {tick}%
          </text>
        </g>
      ))}
      {xTicks.map((p) => (
        <text key={p} className="trend-x" x={x(p)} y={height - 8} textAnchor="middle">
          €{p.toFixed(1)}
        </text>
      ))}
      {band && (
        <rect
          className="vw-band"
          x={band.x}
          y={pad.top}
          width={Math.max(band.w, 0)}
          height={innerH}
        />
      )}
      {premiumBand && (
        <rect
          className="vw-premium"
          x={xc(premiumBand.min)}
          y={pad.top}
          width={Math.max(0, xc(premiumBand.max) - xc(premiumBand.min))}
          height={innerH}
        />
      )}
      <line
        className="vw-rec-line"
        x1={xc(recPrice)}
        x2={xc(recPrice)}
        y1={pad.top}
        y2={pad.top + innerH}
      />
      <text
        className="vw-rec-label"
        x={
          xc(recPrice) > pad.left + innerW - 110
            ? xc(recPrice) - 8
            : xc(recPrice) + 6
        }
        y={pad.top + 14}
        textAnchor={
          xc(recPrice) > pad.left + innerW - 110 ? "end" : "start"
        }
      >
        Our rec. {formatEur(recPrice)}
      </text>
      <polyline className="vw-line vw-too-cheap" points={line(curves.tooCheap)} />
      <polyline className="vw-line vw-cheap" points={line(curves.cheap)} />
      <polyline className="vw-line vw-expensive" points={line(curves.expensive)} />
      <polyline className="vw-line vw-too-expensive" points={line(curves.tooExpensive)} />
      {marks.map((m, i) => {
        const labelY = Math.max(y(m.share) - 8 - (i % 2) * 12, pad.top + 10);
        return (
          <g key={m.key}>
            <circle className={m.className} cx={x(m.price)} cy={y(m.share)} r="4.5" />
            <text
              className="vw-mark-label"
              x={x(m.price)}
              y={labelY}
              textAnchor="middle"
            >
              {m.key} {formatEur(m.price)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function VanWestendorpSection() {
  const range =
    view.pmc && view.pme
      ? `Acceptable range: ${formatEur(view.pmc.price)}–${formatEur(view.pme.price)}${
          view.opp ? `, optimal ≈ ${formatEur(view.opp.price)}` : ""
        }`
      : "Acceptable range could not be computed from the intersections.";

  return (
    <section id="van-westendorp" className="van-westendorp" aria-labelledby="vw-title">
      <header className="tool-header">
        <p className="eyebrow">Price analysis · Van Westendorp</p>
        <h2 id="vw-title">Price Sensitivity Meter</h2>
        <p className="lede">
          Cumulative share of respondents at each price for the four survey
          thresholds. This is the survey view of what feels cheap or expensive
          — not a recommended launch price.
        </p>
      </header>

      <p className="vw-range" role="status">
        {range}
      </p>
      <p className="limitation">
        Our recommended €2.19 sits above the PMC–PME band
        {view.pme ? ` (PME ${formatEur(view.pme.price)})` : ""}. That is
        deliberate: the green band is generic-drink comfort; the terracotta
        strip is the VoltFit / Root &amp; Rise premium shelf (€2.1–€2.7). We
        price for that strip, not for the survey midpoint.
      </p>

      <div className="vw-legend" aria-hidden="true">
        <span className="vw-swatch too-cheap">Too cheap</span>
        <span className="vw-swatch cheap">Cheap</span>
        <span className="vw-swatch expensive">Expensive</span>
        <span className="vw-swatch too-expensive">Too expensive</span>
        <span className="vw-swatch rec-line">Our rec. €2.19</span>
        <span className="vw-swatch premium-band">Premium shelf €2.1–€2.7</span>
      </div>

      <CurveChart view={view} />

      <ul className="vw-points">
        <li>
          <strong>PMC</strong> (Point of Marginal Cheapness)
          {view.pmc ? ` — ${formatEur(view.pmc.price)}` : " — not found"}. Too
          Cheap meets Expensive. Below this, quality doubts rise.
        </li>
        <li>
          <strong>PME</strong> (Point of Marginal Expensiveness)
          {view.pme ? ` — ${formatEur(view.pme.price)}` : " — not found"}. Cheap
          meets Too Expensive. Above this, resistance rises.
        </li>
        <li>
          <strong>IPP</strong> (Indifference Price Point)
          {view.ipp ? ` — ${formatEur(view.ipp.price)}` : " — not found"}. Cheap
          meets Expensive.
        </li>
        <li>
          <strong>OPP</strong> (Optimal Price Point)
          {view.opp ? ` — ${formatEur(view.opp.price)}` : " — not found"}. Too
          Cheap meets Too Expensive.
        </li>
      </ul>

      {view.oppNote && <p className="data-note">{view.oppNote}</p>}

      <p className="stat-note">
        Green band is the acceptable range (PMC–PME); terracotta strip is the
        premium competitor shelf. Built from{" "}
        {view.n} of {view.read} respondents in price_sensitivity_survey.csv
        {view.droppedMissing || view.droppedOrder
          ? ` (dropped ${view.droppedMissing} incomplete, ${view.droppedOrder} with thresholds out of order).`
          : " — no rows dropped; all four thresholds were complete and ordered."}
      </p>
    </section>
  );
}
