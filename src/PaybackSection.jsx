import React from "react";
import funnelCsv from "../data/marketing_funnel_monthly.csv?raw";
import { buildFunnelView } from "./funnel.js";
import { useDecision } from "./decision.jsx";

const view = buildFunnelView(funnelCsv);

function formatEur(value) {
  return `€${value.toFixed(2)}`;
}

function formatRatio(value) {
  return `${value.toFixed(2)}:1`;
}

function TrendChart({ series, valueKey, target, liveValue, formatTick }) {
  const width = 800;
  const height = 180;
  const pad = { top: 16, right: 16, bottom: 28, left: 40 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const values = series.map((p) => p[valueKey]);
  const min = Math.min(...values, target ?? Infinity, liveValue ?? Infinity);
  const max = Math.max(...values, target ?? -Infinity, liveValue ?? -Infinity);
  const span = max - min || 1;
  const y = (v) => pad.top + innerH - ((v - min) / span) * innerH;
  const x = (i) =>
    pad.left + (series.length === 1 ? innerW / 2 : (i / (series.length - 1)) * innerW);

  const points = series.map((p, i) => `${x(i)},${y(p[valueKey])}`).join(" ");
  const ticks = [min, (min + max) / 2, max];

  return (
    <svg
      className="trend"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Trend of ${valueKey} over 18 months`}
    >
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            className="trend-grid"
            x1={pad.left}
            x2={pad.left + innerW}
            y1={y(tick)}
            y2={y(tick)}
          />
          <text className="trend-tick" x={pad.left - 8} y={y(tick) + 4} textAnchor="end">
            {formatTick(tick)}
          </text>
        </g>
      ))}
      {target != null && (
        <line
          className="trend-target"
          x1={pad.left}
          x2={pad.left + innerW}
          y1={y(target)}
          y2={y(target)}
        />
      )}
      {liveValue != null && Number.isFinite(liveValue) && (
        <line
          className="vw-live-line"
          x1={pad.left}
          x2={pad.left + innerW}
          y1={y(liveValue)}
          y2={y(liveValue)}
        />
      )}
      <polyline className="trend-line" points={points} />
      {series.map((p, i) => (
        <circle key={p.month} className="trend-dot" cx={x(i)} cy={y(p[valueKey])} r="3" />
      ))}
      {series.map((p, i) =>
        i % 3 === 0 || i === series.length - 1 ? (
          <text key={`${p.month}-lbl`} className="trend-x" x={x(i)} y={height - 6} textAnchor="middle">
            {p.label}
          </text>
        ) : null,
      )}
    </svg>
  );
}

export default function PaybackSection() {
  const { cac, sim, mktShares, boostMktChannel } = useDecision();
  const statusClass = view.meetsTarget ? "status is-pass" : "status is-miss";
  const statusLabel = view.meetsTarget
    ? `Clears the ${view.target}:1 target`
    : `Below the ${view.target}:1 target`;

  return (
    <section id="payback" className="payback" aria-labelledby="payback-title">
      <header className="tool-header">
        <p className="eyebrow">CFO view · acquisition efficiency</p>
        <h2 id="payback-title">Does marketing spend pay back?</h2>
        <p className="lede">
          Blended across all marketing channels in the funnel file —{" "}
          {view.marketingChannels.join(", ")}.
          Spend-weighted CAC and customer-weighted LTV; not a simple average of
          the per-row columns.
        </p>
      </header>

      <p className="limitation">
        These figures are by <strong>marketing</strong> channel, not by the three
        sales channels above (DTC Online, Retail/Grocery, Gym &amp; Office). The
        file does not break CAC or LTV down by sales channel, so this is an
        overall acquisition-efficiency view — not a per-channel launch CAC.
      </p>

      <div className="tradeoff tradeoff-3">
        <article className="stat">
          <p className="stat-kicker">Spend to acquire</p>
          <h3>Blended CAC</h3>
          <p className="stat-value">{formatEur(view.blendedCac)}</p>
          <p className="stat-note">Total spend ÷ customers acquired (18 months).</p>
        </article>
        <article className="stat">
          <p className="stat-kicker">Lifetime value</p>
          <h3>Blended LTV</h3>
          <p className="stat-value">{formatEur(view.blendedLtv)}</p>
          <p className="stat-note">
            Average estimated LTV, weighted by customers acquired.
          </p>
        </article>
        <article className="stat">
          <p className="stat-kicker">Payback test</p>
          <h3>LTV:CAC</h3>
          <p className="stat-value">{formatRatio(view.ltvCac)}</p>
          <p className={statusClass} role="status">
            {statusLabel}
          </p>
        </article>
      </div>

      <div className="charts">
        <article>
          <h3>Blended CAC over time</h3>
          <p className="stat-note">Lower is more efficient acquisition. Terracotta line is the live blended CAC from the marketing mix.</p>
          <TrendChart
            series={view.series}
            valueKey="cac"
            liveValue={cac}
            formatTick={(v) => `€${v.toFixed(0)}`}
          />
        </article>
        <article>
          <h3>LTV:CAC over time</h3>
          <p className="stat-note">
            Dashed line is the {view.target}:1 target assumed in the brief.
            Terracotta is the live cockpit LTV:CAC ({sim.blendRatio.toFixed(2)}:1).
          </p>
          <TrendChart
            series={view.series}
            valueKey="ltvCac"
            target={view.target}
            liveValue={sim.blendRatio}
            formatTick={(v) => `${v.toFixed(1)}:1`}
          />
        </article>
      </div>

      <p className="live-callout">
        Historical blend is {formatEur(view.blendedCac)} CAC and{" "}
        {formatRatio(view.ltvCac)}. Live marketing mix is {formatEur(cac)} CAC
        and {formatRatio(sim.blendRatio)} — click a row below to weight that
        channel more (the funnel history itself does not change).
      </p>
      <h3 className="subhead">Why the blend misses 3:1</h3>
      <p className="stat-note">
        Retail Sampling is {((view.byChannel[0]?.spendShare ?? 0) * 100).toFixed(0)}%
        of spend at {formatEur(view.byChannel[0]?.cac ?? 0)} CAC. Referral is
        cheaper. The cockpit marketing-mix sliders move this blend; sales
        channel (DTC / Retail / Gym) does not.
      </p>
      <table>
        <thead>
          <tr>
            <th>Marketing channel</th>
            <th>Historical spend</th>
            <th>Live mix</th>
            <th>Customers</th>
            <th>CAC</th>
          </tr>
        </thead>
        <tbody>
          {view.byChannel.map((row) => (
            <tr
              key={row.channel}
              className="is-clickable"
              onClick={() => boostMktChannel(row.channel)}
            >
              <td>
                <strong>{row.channel}</strong>
                <span className="mini-bar" aria-hidden="true">
                  <span style={{ width: `${row.spendShare * 100}%` }} />
                </span>
              </td>
              <td>{(row.spendShare * 100).toFixed(1)}%</td>
              <td>{Math.round(mktShares[row.channel] || 0)}%</td>
              <td>{Math.round(row.customers).toLocaleString("en-GB")}</td>
              <td>{formatEur(row.cac)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="chart-hint">
        Click a marketing channel to shift the live mix toward it. Historical
        spend shares stay as recorded.
      </p>

      <p className="data-note">
        Data check: {view.dataNote.rowsRead} month×channel rows in
        marketing_funnel_monthly.csv
        {view.dataNote.dropped === 0
          ? " — no duplicate keys, and reported CAC matches spend ÷ customers on every row. Nothing excluded."
          : ` — dropped ${view.dataNote.dropped} duplicate month×channel row(s).`}{" "}
        The README’s duplicate rows and spike week sit in the home-market weekly
        sales file, which this section does not use.
      </p>
    </section>
  );
}
