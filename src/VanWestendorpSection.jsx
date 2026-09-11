import React, { useState } from "react";
import surveyCsv from "../data/price_sensitivity_survey.csv?raw";
import { parseCsv } from "./csv.js";
import { buildVanWestendorp, curveAtPrice } from "./vanWestendorp.js";
import { PRICE_MAX, PRICE_MIN, REC } from "./cockpit.js";
import { ChartTooltip, usePriceScrub } from "./usePriceScrub.jsx";
import { useDecision } from "./decision.jsx";

const view = buildVanWestendorp(parseCsv(surveyCsv));

const SERIES = [
  { key: "tooCheap", label: "Too cheap", className: "too-cheap", line: "vw-too-cheap" },
  { key: "cheap", label: "Cheap", className: "cheap", line: "vw-cheap" },
  { key: "expensive", label: "Expensive", className: "expensive", line: "vw-expensive" },
  { key: "tooExpensive", label: "Too expensive", className: "too-expensive", line: "vw-too-expensive" },
];

function formatEur(value) {
  return `€${value.toFixed(2)}`;
}

function CurveChart({
  view,
  livePrice,
  recPrice,
  pinnedPrice,
  hidden,
  onSetPrice,
  onPin,
}) {
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
  const scale = { width, padLeft: pad.left, padRight: pad.right, min: x0, max: x1 };
  const { hover, svgProps } = usePriceScrub({
    scale,
    livePrice,
    recPrice,
    onSetPrice,
    onPin,
  });

  function line(series) {
    return series.map((pct, i) => `${x(prices[i])},${y(pct)}`).join(" ");
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

  const showRec = Math.abs(livePrice - recPrice) > 0.02;
  const hoverAt = hover ? curveAtPrice(view, hover) : null;
  const hoverPct = hover != null ? (xc(hover) / width) * 100 : 50;

  return (
    <div className="chart-wrap">
      <svg
        className="vw-chart is-interactive"
        viewBox={`0 0 ${width} ${height}`}
        aria-label="Van Westendorp curves. Drag or use arrow keys to set the live price. Shift-click to pin a comparison. Double-click for the team recommendation."
        {...svgProps}
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
        {hover != null && (
          <line
            className="chart-crosshair"
            x1={xc(hover)}
            x2={xc(hover)}
            y1={pad.top}
            y2={pad.top + innerH}
          />
        )}
        {showRec && (
          <>
            <line
              className="vw-rec-line"
              x1={xc(recPrice)}
              x2={xc(recPrice)}
              y1={pad.top}
              y2={pad.top + innerH}
            />
            <text className="vw-rec-label" x={xc(recPrice) + 6} y={pad.top + 14}>
              Rec. {formatEur(recPrice)}
            </text>
          </>
        )}
        {pinnedPrice != null && (
          <>
            <line
              className="vw-pin-line"
              x1={xc(pinnedPrice)}
              x2={xc(pinnedPrice)}
              y1={pad.top}
              y2={pad.top + innerH}
            />
            <text className="vw-pin-label" x={xc(pinnedPrice) + 6} y={pad.top + innerH - 8}>
              Pin {formatEur(pinnedPrice)}
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
        <circle
          className="chart-handle"
          cx={xc(livePrice)}
          cy={pad.top + innerH / 2}
          r="7"
        />
        {SERIES.map((s) =>
          hidden[s.key] ? null : (
            <polyline
              key={s.key}
              className={`vw-line ${s.line}`}
              points={line(curves[s.key])}
            />
          ),
        )}
        {marks.map((m, i) => {
          const labelY = Math.max(y(m.share) - 8 - (i % 2) * 12, pad.top + 10);
          return (
            <g
              key={m.key}
              className="vw-mark"
              onPointerDown={(e) => {
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
      </svg>
      <ChartTooltip xPct={hoverPct}>
        {hoverAt && hover != null ? (
          <>
            <strong>{formatEur(hover)}</strong>
            <span>Too cheap {hoverAt.tooCheap.toFixed(0)}%</span>
            <span>Cheap {hoverAt.cheap.toFixed(0)}%</span>
            <span>Expensive {hoverAt.expensive.toFixed(0)}%</span>
            <span>Too expensive {hoverAt.tooExpensive.toFixed(0)}%</span>
          </>
        ) : null}
      </ChartTooltip>
    </div>
  );
}

export default function VanWestendorpSection() {
  const { price, setPrice, pinnedPrice, pinPrice } = useDecision();
  const [hidden, setHidden] = useState({});
  const atLive = curveAtPrice(view, price);
  const atPin = pinnedPrice != null ? curveAtPrice(view, pinnedPrice) : null;
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

  function clampSet(p) {
    setPrice(Math.min(PRICE_MAX, Math.max(PRICE_MIN, p)));
  }

  return (
    <section id="van-westendorp" className="van-westendorp" aria-labelledby="vw-title">
      <header className="tool-header">
        <p className="eyebrow">Price analysis · Van Westendorp</p>
        <h2 id="vw-title">Price Sensitivity Meter</h2>
        <p className="lede">
          Cumulative share of respondents at each price for the four survey
          thresholds. This is the survey view of what feels cheap or expensive
          — not a recommended launch price. Drag the terracotta handle, use
          arrow keys, or click an intersection to set the live price.
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
          {atPin && pinnedPrice != null
            ? ` Pinned ${formatEur(pinnedPrice)}: expensive ${atPin.expensive.toFixed(0)}% · too expensive ${atPin.tooExpensive.toFixed(0)}%.`
            : ""}
        </p>
      )}
      <p className="limitation">
        Our recommended €2.19 sits above the PMC–PME band
        {view.pme ? ` (PME ${formatEur(view.pme.price)})` : ""}. That is
        deliberate: the green band is generic-drink comfort; the terracotta
        strip is the VoltFit / Root &amp; Rise premium shelf (€2.1–€2.7). We
        price for that strip, not for the survey midpoint.
      </p>

      <div className="vw-legend">
        {SERIES.map((s) => (
          <button
            key={s.key}
            type="button"
            className={
              hidden[s.key]
                ? `vw-swatch ${s.className} is-off`
                : `vw-swatch ${s.className}`
            }
            aria-pressed={!hidden[s.key]}
            onClick={() =>
              setHidden((prev) => ({ ...prev, [s.key]: !prev[s.key] }))
            }
          >
            {s.label}
          </button>
        ))}
        <span className="vw-swatch live-line">Live {formatEur(price)}</span>
        <span className="vw-swatch rec-line">Team rec. €2.19</span>
        <span className="vw-swatch premium-band">Premium shelf €2.1–€2.7</span>
      </div>

      <CurveChart
        view={view}
        livePrice={price}
        recPrice={REC.price}
        pinnedPrice={pinnedPrice}
        hidden={hidden}
        onSetPrice={clampSet}
        onPin={pinPrice}
      />
      <p className="chart-hint">
        Drag to scrub the live price. Click the chart to focus it, then use
        arrows (Shift for €0.10). Shift-click or use Pin price to freeze a
        comparison. Double-click (or Home) returns to €2.19. Legend buttons
        hide a curve.
      </p>

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
