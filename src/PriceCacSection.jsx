import React, { useMemo, useState } from "react";
import { PRICE_MAX, PRICE_MIN, REC } from "./cockpit.js";
import { buildPriceCacView } from "./priceCac.js";
import { priceFromSvgEvent } from "./chartPointer.js";
import { useDecision } from "./decision.jsx";

function formatEurK(value) {
  const sign = value < 0 ? "−" : "";
  return `${sign}€${Math.round(Math.abs(value) / 1000)}k`;
}

function formatEur(value) {
  return `€${value.toFixed(2)}`;
}

function NetChart({ view, livePrice, recPrice, onSetPrice }) {
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
  const [hover, setHover] = useState(null);
  const scale = { width, padLeft: pad.left, padRight: pad.right, min: x0, max: x1 };
  const showRec = Math.abs(livePrice - recPrice) > 0.02;

  const live = view.series.reduce((best, row) =>
    Math.abs(row.price - livePrice) < Math.abs(best.price - livePrice) ? row : best,
  );
  const hovered = hover
    ? view.series.reduce((best, row) =>
        Math.abs(row.price - hover) < Math.abs(best.price - hover) ? row : best,
      )
    : null;

  function readPrice(event) {
    return priceFromSvgEvent(event, scale);
  }

  return (
    <svg
      className="vw-chart is-interactive"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Year-1 net versus launch price under two CAC assumptions. Click to set the live price."
      onClick={(e) => onSetPrice(readPrice(e))}
      onMouseMove={(e) => setHover(readPrice(e))}
      onMouseLeave={() => setHover(null)}
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
      {showRec && (
        <>
          <line
            className="vw-rec-line"
            x1={x(recPrice)}
            x2={x(recPrice)}
            y1={pad.top}
            y2={pad.top + innerH}
          />
          <text className="vw-rec-label" x={x(recPrice) + 6} y={pad.top + 14}>
            Rec. {formatEur(recPrice)}
          </text>
        </>
      )}
      <line
        className="vw-live-line"
        x1={x(livePrice)}
        x2={x(livePrice)}
        y1={pad.top}
        y2={pad.top + innerH}
      />
      <text className="vw-live-label" x={x(livePrice) + 6} y={pad.top + (showRec ? 28 : 14)}>
        Live {formatEur(livePrice)}
      </text>
      <polyline className="net-fixed" points={line("fixedNet")} />
      <polyline className="net-hard" points={line("hardNet")} />
      <circle
        className="net-peak"
        cx={x(view.hardPeak.price)}
        cy={y(view.hardPeak.hardNet)}
        r="4.5"
        onClick={(e) => {
          e.stopPropagation();
          onSetPrice(view.hardPeak.price);
        }}
      />
      <circle className="net-live" cx={x(live.price)} cy={y(live.hardNet)} r="4" />
      {[1.5, 2, 2.5, 3].map((p) => (
        <text key={p} className="trend-x" x={x(p)} y={height - 8} textAnchor="middle">
          {formatEur(p)}
        </text>
      ))}
      {hovered && (
        <text className="chart-hover" x={x(hovered.price)} y={pad.top + innerH - 8} textAnchor="middle">
          {formatEur(hovered.price)} · hard {formatEurK(hovered.hardNet)} · fixed {formatEurK(hovered.fixedNet)}
        </text>
      )}
    </svg>
  );
}

export default function PriceCacSection() {
  const {
    price,
    setPrice,
    year1Budget,
    lifetimeMonths,
    shares,
    cac,
    cockpitData,
  } = useDecision();

  const view = useMemo(
    () =>
      buildPriceCacView(cockpitData, {
        year1Budget,
        lifetimeMonths,
        channelShares: shares,
        cac,
      }),
    [cockpitData, year1Budget, lifetimeMonths, shares, cac],
  );

  const live = view.series.reduce((best, row) =>
    Math.abs(row.price - price) < Math.abs(best.price - price) ? row : best,
  );

  return (
    <section id="price-cac" className="price-cac" aria-labelledby="price-cac-title">
      <header className="tool-header">
        <p className="eyebrow">Price · the CAC question</p>
        <h2 id="price-cac-title">The price question is really a CAC question</h2>
        <p className="lede">
          One of these two lines has no answer in the data room. If winning a
          customer costs the same at every price, the model just says charge
          more. If a higher price makes customers harder to win, there is a
          real optimum — and a plateau, not a single point. The curves use the
          live mix, budget, lifetime, and marketing CAC. Click to set the price.
        </p>
      </header>

      <div className="vw-legend" aria-hidden="true">
        <span className="vw-swatch expensive">CAC fixed (data-room default)</span>
        <span className="vw-swatch too-cheap">CAC rises as acceptance falls</span>
        <span className="vw-swatch live-line">Live {formatEur(price)}</span>
        <span className="vw-swatch rec-line">Team rec. €2.19</span>
      </div>
      <NetChart
        view={view}
        livePrice={price}
        recPrice={REC.price}
        onSetPrice={(p) => setPrice(Math.min(PRICE_MAX, Math.max(PRICE_MIN, p)))}
      />
      <p className="chart-hint">
        Click the chart to set the live price. The terracotta peak is the
        hard-win optimum under the current mix — click it to jump there.
      </p>

      <div className="tradeoff">
        <article className="stat">
          <p className="stat-kicker">If CAC is independent of price</p>
          <h3>No peak</h3>
          <p className="stat-note">
            Year-1 net at live {formatEur(price)} is {formatEurK(live.fixedNet)}{" "}
            under the current cockpit settings (€{Math.round(year1Budget / 1000)}k
            budget, live marketing mix, {lifetimeMonths}-month lifetime). The
            dashed line keeps rising because contribution per unit rises and
            customer count does not fall. That is our current model — and it is
            an assumption, not a finding.
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
            Live {formatEur(price)} sits at {formatEurK(live.hardNet)}.
            Acceptance outside €1.79–€2.59 is clamped to the nearest price-test
            knot.
          </p>
        </article>
      </div>
    </section>
  );
}
