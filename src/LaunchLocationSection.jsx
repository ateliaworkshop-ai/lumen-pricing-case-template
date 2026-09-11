import React from "react";
import IncomeMap from "./IncomeMap.jsx";
import marketCsv from "../data/market_context.csv?raw";
import surveyCsv from "../data/customer_survey_anonymised.csv?raw";
import { buildMarket, buildSurveyBridge } from "./exhibits.js";
import { REC } from "./cockpit.js";
import { useDecision } from "./decision.jsx";

const market = buildMarket(marketCsv);
const survey = buildSurveyBridge(surveyCsv);

function formatIncome(value) {
  return `€${Math.round(value).toLocaleString("en-GB")}`;
}

function formatBn(value) {
  if (!Number.isFinite(value)) return "—";
  return `€${(value / 1e9).toFixed(2)}bn`;
}

export default function LaunchLocationSection() {
  const {
    regions,
    regionYear,
    regionStatus,
    regionError,
    regionCode,
    setRegionCode,
    selectedRegion,
  } = useDecision();
  const munich = market.regions.find((r) => r.name === "Munich");

  return (
    <section id="launch" className="launch" aria-labelledby="launch-title">
      <header className="tool-header">
        <p className="eyebrow">Where to launch · regional income</p>
        <h2 id="launch-title">Household income by German region</h2>
        <p className="lede">
          Live Eurostat data (nama_10r_2hhinc): net disposable income of private
          households, euro per inhabitant, NUTS 2 regions. Click a row or a
          region on the map to set the live launch region. Higher income is a
          purchasing-power signal for a first launch. Price, channel, and
          payback still have to be read alongside this.
        </p>
      </header>

      <div className="tradeoff">
        <article className="stat">
          <p className="stat-kicker">Adaptogenic subcategory · 2026</p>
          <h3>Addressable context</h3>
          <p className="stat-value">{formatBn(market.adaptogenic2026)}</p>
          <p className="stat-note">
            Plant-based / adaptogenic slice of the German functional-beverage
            market (exhibit 1). Energy/focus is {formatBn(market.energy2026)}.
            These are category sizes, not LUMEN forecasts.
          </p>
        </article>
        <article className="stat">
          <p className="stat-kicker">Live first region</p>
          <h3>{selectedRegion ? selectedRegion.name : "Loading…"}</h3>
          <p className="stat-value">
            {munich ? `${Math.round(munich.share * 100)}%` : "—"}
          </p>
          <p className="stat-note">
            {selectedRegion
              ? `${selectedRegion.name} (${selectedRegion.code}) is the live launch frame. Exhibit 1 places Munich in Oberbayern (DE21), the team first region. Share is illustrative for a city-by-city rollout — not a volume model.`
              : "Exhibit 1 places Munich in Oberbayern (NUTS 2 DE21), our first region."}
          </p>
        </article>
      </div>

      {regionStatus === "loading" && (
        <p className="empty" role="status">
          Loading latest regional income from Eurostat…
        </p>
      )}

      {regionStatus === "error" && (
        <p className="limitation" role="alert">
          Eurostat could not be reached ({regionError}). The ranked table needs that
          live response, so it is not shown. Price/channel and payback above
          are unaffected.
        </p>
      )}

      {regionStatus === "ready" && regions.length > 0 && (
        <>
          <p className="data-note launch-note">
            Ranked highest to lowest for {regionYear} — the most recent year
            with German NUTS 2 values (2024 is published for some countries,
            not yet for Germany). Source: Eurostat API, fetched in this
            session. Click a row to set the live region. Oberbayern (DE21) is
            the team first region; the live pick is outlined on the map.
          </p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>NUTS 2 region</th>
                  <th>Code</th>
                  <th>Disposable income / inhabitant</th>
                </tr>
              </thead>
              <tbody>
                {regions.map((region, i) => (
                  <tr
                    key={region.code}
                    className={
                      region.code === regionCode
                        ? "is-pick is-clickable"
                        : "is-clickable"
                    }
                    onClick={() => setRegionCode(region.code)}
                  >
                    <td>{i + 1}</td>
                    <td>
                      <strong>{region.name}</strong>
                      {region.code === REC.regionCode ? (
                        <span className="cuts">Team first region</span>
                      ) : region.code === regionCode ? (
                        <span className="cuts">Live pick</span>
                      ) : null}
                    </td>
                    <td>{region.code}</td>
                    <td>{formatIncome(region.income)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <IncomeMap
            regions={regions}
            highlightCode={regionCode}
            onSelect={setRegionCode}
          />
        </>
      )}

      <h3 className="subhead">Survey cities ↔ NUTS 2</h3>
      <p className="stat-note">
        {survey.n} German respondents from the anonymised survey extract
        (city, segment, intent, sensitivity — no names or emails). Click a city
        row to jump the live region to its NUTS 2, when the mapping is unique.
        Density of Urban Wellness in a city is a targeting hint, not a sales
        history.
      </p>
      <table>
        <thead>
          <tr>
            <th>Survey city</th>
            <th>Respondents</th>
            <th>Urban Wellness</th>
            <th>Purchase intent</th>
            <th>Price sensitivity</th>
            <th>Eurostat NUTS 2</th>
          </tr>
        </thead>
        <tbody>
          {survey.cityRows.map((c) => (
            <tr
              key={c.city}
              className={
                c.nuts?.code === regionCode
                  ? "is-pick is-clickable"
                  : c.nuts
                    ? "is-clickable"
                    : undefined
              }
              onClick={() => c.nuts && setRegionCode(c.nuts.code)}
            >
              <td>
                <strong>{c.city}</strong>
              </td>
              <td>
                {c.n} ({(c.share * 100).toFixed(0)}%)
              </td>
              <td>{(c.urbanShare * 100).toFixed(0)}%</td>
              <td>{c.intent.toFixed(1)} / 10</td>
              <td>{c.sens.toFixed(1)} / 10</td>
              <td>
                {c.nuts
                  ? `${c.nuts.nutsName} (${c.nuts.code})`
                  : "Not a single NUTS 2"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
