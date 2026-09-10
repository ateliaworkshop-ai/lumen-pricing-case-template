import React, { useEffect, useState } from "react";
import { fetchGermanHouseholdIncome } from "./eurostat.js";
import IncomeMap from "./IncomeMap.jsx";
import marketCsv from "../data/market_context.csv?raw";
import surveyCsv from "../data/customer_survey_anonymised.csv?raw";
import { buildMarket, buildSurveyBridge } from "./exhibits.js";

const market = buildMarket(marketCsv);
const survey = buildSurveyBridge(surveyCsv);
const TEAM_REGION = "DE21";

function formatIncome(value) {
  return `€${Math.round(value).toLocaleString("en-GB")}`;
}

function formatBn(value) {
  if (!Number.isFinite(value)) return "—";
  return `€${(value / 1e9).toFixed(2)}bn`;
}

export default function LaunchLocationSection() {
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchGermanHouseholdIncome(controller.signal)
      .then((result) => {
        setData(result);
        setStatus("ready");
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(err.message || "Eurostat request failed");
        setStatus("error");
      });

    return () => controller.abort();
  }, []);

  const munich = market.regions.find((r) => r.name === "Munich");

  return (
    <section id="launch" className="launch" aria-labelledby="launch-title">
      <header className="tool-header">
        <p className="eyebrow">Where to launch · regional income</p>
        <h2 id="launch-title">Household income by German region</h2>
        <p className="lede">
          Live Eurostat data (nama_10r_2hhinc): net disposable income of private
          households, euro per inhabitant, NUTS 2 regions. Higher income is a
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
          <p className="stat-kicker">Munich in exhibit 1</p>
          <h3>Illustrative share</h3>
          <p className="stat-value">
            {munich ? `${Math.round(munich.share * 100)}%` : "—"}
          </p>
          <p className="stat-note">
            Exhibit 1 places Munich in Oberbayern (NUTS 2 DE21), our first
            region. Share is illustrative for a city-by-city rollout — not a
            volume model.
          </p>
        </article>
      </div>

      {status === "loading" && (
        <p className="empty" role="status">
          Loading latest regional income from Eurostat…
        </p>
      )}

      {status === "error" && (
        <p className="limitation" role="alert">
          Eurostat could not be reached ({error}). The ranked table needs that
          live response, so it is not shown. Price/channel and payback above
          are unaffected.
        </p>
      )}

      {status === "ready" && data && (
        <>
          <p className="data-note launch-note">
            Ranked highest to lowest for {data.year} — the most recent year
            with German NUTS 2 values (2024 is published for some countries,
            not yet for Germany). Source: Eurostat API, fetched in this
            session. Oberbayern (DE21) is outlined as the team first region.
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
                {data.regions.map((region, i) => (
                  <tr
                    key={region.code}
                    className={region.code === TEAM_REGION ? "is-pick" : undefined}
                  >
                    <td>{i + 1}</td>
                    <td>
                      <strong>{region.name}</strong>
                      {region.code === TEAM_REGION ? (
                        <span className="cuts">Team first region</span>
                      ) : null}
                    </td>
                    <td>{region.code}</td>
                    <td>{formatIncome(region.income)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <IncomeMap regions={data.regions} highlightCode={TEAM_REGION} />
        </>
      )}

      <h3 className="subhead">Survey cities ↔ NUTS 2</h3>
      <p className="stat-note">
        {survey.n} German respondents from the anonymised survey extract
        (city, segment, intent, sensitivity — no names or emails). Munich
        respondents map to Oberbayern.
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
              className={c.nuts?.code === TEAM_REGION ? "is-pick" : undefined}
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
