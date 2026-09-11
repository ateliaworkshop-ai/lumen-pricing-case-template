import React, { useState } from "react";
import surveyCsv from "../data/price_sensitivity_survey.csv?raw";
import { parseCsv } from "./csv.js";
import { buildVanWestendorp, curveAtPrice } from "./vanWestendorp.js";
import { PRICE_MAX, PRICE_MIN, REC } from "./cockpit.js";
import { priceFromSvgEvent } from "./chartPointer.js";
import { useDecision } from "./decision.jsx";

const view = buildVanWestendorp(parseCsv(surveyCsv));

function formatEur(value) {
  return `€${value.toFixed(2)}`;
}

function CurveChart({ view, livePrice, recPrice, onSetPrice }) {
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
  const [hover, setHover] = useState(null);

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

  const scale = { width, padLeft: pad.left, padRight: pad.right, min: x0, max: x1 };
  const showRec = Math.abs(livePrice - recPrice) > 0.02;
  const hoverAt = hover ? curveAtPrice(view, hover) : null;

  function readPrice(event) {
    return priceFromSvgEvent(event, scale);
  }

  return (
    <svg
      className="vw-chart is-interactive"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Van Westendorp cumulative price-sensitivity curves. Click to set the live price."
      onClick={(e) => onSetPrice(readPrice(e))}
      onMouseMove={(e) => setHover(readPrice(e))}
      onMouseLeave={() => setHover(null)}
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
      <rect
        className="vw-premium"
        x={xc(2.1)}
        y={pad.top}
        width={Math.max(0, xc(2.7) - xc(2.1))}
        height={innerH}
      />
      {showRec && (
        <>
          <line
            className="vw-rec-line"
            x1={xc(recPrice)}
            x2={xc(recPrice)}
            y1={pad.top}
            y2={pad.top + innerH}
          />
          <text
            className="vw-rec-label"
            x={xc(recPrice) + 6}
            y={pad.top + 14}
          >
            Rec. {formatEur(recPrice)}
          </text>
        </>
      )}
      <line
        className="vw-live-line"
        x1={xc(livePrice)}
        x2={xc(livePrice)}
        y1={pad.top}
        y2={pad.top + innerH}
      />
      <text
        className="vw-live-label"
        x={
          xc(livePrice) > pad.left + innerW - 110
            ? xc(livePrice) - 8
            : xc(livePrice) + 6
        }
        y={pad.top + (showRec ? 28 : 14)}
        textAnchor={
          xc(livePrice) > pad.left + innerW - 110 ? "end" : "start"
        }
      >
        Live {formatEur(livePrice)}
      </text>
      <polyline className="vw-line vw-too-cheap" points={line(curves.tooCheap)} />
      <polyline className="vw-line vw-cheap" points={line(curves.cheap)} />
      <polyline className="vw-line vw-expensive" points={line(curves.expensive)} />
      <polyline className="vw-line vw-too-expensive" points={line(curves.tooExpensive)} />
      {marks.map((m, i) => {
        const labelY = Math.max(y(m.share) - 8 - (i % 2) * 12, pad.top + 10);
        return (
          <g
            key={m.key}
            className="vw-mark"
            onClick={(e) => {
              e.stopPropagation();
              onSetPrice(m.price);
            }}
          >
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
      {hoverAt && hover != null && (
        <text className="chart-hover" x={xc(hover)} y={pad.top + innerH - 8} textAnchor="middle">
          {formatEur(hover)} · exp {hoverAt.expensive.toFixed(0)}% · too exp {hoverAt.tooExpensive.toFixed(0)}%
        </text>
      )}
    </svg>
  );
}

export default function VanWestendorpSection() {
  const { price, setPrice } = useDecision();
  const atLive = curveAtPrice(view, price);
  const range =
    view.pmc && view.pme
      ? `Acceptable range: ${formatEur(view.pmc.price)}–${formatEur(view.pme.price)}${
          view.opp ? `, optimal ≈ ${formatEur(view.opp.price)}` : ""
        }`
      : "Acceptable range could not be computed from the intersections.";

  const points = [
    { key: "PMC", label: "Point of Marginal Cheapness", view: view.pmc, note: "Too Cheap meets Expensive. Below this, quality doubts rise." },
    { key: "PME", label: "Point of Marginal Expensiveness", view: view.pme, note: "Cheap meets Too Expensive. Above this, resistance rises." },
    { key: "IPP", label: "Indifference Price Point", view: view.ipp, note: "Cheap meets Expensive." },
    { key: "OPP", label: "Optimal Price Point", view: view.opp, note: "Too Cheap meets Too Expensive." },
  ];

  return (
    <section id="van-westendorp" className="van-westendorp" aria-labelledby="vw-title">
      <header className="tool-header">
        <p className="eyebrow">Price analysis · Van Westendorp</p>
        <h2 id="vw-title">Price Sensitivity Meter</h2>
        <p className="lede">
          Cumulative share of respondents at each price for the four survey
          thresholds. This is the survey view of what feels cheap or expensive
          — not a recommended launch price. Click the chart or a labelled
          intersection to set the live price.
        </p>
      </header>

      <p className="vw-range" role="status">
        {range}
      </p>
      {atLive && (
        <p className="live-callout">
          At live {formatEur(price)}: too cheap {atLive.tooCheap.toFixed(0)}% ·
          cheap {atLive.cheap.toFixed(0)}% · expensive {atLive.expensive.toFixed(0)}% ·
          too expensive {atLive.tooExpensive.toFixed(0)}%.
        </p>
      )}
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
        <span className="vw-swatch live-line">Live {formatEur(price)}</span>
        <span className="vw-swatch rec-line">Team rec. €2.19</span>
        <span className="vw-swatch premium-band">Premium shelf €2.1–€2.7</span>
      </div>

      <CurveChart
        view={view}
        livePrice={price}
        recPrice={REC.price}
        onSetPrice={(p) => setPrice(Math.min(PRICE_MAX, Math.max(PRICE_MIN, p)))}
      />
      <p className="chart-hint">Click anywhere on the chart to set the live price. Click PMC / PME / IPP / OPP to jump to that intersection.</p>

      <ul className="vw-points">
        {points.map((p) => (
          <li key={p.key}>
            <button
              type="button"
              className="linkish"
              disabled={!p.view}
              onClick={() => p.view && setPrice(p.view.price)}
            >
              <strong>{p.key}</strong> ({p.label})
              {p.view ? ` — ${formatEur(p.view.price)}` : " — not found"}
            </button>
            . {p.note}
          </li>
        ))}
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
