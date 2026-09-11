import React, { useMemo, useState } from "react";
import { PRICE_MAX, PRICE_MIN, REC } from "./cockpit.js";
import { buildPriceCacView } from "./priceCac.js";
import { ChartTooltip, usePriceScrub } from "./usePriceScrub.jsx";
import { useDecision } from "./decision.jsx";

function formatEurK(value) {
  const sign = value < 0 ? "−" : "";
  return `${sign}€${Math.round(Math.abs(value) / 1000)}k`;
}

function formatEur(value) {
  return `€${value.toFixed(2)}`;
}

function closestRow(series, price) {
  return series.reduce((best, row) =>
    Math.abs(row.price - price) < Math.abs(best.price - price) ? row : best,
  );
}

function NetChart({
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
  const pad = { top: 22, right: 16, bottom: 36, left: 48 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const xs = view.series.map((p) => p.price);
  const ys = view.series.flatMap((p) => [
    hidden.fixed ? Infinity : p.fixedNet,
    hidden.hard ? Infinity : p.hardNet,
  ]).filter((v) => Number.isFinite(v));
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys, 0);
  const y1 = Math.max(...ys, 0);
  const x = (p) => pad.left + ((p - x0) / (x1 - x0)) * innerW;
  const y = (v) => pad.top + innerH - ((v - y0) / (y1 - y0 || 1)) * innerH;
  const line = (key) =>
    view.series.map((p) => `${x(p.price)},${y(p[key])}`).join(" ");
  const scale = { width, padLeft: pad.left, padRight: pad.right, min: x0, max: x1 };
  const { hover, svgProps } = usePriceScrub({
    scale,
    livePrice,
    recPrice,
    onSetPrice,
    onPin,
  });
  const showRec = Math.abs(livePrice - recPrice) > 0.02;
  const live = closestRow(view.series, livePrice);
  const hovered = hover ? closestRow(view.series, hover) : null;
  const hoverPct = hover != null ? (x(hover) / width) * 100 : 50;

  return (
    <div className="chart-wrap">
      <svg
        className="vw-chart is-interactive"
        viewBox={`0 0 ${width} ${height}`}
        aria-label="Year-1 net versus launch price. Drag or use arrow keys to set the live price. Shift-click to pin a comparison."
        {...svgProps}
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
        {hover != null && (
          <line
            className="chart-crosshair"
            x1={x(hover)}
            x2={x(hover)}
            y1={pad.top}
            y2={pad.top + innerH}
          />
        )}
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
        {pinnedPrice != null && (
          <>
            <line
              className="vw-pin-line"
              x1={x(pinnedPrice)}
              x2={x(pinnedPrice)}
              y1={pad.top}
              y2={pad.top + innerH}
            />
            <text className="vw-pin-label" x={x(pinnedPrice) + 6} y={pad.top + innerH - 8}>
              Pin {formatEur(pinnedPrice)}
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
        {!hidden.fixed && <polyline className="net-fixed" points={line("fixedNet")} />}
        {!hidden.hard && <polyline className="net-hard" points={line("hardNet")} />}
        <circle
          className="net-peak"
          cx={x(view.hardPeak.price)}
          cy={y(view.hardPeak.hardNet)}
          r="4.5"
          onPointerDown={(e) => {
            e.stopPropagation();
            onSetPrice(view.hardPeak.price);
          }}
        />
        <circle className="net-live" cx={x(live.price)} cy={y(live.hardNet)} r="4" />
        <circle
          className="chart-handle"
          cx={x(livePrice)}
          cy={pad.top + innerH / 2}
          r="7"
        />
        {[1.5, 2, 2.5, 3].map((p) => (
          <text key={p} className="trend-x" x={x(p)} y={height - 8} textAnchor="middle">
            {formatEur(p)}
          </text>
        ))}
      </svg>
      <ChartTooltip xPct={hoverPct}>
        {hovered ? (
          <>
            <strong>{formatEur(hovered.price)}</strong>
            {!hidden.hard && <span>Hard-win {formatEurK(hovered.hardNet)}</span>}
            {!hidden.fixed && <span>Fixed CAC {formatEurK(hovered.fixedNet)}</span>}
            <span>Acceptance {hovered.acceptance.toFixed(1)}%</span>
          </>
        ) : null}
      </ChartTooltip>
    </div>
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
    pinnedPrice,
    pinPrice,
  } = useDecision();
  const [hidden, setHidden] = useState({ fixed: false, hard: false });

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

  const live = closestRow(view.series, price);
  const pinned = pinnedPrice != null ? closestRow(view.series, pinnedPrice) : null;

  function clampSet(p) {
    setPrice(Math.min(PRICE_MAX, Math.max(PRICE_MIN, p)));
  }

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
          live mix, budget, lifetime, and marketing CAC. Drag to set the price.
        </p>
      </header>

      <div className="vw-legend">
        <button
          type="button"
          className={hidden.fixed ? "vw-swatch expensive is-off" : "vw-swatch expensive"}
          aria-pressed={!hidden.fixed}
          onClick={() => setHidden((h) => ({ ...h, fixed: !h.fixed }))}
        >
          CAC fixed (data-room default)
        </button>
        <button
          type="button"
          className={hidden.hard ? "vw-swatch too-cheap is-off" : "vw-swatch too-cheap"}
          aria-pressed={!hidden.hard}
          onClick={() => setHidden((h) => ({ ...h, hard: !h.hard }))}
        >
          CAC rises as acceptance falls
        </button>
        <span className="vw-swatch live-line">Live {formatEur(price)}</span>
        <span className="vw-swatch rec-line">Team rec. €2.19</span>
      </div>
      <NetChart
        view={view}
        livePrice={price}
        recPrice={REC.price}
        pinnedPrice={pinnedPrice}
        hidden={hidden}
        onSetPrice={clampSet}
        onPin={pinPrice}
      />
      <p className="chart-hint">
        Drag the handle, click, or focus the chart and use arrows. Shift-click
        pins a comparison price. Double-click returns to €2.19. Click the
        terracotta peak to jump to the hard-win optimum. Legend buttons hide a
        line.
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
            {pinned
              ? ` Pinned ${formatEur(pinned.price)} is ${formatEurK(pinned.fixedNet)}.`
              : ""}
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
            {pinned
              ? ` Pinned ${formatEur(pinned.price)} sits at ${formatEurK(pinned.hardNet)}.`
              : ""}{" "}
            Acceptance outside €1.79–€2.59 is clamped to the nearest price-test
            knot.
          </p>
        </article>
      </div>
    </section>
  );
}
