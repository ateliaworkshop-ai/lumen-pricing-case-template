import React, { useMemo } from "react";
import competitorCsv from "../data/competitor_prices_by_channel.csv?raw";
import PaybackSection from "./PaybackSection.jsx";
import VanWestendorpSection from "./VanWestendorpSection.jsx";
import CockpitSection from "./CockpitSection.jsx";
import LaunchLocationSection from "./LaunchLocationSection.jsx";
import SectionErrorBoundary from "./SectionErrorBoundary.jsx";
import ShelfSection from "./ShelfSection.jsx";
import VoicesSection from "./VoicesSection.jsx";
import TimingSection from "./TimingSection.jsx";
import PriceCacSection from "./PriceCacSection.jsx";
import IntegritySection from "./IntegritySection.jsx";
import PageNav from "./PageNav.jsx";
import { parseCsv } from "./csv.js";
import { LUMEN_PRICE, SINGLE_CAN, vwNotExpensiveShare } from "./exhibits.js";
import {
  interpolateAcceptance,
  PRICE_MAX,
  PRICE_MIN,
  PRICE_PICKS,
  SALES_CHANNELS,
  unitEconomics,
} from "./cockpit.js";
import { DecisionBar, DecisionProvider, useDecision } from "./decision.jsx";

const competitorRows = parseCsv(competitorCsv).filter(
  (r) => r.format === SINGLE_CAN,
);

function formatEur(value) {
  return `€${value.toFixed(2)}`;
}

function formatPct(value, { alreadyPercent = false } = {}) {
  const pct = alreadyPercent ? value : value * 100;
  return `${pct.toFixed(1)}%`;
}

function structureLabel(channel, takeRates) {
  const s = takeRates[channel];
  const parts = [];
  if (s.retailer) parts.push(`retailer ${formatPct(s.retailer)}`);
  if (s.distributor) parts.push(`distributor ${formatPct(s.distributor)}`);
  if (s.payment) parts.push(`payment ${formatPct(s.payment)}`);
  if (s.fulfillment) parts.push(`fulfillment ${formatEur(s.fulfillment)}`);
  return parts.length ? `Cuts: ${parts.join(" · ")}` : "No intermediary cuts";
}

function AppInner() {
  const {
    price,
    setPrice,
    shares,
    toggleChannel,
    leadChannel,
    fundedChannels,
    cockpitData,
  } = useDecision();

  const selected = useMemo(() => new Set(fundedChannels), [fundedChannels]);
  const onKnot = cockpitData.acceptanceKnots.some(
    (k) => Math.abs(k.price - price) < 0.001,
  );
  const acceptance = interpolateAcceptance(price, cockpitData.acceptanceKnots);

  const rows = fundedChannels.map((channel) => {
    const econ = unitEconomics(
      price,
      channel,
      cockpitData.takeRates,
      cockpitData.cogs,
    );
    return {
      channel,
      net_price_to_lumen_eur: econ.net,
      unit_contribution_eur: econ.contribution,
      contribution_margin_pct: econ.margin,
    };
  });

  const blendedContribution =
    rows.length === 0
      ? null
      : rows.reduce((sum, r) => sum + r.unit_contribution_eur, 0) / rows.length;
  const blendedMargin =
    rows.length === 0
      ? null
      : rows.reduce((sum, r) => sum + r.contribution_margin_pct, 0) /
        rows.length;

  const maxContrib = rows.reduce(
    (m, r) => Math.max(m, r.unit_contribution_eur),
    0,
  );

  const shelfPeers = competitorRows.filter((r) => selected.has(r.channel));

  function competitorBand(predicate) {
    const map = new Map();
    for (const row of shelfPeers) {
      if (!predicate(row.price_eur)) continue;
      const cur = map.get(row.competitor) ?? { min: Infinity, max: -Infinity };
      cur.min = Math.min(cur.min, row.price_eur);
      cur.max = Math.max(cur.max, row.price_eur);
      map.set(row.competitor, cur);
    }
    return [...map.entries()].map(([name, band]) =>
      band.min === band.max
        ? `${name} ${formatEur(band.min)}`
        : `${name} ${formatEur(band.min)}–${formatEur(band.max)}`,
    );
  }

  const below = competitorBand((p) => p < price);
  const above = competitorBand((p) => p > price);
  const vwShare = vwNotExpensiveShare(cockpitData.vw, price);

  return (
    <div className="page">
      <a className="skip-link" href="#recommendation">
        Skip to recommendation
      </a>
      <div className="sticky-stack">
        <PageNav />
        <DecisionBar />
      </div>

      <section
        id="recommendation"
        className="recommendation"
        aria-labelledby="recommendation-title"
      >
        <p className="eyebrow">Team conclusion</p>
        <h1 id="recommendation-title">Our Recommendation</h1>
        <p className="rec-headline">
          €2.19, Retail/Grocery and Gym &amp; Office first, southern high-income
          regions.
        </p>
        <ul className="rec-kpis">
          <li>
            <span>Price</span>
            <strong>€2.19</strong>
          </li>
          <li>
            <span>Lead channels</span>
            <strong>Retail + Gym</strong>
          </li>
          <li>
            <span>First region</span>
            <strong>Oberbayern</strong>
          </li>
        </ul>
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

      <section id="explorer" className="explorer" aria-labelledby="explorer-title">
      <header className="tool-header">
        <p className="eyebrow">LUMEN · Germany market entry</p>
        <h2 id="explorer-title">Price &amp; channel explorer</h2>
        <p className="lede">
          Compare launch price and channel mix. Acceptance is a volume signal;
          contribution is what LUMEN keeps per unit after channel cuts. These
          controls are the same live decision as the bar, the charts, and the
          cockpit — change one, and the rest follow.
        </p>
      </header>

      <section className="controls">
        <fieldset>
          <legend>Launch price</legend>
          <input
            type="range"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            aria-label="Launch price"
          />
          <p className="stat-note">Live {formatEur(price)}</p>
          <div className="chip-row">
            {PRICE_PICKS.map((p) => (
              <button
                key={p}
                type="button"
                className={Math.abs(p - price) < 0.001 ? "chip is-on" : "chip"}
                onClick={() => setPrice(p)}
                aria-pressed={Math.abs(p - price) < 0.001}
              >
                {formatEur(p)}
                {p === LUMEN_PRICE ? <span className="chip-tag">team</span> : null}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Channels (select one or more)</legend>
          <div className="chip-row">
            {SALES_CHANNELS.map((channel) => (
              <button
                key={channel}
                type="button"
                className={selected.has(channel) ? "chip is-on" : "chip"}
                onClick={() => toggleChannel(channel)}
                aria-pressed={selected.has(channel)}
              >
                {channel}
                {selected.has(channel) ? (
                  <span className="chip-tag">{Math.round(shares[channel])}%</span>
                ) : null}
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
                {onKnot
                  ? `Share of surveyed respondents who would buy at ${formatEur(price)}.`
                  : `Interpolated between the price-test knots (€1.79 / €2.19 / €2.59) at ${formatEur(price)}.`}{" "}
                Same for every channel at a given price. Van Westendorp “not
                yet expensive” at this price is {(vwShare * 100).toFixed(1)}%
                {Math.abs(vwShare * 100 - acceptance) > 5
                  ? " — that does not reconcile with this file, and we flag it rather than pick a side."
                  : " — in line with this file."}
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
                Equal-weight average across {fundedChannels.join(", ")}.
                Not a volume-weighted mix. Channel % in the chips is the
                cockpit spend split.
              </p>
            </article>
          </section>

          {shelfPeers.length > 0 && (
            <p className="shelf-context">
              At {formatEur(price)}, LUMEN sits above{" "}
              {below.length ? below.join(", ") : "no listed singles"}
              {above.length
                ? ` and below ${above.join(", ")}`
                : ", at the top of the listed singles"}{" "}
              on the selected channel(s). Single-can 330 ml list prices only.
            </p>
          )}

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
                  <tr
                    key={r.channel}
                    className="is-clickable"
                    onClick={() => leadChannel(r.channel)}
                  >
                    <td>
                      <strong>{r.channel}</strong>
                      <span className="cuts">
                        {structureLabel(r.channel, cockpitData.takeRates)}
                      </span>
                    </td>
                    <td>{formatEur(r.net_price_to_lumen_eur)}</td>
                    <td>
                      {formatEur(r.unit_contribution_eur)}
                      <span className="mini-bar" aria-hidden="true">
                        <span
                          style={{
                            width: maxContrib
                              ? `${(r.unit_contribution_eur / maxContrib) * 100}%`
                              : "0%",
                          }}
                        />
                      </span>
                    </td>
                    <td>{r.contribution_margin_pct.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="chart-hint">Click a row to lead the live mix toward that channel (70 / 15 / 15).</p>
          </section>
        </>
      )}
      </section>

      <hr className="section-rule" />
      <PriceCacSection />
      <hr className="section-rule" />
      <ShelfSection />
      <hr className="section-rule" />
      <VanWestendorpSection />
      <hr className="section-rule" />
      <VoicesSection />
      <hr className="section-rule" />
      <PaybackSection />
      <hr className="section-rule" />
      <TimingSection />
      <hr className="section-rule" />
      <SectionErrorBoundary>
        <LaunchLocationSection />
      </SectionErrorBoundary>
      <hr className="section-rule" />
      <IntegritySection />
      <hr className="section-rule" />
      <CockpitSection />
    </div>
  );
}

export default function App() {
  return (
    <DecisionProvider>
      <AppInner />
    </DecisionProvider>
  );
}
