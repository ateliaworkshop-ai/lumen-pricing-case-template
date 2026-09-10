import React, { useMemo, useState } from "react";
import priceTestCsv from "../data/price_test_results.csv?raw";
import channelEconomicsCsv from "../data/channel_economics.csv?raw";
import PaybackSection from "./PaybackSection.jsx";
import { parseCsv } from "./csv.js";

const PRICES = [1.79, 2.19, 2.59];
const CHANNELS = ["DTC Online", "Retail/Grocery", "Gym & Office"];

const priceRows = parseCsv(priceTestCsv);
const economicsRows = parseCsv(channelEconomicsCsv);

const channelStructure = Object.fromEntries(
  CHANNELS.map((channel) => {
    const row = economicsRows.find((r) => r.channel === channel);
    return [
      channel,
      {
        retailer: row.retailer_margin_pct,
        distributor: row.distributor_cut_pct,
        payment: row.payment_processing_pct,
        fulfillment: row.fulfillment_cost_eur,
      },
    ];
  }),
);

function formatEur(value) {
  return `€${value.toFixed(2)}`;
}

function formatPct(value, { alreadyPercent = false } = {}) {
  const pct = alreadyPercent ? value : value * 100;
  return `${pct.toFixed(1)}%`;
}

function structureLabel(channel) {
  const s = channelStructure[channel];
  const parts = [];
  if (s.retailer) parts.push(`retailer ${formatPct(s.retailer)}`);
  if (s.distributor) parts.push(`distributor ${formatPct(s.distributor)}`);
  if (s.payment) parts.push(`payment ${formatPct(s.payment)}`);
  if (s.fulfillment) parts.push(`fulfillment ${formatEur(s.fulfillment)}`);
  return parts.length ? `Cuts: ${parts.join(" · ")}` : "No intermediary cuts";
}

export default function App() {
  const [price, setPrice] = useState(2.19);
  const [selected, setSelected] = useState(() => new Set(CHANNELS));

  function toggleChannel(channel) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(channel)) next.delete(channel);
      else next.add(channel);
      return next;
    });
  }

  const selectedChannels = CHANNELS.filter((c) => selected.has(c));

  const rows = useMemo(
    () =>
      priceRows.filter(
        (r) => r.price_eur === price && selected.has(r.channel),
      ),
    [price, selected],
  );

  const acceptance = rows[0]?.estimated_acceptance_pct_of_survey ?? null;
  const blendedContribution =
    rows.length === 0
      ? null
      : rows.reduce((sum, r) => sum + r.unit_contribution_eur, 0) / rows.length;
  const blendedMargin =
    rows.length === 0
      ? null
      : rows.reduce((sum, r) => sum + r.contribution_margin_pct, 0) /
        rows.length;

  return (
    <div className="page">
      <section className="recommendation" aria-labelledby="recommendation-title">
        <p className="eyebrow">Team conclusion</p>
        <h1 id="recommendation-title">Our Recommendation</h1>
        <p className="placeholder">[to be written by the team]</p>
      </section>

      <header className="tool-header">
        <p className="eyebrow">LUMEN · Germany market entry</p>
        <h2>Price &amp; channel explorer</h2>
        <p className="lede">
          Compare launch price and channel mix. Acceptance is a volume signal;
          contribution is what LUMEN keeps per unit after channel cuts. No
          option is marked as recommended.
        </p>
      </header>

      <section className="controls">
        <fieldset>
          <legend>Launch price</legend>
          <div className="chip-row">
            {PRICES.map((p) => (
              <button
                key={p}
                type="button"
                className={p === price ? "chip is-on" : "chip"}
                onClick={() => setPrice(p)}
                aria-pressed={p === price}
              >
                {formatEur(p)}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Channels (select one or more)</legend>
          <div className="chip-row">
            {CHANNELS.map((channel) => (
              <button
                key={channel}
                type="button"
                className={selected.has(channel) ? "chip is-on" : "chip"}
                onClick={() => toggleChannel(channel)}
                aria-pressed={selected.has(channel)}
              >
                {channel}
              </button>
            ))}
          </div>
        </fieldset>
      </section>

      {rows.length === 0 ? (
        <p className="empty">Select at least one channel to see the trade-off.</p>
      ) : (
        <>
          <section className="tradeoff" aria-label="Acceptance versus margin">
            <article className="stat stat-volume">
              <p className="stat-kicker">Volume</p>
              <h3>Estimated acceptance</h3>
              <p className="stat-value">{acceptance.toFixed(1)}%</p>
              <div className="bar" aria-hidden="true">
                <span style={{ width: `${acceptance}%` }} />
              </div>
              <p className="stat-note">
                Share of surveyed respondents who would buy at {formatEur(price)}.
                Same for every channel at a given price.
              </p>
            </article>
            <article className="stat stat-margin">
              <p className="stat-kicker">Margin</p>
              <h3>Blended contribution</h3>
              <p className="stat-value">{formatEur(blendedContribution)}</p>
              <p className="stat-sub">
                per unit · {blendedMargin.toFixed(1)}% contribution margin
              </p>
              <p className="stat-note">
                Equal-weight average across {selectedChannels.join(", ")}.
                Not a volume-weighted mix.
              </p>
            </article>
          </section>

          <section className="channels" aria-label="Contribution by channel">
            <h3>Per-unit contribution by channel</h3>
            <table>
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Net to LUMEN</th>
                  <th>Contribution / unit</th>
                  <th>Contribution margin</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.channel}>
                    <td>
                      <strong>{r.channel}</strong>
                      <span className="cuts">{structureLabel(r.channel)}</span>
                    </td>
                    <td>{formatEur(r.net_price_to_lumen_eur)}</td>
                    <td>{formatEur(r.unit_contribution_eur)}</td>
                    <td>{r.contribution_margin_pct.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      <hr className="section-rule" />
      <PaybackSection />
    </div>
  );
}
