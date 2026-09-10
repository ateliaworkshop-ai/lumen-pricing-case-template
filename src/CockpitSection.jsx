import React, { useEffect, useMemo, useState } from "react";
import priceTestCsv from "../data/price_test_results.csv?raw";
import economicsCsv from "../data/channel_economics.csv?raw";
import costCsv from "../data/cost_breakdown.csv?raw";
import funnelCsv from "../data/marketing_funnel_monthly.csv?raw";
import surveyCsv from "../data/customer_survey_anonymised.csv?raw";
import vwCsv from "../data/price_sensitivity_survey.csv?raw";
import {
  DATA_LTV_MONTHS,
  LTV_CAC_TARGET,
  PRICE_PICKS,
  SALES_CHANNELS,
  loadCockpitData,
  simulateCockpit,
  computeGivesUp,
  weightedMarketingCac,
  defaultMarketingShares,
  tensionScores,
  vsRecommendation,
  REC,
  sensitivityTornado,
} from "./cockpit.js";
import { fetchGermanHouseholdIncome } from "./eurostat.js";
import seasonCsv from "../data/seasonality_and_weather.csv?raw";
import { buildSeasonality, seasonIndexFor } from "./exhibits.js";

const data = loadCockpitData({
  priceTestCsv,
  economicsCsv,
  costCsv,
  funnelCsv,
  surveyCsv,
  vwCsv,
});

function formatEur(value, digits = 2) {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 10000) {
    return `${value < 0 ? "−" : ""}€${Math.round(abs).toLocaleString("en-GB")}`;
  }
  return `${value < 0 ? "−" : ""}€${abs.toFixed(digits)}`;
}

function formatMonths(value) {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(1)} mo`;
}

function formatRatio(value) {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(2)}:1`;
}

function signedDelta(value, format) {
  if (!Number.isFinite(value)) return "—";
  const pretty = format(Math.abs(value));
  if (Math.abs(value) < 1e-9) return pretty;
  return `${value > 0 ? "+" : "−"}${pretty}`;
}

function Tornado({ rows }) {
  const max = Math.max(...rows.map((r) => Math.abs(r.dRatio)), 0.01);
  return (
    <ul className="tornado">
      {rows.map((row) => {
        const width = (Math.abs(row.dRatio) / max) * 50;
        const positive = row.dRatio >= 0;
        return (
          <li key={row.label}>
            <span className="tornado-label">{row.label}</span>
            <div className="tornado-track" aria-hidden="true">
              <span
                className={positive ? "is-pos" : "is-neg"}
                style={{
                  width: `${width}%`,
                  marginLeft: positive ? "50%" : `${50 - width}%`,
                }}
              />
            </div>
            <span className="tornado-val">
              {positive ? "+" : "−"}
              {Math.abs(row.dRatio).toFixed(2)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

const DEFAULT_SHARES = REC.channelShares;
const DEFAULT_MKT = defaultMarketingShares(data.marketingCacs);
const season = buildSeasonality(seasonCsv);

const DEFAULT_REGION = "DE21";

export default function CockpitSection() {
  const [price, setPrice] = useState(2.19);
  const [shares, setShares] = useState(DEFAULT_SHARES);
  const [mktShares, setMktShares] = useState(DEFAULT_MKT);
  const [year1Budget, setYear1Budget] = useState(400000);
  const [lifetimeMonths, setLifetimeMonths] = useState(DATA_LTV_MONTHS);
  const [regions, setRegions] = useState([]);
  const [regionCode, setRegionCode] = useState(DEFAULT_REGION);
  const [regionError, setRegionError] = useState(null);
  const [launchMonth, setLaunchMonth] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchGermanHouseholdIncome(controller.signal)
      .then((result) => {
        setRegions(result.regions);
        setRegionCode((current) => current || result.regions[0]?.code || "");
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setRegionError(err.message || "Eurostat unavailable");
      });
    return () => controller.abort();
  }, []);

  const cac = useMemo(
    () => weightedMarketingCac(data.marketingCacs, mktShares),
    [mktShares],
  );

  const sim = useMemo(
    () =>
      simulateCockpit(data, {
        price,
        channelShares: shares,
        year1Budget,
        lifetimeMonths,
        cac,
      }),
    [price, shares, year1Budget, lifetimeMonths, cac],
  );

  const recSim = useMemo(
    () =>
      simulateCockpit(data, {
        price: REC.price,
        channelShares: REC.channelShares,
        year1Budget,
        lifetimeMonths: REC.lifetimeMonths,
        cac: weightedMarketingCac(data.marketingCacs, DEFAULT_MKT),
      }),
    [year1Budget],
  );

  const scores = useMemo(() => tensionScores(sim, data), [sim]);
  const vs = useMemo(
    () => vsRecommendation(sim, recSim, regionCode, mktShares, DEFAULT_MKT),
    [sim, recSim, regionCode, mktShares],
  );

  const givesUp = useMemo(
    () => computeGivesUp(data, price, sim.fundedNames),
    [price, sim.fundedNames],
  );

  const tornado = useMemo(
    () =>
      sensitivityTornado(data, {
        price,
        channelShares: shares,
        year1Budget,
        lifetimeMonths,
        cac,
      }),
    [price, shares, year1Budget, lifetimeMonths, cac],
  );

  const selectedRegion = regions.find((r) => r.code === regionCode);
  const seasonIndex = seasonIndexFor(season.months, launchMonth);
  const seasonalUnits = sim.units * (seasonIndex / 100);
  const seasonalNet = seasonalUnits * sim.blendContrib - sim.budget;

  function setShare(channel, value) {
    setShares((prev) => ({ ...prev, [channel]: Number(value) }));
  }

  function setMktShare(channel, value) {
    setMktShares((prev) => ({ ...prev, [channel]: Number(value) }));
  }

  const shareTotal = SALES_CHANNELS.reduce(
    (s, ch) => s + (Number(shares[ch]) || 0),
    0,
  );
  const mktTotal = data.marketingCacs.reduce(
    (s, row) => s + (Number(mktShares[row.channel]) || 0),
    0,
  );

  return (
    <section id="cockpit" className="cockpit" aria-labelledby="cockpit-title">
      <header className="tool-header">
        <p className="eyebrow">Stress-test · Decision cockpit</p>
        <h2 id="cockpit-title">Decision cockpit</h2>
        <p className="lede">
          Stress-test a price, a sales-channel spend mix, and the marketing
          mix that actually sets CAC. Two labelled assumptions (year-1 budget
          and customer lifetime) sit below. CAC is not measured per
          DTC/Retail/Gym — the same blended marketing CAC is applied to every
          funded sales channel.
        </p>
        <p className="stat-note">
          Opens on our recommended settings (€2.19, Retail/Grocery 45% and Gym
          &amp; Office 40% leading, DTC 15% for margin, Oberbayern, 18-month
          lifetime). Adjust any input to stress-test it.
        </p>
      </header>

      <div className="hero-kpis" aria-label="Live recommendation-scale outputs">
        <div>
          <span>Acceptance</span>
          <strong>{sim.acceptance.toFixed(1)}%</strong>
        </div>
        <div>
          <span>CAC payback</span>
          <strong>{formatMonths(sim.blendPayback)}</strong>
        </div>
        <div>
          <span>LTV:CAC</span>
          <strong>{formatRatio(sim.blendRatio)}</strong>
        </div>
        <div>
          <span>Year-1 net</span>
          <strong>{formatEur(sim.year1Net, 0)}</strong>
        </div>
      </div>

      <div className="cockpit-grid">
        <div className="cockpit-panel">
          <h3>Inputs</h3>
          <label className="cockpit-label" htmlFor="cockpit-price">
            Launch price
          </label>
          <input
            id="cockpit-price"
            type="range"
            min="1.49"
            max="2.79"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
          <p className="cockpit-price-readout">{formatEur(price)}</p>
          <div className="chip-row">
            {PRICE_PICKS.map((p) => (
              <button
                key={p}
                type="button"
                className={Math.abs(p - price) < 0.001 ? "chip is-on" : "chip"}
                onClick={() => setPrice(p)}
              >
                {formatEur(p)}
              </button>
            ))}
          </div>

          <label className="cockpit-label" style={{ marginTop: 18 }}>
            Marketing budget split (sales channels)
          </label>
          <p className="stat-note">
            % of the assumed year-1 budget. If the three sliders do not sum to
            100%, the mix is renormalized for the math.
          </p>
          {SALES_CHANNELS.map((ch) => (
            <div key={ch} className="cockpit-share">
              <span>
                {ch} · {Math.round(shares[ch])}%
              </span>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={shares[ch]}
                onChange={(e) => setShare(ch, e.target.value)}
              />
            </div>
          ))}
          <p className={Math.abs(shareTotal - 100) > 0.5 ? "assumption warn" : "stat-note"}>
            Split total: {shareTotal.toFixed(0)}%
            {Math.abs(shareTotal - 100) > 0.5 ? " — renormalized to 100% in outputs." : ""}
          </p>

          <label className="cockpit-label" style={{ marginTop: 18 }}>
            Marketing mix (this is the CAC lever)
          </label>
          <p className="stat-note">
            Historical spend shares from marketing_funnel_monthly.csv. Shift
            away from Retail Sampling toward Referral to move LTV:CAC — sales
            channels above do not change CAC.
          </p>
          {data.marketingCacs.map((row) => (
            <div key={row.channel} className="cockpit-share">
              <span>
                {row.channel} · {Math.round(mktShares[row.channel] || 0)}% · CAC{" "}
                {formatEur(row.cac)}
              </span>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={mktShares[row.channel] || 0}
                onChange={(e) => setMktShare(row.channel, e.target.value)}
              />
            </div>
          ))}
          <p className={Math.abs(mktTotal - 100) > 0.5 ? "assumption warn" : "stat-note"}>
            Mix total: {mktTotal.toFixed(0)}% · live blended CAC {formatEur(cac)}
            {Math.abs(mktTotal - 100) > 0.5 ? " — renormalized for the weighted CAC." : ""}
          </p>

          <label className="cockpit-label" htmlFor="cockpit-budget">
            Year-1 marketing budget
          </label>
          <p className="assumption">Assumption — not in the data room.</p>
          <input
            id="cockpit-budget"
            type="range"
            min="50000"
            max="1500000"
            step="10000"
            value={year1Budget}
            onChange={(e) => setYear1Budget(Number(e.target.value))}
          />
          <p className="cockpit-price-readout">{formatEur(year1Budget, 0)}</p>

          <label className="cockpit-label" htmlFor="cockpit-life">
            Customer lifetime
          </label>
          <p className="assumption">
            Assumption — default 18 months, matching the funnel window. LTV =
            contribution/unit × survey purchases/month ({data.freq.toFixed(2)}) ×
            this lifetime.
          </p>
          <input
            id="cockpit-life"
            type="range"
            min="6"
            max="36"
            step="1"
            value={lifetimeMonths}
            onChange={(e) => setLifetimeMonths(Number(e.target.value))}
          />
          <p className="stat-note">{lifetimeMonths} months</p>

          <label className="cockpit-label" htmlFor="cockpit-region">
            Launch region
          </label>
          <p className="assumption">
            Planning choice from live Eurostat NUTS 2 income — it does not
            rescale volume (no German sales history to estimate that).
          </p>
          {regionError && (
            <p className="limitation">Region list unavailable ({regionError}).</p>
          )}
          {!regionError && regions.length === 0 && (
            <p className="empty">Loading German regions from Eurostat…</p>
          )}
          {regions.length > 0 && (
            <select
              id="cockpit-region"
              className="cockpit-select"
              value={regionCode}
              onChange={(e) => setRegionCode(e.target.value)}
            >
              {regions.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name} · €{Math.round(r.income).toLocaleString("en-GB")}
                </option>
              ))}
            </select>
          )}

          <label className="cockpit-label" htmlFor="cockpit-month">
            Launch month (seasonality)
          </label>
          <p className="assumption">
            Assumption — German seasonality index applied only to year-1 units.
            Does not change CAC or LTV:CAC. There are no German LUMEN sales.
          </p>
          <select
            id="cockpit-month"
            className="cockpit-select"
            value={launchMonth}
            onChange={(e) => setLaunchMonth(Number(e.target.value))}
          >
            <option value={0}>Full-year average (index 100)</option>
            {season.months.map((m) => (
              <option key={m.month} value={m.month}>
                {m.label} · index {m.index} · {m.temp}°C
              </option>
            ))}
          </select>
        </div>

        <div className="cockpit-panel">
          <h3>Live outputs</h3>
          <div className={vs.onRec ? "vs-rec is-on" : "vs-rec is-off"}>
            {vs.onRec ? (
              <p>
                On the team recommendation (€2.19 · Retail 45 / Gym 40 / DTC 15
                · Oberbayern · historical marketing mix). Move a slider to see
                what you give up.
              </p>
            ) : (
              <>
                <p>
                  Away from our recommendation (€2.19 · Retail 45 / Gym 40 /
                  DTC 15 · Oberbayern · historical marketing mix).
                </p>
                <p>
                  Price {signedDelta(vs.dPrice, (n) => formatEur(n))} ·
                  acceptance{" "}
                  {signedDelta(vs.dAcceptance, (n) => `${n.toFixed(1)} pts`)} ·
                  contribution {signedDelta(vs.dContrib, (n) => formatEur(n))} ·
                  LTV:CAC {signedDelta(vs.dRatio, (n) => n.toFixed(2))} · CAC{" "}
                  {signedDelta(vs.dCac, (n) => formatEur(n))}
                </p>
                <button
                  type="button"
                  className="chip"
                  onClick={() => {
                    setPrice(REC.price);
                    setShares({ ...REC.channelShares });
                    setMktShares({ ...DEFAULT_MKT });
                    setLifetimeMonths(REC.lifetimeMonths);
                    setRegionCode(REC.regionCode);
                  }}
                >
                  Back to recommendation
                </button>
              </>
            )}
          </div>

          <div className="tension" aria-label="CMO versus CFO scores">
            <h3>CMO vs CFO tension</h3>
            <div className="tension-row">
              <div>
                <p className="tension-label">CFO · payback</p>
                <div className="meter" aria-hidden="true">
                  <span style={{ width: `${scores.cfo}%` }} />
                </div>
                <p className="stat-note">
                  {scores.cfo}/100 · LTV:CAC {formatRatio(sim.blendRatio)} vs{" "}
                  {LTV_CAC_TARGET}:1
                </p>
              </div>
              <div>
                <p className="tension-label">CMO · premium</p>
                <div className="meter is-cmo" aria-hidden="true">
                  <span style={{ width: `${scores.cmo}%` }} />
                </div>
                <p className="stat-note">
                  {scores.cmo}/100 · Urban Wellness comfort{" "}
                  {(scores.urbanComfort * 100).toFixed(0)}% at {formatEur(price)}
                </p>
              </div>
            </div>
            <p className="stat-note">
              CFO scores the 3:1 hurdle. CMO scores whether the price sits on
              the VoltFit / Root &amp; Rise shelf (€2.1–€2.7) and how many
              Urban Wellness respondents still have it inside their personal
              Van Westendorp band. At €2.19 that target segment is comfortable
              even though the all-respondent PMC–PME band ends near €1.97 —
              the generic gap is not their gap.
            </p>
          </div>

          <div className="cockpit-kpis">
            <article className="stat">
              <p className="stat-kicker">Volume</p>
              <h3>Acceptance</h3>
              <p className="stat-value">{sim.acceptance.toFixed(1)}%</p>
            </article>
            <article className="stat">
              <p className="stat-kicker">Margin</p>
              <h3>Contribution / unit</h3>
              <p className="stat-value">{formatEur(sim.blendContrib)}</p>
            </article>
            <article className="stat">
              <p className="stat-kicker">Payback</p>
              <h3>CAC payback</h3>
              <p className="stat-value">{formatMonths(sim.blendPayback)}</p>
            </article>
            <article className="stat">
              <p className="stat-kicker">Target {LTV_CAC_TARGET}:1</p>
              <h3>LTV:CAC</h3>
              <p className="stat-value">{formatRatio(sim.blendRatio)}</p>
              <p
                className={
                  sim.blendRatio >= LTV_CAC_TARGET
                    ? "status is-pass"
                    : "status is-miss"
                }
              >
                {sim.blendRatio >= LTV_CAC_TARGET
                  ? "Clears 3:1"
                  : "Below 3:1"}
              </p>
            </article>
          </div>
          <article className="stat" style={{ marginTop: 12 }}>
            <p className="stat-kicker">Year-1, net of marketing</p>
            <h3>{formatEur(sim.year1Net, 0)}</h3>
            <p className="stat-note">
              {Math.round(sim.customers).toLocaleString("en-GB")} customers ·{" "}
              {Math.round(sim.units).toLocaleString("en-GB")} units · retail
              revenue {formatEur(sim.revenue, 0)}. Customers = assumed budget ÷
              blended CAC {formatEur(sim.cac)}. Units = customers ×
              survey frequency × min(12, lifetime). Net = contribution × units −
              budget.
              {launchMonth
                ? ` Seasonal overlay (${season.months.find((m) => m.month === launchMonth)?.label}, index ${seasonIndex}): ${Math.round(seasonalUnits).toLocaleString("en-GB")} units · net ${formatEur(seasonalNet, 0)}.`
                : ""}
            </p>
          </article>

          {sim.fundedRows.length === 0 ? (
            <p className="empty">
              All channels are at 0% — fund at least one channel to see
              payback.
            </p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Contrib / unit</th>
                  <th>CAC</th>
                  <th>Payback</th>
                  <th>LTV:CAC</th>
                  <th>Year-1 net</th>
                  <th>Verdict</th>
                </tr>
              </thead>
              <tbody>
                {sim.fundedRows.map((row) => (
                  <tr key={row.channel}>
                    <td>
                      <strong>{row.channel}</strong>
                      <span className="cuts">
                        {(row.share * 100).toFixed(0)}% of assumed budget
                      </span>
                    </td>
                    <td>{formatEur(row.contribution)}</td>
                    <td>{formatEur(sim.cac)}</td>
                    <td>{formatMonths(row.payback)}</td>
                    <td>{formatRatio(row.ratio)}</td>
                    <td>{formatEur(row.year1Net, 0)}</td>
                    <td>
                      <span
                        className={
                          row.verdict === "clears 3:1"
                            ? "status is-pass"
                            : row.verdict === "close"
                              ? "status is-miss"
                              : "status is-miss"
                        }
                      >
                        {row.verdict}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="data-note">
            Same blended CAC ({formatEur(sim.cac)}) on every sales channel on
            purpose: the funnel file has Paid Social / Influencer / Sampling /
            Referral, not DTC/Retail/Gym. Channel differences in the table
            come only from contribution per unit; CAC moves when you change
            the marketing mix.
          </p>

          <div className="gives-up">
            <h3>What this choice gives up</h3>
            {selectedRegion && (
              <p className="stat-note">
                Launch framed in {selectedRegion.name} ({selectedRegion.code},{" "}
                {selectedRegion.year} disposable income{" "}
                {formatEur(selectedRegion.income, 0)}
                /inhabitant). Highest-income region in the Eurostat pull is{" "}
                {regions[0]?.name}.{" "}
                {regions[0] && selectedRegion.code !== regions[0].code
                  ? `Not starting in ${regions[0].name}.`
                  : "That is this selection."}{" "}
                Income is context, not a volume multiplier.
              </p>
            )}
            {givesUp.prefShareUnfunded > 0.001 ? (
              <p>
                Channel mix walks away from{" "}
                {(givesUp.prefShareUnfunded * 100).toFixed(0)}% of surveyed
                shoppers whose preferred sales channel is unfunded (
                {givesUp.unfundedPref
                  .map(
                    (c) =>
                      `${c.channel} ${(c.preferShare * 100).toFixed(0)}%`,
                  )
                  .join(", ")}
                ). From the anonymised survey extract (preferred_channel);
                names/emails are not in the file the app loads.
              </p>
            ) : (
              <p>
                All three sales channels have some budget, so the mix does not
                drop a preferred-channel group entirely (
                {givesUp.channelWalkaway
                  .map(
                    (c) =>
                      `${c.channel} ${(c.preferShare * 100).toFixed(0)}% prefer`,
                  )
                  .join(" · ")}
                ).
              </p>
            )}
            <p>Segment comfort at {formatEur(price)} (too cheap &lt; price &lt; too expensive, Van Westendorp survey):</p>
            <table>
              <thead>
                <tr>
                  <th>Segment</th>
                  <th>Inside personal band</th>
                  <th>Already too expensive</th>
                </tr>
              </thead>
              <tbody>
                {givesUp.segments.map((s) => (
                  <tr key={s.segment}>
                    <td>
                      <strong>{s.segment}</strong>
                    </td>
                    <td>{(s.comfort * 100).toFixed(0)}%</td>
                    <td>{(s.tooExpensive * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="gives-up">
            <h3>What moves LTV:CAC from here</h3>
            <p className="stat-note">
              Each bar is the change in LTV:CAC if that one lever moves, holding
              the other current inputs fixed. CAC mix and assumed lifetime move
              the ratio most; sales-channel mix moves it only through
              contribution per unit (same CAC on every sales channel).
            </p>
            <Tornado rows={tornado} />
          </div>
        </div>
      </div>
    </section>
  );
}
