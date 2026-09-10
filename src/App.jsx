import React, { useMemo, useState } from "react";
import priceTestCsv from "../data/price_test_results.csv?raw";
import channelEconomicsCsv from "../data/channel_economics.csv?raw";
import PaybackSection from "./PaybackSection.jsx";
import VanWestendorpSection from "./VanWestendorpSection.jsx";
import CockpitSection from "./CockpitSection.jsx";
import LaunchLocationSection from "./LaunchLocationSection.jsx";
import SectionErrorBoundary from "./SectionErrorBoundary.jsx";
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
        <p className="rec-headline">
          €2.19, Retail/Grocery and Gym &amp; Office first, southern high-income
          regions.
        </p>
        <div className="rec-body">
          <p>
            <strong>Recommended price:</strong> €2.19. It keeps ~52% of surveyed
            buyers while clearing a healthy contribution margin across all
            channels, and positions LUMEN credibly in the gap between heritage
            brands (€1.4–1.8) and premium competitors (€2.1–2.7). €1.79
            sacrifices margin for volume; €2.59 loses more than half of buyers.
          </p>
          <p>
            <strong>Recommended channels (priority order):</strong> lead with
            Retail/Grocery and Gym &amp; Office, plus DTC Online for margin. Our
            current LTV:CAC ratio is 2.87 — below the 3:1 target — so we lead
            with lower-acquisition-cost channels to fix the payback gap, while
            DTC adds margin and customer data.
          </p>
          <p>
            <strong>Recommended launch regions (first):</strong> the
            highest-income southern German regions, led by Oberbayern
            (~€34,700/inhabitant). A premium €2.19 price is most defensible
            where household disposable income is highest, per live Eurostat
            data.
          </p>
          <p>
            <strong>What we are deliberately NOT optimizing for:</strong>{" "}
            maximum launch volume and the CMO&apos;s full premium-brand
            positioning. We prioritize a defensible price and faster marketing
            payback (the CFO&apos;s concern) over a slower, higher-spend
            premium brand build.
          </p>
          <p>
            <strong>On the price-sensitivity tension:</strong> Our Van
            Westendorp analysis places generic price expectations in the
            €1.38–€1.97 range, so our €2.19 recommendation sits deliberately
            above it. We accept this gap for three reasons: (1) the premium
            competitors we benchmark against (VoltFit, Root &amp; Rise) sell at
            €2.1–€3.1, showing the premium segment sustains higher prices; (2)
            our own price test shows 51.7% of buyers still accept €2.19; and (3)
            Van Westendorp measures expectations for a generic drink, whereas
            LUMEN is positioned as a premium brand. We are choosing to price for
            positioning over survey comfort — trading some volume for margin and
            brand credibility. This is a genuine tension, and we are naming it
            rather than hiding it.
          </p>
        </div>
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
      <VanWestendorpSection />
      <hr className="section-rule" />
      <PaybackSection />
      <hr className="section-rule" />
      <SectionErrorBoundary>
        <LaunchLocationSection />
      </SectionErrorBoundary>
      <hr className="section-rule" />
      <CockpitSection />
    </div>
  );
}
